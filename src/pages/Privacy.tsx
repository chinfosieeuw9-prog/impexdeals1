import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const Privacy: React.FC = () => {
  usePageMeta({
    title: 'Privacy | ImpexDeals',
    description: 'Privacyverklaring van ImpexDeals: informatie over gegevensverwerking en rechten van gebruikers.',
    canonicalPath: '/privacy'
  });
  return (
    <Box sx={{ maxWidth:900, mx:'auto', py:3, display:'flex', flexDirection:'column', gap:2 }}>
      <Typography variant="h4" fontWeight={700}>Privacyverklaring</Typography>
      <Typography variant="body1">Dit is een placeholder voor de privacyverklaring. Voeg hier later jouw beleid toe over welke gegevens worden verzameld, hoe ze worden gebruikt en hoe gebruikers rechten kunnen uitoefenen.</Typography>
    </Box>
  );
};
export default Privacy;
