import Image from 'next/image';
import Link from 'next/link';
import { discountPercent, totalStock, type Category, type Product, type StockMap } from '@/lib/catalog';
import { asset, formatPrice, site } from '@/lib/site';

export function Badges({ product, outOfStock }: { product: Product; outOfStock?: boolean }) {
  const off = discountPercent(product);
  return (
    <div className="flex flex-wrap gap-1.5">
      {outOfStock && <span className="rounded-full bg-ink/80 px-2.5 py-1 text-xs font-semibold text-bg">Нет в наличии</span>}
      {product.badges.includes('hit') && <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-ink ring-1 ring-black/80">Хит</span>}
      {product.badges.includes('new') && <span className="rounded-full bg-accent-2 px-2.5 py-1 text-xs font-bold text-accent-2-ink ring-1 ring-black/80">Новинка</span>}
      {off > 0 && <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-accent-2">−{off}%</span>}
    </div>
  );
}

export function ProductCard({ product, stock, priority, category }: { product: Product; stock?: StockMap; priority?: boolean; category?: Category }) {
  const left = totalStock(product, stock);
  const cover = category && product.coverFor?.[category];
  const [first, second] = cover ? [cover, product.images[1] ?? product.images[0]] : product.images;
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] border-2 border-black bg-surface-2 transition group-hover:-translate-y-1 group-hover:shadow-hard">
        <Image
          src={asset(first)}
          alt={product.title}
          fill
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={`object-cover transition duration-500 ${second ? 'group-hover:opacity-0' : 'group-hover:scale-105'} ${left ? '' : 'opacity-60'}`}
          priority={priority}
          unoptimized={first.endsWith('.svg')}
        />
        {second && (
          <Image
            src={asset(second)}
            alt=""
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover opacity-0 transition duration-500 group-hover:opacity-100"
            unoptimized={second.endsWith('.svg')}
          />
        )}
        <div className="absolute top-3 left-3">
          <Badges product={product} outOfStock={!left} />
        </div>
      </div>
      <div className="mt-3 px-1">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-medium">{product.title}</h3>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-display font-black">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="text-sm text-muted line-through">{formatPrice(product.oldPrice)}</span>}
        </div>
        {left > 0 && left <= site.lowStockThreshold && <p className="mt-0.5 text-xs font-semibold text-hot">Осталось {left} шт</p>}
      </div>
    </Link>
  );
}
