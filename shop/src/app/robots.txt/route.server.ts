// robots.txt (только в обычной сборке)
import { site } from '@/lib/site';

export function GET() {
  const body = `User-Agent: *
Allow: /
Disallow: /cart
Disallow: /thanks
Disallow: /api/

Sitemap: ${new URL('/sitemap.xml', site.url)}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
