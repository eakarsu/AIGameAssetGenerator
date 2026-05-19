/*
 * routes/assetComments.js — Comments / sharing on assets.
 *
 * Pass 5 mechanical addition: addresses backlog item "Comments / sharing on
 * assets". Two additive tables (asset_comments, asset_shares) with explicit
 * scope (read|comment|edit). Existing assets.js untouched.
 */

const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

const SCOPES = ['read', 'comment', 'edit'];

let _ensured = false;
async function ensureTables() {
  if (_ensured) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS asset_comments (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      parent_comment_id INTEGER,
      body TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_asset_comments_asset ON asset_comments(asset_id);
    CREATE TABLE IF NOT EXISTS asset_shares (
      id SERIAL PRIMARY KEY,
      asset_id INTEGER NOT NULL,
      owner_user_id INTEGER NOT NULL,
      shared_with_user_id INTEGER NOT NULL,
      scope TEXT NOT NULL DEFAULT 'read',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (asset_id, shared_with_user_id)
    );
  `);
  _ensured = true;
}
router.use(async (req, res, next) => { try { await ensureTables(); next(); } catch (e) { res.status(500).json({ error: e.message }); } });

// ---- comments ----
router.get('/:assetId/comments', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM asset_comments WHERE asset_id=$1 ORDER BY created_at ASC`,
      [req.params.assetId]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:assetId/comments', auth, async (req, res) => {
  try {
    const { body, parent_comment_id = null } = req.body || {};
    if (!body) return res.status(400).json({ error: 'body required' });
    const r = await pool.query(
      `INSERT INTO asset_comments (asset_id, user_id, parent_comment_id, body) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.assetId, req.user.id, parent_comment_id, body]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/comments/:commentId', auth, async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM asset_comments WHERE id=$1 AND user_id=$2`, [req.params.commentId, req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---- sharing ----
router.get('/:assetId/shares', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM asset_shares WHERE asset_id=$1 AND (owner_user_id=$2 OR shared_with_user_id=$2)`,
      [req.params.assetId, req.user.id]
    );
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/:assetId/shares', auth, async (req, res) => {
  try {
    const { shared_with_user_id, scope = 'read' } = req.body || {};
    if (!shared_with_user_id) return res.status(400).json({ error: 'shared_with_user_id required' });
    if (!SCOPES.includes(scope)) return res.status(400).json({ error: `scope must be one of ${SCOPES.join(', ')}` });
    const r = await pool.query(
      `INSERT INTO asset_shares (asset_id, owner_user_id, shared_with_user_id, scope) VALUES ($1,$2,$3,$4)
       ON CONFLICT (asset_id, shared_with_user_id) DO UPDATE SET scope=EXCLUDED.scope RETURNING *`,
      [req.params.assetId, req.user.id, shared_with_user_id, scope]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/shares/:shareId', auth, async (req, res) => {
  try {
    const r = await pool.query(`DELETE FROM asset_shares WHERE id=$1 AND owner_user_id=$2`, [req.params.shareId, req.user.id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
