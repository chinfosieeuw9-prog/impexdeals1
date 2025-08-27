import { Product, ProductImage, NewProductInput } from '../types/product';
import { getCurrentUser, getAuthToken } from './authService';
import { API_BASE } from './apiClient';

const LS_KEY = 'impex_products_v1';
let products: Product[] = [];
let remoteAttempted = false; // eenmaal proberen server data te laden
// API_BASE nu centraal geregeld in apiClient.ts

// Interne teller voor lokaal gegenereerde catalogus codes (alleen fallback)
let localCatalogSeq = 0;
function generateCatalogCode(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  // verhoog tot uniek
  while (true) {
    localCatalogSeq++;
    const candidate = `P${year}-${localCatalogSeq.toString(36).toUpperCase().padStart(3,'0')}`;
    if (!products.find(p => p.catalogCode === candidate)) return candidate;
  }
}

async function tryLoadRemoteList() {
  if (remoteAttempted) return;
  remoteAttempted = true;
  try {
  const res = await fetch(`${API_BASE}/api/products`);
    if (!res.ok) return;
    const list = await res.json();
    if (Array.isArray(list) && list.length) {
      // Merge: vervang bestaande items met dezelfde id, behoud lokale drafts
      const localDrafts = products.filter(p => p.isDraft);
      const serverProducts: Product[] = list.map((p:any) => {
        const imgs = (p.images||[]).map((im:any)=> ({
          id: im.id || crypto.randomUUID(),
          dataUrl: im.dataUrl,
          url: im.url || (im.path ? (im.path.startsWith('http') ? im.path : `${API_BASE}${im.path.startsWith('/')?'':'/'}${im.path}`) : undefined)
        }));
        // fallback enkele veld image / imageUrl
        if ((!imgs || imgs.length===0) && (p.image || p.imageUrl)) {
          imgs.push({ id: crypto.randomUUID(), url: (p.image || p.imageUrl) });
        }
        const code = p.catalogCode || generateCatalogCode();
        return {
        id: p.id,
        catalogCode: code,
        title: p.title,
        category: p.category,
        price: p.price,
        qty: p.qty,
        condition: p.condition,
        description: p.description,
        images: imgs,
        createdAt: p.createdAt || Date.now(),
        ownerId: p.ownerId,
        ownerName: p.ownerName,
        tags: p.tags,
        location: p.location,
        minOrder: p.minOrder,
        negotiable: p.negotiable,
        vatIncluded: p.vatIncluded,
        shippingMethods: p.shippingMethods,
        expiresAt: p.expiresAt,
        brand: p.brand,
        externalLink: p.externalLink,
        isDraft: p.isDraft,
        };
      });
      products = [...serverProducts, ...localDrafts.filter(d => !serverProducts.find(sp => sp.id === d.id))];
    }
  } catch (e) {
    // Stil fallback naar localStorage seed
    console.warn('Remote products fetch faalde', e);
  }
}

