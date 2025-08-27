import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { requestPasswordReset } from '../services/authService';

const ForgotPassword: React.FC = () => {
  const [identifier,setIdentifier] = useState('');
  const [sent,setSent] = useState(false);
  const [error,setError] = useState('');

  async function submit(e:React.FormEvent){
    e.preventDefault(); setError('');
    if (!identifier) { setError('Vul gebruikersnaam of e-mail in'); return; }
    const result = await requestPasswordReset(identifier.trim());
    if (result.ok) {
      setSent(true);
    } else {
      setError(result.message || 'Verzoek mislukt');
    }
  }

  return (
    <Box sx={{ maxWidth:420, mx:'auto', mt:8, p:3, boxShadow:2, borderRadius:2, bgcolor:'#fff' }}>
      <Typography variant="h5" sx={{ mb:2 }}>Wachtwoord vergeten</Typography>
      {sent ? (
        <Typography>Als het account bestaat is een reset token aangemaakt (bekijk server console). Gebruik de ontvangen token op de reset pagina.</Typography>
      ) : (
        <form onSubmit={submit}>
          <TextField label="Gebruikersnaam of e-mail" fullWidth size="small" sx={{ mb:2 }} value={identifier} onChange={e=>setIdentifier(e.target.value)} />
          {error && <Typography color="error" sx={{ mb:1 }}>{error}</Typography>}
          <Button type="submit" variant="contained" fullWidth>Verstuur reset link</Button>
        </form>
      )}
    </Box>
  );
};
export default ForgotPassword;
