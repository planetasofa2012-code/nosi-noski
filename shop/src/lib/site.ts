// Настройки магазина — меняйте здесь название, контакты и условия
export const site = {
  name: 'Носи носки',
  tagline: 'Носки, за которые не стыдно разуться',
  description:
    'Носки из Кореи: мягкая плотная ткань, принты с мишками, бантиками и розами, классика и тёплые модели. Новосибирск: самовывоз, Яндекс Доставка, Авито. Заказ в Telegram за минуту.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3333',
  city: 'Новосибирск',
  phone: '+7 913 928-59-47',
  telegram: 'https://t.me/Nosinoski_bot', // бот заказов (bot/bot.mjs); тестовый — потом заменить на бота Иры
  // Пилот без ИП: сайт не собирает имя/телефон, заказ отправляется Ире сообщением в мессенджер.
  // 'form' — форма заказа с отправкой в бот (включить вместе с ИП и уведомлением в РКН)
  orderMode: 'messenger' as 'messenger' | 'form',
  max: 'https://max.ru/se14698091_bot' as string, // ссылка на MAX-бота (https://max.ru/<имя_бота>) или на профиль/чат в MAX, например https://max.ru/u/…
  avitoProfile: '', // ссылка на профиль на Авито (если есть)
  // Склад в Google Таблице: URL веб-приложения Apps Script (…/exec). Пусто — остатки из products.json
  stockUrl: '' as string,
  freeShippingPairs: 5, // доставка бесплатно от N пар в корзине…
  freeShippingFrom: 2000, // …или от этой суммы (коробка боксеров)
  deliveryPrice: '≈ 150 ₽', // Яндекс ПВЗ → ПВЗ по Новосибирску, уточнить у Иры
  lowStockThreshold: 3, // показывать «Осталось N шт»
  alertStockThreshold: 1, // слать в Telegram «Заканчивается»
} as const;

export const DELIVERY_METHODS = {
  pickup: { title: 'Самовывоз', hint: 'Встреча в Новосибирске — место и время согласуем', needsAddress: false },
  yandex: { title: 'Яндекс Доставка', hint: 'В пункт выдачи Яндекса в Новосибирске, обычно на следующий день', needsAddress: true },
  avito: { title: 'Авито Доставка', hint: 'По городу и в другие города — пришлём ссылку на объявление, оплата на Авито', needsAddress: false },
} as const;

export type DeliveryMethod = keyof typeof DELIVERY_METHODS;

// Демо-сборка для GitHub Pages: без сервера, сайт лежит в подпапке
export const IS_DEMO = process.env.NEXT_PUBLIC_DEMO === '1';
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
/** Путь к файлу из public/ с учётом подпапки (next/image сам её не добавляет) */
export const asset = (src: string) => (src.startsWith('/') ? BASE_PATH + src : src);

/** Вписан ли настоящий Telegram Иры (а не заглушка t.me/username) */
export const telegramReady = !/t\.me\/username$/.test(site.telegram);

/** Заказы принимает бот (t.me/…bot): ему текст через ?text= не передать — копируем и открываем чат */
export const telegramIsBot = /bot\/?$/i.test(site.telegram);

export const freeShippingText = `Доставка бесплатно от ${site.freeShippingPairs} пар`;

/** Бесплатна ли доставка: от N пар или от суммы */
export function isFreeShipping(qty: number, total: number) {
  return qty >= site.freeShippingPairs || total >= site.freeShippingFrom;
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}
