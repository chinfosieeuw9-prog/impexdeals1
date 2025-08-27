
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './ProductCard.module.css';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

interface ProductCardProps {
  id?: string;
  title: string;
  price: string | number;
  label?: string;
  image?: string;
  seller?: string;
  amount?: number;
  category?: string;
  condition?: string;
  showCopyLink?: boolean;
  glass?: boolean;
  compact?: boolean; // compacte variant (kleiner kaartje)
  descriptionLines?: number; // hoeveel regels voor beschrijving (default 3)
  buttonLabel?: string; // optioneel aanpassen actieknop
  buttonTo?: string; // expliciete link override
  buttonColor?: 'primary' | 'secondary' | 'error';
  buttonSize?: 'small' | 'medium';
  expiresAt?: number; // vervaldatum timestamp
  showExpiryInline?: boolean; // toon vervaldatum onderaan kaart
  expiryThresholdDays?: number; // toon alleen indien <= threshold dagen resterend (of verlopen)
}

const ProductCard: React.FC<ProductCardProps> = ({ id, title, price, label, image, seller, amount, category, condition, showCopyLink, glass, compact, buttonLabel, buttonTo, buttonColor='primary', buttonSize='medium', expiresAt, showExpiryInline, expiryThresholdDays, descriptionLines=3 }) => {
  const [copied,setCopied] = useState(false);
  const doCopy = () => {
    if (!id) return;
    try { navigator.clipboard.writeText(window.location.origin + '/product/' + id); setCopied(true); } catch {/* ignore */}
  };
  const priceText = typeof price === 'number' ? `€ ${price.toLocaleString('nl-NL')}` : price;
  const daysLeft = expiresAt ? Math.ceil((expiresAt - Date.now())/(24*60*60*1000)) : undefined;
  const expired = daysLeft !== undefined && daysLeft < 0;
  const expiryDateText = expiresAt ? new Date(expiresAt).toLocaleDateString('nl-NL',{ day:'2-digit', month:'2-digit', year:'numeric' }) : '';
  return (
  <Box sx={(theme) => ({
    position: 'relative',
    width: compact? 240: 300,
    maxWidth: compact? 240: 300,
    minWidth: compact? 210: 260,
    borderRadius: compact? 14: 16,
    boxShadow: glass
      ? '0 6px 28px -6px rgba(30,69,110,.35), 0 2px 10px -2px rgba(30,69,110,.25)'
      : '0 2px 4px rgba(0,0,0,0.04), 0 0 0 1px rgba(31,111,214,0.08)',
    // Split card background: light top area for image placeholder, darker readable body
    background: glass
      ? 'linear-gradient(150deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.40) 40%, rgba(255,255,255,0.30) 100%)'
      : (theme.palette.mode==='dark'
          ? 'linear-gradient(180deg,#1a3348 0%, #142a3e 55%, #102232 100%)'
          : '#ffffff'),
    backdropFilter: glass ? 'blur(14px) saturate(170%)' : undefined,
    WebkitBackdropFilter: glass ? 'blur(14px) saturate(170%)' : undefined,
    m: 2,
    p: 0,
  overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    border: glass
      ? '1px solid rgba(255,255,255,0.55)'
      : (theme.palette.mode==='dark'
          ? '1px solid rgba(255,255,255,0.10)'
          : '1px solid rgba(31,111,214,0.18)'),
    transition: 'transform .45s cubic-bezier(.16,.8,.24,1), box-shadow .45s',
    ':before': glass ? {
      content: '""',
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(160deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.22) 30%, rgba(255,255,255,0.08) 55%, rgba(255,255,255,0) 75%)',
      mixBlendMode: 'overlay',
      pointerEvents: 'none'
    } : undefined,
    ':after': glass ? {
      content: '""',
      position: 'absolute',
      top: -60,
      left: -40,
      width: '160%',
      height: '140%',
      background: 'linear-gradient(115deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.1) 42%, rgba(255,255,255,0) 60%)',
      transform: 'translateX(var(--shine-x,0)) rotate(8deg)',
      opacity: .85,
      transition: 'transform 1.4s ease',
      pointerEvents: 'none'
    } : undefined,
    ':hover': {
      transform: 'translateY(-8px) rotate3d(1,0,0,8deg)',
      boxShadow: glass
        ? '0 18px 56px -12px rgba(30,69,110,.55), 0 6px 22px -6px rgba(30,69,110,.45)'
        : '0 0 0 2px rgba(84,170,255,0.75), 0 10px 34px -8px rgba(17,52,84,0.65), 0 6px 18px -4px rgba(17,52,84,0.45)',
      '&:after': !glass ? {
        content:'""',
        position:'absolute',
        inset:0,
        borderRadius: 'inherit',
        pointerEvents:'none',
        boxShadow:'0 0 0 4px rgba(84,170,255,0.35)',
        mixBlendMode:'screen',
        opacity: .85,
        transition:'opacity .4s'
      }: undefined
    },
    '&:hover:after': glass ? { transform: 'translateX(35%) rotate(8deg)' } : undefined
  })}>
  <Box sx={(t)=> ({ width: '100%', height: compact? 160: 220, overflow: 'hidden', background: glass ? 'rgba(255,255,255,0.35)' : (t.palette.mode==='dark'? '#24445f' : '#e3f0ff'), position:'relative', borderBottom: t.palette.mode==='dark'? '1px solid rgba(255,255,255,0.05)':'1px solid rgba(0,0,0,0.08)',
    borderTopLeftRadius: (compact? 10:12), borderTopRightRadius: (compact? 10:12) })}>
      {glass && (
        <Box sx={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(255,255,255,.45) 0%, rgba(255,255,255,0) 70%)', zIndex:1, pointerEvents:'none' }} />
      )}
  {image ? <img src={image} alt={title} className={styles.productImage} /> : null}
      {(category || price) && (
        <Box sx={(t)=> ({ position:'absolute', top:6, left:6, maxWidth:'82%', px:1, py:0.3, fontSize:11, fontWeight:600, borderRadius:999, lineHeight:1.2, display:'flex', alignItems:'center', gap:.5,
          background: t.palette.mode==='dark'? 'rgba(0,0,0,0.55)':'rgba(255,255,255,0.78)',
          color: t.palette.mode==='dark'? '#f5f9fc':'#1a2e43',
          boxShadow:'0 2px 4px rgba(0,0,0,0.25)',
          '& .ellipsis': { whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' },
          '& .dot': { opacity:.45 },
          '& .price': { fontWeight:700 }
        })}>
          {category && <span className="ellipsis">{category}</span>}
          {category && price? <span className="dot">•</span>: null}
          {price && <span className="price">{priceText}</span>}
        </Box>
      )}
    </Box>
  <Box sx={(t)=> ({ p: compact? 1.2: 2, display: 'flex', flexDirection: 'column', gap: compact? 0.55: 1, flexGrow:1 })}>
  <Typography variant={compact? 'subtitle1':'h6'} sx={(t)=> ({ fontWeight: 700, fontSize: compact? 16: undefined, color: t.palette.mode==='dark'? '#f4f9fd':'#232526', mb: compact? 0.2: 0.5 })}>{title}</Typography>
      {category && <Typography variant="subtitle2" sx={(t)=> ({ color: t.palette.mode==='dark'? '#8fbdf5':'#3a7bd5', fontWeight: 500 })}>{category}</Typography>}
      <Box sx={(t)=> ({ display: 'flex', gap: 2, alignItems: 'center', mb: compact? 0.6: 1 })}>
  <Typography variant={compact? 'h6':'h5'} sx={(t)=> ({ color: t.palette.mode==='dark'? '#54b5ff':'#3a7bd5', fontWeight: 700, fontSize: compact? 20: undefined })}>{priceText}</Typography>
        {condition && <Chip label={condition} color="success" size="small" sx={(t)=> ({ fontWeight: 600, bgcolor: t.palette.mode==='dark'? 'rgba(76,175,80,0.25)': undefined })} />}
      </Box>
      <Box sx={(t)=> ({ display: 'flex', gap: 2, alignItems: 'center', mb: compact? 0.6: 1 })}>
        {seller && <Typography variant="body2" sx={(t)=> ({ color: t.palette.mode==='dark'? '#c6d2dd':'#232526' })}><b>Verkoper:</b> {seller}</Typography>}
        {amount !== undefined && <Typography variant="body2" sx={(t)=> ({ color: t.palette.mode==='dark'? '#c6d2dd':'#232526' })}><b>Aantal:</b> {amount}</Typography>}
      </Box>
      {expiresAt && showExpiryInline && daysLeft !== undefined && (
        (()=>{
          const threshold = expiryThresholdDays ?? Number.POSITIVE_INFINITY;
          if (!expired && daysLeft > threshold) return null; // boven drempel -> niet tonen
          let color = '#5f6b76';
          if (expired) color = '#d32f2f'; else if (daysLeft <=5) color = '#ed6c02'; else color = '#2e7d32';
          return (
            <Typography variant="caption" sx={{
              color,
              fontWeight: 600,
              mb: compact? 0.5: 0.8,
              letterSpacing:.2,
              display:'block'
            }}>
              {expired ? 'VERLOPEN' : `Verloopt: ${expiryDateText} (${daysLeft}d)`}
            </Typography>
          );
        })()
      )}
      {/* Beschrijving nu onderaan, kleiner en subtiel */}
  {label && <Typography variant="caption" sx={(t)=> ({ color: t.palette.mode==='dark'? 'rgba(255,255,255,0.62)':'#54616d', mb: compact? 0.6: 1, mt: 'auto', fontSize: compact? 11: 12, letterSpacing:.15, lineHeight:1.25, display:'-webkit-box', WebkitLineClamp: descriptionLines, WebkitBoxOrient:'vertical', overflow:'hidden' })}>{label}</Typography>}
      <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mt: compact? 0.5: 1 }}>
  <Button
    component={ (buttonTo || id)? Link : 'button'}
    to={(buttonTo || (id? `/product/${id}`: undefined)) as any}
    variant="contained"
    size={buttonSize}
    color={buttonColor === 'primary'? undefined : buttonColor}
    sx={(t)=> ({
      borderRadius: 8,
      fontWeight: 600,
      px: compact? 2.0: 3,
      py: compact? 0.6: 1,
      fontSize: buttonSize==='small'? 12: (compact? 13: undefined),
      ...(buttonColor==='primary' ? {
        background: 'linear-gradient(90deg,#1f6fd6,#3a7bd5)',
        color: '#fff',
        boxShadow: '0 4px 14px -2px rgba(0,0,0,.35)',
        '&:hover': { background: 'linear-gradient(90deg,#236ed0,#4589e0)' }
      }: {}),
      minWidth: compact? 0: undefined
    })}
  >
          {buttonLabel || 'Bekijken'}
        </Button>
        {showCopyLink && id && (
          <Tooltip title="Kopieer link">
            <IconButton size="small" onClick={doCopy} sx={{ ml:1 }}>
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
    <Snackbar open={copied} autoHideDuration={1600} onClose={()=>setCopied(false)} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
      <Alert severity="success" variant="filled" sx={{ fontSize:12, py:0.3 }}>Link gekopieerd</Alert>
    </Snackbar>
  </Box>
  );
};



export default ProductCard;
