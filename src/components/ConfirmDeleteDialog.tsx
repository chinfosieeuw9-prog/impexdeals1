import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';

interface ConfirmDeleteDialogProps {
  open: boolean;
  itemLabel?: string; // naam / titel van het item
  onClose: () => void;
  onConfirm: () => Promise<void> | void; // mag async zijn
  requirePhrase?: string; // standaard 'VERWIJDER'
  loading?: boolean;
}

const ConfirmDeleteDialog: React.FC<ConfirmDeleteDialogProps> = ({ open, itemLabel, onClose, onConfirm, requirePhrase = 'VERWIJDER', loading }) => {
  const [input, setInput] = useState('');
  useEffect(()=>{ if(open){ setInput(''); } },[open]);
  const okEnabled = input.trim().toUpperCase() === requirePhrase.toUpperCase() && !loading;
  return (
    <Dialog open={open} onClose={loading? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight:700, pb:1 }}>Bevestig verwijderen</DialogTitle>
      <DialogContent sx={{ display:'flex', flexDirection:'column', gap:2, pt:1 }}>
        <Typography variant="body2" sx={{ lineHeight:1.5 }}>
          Weet je zeker dat je dit item wilt verwijderen{itemLabel? `: "${itemLabel}"`: ''}? Deze actie kan niet ongedaan worden gemaakt.
        </Typography>
        <Typography variant="caption" sx={{ fontWeight:600, letterSpacing:0.5 }}>
          Typ {requirePhrase} om te bevestigen
        </Typography>
        <TextField size="small" autoFocus disabled={loading} placeholder={requirePhrase} value={input} onChange={e=>setInput(e.target.value)} />
      </DialogContent>
      <DialogActions sx={{ px:3, pb:2 }}>
        <Button onClick={onClose} disabled={loading}>Annuleren</Button>
        <Button color="error" variant="contained" disabled={!okEnabled} onClick={()=>{ onConfirm(); }}>
          {loading? 'Verwijderen...' : 'Verwijderen'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
export default ConfirmDeleteDialog;
