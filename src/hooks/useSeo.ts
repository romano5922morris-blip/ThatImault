import { useEffect } from 'react';

function setMeta(sel: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(sel);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.content = content;
}

export function useSeo(title: string, description: string, opts: { image?: string; noindex?: boolean } = {}) {
  useEffect(() => {
    const full = title.includes('ThatImault') ? title : `${title} | ThatImault Studio`;
    document.title = full;
    setMeta('meta[name="description"]', 'name', 'description', description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', full);
    setMeta('meta[property="og:description"]', 'property', 'og:description', description);
    if (opts.image) setMeta('meta[property="og:image"]', 'property', 'og:image', opts.image);
    setMeta('meta[name="robots"]', 'name', 'robots', opts.noindex ? 'noindex,nofollow' : 'index,follow');
    const base = (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ?? window.location.origin;
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = base + window.location.pathname;
    setMeta('meta[property="og:url"]', 'property', 'og:url', link.href);
  }, [title, description, opts.image, opts.noindex]);
}
