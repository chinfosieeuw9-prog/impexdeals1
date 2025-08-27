import React, { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import BrandLogo from './BrandLogo';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ArticleIcon from '@mui/icons-material/Article';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import GroupsIcon from '@mui/icons-material/Groups';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import LogoutIcon from '@mui/icons-material/Logout';
import { getCurrentUser, loginRemote, logoutUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';

interface MenuItemDef {
  label: string;
  path: string;
  icon: React.ReactElement;
}

const menuItems: MenuItemDef[] = [
  { label: 'Catalogus', path: '/catalogus', icon: <StorefrontIcon /> },
  { label: 'AI Nieuws', path: '/nieuws', icon: <ArticleIcon /> },
  { label: 'Markt Inzichten', path: '/inzicht', icon: <QueryStatsIcon /> },
  { label: 'Social', path: '/social', icon: <GroupsIcon /> },
  { label: 'Inloggen', path: '/login', icon: <LoginIcon /> },
  { label: 'Registreren', path: '/registreren', icon: <PersonAddIcon /> },
];

const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [uname, setUname] = useState('');
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string|undefined>();

  async function doLogin(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(undefined);
  const u = await loginRemote(uname.trim(), pw);
    if (!u) setError('Foutieve login');
    setUser(u); setBusy(false);
  }
  function doLogout() { logoutUser(); setUser(null); }

  return (
    <React.Fragment>
      {/* Top accent divider */}
      <Box sx={{ height: 4, background: (theme)=>`linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary?.main || theme.palette.primary.light})` }} />
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: (theme)=>`1px solid ${theme.palette.divider}` }}>
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: 70 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="large" edge="start" color="primary" aria-label="home" sx={{ p: 0 }} onClick={()=>navigate('/')}> 
              <BrandLogo size={42} variant="glass" />
            </IconButton>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, letterSpacing: .5, userSelect:'none', cursor:'pointer' }} onClick={()=>navigate('/')}>ImpexDeals</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems:'center', gap: 1 }}>
            <Tooltip title="Nieuw Product" arrow>
              <IconButton color="primary" onClick={()=>navigate('/plaats')}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>
            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
            {!user && (
              <Box component="form" onSubmit={doLogin} sx={{ display:'flex', alignItems:'center', gap:1 }}>
                <TextField size="small" variant="outlined" placeholder="user" value={uname} onChange={e=>setUname(e.target.value)} sx={{ width:120 }} />
                <TextField size="small" variant="outlined" placeholder="wachtwoord" type="password" value={pw} onChange={e=>setPw(e.target.value)} sx={{ width:130 }} />
                <Button type="submit" size="small" variant="contained" disabled={busy}>Login</Button>
                {error && <Typography variant="caption" color="error">{error}</Typography>}
              </Box>
            )}
            {user && (
              <Box sx={{ display:'flex', alignItems:'center', gap:.5 }}>
                <Typography variant="body2" color="primary">{user.username}</Typography>
                <Tooltip title="Uitloggen" arrow>
                  <IconButton size="small" color="primary" onClick={doLogout}><LogoutIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>
    </React.Fragment>
  );
};

export default Header;
