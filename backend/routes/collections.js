const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Initialize collections tables
async function initCollectionsTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collections (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      name TEXT NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS collection_assets (
      collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE,
      asset_id INTEGER REFERENCES assets(id) ON DELETE CASCADE,
      PRIMARY KEY (collection_id, asset_id)
    )
  `);
}

initCollectionsTables().catch(console.error);

// GET all collections for current user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(ca.asset_id) as asset_count
       FROM collections c
       LEFT JOIN collection_assets ca ON ca.collection_id = c.id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single collection with assets
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const colResult = await pool.query(
      'SELECT * FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (colResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    const collection = colResult.rows[0];

    const assetsResult = await pool.query(
      `SELECT a.* FROM assets a
       INNER JOIN collection_assets ca ON ca.asset_id = a.id
       WHERE ca.collection_id = $1
       ORDER BY a.created_at DESC`,
      [req.params.id]
    );
    collection.assets = assetsResult.rows;

    res.json(collection);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create collection
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const result = await pool.query(
      `INSERT INTO collections (user_id, name, description) VALUES ($1, $2, $3) RETURNING *`,
      [req.user.id, name, description || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE collection
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM collections WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    res.json({ message: 'Collection deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add asset to collection
router.post('/:id/assets', authMiddleware, async (req, res) => {
  try {
    const { assetId } = req.body;
    if (!assetId) return res.status(400).json({ error: 'assetId is required' });

    // Verify collection belongs to user
    const colResult = await pool.query(
      'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (colResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await pool.query(
      `INSERT INTO collection_assets (collection_id, asset_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [req.params.id, assetId]
    );
    res.json({ message: 'Asset added to collection' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE remove asset from collection
router.delete('/:id/assets/:assetId', authMiddleware, async (req, res) => {
  try {
    // Verify collection belongs to user
    const colResult = await pool.query(
      'SELECT id FROM collections WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (colResult.rows.length === 0) {
      return res.status(404).json({ error: 'Collection not found' });
    }

    await pool.query(
      'DELETE FROM collection_assets WHERE collection_id = $1 AND asset_id = $2',
      [req.params.id, req.params.assetId]
    );
    res.json({ message: 'Asset removed from collection' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
