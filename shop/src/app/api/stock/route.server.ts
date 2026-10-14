// Актуальные остатки для корзины и карточки: /api/stock?skus=a,b,c
import { getStock } from '@/lib/stock';

export async function GET(request: Request) {
  const skus = new URL(request.url).searchParams.get('skus')?.split(',').filter(Boolean);
  const stock = await getStock();
  const result = skus ? Object.fromEntries(skus.map((s) => [s, stock[s] ?? 0])) : stock;
  return Response.json({ stock: result }, { headers: { 'Cache-Control': 'public, max-age=30, s-maxage=60' } });
}
