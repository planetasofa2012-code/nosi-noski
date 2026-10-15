'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ProductCard } from './ProductCard';
import { CATEGORIES, inCategory, products, totalStock, type Category, type StockMap } from '@/lib/catalog';

const SORTS = {
  popular: 'Популярные',
  cheap: 'Дешевле',
  expensive: 'Дороже',
} as const;
type Sort = keyof typeof SORTS;

export function CatalogView({ stock }: { stock: StockMap }) {
  const params = useSearchParams();
  const c = params.get('c');
  const sortParam = params.get('sort');
  const category = CATEGORIES.find((x) => x.id === c)?.id as Category | undefined;
  const sort: Sort = sortParam && sortParam in SORTS ? (sortParam as Sort) : 'popular';

  const list = products
    .filter((p) => !category || inCategory(p, category))
    .sort((a, b) => {
      // Товары без остатка — в конец
      const inA = totalStock(a, stock) > 0 ? 0 : 1;
      const inB = totalStock(b, stock) > 0 ? 0 : 1;
      if (inA !== inB) return inA - inB;
      if (sort === 'cheap') return a.price - b.price;
      if (sort === 'expensive') return b.price - a.price;
      return b.popularity - a.popularity;
    });

  const href = (next: { c?: string; sort?: string }) => {
    const q = new URLSearchParams();
    const cc = 'c' in next ? next.c : category;
    const ss = next.sort ?? sort;
    if (cc) q.set('c', cc);
    if (ss !== 'popular') q.set('sort', ss);
    const s = q.toString();
    return s ? `/catalog?${s}` : '/catalog';
  };

  const info = category ? CATEGORIES.find((x) => x.id === category) : undefined;
  const title = info?.title ?? 'Весь каталог';

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="inline-block -rotate-1 rounded-lg bg-accent px-3 py-1 font-display text-2xl font-black text-accent-ink uppercase ring-2 ring-black md:text-3xl">{title}</h1>
      {info?.note && <p className="mt-3 max-w-xl text-sm font-medium">{info.note}</p>}
      <p className="mt-2 text-sm text-muted">{list.length} товаров</p>

      <div className="no-scrollbar -mx-4 mt-6 flex gap-2 overflow-x-auto px-4 pt-1 pb-2">
        <Chip href={href({ c: undefined })} active={!category}>Все</Chip>
        {CATEGORIES.map((x) => (
          <Chip key={x.id} href={href({ c: x.id })} active={category === x.id}>{x.short}</Chip>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-sm">
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <Link key={s} href={href({ sort: s })} className={sort === s ? 'font-bold' : 'text-muted hover:text-ink'} scroll={false}>
            {SORTS[s]}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((p, i) => (
          <ProductCard key={p.slug} product={p} stock={stock} priority={i < 4} />
        ))}
      </div>
    </div>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`shrink-0 rounded-full border-2 px-4 py-2 text-sm transition ${active ? 'border-black bg-accent-2 font-bold text-accent-2-ink shadow-hard' : 'border-black bg-surface font-semibold hover:bg-surface-2'}`}
    >
      {children}
    </Link>
  );
}
