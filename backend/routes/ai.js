const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const router = express.Router();

const CATEGORY_PROMPTS = {
  characters: {
    label: 'Game Character',
    prompt: `Generate a unique game character. Return JSON with: name, class, race, level (1-100), hp, mp, strength, dexterity, intelligence, charisma, backstory (2-3 sentences), special_ability, weakness, alignment (e.g. "Chaotic Good"), appearance (1-2 sentences).`
  },
  weapons: {
    label: 'Weapon',
    prompt: `Generate a unique game weapon. Return JSON with: name, type (sword/bow/staff/axe/dagger/etc), damage_min, damage_max, rarity (Common/Uncommon/Rare/Epic/Legendary), element (Fire/Ice/Lightning/Dark/Holy/None), weight, durability, special_effect, lore (2-3 sentences), crafting_materials (array of 3 items).`
  },
  environments: {
    label: 'Game Environment',
    prompt: `Generate a unique game environment/map area. Return JSON with: name, biome (forest/desert/tundra/volcanic/underwater/sky/cave/urban/etc), danger_level (1-10), description (2-3 sentences), weather, time_of_day, hidden_secrets (array of 2 items), enemy_types (array of 3), resources (array of 3), ambient_sounds (array of 2).`
  },
  items: {
    label: 'Game Item',
    prompt: `Generate a unique game inventory item. Return JSON with: name, type (potion/scroll/gem/food/tool/key/etc), rarity (Common/Uncommon/Rare/Epic/Legendary), weight, value_gold, stackable (boolean), description (1-2 sentences), effect, duration, cooldown.`
  },
  monsters: {
    label: 'Monster',
    prompt: `Generate a unique game monster/enemy. Return JSON with: name, type (beast/undead/demon/dragon/elemental/construct/etc), level (1-100), hp, attack, defense, speed, weakness, resistance, description (2-3 sentences), drops (array of 3 items), special_attack, habitat.`
  },
  npcs: {
    label: 'NPC',
    prompt: `Generate a unique NPC. Return JSON with: name, role (merchant/blacksmith/healer/guard/scholar/innkeeper/etc), race, age, personality (1-2 sentences), greeting_dialogue, quest_dialogue, farewell_dialogue, inventory (array of 3 items they sell/trade), secret (1 sentence), location.`
  },
  quests: {
    label: 'Quest',
    prompt: `Generate a unique game quest. Return JSON with: name, type (main/side/daily/escort/fetch/kill/explore/etc), difficulty (Easy/Medium/Hard/Legendary), description (2-3 sentences), objectives (array of 3), rewards_gold, rewards_xp, rewards_items (array of 2), time_limit, prerequisites, plot_twist.`
  },
  spells: {
    label: 'Spell',
    prompt: `Generate a unique magic spell. Return JSON with: name, school (fire/ice/lightning/healing/necromancy/illusion/summoning/etc), level (1-10), mana_cost, damage_or_heal, cast_time, cooldown, range, area_of_effect, description (2-3 sentences), visual_effect (1 sentence), side_effect.`
  },
  armor: {
    label: 'Armor',
    prompt: `Generate a unique armor piece. Return JSON with: name, type (helmet/chestplate/gauntlets/boots/shield/cloak/etc), defense, weight, rarity (Common/Uncommon/Rare/Epic/Legendary), material, set_name, set_bonus, special_effect, durability, description (2-3 sentences), appearance (1 sentence).`
  },
  vehicles: {
    label: 'Vehicle',
    prompt: `Generate a unique game vehicle/mount. Return JSON with: name, type (horse/dragon/airship/boat/mech/carpet/etc), speed, health, capacity, fuel_type, special_ability, terrain (land/water/air/all), description (2-3 sentences), rarity (Common/Uncommon/Rare/Epic/Legendary), cost_gold.`
  },
  sound_effects: {
    label: 'Sound Effect',
    prompt: `Generate a unique game sound effect description. Return JSON with: name, category (combat/ambient/ui/music/creature/environment/magic/etc), description (2-3 sentences), trigger_event, duration_seconds, pitch (low/medium/high), volume (soft/medium/loud), layers (array of 3 audio components), mood, technical_notes.`
  },
  textures: {
    label: 'Texture',
    prompt: `Generate a unique game texture/material description. Return JSON with: name, type (stone/wood/metal/fabric/organic/magical/crystal/etc), resolution, tiling (seamless/directional/unique), color_palette (array of 3 hex colors), roughness (0-1), metallic (0-1), normal_intensity, description (2-3 sentences), use_cases (array of 3), shader_notes.`
  },
  ui_elements: {
    label: 'UI Element',
    prompt: `Generate a unique game UI element design. Return JSON with: name, type (button/panel/healthbar/minimap/inventory_slot/tooltip/dialog_box/etc), style (fantasy/sci-fi/minimalist/retro/etc), width, height, color_scheme (array of 3 hex colors), animation (1 sentence), interaction, states (array of 3 e.g. normal/hover/active), description (2-3 sentences), accessibility_notes.`
  },
  lore: {
    label: 'Lore Entry',
    prompt: `Generate a unique game lore/world-building entry. Return JSON with: name, type (history/legend/prophecy/faction/religion/geography/etc), era, region, content (3-4 sentences of lore), key_figures (array of 2 names), related_events (array of 2), artifacts_mentioned (array of 1-2), cultural_significance (1 sentence), mystery (1 sentence about unresolved element).`
  },
  animations: {
    label: 'Animation',
    prompt: `Generate a unique game animation description. Return JSON with: name, type (attack/idle/walk/run/cast/death/emote/etc), target (character/creature/environment/ui/etc), frame_count, duration_seconds, loop (boolean), description (2-3 sentences), keyframes (array of 3 key moments), blend_transitions (array of 2), particles (1 sentence), sound_sync.`
  }
};

