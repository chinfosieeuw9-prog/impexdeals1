import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  usePageMeta({
    title: '404 Niet gevonden | ImpexDeals',
    description: 'Pagina niet gevonden op ImpexDeals. Ga terug naar de startpagina of bekijk de catalogus.',
    canonicalPath: window.location.pathname // canonical huidige pad
  });
  return (
    <Box sx={{ maxWidth:700, mx:'auto', py:6, textAlign:'center', display:'flex', flexDirection:'column', gap:3 }}>
      <Typography variant="h2" fontWeight={800} sx={{ fontSize:{ xs:56, md:72 }, background:'linear-gradient(90deg,#1f6fd6,#54b5ff)', WebkitBackgroundClip:'text', color:'transparent' }}>404</Typography>
      <Typography variant="h5" fontWeight={600}>Pagina niet gevonden</Typography>
      <Typography variant="body1" sx={{ opacity:.8 }}>De pagina die je zocht bestaat niet of is verplaatst.</Typography>
      <Box sx={{ display:'flex', justifyContent:'center', gap:2 }}>
        <Button component={Link} to="/" variant="contained">Naar start</Button>
        <Button component={Link} to="/partijen" variant="outlined">Catalogus</Button>
      </Box>
    </Box>
  );
};
export default NotFound;
