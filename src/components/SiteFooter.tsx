import React from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';

const SiteFooter: React.FC = () => {
  return (
    <Box component="footer" sx={{ mt:8, pt:4, pb:3, borderTop:'1px solid', borderColor:(t)=> t.palette.mode==='dark'? 'rgba(255,255,255,0.12)':'#dbe3f2', color:(t)=> t.palette.mode==='dark'? '#b8c4d0':'#5a6c86' }}>
      <Box sx={{ maxWidth:1200, mx:'auto', px:2, display:'flex', flexDirection:'column', gap:2, alignItems:'center' }}>
        <Stack direction={{ xs:'column', sm:'row' }} spacing={3} sx={{ fontSize:13, fontWeight:500, '& a':{ textDecoration:'none', color:(t)=> t.palette.mode==='dark'? '#7fb5ff':'#1f6fd6' , '&:hover':{ textDecoration:'underline' } } }}>
          <Link to="/privacy">Privacy</Link>
          <Link to="/voorwaarden">Voorwaarden</Link>
          <Link to="/over">Over</Link>
          <Link to="/contact">Contact</Link>
        </Stack>
        <Typography variant="caption" sx={{ fontSize:11, letterSpacing:.5 }}>© {new Date().getFullYear()} ImpexDeals • Alle rechten voorbehouden</Typography>
      </Box>
    </Box>
  );
};
export default SiteFooter;
