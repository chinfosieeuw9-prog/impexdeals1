const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

export default async function handler(req, res) {
  try {
    const result = await pool.query('SELECT id, username, email, role FROM users');
    res.status(200).json({ users: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}