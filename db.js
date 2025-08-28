const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

pool.connect((err) => {
  if (err) {
    console.error('Fout bij verbinden:', err);
  } else {
    console.log('Verbonden met PostgreSQL (impexdeals)!');
  }
});

module.exports = pool;