import { NextResponse } from 'next/server';

export async function POST(request: Request) {
	const body = await request.json();
	const { username, password } = body;

	// Simpele hardcoded check
	if (username === 'admin' && password === 'admin123') {
		return NextResponse.json({ success: true, message: 'Login gelukt!' });
	} else {
		return NextResponse.json({ success: false, message: 'Ongeldige inloggegevens.' }, { status: 401 });
	}
}