function seed() {
  if (products.length) return;
  const now = Date.now();
  const seedData: Product[] = [
    { id: '1', title: 'Elektronica Mix Partij', category: 'Elektronica', price: 1250, qty: 300, condition: 'GOED', description: 'Diverse elektronica componenten en accessoires.', images: [{ id: 'img1', dataUrl: 'https://james.demandcluster.com/uploads/sample_electronics.jpg' }], createdAt: now - 100000, isNew: true, ownerId: 1, ownerName: 'admin' },
    { id: '2', title: 'Kleding Restanten Zomer', category: 'Kleding', price: 890, qty: 500, condition: 'NIEUW', description: 'Zomer collectie restanten, diverse maten.', images: [{ id: 'img2', dataUrl: 'https://james.demandcluster.com/uploads/sample_clothing.jpg' }], createdAt: now - 90000, isNew: true, ownerId: 2, ownerName: 'demo' },
    { id: '3', title: 'Huishoud Artikelen Batch', category: 'Huishoud', price: 640, qty: 420, condition: 'GOED', description: 'Keuken & schoonmaak accessoires mix.', images: [{ id: 'img3', dataUrl: 'https://james.demandcluster.com/uploads/sample_household.jpg' }], createdAt: now - 80000, ownerId: 1, ownerName: 'admin' },
    { id: '4', title: 'Speelgoed Seizoen Set', category: 'Speelgoed', price: 1450, qty: 260, condition: 'NIEUW', description: 'Seizoens speelgoed assortiment.', images: [{ id: 'img4', dataUrl: 'https://james.demandcluster.com/uploads/sample_toys.jpg' }], createdAt: now - 70000, ownerId: 2, ownerName: 'demo' },
    { id: '5', title: 'Schoenen Outlet Mix', category: 'Schoenen', price: 980, qty: 180, condition: 'GOED', description: 'Diverse modellen outlet schoenen.', images: [{ id: 'img5', dataUrl: 'https://james.demandcluster.com/uploads/sample_shoes.jpg' }], createdAt: now - 60000, ownerId: 1, ownerName: 'admin' },
    { id: '6', title: 'Keuken Accessoires', category: 'Huishoud', price: 560, qty: 350, condition: 'NIEUW', description: 'Keuken tools en gadgets.', images: [{ id: 'img6', dataUrl: 'https://james.demandcluster.com/uploads/sample_kitchen.jpg' }], createdAt: now - 50000, ownerId: 2, ownerName: 'demo' },
    { id: '7', title: 'Laptop Onderdelen', category: 'Elektronica', price: 2100, qty: 90, condition: 'GOED', description: 'Partij met laptop componenten.', images: [{ id: 'img7', dataUrl: 'https://james.demandcluster.com/uploads/sample_laptop_parts.jpg' }], createdAt: now - 40000, ownerId: 1, ownerName: 'admin' },
    { id: '8', title: 'Cosmetica Bulk', category: 'Beauty', price: 770, qty: 600, condition: 'NIEUW', description: 'Bulk cosmetica artikelen.', images: [{ id: 'img8', dataUrl: 'https://james.demandcluster.com/uploads/sample_cosmetics.jpg' }], createdAt: now - 30000, ownerId: 2, ownerName: 'demo' },
    { id: '9', title: 'Sport Artikelen Set', category: 'Sport', price: 1320, qty: 240, condition: 'GOED', description: 'Sport en fitness accessoires.', images: [{ id: 'img9', dataUrl: 'https://james.demandcluster.com/uploads/sample_sport.jpg' }], createdAt: now - 20000, ownerId: 1, ownerName: 'admin' },
  ];
  products = seedData;
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      products = JSON.parse(raw);
      // Backfill owner fields if missing (migration)
      let changed = false;
      products.forEach(p => {
        if (!('ownerId' in p)) { p.ownerId = 1; p.ownerName = 'admin'; changed = true; }
      });
      if (changed) persist();
    } else {
      seed();
      persist();
    }
  } catch {
    seed();
  }
}

function persist() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(products)); } catch {}
}

export function getProducts(): Product[] {
  if (!products.length) load();
  // async remote fetch op achtergrond
  tryLoadRemoteList();
  // Alleen gepubliceerde (geen draft)
  const now = Date.now();
  return products
    .filter(p => !p.isDraft && (!p.expiresAt || p.expiresAt > now))
    .slice()
    .sort((a,b) => b.createdAt - a.createdAt);
}

