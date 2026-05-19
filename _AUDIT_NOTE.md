# Audit Apply Notes — AIGameAssetGenerator

Audit source: `_AUDIT/reports/batch_04.md` (#8). Verdict: template-clone (4 routes, 3 AI endpoints).

## Original recommendations

Missing AI counterparts:
- `/style-transfer`
- `/animation-generation` (needs vision/animation model — out of mechanical scope)
- `/texture-refinement` (needs image model)
- `/scene-composition`

## Implementations applied

Added two AI endpoints (text-only, no image SDK):

1. `POST /api/ai/style-transfer` — given an existing asset_id (or a base_description) and a target style, returns palette / silhouette / lighting notes plus a prompt seed for Stable Diffusion / Midjourney.
2. `POST /api/ai/scene-composition` — accepts asset_ids + scene_brief, returns placement (xyz/rotation/scale), lighting, atmosphere, audio, gameplay beats, and an image-gen prompt.

Both use a small `callOpenRouterText` wrapper that mirrors existing `generateSingleAsset` style. Syntax-checked.

## Backlog (prioritized)

### Mechanical
- Asset versioning / branching schema.
- Comments / sharing on assets.

### Needs creds / external
- `/animation-generation` — needs animation model (Mixamo, AnimateAnything).
- `/texture-refinement` — needs image-gen API (Stable Diffusion XL, Adobe Firefly).
- Game-engine export plugins (Unity / Unreal).

### Needs product decision
- Marketplace / licensing model.
- Plagiarism / derivative-asset detection.

### Custom features
- Agentic asset pipeline (game-design-doc → asset spec).
- Style consistency enforcer.
- Animation retargeting.

## Apply pass 4 (mechanical backlog)

- Verdict: **LEFT-AS-IS**.
- The two MECHANICAL items remaining (asset versioning / branching schema; comments / sharing on assets) are CRUD/data-model features, not AI-LLM endpoints. This pass only scopes mechanical *AI-using* features (BE endpoint via existing LLM helper + FE form), so they fall outside the spec.
- All other backlog items are NEEDS-CREDS, NEEDS-PRODUCT-DECISION, or custom features.
- No BE / FE changes.

## Apply pass 3 (frontend)

- Verdict: **LEFT-AS-IS**.
- Stack: React+Vite. `App.jsx` reads token from `localStorage.getItem('token')` and provides an `apiFetch` helper that sets `Authorization: Bearer ${token}`; 4xx/5xx (incl. 503-no-key) bubble up as thrown errors with the backend's `error` message.
- `pages/AIToolsPage.jsx` already exposes UI tabs that call `POST /api/ai/style-transfer` and `POST /api/ai/scene-composition` (the two endpoints added in apply pass 2). Route `/ai-tools` is registered in `App.jsx`.
- No FE changes were needed (idempotent skip).
