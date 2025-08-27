import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const WelcomeSection: React.FC = () => (
  <Box sx={{
    background: 'linear-gradient(135deg, #e3f0ff 0%, #cbe2ff 100%)',
    borderRadius: 4,
    py: 6,
    px: 2,
    textAlign: 'center',
    mb: 4,
    boxShadow: 2,
  }}>
    <Typography variant="h3" color="primary" sx={{ fontWeight: 700, mb: 2 }}>
      Welkom bij ImpexDeals
    </Typography>
    <Typography variant="h6" sx={{ mb: 4 }}>
      Uw platform voor de handel in partijen goederen. Koop en verkoop efficiënt met onze catalogus functionaliteit.
    </Typography>
    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
      <Button variant="contained" color="primary" size="large" sx={{ borderRadius: 8, boxShadow: 1 }}>
        Aan de slag
      </Button>
      <Button variant="contained" color="secondary" size="large" sx={{ borderRadius: 8, boxShadow: 1 }}>
        Catalogus bekijken
      </Button>
    </Stack>
    <Stack direction="row" spacing={8} justifyContent="center">
      <Box>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>10+</Typography>
        <Typography variant="body1">Actieve Producten</Typography>
      </Box>
      <Box>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>24/7</Typography>
        <Typography variant="body1">Online Beschikbaar</Typography>
      </Box>
      <Box>
        <Typography variant="h5" color="primary" sx={{ fontWeight: 700 }}>100%</Typography>
        <Typography variant="body1">Veilig Handelen</Typography>
      </Box>
    </Stack>
  </Box>
);

export default WelcomeSection;