export function getProduct(id: string): Product | undefined {
  if (!products.length) load();
  // Als item niet bestaat proberen remote detail te halen (eenmalig voor dat id)
  let found = products.find(p => p.id === id);
  if (!found && !remoteAttempted) {
  tryLoadRemoteList();
  }
  if (!found) {
    // Losse fetch (niet blokkeren)
    (async()=>{
      try {
  const r = await fetch(`${API_BASE}/api/products/`+id);
        if (r.ok) {
          const p = await r.json();
          let imgs = (p.images||[]).map((im:any)=> ({ id: im.id || crypto.randomUUID(), dataUrl: im.dataUrl, url: im.url || (im.path ? (im.path.startsWith('http')? im.path : `${API_BASE}${im.path.startsWith('/')?'':'/'}${im.path}`) : undefined) }));
          if ((!imgs || imgs.length===0) && (p.image || p.imageUrl)) {
            imgs.push({ id: crypto.randomUUID(), url: p.image || p.imageUrl });
          }
          const code = p.catalogCode || generateCatalogCode();
          const mapped: Product = {
            id: p.id,
            catalogCode: code,
            title: p.title,
            category: p.category,
            price: p.price,
            qty: p.qty,
            condition: p.condition,
            description: p.description,
            images: imgs,
            createdAt: p.createdAt||Date.now(),
            ownerId: p.ownerId,
            ownerName: p.ownerName,
            tags: p.tags,
            location: p.location,
            minOrder: p.minOrder,
            negotiable: p.negotiable,
            vatIncluded: p.vatIncluded,
            shippingMethods: p.shippingMethods,
            expiresAt: p.expiresAt,
            brand: p.brand,
            externalLink: p.externalLink,
            isDraft: p.isDraft
          };
          // Voeg toe als niet aanwezig
          if (!products.find(pr => pr.id === mapped.id)) { products.unshift(mapped); }
        }
      } catch {}
    })();
  }
  found = products.find(p => p.id === id);
  return products.find(p => p.id === id);
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImageFile(file: File): Promise<string> {
  const token = getAuthToken();
  const fd = new FormData();
  fd.append('file', file);
  const res = await fetch(`${API_BASE}/upload/image`, { method:'POST', headers: token? { Authorization:'Bearer '+token }: undefined, body: fd });
  if (!res.ok) throw new Error('upload_failed');
  const data = await res.json();
  return data.url;
}

export async function addProduct(input: NewProductInput): Promise<Product> {
  if (!products.length) load();
  const token = getAuthToken();
  if (token) {
    try {
      const body: any = { ...input };
      body.images = await Promise.all(input.images.map(async img => {
        if (img instanceof File) {
          try {
            const url = await uploadImageFile(img);
            return { id: crypto.randomUUID(), url };
          } catch {
            // fallback base64 if upload fails
            return { id: crypto.randomUUID(), dataUrl: await fileToDataUrl(img) };
          }
        }
        return img;
      }));
      const res = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization': 'Bearer '+token },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const p = await res.json();
        const normImages: ProductImage[] = Array.isArray(p.images)? p.images.map((im:any)=> ({
          id: im.id || crypto.randomUUID(),
          url: im.url || (im.path ? (im.path.startsWith('http')? im.path : `${API_BASE}${im.path.startsWith('/')? '': '/'}${im.path}`) : undefined),
          dataUrl: im.dataUrl
        })) : [];
        const expires = p.expiresAt || (Date.now() + 30*24*60*60*1000);
        // fallback: als server geen images terugstuurt maar we upload input hadden
        if ((!normImages || !normImages.length) && input.images?.length) {
          for (const img of input.images) {
            if (img instanceof File) {
              try { const du = await fileToDataUrl(img); normImages.push({ id: crypto.randomUUID(), dataUrl: du }); }
              catch {}
            }
          }
        }
  let code = p.catalogCode;
  if (!code) code = generateCatalogCode();
  const mapped: Product = { id: p.id, catalogCode: code, title: p.title, category: p.category, price: p.price, qty: p.qty, condition: p.condition, description: p.description, images: normImages, createdAt: p.createdAt||Date.now(), ownerId: p.ownerId, ownerName: p.ownerName, tags: p.tags, location: p.location, minOrder: p.minOrder, negotiable: p.negotiable, vatIncluded: p.vatIncluded, shippingMethods: p.shippingMethods, expiresAt: expires, brand: p.brand, externalLink: p.externalLink, isDraft: p.isDraft };
        products.unshift(mapped); persist(); return mapped;
      }
    } catch (e) { console.warn('Remote create fail, fallback local', e); }
  }
  // fallback local
  const id = (Date.now()).toString(36) + Math.random().toString(36).slice(2,7);
  const imageObjs: ProductImage[] = [];
  for (const img of input.images) {
    if (img instanceof File) {
      let url: string | undefined;
      let dataUrl: string | undefined;
      try { url = await uploadImageFile(img); } catch {}
      try { dataUrl = await fileToDataUrl(img); } catch {}
      if (url) imageObjs.push({ id: crypto.randomUUID(), url });
      else if (dataUrl) imageObjs.push({ id: crypto.randomUUID(), dataUrl });
    } else imageObjs.push(img as ProductImage);
  }
  const user = getCurrentUser();
  const defaultExpiry = Date.now() + 30*24*60*60*1000;
  // Genereer korte unieke code: jaar + base36 increment
  const seq = (products.length + 1).toString(36).toUpperCase();
  const year = new Date().getFullYear().toString().slice(-2);
  const catalogCode = `P${year}-${seq.padStart(3,'0')}`;
  const product: Product = { id, catalogCode, title: input.title, category: input.category, price: input.price, qty: input.qty, condition: input.condition, description: input.description, images: imageObjs, createdAt: Date.now(), isNew: true, ownerId: user?.id, ownerName: user?.username, tags: input.tags, location: input.location, minOrder: input.minOrder, negotiable: input.negotiable, vatIncluded: input.vatIncluded, shippingMethods: input.shippingMethods, expiresAt: input.expiresAt || defaultExpiry, brand: input.brand, externalLink: input.externalLink?.trim(), isDraft: (input as any).isDraft || false };
  products.unshift(product); persist(); return product;
}

