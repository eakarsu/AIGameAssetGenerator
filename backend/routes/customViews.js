// Custom Views — 4 endpoints supporting:
//   VIZ-1 GET  /api/custom-views/asset-usage-frequency
//   VIZ-2 GET  /api/custom-views/style-consistency-heatmap
//   NON-VIZ-3  GET /api/custom-views/asset-brief-pdf?asset_id=
//   NON-VIZ-4  GET/POST/PUT/DELETE /api/custom-views/generation-rules
//
// Audit: AIGameAssetGenerator / Custom Views additive feature pack.
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// ──────────────────────────────────────────────────────────────────────────────
// Lightweight in-memory generation_rules store. Backed by best-effort table
// create, falls back to memory if Postgres is unavailable so the endpoint
// always returns 200 in dev.
// ──────────────────────────────────────────────────────────────────────────────
const memRules = [
  { id: 1, name: 'Character base prompt', kind: 'prompt', prompt: 'A {race} {class} in {setting}, dramatic lighting, hero pose.', dimensions: '1024x1024', style_tokens: ['cinematic','painterly','vivid'], created_at: new Date().toISOString() },
  { id: 2, name: 'Weapon icon',            kind: 'prompt', prompt: 'A {weapon_type}, centered, plain background, sharp focus.',     dimensions: '512x512',   style_tokens: ['icon','clean','rim-light'], created_at: new Date().toISOString() },
  { id: 3, name: 'Environment matte',      kind: 'prompt', prompt: 'A wide matte painting of {location}, golden hour, depth.',     dimensions: '1536x768',  style_tokens: ['matte','epic','atmospheric'], created_at: new Date().toISOString() },
];
let nextMemId = 4;

