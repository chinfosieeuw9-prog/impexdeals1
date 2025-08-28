const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function testDb() {
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users LIMIT 1');
    console.log('Database connectie OK:', result.rows);
  } catch (error) {
    console.error('Database connectie fout:', error);
  } finally {
    await pool.end();
  }
}

testDb();
