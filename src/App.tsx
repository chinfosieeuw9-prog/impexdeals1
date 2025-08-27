import React, { useEffect, useMemo, useState } from 'react';


import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Catalogus from './pages/Catalogus';
import ProductDetail from './pages/ProductDetail';
import ProductBewerken from './pages/ProductBewerken';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import PartijenOverzicht from './pages/PartijenOverzicht';
import MijnProducten from './pages/MijnProducten';
import Berichten from './pages/Berichten';
import PartijPlaatsen from './pages/PartijPlaatsen';
import Profile from './pages/Profile';
import Social from './pages/Social';
import FirstPassword from './pages/FirstPassword';
import AdminPanel from './pages/admin/AdminPanel';
import AuditLog from './pages/admin/AuditLog';
import { getCurrentUser, logoutUser } from './services/authService';
import { useAuthRefresh } from './services/useAuthRefresh';
import SiteFooter from './components/SiteFooter';
import SiteStructuredData from './components/SiteStructuredData';
import Privacy from './pages/Privacy';
import Voorwaarden from './pages/Voorwaarden';
import Over from './pages/Over';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';


import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import BrandLogo from './components/BrandLogo';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';
import MenuIcon from '@mui/icons-material/Menu';
import MobileNavDrawer from './components/MobileNavDrawer';
import Tooltip from '@mui/material/Tooltip';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import LensBlurIcon from '@mui/icons-material/LensBlur';
// duplicate removed
import { ThemeProvider } from '@mui/material/styles';
import { buildTheme } from './theme';
import SkipLink from './components/SkipLink';



// Basis navigatie; items die een login vereisen krijgen requireAuth: true
const baseNav = [
  { label: 'Catalogus', to: '/partijen', requireAuth: false },
  { label: 'Mijn Producten', to: '/mijn-producten', requireAuth: true },
  { label: 'Berichten', to: '/berichten', requireAuth: true },
  { label: 'AI Nieuws', to: '/ai-nieuws', requireAuth: false },
  { label: 'Markt Inzichten', to: '/markt-inzichten', requireAuth: true },
  { label: 'Social', to: '/social', requireAuth: false },
];

