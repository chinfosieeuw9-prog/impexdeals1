const FAV_KEY = 'impex_favs_v1';

function load(): string[] {
  try { const raw = localStorage.getItem(FAV_KEY); return raw? JSON.parse(raw): []; } catch { return []; }
}
function save(list: string[]) { try { localStorage.setItem(FAV_KEY, JSON.stringify(list)); } catch {} }

export function getFavorites(): string[] { return load(); }
export function isFavorite(id: string): boolean { return load().includes(id); }
export function toggleFavorite(id: string): boolean {
  const list = load();
  const idx = list.indexOf(id);
  if (idx>=0) { list.splice(idx,1); save(list); return false; }
  list.push(id); save(list); return true;
}
export function clearFavorites() { save([]); }
