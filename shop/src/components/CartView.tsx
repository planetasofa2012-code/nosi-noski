'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { colorName, findVariant, type StockMap } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { asset, DELIVERY_METHODS, formatPrice, IS_DEMO, site, type DeliveryMethod } from '@/lib/site';

export function CartView() {
  const { items, ready, total, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [stock, setStock] = useState<StockMap | null>(null);
  const [method, setMethod] = useState<DeliveryMethod>('cdek');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Сверяем корзину с актуальными остатками
  const skuKey = items.map((i) => i.sku).join(',');
  useEffect(() => {
    if (!skuKey || IS_DEMO) return;
    fetch(`/api/stock?skus=${encodeURIComponent(skuKey)}`)
      .then((r) => r.json())
      .then((b: { stock?: StockMap }) => b.stock && setStock(b.stock))
      .catch(() => {});
  }, [skuKey]);

  if (!ready) return <div className="mt-8 h-40 animate-pulse rounded-[20px] bg-surface-2" />;

  if (!items.length) {
    return (
      <div className="mt-10 rounded-[24px] border border-line bg-surface p-10 text-center">
        <div className="text-5xl" aria-hidden>🧦</div>
        <p className="mt-3 text-lg font-semibold">Корзина пока пустая</p>
        <p className="mt-1 text-muted">Загляните в каталог — там тепло</p>
        <Link href="/catalog" className="mt-6 inline-block btn-sticker rounded-full bg-accent px-7 py-3.5 font-bold text-accent-ink">
          В каталог
        </Link>
      </div>
    );
  }

  const toFree = Math.max(0, site.freeShippingFrom - total);
  const delivery = DELIVERY_METHODS[method];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const f = new FormData(e.currentTarget);
    setSending(true);
    if (IS_DEMO) {
      // Демо без сервера: показываем, как выглядит успешный заказ
      await new Promise((r) => setTimeout(r, 700));
      clear();
      router.push(`/thanks?id=DEMO-${Math.floor(1000 + Math.random() * 9000)}`);
      return;
    }
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            name: f.get('name'),
            phone: f.get('phone'),
            telegram: f.get('telegram'),
            consent: f.get('consent') === 'on',
          },
          delivery: { method, address: f.get('address') ?? '' },
          comment: f.get('comment'),
          items,
          website: f.get('website'),
        }),
      });
      const body = (await res.json()) as { ok: boolean; orderId?: string; error?: string; shortages?: { sku: string; available: number }[] };
      if (!body.ok) {
        // Подрезаем корзину под фактические остатки
        body.shortages?.forEach((s) => setQty(s.sku, s.available));
        setError(body.error ?? 'Ошибка');
        return;
      }
      clear();
      router.push(`/thanks?id=${encodeURIComponent(body.orderId!)}`);
    } catch {
      setError('Нет связи. Проверьте интернет и попробуйте ещё раз.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_420px]">
      <ul className="divide-y divide-line rounded-[24px] border border-line bg-surface px-4">
        {items.map((item) => {
          const f = findVariant(item.sku);
          if (!f) return null;
          const { product, variant } = f;
          const max = stock?.[item.sku] ?? variant.stock;
          const over = stock !== null && item.qty > max;
          return (
            <li key={item.sku} className="flex gap-4 py-4">
              <Link href={`/product/${product.slug}`} className="relative h-28 w-22 shrink-0 overflow-hidden rounded-2xl bg-surface-2">
                <Image src={asset(product.images[0])} alt={product.title} fill sizes="88px" className="object-cover" unoptimized={product.images[0].endsWith('.svg')} />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex justify-between gap-3">
                  <Link href={`/product/${product.slug}`} className="font-medium leading-snug">{product.title}</Link>
                  <button type="button" onClick={() => remove(item.sku)} className="h-8 w-8 shrink-0 rounded-full text-muted hover:bg-surface-2" aria-label="Удалить">
                    ✕
                  </button>
                </div>
                <p className="text-sm text-muted">
                  {variant.size} · {colorName(product, variant.color)}
                </p>
                {over && <p className="text-sm font-semibold text-hot">{max ? `В наличии только ${max} шт` : 'Закончился — удалите из корзины'}</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-full border border-line">
                    <button type="button" onClick={() => setQty(item.sku, item.qty - 1)} className="h-9 w-9 rounded-full hover:bg-surface-2" aria-label="Меньше">−</button>
                    <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => setQty(item.sku, item.qty + 1)}
                      disabled={item.qty >= max}
                      className="h-9 w-9 rounded-full hover:bg-surface-2 disabled:opacity-30"
                      aria-label="Больше"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-semibold">{formatPrice(product.price * item.qty)}</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={submit} className="h-fit rounded-[24px] border border-line bg-surface p-5 lg:sticky lg:top-20">
        <div className="flex items-baseline justify-between">
          <span className="text-muted">Итого</span>
          <span className="text-2xl font-semibold">{formatPrice(total)}</span>
        </div>
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent-2 ring-1 ring-black/60 transition-all" style={{ width: `${Math.min(100, (total / site.freeShippingFrom) * 100)}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-muted">{toFree ? `До бесплатной доставки ${formatPrice(toFree)}` : 'Доставка бесплатно 🎉'}</p>
        </div>

        <h2 className="mt-6 font-semibold">Получатель</h2>
        <div className="mt-2 space-y-2.5">
          <Field name="name" label="Имя" autoComplete="name" required />
          <Field name="phone" label="Телефон" type="tel" autoComplete="tel" placeholder="+7 900 000-00-00" required />
          <Field name="telegram" label="Telegram или MAX (необязательно)" placeholder="@username или номер в MAX" />
        </div>

        <h2 className="mt-6 font-semibold">Доставка</h2>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {(Object.keys(DELIVERY_METHODS) as DeliveryMethod[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              aria-pressed={method === m}
              className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition ${method === m ? 'border-ink bg-surface-2 font-semibold' : 'border-line hover:border-ink'}`}
            >
              {DELIVERY_METHODS[m].title}
            </button>
          ))}
        </div>
        {delivery.needsAddress ? (
          <div className="mt-2.5">
            <Field name="address" label={delivery.hint} required key={method} />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">{delivery.hint}</p>
        )}

        <label className="mt-4 block">
          <span className="text-sm text-muted">Комментарий</span>
          <textarea name="comment" rows={2} maxLength={500} className="mt-1 w-full rounded-[14px] border border-line bg-bg px-3.5 py-2.5 outline-none focus:border-ink" placeholder="Удобное время звонка, вопрос по размеру…" />
        </label>

        {/* Ловушка для ботов: поле скрыто от людей */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

        <label className="mt-4 flex gap-2.5 text-sm">
          <input type="checkbox" name="consent" required className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--accent)]" />
          <span className="text-muted">
            Согласен(на) на обработку персональных данных по <Link href="/privacy" className="underline" target="_blank">политике конфиденциальности</Link>
          </span>
        </label>

        {error && <p className="mt-4 rounded-2xl bg-accent/10 p-3 text-sm font-semibold text-hot" role="alert">{error}</p>}

        <button type="submit" disabled={sending} className="btn-sticker mt-5 w-full rounded-full bg-accent py-4 font-bold text-accent-ink disabled:opacity-60">
          {sending ? 'Отправляем…' : `Оформить заказ — ${formatPrice(total)}`}
        </button>
        <p className="mt-3 text-center text-xs text-muted">
          Мы свяжемся в Telegram, MAX или по телефону, подтвердим наличие и пришлём реквизиты для оплаты (СБП) или оформим оплату при получении.
        </p>
      </form>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <input {...props} className="mt-1 h-12 w-full rounded-[14px] border border-line bg-bg px-3.5 outline-none focus:border-ink" />
    </label>
  );
}
