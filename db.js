const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'impexdeals'
});

connection.connect((err) => {
  if (err) {
    console.error('Fout bij verbinden:', err);
  } else {
  console.log('Verbonden met MySQL (impexdeals)!');
  }
});

module.exports = connection;