export function getProductsByUser(userId: number): Product[] {
  if (!products.length) load();
  return products.filter(p => p.ownerId === userId).sort((a,b) => b.createdAt - a.createdAt);
}

export async function removeProduct(id: string) {
  const token = getAuthToken();
  if (token) {
    try { await fetch(`${API_BASE}/api/products/${id}`, { method:'DELETE', headers:{ Authorization: 'Bearer '+token } }); } catch {}
  }
  products = products.filter(p => p.id !== id); persist();
}

export function clearAllProducts() {
  products = [];
  persist();
}

export async function updateProduct(id: string, changes: Partial<NewProductInput & { images?: (File|ProductImage)[]; isDraft?: boolean }>): Promise<Product | null> {
  if (!products.length) load();
  const p = products.find(pr => pr.id === id); if (!p) return null;
  const token = getAuthToken();
  if (token) {
    try {
      const body: any = { ...changes };
      if (changes.images) {
        body.images = await Promise.all(changes.images.map(async img => {
          if (img instanceof File) {
            try { const url = await uploadImageFile(img); return { id: crypto.randomUUID(), url }; }
            catch { return { id: crypto.randomUUID(), dataUrl: await fileToDataUrl(img) }; }
          }
          return img;
        }));
      }
      const res = await fetch(`${API_BASE}/api/products/${id}`, { method:'PUT', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify(body) });
      if (res.ok) {
        const r = await res.json();
  const code = r.catalogCode || p.catalogCode || generateCatalogCode();
  Object.assign(p, { id: r.id, catalogCode: code, title: r.title, category: r.category, price: r.price, qty: r.qty, condition: r.condition, description: r.description, images: r.images||[], ownerId: r.ownerId, ownerName: r.ownerName, tags: r.tags, location: r.location, minOrder: r.minOrder, negotiable: r.negotiable, vatIncluded: r.vatIncluded, shippingMethods: r.shippingMethods, expiresAt: r.expiresAt, brand: r.brand, externalLink: r.externalLink, isDraft: r.isDraft });
        persist(); return p;
      }
    } catch (e) { console.warn('Remote update fail fallback', e); }
  }
  // local fallback
  if (changes.images) {
    const imageObjs: ProductImage[] = [];
    for (const img of changes.images) {
      if (img instanceof File) {
        try { const url = await uploadImageFile(img); imageObjs.push({ id: crypto.randomUUID(), url }); }
        catch { const dataUrl = await new Promise<string>((resolve,reject)=>{ const r = new FileReader(); r.onload=()=>resolve(r.result as string); r.onerror=reject; r.readAsDataURL(img); }); imageObjs.push({ id: crypto.randomUUID(), dataUrl }); }
      } else imageObjs.push(img as ProductImage);
    }
    p.images = imageObjs;
  }
  const simple = ['title','category','price','qty','condition','description','tags','location','minOrder','negotiable','vatIncluded','shippingMethods','expiresAt','brand','isDraft','externalLink'] as const;
  simple.forEach(k => { const v = (changes as any)[k]; if (v !== undefined) (p as any)[k] = v; });
  p.isNew = false; persist(); return p;
}

