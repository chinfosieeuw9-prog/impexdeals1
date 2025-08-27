
import React, { useEffect, useState } from 'react';
import EnhancedProductCard from '../components/EnhancedProductCard';
import BuildTest from '../components/BuildTest';
import { getProducts, getProductsByUser } from '../services/productService';
import { getCurrentUser } from '../services/authService';
import type { Product } from '../types/product';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import { Link } from 'react-router-dom';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';

const Catalogus: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [draftCount, setDraftCount] = useState(0);
  const [showDrafts, setShowDrafts] = useState(false);
  const [myDrafts, setMyDrafts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const data = getProducts();
      setProducts(data);
      const me = getCurrentUser();
      if (me) {
        const mine = getProductsByUser(me.id);
        const drafts = mine.filter(p=>p.isDraft);
        setDraftCount(drafts.length);
        setMyDrafts(drafts);
      } else { setDraftCount(0); setMyDrafts([]); }
      setLoading(false);
    } catch {
      setError('Kan producten niet ophalen');
      setLoading(false);
    }
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <>
      <BuildTest />
      <Box sx={{ background:'#ffecb3', color:'#ad8b00', px:2, py:1, mb:2, borderRadius:2, fontWeight:700, fontSize:18 }}>
        DEBUG: Catalogus component is ACTUEEL geladen (27-08-2025)
      </Box>
      <Box sx={(theme) => ({
      minHeight: '100vh',
      background: theme.palette.gradient?.primary,
      py: 8,
      px: 2,
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    })}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, width: '100%', maxWidth: 1200 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: '#3a7bd5' }}>
          Nieuwste Producten
        </Typography>
        <Box sx={{ display:'flex', gap:2 }}>
          <Button component={Link} to="/plaats" variant="contained" sx={{ borderRadius: 999 }}>
            Nieuw product
          </Button>
          <Button variant="outlined" size="large" sx={{ borderRadius: 8, fontWeight: 600, px: 4, color:'#3a7bd5', borderColor:'#3a7bd5' }} href="/bericht/nieuw">
            Nieuw bericht
          </Button>
        </Box>
      </Box>
      {draftCount > 0 && (
        <Box sx={{ mb:4, width:'100%', maxWidth:1200, textAlign:'left', display:'flex', flexDirection:'column', gap:1 }}>
          <Typography variant="caption" sx={{ background:'#ffe9c7', color:'#8a4b00', px:1.5, py:0.5, borderRadius:1, fontWeight:500, display:'inline-block' }}>
            Je hebt {draftCount} concept{draftCount!==1 && 'en'} – standaard verborgen.
          </Typography>
          <FormControlLabel control={<Switch checked={showDrafts} onChange={(e)=>setShowDrafts(e.target.checked)} size="small" />} label={<Typography variant="caption" sx={{ fontWeight:500 }}>Toon mijn concepten</Typography>} />
        </Box>
      )}
  <Box sx={{ display: 'flex', gap: 3.2, rowGap:4, flexWrap: 'wrap', justifyContent: 'center', width: '100%', maxWidth: 1200 }}>
        {[...products, ...(showDrafts? myDrafts: [])]
          .sort((a,b)=> b.createdAt - a.createdAt)
          .map((p) => (
            <EnhancedProductCard imageRatio="16/9" compact
              key={p.id}
              id={p.id}
              title={p.title}
              price={p.price}
              brand={p.brand}
              image={p.images?.[0]?.url || p.images?.[0]?.dataUrl || undefined}
              qty={p.qty}
              category={p.category}
              condition={p.condition}
              negotiable={p.negotiable}
              tags={p.tags}
              createdAt={p.createdAt}
              catalogCode={p.catalogCode}
              showCatalogCode={true}
            />
        ))}
      </Box>
    </Box>
    </>
  );
};

export default Catalogus;
