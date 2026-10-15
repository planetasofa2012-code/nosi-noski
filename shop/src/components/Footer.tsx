import Link from 'next/link';
import { CATEGORIES } from '@/lib/catalog';
import { site, telegramReady } from '@/lib/site';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="mt-20 border-t-2 border-black bg-[#111] text-[#f4f1ea]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <Logo className="h-11 w-auto" />
          <p className="mt-3 max-w-xs text-[#a39d93]">{site.tagline}. {site.city}.</p>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-display font-black text-[#dcff3a] uppercase">Каталог</span>
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/catalog?c=${c.id}`} className="text-[#a39d93] hover:text-[#dcff3a]">
              {c.title}
            </Link>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-display font-black text-[#dcff3a] uppercase">Покупателям</span>
          <Link href="/delivery" className="text-[#a39d93] hover:text-[#dcff3a]">Доставка, оплата и возврат</Link>
          <Link href="/about" className="text-[#a39d93] hover:text-[#dcff3a]">О нас</Link>
          <Link href="/privacy" className="text-[#a39d93] hover:text-[#dcff3a]">Политика конфиденциальности</Link>
          {telegramReady && (
            <a href={site.telegram} className="text-[#a39d93] hover:text-[#dcff3a]" target="_blank" rel="noreferrer">Написать в Telegram</a>
          )}
          {site.max && (
            <a href={site.max} className="text-[#a39d93] hover:text-[#dcff3a]" target="_blank" rel="noreferrer">Написать в MAX</a>
          )}
          {site.avitoProfile && (
            <a href={site.avitoProfile} className="text-[#a39d93] hover:text-[#dcff3a]" target="_blank" rel="noreferrer">Мы на Авито</a>
          )}
          <a href={`tel:${site.phone.replace(/[^\d+]/g, '')}`} className="text-[#a39d93] hover:text-[#dcff3a]">{site.phone}</a>
        </div>
      </div>
      <div className="border-t border-[#333] py-4 text-center text-xs text-[#a39d93]">© {site.name}</div>
    </footer>
  );
}
