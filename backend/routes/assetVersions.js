/*
 * routes/assetVersions.js — Asset versioning / branching.
 *
 * Pass 5 mechanical addition: addresses backlog item "Asset versioning /
 * branching schema". Pure additive table (CREATE TABLE IF NOT EXISTS), JWT
 * auth via existing middleware. Existing assets.js is untouched.
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

let _ensured = false;
async function ensureTable() {
  if (_ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS asset_versions (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      version_number INTEGER NOT NULL,
      branch_name TEXT DEFAULT 'main',
      parent_version_id INTEGER,
      changelog TEXT,
      payload JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (asset_id, branch_name, version_number)
    );
    CREATE INDEX IF NOT EXISTS idx_asset_versions_asset ON asset_versions(asset_id);
  `);
  _ensured = true;
}
router.use(async (req, res, next) => { try { await ensureTable(); next(); } catch (e) { res.status(500).json({ error: e.message }); } });

// List versions for an asset (optional branch filter)
router.get('/:assetId', auth, async (req, res) => {
  try {
    const { branch } = req.query;
    const params = [req.params.assetId, req.user.id];
    let sql = `SELECT * FROM asset_versions WHERE asset_id=$1 AND user_id=$2`;
    if (branch) { params.push(branch); sql += ` AND branch_name=$${params.length}`; }
    sql += ` ORDER BY branch_name ASC, version_number DESC`;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Create new version (auto-increments per branch)
router.post('/:assetId', auth, async (req, res) => {
  try {
    const { branch_name = 'main', parent_version_id = null, changelog = null, payload = null } = req.body || {};
    const last = await pool.query(
      `SELECT MAX(version_number) AS v FROM asset_versions WHERE asset_id=$1 AND branch_name=$2 AND user_id=$3`,
      [req.params.assetId, branch_name, req.user.id]
    );
    const next = (last.rows[0]?.v || 0) + 1;
    const r = await pool.query(
      `INSERT INTO asset_versions (asset_id, user_id, version_number, branch_name, parent_version_id, changelog, payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.assetId, req.user.id, next, branch_name, parent_version_id, changelog, payload]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Branch: create a new branch from an existing version
router.post('/:assetId/branch', auth, async (req, res) => {
  try {
    const { from_version_id, new_branch_name, changelog = null } = req.body || {};
    if (!from_version_id || !new_branch_name) return res.status(400).json({ error: 'from_version_id and new_branch_name required' });
    const src = await pool.query(`SELECT * FROM asset_versions WHERE id=$1 AND user_id=$2`, [from_version_id, req.user.id]);
    if (src.rowCount === 0) return res.status(404).json({ error: 'source version not found' });
    const r = await pool.query(
      `INSERT INTO asset_versions (asset_id, user_id, version_number, branch_name, parent_version_id, changelog, payload)
       VALUES ($1,$2,1,$3,$4,$5,$6) RETURNING *`,
      [req.params.assetId, req.user.id, new_branch_name, src.rows[0].id, changelog || `Branched from v${src.rows[0].version_number}`, src.rows[0].payload]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/version/:versionId', auth, async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM asset_versions WHERE id=$1 AND user_id=$2`, [req.params.versionId, req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
