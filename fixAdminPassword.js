
require('dotenv').config();
const pool = require('./db');
const bcrypt = require('bcryptjs');

(async function fixAdminPassword() {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query("UPDATE users SET password = $1 WHERE username = 'admin'", [hash]);
    console.log("Admin-wachtwoord opnieuw gehasht en opgeslagen.");
  } catch (err) {
    console.error('Database fout:', err);
  } finally {
    await pool.end();
    process.exit();
  }
})();