function App() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Modes: light, dark, system (auto)
  const [userMode,setUserMode] = useState<'light'|'dark'|'system'>(()=> (localStorage.getItem('site-mode') as any) || 'light');
  const [systemPrefDark,setSystemPrefDark] = useState<boolean>(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  // watch system preference when in system mode
  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e:MediaQueryListEvent)=> setSystemPrefDark(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler); else mq.addListener(handler as any);
    return ()=> { if (mq.removeEventListener) mq.removeEventListener('change', handler); else mq.removeListener(handler as any); };
  }, []);
  const variant = userMode==='system'? (systemPrefDark? 'dark':'light') : userMode; // variant: light | dark
  const effectiveMode: 'light'|'dark' = variant;
  useEffect(()=>{ localStorage.setItem('site-mode', userMode); }, [userMode]);
  useEffect(()=>{ 
    document.body.classList.remove('site-dark','site-dark-light','site-dim','site-dim2','site-dim3');
    if (variant==='dark') {
      document.body.classList.add('site-dark'); // gebruik bestaande echte donkere achtergrond
    }
  }, [variant]);

  // Basic theme: only mode + primary/secondary
  const theme = useMemo(()=> buildTheme(effectiveMode), [effectiveMode]);
  const navigate = useNavigate();
  const user = getCurrentUser();
  const primaryNav = useMemo(()=> baseNav.filter(i => !i.requireAuth || !!user), [user]);
  // Configurable breakpoint for switching to hamburger nav
  const MOBILE_BREAKPOINT = 1100; // px (testwaarde – pas hier aan om eerder/later naar hamburger te schakelen)
  const isSmall = useMediaQuery(`(max-width:${MOBILE_BREAKPOINT}px)`, { noSsr: true });
  const [mobileOpen,setMobileOpen] = useState(false);
  // Automatische token refresh + logout callback
  useAuthRefresh(()=> { logoutUser(); navigate('/login'); });
  useEffect(()=> {
    if (user && (user as any).mustChange && !window.location.pathname.startsWith('/first-password')) {
      navigate('/first-password');
    }
  }, [user, navigate]);
  const handleMenu = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => {
    logoutUser();
    handleClose();
    navigate('/');
  };
  // Redirect na succesvolle login (alleen wanneer huidige pad login/register is)
  useEffect(()=> {
    if (user && (window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register') || window.location.pathname.startsWith('/first-password') || window.location.pathname.startsWith('/wachtwoord-reset') || window.location.pathname.startsWith('/gebruikersbeheer'))) {
      navigate('/partijen', { replace:true });
    }
  }, [user, navigate]);

  return (
    <ThemeProvider theme={theme}>
    <>
  <SkipLink />
  <SiteStructuredData />
      <AppBar
        position="fixed"
        elevation={3}
        sx={{
          background: variant==='light'
            ? 'linear-gradient(130deg,#162b47 0%, #1f4470 40%, #2b5f9f 70%, #3e7ed6 100%)'
            : 'linear-gradient(130deg,#0f1b2a 0%, #132739 38%, #183752 68%, #1d4868 100%)',
          boxShadow: '0 4px 16px -6px rgba(0,0,0,.45), 0 2px 6px -2px rgba(0,0,0,.35)',
          backdropFilter: 'saturate(200%) blur(12px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: variant==='light'
              ? 'linear-gradient(160deg,rgba(255,255,255,.55) 0%,rgba(255,255,255,.28) 28%,rgba(255,255,255,.12) 52%,rgba(255,255,255,0) 72%)'
              : 'linear-gradient(160deg,rgba(255,255,255,.70) 0%,rgba(255,255,255,.42) 32%,rgba(255,255,255,.22) 56%,rgba(255,255,255,0) 78%)',
            pointerEvents: 'none',
            mixBlendMode: 'overlay',
            zIndex: 0
          },
          '&:after': {
            content: '""',
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '2px',
            background: variant==='light'
              ? 'linear-gradient(90deg,rgba(22,43,71,0) 0%, #162b47 20%, #1f4470 50%, #162b47 80%, rgba(22,43,71,0) 100%)'
              : 'linear-gradient(90deg,rgba(210,224,234,0) 0%, #d0dce4 20%, #c1d4dd 50%, #d0dce4 80%, rgba(210,224,234,0) 100%)',
            boxShadow: '0 0 6px 1px rgba(22,43,71,.55)',
            pointerEvents: 'none',
            zIndex: 2
          }
        }}
      >
        <Toolbar sx={{ gap: 4, position: 'relative', zIndex: 1 }}>
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: '#fff', '&:hover': { opacity: .9 }, transition: 'opacity .2s' }}>
            <BrandLogo size={46} variant="glass" />
            <Typography variant="h6" sx={{ ml: 1.5, fontWeight: 700, letterSpacing: .5, textShadow: '0 2px 4px rgba(0,0,0,.4)' }}>
              ImpexDeals
            </Typography>
          </Box>
          {isSmall ? (
            <>
              <IconButton onClick={()=> setMobileOpen(true)} sx={{ color:'#fff' }} aria-label="Menu" size="large">
                <MenuIcon />
              </IconButton>
              <Box sx={{ flexGrow:1 }} />
            </>
          ) : (
            <Stack direction="row" spacing={3} sx={{ flexGrow: 1 }}>
              {primaryNav.map(item => (
                <Button
                  key={item.to}
                  component={Link}
                  to={item.to}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.88)',
                    '&:hover': {
                      color: '#fff',
                      background: 'rgba(255,255,255,0.12)'
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}
          <Box sx={{ display:'flex', alignItems:'center', gap:2 }}>
            <ModeMenu userMode={userMode} systemPrefDark={systemPrefDark} setUserMode={setUserMode} />
          {user ? (
            <Box>
              <Tooltip title="Account">
                <IconButton onClick={handleMenu} size="small">
                  <Avatar sx={{ width: 34, height: 34 }}>{user.username.charAt(0).toUpperCase()}</Avatar>
                </IconButton>
              </Tooltip>
              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                <MenuItem onClick={() => { navigate('/profile'); handleClose(); }}>Profiel</MenuItem>
                {user.role === 'admin' && <MenuItem onClick={() => { navigate('/admin'); handleClose(); }}>Admin</MenuItem>}
                <MenuItem onClick={handleLogout}>Uitloggen</MenuItem>
              </Menu>
            </Box>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button component={Link} to="/login" variant="text" sx={{ textTransform: 'none', color: 'rgba(255,255,255,0.85)' }}>Inloggen</Button>
              <Button component={Link} to="/register" variant="contained" sx={{ textTransform: 'none', borderRadius: 999, background: 'linear-gradient(90deg,#3d7bfd,#62a4ff)', boxShadow: '0 4px 14px -2px rgba(0,0,0,.45)', '&:hover': { background: 'linear-gradient(90deg,#447fee,#6dadff)' } }}>Registreren</Button>
            </Stack>
          )}
          </Box>
        </Toolbar>
      </AppBar>
  <Box id="main-content" component="main" sx={{ pt: 10, px: 3, pb: 6 }}>
        <Routes>
          <Route path="/" element={<Home />} />
  <Route path="/partijen" element={<Catalogus />} />
          <Route path="/mijn-producten" element={<MijnProducten />} />
          <Route path="/berichten" element={<Berichten />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/product/:id/bewerken" element={<ProductBewerken />} />
          <Route path="/ai-nieuws" element={<div>AI Nieuws (placeholder)</div>} />
            <Route path="/markt-inzichten" element={<div>Markt Inzichten (placeholder)</div>} />
            <Route path="/social" element={<Social />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/wachtwoord-vergeten" element={<ForgotPassword />} />
          <Route path="/wachtwoord-reset" element={<ResetPassword />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/first-password" element={<FirstPassword />} />
          <Route path="/plaats" element={<PartijPlaatsen />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/admin/audit" element={<AuditLog />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/voorwaarden" element={<Voorwaarden />} />
          <Route path="/over" element={<Over />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Box>
  <SiteFooter />
  <MobileNavDrawer open={mobileOpen} onClose={()=> setMobileOpen(false)} items={primaryNav} bottom={user? <Typography variant="caption" sx={{ opacity:.7 }}>Ingelogd als {user.username}</Typography>: null} />
  </>
  </ThemeProvider>
  );
}

export default App;

// Mode dropdown menu component
const ModeMenu: React.FC<{ userMode:'light'|'dark'|'system'; systemPrefDark:boolean; setUserMode:React.Dispatch<React.SetStateAction<'light'|'dark'|'system'>>; }> = ({ userMode, systemPrefDark, setUserMode }) => {
  const [anchor,setAnchor] = useState<null | HTMLElement>(null);
  const open = Boolean(anchor);
  const handleOpen = (e:React.MouseEvent<HTMLElement>)=> setAnchor(e.currentTarget);
  const handleClose = ()=> setAnchor(null);
  const icon = userMode==='system'? <SettingsBrightnessIcon/> : userMode==='light'? <LightModeIcon/> : userMode==='dark'? <DarkModeIcon/> : <LensBlurIcon/>; // LensBlur for dim variants
  return (
    <>
      <Tooltip title="Thema modus">
        <IconButton onClick={handleOpen} sx={{ color:'rgba(255,255,255,0.95)' }}>{icon}</IconButton>
      </Tooltip>
      <Menu anchorEl={anchor} open={open} onClose={handleClose} transformOrigin={{ vertical:'bottom', horizontal:'right' }} anchorOrigin={{ vertical:'bottom', horizontal:'right' }}>
  <MenuItem selected={userMode==='light'} onClick={()=>{ setUserMode('light'); handleClose(); }}>Licht</MenuItem>
  <MenuItem selected={userMode==='dark'} onClick={()=>{ setUserMode('dark'); handleClose(); }}>Licht Donker</MenuItem>
        <MenuItem selected={userMode==='system'} onClick={()=>{ setUserMode('system'); handleClose(); }}>Systeem ({systemPrefDark? 'donker':'licht'})</MenuItem>
      </Menu>
    </>
  );
};
