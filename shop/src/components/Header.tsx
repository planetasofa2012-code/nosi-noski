'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CATEGORIES } from '@/lib/catalog';
import { useCart } from '@/lib/cart';
import { Logo } from './Logo';

export function Header() {
  const { count, ready } = useCart();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b-2 border-black bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Link href="/" className="shrink-0" aria-label="Носи носки — на главную">
          <Logo className="h-10 w-auto md:h-11" />
        </Link>
        <nav className="hidden gap-5 text-sm font-semibold text-muted md:flex" aria-label="Категории">
          {CATEGORIES.map((c) => (
            <Link key={c.id} href={`/catalog?c=${c.id}`} className="transition hover:text-ink">
              {c.short}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/catalog"
            className={`rounded-full px-4 py-2 text-sm transition hover:bg-surface-2 ${pathname === '/catalog' ? 'bg-surface-2' : ''}`}
          >
            Каталог
          </Link>
          <Link
            href="/cart"
            className="relative flex h-11 items-center gap-2 rounded-full bg-ink px-4 text-sm font-semibold text-bg transition hover:opacity-90"
            aria-label={`Корзина, товаров: ${count}`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M6 7h12l-1 13H7L6 7Z" strokeLinejoin="round" />
              <path d="M9 7a3 3 0 0 1 6 0" />
            </svg>
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-black text-accent-ink">{ready ? count : 0}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
