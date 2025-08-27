import React from 'react';
import Box from '@mui/material/Box';
import { SxProps, Theme } from '@mui/material/styles';

export interface GlassPanelProps {
  children: React.ReactNode;
  sx?: SxProps<Theme>;
  padding?: number | string;
  noHover?: boolean;
  elevation?: number; // 0..3 custom levels
  title?: React.ReactNode;
  actions?: React.ReactNode;
  minHeight?: number | string;
}

// Shared glass style tokens
const baseGlass = (elevation:number) => ({
  '--gp-shadow-main': elevation===0? '0 2px 6px -2px rgba(30,69,110,.18)': elevation===1? '0 4px 14px -4px rgba(30,69,110,.28)': elevation===2? '0 8px 30px -8px rgba(30,69,110,.40)': '0 14px 42px -10px rgba(30,69,110,.50)',
  '--gp-border': elevation<2? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.40)',
  '--gp-bg-a': elevation<2? 0.70 : 0.55,
  '--gp-bg-b': elevation<2? 0.40 : 0.30,
});

const GlassPanel: React.FC<GlassPanelProps> = ({ children, sx, padding=3, noHover, elevation=1, title, actions, minHeight }) => {
  return (
  <Box sx={{
      position:'relative',
      borderRadius: 24,
      p: padding,
      minHeight,
      background: `linear-gradient(145deg, rgba(255,255,255,var(--gp-bg-a)) 0%, rgba(255,255,255,var(--gp-bg-b)) 48%, rgba(255,255,255,0.20) 100%)`,
      backdropFilter: 'blur(22px) saturate(185%)',
      WebkitBackdropFilter: 'blur(22px) saturate(185%)',
      border: '1px solid var(--gp-border)',
      boxShadow: 'var(--gp-shadow-main)',
      overflow:'hidden',
      display:'flex',
      flexDirection:'column',
      transition: 'box-shadow .55s, transform .55s',
      ...baseGlass(elevation),
      ...(noHover? {} : {
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: elevation<2? '0 10px 32px -8px rgba(30,69,110,.42)' : '0 18px 50px -12px rgba(30,69,110,.55)'
        }
      }),
      '&:before': {
        content:'""',
        position:'absolute',
        inset:0,
        background: 'linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.18) 40%, rgba(255,255,255,0.04) 70%, rgba(255,255,255,0) 85%)',
        mixBlendMode:'overlay',
        pointerEvents:'none'
      },
      '&:after': {
        content:'""',
        position:'absolute',
        top:-80,
        left:-40,
        width:'140%',
        height:'140%',
        background:'linear-gradient(110deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.05) 42%, rgba(255,255,255,0) 60%)',
        opacity:.75,
        transform:'translateX(var(--shine-x,0)) rotate(6deg)',
        transition:'transform 1.8s ease',
        pointerEvents:'none'
      },
      '&:hover:after': noHover? {} : { transform:'translateX(30%) rotate(6deg)' },
      ...sx,
    }}>
      {(title || actions) && (
        <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', mb:2, gap:2 }}>
          {title && (
            <Box sx={{ flexGrow:1 }}>
              {typeof title === 'string' ? <Box component="h2" sx={{ m:0, fontSize:22, fontWeight:700, letterSpacing:.3 }}>{title}</Box> : title}
            </Box>
          )}
          {actions && <Box sx={{ display:'flex', alignItems:'center', gap:1 }}>{actions}</Box>}
        </Box>
      )}
      {children}
    </Box>
  );
};

export default GlassPanel;