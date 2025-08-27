import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { resetPasswordWithToken } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const ResetPassword: React.FC = () => {
  const [token,setToken] = useState('');
  const [pw,setPw] = useState('');
  const [confirm,setConfirm] = useState('');
  const [error,setError] = useState('');
  const [done,setDone] = useState(false);
  const navigate = useNavigate();

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError('');
    if (!token || !pw) { setError('Vul alle velden in'); return; }
    if (pw.length < 6) { setError('Minimaal 6 tekens'); return; }
    if (pw !== confirm) { setError('Wachtwoorden verschillen'); return; }
    const ok = await resetPasswordWithToken(token.trim(), pw);
    if (!ok) { setError('Reset mislukt'); return; }
    setDone(true);
    setTimeout(()=>navigate('/login'), 1500);
  }

  return (
    <Box sx={{ maxWidth:420, mx:'auto', mt:8, p:3, boxShadow:2, borderRadius:2, bgcolor:'#fff' }}>
      <Typography variant="h5" sx={{ mb:2 }}>Nieuw wachtwoord</Typography>
      {done ? (
        <Typography>Klaar! Je wordt doorgestuurd…</Typography>
      ) : (
        <form onSubmit={submit}>
          <TextField label="Reset token" fullWidth size="small" sx={{ mb:2 }} value={token} onChange={e=>setToken(e.target.value)} />
          <TextField label="Nieuw wachtwoord" type="password" fullWidth size="small" sx={{ mb:2 }} value={pw} onChange={e=>setPw(e.target.value)} />
          <TextField label="Herhaal wachtwoord" type="password" fullWidth size="small" sx={{ mb:2 }} value={confirm} onChange={e=>setConfirm(e.target.value)} />
          {error && <Typography color="error" sx={{ mb:1 }}>{error}</Typography>}
          <Button type="submit" variant="contained" fullWidth>Resetten</Button>
        </form>
      )}
    </Box>
  );
};
export default ResetPassword;
