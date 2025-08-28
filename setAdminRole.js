require('dotenv').config();
const pool = require('./db');

async function setAdminRole() {
  try {
    await pool.query("UPDATE users SET role='admin' WHERE username='admin'");
    console.log("Rol van gebruiker 'admin' is nu 'admin'.");
  } catch (err) {
    console.error('Database fout:', err);
  } finally {
    await pool.end();
    process.exit();
  }
}

setAdminRole();
