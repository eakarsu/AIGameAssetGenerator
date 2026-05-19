// Style consistency enforcer flagging outliers and suggesting regenerations
// to maintain visual identity.
// Audit: batch_04.md / AIGameAssetGenerator / Custom Feature Suggestions #2
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
      'X-Title': 'AI Game Asset - Style Consistency'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
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

// POST /api/style-consistency/audit { collection_id? , style_guide? }
router.post('/audit', aiRateLimiter, async (req, res) => {
  try {
    const { collection_id, style_guide } = req.body || {};

    let assets = [];
    try {
      const where = collection_id ? 'WHERE collection_id = $1' : '';
      const params = collection_id ? [collection_id] : [];
      const r = await pool.query(
        `SELECT id, name, category, metadata, prompt FROM assets ${where} ORDER BY id DESC LIMIT 50`,
        params
      );
      assets = r.rows;
    } catch (_) {}

    const systemPrompt = `You are a game-asset art director enforcing style consistency. Given a set of assets
(with metadata + generation prompts) and an optional style guide, identify outliers, common stylistic anchors,
and recommend regenerations. Return STRICT JSON only.`;

    const userPrompt = `Style guide: ${style_guide || '(infer dominant style from set)'}
Assets (n=${assets.length}): ${JSON.stringify(assets.slice(0, 30))}

Return JSON:
{
  "summary": "...",
  "dominant_style_descriptors": ["..."],
  "outliers": [{ "asset_id": 0, "name": "string", "issue": "string", "regeneration_prompt_hint": "string" }],
  "style_guide_recommendation": { "color_palette": ["..."], "rendering_style": "string", "iconography": "string", "must_have": ["..."], "avoid": ["..."] },
  "ok_assets_count": 0,
  "outlier_count": 0,
  "disclaimer": "AI-assisted style review; art director final approval recommended."
}`;

    const raw = await callOpenRouter(systemPrompt, userPrompt);
    res.json({ collection_id: collection_id || null, audit: parseJSON(raw) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/style-consistency/collections - list collections for the UI
router.get('/collections', async (_req, res) => {
  try {
    const r = await pool.query(`SELECT id, name FROM collections ORDER BY id DESC LIMIT 50`)
      .catch(() => ({ rows: [] }));
    res.json(r.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
