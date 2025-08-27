import React, { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { registerRemote } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
	const [username,setUsername] = useState('');
	const [email,setEmail] = useState('');
	const [password,setPassword] = useState('');
	const [confirm,setConfirm] = useState('');
	const [error,setError] = useState('');
	const [strength,setStrength] = useState<{score:number; label:string; color:string}>({score:0,label:'',color:'#999'});
	const [busy,setBusy] = useState(false);
	const navigate = useNavigate();

	async function submit(e:React.FormEvent){
		e.preventDefault(); setError('');
		if (!username || !email || !password) { setError('Vul alle velden in'); return; }
		if (password.length < 8) { setError('Minimaal 8 tekens'); return; }
		if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) { setError('Gebruik letters én minimaal één cijfer'); return; }
		if (password !== confirm) { setError('Wachtwoorden verschillen'); return; }
		setBusy(true);
		const u = await registerRemote(username.trim(), email.trim(), password);
		setBusy(false);
		if (!u) { setError('Registratie mislukt (bestaat gebruiker al?)'); return; }
		navigate('/');
	}

	function calcStrength(pw:string){
		let score=0; if (pw.length>=8) score++; if (pw.length>=12) score++; if (/[0-9]/.test(pw)) score++; if (/[A-Z]/.test(pw)) score++; if (/[^A-Za-z0-9]/.test(pw)) score++;
		let label='Zwak'; let color='#d32f2f';
		if (score>=4){ label='Sterk'; color='#2e7d32'; }
		else if (score===3){ label='Redelijk'; color='#ed6c02'; }
		else if (score===2){ label='Matig'; color='#f57c00'; }
		return { score, label, color };
	}

	function onPwChange(v:string){
		setPassword(v); setStrength(calcStrength(v));
	}

	return (
		<Box sx={{ maxWidth:440, mx:'auto', mt:8, p:3, boxShadow:2, borderRadius:2, bgcolor:'#fff' }}>
			<Typography variant="h5" sx={{ mb:2 }}>Account aanmaken</Typography>
			<form onSubmit={submit}>
				<TextField label="Gebruikersnaam" fullWidth size="small" sx={{ mb:2 }} value={username} onChange={e=>setUsername(e.target.value)} />
				<TextField label="E-mail" type="email" fullWidth size="small" sx={{ mb:2 }} value={email} onChange={e=>setEmail(e.target.value)} />
				<TextField label="Wachtwoord" type="password" fullWidth size="small" sx={{ mb:1 }} value={password} onChange={e=>onPwChange(e.target.value)} />
				{password && <Typography variant="caption" sx={{ display:'block', mb:2, fontWeight:500, color: strength.color }}>Sterkte: {strength.label}</Typography>}
				<TextField label="Herhaal wachtwoord" type="password" fullWidth size="small" sx={{ mb:2 }} value={confirm} onChange={e=>setConfirm(e.target.value)} />
				{error && <Typography color="error" variant="body2" sx={{ mb:1 }}>{error}</Typography>}
				<Button type="submit" variant="contained" disabled={busy} fullWidth>{busy? 'Bezig...' : 'Registreren'}</Button>
			</form>
			<Button variant="text" sx={{ mt:2 }} onClick={()=>navigate('/login')}>Al een account? Inloggen</Button>
		</Box>
	);
};

export default Register;
