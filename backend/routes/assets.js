const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/auth');
const router = express.Router();

// Export assets as JSON download
router.get('/export', authMiddleware, async (req, res) => {
  try {
    const { category, format = 'json' } = req.query;
    let result;
    if (category) {
      result = await pool.query(
        'SELECT * FROM assets WHERE category = $1 ORDER BY created_at DESC',
        [category]
      );
    } else {
      result = await pool.query('SELECT * FROM assets ORDER BY created_at DESC');
    }

    const filename = category ? `assets-${category}.json` : 'assets-all.json';
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.json({
      exported_at: new Date().toISOString(),
      category: category || 'all',
      count: result.rows.length,
      assets: result.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all categories with counts
router.get('/categories', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count FROM assets GROUP BY category ORDER BY category`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get assets by category with pagination
router.get('/category/:category', authMiddleware, async (req, res) => {
  try {
    const { category } = req.params;
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM assets WHERE category = $1',
      [category]
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM assets WHERE category = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [category, limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search assets
router.get('/search/:query', authMiddleware, async (req, res) => {
  try {
    const { query } = req.params;
    const result = await pool.query(
      `SELECT * FROM assets WHERE name ILIKE $1 OR description ILIKE $1 ORDER BY created_at DESC`,
      [`%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single asset
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all assets with pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
    const offset = (page - 1) * limit;

    const countResult = await pool.query('SELECT COUNT(*) FROM assets');
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      'SELECT * FROM assets ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create asset
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { category, name, description, metadata, image_prompt, ai_generated } = req.body;
    const result = await pool.query(
      `INSERT INTO assets (category, name, description, metadata, image_prompt, ai_generated)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [category, name, description, metadata || {}, image_prompt || '', ai_generated || false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update asset
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, metadata, image_prompt } = req.body;
    const result = await pool.query(
      `UPDATE assets SET name = $1, description = $2, metadata = $3, image_prompt = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [name, description, metadata || {}, image_prompt || '', req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete asset
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM assets WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted', asset: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
