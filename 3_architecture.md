# Стадия 3 — Архитектура

## 1. Файловая структура

```
миниинтернет магазин Ире/
├── 0_research.md … 5.1_tasks.md, PROTOCOL.md
├── shop/                         # магазин (Next.js 16, деплой на Vercel)
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # шапка, подвал, CartProvider
│   │   │   ├── page.tsx              # главная
│   │   │   ├── catalog/page.tsx      # каталог ?c=&sort=
│   │   │   ├── product/[slug]/page.tsx
│   │   │   ├── cart/page.tsx         # корзина + оформление
│   │   │   ├── thanks/page.tsx
│   │   │   ├── delivery|about|privacy/page.tsx
│   │   │   ├── api/order/route.ts    # приём заказа
│   │   │   ├── api/stock/route.ts    # актуальные остатки для клиента
│   │   │   ├── avito.xml/route.ts    # фид автозагрузки Авито
│   │   │   ├── sitemap.ts, robots.ts
│   │   ├── components/               # ProductCard, Gallery, VariantPicker, CartButton, …
│   │   ├── data/products.json        # каталог (единый источник для сайта, студии, Авито)
│   │   ├── lib/
│   │   │   ├── catalog.ts            # чтение каталога, типы, поиск по sku
│   │   │   ├── stock.ts              # остатки: Google Sheets → fallback JSON
│   │   │   ├── telegram.ts           # отправка сообщений
│   │   │   ├── order.ts              # валидация (zod), пересчёт, номер заказа
│   │   │   ├── cart.tsx              # контекст корзины + localStorage
│   │   │   └── site.ts               # название, контакты, порог бесплатной доставки
│   │   └── avito.config.ts           # соответствие категорий сайта → категории Авито
│   ├── public/products/<slug>/*.png  # фото товаров
│   └── scripts/stock-export.mjs      # CSV всех SKU для импорта в таблицу
├── studio/                       # фотостудия (локальный Node.js, без зависимостей)
│   ├── server.mjs                    # http-сервер на 127.0.0.1:4545
│   ├── lib/nanobanana.mjs            # OpenRouter / Gemini API
│   ├── lib/scenes.mjs                # шаблоны промптов сцен
│   ├── lib/avito.mjs                 # генерация текста объявления
│   ├── public/index.html             # UI: Фото | Авито | Склад
│   └── output/                       # история генераций
└── stock/
    ├── apps-script.gs                # веб-приложение Google Таблицы
    └── README.md                     # как подключить таблицу за 5 минут
```

## 2. Модули и связи

```
           products.json ──────────────┬───────────────┬──────────────┐
                │                      │               │              │
           lib/catalog.ts         studio (save)   avito.xml      stock-export
                │
   ┌────────────┼──────────────┐
 страницы    api/order      lib/stock.ts ──► Google Sheets (Apps Script)
 (SSG/ISR)      │                 ▲               ▲
                ├── проверка ─────┘               │
                ├── списание ─────────────────────┘
                └── lib/notify.ts ──► Telegram + MAX (заказ, «заканчивается»)
```

## 3. Потоки данных

### 3.1. Заказ
1. Клиент выбирает размер/цвет → в корзину кладётся `sku` и `qty` (≤ остаток из `/api/stock`).
2. «Оформить» → `POST /api/order`.
3. Сервер: валидация zod → honeypot → находит каждый `sku` в каталоге → берёт **свежие** остатки (без кэша) → при нехватке `409` с актуальными остатками.
4. Пересчёт суммы по ценам каталога, номер `M-YYMMDD-XXXX`.
5. Списание в Google Sheets (если подключено) → лог.
6. Сообщение в Telegram: заказ + отдельное «⚠️ Заканчивается» при остатке ≤ 1.
7. Ответ `{ ok, orderId }` → корзина очищается → `/thanks?id=`.

Порядок «списать → уведомить» выбран, чтобы два покупателя не купили последнюю пару. Если Telegram недоступен — заказ не теряется: он уже в листе `log` таблицы.

### 3.2. Остатки на витрине
- Next 16 с Cache Components: остатки кэшируются функцией `'use cache'` + `cacheLife({ revalidate: 120 })` + `cacheTag('stock')`; после заказа — `revalidateTag('stock')`. Страницы пререндерятся статически и обновляются в фоне.
- Корзина/карточка дополнительно запрашивают `/api/stock?skus=…` при открытии — свежие данные для кнопок.

### 3.3. Фото
Студия: файлы → base64 → OpenRouter `chat/completions` (`modalities: ["image","text"]`) → картинки → `POST /api/save` → `shop/public/products/<slug>/N.png` + путь в JSON → деплой (git push / `vercel deploy`).

### 3.4. Авито
`GET /avito.xml` → `products.json` + остатки → `<Ads formatVersion="3" target="Avito.ru"><Ad>…</Ad></Ads>`, по одному объявлению на товар (размеры перечислены в описании), только позиции с остатком > 0.

## 4. Конфигурация (env)

| Переменная | Где | Обяз. | Описание |
|------------|-----|-------|----------|
| `TELEGRAM_BOT_TOKEN` | shop | нет* | бот для заказов |
| `TELEGRAM_CHAT_ID` | shop | нет* | чат/группа продавцов |
| `MAX_BOT_TOKEN` | shop | нет* | бот MAX (@MasterBot) |
| `MAX_CHAT_ID` / `MAX_USER_ID` | shop | нет* | группа (бот — админ) или личка |
| `MAX_API_URL` | shop | нет | по умолч. `https://platform-api2.max.ru` |
| `STOCK_API_URL` | shop, studio | нет | URL веб-приложения Apps Script |
| `STOCK_API_KEY` | shop, studio | нет | общий секрет со скриптом |
| `NEXT_PUBLIC_SITE_URL` | shop | нет | для sitemap, OG, фида |
| `OPENROUTER_API_KEY` | studio | да** | ключ OpenRouter (берётся из `~/.env.keys`) |
| `GEMINI_API_KEY` | studio | да** | альтернатива — прямой Google API |

\* без них заказ пишется в лог сервера — удобно для теста. \** нужен один из двух.

## 5. Деплой
- `shop` → Vercel (root directory `shop`), переменные — в настройках проекта.
- `studio` → только локально: `node studio/server.mjs` (или `studio/start.bat`).
- Google Таблица → «Развернуть как веб-приложение» (доступ: все, у кого есть ссылка; защита — `STOCK_API_KEY`).

## 6. Принципы
- Один источник правды о товарах — `products.json`; об остатках — таблица (fallback — JSON).
- Сервер не доверяет клиенту: цены и остатки всегда перепроверяются.
- Никаких ПДн в базе сайта на MVP — заказы уходят в Telegram и лог таблицы владельца.
- Ключ AI не уходит в браузер и в интернет — студия локальная.
