require('dotenv').config();
const pool = require('./db');

async function addRoleColumn() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN role VARCHAR(16) DEFAULT 'user'");
    console.log("Kolom 'role' toegevoegd aan users-tabel.");
  } catch (err) {
    console.error('Database fout:', err);
  } finally {
    await pool.end();
    process.exit();
  }
}

addRoleColumn();
