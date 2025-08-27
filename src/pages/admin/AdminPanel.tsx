import React, { useState, useMemo, useEffect } from 'react';
import '../../App.css';
import './admin.css';
import { getCurrentUser, getAuthToken } from '../../services/authService';
import { apiFetch } from '../../services/apiClient';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  canUpload: boolean;
  disabled?: boolean;
  disabledReason?: string | null;
  disabledAt?: string | null;
  createdAt?: string;
  mustChange?: boolean;
}

const AdminPanel: React.FC = () => {
  const auth = getCurrentUser();
  const token = getAuthToken();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [newUser, setNewUser] = useState<{ username:string; email:string; password:string; role:'admin'|'user'; canUpload:boolean; disabled:boolean; mustChangePassword:boolean }|null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  // Fetch users vanaf backend
  useEffect(()=> {
    if (!token) return; if (!auth) return;
    (async()=> {
      try {
        setLoading(true); setError(null);
  const res = await apiFetch('/admin/users', { authToken: token });
        if (!res.ok) {
          const txt = await res.text();
            console.warn('Admin users fetch niet OK', res.status, txt);
            setError('Kon gebruikers niet laden (status '+res.status+')'); setLoading(false); return;
        }
        let data: any = await res.json();
        console.log('[AdminPanel] raw response', data);
        if (!Array.isArray(data) && data && Array.isArray(data.users)) data = data.users; // fallback mocht backend ooit {users:[]} sturen
        if (!Array.isArray(data)) {
          console.warn('Onverwacht response type voor /admin/users', data);
          setError('Onverwachte server response');
          setLoading(false);
          return;
        }
  const mapped = data.map((u:any)=> ({ id:u.id, username:u.username, email:u.email|| (u.username+'@example.com'), role:u.role, canUpload: !!(u.canUpload ?? u.can_upload), disabled: !!(u.disabled ?? u.isDisabled), disabledReason: u.disabledReason ?? u.disabled_reason ?? null, disabledAt: u.disabledAt || u.disabled_at || null, createdAt:u.createdAt || u.created_at, mustChange: !!(u.mustChange || u.pwd_must_change) }));
        console.log('[AdminPanel] mapped users', mapped.length);
        setUsers(mapped);
        setLoading(false);
      } catch(e:any){ setError(e.message||'Fout'); setLoading(false); }
    })();
  }, [token, auth]);

  const filtered = useMemo(()=> users.filter(u => [u.username,u.email,u.role].some(f => f?.toLowerCase().includes(query.toLowerCase()))), [users, query]);

  const startEdit = (u: AdminUser) => setEditUser(u);
  const cancelEdit = () => setEditUser(null);
  const applyEdit = async () => {
    if (!editUser) return; if (!token) return;
    try {
      setSaving(true);
  setSuccess(null);
  const res = await apiFetch(`/admin/users/${editUser.id}`, { method:'PUT', authToken: token, json:{ username: editUser.username, email: editUser.email, role: editUser.role, canUpload: editUser.canUpload, disabled: editUser.disabled, mustChange: editUser.mustChange, disabledReason: editUser.disabledReason } });
      if (!res.ok) throw new Error('Opslaan mislukt');
      const updated = await res.json();
  setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, username: updated.username, email: updated.email, role: updated.role, canUpload: updated.canUpload, disabled: updated.disabled, disabledReason: updated.disabledReason, disabledAt: updated.disabledAt, mustChange: updated.mustChange } : u));
  setSuccess('Opgeslagen');
      setEditUser(null);
    } catch(e:any){ setError(e.message||'Opslag fout'); }
    finally { setSaving(false); }
  };

  const toggleUpload = async (id:number) => {
    const u = users.find(x=>x.id===id); if (!u || !token) return;
    const next = !u.canUpload;
    setUsers(prev => prev.map(p=> p.id===id? { ...p, canUpload: next }: p));
  try { await apiFetch(`/admin/users/${id}`, { method:'PUT', authToken: token, json:{ canUpload: next, role: u.role, disabled: u.disabled, disabledReason: u.disabledReason } });
        // refetch to ensure persistence
        await refetchUsers();
      } catch {}
  };
  const toggleRole = async (id:number) => {
    const u = users.find(x=>x.id===id); if (!u || !token) return;
    const next = u.role==='admin' ? 'user':'admin';
    setUsers(prev => prev.map(p=> p.id===id? { ...p, role: next as any }: p));
  try { await apiFetch(`/admin/users/${id}`, { method:'PUT', authToken: token, json:{ role: next, canUpload: u.canUpload, disabled: u.disabled, disabledReason: u.disabledReason } });
        await refetchUsers();
      } catch {}
  };
  const toggleDisabled = async (id:number) => {
    const u = users.find(x=>x.id===id); if (!u || !token) return;
    const next = !u.disabled;
    let reason: string | null | undefined = u.disabledReason || null;
    if (next) { // disable
      reason = window.prompt('Reden voor uitschakelen (optioneel):','') || '';
    } else {
      reason = null; // enable: clear
    }
    setUsers(prev => prev.map(p=> p.id===id? { ...p, disabled: next, disabledReason: reason }: p));
    try { await apiFetch(`/admin/users/${id}`, { method:'PUT', authToken: token, json:{ disabled: next, role: u.role, canUpload: u.canUpload, disabledReason: reason } });
      await refetchUsers();
    } catch {}
  };
  const refetchUsers = async () => {
    if (!token) return;
    try {
  const res = await apiFetch('/admin/users', { authToken: token });
      if (!res.ok) return;
      let data:any = await res.json();
      if (!Array.isArray(data) && data && Array.isArray(data.users)) data = data.users;
      if (Array.isArray(data)) {
        const mapped = data.map((u:any)=> ({ id:u.id, username:u.username, email:u.email|| (u.username+'@example.com'), role:u.role, canUpload: !!(u.canUpload ?? u.can_upload), disabled: !!(u.disabled ?? u.isDisabled), createdAt:u.createdAt || u.created_at, mustChange: !!(u.mustChange || u.pwd_must_change) }));
        setUsers(mapped);
      }
    } catch {}
  };
  const deleteUser = async (id:number) => {
    const u = users.find(x=>x.id===id); if (!u || !token) return;
    if (!window.confirm(`Weet je zeker dat je gebruiker "${u.username}" wilt verwijderen?`)) return;
    try {
  const res = await apiFetch(`/admin/users/${id}`, { method:'DELETE', authToken: token });
      if (!res.ok) { const t = await res.text(); alert('Verwijderen mislukt: '+t); return; }
      setUsers(prev => prev.filter(p=> p.id!==id));
    } catch(e:any){ alert('Netwerkfout: '+e.message); }
  };
  const submitNewUser = async () => {
    if (!newUser || !token) return;
    if (!newUser.username || !newUser.email || !newUser.password) { alert('Vul alle velden in'); return; }
    try {
  const res = await apiFetch('/admin/users', { method:'POST', authToken: token, json: newUser });
      if (!res.ok) { const t = await res.text(); alert('Aanmaken mislukt: '+t); return; }
      const created = await res.json();
  setUsers(prev => [...prev, { id:created.id, username:created.username, email:created.email, role:created.role, canUpload:created.canUpload, disabled: created.disabled, disabledReason: created.disabledReason, disabledAt: created.disabledAt, mustChange: created.mustChange }]);
      setNewUser(null);
    } catch(e:any){ alert('Fout: '+e.message); }
  };

  const triggerMigration = async ()=> {
    if (!token) return;
    try {
      setSaving(true); setMigrationResult(null);
  const res = await apiFetch('/admin/migrate-images', { method:'POST', authToken: token, json:{ limit: 200 } });
      if (res.ok) { setMigrationResult(await res.json()); }
      else setMigrationResult({ error: true });
    } catch(e:any){ setMigrationResult({ error:true, detail:e.message }); }
    finally { setSaving(false); }
  };

  if (!auth) return <div className="admin-guard">Log in als admin om dit paneel te bekijken.</div>;
  if (auth.role !== 'admin') return <div className="admin-guard">Alleen admin gebruikers hebben toegang.</div>;

  return (
    <div className="admin-wrap">
      <h2 className="admin-title">👥 Gebruikersoverzicht</h2>
  {error && <div className="error-box">{error}</div>}
  {success && <div className="success-box">{success}</div>}
      <div className="row tools-row">
        <input className="admin-search" placeholder="Zoek..." value={query} onChange={e=>setQuery(e.target.value)} />
        <button disabled={loading} onClick={()=>{ // refetch
          if (!token) return; setLoading(true);
          apiFetch('/admin/users', { authToken: token })
            .then(async r=>{
              if (!r.ok) { const t= await r.text(); console.warn('Refetch fail', r.status, t); return { _error:true, status:r.status }; }
              const d = await r.json(); return d;
            })
            .then(d=>{
              if ((d as any)?._error) { setError('Laden mislukt (status '+(d as any).status+')'); setUsers([]); }
              else {
                let arr:any = d;
                if (!Array.isArray(arr) && arr && Array.isArray(arr.users)) arr = arr.users;
  const mapped = Array.isArray(arr)? arr.map((u:any)=> ({ id:u.id, username:u.username, email:u.email|| (u.username+'@example.com'), role:u.role, canUpload: !!(u.canUpload ?? u.can_upload), disabled: !!(u.disabled ?? u.isDisabled), disabledReason: u.disabledReason ?? u.disabled_reason ?? null, disabledAt: u.disabledAt || u.disabled_at || null, createdAt:u.createdAt || u.created_at, mustChange: !!(u.mustChange || u.pwd_must_change) })) : [];
                setUsers(mapped);
              }
              setLoading(false);
            })
            .catch(e=> { console.warn('Refetch error', e); setError('Netwerkfout'); setLoading(false); });
        }}>↻ Vernieuw</button>
  <button onClick={()=> setNewUser({ username:'', email:'', password:'', role:'user', canUpload:true, disabled:false, mustChangePassword:true })}>➕ Nieuw</button>
  <button disabled={saving} onClick={triggerMigration}>🖼️ Migratie Base64 → WebP (v2)</button>
  <button onClick={()=> window.location.href='/admin/audit'}>🕒 Audit Log</button>
        {migrationResult && <span className="note-small">{migrationResult.error? 'Migratie fout' : `Converted ${migrationResult.converted} (scanned ${migrationResult.scanned})`}</span>}
      </div>
      {loading && <div className="loading-inline">Laden...</div>}
      <div className="table-shell">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th><th>Naam</th><th>Email</th><th>Rol</th><th>Upload</th><th>Status</th><th>MustChange</th><th>Acties</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                <td><span className={`yesno ${u.canUpload?'yes':'no'}`}>{u.canUpload?'Ja':'Nee'}</span></td>
                <td><span className={`yesno ${u.disabled?'no':'yes'}`} title={u.disabledReason||''}>{u.disabled? 'Uit':'Actief'}{u.disabled && u.disabledReason? ' ℹ️':''}</span></td>
                <td><span className={`yesno ${u.mustChange?'no':'yes'}`}>{u.mustChange? 'Ja':'Nee'}</span></td>
                <td>
                  <button className="edit-btn" onClick={()=>startEdit(u)}>✏️</button>
                  <button className="mini-btn" onClick={()=>toggleRole(u.id)}>Rol</button>
                  <button className="mini-btn" onClick={()=>toggleUpload(u.id)}>Upload</button>
                  <button className="mini-btn" onClick={()=>toggleDisabled(u.id)}>{u.disabled? 'Enable':'Disable'}</button>
                  <button className="mini-btn" onClick={()=>deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {filtered.length===0 && !loading && <tr><td colSpan={6} className="no-results">Geen resultaten.</td></tr>}
          </tbody>
        </table>
      </div>
  <div className="new-user-bottom-btn">
  <button onClick={()=> setNewUser({ username:'', email:'', password:'', role:'user', canUpload:true, disabled:false, mustChangePassword:true })}>➕ Nieuw (onder)</button>
      </div>

      {editUser && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Gebruiker Bewerken</h3>
            <label>Naam<input value={editUser.username} disabled={editUser.username==='admin'} onChange={e=>setEditUser({...editUser, username:e.target.value})} /></label>
            <label>Email<input value={editUser.email} onChange={e=>setEditUser({...editUser, email:e.target.value})} /></label>
            <div className="row">
              <label><input type="checkbox" checked={editUser.canUpload} onChange={e=>setEditUser({...editUser, canUpload:e.target.checked})}/> Mag uploaden</label>
              <label><input type="checkbox" checked={editUser.role==='admin'} onChange={e=>setEditUser({...editUser, role:e.target.checked?'admin':'user'})}/> Admin</label>
              <label><input type="checkbox" checked={!!editUser.disabled} onChange={e=>setEditUser({...editUser, disabled:e.target.checked})}/> Uitgeschakeld</label>
              <label><input type="checkbox" checked={!!editUser.mustChange} onChange={e=>setEditUser({...editUser, mustChange:e.target.checked})}/> Must change</label>
            </div>
            <div className="row row-topmargin">
              <button type="button" className="mini-btn" disabled={saving} onClick={async ()=>{
                if (!token || !editUser) return;
                if (!window.confirm('Tijdelijk wachtwoord genereren en mustChange aanzetten?')) return;
                try {
                  setSaving(true);
                  const r = await apiFetch(`/admin/users/${editUser.id}/force-reset`, { method:'POST', authToken: token });
                  if (r.ok) { const d = await r.json(); alert('Tijdelijk wachtwoord: '+d.tempPassword); setEditUser({...editUser, mustChange:true}); }
                  else { const t = await r.text(); alert('Reset mislukt: '+t); }
                } catch(e:any){ alert('Netwerkfout: '+e.message); }
                finally { setSaving(false); }
              }}>Forceer reset</button>
            </div>
            <div className="actions">
              <button disabled={saving} onClick={applyEdit} className="save-btn">{saving? 'Opslaan...' : 'Opslaan'}</button>
              <button onClick={cancelEdit} className="cancel-btn">Annuleren</button>
            </div>
          </div>
        </div>
      )}
      {newUser && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Nieuwe Gebruiker</h3>
            <label>Gebruikersnaam<input value={newUser.username} onChange={e=>setNewUser({...newUser, username:e.target.value})} /></label>
            <label>Email<input value={newUser.email} onChange={e=>setNewUser({...newUser, email:e.target.value})} /></label>
            <label>Wachtwoord<input type="password" value={newUser.password} onChange={e=>setNewUser({...newUser, password:e.target.value})} /></label>
            <div className="row">
              <label><input type="checkbox" checked={newUser.canUpload} onChange={e=>setNewUser({...newUser, canUpload:e.target.checked})}/> Mag uploaden</label>
              <label><input type="checkbox" checked={newUser.role==='admin'} onChange={e=>setNewUser({...newUser, role:e.target.checked?'admin':'user'})}/> Admin</label>
              <label><input type="checkbox" checked={newUser.disabled} onChange={e=>setNewUser({...newUser, disabled:e.target.checked})}/> Uitgeschakeld</label>
              <label><input type="checkbox" checked={newUser.mustChangePassword} onChange={e=>setNewUser({...newUser, mustChangePassword:e.target.checked})}/> Eerste login: wijzigen</label>
            </div>
            <div className="actions">
              <button onClick={submitNewUser} className="save-btn">Aanmaken</button>
              <button onClick={()=>setNewUser(null)} className="cancel-btn">Sluiten</button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-footer-btns">
        <button className="perm-btn" disabled>🔐 Gebruikersrechten beheren</button>
        <button className="public-btn" disabled>👥 Publiek overzicht (binnenkort)</button>
      </div>
    </div>
  );
};

  // Create user modal rendering
  // We inject the modal after component definition by patching the return block via conditional above (simpler: conditionally render inside main return)

  // Quick enhancement: append modal for new user at end of root div using portal-like simple conditional

  // Monkey patch: export stays the same

export default AdminPanel;
