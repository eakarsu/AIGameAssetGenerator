const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
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

// Generate asset with AI
router.post('/generate/:category', authMiddleware, async (req, res) => {
  const { category } = req.params;
  const { customPrompt } = req.body;

  const categoryConfig = CATEGORY_PROMPTS[category];
  if (!categoryConfig) {
    return res.status(400).json({ error: 'Invalid category' });
  }

  try {
    const prompt = customPrompt || categoryConfig.prompt;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'AI Game Asset Generator'
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5',
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
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || 'OpenRouter API error' });
    }

    const aiContent = data.choices?.[0]?.message?.content;
    if (!aiContent) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    // Parse the AI response
    let parsed;
    try {
      // Remove markdown code blocks if present
      const cleaned = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.json({
        raw_response: aiContent,
        category,
        parsed: false,
        error: 'Could not parse AI response as JSON'
      });
    }

    // Save to database
    const assetName = parsed.name || `AI Generated ${categoryConfig.label}`;
    const description = parsed.description || parsed.content || parsed.backstory || JSON.stringify(parsed).substring(0, 200);

    const result = await pool.query(
      `INSERT INTO assets (category, name, description, metadata, ai_generated)
       VALUES ($1, $2, $3, $4, true) RETURNING *`,
      [category, assetName, description, parsed]
    );

    res.json({
      asset: result.rows[0],
      ai_response: parsed,
      category,
      parsed: true
    });
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

module.exports = router;
