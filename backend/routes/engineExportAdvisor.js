// Unity/Unreal export plugin with correct PBR materials and collision meshes
// (advisor + export-manifest generator).
// Audit: batch_04.md / AIGameAssetGenerator / Custom Feature Suggestions #6
const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();
router.use(authMiddleware);

async function callOpenRouter(systemPrompt, userPrompt) {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'AI Game Asset - Engine Export Advisor'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.2,
      max_tokens: 2500
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message || 'AI failed');
  return d.choices[0].message.content;
}

function parseJSON(text) {
  try { const m = text.match(/\{[\s\S]*\}/); if (m) return JSON.parse(m[0]); } catch (_) {}
  return { notes: text };
}

// POST /api/engine-export/advise { asset_id, engine: 'unity'|'unreal', platform?: 'pc'|'mobile'|'console' }
router.post('/advise', aiRateLimiter, async (req, res) => {
  try {
    const { asset_id, engine = 'unity', platform = 'pc' } = req.body || {};
    if (!asset_id) return res.status(400).json({ error: 'asset_id required' });

    let asset = null;
    try {
      const r = await pool.query(`SELECT * FROM assets WHERE id = $1`, [asset_id]);
      asset = r.rows[0] || null;
    } catch (_) {}
    if (!asset) return res.status(404).json({ error: 'asset not found' });

    const systemPrompt = `You are a senior technical artist generating engine-specific export manifests. Produce
PBR material settings, collision-mesh recommendations, LOD chains, and import settings tailored to the target
engine and platform. Return STRICT JSON only.`;

    const userPrompt = `Asset: ${JSON.stringify({ id: asset.id, name: asset.name, category: asset.category, metadata: asset.metadata })}
Engine: ${engine}
Platform: ${platform}

Return JSON:
{
  "summary": "...",
  "import_settings": { "scale_factor": 1.0, "axis_conversion": "string", "uv_channels": 1, "tangents": "string" },
  "pbr_material": {
    "shader": "string",
    "base_color_map": "string",
    "metallic_roughness_map": "string",
    "normal_map": "string",
    "ao_map": "string",
    "emissive_map": "string",
    "transparency": "opaque|cutout|blend"
  },
  "collision": { "type": "convex|trimesh|primitive_box|primitive_sphere|primitive_capsule", "rationale": "string" },
  "lod_chain": [{ "lod": 0, "polycount_target": 0, "screen_size_threshold": 0 }],
  "platform_notes": ["..."],
  "manifest_file_suggestion": { "filename": "string", "format": "fbx|gltf|usd", "channels": ["..."] },
  "warnings": ["..."],
  "disclaimer": "Settings are recommended baselines; verify in-engine."
}`;

    const raw = await callOpenRouter(systemPrompt, userPrompt);
    const parsed = parseJSON(raw);

    try {
      await pool.query(
        `CREATE TABLE IF NOT EXISTS engine_export_advice (
          id SERIAL PRIMARY KEY, asset_id INTEGER, engine TEXT, platform TEXT,
          payload JSONB, created_at TIMESTAMPTZ DEFAULT NOW()
        )`
      );
      await pool.query(
        `INSERT INTO engine_export_advice (asset_id, engine, platform, payload)
         VALUES ($1,$2,$3,$4)`,
        [asset_id, engine, platform, JSON.stringify(parsed)]
      );
    } catch (_) {}

    res.json({ asset_id, engine, platform, advice: parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/engine-export/asset/:id
router.get('/asset/:id', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id, engine, platform, payload, created_at FROM engine_export_advice
       WHERE asset_id = $1 ORDER BY created_at DESC LIMIT 10`,
      [req.params.id]
    ).catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
