// Génère dist/sitemap.xml (pages statiques + projets publiés si Supabase est joignable).
import { writeFileSync, existsSync } from 'node:fs';
const site = (process.env.VITE_SITE_URL || 'https://example.com').replace(/\/$/, '');
const paths = ['/', '/services', '/projets', '/avis', '/devis', '/contact'];
try {
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
  if (url && key) {
    const r = await fetch(`${url}/rest/v1/projects?select=slug&status=eq.published`, { headers: { apikey: key } });
    if (r.ok) (await r.json()).forEach((p) => paths.push(`/projets/${p.slug}`));
  }
} catch { console.warn('Sitemap : projets non inclus (Supabase injoignable).'); }
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((p) => `  <url><loc>${site}${p}</loc></url>`).join('\n')}\n</urlset>\n`;
if (existsSync('dist')) writeFileSync('dist/sitemap.xml', xml);
console.log(`sitemap.xml : ${paths.length} URL`);
