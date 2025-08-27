import { useEffect, useRef } from 'react';
import { getAuthToken, getCurrentUser, setCurrentUser } from './authService';
import { apiFetch } from './apiClient';

// Automatische token refresh elke 7u (token 8h) + achtergrond user sync.
// Roept callback aan bij logout (bijv. wanneer refresh faalt/401) zodat UI kan reageren.
export function useAuthRefresh(onLogout?: ()=>void) {
  const timer = useRef<number | null>(null);
  useEffect(()=>{
    async function refresh() {
      const token = getAuthToken();
      if (!token) return;
      try {
        const res = await apiFetch('/auth/refresh', { method:'POST', authToken: token });
        if (!res.ok) {
          if (res.status === 401 && onLogout) onLogout();
          return;
        }
        const data = await res.json();
        if (data?.token && data?.user) {
          // Sla nieuwe token op via authService (hergebruik setCurrentUser + localStorage write door login pad)
          try { localStorage.setItem('auth_token_v1', data.token); } catch {}
          setCurrentUser({ id:data.user.id, username:data.user.username, email:data.user.email, role:data.user.role, canUpload: data.user.canUpload, mustChange: data.user.mustChange });
        }
      } catch {}
    }
    // Start interval ±7 uur (25200000 ms)
    timer.current = window.setInterval(refresh, 25200000);
    // Eerste korte delay sync (1 min) voor lange sessies
    const first = window.setTimeout(refresh, 60000);
    return ()=> {
      if (timer.current) window.clearInterval(timer.current); window.clearTimeout(first);
    };
  }, [onLogout]);
}
