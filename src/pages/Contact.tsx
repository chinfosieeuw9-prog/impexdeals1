import React from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

const Contact: React.FC = () => {
  usePageMeta({
    title: 'Contact | ImpexDeals',
    description: 'Contact ImpexDeals via het formulier of per e-mail voor vragen en ondersteuning.',
    canonicalPath: '/contact'
  });
  return (
    <Box sx={{ maxWidth:760, mx:'auto', py:3, display:'flex', flexDirection:'column', gap:3 }}>
      <Box>
        <Typography variant="h4" fontWeight={700} mb={1}>Contact</Typography>
        <Typography variant="body2" sx={{ opacity:.8 }}>Neem contact op via het formulier of stuur ons een e-mail op <b>support@impexdeals.example</b>.</Typography>
      </Box>
      <Box component="form" onSubmit={(e)=>{ e.preventDefault(); alert('Bericht verzonden (demo)'); }} sx={{ display:'flex', flexDirection:'column', gap:2 }}>
        <TextField label="Naam" required fullWidth size="small" />
        <TextField label="E-mail" required type="email" fullWidth size="small" />
        <TextField label="Onderwerp" required fullWidth size="small" />
        <TextField label="Bericht" required multiline minRows={4} fullWidth />
        <Button type="submit" variant="contained" sx={{ alignSelf:'flex-start' }}>Verstuur</Button>
      </Box>
    </Box>
  );
};
export default Contact;
