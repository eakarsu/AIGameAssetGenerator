const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });

const authRoutes = require('./routes/auth');
const assetRoutes = require('./routes/assets');
const aiRoutes = require('./routes/ai');
const collectionRoutes = require('./routes/collections');

// === Batch 04 Gaps & Frontend Mounts ===
const route_gap_no_style_transfer_endpoint_apply_art = require('./routes/gap-no-style-transfer-endpoint-apply-art');
const route_gap_no_animation_generation_endpoint_rigging = require('./routes/gap-no-animation-generation-endpoint-rigging');
const route_gap_no_texture_refinement_endpoint = require('./routes/gap-no-texture-refinement-endpoint');
const route_gap_no_scene_composition_endpoint_multi_asse = require('./routes/gap-no-scene-composition-endpoint-multi-asse');
const route_gap_no_prompt_improvement_helper = require('./routes/gap-no-prompt-improvement-helper');
const route_gap_no_marketplace_for_selling_assets = require('./routes/gap-no-marketplace-for-selling-assets');
const route_gap_no_webhook_integration_for_engine_sync = require('./routes/gap-no-webhook-integration-for-engine-sync');
const route_gap_no_game_engine_export_unity_unreal = require('./routes/gap-no-game-engine-export-unity-unreal');
const route_gap_no_payment_royalty_handling = require('./routes/gap-no-payment-royalty-handling');
const route_gap_no_public_sharing_portfolio_pages = require('./routes/gap-no-public-sharing-portfolio-pages');
const route_gap_no_file_upload_pipeline_detected_beyond = require('./routes/gap-no-file-upload-pipeline-detected-beyond');
const route_gap_no_real_time_collaboration = require('./routes/gap-no-real-time-collaboration');
const app = express();
const PORT = process.env.BACKEND_PORT && process.env.BACKEND_PORT !== '3001' ? process.env.BACKEND_PORT : 3601;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/collections', collectionRoutes);

// Apply pass 5 — mechanical additive routes
app.use('/api/asset-versions', require('./routes/assetVersions'));
app.use('/api/asset-collab', require('./routes/assetComments'));
app.use('/api/style-consistency', require('./routes/styleConsistency'));
app.use('/api/engine-export', require('./routes/engineExportAdvisor'));
app.use('/api/sprite-atlas-budget', require('./routes/spriteAtlasBudget'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});


app.use('/api/gap-no-style-transfer-endpoint-apply-art', route_gap_no_style_transfer_endpoint_apply_art);
app.use('/api/gap-no-animation-generation-endpoint-rigging', route_gap_no_animation_generation_endpoint_rigging);
app.use('/api/gap-no-texture-refinement-endpoint', route_gap_no_texture_refinement_endpoint);
app.use('/api/gap-no-scene-composition-endpoint-multi-asse', route_gap_no_scene_composition_endpoint_multi_asse);
app.use('/api/gap-no-prompt-improvement-helper', route_gap_no_prompt_improvement_helper);
app.use('/api/gap-no-marketplace-for-selling-assets', route_gap_no_marketplace_for_selling_assets);
app.use('/api/gap-no-webhook-integration-for-engine-sync', route_gap_no_webhook_integration_for_engine_sync);
app.use('/api/gap-no-game-engine-export-unity-unreal', route_gap_no_game_engine_export_unity_unreal);
app.use('/api/gap-no-payment-royalty-handling', route_gap_no_payment_royalty_handling);
app.use('/api/gap-no-public-sharing-portfolio-pages', route_gap_no_public_sharing_portfolio_pages);
app.use('/api/gap-no-file-upload-pipeline-detected-beyond', route_gap_no_file_upload_pipeline_detected_beyond);
app.use('/api/gap-no-real-time-collaboration', route_gap_no_real_time_collaboration);

// Custom Views — mounted BEFORE any 404 handler.
app.use('/api/custom-views', require('./routes/customViews'));

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
