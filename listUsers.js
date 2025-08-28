
require('dotenv').config();
const pool = require('./db');

(async function listUsers() {
  try {
    const result = await pool.query('SELECT id, username, email, role, password FROM users');
    if (result.rows.length === 0) {
      console.log('Geen users gevonden in de database.');
    } else {
      console.log('Users in de database:');
      console.table(result.rows);
    }
  } catch (err) {
    console.error('Database fout:', err);
  } finally {
    await pool.end();
    process.exit();
  }
})();


