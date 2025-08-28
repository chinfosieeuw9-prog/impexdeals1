import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
    }
    // Zoek gebruiker op
    const result = await pool.query('SELECT id, username, password, role FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }
    const user = result.rows[0];
    // Vergelijk wachtwoord (plain text, voor demo; gebruik bcrypt in productie!)
    if (user.password !== password) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    // Login succesvol
    return NextResponse.json({ id: user.id, username: user.username, role: user.role });
  } catch (error: unknown) {
    console.log('API /login error:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Unknown error' }, { status: 500 });
  }
}
{
  "username": "admin",
  "password": "admin123"
}