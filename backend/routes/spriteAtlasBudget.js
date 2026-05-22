const router = require('express').Router();

router.post('/check', (req, res) => {
  const { sprites = 0, avgWidth = 128, avgHeight = 128, framesPerSprite = 1, targetAtlas = 2048 } = req.body || {};
  const totalPixels = (Number(sprites) || 0) * (Number(avgWidth) || 0) * (Number(avgHeight) || 0) * (Number(framesPerSprite) || 1);
  const atlasPixels = (Number(targetAtlas) || 2048) ** 2;
  const atlasesNeeded = Math.max(1, Math.ceil(totalPixels / atlasPixels));
  const utilization = Math.round(Math.min(100, (totalPixels / (atlasPixels * atlasesNeeded)) * 100));
  const overBudget = atlasesNeeded > 1 || utilization > 88;
  res.json({
    feature: 'sprite_atlas_budget',
    atlasesNeeded,
    utilization,
    status: overBudget ? 'optimize' : 'ready',
    actions: overBudget
      ? ['Trim transparent padding before export.', 'Group animation frames by character and resolution tier.', 'Move large VFX sheets into a separate runtime atlas.']
      : ['Atlas budget is acceptable for the selected target size.'],
  });
});

module.exports = router;