function sanitizePrompt(input) {
  if (!input || typeof input !== 'string') return input;
  // Strip HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');
  // Strip script tags (case-insensitive)
  cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  // Strip dangerous SQL keywords
  cleaned = cleaned.replace(/\b(DROP|DELETE|INSERT|UPDATE|TRUNCATE|ALTER|CREATE|EXEC|EXECUTE|UNION|SELECT)\b/gi, '');
  return cleaned.trim();
}

async function generateSingleAsset(category, customPrompt) {
  const categoryConfig = CATEGORY_PROMPTS[category];
  const prompt = sanitizePrompt(customPrompt) || categoryConfig.prompt;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'AI Game Asset Generator'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        {
          role: 'system',
          content: 'You are a creative game designer AI. Generate unique, imaginative game assets. Always respond with valid JSON only, no markdown formatting or code blocks.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 2048
    })
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'OpenRouter API error');
  }

  const aiContent = data.choices?.[0]?.message?.content;
  if (!aiContent) {
    throw new Error('No response from AI');
  }

  let parsed;
  try {
    const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    return { raw_response: aiContent, category, parsed: false, error: 'Could not parse AI response as JSON' };
  }

  const assetName = parsed.name || `AI Generated ${categoryConfig.label}`;
  const description = parsed.description || parsed.content || parsed.backstory || JSON.stringify(parsed).substring(0, 200);

  const pool = require('../db');
  const result = await pool.query(
    `INSERT INTO assets (category, name, description, metadata, ai_generated)
     VALUES ($1, $2, $3, $4, true) RETURNING *`,
    [category, assetName, description, parsed]
  );

  return {
    asset: result.rows[0],
    ai_response: parsed,
    category,
    parsed: true
  };
}

