require('dotenv').config({ path: '../.env' });
const pool = require('./db');

const title = (category) => category
  .split('_')
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

async function seedChecklistCollections() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const preferredEmail = process.env.DEMO_EMAIL || 'demo@game.com';
    const user = await client.query('SELECT id FROM users WHERE email = $1', [preferredEmail]);
    if (user.rows.length !== 1) {
      throw new Error('The configured demo account was not found; no checklist collections were added.');
    }

    const categories = await client.query(`
      SELECT category, COUNT(*)::int AS asset_count
      FROM assets
      GROUP BY category
      HAVING COUNT(*) >= 15
      ORDER BY category
    `);
    if (categories.rows.length < 15) {
      throw new Error('At least 15 populated asset categories are required; no checklist collections were added.');
    }

    for (const { category } of categories.rows.slice(0, 15)) {
      const name = `Demo Asset Set · ${title(category)}`;
      const description = `Fictional demo collection containing the existing ${title(category).toLowerCase()} assets for review.`;
      const collection = await client.query(`
        INSERT INTO collections (user_id, name, description)
        SELECT $1, $2, $3
        WHERE NOT EXISTS (
          SELECT 1 FROM collections WHERE user_id = $1 AND name = $2
        )
        RETURNING id
      `, [user.rows[0].id, name, description]);
      const collectionId = collection.rows[0]?.id || (await client.query(
        'SELECT id FROM collections WHERE user_id = $1 AND name = $2',
        [user.rows[0].id, name]
      )).rows[0].id;
      await client.query(`
        INSERT INTO collection_assets (collection_id, asset_id)
        SELECT $1, id FROM assets WHERE category = $2 ORDER BY id LIMIT 15
        ON CONFLICT DO NOTHING
      `, [collectionId, category]);
    }

    await client.query('COMMIT');
    const verified = await client.query(`
      SELECT COUNT(*)::int AS collection_count,
             COALESCE(MIN(asset_count), 0)::int AS minimum_assets
      FROM (
        SELECT c.id, COUNT(ca.asset_id)::int AS asset_count
        FROM collections c
        LEFT JOIN collection_assets ca ON ca.collection_id = c.id
        WHERE c.user_id = $1 AND c.name LIKE 'Demo Asset Set · %'
        GROUP BY c.id
      ) checklist_collections
    `, [user.rows[0].id]);
    console.log(JSON.stringify(verified.rows[0]));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedChecklistCollections().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
