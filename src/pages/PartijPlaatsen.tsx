import React, { useState, useRef, useEffect } from 'react';
import { addProduct } from '../services/productService';
import { validateProductDraft } from '../services/validationService';
import { getCurrentUser } from '../services/authService';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';

const categorieen = ['Elektronica','Kleding','Huishoud','Speelgoed','Schoenen','Beauty','Sport'];
const locaties = ['BREDA','AMSTERDAM','ROTTERDAM','UTRECHT','EINDHOVEN','GRONINGEN','MAASTRICHT'];
// Locaties zijn nu beperkt tot deze 7 steden
const condities = ['NIEUW','GOED','REDELIJK'];
const shippingOptions = ['Afhalen','PostNL','DHL','DPD','Internationaal'];

interface LocalPreview { id: string; file: File; url: string; }

const MAX_FILES = 4;
const MAX_SIZE = 1024 * 1024; // 1MB
const ALLOWED_TYPES = ['image/jpeg','image/jpg','image/png'];

const expiryMs = 5*24*60*60*1000;
const PartijPlaatsen: React.FC = () => {
		// Genereer compact referentie zonder REF- prefix, alleen [XXXXXXX]
		const [refNum] = useState(() => {
			const base = Date.now().toString(36).toUpperCase();
			return `[${base}]`;
		});
	const user = getCurrentUser();
	const navigate = useNavigate();
	const [title,setTitle] = useState('');
	const [category,setCategory] = useState('Elektronica');
	const [price,setPrice] = useState('');
	const [qty,setQty] = useState('');
	const [condition,setCondition] = useState('NIEUW');
	const [description,setDescription] = useState('');
	// Merk veld verwijderd
	const [externalLink,setExternalLink] = useState('');
	const [tags,setTags] = useState<string[]>([]);
	const [tagInput,setTagInput] = useState('');
	const [location,setLocation] = useState(locaties[0]);
	const [minOrder,setMinOrder] = useState('');
	const [negotiable,setNegotiable] = useState(true);
	const [vatIncluded,setVatIncluded] = useState(true);
	const [shippingMethods,setShippingMethods] = useState<string[]>(['Afhalen']);
		// Vervaldatum is een vaste periode, standaard 5 dagen
			const vervalOpties = React.useMemo(() => [5, 7, 14, 30], []);
		const [vervalDagen, setVervalDagen] = useState<number>(5);
		const expiresAt = React.useMemo(() => {
				const d = new Date(Date.now() + vervalOpties.find(v=>v===vervalDagen)!*24*60*60*1000);
				return d.toISOString().slice(0,10);
			}, [vervalDagen, vervalOpties]);
		const [attempted,setAttempted] = useState(false);
	const [images,setImages] = useState<LocalPreview[]>([]);
	const [loading,setLoading] = useState(false);
	const [snack,setSnack] = useState<{open:boolean;msg:string;severity:'success'|'error'}>({open:false,msg:'',severity:'success'});
	const [serverErrors,setServerErrors] = useState<string[]>([]);
	const serverErrRef = useRef<HTMLDivElement|null>(null);

	// Scroll naar server error blok zodra fouten verschijnen
	useEffect(()=>{
		if (serverErrors.length && serverErrRef.current) {
			serverErrRef.current.scrollIntoView({behavior:'smooth', block:'start'});
		}
	}, [serverErrors]);

	if (!user) return <Box sx={{p:3}}><Typography>Log in om een product te plaatsen.</Typography></Box>;

	const descriptionLen = description.trim().length;
	const valid = !!(title.trim() && descriptionLen >= 20 && price && Number(price) > 0 && qty && Number(qty) > 0 && location.trim() && shippingMethods.length>0);

	// Helper om te checken of een specifieke server fout aanwezig is
	const hasServerErr = (fragment: string) => serverErrors.some(e => e.includes(fragment));


	const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;
		let rejectedType = 0, rejectedSize = 0, rejectedOverflow = 0;
		const next: LocalPreview[] = [];
		const remaining = MAX_FILES - images.length;
		if (remaining <= 0) { setSnack({open:true,msg:`Maximaal ${MAX_FILES} afbeeldingen.`,severity:'error'}); return; }
		for (const f of Array.from(e.target.files)) {
			if (next.length >= remaining) { rejectedOverflow++; break; }
			if (!ALLOWED_TYPES.includes(f.type)) { rejectedType++; continue; }
			if (f.size > MAX_SIZE) { rejectedSize++; continue; }
			next.push({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) });
		}
		if (next.length) setImages(prev => [...prev, ...next]);
		if (rejectedType || rejectedSize || rejectedOverflow) {
			const parts: string[] = [];
			if (rejectedType) parts.push(`${rejectedType} ongeldig type`);
			if (rejectedSize) parts.push(`${rejectedSize} >1MB`);
			if (rejectedOverflow) parts.push('limiet bereikt');
			setSnack({open:true,msg:`Niet toegevoegd: ${parts.join(', ')}`,severity:'error'});
		}
	};
	const removeImage = (id: string) => setImages(prev => prev.filter(p=>p.id!==id));

	const addTag = () => {
		const v = tagInput.trim();
		if (v && !tags.includes(v)) setTags(t=>[...t,v]);
		setTagInput('');
	};
	const removeTag = (t: string) => setTags(tags.filter(x=>x!==t));

	const toggleShipping = (opt: string) => {
		setShippingMethods(curr => curr.includes(opt) ? curr.filter(o=>o!==opt) : [...curr, opt]);
	};

		const handleSubmit = async (e: React.FormEvent, draft=false) => {
		e.preventDefault();
		if (!attempted) setAttempted(true);
		if (!valid && !draft) { setSnack({open:true,msg:'Vul alle verplichte velden in (titel, categorie, prijs >0, aantal >0, locatie, beschrijving, datum, verzendmethode).',severity:'error'}); return; }
		// Server-side (placeholder) validatie
		const validationErrors = await validateProductDraft({
			title: title.trim(),
			description: description.trim(),
			price: Number(price),
			qty: Number(qty),
			imagesCount: images.length,
			category, condition, tags, isDraft: draft
		});
		if (validationErrors.length) { setServerErrors(validationErrors); setSnack({open:true,msg:'Server validatie fouten',severity:'error'}); return; } else setServerErrors([]);
		setLoading(true);
			try {
			// Gebruik gekozen datum als vervaldatum
			const expTs = expiresAt ? new Date(expiresAt).setHours(23,59,59,999) : Date.now() + expiryMs;
				const product = await addProduct({
				title: title.trim(),
				category,
				price: Number(price),
				qty: Number(qty),
				condition,
				description: description.trim(),
		images: images.length > 0 ? images.map(i=>i.file) : [],
				// Merk veld verwijderd
				externalLink: externalLink.trim() || undefined,
				tags,
				location: location.trim() || undefined,
				minOrder: minOrder ? Number(minOrder) : undefined,
				negotiable,
				vatIncluded,
				shippingMethods,
					expiresAt: expTs,
					isDraft: draft
			});
			setSnack({open:true,msg:'Product toegevoegd!',severity:'success'});
			setTimeout(()=> navigate('/product/' + product.id), 800);
		} catch {
			setSnack({open:true,msg:'Fout bij toevoegen',severity:'error'});
		} finally { setLoading(false); }
	};

	return (
		<Box component="form" onSubmit={(e)=>handleSubmit(e,false)} sx={{ maxWidth: 1100, mx:'auto', p:3, display:'flex', flexDirection:'column', gap:3 }}>
			<Box sx={{ display:'flex', gap:1, alignItems:'center' }}>
				<Button variant="text" onClick={()=>navigate(-1)}>← Terug</Button>
				<Button variant="text" onClick={()=>navigate('/mijn-producten')}>Mijn Producten</Button>
			</Box>
			<Typography variant="h4" fontWeight={700}>Nieuw Product Plaatsen</Typography>
			<Typography variant="subtitle2" sx={{ fontFamily:'monospace', opacity:.7, mb:1 }}>Referentie: {refNum}</Typography>
				{serverErrors.length>0 && (
						<Box ref={serverErrRef} sx={{ bgcolor:'#fff3e0', border:'1px solid #ffcc80', p:2, borderRadius:1 }}>
							<Typography variant="subtitle2" sx={{ fontWeight:700, mb:1, color:'#e65100' }}>Server validatie</Typography>
							<Box component="ul" sx={{ m:0, pl:2 }}>
								{serverErrors.map((er,i)=>(<Box key={i} component="li" sx={{ color:'#e65100', fontSize:13 }}>{er}</Box>))}
							</Box>
						</Box>
					)}
					<Box sx={{
						display:'grid',
						gap:2,
						gridTemplateColumns:{ xs:'1fr', md:'repeat(12, 1fr)'}
					}}>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 6'} }}><TextField label="Titel *" value={title} onChange={e=>setTitle(e.target.value)} fullWidth required error={(attempted && !title.trim()) || hasServerErr('Titel minimaal') || hasServerErr('Titel maximaal')} helperText={(attempted && !title.trim()) ? 'Verplicht' : hasServerErr('Titel minimaal') ? 'Minimaal 5 tekens' : hasServerErr('Titel maximaal') ? 'Maximaal 120 tekens' : ''} /></Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 3'} }}><TextField select required label="Categorie *" value={category} onChange={e=>setCategory(e.target.value)} fullWidth error={attempted && !category} helperText={attempted && !category? 'Verplicht':''}>{categorieen.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Box>
						<Box sx={{ gridColumn:{ xs:'1 / span 6', md:'span 1'} }}><TextField label="Prijs (€) *" type="number" value={price} onChange={e=>setPrice(e.target.value)} fullWidth required error={attempted && (!price || Number(price)<=0)} helperText={attempted && (!price || Number(price)<=0)? 'Verplicht (>0)': ''} /></Box>
						<Box sx={{ gridColumn:{ xs:'1 / span 6', md:'span 1'} }}><TextField label="Aantal *" type="number" value={qty} onChange={e=>setQty(e.target.value)} fullWidth required error={attempted && (!qty || Number(qty)<=0)} helperText={attempted && (!qty || Number(qty)<=0)? 'Verplicht (>0)': ''} /></Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 3'} }}><TextField select label="Conditie" value={condition} onChange={e=>setCondition(e.target.value)} fullWidth>{condities.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}</TextField></Box>
						{/* Merk veld verwijderd */}
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 3'} }}><TextField label="Externe link (optioneel)" value={externalLink} onChange={e=>setExternalLink(e.target.value)} fullWidth placeholder="https://..." /></Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 3'} }}>
							<TextField select label="Locatie *" value={location} onChange={e=>setLocation(e.target.value)} fullWidth required error={attempted && !location.trim()} helperText={attempted && !location.trim()? 'Verplicht':''}>
								{locaties.map(l => <MenuItem key={l} value={l}>{l}</MenuItem>)}
							</TextField>
						</Box>
							<Box sx={{ gridColumn:{ xs:'1 / span 6', md:'span 2'} }}>
								<TextField label="Min. order" type="number" value={minOrder} onChange={e=>setMinOrder(e.target.value)} fullWidth helperText="Minimale afname per bestelling" />
							</Box>
							<Box sx={{ gridColumn:{ xs:'1 / span 6', md:'span 2'} }}>
								<TextField select label="Geldigheid *" value={vervalDagen} onChange={e=>setVervalDagen(Number(e.target.value))} fullWidth required helperText="Kies hoelang het product zichtbaar is">
									{vervalOpties.map(d => <MenuItem key={d} value={d}>{d} dagen</MenuItem>)}
								</TextField>
								<TextField label="Vervalt op" value={expiresAt} fullWidth InputProps={{ readOnly: true }} sx={{ mt:1 }} />
							</Box>
						<Box sx={{ gridColumn:'1 / -1' }}><TextField label="Beschrijving *" value={description} onChange={e=>setDescription(e.target.value)} fullWidth required multiline minRows={5} error={(attempted && descriptionLen < 20) || hasServerErr('Beschrijving minimaal') || hasServerErr('Beschrijving maximaal')} helperText={(() => {
							if (descriptionLen === 0 && attempted) return 'Verplicht';
							if (descriptionLen < 20) return `Minimaal 20 tekens (${descriptionLen}/20)`;
							if (hasServerErr('Beschrijving maximaal')) return 'Te lang (max 5000)';
							return `${descriptionLen} tekens`;
						})()} /></Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 6'} }}>
					<TextField label="Tags toevoegen" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); addTag(); } }} fullWidth helperText="Druk Enter om tag toe te voegen" />
					<Box sx={{ mt:1, display:'flex', gap:1, flexWrap:'wrap' }}>{tags.map(t=> <Chip key={t} label={t} onDelete={()=>removeTag(t)} />)}</Box>
						</Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 6'} }}>
				<Typography variant="subtitle1" fontWeight={600} mb={1}>Verzendmethoden * {attempted && shippingMethods.length===0 && <Typography component="span" variant="caption" color="error">(kies min. 1)</Typography>}</Typography>
				<Box sx={{ display:'flex', gap:1, flexWrap:'wrap', p:1, borderRadius:1, border: attempted && shippingMethods.length===0 ? '1px solid #d32f2f':'1px solid transparent', transition:'border .2s' }}>
						{shippingOptions.map(opt => {
							const active = shippingMethods.includes(opt);
							return <Chip key={opt} label={opt} color={active? 'primary':'default'} onClick={()=>toggleShipping(opt)} variant={active? 'filled':'outlined'} />;
						})}
					</Box>
						</Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 6'} }}>
					<FormControlLabel control={<Switch checked={negotiable} onChange={e=>setNegotiable(e.target.checked)} />} label="Prijs onderhandelbaar" />
					<FormControlLabel control={<Switch checked={vatIncluded} onChange={e=>setVatIncluded(e.target.checked)} />} label="Prijs incl. BTW" />
						</Box>
						<Box sx={{ gridColumn:{ xs:'1 / -1', md:'span 6'} }}>
						<Typography variant="subtitle1" fontWeight={600}>Afbeeldingen ({images.length}/{MAX_FILES})</Typography>
						<Button variant="outlined" component="label" sx={{ mt:1 }}>
							Kies bestanden
							<input type="file" multiple accept="image/jpeg,image/png,image/webp" hidden onChange={handleFiles} />
						</Button>
						<Typography variant="caption" sx={{ mt:1, display:'block', opacity:.65 }}>Upload: JPG/PNG/WebP, ≤1MB (client) / serverlimiet 5MB, max {MAX_FILES}.</Typography>
						<Box sx={{ mt:2, display:'flex', gap:1.5, flexWrap:'wrap' }}>
							{images.map(img => (
								<Box key={img.id} sx={{ position:'relative', width:110, height:110, borderRadius:2, overflow:'hidden', boxShadow:'0 2px 6px rgba(0,0,0,.2)' }}>
											<Box component="img" src={img.url} alt="preview" sx={{ width:'100%', height:'100%', objectFit:'cover' }} />
									<Tooltip title="Verwijderen"><IconButton size="small" onClick={()=>removeImage(img.id)} sx={{ position:'absolute', top:2, right:2, bgcolor:'rgba(0,0,0,.55)', color:'#fff', '&:hover':{bgcolor:'rgba(0,0,0,.75)'} }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
								</Box>
							))}
						</Box>
						</Box>
					</Box>
			<Divider />
			<Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
			<Button type="submit" variant="contained" disabled={!valid || loading}>{loading ? 'Opslaan...' : 'Publiceren'}</Button>
			<Button type="button" variant="outlined" disabled={loading} onClick={(e)=>handleSubmit(e as any, true)}>Opslaan als concept</Button>
				<Button type="button" variant="text" onClick={()=>navigate(-1)}>Annuleren</Button>
				{attempted && !valid && <Typography variant="caption" color="error">Vereist: titel, categorie, prijs &gt;0, aantal &gt;0, locatie, beschrijving (≥20 tekens), datum, verzendmethode, ≥1 afbeelding.</Typography>}
			</Box>
			<Snackbar open={snack.open} autoHideDuration={3000} onClose={()=>setSnack(s=>({...s,open:false}))}>
				<Alert severity={snack.severity} variant="filled">{snack.msg}</Alert>
			</Snackbar>
		</Box>
	);
};

export default PartijPlaatsen;
