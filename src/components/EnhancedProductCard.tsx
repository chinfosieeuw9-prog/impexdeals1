import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Button from '@mui/material/Button';

// Nieuwe design card met focus op merk, tags en micro-interacties
export interface EnhancedProductCardProps {
  id: string;
  title: string;
  price?: number;
  brand?: string | null;
  image?: string;
  tags?: string[];
  qty?: number | null;
  negotiable?: boolean;
  category?: string | null;
  condition?: string | null;
  compact?: boolean;
  createdAt?: number;
  updatedAt?: number;
  imageRatio?: '4/3' | '16/9' | '1/1'; // geforceerde ratio
  catalogCode?: string | null;
  showCatalogCode?: boolean; // expliciet tonen (bv. alleen MijnProducten)
  onDelete?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
}

const EnhancedProductCard: React.FC<EnhancedProductCardProps> = ({ id, title, price, brand, image, tags, qty, negotiable, category, condition, compact, createdAt, updatedAt, imageRatio='4/3', catalogCode, showCatalogCode, onDelete, onEdit, onDuplicate }) => {
  const [copied,setCopied] = useState(false);
  const priceText = price!==undefined? `\u20ac ${price.toLocaleString('nl-NL')}`:'Prijs op aanvraag';
  const ageDays = createdAt? Math.ceil((Date.now()-createdAt)/(24*60*60*1000)) : undefined;
  const isFresh = ageDays!==undefined && ageDays <= 7;
  const freshnessLabel = isFresh? 'Nieuw' : undefined;
  const tagList = (tags||[]).slice(0,4);
  // image logic: gebruik alleen de image prop zoals doorgegeven
  let displayImage = image;
  return (
    <Box sx={(t)=>({
      position:'relative',
      width: 300,
      minHeight: 420,
      borderRadius: 10,
      background: t.palette.mode==='dark'? '#14202b':'#fff',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 12px -4px rgba(15,45,75,0.12)',
      overflow:'hidden',
      display:'flex', flexDirection:'column',
      transition:'box-shadow .25s',
      ':hover': { boxShadow:'0 8px 32px -8px rgba(15,45,75,0.22)' }
    })}>
      <Box sx={{ position:'relative', width:'100%', height:180, overflow:'hidden', background:'#f5f5f5' }}>
        <Box component="img"
          src={displayImage || "https://via.placeholder.com/300x180?text=Geen+foto"}
          alt={title}
          sx={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform .35s', ':hover':{ transform:'scale(1.08)' }, opacity: displayImage ? 1 : 0.7 }}
        />
        {/* Ref altijd rechts onderaan, kleiner, altijd tonen */}
        {catalogCode && (
          <Box sx={{ position:'absolute', right:10, bottom:10, zIndex:2 }}>
            <Typography variant="caption" sx={{ fontSize:9, opacity:.55, fontFamily:'monospace', background:'#f5f5f5', px:0.7, py:0.2, borderRadius:1 }}>{catalogCode}</Typography>
          </Box>
        )}
        <Box sx={{ position:'absolute', top:8, left:8, display:'flex', gap:.5, flexWrap:'wrap' }}>
          {freshnessLabel && <Chip size="small" label={freshnessLabel} color="primary" sx={{ fontWeight:600 }} />}
          {negotiable && <Chip size="small" label="Onderhandelbaar" color="secondary" sx={{ fontWeight:600 }} />}
        </Box>
        <Box sx={{ position:'absolute', top:8, right:8, display:'flex', flexDirection:'column', gap:0.5 }}>
          {onEdit && (
            <Tooltip title="Bewerken" placement="left">
              <IconButton size="small" onClick={(e)=>{ e.preventDefault(); onEdit(); }} sx={{ background:'rgba(0,0,0,0.35)', color:'#fff', '&:hover':{ background:'rgba(0,0,0,0.55)' } }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Verwijderen" placement="left">
              <IconButton size="small" onClick={(e)=>{ e.preventDefault(); if(window.confirm('Verwijder dit product?')) onDelete(); }} sx={{ background:'rgba(0,0,0,0.35)', color:'#fff', '&:hover':{ background:'rgba(255,0,0,0.55)' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Box sx={{ p:2, display:'flex', flexDirection:'column', gap:1, flexGrow:1 }}>
        <Typography variant="h6" sx={{ fontWeight:700, mb:0.5 }}>{title}</Typography>
        {brand && <Typography variant="overline" sx={{ fontWeight:700, letterSpacing:.8, color:'primary.main', lineHeight:1 }}>{brand}</Typography>}
        {category && <Typography variant="caption" sx={{ color:'text.secondary', mb:0.5 }}>{category}</Typography>}
        <Typography variant="body1" sx={{ fontWeight:800, mt:.15 }}>{priceText}</Typography>
        {qty!==undefined && <Typography variant="caption" sx={{ fontWeight:600, color:'text.secondary' }}>Aantal: {qty}</Typography>}
        {(tagList.length>0 || condition) && (
          <Box sx={{ display:'flex', gap:.5, flexWrap:'wrap', mt:.4 }}>
            {condition && <Chip size="small" label={condition} color="success" sx={{ fontSize:10, fontWeight:600 }} />}
            {tagList.map(t=> <Chip key={t} size="small" label={t} sx={{ fontSize:10, fontWeight:600 }} />)}
            {tags && tags.length>4 && <Chip size="small" label={`+${tags.length-4}`} variant="outlined" />}
          </Box>
        )}
        <Box sx={{ mt:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', pt:2 }}>
          <Button component={Link} to={`/product/${id}`} size="medium" variant="contained" sx={{ fontWeight:600, borderRadius:2, px:3 }}>Bekijk</Button>
          <Tooltip title={copied? 'Gekopieerd' : 'Kopieer link'}>
            <IconButton size="small" onClick={()=> { navigator.clipboard.writeText(window.location.origin+'/product/'+id); setCopied(true); setTimeout(()=>setCopied(false),1400); }}>
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );
};

export default EnhancedProductCard;
