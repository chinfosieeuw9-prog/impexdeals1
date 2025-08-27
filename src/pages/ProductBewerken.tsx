import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, updateProduct, removeProduct, publishProduct, extendProductExpiry, duplicateProduct } from '../services/productService';
import { toggleFavorite, isFavorite } from '../services/favoritesService';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';
import { validateProductDraft } from '../services/validationService';
import { getCurrentUser } from '../services/authService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const categorieen = ['Elektronica','Kleding','Huishoud','Speelgoed','Schoenen','Beauty','Sport'];
const condities = ['NIEUW','GOED','REDELIJK'];

interface LocalPreview { id: string; file?: File; url: string; }
const MAX_FILES = 4;
const MAX_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png'];

const ProductBewerken: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const me = getCurrentUser();
  const [loaded,setLoaded] = useState(false);
  const [notFound,setNotFound] = useState(false);
  const [saving,setSaving] = useState(false);
  const [snack,setSnack] = useState<{open:boolean;msg:string;severity:'success'|'error'}>({open:false,msg:'',severity:'success'});
  const [title,setTitle] = useState('');
  const [category,setCategory] = useState('Elektronica');
  const [price,setPrice] = useState('');
  const [qty,setQty] = useState('');
  const [condition,setCondition] = useState('NIEUW');
  const [description,setDescription] = useState('');
  const [brand,setBrand] = useState('');
  const [externalLink,setExternalLink] = useState('');
  const [tags,setTags] = useState<string[]>([]);
  const [tagInput,setTagInput] = useState('');
  const [location,setLocation] = useState('');
  const [minOrder,setMinOrder] = useState('');
  const [negotiable,setNegotiable] = useState(true);
  const [vatIncluded,setVatIncluded] = useState(true);
  const [shippingMethods,setShippingMethods] = useState<string[]>([]);
  const [expiresAt,setExpiresAt] = useState<string>('');
  const [images,setImages] = useState<LocalPreview[]>([]);
  const [isDraft,setIsDraft] = useState(false);
  const [serverErrors,setServerErrors] = useState<string[]>([]);
  const [showDelete,setShowDelete] = useState(false);
  const [favorite,setFavorite] = useState(false);
  const [deleting,setDeleting] = useState(false);

  useEffect(()=>{
    if (!id) return; const p = getProduct(id); if (!p){ setNotFound(true); return; }
    if (!me || p.ownerId !== me.id){ setNotFound(true); return; }
    setTitle(p.title); setCategory(p.category); setPrice(String(p.price)); setQty(String(p.qty)); setCondition(p.condition);
  setDescription(p.description); setBrand(p.brand||''); setExternalLink(p.externalLink||''); setTags(p.tags||[]); setLocation(p.location||''); setMinOrder(p.minOrder? String(p.minOrder):'');
    setNegotiable(!!p.negotiable); setVatIncluded(!!p.vatIncluded); setShippingMethods(p.shippingMethods||[]); setExpiresAt(p.expiresAt? new Date(p.expiresAt).toISOString().slice(0,10):'');
  setImages(p.images.map(img=>({ id: img.id, url: (img as any).url || img.dataUrl }))); setIsDraft(!!p.isDraft); setFavorite(isFavorite(p.id)); setLoaded(true);
  },[id, me]);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const remaining = MAX_FILES - images.length;
    if (remaining <= 0) { setSnack({open:true,msg:`Maximaal ${MAX_FILES} afbeeldingen.`,severity:'error'}); return; }
    const added: LocalPreview[] = [];
    let rejectedType=0,rejectedSize=0,rejectedOverflow=0;
    for (const f of Array.from(e.target.files)) {
      if (added.length >= remaining) { rejectedOverflow++; break; }
      if (!ALLOWED_TYPES.includes(f.type)) { rejectedType++; continue; }
      if (f.size > MAX_SIZE) { rejectedSize++; continue; }
      added.push({ id: crypto.randomUUID(), file:f, url: URL.createObjectURL(f) });
    }
    if (added.length) setImages(prev => [...prev, ...added]);
    if (rejectedType || rejectedSize || rejectedOverflow) {
      const parts: string[] = [];
      if (rejectedType) parts.push(`${rejectedType} type`);
      if (rejectedSize) parts.push(`${rejectedSize} >1MB`);
      if (rejectedOverflow) parts.push('limiet bereikt');
      setSnack({open:true,msg:`Niet toegevoegd: ${parts.join(', ')}`,severity:'error'});
    }
  };
  const removeImage = (id: string) => setImages(prev => prev.filter(p=>p.id!==id));
  const toggleShip = (opt: string) => setShippingMethods(s => s.includes(opt)? s.filter(o=>o!==opt): [...s,opt]);
  const addTag = () => { const v = tagInput.trim(); if (v && !tags.includes(v)) setTags(t=>[...t,v]); setTagInput(''); };
  const removeTag = (t:string)=> setTags(tags.filter(x=>x!==t));

  const save = async (draft:boolean) => {
    if (!id) return; setSaving(true);
    try {
      const validationErrors = await validateProductDraft({
        title: title.trim(), description: description.trim(), price: Number(price), qty: Number(qty), imagesCount: images.length, category, condition, tags, isDraft: draft
      });
      if (validationErrors.length) { setServerErrors(validationErrors); setSnack({open:true,msg:'Server validatie fouten',severity:'error'}); setSaving(false); return; } else setServerErrors([]);
      const expTs = expiresAt ? new Date(expiresAt + 'T23:59:59').getTime() : undefined;
      const updated = await updateProduct(id, {
        title: title.trim(), category, price: Number(price), qty: Number(qty), condition, description: description.trim(),
        brand: brand.trim()||undefined, externalLink: externalLink.trim()||undefined, tags, location: location.trim()||undefined, minOrder: minOrder? Number(minOrder): undefined,
    negotiable, vatIncluded, shippingMethods, expiresAt: expTs, isDraft: draft,
  images: images.map(i=> i.file ? i.file : ({ id: i.id, url: i.url } as any))
      });
      setSnack({open:true,msg:'Opgeslagen',severity:'success'}); if (updated) setIsDraft(!!updated.isDraft);
      if (!draft) setTimeout(()=> navigate('/product/'+id), 600);
    } catch { setSnack({open:true,msg:'Fout bij opslaan',severity:'error'}); } finally { setSaving(false); }
  };

  if (notFound) return <Box sx={{p:3}}><Typography>Niet gevonden of geen toegang.</Typography></Box>;
  if (!loaded) return <Box sx={{p:3}}><Typography>Laden...</Typography></Box>;

  return (
    <Box sx={{ maxWidth:1100, mx:'auto', p:3, display:'flex', flexDirection:'column', gap:3 }}>
      <Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
        <Button variant="text" onClick={()=>navigate(-1)}>← Terug</Button>
        <Button variant="text" onClick={()=>navigate('/mijn-producten')}>Mijn Producten</Button>
      </Box>
      <Typography variant="h4" fontWeight={700}>Product bewerken {isDraft && <Chip label="Concept" color="warning" size="small" sx={{ ml:1 }}/>}</Typography>
      {serverErrors.length>0 && (
        <Box sx={{ bgcolor:'#fff3e0', border:'1px solid #ffcc80', p:2, borderRadius:1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight:700, mb:1, color:'#e65100' }}>Server validatie</Typography>
          <Box component="ul" sx={{ m:0, pl:2 }}>
            {serverErrors.map((er,i)=>(<Box key={i} component="li" sx={{ color:'#e65100', fontSize:13 }}>{er}</Box>))}
          </Box>
        </Box>
      )}
      <Box sx={{ display:'grid', gap:2, gridTemplateColumns:{ xs:'1fr', md:'repeat(12,1fr)'} }}>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 6'} }}><TextField label="Titel" value={title} onChange={e=>setTitle(e.target.value)} fullWidth /></Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3'} }}><TextField select label="Categorie" value={category} onChange={e=>setCategory(e.target.value)} fullWidth>{categorieen.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Box>
        <Box sx={{ gridColumn:{ xs:'1/ span 6', md:'span 1'} }}><TextField label="Prijs (€)" type="number" value={price} onChange={e=>setPrice(e.target.value)} fullWidth /></Box>
        <Box sx={{ gridColumn:{ xs:'1/ span 6', md:'span 1'} }}><TextField label="Aantal" type="number" value={qty} onChange={e=>setQty(e.target.value)} fullWidth /></Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3'} }}><TextField select label="Conditie" value={condition} onChange={e=>setCondition(e.target.value)} fullWidth>{condities.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Box>
  <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3'} }}><TextField label="Merk" value={brand} onChange={e=>setBrand(e.target.value)} fullWidth /></Box>
  <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3'} }}><TextField label="Externe link (optioneel)" value={externalLink} onChange={e=>setExternalLink(e.target.value)} fullWidth placeholder="https://..." /></Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 3'} }}><TextField label="Locatie" value={location} onChange={e=>setLocation(e.target.value)} fullWidth /></Box>
        <Box sx={{ gridColumn:{ xs:'1/ span 6', md:'span 2'} }}><TextField label="Min. order" type="number" value={minOrder} onChange={e=>setMinOrder(e.target.value)} fullWidth /></Box>
        <Box sx={{ gridColumn:{ xs:'1/ span 6', md:'span 2'} }}><TextField label="Vervalt (datum)" type="date" value={expiresAt} onChange={e=>setExpiresAt(e.target.value)} fullWidth InputLabelProps={{ shrink:true }} /></Box>
        <Box sx={{ gridColumn:'1/-1' }}><TextField label="Beschrijving" value={description} onChange={e=>setDescription(e.target.value)} fullWidth multiline minRows={5} /></Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 6'} }}>
          <TextField label="Tags" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(); } }} fullWidth helperText="Enter om toe te voegen" />
          <Box sx={{ mt:1, display:'flex', flexWrap:'wrap', gap:1 }}>{tags.map(t=> <Chip key={t} label={t} onDelete={()=>removeTag(t)} />)}</Box>
        </Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 6'} }}>
          <Typography variant="subtitle1" fontWeight={600} mb={1}>Verzending</Typography>
          {['Afhalen','PostNL','DHL','DPD','Internationaal'].map(opt=> {
            const active = shippingMethods.includes(opt);
            return <Chip key={opt} label={opt} color={active? 'primary':'default'} onClick={()=>toggleShip(opt)} variant={active? 'filled':'outlined'} sx={{ mr:1, mb:1 }} />;
          })}
        </Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 6'} }}>
          <FormControlLabel control={<Switch checked={negotiable} onChange={e=>setNegotiable(e.target.checked)} />} label="Onderhandelbaar" />
          <FormControlLabel control={<Switch checked={vatIncluded} onChange={e=>setVatIncluded(e.target.checked)} />} label="Incl. BTW" />
          <FormControlLabel control={<Switch checked={!isDraft} onChange={e=>setIsDraft(!e.target.checked)} />} label="Gepubliceerd" />
        </Box>
        <Box sx={{ gridColumn:{ xs:'1/-1', md:'span 6'} }}>
          <Typography variant="subtitle1" fontWeight={600}>Afbeeldingen</Typography>
          <Button variant="outlined" component="label" sx={{ mt:1 }} disabled={images.length >= MAX_FILES}>
            {images.length >= MAX_FILES ? 'Limiet bereikt' : 'Voeg toe'}
            <input type="file" multiple accept="image/jpeg,image/png" hidden onChange={handleFiles} />
          </Button>
          <Typography variant="caption" sx={{ display:'block', mt:1, opacity:.7 }}>Max {MAX_FILES} afbeeldingen, alleen JPG/PNG, ≤ 1MB per bestand.</Typography>
          <Box sx={{ mt:2, display:'flex', flexWrap:'wrap', gap:1 }}>
            {images.map(img => (
              <Box key={img.id} sx={{ width:100, height:100, position:'relative', borderRadius:2, overflow:'hidden', boxShadow:'0 2px 5px rgba(0,0,0,.25)' }}>
                <Box component="img" src={img.url} alt="preview" sx={{ width:'100%', height:'100%', objectFit:'cover' }} />
                <IconButton size="small" onClick={()=>removeImage(img.id)} sx={{ position:'absolute', top:2, right:2, bgcolor:'rgba(0,0,0,.55)', color:'#fff', '&:hover':{bgcolor:'rgba(0,0,0,.75)'} }}><DeleteIcon fontSize="small" /></IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
      <Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
        <Button variant="contained" disabled={saving} onClick={()=>save(false)}>{saving? 'Opslaan...' : 'Opslaan & Publiceren'}</Button>
        <Button variant="outlined" disabled={saving} onClick={()=>save(true)}>Opslaan als concept</Button>
        <Button variant="text" onClick={()=>navigate(-1)}>Annuleren</Button>
        {id && <Button variant="text" color="error" onClick={()=> setShowDelete(true)}>Verwijderen</Button>}
        {id && (
          <>
            {isDraft && <Button size="small" variant="outlined" color="success" onClick={()=>{ publishProduct(id); setIsDraft(false); setSnack({open:true,msg:'Gepubliceerd',severity:'success'}); }} sx={{ ml:1 }}>Publiceer</Button>}
            {!isDraft && <Button size="small" variant="outlined" onClick={()=>{ extendProductExpiry(id,7); setSnack({open:true,msg:'+7 dagen verlengd',severity:'success'}); }} sx={{ ml:1 }}>+7 dagen</Button>}
            <Button size="small" variant={favorite? 'contained':'outlined'} color="warning" onClick={()=>{ if(id){ toggleFavorite(id); setFavorite(isFavorite(id)); } }} sx={{ ml:1 }}>{favorite? '★ Fav':'☆ Fav'}</Button>
            <Button size="small" variant="outlined" onClick={()=>{ if(id){ const c = duplicateProduct(id); if(c){ navigate('/product/'+c.id+'/bewerken'); } } }} sx={{ ml:1 }}>Dupliceer</Button>
          </>
        )}
      </Box>
      <ConfirmDeleteDialog
        open={showDelete}
        itemLabel={title}
        onClose={()=> setShowDelete(false)}
        loading={deleting}
        onConfirm={async ()=>{
          if(!id) return; setDeleting(true);
          try { removeProduct(id); navigate('/mijn-producten'); }
          finally { setDeleting(false); }
        }}
        requirePhrase="VERWIJDER"
      />
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack(s=>({...s,open:false}))}>
        <Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};
export default ProductBewerken;