// Centrale API client utility
// Bepaalt basis URL afhankelijk van omgeving. In dev (frontend op :3000) gebruiken we backend op :4000.
// In productie kan je API_BASE via environment (window.__API_BASE__ of process.env.REACT_APP_API_BASE) instellen.

const explicit = (typeof process !== 'undefined' && (process as any).env && (process as any).env.REACT_APP_API_BASE) ? (process as any).env.REACT_APP_API_BASE : undefined;
// runtime override via global (bijv. in index.html script window.__API_BASE__ = 'https://api.example.com')
// @ts-ignore
const runtimeGlobal = (typeof window !== 'undefined' && (window as any).__API_BASE__) ? (window as any).__API_BASE__ : undefined;

// Development guess: als we op localhost draaien maar NIET zelf al op 4000 zitten, gebruik backend op 4000.
let devGuess = '';
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  const port = window.location.port;
  if (host === 'localhost' || host === '127.0.0.1') {
    if (port !== '4000') devGuess = 'http://localhost:4000';
  }
}

export const API_BASE: string = (explicit || runtimeGlobal || devGuess || 'http://localhost:4000').replace(/\/$/, '');

export function apiUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path; // already absolute
  if (!path.startsWith('/')) path = '/' + path;
  return API_BASE + path;
}

export interface ApiOptions extends RequestInit { authToken?: string | null; json?: any; }

export async function apiFetch(path: string, opts: ApiOptions = {}) {
  const { authToken, json, headers, ...rest } = opts;
  const hdrs: Record<string,string> = { ...(headers as any) };
  if (json !== undefined) {
    hdrs['Content-Type'] = hdrs['Content-Type'] || 'application/json';
  }
  if (authToken) hdrs['Authorization'] = 'Bearer ' + authToken;
  const res = await fetch(apiUrl(path), { ...rest, headers: hdrs, body: json !== undefined ? JSON.stringify(json) : rest.body });
  return res;
}

export async function apiJson<T=any>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await apiFetch(path, opts);
  if (!res.ok) throw new Error('HTTP '+res.status+' for '+path);
  return res.json();
}
