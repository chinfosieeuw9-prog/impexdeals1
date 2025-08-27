import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

type BrandLogoVariant = 'glass' | 'ring' | 'badge';

interface BrandLogoProps {
  size?: number;              // size in px (width/height)
  variant?: BrandLogoVariant; // visual style
  showText?: boolean;         // also show brand text
  textSize?: number;          // font size for brand text
  imgSrc?: string;            // override image source
  alt?: string;               // alt text
  sx?: any;                   // additional sx overrides
}

// Centralized brand name (easy to change everywhere)
export const BRAND_NAME = 'ImpexDeals';
const DEFAULT_SRC = '/4B.png';

const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 46,
  variant = 'glass',
  showText = false,
  textSize = 18,
  imgSrc = DEFAULT_SRC,
  alt = BRAND_NAME,
  sx = {}
}) => {
  const baseWrapper: any = {
    position: 'relative',
    width: size,
    height: size,
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    overflow: 'hidden',
    transition: 'all .25s',
    '& img': { width: '100%', height: '100%', objectFit: 'cover', display: 'block' }
  };

  const variantStyles: Record<BrandLogoVariant, any> = {
    glass: {
      borderRadius: 3,
      boxShadow: '0 4px 14px -4px rgba(0,0,0,.55), 0 2px 6px -2px rgba(0,0,0,.5)',
      outline: '1px solid rgba(255,255,255,.35)',
      background: 'linear-gradient(145deg,rgba(255,255,255,.22),rgba(255,255,255,.05))',
      backdropFilter: 'blur(3px) saturate(180%)',
      '&:hover': { boxShadow: '0 6px 18px -5px rgba(0,0,0,.6), 0 3px 8px -3px rgba(0,0,0,.55)', outline: '1px solid rgba(255,255,255,.5)' }
    },
    ring: {
      borderRadius: '50%',
      padding: 4,
      background: 'conic-gradient(from 140deg at 50% 50%, #fff 0deg, rgba(255,255,255,.1) 110deg, #fff 320deg)',
      '& img': { borderRadius: '50%', boxShadow: '0 0 0 2px rgba(255,255,255,.7), 0 4px 10px -3px rgba(0,0,0,.6)' },
      '&:hover img': { boxShadow: '0 0 0 2px rgba(255,255,255,.9), 0 6px 14px -4px rgba(0,0,0,.65)' }
    },
    badge: {
      borderRadius: 2,
      outline: '1px solid rgba(255,255,255,.25)',
      boxShadow: '0 2px 6px -2px rgba(0,0,0,.55), 0 0 0 2px rgba(0,0,0,.2) inset',
      '&:before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(180deg,rgba(255,255,255,.35),rgba(255,255,255,0))',
        pointerEvents: 'none'
      },
      '&:hover': { outline: '1px solid rgba(255,255,255,.5)' }
    }
  };

  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, ...('' as any) }}>
      <Box sx={{ ...baseWrapper, ...variantStyles[variant], ...sx }}>
        <Box component="img" src={imgSrc} alt={alt} loading="lazy" />
      </Box>
      {showText && (
        <Typography
          variant="h6"
          sx={{
            m: 0,
            fontSize: textSize,
            fontWeight: 700,
            letterSpacing: .5,
            textShadow: '0 2px 4px rgba(0,0,0,.4)'
          }}
        >
          {BRAND_NAME}
        </Typography>
      )}
    </Box>
  );
};

export default BrandLogo;
