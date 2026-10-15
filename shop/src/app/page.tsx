import Image from 'next/image';
import Link from 'next/link';
import { Sock } from '@/components/Logo';
import { ProductCard } from '@/components/ProductCard';
import { CATEGORIES, products, totalStock } from '@/lib/catalog';
import { asset, formatPrice, site } from '@/lib/site';
import { getStock } from '@/lib/stock';

// Цвета и наклон «наклеек» категорий — по очереди
const STICKERS = [
  { bg: 'bg-accent-2', text: 'text-accent-2-ink', rotate: '-rotate-2' },
  { bg: 'bg-accent', text: 'text-accent-ink', rotate: 'rotate-1' },
  { bg: 'bg-ink', text: 'text-accent-2', rotate: '-rotate-1' },
  { bg: 'bg-surface', text: 'text-ink', rotate: 'rotate-2' },
];

export default async function Home() {
  const stock = await getStock();
  const available = products.filter((p) => totalStock(p, stock) > 0);
  const hits = [...available].filter((p) => p.badges.includes('hit')).sort((a, b) => b.popularity - a.popularity);
  const fresh = available.filter((p) => p.badges.includes('new'));
  const sets = available.filter((p) => p.category === 'sets');
  const cover = (id: string) => products.find((p) => p.category === id)?.images[0];
  const heroImage = hits[0]?.images[1] ?? products[0].images[0];
  const minPrice = Math.min(...available.map((p) => p.price));

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 pt-6 pb-10 md:grid-cols-2 md:pt-12">
        <div className="order-2 md:order-1">
          <p className="inline-block -rotate-2 rounded-md bg-accent-2 px-2.5 py-1 text-sm font-bold tracking-wide text-accent-2-ink uppercase ring-2 ring-black">
            Новая коллекция
          </p>
          <h1 className="mt-4 font-display text-4xl leading-[1.05] font-black uppercase md:text-6xl">
            Носки, за которые{' '}
            <span className="relative inline-block rotate-1 rounded-lg bg-accent px-2 text-accent-ink ring-2 ring-black">не стыдно</span>{' '}
            разуться
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            Мишки, бантики, розы — носки с характером. И бельё на каждый день. Бесплатная доставка от {formatPrice(site.freeShippingFrom)}.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/catalog" className="btn-sticker rounded-full bg-accent px-7 py-3.5 font-bold text-accent-ink">
              Смотреть каталог
            </Link>
            <Link href="/catalog?c=socks" className="btn-sticker rounded-full bg-surface px-7 py-3.5 font-bold">
              Все носки
            </Link>
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] border-2 border-black bg-surface-2 shadow-hard md:aspect-square">
            <Image src={asset(heroImage)} alt="Носки «Носи носки»" fill priority sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" unoptimized={heroImage.endsWith('.svg')} />
          </div>
          {/* Наклейка-ценник на фото */}
          <div className="absolute -bottom-4 -left-3 rotate-[-8deg] rounded-xl bg-accent-2 px-4 py-2 font-display text-lg font-black text-accent-2-ink ring-2 ring-black shadow-hard md:-left-6 md:text-xl">
            от {formatPrice(minPrice)}
          </div>
          <Sock className="absolute -top-5 -right-3 h-20 w-20 rotate-12 drop-shadow-[3px_3px_0_#111] md:h-24 md:w-24" />
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-6xl px-4">
        <div className={`grid grid-cols-2 gap-4 ${CATEGORIES.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4'}`}>
          {CATEGORIES.map((c, i) => {
            const img = cover(c.id);
            const st = STICKERS[i % STICKERS.length];
            return (
              <Link
                key={c.id}
                href={`/catalog?c=${c.id}`}
                className="group relative aspect-[5/4] overflow-hidden rounded-[20px] border-2 border-black bg-surface-2 shadow-hard transition hover:-translate-y-1"
              >
                {img && (
                  <Image src={asset(img)} alt="" fill sizes="(min-width: 768px) 25vw, 50vw" className="object-cover transition duration-500 group-hover:scale-105" unoptimized={img.endsWith('.svg')} />
                )}
                <span className={`absolute bottom-3 left-3 ${st.rotate} rounded-lg ${st.bg} ${st.text} px-3 py-1.5 font-display text-sm font-black uppercase ring-2 ring-black`}>
                  {c.short}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <Shelf title="Хиты продаж" tone="bg-accent text-accent-ink" href="/catalog?sort=popular" items={hits} stock={stock} />
      {fresh.length > 0 && <Shelf title="Новинки" tone="bg-accent-2 text-accent-2-ink" href="/catalog" items={fresh} stock={stock} />}
      {sets.length > 0 && <Shelf title="Наборы" tone="bg-ink text-accent-2" href="/catalog?c=sets" items={sets} stock={stock} />}

      <section className="mx-auto mt-16 grid max-w-6xl gap-5 px-4 sm:grid-cols-3">
        {[
          ['🚚', 'Доставка по России', `СДЭК, Почта, Авито Доставка. Бесплатно от ${formatPrice(site.freeShippingFrom)}`, 'bg-accent-2 text-accent-2-ink', '-rotate-1'],
          ['🧦', 'Принты с характером', 'Мишки, буквы, ромбы — носки, которые хочется показать', 'bg-accent text-accent-ink', 'rotate-1'],
          ['📏', 'Подскажем размер', 'Сомневаетесь — напишите нам в Telegram или MAX, поможем выбрать', 'bg-surface text-ink', '-rotate-1'],
        ].map(([icon, title, text, tone, rot]) => (
          <div key={title} className={`${tone} ${rot} rounded-[20px] border-2 border-black p-5 shadow-hard`}>
            <div className="text-3xl" aria-hidden>{icon}</div>
            <h3 className="mt-2 font-display font-black uppercase">{title}</h3>
            <p className="mt-1 text-sm font-medium opacity-80">{text}</p>
          </div>
        ))}
      </section>
    </>
  );
}

function Shelf({ title, tone, href, items, stock }: { title: string; tone: string; href: string; items: typeof products; stock: Record<string, number> }) {
  if (!items.length) return null;
  return (
    <section className="mx-auto mt-16 max-w-6xl px-4">
      <div className="mb-5 flex items-end justify-between">
        <h2 className={`inline-block -rotate-1 rounded-lg px-3 py-1 font-display text-xl font-black uppercase ring-2 ring-black md:text-2xl ${tone}`}>{title}</h2>
        <Link href={href} className="text-sm font-bold underline decoration-2 underline-offset-4 hover:text-hot">Все →</Link>
      </div>
      <div className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pt-1 pb-2 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
        {items.slice(0, 4).map((p) => (
          <div key={p.slug} className="w-[46%] shrink-0 snap-start md:w-auto">
            <ProductCard product={p} stock={stock} />
          </div>
        ))}
      </div>
    </section>
  );
}
