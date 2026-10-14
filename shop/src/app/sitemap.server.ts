import type { MetadataRoute } from 'next';
import { CATEGORIES, products } from '@/lib/catalog';
import { site } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const u = (p: string) => new URL(p, site.url).toString();
  return [
    { url: u('/'), priority: 1 },
    { url: u('/catalog'), priority: 0.9 },
    ...CATEGORIES.map((c) => ({ url: u(`/catalog?c=${c.id}`), priority: 0.8 })),
    ...products.map((p) => ({ url: u(`/product/${p.slug}`), priority: 0.7 })),
    { url: u('/delivery'), priority: 0.4 },
    { url: u('/about'), priority: 0.3 },
  ];
}
