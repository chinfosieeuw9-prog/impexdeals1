import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Over: React.FC = () => {
  usePageMeta({
    title: 'Over | ImpexDeals',
    description: 'Over ImpexDeals: missie, platform en achtergrondinformatie.',
    canonicalPath: '/over'
  });
  return (
    <Box sx={{ maxWidth:900, mx:'auto', py:3, display:'flex', flexDirection:'column', gap:2 }}>
      <Typography variant="h4" fontWeight={700}>Over ImpexDeals</Typography>
      <Typography variant="body1">Hier komt informatie over het platform, missie, team en achtergrond. Vervang deze placeholder met echte content.</Typography>
    </Box>
  );
};
export default Over;
