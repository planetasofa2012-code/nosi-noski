import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { ProductView } from '@/components/ProductView';
import { CATEGORIES, getProduct, products, related } from '@/lib/catalog';
import { formatPrice } from '@/lib/site';
import { getStock } from '@/lib/stock';


export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return {};
  return {
    title: product.title,
    description: `${product.title} — ${formatPrice(product.price)}. ${product.description}`,
    openGraph: { images: product.images.filter((i) => !i.endsWith('.svg')).slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();
  const stock = await getStock();
  const category = CATEGORIES.find((c) => c.id === product.category)!;
  const variantStock = Object.fromEntries(product.variants.map((v) => [v.sku, stock[v.sku] ?? 0]));

  return (
    <div className="mx-auto max-w-6xl px-4 pt-4">
      <nav className="mb-4 text-sm text-muted" aria-label="Навигация">
        <Link href="/catalog" className="hover:text-ink">Каталог</Link>
        {' / '}
        <Link href={`/catalog?c=${category.id}`} className="hover:text-ink">{category.title}</Link>
      </nav>

      <ProductView product={product} initialStock={variantStock} />

      <section className="mt-16">
        <h2 className="mb-4 font-display text-2xl font-semibold">С этим берут</h2>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
          {related(product).map((p) => (
            <ProductCard key={p.slug} product={p} stock={stock} />
          ))}
        </div>
      </section>
    </div>
  );
}
