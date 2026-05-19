# Apply Pass 5 — AIGameAssetGenerator
Date: 2026-05-08
Stack: Node-Express + React (Vite), Postgres `pg`.

## Verified present
- AI counterparts from passes 2–4 still in place (`/api/ai/style-transfer`, `/api/ai/scene-composition`, plus original `/generate/:category`, `/generate-batch`, `/categories`).
- Existing routes: `auth.js`, `assets.js`, `ai.js`, `collections.js`.

## Implemented this pass (2 mechanical features, 8 endpoints; additive only)
1. **Asset versioning / branching schema** — closes mechanical backlog item from `_AUDIT_NOTE.md`.
   - `backend/routes/assetVersions.js` (~85 lines): `GET/POST /api/asset-versions/:assetId`, `POST /api/asset-versions/:assetId/branch`, `DELETE /api/asset-versions/version/:versionId`. Auto-incrementing `version_number` per `(asset_id, branch_name)`. `CREATE TABLE IF NOT EXISTS asset_versions`.
2. **Comments / sharing on assets** — closes mechanical backlog item.
   - `backend/routes/assetComments.js` (~105 lines): comment CRUD + share with explicit scope (`read`|`comment`|`edit`). `CREATE TABLE IF NOT EXISTS asset_comments`, `asset_shares`.
3. **Frontend** — `frontend/src/pages/AssetCollabPage.jsx` registered at `/asset-collab` in `frontend/src/App.jsx`.
4. Wired both routers in `backend/server.js` (lines beneath existing `/api/collections` registration).

## Deferred
- **`/animation-generation`** — NEEDS-CREDS (Mixamo / animation-model API).
- **`/texture-refinement`** — NEEDS-CREDS (Stable Diffusion XL / Adobe Firefly image API).
- **Game-engine export plugins (Unity / Unreal)** — OUT-OF-SCOPE (require native toolchain).
- **Marketplace / licensing model** — NEEDS-PRODUCT-DECISION + payment infra.
- **Plagiarism / derivative-asset detection** — NEEDS-CREDS (image-embedding service) + NEEDS-PRODUCT-DECISION.
- **Agentic asset pipeline, style-consistency enforcer, animation retargeting** — NEEDS-PRODUCT-DECISION (workflow definition + multi-step orchestration).

## Smoke test
- `node -c` on `assetVersions.js`, `assetComments.js`, `server.js` — PASS.
- Did not boot (requires Postgres). DDL idempotent; tables created on first request.
