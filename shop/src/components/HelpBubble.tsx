'use client';
// Подсказка «Помочь с выбором?»: через HELP_DELAY на страницах каталога и товара всплывает в углу,
// ведёт в бота магазина (Telegram / MAX). Со страницы товара бот запомнит, о каком товаре вопрос.
// Закрыли крестиком — больше не показываем на этом устройстве.
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAdminKey } from '@/lib/liveStock';
import { site, telegramIsBot } from '@/lib/site';

const HELP_DELAY = 25_000;
const DISMISS_KEY = 'nosinoski-help-dismissed';

function dismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

export function HelpBubble() {
  const pathname = usePathname();
  const adminKey = useAdminKey();
  const [open, setOpen] = useState(false);
  const slug = /^\/product\/([a-z0-9-]+)/.exec(pathname)?.[1];
  const allowed = telegramIsBot && !adminKey && (Boolean(slug) || pathname.startsWith('/catalog'));

  useEffect(() => {
    if (!allowed || dismissed()) return;
    const timer = setTimeout(() => setOpen(true), HELP_DELAY);
    return () => clearTimeout(timer);
  }, [allowed, pathname]);

  if (!open || !allowed) return null;

  // payload ?start=: help или q_<slug> — бот поймёт, о каком товаре речь (до 64 символов, slug короче)
  const start = slug ? `q_${slug}` : 'help';
  const link = (base: string) => `${base.replace(/\/$/, '')}?start=${start}`;
  const close = () => {
    setOpen(false);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {}
  };

  return (
    <div
      role="dialog"
      aria-label="Помощь с выбором"
      className="fixed right-4 bottom-[92px] left-4 z-40 rounded-2xl border-2 border-ink bg-surface p-4 shadow-[4px_4px_0_#111] sm:left-auto sm:w-80 md:bottom-6"
    >
      <button type="button" onClick={close} className="absolute top-2 right-2 h-8 w-8 rounded-full text-muted hover:bg-surface-2" aria-label="Закрыть">
        ✕
      </button>
      <p className="pr-8 font-semibold">Помочь с размером или выбором? 🧦</p>
      <p className="mt-1 text-sm text-muted">Напишите нам — подскажем по размеру, цвету и наличию, поможем выбрать подарок.</p>
      <div className={`mt-3 grid gap-2 ${site.max ? 'grid-cols-2' : ''}`}>
        <a href={link(site.telegram)} target="_blank" rel="noreferrer" onClick={close} className="btn-sticker rounded-full bg-accent py-2.5 text-center text-sm font-bold text-accent-ink">
          Telegram
        </a>
        {site.max && (
          <a href={link(site.max)} target="_blank" rel="noreferrer" onClick={close} className="rounded-full border-2 border-ink bg-surface py-2.5 text-center text-sm font-bold">
            MAX
          </a>
        )}
      </div>
    </div>
  );
}
