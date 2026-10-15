// Настройки магазина — меняйте здесь название, контакты и условия
export const site = {
  name: 'Носи носки',
  tagline: 'Носки, за которые не стыдно разуться',
  description:
    'Яркие носки с принтами: мишки, буквы, ромбы. Доставка СДЭК, Почтой России и Авито, самовывоз. Заказ за минуту — без регистрации.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3333',
  city: 'Новосибирск',
  phone: '+7 900 000-00-00',
  telegram: 'https://t.me/username',
  max: '', // ссылка на профиль/чат в MAX, например https://max.ru/u/…
  avitoProfile: '', // ссылка на профиль на Авито (если есть)
  freeShippingFrom: 2000,
  lowStockThreshold: 3, // показывать «Осталось N шт»
  alertStockThreshold: 1, // слать в Telegram «Заканчивается»
} as const;

export const DELIVERY_METHODS = {
  pickup: { title: 'Самовывоз', hint: 'Адрес пришлём после подтверждения', needsAddress: false },
  cdek: { title: 'СДЭК', hint: 'Город и пункт выдачи', needsAddress: true },
  post: { title: 'Почта России', hint: 'Индекс и полный адрес', needsAddress: true },
  avito: { title: 'Авито Доставка', hint: 'Оформим через Авито — пришлём ссылку', needsAddress: false },
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_METHODS;

// Демо-сборка для GitHub Pages: без сервера, сайт лежит в подпапке
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === '1';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
/** Путь к файлу из public/ с учётом подпапки (next/image сам её не добавляет) */
export const asset = (src: string) => (src.startsWith('/') ? BASE_PATH + src : src);

export function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}
