import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../services/authService';
import { getProductsByUser, removeProduct } from '../services/productService';
import type { Product } from '../types/product';
import EnhancedProductCard from '../components/EnhancedProductCard';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { useNavigate, Link } from 'react-router-dom';

const MijnProducten: React.FC = () => {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [items, setItems] = useState<Product[]>([]);
  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    // Filter out expired products
    const now = Date.now();
    const validProducts = getProductsByUser(user.id).filter(p => !p.expiresAt || p.expiresAt > now);
    setItems(validProducts);
  }, [user, navigate]);
  if (!user) return null;
  return (
    <Box sx={{ px:3, py:4 }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', mb:3 }}>
        <Typography variant="h4" fontWeight={700}>Mijn Producten</Typography>
        <Button component={Link} to="/plaats" variant="contained" sx={{ borderRadius: 999 }}>Nieuw product</Button>
      </Box>
  <Box sx={{ display:'flex', flexWrap:'wrap', gap:3.2, rowGap:4 }}>
    {items.map(p => {
      const now = Date.now();
      const expiresInMs = p.expiresAt ? p.expiresAt - now : null;
      const expiresInDays = expiresInMs !== null ? Math.ceil(expiresInMs / (24*60*60*1000)) : null;
      const isExpiringSoon = expiresInDays !== null && expiresInDays <= 1 && expiresInDays >= 0;
      const isExpired = expiresInDays !== null && expiresInDays < 0;
      return (
        <Box key={p.id} sx={{ position:'relative' }}>
          <EnhancedProductCard imageRatio="16/9"
            compact
            id={p.id}
            title={p.title}
            price={p.price}
            image={p.images?.[0]?.url || p.images?.[0]?.dataUrl || undefined}
            brand={p.brand}
            qty={p.qty}
            category={p.category}
            condition={p.condition}
            negotiable={p.negotiable}
            tags={p.tags}
            createdAt={p.createdAt}
            updatedAt={p.expiresAt}
            catalogCode={p.catalogCode}
            showCatalogCode
            onEdit={()=> navigate('/product/'+p.id+'/bewerken')}
            onDelete={()=> {
              removeProduct(p.id);
              setItems(prev => prev.filter(i=>i.id!==p.id));
            }}
          />
          {isExpiringSoon && !isExpired && (
            <Box sx={{ position:'absolute', top:8, right:8, zIndex:2, background:'#fffbe6', border:'1px solid #ffe58f', borderRadius:2, px:1.5, py:1, boxShadow:'0 2px 8px -4px #ffe58f', display:'flex', alignItems:'center', gap:1 }}>
              <Typography variant="caption" sx={{ color:'#ad8b00', fontWeight:700 }}>
                Verloopt binnen {expiresInDays} dag{expiresInDays === 1 ? '' : 'en'}
              </Typography>
              <Button size="small" variant="outlined" sx={{ ml:1, borderRadius:2, fontSize:12, py:0.2 }}
                onClick={async()=>{
                  // Extend expiry by 5 days
                  const { extendProductExpiry } = await import('../services/productService');
                  const updated = await extendProductExpiry(p.id, 5);
                  if (updated) setItems(items => items.map(i => i.id === p.id ? updated : i));
                }}>
                Verlengen
              </Button>
            </Box>
          )}
          {isExpired && (
            <Box sx={{ position:'absolute', top:8, right:8, zIndex:2, background:'#fff1f0', border:'1px solid #ffa39e', borderRadius:2, px:1.5, py:1, boxShadow:'0 2px 8px -4px #ffa39e', display:'flex', alignItems:'center', gap:1 }}>
              <Typography variant="caption" sx={{ color:'#cf1322', fontWeight:700 }}>
                Verlopen
              </Typography>
            </Box>
          )}
        </Box>
      );
    })}
        {items.length === 0 && <Typography>Je hebt nog geen producten toegevoegd.</Typography>}
      </Box>
    </Box>
  );
};
export default MijnProducten;
