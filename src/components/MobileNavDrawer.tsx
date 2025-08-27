import React from 'react';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';

export interface MobileNavItem { label:string; to:string; onClick?:()=>void }

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
  items: MobileNavItem[];
  bottom?: React.ReactNode;
}

const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({ open, onClose, items, bottom }) => {
  return (
    <Drawer anchor="left" open={open} onClose={onClose} ModalProps={{ keepMounted:true }}>
      <Box sx={{ width: 250, display:'flex', flexDirection:'column', height:'100%' }} role="navigation" aria-label="Hoofdmenu">
        <List sx={{ py:0 }}>
          {items.map(it => (
            <ListItemButton key={it.to} component="a" href={it.to} onClick={()=> { onClose(); it.onClick?.(); }}>
              <ListItemText primary={it.label} primaryTypographyProps={{ fontWeight:500 }} />
            </ListItemButton>
          ))}
        </List>
        {bottom && (
          <Box sx={{ mt:'auto' }}>
            <Divider />
            <Box sx={{ p:1.5 }}>{bottom}</Box>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default MobileNavDrawer;