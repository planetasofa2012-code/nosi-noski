import { freeShippingText } from '@/lib/site';

// Бегущая лаймовая лента под шапкой
export function Marquee() {
  const items = [
    freeShippingText,
    'Носи носки',
    'Мишки · бантики · розы',
    'Авито Доставка',
    'Яндекс Доставка · Новосибирск',
    'Носи носки',
  ];
  const row = (
    <div className="flex shrink-0 items-center gap-6 pr-6" aria-hidden>
      {items.map((t, i) => (
        <span key={i} className="flex items-center gap-6 whitespace-nowrap">
          {t}
          <span className="text-hot">✦</span>
        </span>
      ))}
    </div>
  );
  return (
    <div className="overflow-hidden border-b-2 border-black bg-accent-2 py-2 font-display text-xs font-black text-accent-2-ink uppercase md:text-sm">
      <span className="sr-only">{items.slice(0, 5).join(', ')}</span>
      <div className="marquee flex w-max">
        {row}
        {row}
      </div>
    </div>
  );
}
