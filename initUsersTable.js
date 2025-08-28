require('dotenv').config();
const pool = require('./db');

async function initUsersTable() {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE,
      password VARCHAR(255) NOT NULL
    );`);
    console.log('Tabel "users" aangemaakt of bestaat al.');

    // Voeg admin toe als deze nog niet bestaat
    const result = await pool.query("SELECT * FROM users WHERE username = 'admin'");
    if (result.rows.length === 0) {
      await pool.query("INSERT INTO users (username, email, password) VALUES ('admin', 'admin@example.com', 'admin123')");
      console.log('Admin gebruiker toegevoegd.');
    } else {
      console.log('Admin gebruiker bestaat al.');
    }
  } catch (err) {
    console.error('Database fout:', err);
  } finally {
    pool.end();
  }
}

initUsersTable();
