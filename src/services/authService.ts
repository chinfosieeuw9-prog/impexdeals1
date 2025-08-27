import { apiFetch } from './apiClient';
export type Role = 'admin' | 'user';
export interface User {
	id: number;
	username: string;
	email: string;
	role: Role;
	canUpload?: boolean;
	disabled?: boolean;
	mustChange?: boolean;
}

interface CredentialRecord extends User { password: string; }

// Demo credential store (would be API calls in real app)
const seedUsers: CredentialRecord[] = [
	{ id:1, username:'admin', email:'admin@example.com', role:'admin', password:'admin123', canUpload:true },
	{ id:2, username:'demo', email:'demo@example.com', role:'user', password:'demo123', canUpload:true },
];

const LS_KEY = 'auth_current_user_v1';
const TOKEN_KEY = 'auth_token_v1';

let currentUser: User | null = null;
let authToken: string | null = null;
// Try restore
try { const raw = localStorage.getItem(LS_KEY); if (raw) currentUser = JSON.parse(raw) as User; } catch {}
try { const tk = localStorage.getItem(TOKEN_KEY); if (tk) authToken = tk; } catch {}

export function getCurrentUser(): User | null {
	return currentUser;
}

export function logoutUser() {
	currentUser = null;
	authToken = null;
	try { localStorage.removeItem(LS_KEY); } catch {}
  try { localStorage.removeItem(TOKEN_KEY); } catch {}
}

export function loginUser(usernameOrEmail: string, password: string): User | null {
	const lookup = seedUsers.find(u => (u.username.toLowerCase() === usernameOrEmail.toLowerCase() || u.email.toLowerCase() === usernameOrEmail.toLowerCase()));
	if (!lookup) return null;
	if (lookup.password !== password) return null;
	const { password: _pw, ...safe } = lookup;
	currentUser = safe;
	try { localStorage.setItem(LS_KEY, JSON.stringify(safe)); } catch {}
	return currentUser;
}

// Backend login (JWT)
export interface LoginResult { ok:boolean; user?:User; error?:string; status?:number; message?:string; }
export async function loginRemote(usernameOrEmail: string, password: string): Promise<User | null> {
	try {
		const res = await apiFetch('/auth/login', { method:'POST', json:{ usernameOrEmail, password } });
		if (!res.ok) {
			console.warn('loginRemote HTTP status', res.status);
			return null; // caller toont simpele fout voorlopig
		}
		let data: any;
		try { data = await res.json(); } catch(parseErr){
			console.warn('[loginRemote] JSON parse fout, probeer raw text', parseErr);
			const raw = await res.text();
			console.warn('[loginRemote] raw body', raw.slice(0,400));
			return null;
		}
			console.log('[loginRemote] response data', data);
			if (data?.token && data?.user) {
			authToken = data.token;
				currentUser = { id:data.user.id, username:data.user.username, email:data.user.email || (data.user.username+"@example.com"), role:data.user.role || 'user', canUpload: data.user.canUpload, disabled: data.user.disabled, mustChange: data.user.mustChange };
			try { if (authToken) localStorage.setItem(TOKEN_KEY, authToken); localStorage.setItem(LS_KEY, JSON.stringify(currentUser)); } catch {}
			return currentUser;
		}
		// Fallback: token aanwezig maar geen user -> decode JWT payload voor minimale user
		if (data?.token && !data?.user) {
			try {
				// Probeer eerst /auth/me om volledige user te krijgen
				const probe = await apiFetch('/auth/me', { method:'GET', authToken: data.token });
				if (probe.ok) {
					const meData = await probe.json();
					if (meData?.user) {
						authToken = data.token; currentUser = meData.user;
						try { if (authToken) localStorage.setItem(TOKEN_KEY, authToken); localStorage.setItem(LS_KEY, JSON.stringify(currentUser)); } catch {}
						console.warn('[loginRemote] user verkregen via /auth/me');
						return currentUser;
					}
				}
				const part = data.token.split('.')[1];
				const json = JSON.parse(atob(part.replace(/-/g,'+').replace(/_/g,'/')));
				const minimal = { id: json.sub || 0, username: json.username || usernameOrEmail, email: (json.username || usernameOrEmail)+"@example.com", role: json.role || 'user' } as User;
				authToken = data.token;
				currentUser = minimal;
				try { if (authToken) localStorage.setItem(TOKEN_KEY, authToken); localStorage.setItem(LS_KEY, JSON.stringify(currentUser)); } catch {}
				console.warn('[loginRemote] fallback user geconstrueerd uit JWT payload');
				return currentUser;
			} catch(e){ console.warn('[loginRemote] fallback decode mislukt', e); }
		}
			console.warn('[loginRemote] ontbrekende token/user in body');
	} catch(e) { console.warn('loginRemote failed', e); }
	return null;
}

export function getAuthToken(): string | null { return authToken; }

export async function registerRemote(username: string, email: string, password: string): Promise<User | null> {
	try {
		const res = await apiFetch('/users', { method:'POST', json:{ username, email, password } });
		if (!res.ok) return null;
		// Auto login
		return await loginRemote(username, password);
	} catch { return null; }
}

export interface PasswordResetRequestResult { ok:boolean; status?:number; error?:string; message?:string; }
export async function requestPasswordReset(identifier: string): Promise<PasswordResetRequestResult> {
	try {
		const r = await apiFetch('/auth/request-reset', { method:'POST', json:{ usernameOrEmail: identifier } });
		if (r.ok) {
			// Server antwoordt altijd ok:true om enumeration te vermijden
			return { ok:true, status:r.status };
		}
		let msg = 'Onbekende fout';
		if (r.status === 400) msg = 'Ongeldig verzoek (controleer invoer)';
		else if (r.status === 404) msg = 'Endpoint niet gevonden';
		else if (r.status >=500) msg = 'Server fout';
		return { ok:false, status:r.status, error:'http_'+r.status, message: msg };
	} catch(e:any) {
		return { ok:false, error:'network', message: e?.message || 'Netwerk fout' };
	}
}

export async function resetPasswordWithToken(token: string, newPassword: string): Promise<boolean> {
	try {
		const r = await apiFetch('/auth/reset-password', { method:'POST', json:{ token, newPassword } });
		if (!r.ok) return false;
		const data = await r.json();
		return !!data.reset;
	} catch { return false; }
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<boolean> {
	if (!authToken) return false;
	try {
		const r = await apiFetch('/auth/change-password', { method:'POST', authToken, json:{ oldPassword, newPassword } });
		if (!r.ok) return false; const data = await r.json(); return !!data.changed;
	} catch { return false; }
}

export async function setFirstPassword(newPassword: string): Promise<boolean> {
	if (!authToken) return false;
	try {
		const r = await apiFetch('/auth/first-password', { method:'POST', authToken, json:{ newPassword } });
		if (!r.ok) return false; const data = await r.json();
		if (data.changed && currentUser) { currentUser.mustChange = false; try { localStorage.setItem(LS_KEY, JSON.stringify(currentUser)); } catch {} }
		return !!data.changed;
	} catch { return false; }
}

export function setCurrentUser(user: User) {
	currentUser = user;
	try { localStorage.setItem(LS_KEY, JSON.stringify(user)); } catch {}
}
// ...existing code...
export {};
