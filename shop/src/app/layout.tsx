import type { Metadata, Viewport } from 'next';
import { Manrope, Unbounded } from 'next/font/google';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Marquee } from '@/components/Marquee';
import { CartProvider } from '@/lib/cart';
import { site } from '@/lib/site';
import './globals.css';

const manrope = Manrope({ variable: '--font-manrope', subsets: ['latin', 'cyrillic'] });
const unbounded = Unbounded({ variable: '--font-unbounded', subsets: ['latin', 'cyrillic'], weight: ['500', '600', '800', '900'] });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline.toLowerCase()}`, template: `%s — ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, locale: 'ru_RU', type: 'website' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f1ea' },
    { media: '(prefers-color-scheme: dark)', color: '#111111' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${manrope.variable} ${unbounded.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <CartProvider>
          <Header />
          <Marquee />
          <main className="flex-1">{children}</main>
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
