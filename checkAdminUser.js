require('dotenv').config();
const pool = require('./db');

async function checkAdminUser() {
  try {
    // Pas de tabelnaam en kolomnamen aan naar jouw structuur!
    const result = await pool.query("SELECT * FROM users WHERE username = 'admin' OR email = 'admin'");
    if (result.rows.length > 0) {
      console.log('Admin gebruiker gevonden:', result.rows[0]);
    } else {
      console.log('Geen admin gebruiker gevonden.');
    }
  } catch (err) {
    console.error('Database fout:', err);
  } finally {
    pool.end();
  }
}

checkAdminUser();
