// Карта сайта: /sitemap.xml (только в обычной сборке — в демо не нужна)
import { CATEGORIES, products } from '@/lib/catalog';
import { site } from '@/lib/site';

export function GET() {
  const u = (p: string) => new URL(p, site.url).toString().replace(/&/g, '&amp;');
  const urls = [
    ['/', 1],
    ['/catalog', 0.9],
    ...CATEGORIES.map((c) => [`/catalog?c=${c.id}`, 0.8]),
    ...products.map((p) => [`/product/${p.slug}`, 0.7]),
    ['/delivery', 0.4],
    ['/about', 0.3],
  ] as [string, number][];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([p, pr]) => `  <url><loc>${u(p)}</loc><priority>${pr}</priority></url>`).join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
