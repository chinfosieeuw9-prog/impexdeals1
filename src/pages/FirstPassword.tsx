import React, { useState } from 'react';
import { getCurrentUser, setFirstPassword } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import styles from './FirstPassword.module.css';

const FirstPassword: React.FC = () => {
  const user = getCurrentUser();
  const nav = useNavigate();
  const [pw,setPw] = useState('');
  const [pw2,setPw2] = useState('');
  const [error,setError] = useState<string|null>(null);
  const [strength,setStrength] = useState<{label:string;cls:string}>({label:'',cls:''});
  const [saving,setSaving] = useState(false);
  if (!user) return <div>Niet ingelogd.</div>;
  if (!user.mustChange) return <div>Je hoeft geen nieuw wachtwoord te zetten. <button onClick={()=>nav('/')}>Home</button></div>;
  const submit = async ()=> {
  if (pw.length < 8) { setError('Minimaal 8 tekens'); return; }
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) { setError('Gebruik letters én een cijfer'); return; }
    if (pw!==pw2) { setError('Wachtwoorden verschillen'); return; }
    setError(null); setSaving(true);
    const ok = await setFirstPassword(pw);
    setSaving(false);
    if (ok) nav('/'); else setError('Opslaan mislukt');
  };
  return (
    <div className={styles.firstWrap}>
      <h2>Nieuw wachtwoord instellen</h2>
      <p>Kies je definitieve wachtwoord. Dit vervangt het tijdelijke wachtwoord.</p>
      {error && <div className={styles.errorMsg}>{error}</div>}
      <label className={styles.fieldLabel}>Nieuw wachtwoord
  <input className={styles.fullInput} type="password" value={pw} onChange={e=>{ const v=e.target.value; setPw(v); let lbl='Zwak', cls='pwWeak'; let score=0; if (v.length>=8) score++; if (v.length>=12) score++; if (/[0-9]/.test(v)) score++; if (/[A-Z]/.test(v)) score++; if (/[^A-Za-z0-9]/.test(v)) score++; if (score>=4){ lbl='Sterk'; cls='pwStrong'; } else if (score===3){ lbl='Redelijk'; cls='pwFair'; } else if (score===2){ lbl='Matig'; cls='pwMedium'; } setStrength({label:lbl,cls}); }} />
  {pw && <span className={`${styles.pwStrength} ${strength.cls? styles[strength.cls]:''}`}>Sterkte: {strength.label}</span>}
      </label>
      <label className={styles.fieldLabelLast}>Herhaal wachtwoord
        <input className={styles.fullInput} type="password" value={pw2} onChange={e=>setPw2(e.target.value)} />
      </label>
      <button disabled={saving} onClick={submit}>{saving? 'Opslaan...' : 'Opslaan'}</button>
    </div>
  );
};

export default FirstPassword;
