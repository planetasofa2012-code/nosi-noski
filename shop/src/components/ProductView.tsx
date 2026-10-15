'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Badges } from './ProductCard';
import { SizeGuide } from './SizeGuide';
import { sizesOf, type Product, type StockMap } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { asset, DELIVERY_METHODS, formatPrice, freeShippingText, IS_DEMO, site } from '@/lib/site';

export function ProductView({ product, initialStock }: { product: Product; initialStock: StockMap }) {
  const [stock, setStock] = useState(initialStock);
  const { add, items } = useCart();
  const sizes = sizesOf(product);
  const left = (sku: string) => stock[sku] ?? 0;

  // Первый доступный вариант по умолчанию
  const firstAvailable = product.variants.find((v) => left(v.sku) > 0) ?? product.variants[0];
  const [color, setColor] = useState(firstAvailable.color);
  const [size, setSize] = useState(firstAvailable.size);
  const [added, setAdded] = useState(false);

  // Свежие остатки при открытии карточки
  useEffect(() => {
    if (IS_DEMO) return; // в демо нет сервера остатков
    const skus = product.variants.map((v) => v.sku).join(',');
    fetch(`/api/stock?skus=${encodeURIComponent(skus)}`)
      .then((r) => r.json())
      .then((b: { stock?: StockMap }) => b.stock && setStock(b.stock))
      .catch(() => {});
  }, [product.variants]);

  const variant = product.variants.find((v) => v.color === color && v.size === size);
  const available = variant ? left(variant.sku) : 0;
  const inCart = variant ? (items.find((i) => i.sku === variant.sku)?.qty ?? 0) : 0;
  const canAdd = available > inCart;
  const anyStock = product.variants.some((v) => left(v.sku) > 0);

  const sizeAvailable = useMemo(
    () => Object.fromEntries(sizes.map((s) => [s, product.variants.some((v) => v.size === s && v.color === color && left(v.sku) > 0)])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, stock],
  );

  function pickColor(id: string) {
    setColor(id);
    // Если текущий размер в этом цвете закончился — переключаем на доступный
    const same = product.variants.find((v) => v.color === id && v.size === size && left(v.sku) > 0);
    if (!same) {
      const alt = product.variants.find((v) => v.color === id && left(v.sku) > 0);
      if (alt) setSize(alt.size);
    }
  }

  function addToCart() {
    if (!variant || !canAdd) return;
    add(variant.sku, 1, available);
    setAdded(true);
    setTimeout(() => setAdded(false), 2500);
  }

  const buttonLabel = !anyStock ? 'Нет в наличии' : !available ? 'Нет этого размера' : !canAdd ? 'Все в корзине' : added ? 'Добавлено ✓' : `В корзину — ${formatPrice(product.price)}`;

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <Gallery product={product} />

      <div>
        <Badges product={product} outOfStock={!anyStock} />
        <h1 className="mt-3 font-display text-2xl leading-tight font-semibold md:text-3xl">{product.title}</h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
          {product.oldPrice && <span className="text-lg text-muted line-through">{formatPrice(product.oldPrice)}</span>}
        </div>

        {product.colors.length > 0 && (
          <fieldset className="mt-6">
            <legend className="text-sm text-muted">
              Цвет: <span className="font-medium text-ink">{product.colors.find((c) => c.id === color)?.name}</span>
            </legend>
            <div className="mt-2 flex gap-2.5">
              {product.colors.map((c) => {
                const has = product.variants.some((v) => v.color === c.id && left(v.sku) > 0);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pickColor(c.id)}
                    aria-label={c.name + (has ? '' : ' — нет в наличии')}
                    aria-pressed={color === c.id}
                    className={`relative h-11 w-11 rounded-full border-2 transition ${color === c.id ? 'border-ink' : 'border-transparent'}`}
                  >
                    <span className="absolute inset-1 rounded-full border border-line" style={{ background: c.hex }} />
                    {!has && <span className="absolute inset-0 m-auto h-0.5 w-9 rotate-45 bg-muted" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        )}

        <fieldset className="mt-5">
          <div className="flex items-center justify-between">
            <legend className="text-sm text-muted">Размер</legend>
            <SizeGuide category={product.category} />
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => {
              const ok = sizeAvailable[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSize(s)}
                  disabled={!ok}
                  aria-pressed={size === s}
                  className={`h-11 min-w-14 rounded-full border px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:text-muted disabled:line-through ${
                    size === s && ok ? 'border-ink bg-ink text-bg' : 'border-line bg-surface hover:border-ink'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </fieldset>

        <p className="mt-4 h-5 text-sm" aria-live="polite">
          {available > 0 && available <= site.lowStockThreshold && <span className="font-semibold text-hot">Осталось {available} шт — успейте</span>}
          {available > site.lowStockThreshold && <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-accent-2 ring-1 ring-black/70" />В наличии</span>}
        </p>

        <div className="sticky bottom-0 z-30 -mx-4 mt-3 flex flex-col gap-2 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <button
            type="button"
            onClick={addToCart}
            disabled={!canAdd}
            className="btn-sticker w-full rounded-full bg-accent py-3.5 font-bold text-accent-ink disabled:border-line disabled:bg-surface-2 disabled:text-muted disabled:shadow-none"
          >
            {buttonLabel}
          </button>
          {added && (
            <Link href="/cart" className="text-center text-sm font-semibold underline underline-offset-4">
              Перейти в корзину
            </Link>
          )}
        </div>

        {product.avitoUrl && (
          <a
            href={product.avitoUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-line bg-surface text-sm font-semibold transition hover:bg-surface-2"
          >
            Купить на Авито с доставкой ↗
          </a>
        )}

        <div className="mt-8 divide-y divide-line border-y border-line">
          <Details title="Описание" open>{product.description}</Details>
          <Details title="Состав и уход">
            <p>{product.composition}</p>
            <p className="mt-1 text-muted">{product.care}</p>
          </Details>
          <Details title="Доставка и оплата">
            <ul className="space-y-1">
              {Object.values(DELIVERY_METHODS).map((d) => (
                <li key={d.title}>• {d.title}</li>
              ))}
            </ul>
            <p className="mt-2 text-muted">
              {freeShippingText}, меньше — {site.deliveryPrice}. Оплата после подтверждения заказа: при встрече, переводом или на Авито.{' '}
              <Link href="/delivery" className="underline">Подробнее</Link>
            </p>
          </Details>
        </div>
      </div>
    </div>
  );
}

function Details({ title, open, children }: { title: string; open?: boolean; children: React.ReactNode }) {
  return (
    <details className="group py-4" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
        {title}
        <span className="text-muted transition group-open:rotate-45">+</span>
      </summary>
      <div className="mt-2 text-[15px] leading-relaxed">{children}</div>
    </details>
  );
}

function Gallery({ product }: { product: Product }) {
  const [index, setIndex] = useState(0);
  const track = useRef<HTMLDivElement>(null);

  function go(i: number) {
    setIndex(i);
    track.current?.scrollTo({ left: i * track.current.clientWidth, behavior: 'smooth' });
  }

  return (
    <div>
      <div
        ref={track}
        onScroll={(e) => setIndex(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[24px] bg-surface-2"
      >
        {product.images.map((src, i) => (
          <div key={src} className="relative aspect-[4/5] w-full shrink-0 snap-center">
            <Image
              src={asset(src)}
              alt={`${product.title} — фото ${i + 1}`}
              fill
              priority={i === 0}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
              unoptimized={src.endsWith('.svg')}
            />
          </div>
        ))}
      </div>
      {product.images.length > 1 && (
        <div className="mt-3 flex justify-center gap-2 md:justify-start">
          {product.images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => go(i)}
              aria-label={`Фото ${i + 1}`}
              className={`relative h-16 w-13 overflow-hidden rounded-xl border-2 transition ${i === index ? 'border-ink' : 'border-transparent opacity-70'}`}
            >
              <Image src={asset(src)} alt="" fill sizes="52px" className="object-cover" unoptimized={src.endsWith('.svg')} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
