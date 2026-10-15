import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { OrderNumber } from '@/components/OrderNumber';
import { IS_DEMO, site, telegramReady } from '@/lib/site';

export const metadata: Metadata = { title: 'Заказ принят', robots: { index: false } };

export default function ThanksPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-14 text-center">
      <div className="text-6xl" aria-hidden>🧦</div>
      <h1 className="mt-4 font-display text-3xl font-semibold">Заказ принят!</h1>
      <Suspense fallback={<p className="mt-2 h-7" />}>
        <OrderNumber />
      </Suspense>
      {IS_DEMO && <p className="mx-auto mt-4 max-w-sm rounded-xl bg-accent-2 px-3 py-2 text-sm font-semibold text-accent-2-ink ring-2 ring-black">Это демо-версия: заказ никуда не отправлен.</p>}
      <ol className="mx-auto mt-8 max-w-sm space-y-3 text-left">
        {['Мы проверим наличие и свяжемся с вами в течение дня', 'Пришлём реквизиты для оплаты по СБП или договоримся об оплате при получении', 'Упакуем и отправим — пришлём трек-номер'].map((s, i) => (
          <li key={s} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-ink">{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/catalog" className="btn-sticker rounded-full bg-accent px-7 py-3.5 font-bold text-accent-ink">Вернуться в каталог</Link>
        <a href={site.max || (telegramReady ? site.telegram : `tel:${site.phone.replace(/[^+\d]/g, '')}`)} target="_blank" rel="noreferrer" className="rounded-full border border-line bg-surface px-7 py-3.5 font-semibold">Написать нам</a>
      </div>
    </div>
  );
}

