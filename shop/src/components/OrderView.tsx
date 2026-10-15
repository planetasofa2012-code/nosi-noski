'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { decodeOrder } from '@/lib/orderCode';
import { asset, DELIVERY_METHODS, formatPrice, isFreeShipping, site } from '@/lib/site';
import type { Product } from '@/lib/catalog';

/** Предметное фото (исходный снимок с цифровым именем) — по нему проще найти товар на полке */
const flatPhoto = (p: Product) => p.images.find((i) => /\/\d+\.\w+$/.test(i)) ?? p.images[0];

export function OrderView() {
  const order = decodeOrder(useSearchParams().get('c'));

  if (!order) return <p className="text-muted">Ссылка на заказ неполная — откройте её из сообщения бота ещё раз.</p>;

  const qty = order.items.reduce((s, i) => s + i.qty, 0);
  const total = order.items.reduce((s, i) => s + i.product.price * i.qty, 0);
  const free = isFreeShipping(qty, total);
  const method = DELIVERY_METHODS[order.method];
  const cost = order.method === 'pickup' ? '' : order.method === 'avito' ? 'по тарифу Авито' : free ? 'бесплатно' : site.deliveryPrice;

  return (
    <>
      <h1 className="font-display text-2xl font-semibold">Заказ · {qty} шт на {formatPrice(total)}</h1>
      <p className="mt-1 text-muted">
        {method.title}
        {cost && ` · ${cost}`}
      </p>

      <ul className="mt-6 divide-y divide-line rounded-[24px] border border-line bg-surface px-4">
        {order.items.map(({ product, variant, qty }) => {
          const color = product.colors.find((c) => c.id === variant.color);
          return (
            <li key={variant.sku} className="flex gap-4 py-4">
              <Link href={`/product/${product.slug}`} className="relative h-36 w-28 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                <Image src={asset(flatPhoto(product))} alt={product.title} fill sizes="112px" className="object-cover" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/product/${product.slug}`} className="font-medium leading-snug">{product.title}</Link>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted">Цвет</dt>
                  <dd className="flex items-center gap-2 font-semibold">
                    {color && <span className="h-4 w-4 shrink-0 rounded-full border border-line" style={{ background: color.hex }} />}
                    {color?.name ?? variant.color}
                  </dd>
                  <dt className="text-muted">Размер</dt>
                  <dd className="font-semibold">{variant.size}</dd>
                  <dt className="text-muted">Кол-во</dt>
                  <dd className="font-semibold">
                    {qty} шт · {formatPrice(product.price * qty)}
                  </dd>
                </dl>
              </div>
            </li>
          );
        })}
      </ul>

      {order.unknown > 0 && (
        <p className="mt-3 text-sm font-semibold text-hot">
          ⚠ Ещё {order.unknown} поз. нет в каталоге (товар убрали или переименовали) — уточните у покупателя.
        </p>
      )}
      <p className="mt-4 text-sm text-muted">Пункт выдачи, время и вопросы покупатель пишет в чат с ботом — отвечайте там через «Ответить».</p>
    </>
  );
}