// Generate asset with AI
router.post('/generate/:category', authMiddleware, aiRateLimiter, async (req, res) => {
  const { category } = req.params;
  const { customPrompt } = req.body;

  const categoryConfig = CATEGORY_PROMPTS[category];
  if (!categoryConfig) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const result = await generateSingleAsset(category, customPrompt);
    if (result.error && !result.asset) {
      return res.json(result);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Batch generation
router.post('/generate-batch', authMiddleware, aiRateLimiter, async (req, res) => {
  const { category, count = 1, customPrompt } = req.body;

  if (!CATEGORY_PROMPTS[category]) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  const batchCount = Math.min(Math.max(parseInt(count) || 1, 1), 5);

  try {
    const generated = [];
    for (let i = 0; i < batchCount; i++) {
      try {
        const result = await generateSingleAsset(category, customPrompt);
        generated.push(result);
      } catch (err) {
        generated.push({ error: err.message, index: i });
      }
    }

    res.json({ generated, count: generated.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get category config
router.get('/categories', authMiddleware, (req, res) => {
  const categories = Object.entries(CATEGORY_PROMPTS).map(([key, val]) => ({
    key,
    label: val.label
  }));
  res.json(categories);
});

// ---- Generic helper to call OpenRouter for arbitrary text generation ----
async function callOpenRouterText({ system, user, temperature = 0.7, maxTokens = 1500 }) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3001',
      'X-Title': 'AI Game Asset Generator',
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      temperature,
      max_tokens: maxTokens,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message || 'OpenRouter error');
  return data.choices?.[0]?.message?.content || '';
}

function tryParseJson(text) {
  if (!text) return null;
  const cleaned = String(text).replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try { return JSON.parse(cleaned); } catch (e) { /* fall through */ }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try { return JSON.parse(cleaned.slice(start, end + 1)); } catch (e) { /* ignore */ }
  }
  return null;
}

// POST /api/ai/style-transfer — describe how to repaint an existing asset in a target style
router.post('/style-transfer', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { asset_id, target_style, base_description } = req.body || {};
    if (!target_style) {
      return res.status(400).json({ error: 'target_style is required' });
    }

    let asset = null;
    if (asset_id) {
      const r = await pool.query('SELECT * FROM assets WHERE id = $1', [asset_id]);
      asset = r.rows[0] || null;
    }
    const description = base_description || asset?.description || (asset?.metadata ? JSON.stringify(asset.metadata) : '');
    if (!description) {
      return res.status(400).json({ error: 'asset_id (with stored description) or base_description required' });
    }

    const system = 'You are an art director for video games. You translate an existing asset description into a new target art style by describing palette, silhouette, line work, materials, lighting, and any motif changes. Return STRICT JSON only.';
    const user = `Existing asset description:
${description}

Target style: ${target_style} (e.g., "low-poly PS1", "ghibli watercolor", "cyberpunk neon", "pixel art 32x32", etc.)

Return JSON:
{
  "summary": "1-2 sentences",
  "palette": ["#hex", "#hex", "..."],
  "silhouette_notes": "string",
  "line_and_shading": "string",
  "materials": ["..."],
  "lighting": "string",
  "motif_changes": ["..."],
  "tips_for_image_gen": "concise prompt to feed Stable Diffusion / Midjourney to render this",
  "disclaimer": "Style guidance; verify with concept artists."
}`;
    const content = await callOpenRouterText({ system, user, temperature: 0.6 });
    const parsed = tryParseJson(content);

    res.json({ asset_id, target_style, ai_response: parsed || { raw: content }, parsed: !!parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/scene-composition — assemble multiple existing assets into a scene
router.post('/scene-composition', authMiddleware, aiRateLimiter, async (req, res) => {
  try {
    const { asset_ids = [], scene_brief = '', perspective = '3d-isometric' } = req.body || {};
    if (asset_ids.length === 0 && !scene_brief) {
      return res.status(400).json({ error: 'asset_ids array or scene_brief required' });
    }

    let assets = [];
    if (asset_ids.length > 0) {
      const r = await pool.query('SELECT id, category, name, description, metadata FROM assets WHERE id = ANY($1::int[])', [asset_ids]);
      assets = r.rows;
    }

    const system = 'You are a game level designer. Compose multiple assets into a coherent scene with placement, scale, lighting, and gameplay flow. Return STRICT JSON only.';
    const user = `Assets in scene:
${JSON.stringify(assets, null, 2)}

Scene brief: ${scene_brief || 'A short, evocative gameplay scene appropriate for the supplied assets.'}
Perspective: ${perspective}

Return JSON:
{
  "scene_name": "string",
  "summary": "string",
  "placement": [
    { "asset_id": 0, "name": "string", "position_xyz": [0,0,0], "rotation_deg": 0, "scale": 1.0, "role": "string" }
  ],
  "lighting": "string",
  "atmosphere": "string",
  "audio": ["..."],
  "gameplay_beats": ["..."],
  "image_gen_prompt": "string",
  "disclaimer": "Suggestions only."
}`;
    const content = await callOpenRouterText({ system, user, temperature: 0.7 });
    const parsed = tryParseJson(content);

    res.json({ asset_ids, scene_brief, ai_response: parsed || { raw: content }, parsed: !!parsed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