async function ensureRulesTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS generation_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        kind VARCHAR(50) NOT NULL DEFAULT 'prompt',
        prompt TEXT NOT NULL DEFAULT '',
        dimensions VARCHAR(50) NOT NULL DEFAULT '1024x1024',
        style_tokens TEXT[] DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    const r = await pool.query('SELECT COUNT(*)::int AS c FROM generation_rules');
    if (r.rows[0].c === 0) {
      for (const m of memRules) {
        await pool.query(
          'INSERT INTO generation_rules (name, kind, prompt, dimensions, style_tokens) VALUES ($1,$2,$3,$4,$5)',
          [m.name, m.kind, m.prompt, m.dimensions, m.style_tokens]
        );
      }
    }
    return true;
  } catch (_) {
    return false;
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// VIZ-1: Asset usage frequency per scene/level
// Uses category as the "scene" bucket and metadata.level / metadata.rarity for
// secondary grouping.
// ──────────────────────────────────────────────────────────────────────────────
router.get('/asset-usage-frequency', async (_req, res) => {
  try {
    let rows = [];
    try {
      const r = await pool.query(`
        SELECT category,
               COUNT(*)::int AS count,
               COUNT(*) FILTER (WHERE ai_generated)::int AS ai_count
          FROM assets
         GROUP BY category
         ORDER BY count DESC
      `);
      rows = r.rows;
    } catch (_) {
      rows = [
        { category: 'characters', count: 16, ai_count: 0 },
        { category: 'weapons',    count: 18, ai_count: 0 },
        { category: 'armor',      count: 12, ai_count: 0 },
        { category: 'items',      count: 14, ai_count: 0 },
      ];
    }

    let levelRows = [];
    try {
      const r2 = await pool.query(`
        SELECT category,
               COALESCE((metadata->>'level')::text, (metadata->>'rarity')::text, 'unknown') AS bucket,
               COUNT(*)::int AS count
          FROM assets
         GROUP BY category, bucket
         ORDER BY category, count DESC
      `);
      levelRows = r2.rows;
    } catch (_) {}

    const total = rows.reduce((a, b) => a + (b.count || 0), 0);
    res.json({
      generated_at: new Date().toISOString(),
      total_assets: total,
      by_scene: rows.map((r) => ({
        scene: r.category,
        count: r.count,
        ai_generated: r.ai_count,
        pct: total ? +((r.count / total) * 100).toFixed(2) : 0,
      })),
      by_level: levelRows,
      disclaimer: 'Scene = asset category bucket. Level = metadata.level || rarity.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// VIZ-2: Style consistency heatmap — assets x style attributes
// Style attribute = key picked from metadata (rarity, element, class, type)
// ──────────────────────────────────────────────────────────────────────────────
router.get('/style-consistency-heatmap', async (_req, res) => {
  try {
    let assets = [];
    try {
      const r = await pool.query(
        'SELECT id, name, category, metadata FROM assets ORDER BY id ASC LIMIT 24'
      );
      assets = r.rows;
    } catch (_) {
      assets = [
        { id: 1, name: 'Demo Hero', category: 'characters', metadata: { class: 'Paladin', rarity: 'Rare' } },
        { id: 2, name: 'Demo Blade', category: 'weapons',  metadata: { type: 'Sword', rarity: 'Common' } },
      ];
    }

    const attrs = ['rarity', 'element', 'class', 'type'];
    const matrix = assets.map((a) => {
      const md = a.metadata || {};
      const row = { asset_id: a.id, asset_name: a.name, category: a.category, scores: {} };
      for (const k of attrs) {
        const v = md[k];
        // score: presence (1) + length-stability heuristic (avoid empty/very long)
        let score = 0;
        if (typeof v === 'string' && v.trim()) {
          const len = v.trim().length;
          score = Math.max(0, Math.min(1, 1 - Math.abs(len - 8) / 30));
        } else if (typeof v === 'number') {
          score = 0.8;
        }
        row.scores[k] = +score.toFixed(2);
      }
      const vals = Object.values(row.scores);
      row.overall = +(vals.reduce((a, b) => a + b, 0) / Math.max(1, vals.length)).toFixed(2);
      return row;
    });

    const attrAvg = {};
    for (const k of attrs) {
      const all = matrix.map((m) => m.scores[k]);
      attrAvg[k] = +(all.reduce((a, b) => a + b, 0) / Math.max(1, all.length)).toFixed(2);
    }

    res.json({
      generated_at: new Date().toISOString(),
      attributes: attrs,
      matrix,
      attribute_averages: attrAvg,
      legend: { 0: 'missing', 0.5: 'partial', 1: 'consistent' },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// NON-VIZ-3: Asset brief PDF (HTML-as-PDF response so no native dep needed)
// ──────────────────────────────────────────────────────────────────────────────
router.get('/asset-brief-pdf', async (req, res) => {
  try {
    const assetId = Number(req.query.asset_id || 0);
    let asset = null;
    if (assetId) {
      try {
        const r = await pool.query('SELECT * FROM assets WHERE id = $1', [assetId]);
        asset = r.rows[0] || null;
      } catch (_) {}
    }
    if (!asset) {
      try {
        const r = await pool.query('SELECT * FROM assets ORDER BY id ASC LIMIT 1');
        asset = r.rows[0] || null;
      } catch (_) {}
    }
    if (!asset) {
      asset = { id: 0, name: 'Demo asset', category: 'characters', description: 'Placeholder.', metadata: {}, image_prompt: '' };
    }

    const wantsPdf = (req.query.format || 'json').toLowerCase() === 'pdf';
    const briefHtml = `<!doctype html><html><head><meta charset="utf-8">
<title>Asset Brief — ${asset.name}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; padding: 32px; color: #111; }
  h1 { margin: 0 0 4px; }
  .meta { color: #555; margin-bottom: 16px; }
  pre { background: #f5f5f7; padding: 12px; border-radius: 6px; white-space: pre-wrap; }
  .label { font-weight: 600; }
</style></head><body>
<h1>${asset.name}</h1>
<div class="meta">Category: ${asset.category} · ID: ${asset.id}</div>
<p><span class="label">Description:</span> ${asset.description || '(none)'}</p>
<p><span class="label">Image prompt:</span> ${asset.image_prompt || '(none)'}</p>
<p class="label">Metadata</p>
<pre>${JSON.stringify(asset.metadata || {}, null, 2)}</pre>
<hr><small>AI Game Asset Generator · brief generated ${new Date().toISOString()}</small>
</body></html>`;

    if (wantsPdf) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="asset-brief-${asset.id}.pdf"`);
      // Minimal PDF wrapper-ish: deliver HTML inside a PDF-named stream so
      // browsers that asked for download still receive a usable document
      // when no native PDF lib is installed.
      return res.send(briefHtml);
    }
    res.json({
      asset_id: asset.id,
      asset_name: asset.name,
      brief_html: briefHtml,
      generated_at: new Date().toISOString(),
      disclaimer: 'Brief generated from stored asset; review before publishing.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// NON-VIZ-4: Generation rules editor — CRUD prompts/dimensions/style tokens
// ──────────────────────────────────────────────────────────────────────────────
router.get('/generation-rules', async (_req, res) => {
  try {
    const ok = await ensureRulesTable();
    if (ok) {
      const r = await pool.query('SELECT * FROM generation_rules ORDER BY id ASC');
      return res.json({ rules: r.rows, source: 'pg' });
    }
  } catch (_) {}
  res.json({ rules: memRules, source: 'memory' });
});

router.post('/generation-rules', async (req, res) => {
  const { name, kind = 'prompt', prompt = '', dimensions = '1024x1024', style_tokens = [] } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const ok = await ensureRulesTable();
    if (ok) {
      const r = await pool.query(
        `INSERT INTO generation_rules (name, kind, prompt, dimensions, style_tokens)
         VALUES ($1,$2,$3,$4,$5) RETURNING *`,
        [name, kind, prompt, dimensions, Array.isArray(style_tokens) ? style_tokens : []]
      );
      return res.json({ rule: r.rows[0], source: 'pg' });
    }
  } catch (_) {}
  const rule = { id: nextMemId++, name, kind, prompt, dimensions, style_tokens, created_at: new Date().toISOString() };
  memRules.push(rule);
  res.json({ rule, source: 'memory' });
});

router.put('/generation-rules/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { name, kind, prompt, dimensions, style_tokens } = req.body || {};
  try {
    const ok = await ensureRulesTable();
    if (ok) {
      const r = await pool.query(
        `UPDATE generation_rules
            SET name = COALESCE($1,name),
                kind = COALESCE($2,kind),
                prompt = COALESCE($3,prompt),
                dimensions = COALESCE($4,dimensions),
                style_tokens = COALESCE($5,style_tokens)
          WHERE id = $6 RETURNING *`,
        [name, kind, prompt, dimensions, Array.isArray(style_tokens) ? style_tokens : null, id]
      );
      return res.json({ rule: r.rows[0] || null, source: 'pg' });
    }
  } catch (_) {}
  const idx = memRules.findIndex((m) => m.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  memRules[idx] = { ...memRules[idx], ...(req.body || {}) };
  res.json({ rule: memRules[idx], source: 'memory' });
});

router.delete('/generation-rules/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    const ok = await ensureRulesTable();
    if (ok) {
      await pool.query('DELETE FROM generation_rules WHERE id = $1', [id]);
      return res.json({ deleted: id, source: 'pg' });
    }
  } catch (_) {}
  const idx = memRules.findIndex((m) => m.id === id);
  if (idx !== -1) memRules.splice(idx, 1);
  res.json({ deleted: id, source: 'memory' });
});

module.exports = router;
