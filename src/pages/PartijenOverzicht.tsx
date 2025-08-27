import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePageMeta } from '../hooks/usePageMeta';
import { getProducts, getProductsByUser, fetchProductsPage } from '../services/productService';
import { getCurrentUser } from '../services/authService';
import type { Product } from '../types/product';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import EnhancedProductCard from '../components/EnhancedProductCard';
import SkeletonProductCard from '../components/SkeletonProductCard';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';

const PartijenOverzicht: React.FC = () => {
	const location = useLocation();
	const navigate = useNavigate();
	// Parse initial query params (page + filters + drafts)
	const initialParams = (()=> {
		try {
			const sp = new URLSearchParams(location.search);
			const pageStr = sp.get('page');
			const page = (()=> { const n = pageStr? parseInt(pageStr,10):1; return isNaN(n)||n<1?1:n; })();
			return {
				page,
				search: sp.get('q') || '',
				category: sp.get('cat') || '',
				minPrice: sp.get('min') || '',
				maxPrice: sp.get('max') || '',
				sort: (sp.get('sort') as any) || 'newest',
				showDrafts: sp.get('drafts') === '1'
			};
		} catch { return { page:1, search:'', category:'', minPrice:'', maxPrice:'', sort:'newest', showDrafts:false }; }
	})();
	const initialPageParam = initialParams.page;
	const [products,setProducts] = useState<Product[]>([]);
	const [page,setPage] = useState(initialPageParam);
	const [totalPages,setTotalPages] = useState(1);
	const [loadingMore,setLoadingMore] = useState(false);
	const [initialLoaded,setInitialLoaded] = useState(false);
	const [draftCount,setDraftCount] = useState(0);
	const [loading,setLoading] = useState(true);
	const [showDrafts,setShowDrafts] = useState(initialParams.showDrafts);
	const [myDrafts,setMyDrafts] = useState<Product[]>([]);
	// Filters initialized from URL params
	const [search,setSearch] = useState(initialParams.search);
	const [category,setCategory] = useState(initialParams.category);
	const [minPrice,setMinPrice] = useState(initialParams.minPrice);
	const [maxPrice,setMaxPrice] = useState(initialParams.maxPrice);
	const [sort,setSort] = useState<'newest'|'priceAsc'|'priceDesc'|'qtyDesc'>(initialParams.sort);
	// Nieuwe filters
	const [brand,setBrand] = useState('');
	const [negotiableOnly,setNegotiableOnly] = useState(false);
	const [tagInput,setTagInput] = useState('');
	const [tags,setTags] = useState<string[]>([]);
	const [facets,setFacets] = useState<{ categories:{ value:string; count:number }[]; brands:{ value:string; count:number }[] }|undefined>();
	const [compactCards,setCompactCards] = useState(true);

	// Init load (respect page query - sequentially load pages up to that page for continuity, server-side filters applied)
	useEffect(()=>{
	 let active = true;
	 (async()=>{
	 	 try {
	 		 const targetPage = initialPageParam;
	 		 let aggregated: Product[] = [];
	 		 let lastRes: any = null;
				for (let p=1; p<=targetPage; p++) {
					const res = await fetchProductsPage(p, 20, {
						category: initialParams.category || undefined,
						q: initialParams.search || undefined,
						minPrice: initialParams.minPrice || undefined,
						maxPrice: initialParams.maxPrice || undefined,
						sort: initialParams.sort as any,
						facets: p===1
					});
	 		 	if(!active) return;
	 		 	aggregated = [...aggregated, ...res.items];
	 		 	lastRes = res;
					if (p===1 && res.facets) setFacets(res.facets);
	 		 }
	 		 if (!active) return;
	 		 setProducts(aggregated);
	 		 setPage(lastRes.page);
	 		 setTotalPages(lastRes.totalPages);
	 		 setInitialLoaded(true);
	 		 const me = getCurrentUser();
	 		 if (me) {
	 		 	const mine = getProductsByUser(me.id);
	 		 	const drafts = mine.filter(pr=>pr.isDraft);
	 		 	setDraftCount(drafts.length); setMyDrafts(drafts);
	 		 }
	 	 } catch(e) {
	 		 // fallback
	 		 const local = getProducts(); setProducts(local); setInitialLoaded(true); setPage(1); setTotalPages(1);
	 	 } finally { if(active) setLoading(false); }
	 })();
	 return ()=> { active=false; };
	 // eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const syncQuery = (nextPage:number, opts?: { resetPage?: boolean }) => {
		const sp = new URLSearchParams(location.search);
		if (nextPage>1) sp.set('page', String(nextPage)); else sp.delete('page');
		search ? sp.set('q', search) : sp.delete('q');
		category ? sp.set('cat', category) : sp.delete('cat');
		minPrice ? sp.set('min', minPrice) : sp.delete('min');
		maxPrice ? sp.set('max', maxPrice) : sp.delete('max');
		sort !== 'newest' ? sp.set('sort', sort) : sp.delete('sort');
		showDrafts ? sp.set('drafts','1') : sp.delete('drafts');
		navigate({ pathname: location.pathname, search: sp.toString() }, { replace:false });
	};
	// Sync on filter changes (debounced minimal)
	useEffect(()=> {
		// when filters change reset to page 1 and re-fetch first page
		syncQuery(1);
		let active = true;
		(async()=>{
			setLoading(true);
			try {
				const res = await fetchProductsPage(1,20, { category: category||undefined, q: search||undefined, minPrice: minPrice||undefined, maxPrice: maxPrice||undefined, sort: sort, brand: brand||undefined, negotiable: negotiableOnly||undefined, tags: tags.length? tags: undefined, facets: true });
				if(!active) return;
				setProducts(res.items); setPage(1); setTotalPages(res.totalPages);
						if (res.facets) setFacets(res.facets);
			} catch {
				// ignore
			} finally { if(active) { setLoading(false); } }
		})();
		return ()=> { active=false; };
		/* eslint-disable-next-line react-hooks/exhaustive-deps */
	}, [search,category,minPrice,maxPrice,sort]);
	const handleLoadMore = async()=> {
		if (loadingMore) return;
		if (page >= totalPages) return;
		setLoadingMore(true);
		try {
			const next = await fetchProductsPage(page+1, 20, { category: category||undefined, q: search||undefined, minPrice: minPrice||undefined, maxPrice: maxPrice||undefined, sort, brand: brand||undefined, negotiable: negotiableOnly||undefined, tags: tags.length? tags: undefined });
			setProducts(prev=>[...prev, ...next.items]);
			setPage(next.page); setTotalPages(next.totalPages);
			syncQuery(next.page);
		} finally { setLoadingMore(false); }
	};

	// Derived filtered list
	let allItems = [...products, ...(showDrafts? myDrafts: [])];
	// base sort later applied after filters depending on sort selection
	const filtered = allItems.filter(p => {
		if (category && p.category !== category) return false;
		if (search) {
			const s = search.toLowerCase();
			if (!p.title.toLowerCase().includes(s) && !(p.description||'').toLowerCase().includes(s)) return false;
		}
		if (minPrice) { const mn = Number(minPrice); if (!isNaN(mn) && p.price < mn) return false; }
		if (maxPrice) { const mx = Number(maxPrice); if (!isNaN(mx) && p.price > mx) return false; }
		return true;
	});
	// Apply sorting
	filtered.sort((a,b)=> {
		switch(sort){
			case 'priceAsc': return a.price - b.price || (b.createdAt - a.createdAt);
			case 'priceDesc': return b.price - a.price || (b.createdAt - a.createdAt);
			case 'qtyDesc': return b.qty - a.qty || (b.createdAt - a.createdAt);
			case 'newest': default: return b.createdAt - a.createdAt;
		}
	});
	const categories = useMemo(()=> Array.from(new Set([...products, ...myDrafts].map(p=>p.category))).sort(), [products,myDrafts]);
	const brandOptions = useMemo(()=> {
		const setB = new Set<string>(); [...products, ...myDrafts].forEach(p=> { if (p.brand) setB.add(p.brand); });
		if (facets?.brands) facets.brands.forEach(b=> b.value && setB.add(b.value));
		return Array.from(setB).sort();
	}, [products,myDrafts,facets]);
	const availableCategories = useMemo(()=> {
		if (facets?.categories?.length) return Array.from(new Set([...categories, ...facets.categories.map(c=>c.value)])).sort();
		return categories;
	}, [categories, facets]);

	// JSON-LD ProductList & Breadcrumb
	const listJson = useMemo(()=> {
		const items = filtered.slice(0,30).map((p,i)=> ({
			'@type':'ListItem',
			position: i+1,
			url: window.location.origin + '/product/' + p.id,
			name: p.title
		}));
		return {
			'@context':'https://schema.org',
			'@type':'ItemList',
			name:'Partijen Overzicht',
			itemListElement: items
		};
	},[filtered]);

	const breadcrumbJson = useMemo(()=> ({
		'@context':'https://schema.org',
		'@type':'BreadcrumbList',
		itemListElement:[
			{ '@type':'ListItem', position:1, name:'Home', item: window.location.origin + '/' },
			{ '@type':'ListItem', position:2, name:'Partijen', item: window.location.origin + '/partijen' }
		]
	}),[]);

	usePageMeta({
		title: page>1? `Partijen pagina ${page} | ImpexDeals` : 'Partijen Overzicht | ImpexDeals',
		description: 'Bekijk beschikbare partijen producten. Filter op categorie, prijs en meer.',
		canonicalPath: page>1? `/partijen?page=${page}` : '/partijen'
	});
	// Optional prev/next link tags for crawlers (some engines still use them)
	useEffect(()=> {
		const head = document.head;
		const rels = ['prev','next'];
		rels.forEach(r => {
			Array.from(head.querySelectorAll(`link[rel="${r}"]`)).forEach(el=> el.getAttribute('data-auto-page')==='1' && el.remove());
		});
		if (page>1) {
			const prev = document.createElement('link'); prev.rel='prev'; prev.setAttribute('data-auto-page','1'); prev.href = `${window.location.origin}/partijen${page-1>1? `?page=${page-1}`:''}`; head.appendChild(prev);
		}
		if (page<totalPages) {
			const nextL = document.createElement('link'); nextL.rel='next'; nextL.setAttribute('data-auto-page','1'); nextL.href = `${window.location.origin}/partijen?page=${page+1}`; head.appendChild(nextL);
		}
		return ()=> {
			rels.forEach(r => { Array.from(head.querySelectorAll(`link[rel="${r}"]`)).forEach(el=> el.getAttribute('data-auto-page')==='1' && el.remove()); });
		};
	}, [page,totalPages]);
	return (
			<Box sx={{ p:3, maxWidth:1200, mx:'auto' }}>
			<Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:2 }}>
				<Typography variant="h4" fontWeight={700}>Partijen Overzicht</Typography>
			</Box>
			{/* Structured Data */}
			<script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(listJson)}</script>
			<script type="application/ld+json" suppressHydrationWarning>{JSON.stringify(breadcrumbJson)}</script>
			{loading && !initialLoaded && (
				<Box sx={{ display:'flex', flexWrap:'wrap', gap:3.2, rowGap:4 }}>
					{Array.from({length:6}).map((_,i)=> <SkeletonProductCard compact key={i} />)}
				</Box>
			)}
			{/* Filter Pane */}
			<Box sx={{ mb:3, display:'flex', flexDirection:'column', gap:1.5, bgcolor:'rgba(0,0,0,0.03)', p:2, borderRadius:2, border:'1px solid rgba(0,0,0,0.08)' }}>
				<Box sx={{ display:'flex', gap:2, flexWrap:'wrap', alignItems:'center' }}>
					<TextField label="Zoek" size="small" value={search} onChange={e=>setSearch(e.target.value)} sx={{ minWidth:220 }} placeholder="titel of beschrijving" />
					<TextField label="Categorie" size="small" select value={category} onChange={e=>setCategory(e.target.value)} sx={{ minWidth:180 }}>
						<MenuItem value="">(Alle)</MenuItem>
						{availableCategories.map(c=> <MenuItem key={c} value={c}>{c}</MenuItem>)}
					</TextField>
					<TextField label="Merk" size="small" select value={brand} onChange={e=>setBrand(e.target.value)} sx={{ minWidth:160 }}>
						<MenuItem value="">(Alle)</MenuItem>
						{brandOptions.map(b=> <MenuItem key={b} value={b}>{b}</MenuItem>)}
					</TextField>
					<TextField label="Min €" size="small" type="number" value={minPrice} onChange={e=>setMinPrice(e.target.value)} sx={{ width:120 }} />
					<TextField label="Max €" size="small" type="number" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} sx={{ width:120 }} />
					<TextField label="Sorteer" size="small" select value={sort} onChange={e=> setSort(e.target.value as any)} sx={{ minWidth:170 }}>
						<MenuItem value="newest">Nieuwste eerst</MenuItem>
						<MenuItem value="priceAsc">Prijs ↑</MenuItem>
						<MenuItem value="priceDesc">Prijs ↓</MenuItem>
						<MenuItem value="qtyDesc">Aantal ↓</MenuItem>
					</TextField>
					<FormControlLabel control={<Switch checked={compactCards} onChange={e=>setCompactCards(e.target.checked)} size="small" />} label={<Typography variant="caption">Compacte kaarten</Typography>} />
					<FormControlLabel control={<Switch checked={negotiableOnly} onChange={e=>setNegotiableOnly(e.target.checked)} size="small" />} label={<Typography variant="caption">Onderhandelbaar</Typography>} />
					<Button variant="outlined" size="small" onClick={()=>{ setSearch(''); setCategory(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); }}>Reset</Button>
					<Box sx={{ display:'flex', alignItems:'center', gap:1 }}>
						<TextField label="Tag toevoegen" size="small" value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter' && tagInput.trim()){ e.preventDefault(); if(!tags.includes(tagInput.trim())) setTags(t=>[...t, tagInput.trim()]); setTagInput(''); } }} sx={{ width:160 }} />
						<Button size="small" onClick={()=>{ if(tagInput.trim() && !tags.includes(tagInput.trim())) { setTags(t=>[...t, tagInput.trim()]); setTagInput(''); } }}>Add</Button>
					</Box>
				</Box>
				{/* Tags chips */}
				{tags.length>0 && (
					<Box sx={{ display:'flex', flexWrap:'wrap', gap:1 }}>
						{tags.map(t=> <Box key={t} className="tag-chip" sx={{ px:1, py:0.25, bgcolor:'primary.light', color:'primary.dark', fontSize:12, borderRadius:1, display:'flex', alignItems:'center', gap:.5 }}>
							<span>{t}</span>
							<button className="tag-chip-remove" onClick={()=> setTags(ts=> ts.filter(x=>x!==t))}>×</button>
						</Box>)}
						<Button size="small" onClick={()=> setTags([])}>Clear tags</Button>
					</Box>
				)}
				<Divider flexItem sx={{ my:1 }} />
				<Typography variant="caption" sx={{ opacity:.75 }}>Gefilterd: {filtered.length} / {allItems.length}{facets? ` • Categorieën: ${facets.categories.length} • Merken: ${facets.brands.length}`:''}</Typography>
			</Box>
			{draftCount>0 && (
				<Box sx={{ mb:3, display:'flex', flexDirection:'column', gap:1 }}>
					<Typography variant="caption" sx={{ background:'#ffe9c7', color:'#8a4b00', px:1.5, py:0.5, borderRadius:1, fontWeight:500, display:'inline-block' }}>
						{draftCount} concept{draftCount!==1 && 'en'} van jou verborgen.
					</Typography>
					<FormControlLabel control={<Switch checked={showDrafts} onChange={(e)=>setShowDrafts(e.target.checked)} size="small" />} label={<Typography variant="caption" sx={{ fontWeight:500 }}>Toon mijn concepten</Typography>} />
				</Box>
			)}
			{initialLoaded && (
				<Box sx={{ display:'flex', flexWrap:'wrap', gap:3 }}>
					{filtered.map(p => (
						<EnhancedProductCard imageRatio="16/9"
							compact={compactCards}
							key={p.id}
							id={p.id}
							title={p.title}
							price={p.price}
							brand={p.brand}
							image={p.images?.[0]?.url || p.images?.[0]?.dataUrl}
							tags={p.tags}
							qty={p.qty}
							category={p.category}
							condition={p.condition}
							negotiable={p.negotiable}
							createdAt={p.createdAt}
						/>
					))}
				</Box>
			)}
			<Box sx={{ mt:3, display:'flex', justifyContent:'center' }}>
				{page < totalPages && (
					<Button variant="outlined" onClick={handleLoadMore} disabled={loadingMore}>
						{loadingMore? 'Laden...' : 'Meer laden'}
					</Button>
				)}
				{page >= totalPages && initialLoaded && (
					<Typography variant="caption" sx={{ opacity:.6 }}>Einde resultaten</Typography>
				)}
			</Box>
					  </Box>
	);
};
export default PartijenOverzicht;
