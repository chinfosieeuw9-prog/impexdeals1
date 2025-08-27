import React, { useEffect, useState } from 'react';
import { usePageMeta } from '../hooks/usePageMeta';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getProduct, publishProduct, removeProduct, extendProductExpiry, duplicateProduct } from '../services/productService';
import { isFavorite, toggleFavorite } from '../services/favoritesService';
import ConfirmDeleteDialog from '../components/ConfirmDeleteDialog';
import { getCurrentUser } from '../services/authService';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import StructuredData from '../components/StructuredData';

const ProductDetail: React.FC = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const me = getCurrentUser();
	const [notFound,setNotFound] = useState(false);
	const [product,setProduct] = useState<any>(null);
	const [copySnack,setCopySnack] = useState(false);
	const [fav,setFav] = useState(false);
	const [showDelete,setShowDelete] = useState(false);
	const [deleting,setDeleting] = useState(false);
	useEffect(()=> {
		if (!id) return;
		const p = getProduct(id);
		if (!p) { setNotFound(true); return; }
		setProduct(p);
		setFav(isFavorite(id));
	},[id]);

	// SEO meta via hook
	usePageMeta(product ? {
		title: product.title + ' | ImpexDeals',
		description: (product.description||'').slice(0,160),
		canonicalPath: `/product/${product.id}`,
		type: 'product',
		imageUrl: product.images?.[0]?.url || product.images?.[0]?.dataUrl
	} : {});
	if (notFound) return <Box sx={{p:3}}><Typography>Niet gevonden.</Typography></Box>;
	if (!product) return <Box sx={{p:3}}><Typography>Laden...</Typography></Box>;
	// Breadcrumb structured data
	const breadcrumbJson = {
		"@context":"https://schema.org",
		"@type":"BreadcrumbList",
		"itemListElement":[
			{"@type":"ListItem","position":1,"name":"Home","item": window.location.origin + '/'},
			{"@type":"ListItem","position":2,"name":"Partijen","item": window.location.origin + '/partijen'},
			{"@type":"ListItem","position":3,"name": product.title, "item": window.location.origin + '/product/' + product.id}
		]
	};
	const contactHref = `/berichten?to=${product.ownerId}&user=${encodeURIComponent(product.ownerName||'')}&product=${product.id}`;
	const isOwner = me && me.id === product.ownerId;
		const daysLeft = product.expiresAt ? Math.ceil((product.expiresAt - Date.now()) / (24*60*60*1000)) : undefined;
		const expired = daysLeft !== undefined && daysLeft < 0;
		return (
		<Box sx={{ maxWidth:1100, mx:'auto', p:3, display:'flex', flexDirection:'column', gap:3 }}>
			<StructuredData product={product} />
			<script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(breadcrumbJson)}</script>
			<Box sx={{ fontSize:13, display:'flex', gap:1, flexWrap:'wrap', color:'text.secondary' }}>
				<Link to="/" style={{ textDecoration:'none', color:'inherit' }}>Home</Link>
				<span>/</span>
				<Link to="/partijen" style={{ textDecoration:'none', color:'inherit' }}>Partijen</Link>
				<span>/</span>
				<Typography component="span" sx={{ fontWeight:600 }}>{product.title}</Typography>
			</Box>
			<Button variant="text" onClick={()=>navigate(-1)}>← Terug</Button>
			<Box sx={{ display:'flex', flexDirection:{xs:'column', md:'row'}, gap:4 }}>
				<Box sx={{ flex:1, display:'flex', flexDirection:'column', gap:2 }}>
												<Box sx={{ width:'100%', aspectRatio:'4/3', background:'#eef4fa', borderRadius:2, overflow:'hidden', position:'relative', display:'flex', alignItems:'center', justifyContent:'center' }}>
																<Box component="img"
																												src={
																													product.images?.[0]?.url
																														? (product.images?.[0]?.url.startsWith('http')
																																? product.images?.[0]?.url
																																: 'http://localhost:4000' + product.images?.[0]?.url)
																														: (product.images?.[0]?.dataUrl || "https://via.placeholder.com/400x300?text=Geen+foto")
																												}
																	alt={product.title}
																	sx={{ width:'100%', height:'100%', objectFit:'cover', opacity: (product.images?.[0]?.url || product.images?.[0]?.dataUrl) ? 1 : 0.7 }}
																/>
																						{product.catalogCode && (
																							<Box sx={{ position:'absolute', right:10, bottom:10, zIndex:2 }}>
																								<Typography variant="caption" sx={{ fontSize:10, opacity:.55, fontFamily:'monospace', background:'#f5f5f5', px:0.7, py:0.2, borderRadius:1 }}>Ref: {product.catalogCode}</Typography>
																							</Box>
																						)}
																						{/* DEBUG: toon image url/dataUrl */}
																						<Box sx={{ position:'absolute', left:10, bottom:10, zIndex:2, background:'#fffbe6', color:'#ad8b00', px:1, py:0.5, borderRadius:1, fontSize:10, opacity:.85 }}>
																							<div>url: {product.images?.[0]?.url?.slice(0,40) || '-'}</div>
																							<div>dataUrl: {product.images?.[0]?.dataUrl ? '[base64]' : '-'}</div>
																						</Box>
												</Box>
					<Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>
						{product.images?.slice(1).map((img:any)=> <Box key={img.id} component="img" src={img.url || img.dataUrl} alt="thumb" sx={{ width:80, height:80, objectFit:'cover', borderRadius:1 }} />)}
					</Box>
				</Box>
				<Box sx={{ flex:1.2, display:'flex', flexDirection:'column', gap:2 }}>
					<Typography variant="h4" fontWeight={700}>{product.title}</Typography>
					{/* Deelbare link */}
					<Stack direction="row" spacing={1} alignItems="center">
						<Button size="small" variant="outlined" startIcon={<LinkIcon />} component={Link} to={`/product/${product.id}`} target="_blank">
							Open link
						</Button>
						<Tooltip title="Kopieer link">
							<IconButton size="small" onClick={()=>{ try { navigator.clipboard.writeText(window.location.origin + '/product/' + product.id); setCopySnack(true); } catch { /* ignore */ } }}>
								<ContentCopyIcon fontSize="inherit" />
							</IconButton>
						</Tooltip>
					</Stack>
					<Stack direction="row" spacing={1} flexWrap="wrap">
						<Chip label={product.category} color="primary" />
						<Chip label={product.condition} color="success" />
						{product.isNew && <Chip label="Nieuw" color="secondary" />}
						{product.isDraft && <Chip label="Concept" color="warning" />}
						{product.negotiable && <Chip label="Onderhandelbaar" />}
						{product.vatIncluded && <Chip label="Incl. BTW" size="small" />}
					</Stack>
					   <Typography variant="h5" fontWeight={700}>€ {typeof product.price === 'number' ? product.price.toLocaleString('nl-NL') : (Number(product.price)||0).toLocaleString('nl-NL')}</Typography>
					<Typography variant="body1" sx={{ whiteSpace:'pre-wrap' }}>{product.description}</Typography>
					<Typography variant="body2" sx={{ opacity:.7 }}>Aantal: {product.qty}{product.minOrder? ` | Min. order: ${product.minOrder}`:''}</Typography>
					{product.brand && <Typography variant="body2">Merk: {product.brand}</Typography>}
					{product.externalLink && <Typography variant="body2">Link: <a href={product.externalLink} target="_blank" rel="noopener noreferrer">{product.externalLink}</a></Typography>}
					{product.location && <Typography variant="body2">Locatie: {product.location}</Typography>}
					   {product.shippingMethods && product.shippingMethods.length>0 && <Typography variant="body2">Verzending: {product.shippingMethods.join(', ')}</Typography>}
								   {product.expiresAt && !isNaN(new Date(product.expiresAt).getTime()) ? (
									   <Typography variant="caption" sx={{ color: expired ? 'error.main' : (daysLeft!==undefined && daysLeft <=5 ? 'warning.main':'text.secondary'), fontWeight:500 }}>
										   {expired ? 'Verlopen op ' : 'Vervalt: '} {new Date(product.expiresAt).toLocaleDateString()} {(!expired && daysLeft!==undefined) && `(${daysLeft}d)`}
									   </Typography>
								   ) : (
									   <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight:500 }}>
										   Geen vervaldatum
									   </Typography>
								   )}
					{product.tags && product.tags.length>0 && <Box sx={{ display:'flex', gap:1, flexWrap:'wrap' }}>{product.tags.map((t:string)=> <Chip key={t} label={t} size="small" />)}</Box>}
					<Divider />
					<Stack direction="row" spacing={2} flexWrap="wrap">
									<Button
										variant="contained"
										disabled={!me || isOwner || product.isDraft}
										onClick={() => {
											// Start een nieuwe conversatie met productcontext en onderwerp
											  const ref = Date.now().toString(36).toUpperCase();
											  let naam = product.title || '';
											  if (naam.length > 22) naam = naam.slice(0, 19) + '...';
											  const subject = `[${naam}[${ref}]] Beste ${product.ownerName}, ik heb interesse in uw product.`;
											  navigate(`/berichten?to=${product.ownerId}&user=${encodeURIComponent(product.ownerName||'')}&product=${product.id}&prefill=${encodeURIComponent(subject)}`);
										}}
									>Bericht verkoper</Button>
									{isOwner && <Button variant="outlined" component={Link} to={`/product/${product.id}/bewerken`}>Bewerken</Button>}
									{isOwner && !product.isDraft && <Button variant="outlined" color="secondary" onClick={()=>{ const upd = extendProductExpiry(product.id, 7); if (upd) setProduct({...upd}); }}>
										Verleng +7d
									</Button>}
						{isOwner && product.isDraft && <Button variant="contained" color="success" onClick={()=>{ publishProduct(product.id); setProduct({ ...product, isDraft:false}); }}>Publiceer</Button>}
						{isOwner && <Button variant="text" color="error" onClick={()=> setShowDelete(true)}>Verwijder</Button>}
						<Button size="small" variant={fav? 'contained':'outlined'} color={fav? 'secondary':'primary'} onClick={()=> setFav(toggleFavorite(product.id))}>{fav? 'Favoriet':'Favoriet +'}</Button>
						{isOwner && <Button size="small" variant="outlined" onClick={()=>{ const c = duplicateProduct(product.id); if(c) navigate('/product/'+c.id+'/bewerken'); }}>Dupliceer</Button>}
					</Stack>
				</Box>
			</Box>
		<Snackbar open={copySnack} autoHideDuration={1800} onClose={()=>setCopySnack(false)} anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert severity="success" variant="filled" sx={{ fontSize:13, py:0.5 }}>Link gekopieerd</Alert>
      </Snackbar>
		<ConfirmDeleteDialog
			open={showDelete}
			itemLabel={product.title}
			onClose={()=> setShowDelete(false)}
			loading={deleting}
			requirePhrase="VERWIJDER"
			onConfirm={async ()=>{
				setDeleting(true);
				try { removeProduct(product.id); navigate('/mijn-producten'); }
				finally { setDeleting(false); }
			}}
		/>
		</Box>
	);
};
export default ProductDetail;