export async function publishProduct(id: string) {
  const token = getAuthToken();
  if (token) {
    try { await fetch(`${API_BASE}/api/products/${id}/publish`, { method:'POST', headers:{ Authorization:'Bearer '+token } }); } catch {}
  }
  const p = products.find(pr => pr.id === id); if (!p) return; p.isDraft = false; persist();
}

export function duplicateProduct(id: string): Product | null {
  const orig = products.find(p => p.id === id); if (!orig) return null;
  const copy: Product = { ...orig, id: (Date.now()).toString(36)+Math.random().toString(36).slice(2,7), title: orig.title + ' (kopie)', createdAt: Date.now(), isDraft: true, isNew: true };
  products.unshift(copy); persist(); return copy;
}

export async function extendProductExpiry(id: string, days: number): Promise<Product | null> {
  if (!products.length) load();
  const token = getAuthToken();
  const p = products.find(pr => pr.id === id); if (!p) return null;
  if (token) {
    try { const r = await fetch(`${API_BASE}/api/products/${id}/extend`, { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:'Bearer '+token }, body: JSON.stringify({ days }) }); if (r.ok) { const data = await r.json(); p.expiresAt = data.expiresAt; persist(); return p; } } catch {}
  }
  const base = (!p.expiresAt || p.expiresAt < Date.now()) ? Date.now() : p.expiresAt; p.expiresAt = base + days*24*60*60*1000; persist(); return p;
}

// Pagination direct van server (geen lokale merge) voor infinite scroll
export async function fetchProductsPage(page:number, limit=20, opts:{ category?:string; q?:string; minPrice?:string|number; maxPrice?:string|number; sort?:'newest'|'priceAsc'|'priceDesc'|'qtyDesc'; brand?:string; negotiable?:boolean; tags?:string[]; facets?:boolean } = {}): Promise<{ items: Product[]; page:number; totalPages:number; total:number; facets?: { categories:{ value:string; count:number }[]; brands:{ value:string; count:number }[] } }> {
  const params = new URLSearchParams();
  params.set('page', String(page)); params.set('limit', String(limit));
  if (opts.category) params.set('category', opts.category);
  if (opts.q) params.set('q', opts.q);
  if (opts.minPrice) params.set('minPrice', String(opts.minPrice));
  if (opts.maxPrice) params.set('maxPrice', String(opts.maxPrice));
  if (opts.sort && opts.sort !== 'newest') params.set('sort', opts.sort);
  if (opts.brand) params.set('brand', opts.brand);
  if (opts.negotiable) params.set('negotiable','1');
  if (opts.tags && opts.tags.length) params.set('tags', opts.tags.slice(0,10).join(','));
  if (opts.facets) params.set('facets','1');
  const res = await fetch(`${API_BASE}/api/products?`+params.toString(), { headers:{ 'Accept':'application/json' } });
  if (res.status === 304) return { items:[], page, totalPages:page, total:0 };
  if (!res.ok) throw new Error('fetch_failed');
  const data = await res.json();
  const items: Product[] = (data.items||[]).map((p:any)=> ({
    id: p.id, title: p.title, category: p.category, price: p.price, qty: p.qty, condition: p.condition, description: p.description, images: (p.images||[]).map((im:any)=> ({ id: im.id||crypto.randomUUID(), dataUrl: im.dataUrl, url: im.url })), createdAt: p.createdAt||Date.now(), ownerId: p.ownerId, ownerName: p.ownerName, tags: p.tags, location: p.location, minOrder: p.minOrder, negotiable: p.negotiable, vatIncluded: p.vatIncluded, shippingMethods: p.shippingMethods, expiresAt: p.expiresAt, brand: p.brand, externalLink: p.externalLink, isDraft: p.isDraft
  }));
  return { items, page: data.page, totalPages: data.totalPages, total: data.total, facets: data.facets };
}
