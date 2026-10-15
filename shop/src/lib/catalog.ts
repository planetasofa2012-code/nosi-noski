// Каталог товаров: типы и поиск. Данные — в src/data/products.json
import data from '@/data/products.json';

// 'socks' — общая группа «Все носки»: в неё попадают все товары из подкатегорий носков
export type Category = 'socks' | 'women-socks' | 'men-socks' | 'kids' | 'sport' | 'warm' | 'soft' | 'women' | 'men' | 'sets';
export type Badge = 'hit' | 'new';
export type Color = { id: string; name: string; hex: string };
export type Variant = { sku: string; size: string; color: string; stock: number };

export type Product = {
  slug: string;
  title: string;
  category: Category;
  /** Дополнительные категории, где товар тоже показывается (например, тёплые мужские) */
  tags?: Category[];
  price: number;
  oldPrice?: number;
  colors: Color[];
  variants: Variant[];
  images: string[];
  description: string;
  composition: string;
  care: string;
  badges: Badge[];
  popularity: number;
  avitoUrl?: string;
};

export type StockMap = Record<string, number>;

// На витрине — только товары с настоящими фото (заглушки .svg не показываем)
export const products = (data as Product[]).filter((p) => p.images.some((i) => !i.endsWith('.svg')));

type CategoryInfo = {
  id: Category;
  title: string;
  short: string;
  /** Подпись под заголовком в каталоге */
  note?: string;
  /** Показывать в верхнем меню */
  nav?: boolean;
  /** Группа (в сетке категорий на главной не показываем — там подкатегории) */
  group?: boolean;
};

const SOCK_CATEGORIES: Category[] = ['socks', 'women-socks', 'men-socks', 'kids', 'sport', 'warm', 'soft'];

const ALL_CATEGORIES: CategoryInfo[] = [
  { id: 'socks', title: 'Все носки', short: 'Носки', nav: true, group: true },
  { id: 'women-socks', title: 'Женские носки', short: 'Женские' },
  { id: 'men-socks', title: 'Мужские носки', short: 'Мужские' },
  { id: 'kids', title: 'Детские носки', short: 'Детские' },
  { id: 'sport', title: 'Спортивные носки', short: 'Спортивные' },
  { id: 'warm', title: 'Тёплые носки', short: 'Тёплые', note: 'Утеплённые и зимние модели — для холодной погоды' },
  {
    id: 'soft',
    title: 'Носки с мягкой резинкой',
    short: 'Мягкая резинка',
    note: 'Широкая мягкая резинка не пережимает ногу и не оставляет следов — удобно на весь день',
  },
  { id: 'women', title: 'Женское бельё', short: 'Женское бельё', nav: true },
  { id: 'men', title: 'Мужское бельё', short: 'Мужское бельё', nav: true },
  { id: 'sets', title: 'Наборы носков', short: 'Наборы', nav: true },
];

/** Товар относится к категории: основная, дополнительная или группа «Все носки» */
export function inCategory(product: Product, id: Category) {
  if (id === 'socks') return SOCK_CATEGORIES.includes(product.category);
  return product.category === id || !!product.tags?.includes(id);
}

export function isSocks(category: Category) {
  return SOCK_CATEGORIES.includes(category) || category === 'sets';
}

// Пустые категории не показываем
export const CATEGORIES = ALL_CATEGORIES.filter((c) => products.some((p) => inCategory(p, c.id)));

export function categoryInfo(id: Category) {
  return ALL_CATEGORIES.find((c) => c.id === id)!;
}

export function getProduct(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function findVariant(sku: string) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.sku === sku);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function colorName(product: Product, colorId: string) {
  return product.colors.find((c) => c.id === colorId)?.name ?? colorId;
}

export function sizesOf(product: Product) {
  return [...new Set(product.variants.map((v) => v.size))];
}

/** Остаток товара целиком (сумма по позициям) */
export function totalStock(product: Product, stock?: StockMap) {
  return product.variants.reduce((sum, v) => sum + (stock?.[v.sku] ?? v.stock), 0);
}

export function discountPercent(product: Product) {
  if (!product.oldPrice || product.oldPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.oldPrice) * 100);
}

/** Остатки из JSON — запасной вариант, если Google Таблица не подключена */
export function jsonStock(): StockMap {
  const map: StockMap = {};
  for (const p of products) for (const v of p.variants) map[v.sku] = v.stock;
  return map;
}

export function related(product: Product, limit = 4) {
  return products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category) || b.popularity - a.popularity)
    .slice(0, limit);
}
