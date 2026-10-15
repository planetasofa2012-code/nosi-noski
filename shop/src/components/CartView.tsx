'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { colorName, findVariant, type StockMap } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { encodeOrder } from '@/lib/orderCode';
import { asset, DELIVERY_METHODS, formatPrice, IS_DEMO, isFreeShipping, site, telegramIsBot, telegramReady, type DeliveryMethod } from '@/lib/site';

export function CartView() {
  const { items, ready, total, setQty, remove, clear } = useCart();
  const router = useRouter();
  const [stock, setStock] = useState<StockMap | null>(null);
  const [method, setMethod] = useState<DeliveryMethod>('pickup');
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

  const qty = items.reduce((n, i) => n + i.qty, 0);
  const free = isFreeShipping(qty, total);
  const toFreePairs = Math.max(0, site.freeShippingPairs - qty);
  const progress = Math.min(100, Math.max(qty / site.freeShippingPairs, total / site.freeShippingFrom) * 100);
  const delivery = DELIVERY_METHODS[method];

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (site.orderMode === 'messenger') return;
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
            <div className="h-full rounded-full bg-accent-2 ring-1 ring-black/60 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-1.5 text-sm text-muted">
            {free ? 'Доставка бесплатно 🎉' : `Добавьте ещё ${toFreePairs} ${plural(toFreePairs, 'пару', 'пары', 'пар')} — и доставка бесплатно`}
          </p>
        </div>

        {site.orderMode === 'messenger' ? (
          <MessengerOrder items={items} total={total} free={free} method={method} setMethod={setMethod} />
        ) : (
          <>

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
          </>
        )}
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

const plural = (n: number, one: string, few: string, many: string) =>
  n % 10 === 1 && n % 100 !== 11 ? one : [2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100) ? few : many;

/** Текст заказа для мессенджера — без имени и телефона: контакт покупателя остаётся в самом мессенджере */
function orderText(items: { sku: string; qty: number }[], total: number, free: boolean, method: DeliveryMethod, point: string, comment: string) {
  const lines = items.flatMap((i) => {
    const f = findVariant(i.sku);
    if (!f) return [];
    const { product, variant } = f;
    return [`• ${product.title} — ${variant.size}, ${colorName(product, variant.color).toLowerCase()} × ${i.qty} = ${formatPrice(product.price * i.qty)}`];
  });
  const d = DELIVERY_METHODS[method];
  const cost = method === 'pickup' ? '' : method === 'avito' ? ' (по тарифу Авито)' : free ? ' (бесплатно)' : ` (доставка ${site.deliveryPrice})`;
  return [
    `Здравствуйте! Хочу заказать в «${site.name}»:`,
    ...lines,
    `Итого: ${formatPrice(total)}`,
    `Получение: ${d.title}${point ? ` — ${point}` : ''}${cost}`,
    comment ? `Комментарий: ${comment}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function MessengerOrder({ items, total, free, method, setMethod }: {
  items: { sku: string; qty: number }[];
  total: number;
  free: boolean;
  method: DeliveryMethod;
  setMethod: (m: DeliveryMethod) => void;
}) {
  const [point, setPoint] = useState('');
  const [comment, setComment] = useState('');
  const [copied, setCopied] = useState(false);
  const [sent, setSent] = useState(false);
  const { clear } = useCart();
  const delivery = DELIVERY_METHODS[method];
  const text = orderText(items, total, free, method, point.trim(), comment.trim());
  // Бот получает заказ прямо из ссылки (?start=код); не влезло в 64 символа — копируем текст, покупатель вставит
  const code = encodeOrder(items, method);
  const botLink = (base: string) => `${base.replace(/\/$/, '')}?start=${code ?? 'order'}`;
  // Заказ уходит боту кодом — пункт выдачи и комментарий бот спросит сам, на сайте поля не нужны
  const viaBot = Boolean(code) && telegramReady && telegramIsBot;
  const tgHref = telegramIsBot ? botLink(site.telegram) : `${site.telegram}?text=${encodeURIComponent(text)}`;
  const copyIfNeeded = () => {
    if (!code) navigator.clipboard?.writeText(text).then(() => setCopied(true), () => {});
  };
  // Пока не вписан настоящий @username Иры — не отправляем заказы на заглушку t.me/username
  const tgReady = telegramReady;
  const phoneDigits = site.phone.replace(/[^+\d]/g, '');

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      window.prompt('Скопируйте текст заказа:', text);
    }
  }

  return (
    <>
      <h2 className="mt-6 font-semibold">Как получить</h2>
      <div className="mt-2 grid gap-2">
        {(Object.keys(DELIVERY_METHODS) as DeliveryMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            aria-pressed={method === m}
            className={`rounded-2xl border px-3 py-2.5 text-left text-sm transition ${method === m ? 'border-ink bg-surface-2 font-semibold' : 'border-line hover:border-ink'}`}
          >
            {DELIVERY_METHODS[m].title}
            <span className="font-normal text-muted"> · {m === 'avito' ? 'по тарифу Авито' : m === 'pickup' || free ? 'бесплатно' : site.deliveryPrice}</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-sm text-muted">{delivery.hint}</p>
      {delivery.needsAddress && !viaBot && (
        <label className="mt-2.5 block">
          <span className="text-sm text-muted">Удобный пункт выдачи — район или адрес (необязательно)</span>
          <input
            value={point}
            onChange={(e) => setPoint(e.target.value)}
            maxLength={150}
            className="mt-1 h-12 w-full rounded-[14px] border border-line bg-bg px-3.5 outline-none focus:border-ink"
            placeholder="Например: м. Площадь Маркса"
          />
        </label>
      )}
      {!viaBot && <label className="mt-4 block">
        <span className="text-sm text-muted">Комментарий</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={300}
          className="mt-1 w-full rounded-[14px] border border-line bg-bg px-3.5 py-2.5 outline-none focus:border-ink"
          placeholder="Вопрос по размеру, удобное время…"
        />
      </label>}

      {tgReady ? (
        <a
          href={tgHref}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            // боту текст в ссылке не передать — кладём заказ в буфер, покупатель вставит его в чат
            if (telegramIsBot) copyIfNeeded();
            setSent(true);
          }}
          className="btn-sticker mt-5 block w-full rounded-full bg-accent py-4 text-center font-bold text-accent-ink"
        >
          Отправить заказ в Telegram — {formatPrice(total)}
        </a>
      ) : (
        <button type="button" onClick={copy} className="btn-sticker mt-5 block w-full rounded-full bg-accent py-4 text-center font-bold text-accent-ink">
          {copied ? 'Заказ скопирован ✓' : `Скопировать заказ — ${formatPrice(total)}`}
        </button>
      )}
      {!tgReady && copied && (
        // Шаг 2: куда отправить скопированный заказ (пока нет @username Иры)
        <div className="mt-4 rounded-2xl border-2 border-black bg-surface-2 p-3.5">
          <p className="text-sm font-semibold">Шаг 2 — отправьте заказ нам:</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            <a href={`sms:${phoneDigits}?&body=${encodeURIComponent(text)}`} onClick={() => setSent(true)} className="rounded-full bg-accent py-3 text-center text-sm font-bold text-accent-ink ring-1 ring-black">
              SMS — текст уже вписан
            </a>
            <a href={`https://t.me/${phoneDigits}`} target="_blank" rel="noreferrer" onClick={() => setSent(true)} className="rounded-full border border-ink bg-surface py-3 text-center text-sm font-bold">
              Telegram — вставьте текст
            </a>
          </div>
          <a href={`tel:${phoneDigits}`} className="mt-2 block text-center text-sm underline">Или позвоните: {site.phone}</a>
        </div>
      )}
      {site.max && (
        // MAX-бот: заказ уходит кодом в ссылке, как в Telegram
        <a
          href={botLink(site.max)}
          target="_blank"
          rel="noreferrer"
          onClick={() => {
            copyIfNeeded();
            setSent(true);
          }}
          className="mt-2.5 block w-full rounded-full border-2 border-ink bg-surface py-3.5 text-center font-bold"
        >
          Отправить заказ в MAX
        </a>
      )}
      {tgReady && <button type="button" onClick={copy} className="mt-2.5 w-full rounded-full border border-line bg-surface py-3 text-sm font-semibold hover:border-ink">
        {copied ? 'Скопировано ✓ — вставьте в чат с нами' : 'Скопировать текст заказа'}
      </button>}
      <p className="mt-3 text-center text-xs text-muted">
        {tgReady && telegramIsBot
          ? code
            ? 'Откроется чат с ботом магазина — нажмите «Старт», и заказ сразу придёт нам. Подтвердим наличие и договоримся об оплате.'
            : 'Заказ скопируется, откроется чат с ботом магазина: нажмите «Старт», вставьте текст и отправьте. Подтвердим наличие и договоримся об оплате.'
          : tgReady
          ? 'Откроется чат с нами, текст заказа уже вписан — останется нажать «Отправить». Подтвердим наличие и договоримся об оплате.'
          : copied
            ? 'Получим заказ — подтвердим наличие и договоримся об оплате.'
            : 'Нажмите — текст заказа скопируется, потом выберите, куда его отправить: SMS или Telegram.'}
        {site.avitoProfile && (
          <>
            {' '}Удобнее на Авито? <a href={site.avitoProfile} target="_blank" rel="noreferrer" className="underline">Наш профиль</a>.
          </>
        )}{' '}
        Или позвоните: <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`} className="underline">{site.phone}</a>
      </p>
      {sent && (
        <div className="mt-4 rounded-2xl bg-surface-2 p-3 text-center text-sm">
          Отправили? Ответим в течение дня.{' '}
          <button type="button" onClick={clear} className="font-semibold underline">Очистить корзину</button>
        </div>
      )}
    </>
  );
}
