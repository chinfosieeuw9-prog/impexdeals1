import { useEffect } from 'react';

interface MetaOptions {
  title?: string;              // Full title (will set document.title directly)
  description?: string;        // Meta description content
  canonicalPath?: string;      // Path starting with '/'; origin auto prepended
  type?: 'website' | 'product' | 'article'; // og:type
  imageUrl?: string;           // Absolute or relative (will be resolved) for og:image
  robots?: string;             // e.g. 'noindex,nofollow'
}

export function usePageMeta(opts: MetaOptions) {
  useEffect(()=> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    if (opts.title) document.title = opts.title;

    if (opts.description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name','description'); document.head.appendChild(meta); }
      meta.setAttribute('content', opts.description);
    }

    if (opts.robots) {
      let robots = document.querySelector('meta[name="robots"]');
      if (!robots) { robots = document.createElement('meta'); robots.setAttribute('name','robots'); document.head.appendChild(robots); }
      robots.setAttribute('content', opts.robots);
    }

    if (opts.canonicalPath) {
      let canon = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
      canon.href = origin + opts.canonicalPath;
    }

    // Open Graph & Twitter
    const ensureProp = (attr: 'property'|'name', prop: string, content: string) => {
      if (!content) return;
      const selector = `meta[${attr}='${prop}']`;
      let tag = document.querySelector(selector);
      if (!tag) { tag = document.createElement('meta'); tag.setAttribute(attr, prop); document.head.appendChild(tag); }
      tag.setAttribute('content', content);
    };
    const absImage = opts.imageUrl ? (opts.imageUrl.startsWith('http') ? opts.imageUrl : origin + opts.imageUrl) : undefined;
    ensureProp('property','og:title', opts.title||'');
    ensureProp('property','og:description', opts.description||'');
    ensureProp('property','og:url', opts.canonicalPath ? origin + opts.canonicalPath : window.location.href);
    ensureProp('property','og:type', opts.type || 'website');
    if (absImage) ensureProp('property','og:image', absImage);
    ensureProp('name','twitter:card', absImage ? 'summary_large_image':'summary');
    if (absImage) ensureProp('name','twitter:image', absImage);
    if (opts.title) ensureProp('name','twitter:title', opts.title);
    if (opts.description) ensureProp('name','twitter:description', opts.description);
  // Only rerun when stringified opts change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(opts)]);
}

export default usePageMeta;
