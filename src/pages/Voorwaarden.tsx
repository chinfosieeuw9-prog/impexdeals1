import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Voorwaarden: React.FC = () => {
  usePageMeta({
    title: 'Voorwaarden | ImpexDeals',
    description: 'Algemene voorwaarden van ImpexDeals: gebruiksregels, aansprakelijkheid en juridische bepalingen.',
    canonicalPath: '/voorwaarden'
  });
  return (
    <Box sx={{ maxWidth:900, mx:'auto', py:3, display:'flex', flexDirection:'column', gap:2 }}>
      <Typography variant="h4" fontWeight={700}>Algemene Voorwaarden</Typography>
      <Typography variant="body1">Placeholder voor de algemene voorwaarden. Beschrijf hier gebruiksregels, aansprakelijkheid, betaalvoorwaarden en overige juridische bepalingen.</Typography>
    </Box>
  );
};
export default Voorwaarden;
