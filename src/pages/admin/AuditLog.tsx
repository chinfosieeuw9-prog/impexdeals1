import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { getAuthToken, getCurrentUser } from '../../services/authService';
import { apiFetch } from '../../services/apiClient';
import '../../App.css';
import './admin.css';

interface AuditChange { field:string; before:any; after:any; }
interface AuditItem {
  id:number; action:string; createdAt:string; actor:{ id:number; username:string|null }|null; target:{ id:number; username:string|null }; changes:AuditChange[];
}

const AuditLog: React.FC = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  const [items,setItems] = useState<AuditItem[]>([]);
  const [page,setPage] = useState(1);
  const [totalPages,setTotalPages] = useState(1);
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState<string|null>(null);
  const [filterActor,setFilterActor] = useState('');
  const [filterTarget,setFilterTarget] = useState('');
  const [filterAction,setFilterAction] = useState('');

  const fetchPage = useCallback(async (p:number)=>{
    if (!token) return; if (!user || user.role!=='admin') return;
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      params.set('page', String(p));
  if (filterActor.trim()) params.set('actor', filterActor.trim());
  if (filterTarget.trim()) params.set('target', filterTarget.trim());
  if (filterAction.trim()) params.set('action', filterAction.trim());
      const res = await apiFetch('/admin/audit?'+params.toString(), { authToken: token });
      if (!res.ok) { const t = await res.text(); throw new Error('Server '+res.status+': '+t); }
      const data = await res.json();
      setItems(data.items||[]); setPage(data.page||p); setTotalPages(data.totalPages||1);
    } catch(e:any){ setError(e.message||'Fout'); }
    finally { setLoading(false); }
  }, [token, user, filterActor, filterTarget, filterAction]);

  useEffect(()=> { fetchPage(1); }, [fetchPage]);

  // fetchPage callback hierboven

  const flat = useMemo(()=> items.map(it=> ({ ...it, changeSummary: it.changes.map(c=> c.field).join(', ') })), [items]);

  function exportCsv(){
    const headers = ['id','createdAt','action','actorId','actorUsername','targetId','targetUsername','fields','changes'];
    const lines = [headers.join(',')];
    for (const it of items){
      const fields = it.changes.map(c=>c.field).join('|');
      const changePairs = it.changes.map(c=> `${c.field}:${JSON.stringify(c.before)}=>${JSON.stringify(c.after)}`).join('|');
      const row = [it.id, it.createdAt, it.action, it.actor?.id||'', it.actor?.username||'', it.target.id, it.target.username||'', fields, changePairs]
        .map(v=> '"'+String(v).replace(/"/g,'""')+'"').join(',');
      lines.push(row);
    }
    const blob = new Blob([lines.join('\n')], { type:'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'audit-log.csv'; a.click();
    setTimeout(()=> URL.revokeObjectURL(url), 2000);
  }

  if (!user) return <div className="admin-guard">Login vereist</div>;
  if (user.role !== 'admin') return <div className="admin-guard">Alleen admin</div>;

  return (
    <div className="admin-wrap">
      <h2 className="admin-title">🕒 Audit Log</h2>
      <div className="row tools-row">
        <input className="admin-search" placeholder="Actor ID" value={filterActor} onChange={e=>setFilterActor(e.target.value)} />
        <input className="admin-search" placeholder="Target ID" value={filterTarget} onChange={e=>setFilterTarget(e.target.value)} />
        <input className="admin-search" placeholder="Actie (bv update_user)" value={filterAction} onChange={e=>setFilterAction(e.target.value)} />
        <button onClick={()=>fetchPage(1)}>Filter</button>
        <button onClick={()=>{ setFilterActor(''); setFilterTarget(''); setFilterAction(''); fetchPage(1); }}>Reset</button>
        <button onClick={()=> exportCsv()}>⬇️ CSV</button>
      </div>
      {error && <div className="error-box">{error}</div>}
      {loading && <div className="loading-inline">Laden...</div>}
      <div className="table-shell">
        <table className="users-table audit-table">
          <thead>
            <tr>
              <th>ID</th><th>Tijd</th><th>Actor</th><th>Target</th><th>Actie</th><th>Velden</th><th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {flat.map(it=> (
              <tr key={it.id}>
                <td>{it.id}</td>
                <td>{new Date(it.createdAt).toLocaleString()}</td>
                <td>{it.actor? `${it.actor.username||'user#'+it.actor.id} (${it.actor.id})` : '—'}</td>
                <td>{`${it.target.username||'user#'+it.target.id} (${it.target.id})`}</td>
                <td>{it.action}</td>
                <td>{it.changeSummary||'—'}</td>
                <td>{it.changes.length? <details><summary>Details</summary>
                  <ul className="diff-list">
                    {it.changes.map(c=> {
                      const cls = c.field==='role'? 'diff-role' : c.field==='disabled'? 'diff-disabled' : c.field==='pwd_must_change'? 'diff-mustchange':'diff-generic';
                      return <li key={c.field} className={cls}><strong>{c.field}</strong>: <em>{String(c.before)}</em> → <span>{String(c.after)}</span></li>;
                    })}
                  </ul>
                </details> : '—'}</td>
              </tr>
            ))}
            {!loading && flat.length===0 && <tr><td colSpan={7} className="no-results">Geen logs</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button disabled={page<=1 || loading} onClick={()=>fetchPage(page-1)}>Vorige</button>
        <span>Pagina {page} / {totalPages}</span>
        <button disabled={page>=totalPages || loading} onClick={()=>fetchPage(page+1)}>Volgende</button>
      </div>
    </div>
  );
};

export default AuditLog;
