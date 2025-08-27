
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { loginRemote } from '../services/authService';

const Login: React.FC = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (!usernameOrEmail || !password) { setError('Vul alle velden in.'); return; }
  const user = await loginRemote(usernameOrEmail, password);
    if (user) {
      if ((user as any).mustChange) { navigate('/first-password'); return; }
      navigate(user.role === 'admin' ? '/admin' : '/');
    } else setError('Ongeldige login');
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8, p: 3, boxShadow: 2, borderRadius: 2, background: '#fff' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Inloggen</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Gebruikersnaam of e-mail"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
          value={usernameOrEmail}
          onChange={e => setUsernameOrEmail((e.target as HTMLInputElement).value)}
        />
        <TextField
          label="Wachtwoord"
          type="password"
          variant="outlined"
          fullWidth
          sx={{ mb: 2 }}
          value={password}
          onChange={e => setPassword((e.target as HTMLInputElement).value)}
        />
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        <Button type="submit" variant="contained" color="primary" fullWidth>Login</Button>
      </form>
  <Button size="small" sx={{ mt:1 }} onClick={()=>navigate('/wachtwoord-vergeten')}>Wachtwoord vergeten?</Button>
      <Button color="secondary" sx={{ mt: 2 }} onClick={() => navigate('/register')}>Nog geen account? Registreren</Button>
    </Box>
  );
};

export default Login;
