// Бот заказов «Носи носки» — Telegram и MAX в одном процессе.
// Покупатель вставляет текст заказа из корзины → бот пересылает его всем продавцам (в оба мессенджера);
// продавец отвечает реплаем («Ответить») → ответ уходит покупателю туда, откуда он писал.
// Без зависимостей, long polling. Запуск: node bot/bot.mjs (Node 18+).
//
// Переменные (значения — в ~/.env.keys и bot/.env, не в коде). Мессенджер без токена просто не запускается.
//   ORDER_BOT_TOKEN   — токен Telegram-бота от @BotFather
//   ORDER_ADMIN_IDS   — chat id продавцов в Telegram через запятую (написать боту /id)
//   MAX_BOT_TOKEN     — токен MAX-бота (business.max.ru / @MasterBot)
//   MAX_ADMIN_IDS     — user id продавцов в MAX через запятую (написать боту /id)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
loadEnv(join(here, '.env'));

const SHOP = 'Носи носки';
// Сайт со страницей заказа /order/?c=<код> (фото, цвет, размер) — ссылку бот добавляет продавцу
const SITE = (process.env.ORDER_SITE_URL ?? 'https://nosinoski.ru').replace(/\/$/, '');
const STATE_FILE = join(here, 'state.json');
const ids = (v) => (v ?? '').split(',').map((s) => s.trim()).filter(Boolean);

// Состояние: курсоры апдейтов и связка «сообщение у продавца → покупатель» (для ответов)
const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf8')) : {};
state.cursor ??= {};
state.links ??= {};
state.ctx ??= {}; // чат покупателя → slug товара, о котором он спрашивает
const save = () => writeFileSync(STATE_FILE, JSON.stringify(state));

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const isOrder = (text) => /Хочу заказать|Итого:/i.test(text);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─── Заказ из ссылки сайта (?start=<код>, формат — shop/src/lib/orderCode.ts) ──
const CATALOG = join(here, '../shop/src/data/products.json');
const METHODS = { p: 'Самовывоз', y: 'Яндекс Доставка (ПВЗ)', a: 'Авито Доставка' };
// как в shop/src/lib/site.ts: бесплатная доставка от 5 пар или от 2000 ₽
const FREE_PAIRS = 5;
const FREE_FROM = 2000;
const DELIVERY_PRICE = '≈ 150 ₽';
const rub = (n) => new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

// ⚠ Та же функция — в shop/src/lib/orderCode.ts; менять только вместе
function skuCode(sku) {
  let x = 0x811c9dc5;
  for (const c of new TextEncoder().encode(sku)) {
    x ^= c;
    x = Math.imul(x, 0x01000193) >>> 0;
  }
  return (x % 1679616).toString(36).padStart(4, '0');
}

/** Товар по slug (для вопросов со страницы товара) или null */
function productBySlug(slug) {
  if (!slug) return null;
  return JSON.parse(readFileSync(CATALOG, 'utf8')).find((p) => p.slug === slug) ?? null;
}

/** Код → текст заказа, или null. Каталог читаем каждый раз — обновился сайт, обновился и бот (после git pull) */
function decodeOrder(code) {
  const m = /^o([pya])((?:[0-9a-z]{5})+)$/.exec(code ?? '');
  if (!m) return null;
  const index = new Map();
  for (const p of JSON.parse(readFileSync(CATALOG, 'utf8'))) for (const v of p.variants) index.set(skuCode(v.sku), { p, v });
  const lines = [];
  let total = 0;
  let qtyAll = 0;
  for (const chunk of m[2].match(/.{5}/g)) {
    const hit = index.get(chunk.slice(0, 4));
    const qty = parseInt(chunk[4], 36);
    if (!hit || !qty) {
      lines.push('• ⚠ неизвестный товар (сайт обновился?) — уточнить у покупателя');
      continue;
    }
    const { p, v } = hit;
    const color = (p.colors.find((c) => c.id === v.color)?.name ?? v.color).toLowerCase();
    lines.push(`• ${p.title} — ${v.size}, ${color} × ${qty} = ${rub(p.price * qty)}`);
    total += p.price * qty;
    qtyAll += qty;
  }
  const free = qtyAll >= FREE_PAIRS || total >= FREE_FROM;
  const cost = m[1] === 'p' ? '' : m[1] === 'a' ? ' (по тарифу Авито)' : free ? ' (бесплатно)' : ` (доставка ${DELIVERY_PRICE})`;
  return [`Хочу заказать в «${SHOP}»:`, ...lines, `Итого: ${rub(total)}`, `Получение: ${METHODS[m[1]]}${cost}`].join('\n');
}

// ─── Транспорты ───────────────────────────────────────────────
// Общий вид входящего: { chat, from: {name, username, id}, text, replyTo, start }
// send(chat, html) → id отправленного сообщения

function telegram(token, admins) {
  async function api(method, body) {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`${method}: ${data.description}`);
    return data.result;
  }
  return {
    name: 'Telegram',
    key: 'tg',
    admins,
    async me() {
      const m = await api('getMe', {});
      return `@${m.username}`;
    },
    async send(chat, html) {
      const m = await api('sendMessage', { chat_id: chat, text: html, parse_mode: 'HTML', disable_web_page_preview: true });
      return String(m.message_id);
    },
    async poll() {
      const updates = await api('getUpdates', { offset: state.cursor.tg ?? 0, timeout: 50, allowed_updates: ['message'] });
      const out = [];
      for (const u of updates) {
        state.cursor.tg = u.update_id + 1;
        const m = u.message;
        if (!m) continue;
        const text = m.text ?? m.caption ?? '';
        out.push({
          chat: String(m.chat.id),
          from: { name: [m.from.first_name, m.from.last_name].filter(Boolean).join(' '), username: m.from.username, id: m.from.id },
          text: text || (m.photo || m.document ? '[фото/файл — посмотрите в чате бота]' : ''),
          replyTo: m.reply_to_message ? String(m.reply_to_message.message_id) : null,
          start: text.startsWith('/start'),
          payload: text.startsWith('/start ') ? text.slice(7).trim() : '',
        });
      }
      return out;
    },
    contact: (f) => (f.username ? `@${f.username}` : `<a href="tg://user?id=${f.id}">профиль</a>`),
  };
}

function max(token, admins) {
  const base = process.env.MAX_API_URL ?? 'https://platform-api.max.ru';
  async function api(path, init = {}) {
    const res = await fetch(base + path, { ...init, headers: { Authorization: token, 'Content-Type': 'application/json', ...init.headers } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`MAX ${path.split('?')[0]} ${res.status}: ${JSON.stringify(body)}`);
    return body;
  }
  return {
    name: 'MAX',
    key: 'max',
    admins,
    async me() {
      const m = await api('/me');
      return `@${m.username ?? m.name}`;
    },
    // В MAX личный чат адресуем по user_id — и покупателя, и продавца
    async send(user, html) {
      const r = await api(`/messages?user_id=${encodeURIComponent(user)}&disable_link_preview=true`, {
        method: 'POST',
        body: JSON.stringify({ text: html.slice(0, 4000), format: 'html', notify: true }),
      });
      return String(r.message?.body?.mid ?? '');
    },
    async poll() {
      const marker = state.cursor.max ? `&marker=${state.cursor.max}` : '';
      const r = await api(`/updates?timeout=30&limit=100&types=message_created,bot_started${marker}`);
      if (r.marker != null) state.cursor.max = r.marker;
      const out = [];
      for (const u of r.updates ?? []) {
        if (u.update_type === 'bot_started') {
          out.push({ chat: String(u.user.user_id), from: { name: u.user.name, username: u.user.username, id: u.user.user_id }, text: '/start', replyTo: null, start: true, payload: u.payload ?? '' });
          continue;
        }
        const m = u.message;
        if (!m || m.recipient?.chat_type !== 'dialog') continue; // только личка с ботом
        const text = m.body?.text ?? '';
        out.push({
          chat: String(m.sender.user_id),
          from: { name: m.sender.name, username: m.sender.username, id: m.sender.user_id },
          text: text || (m.body?.attachments?.length ? '[вложение — посмотрите в чате бота]' : ''),
          replyTo: m.link?.type === 'reply' ? String(m.link.message?.mid ?? '') : null,
          start: text.startsWith('/start'),
          payload: text.startsWith('/start ') ? text.slice(7).trim() : '',
        });
      }
      return out;
    },
    contact: (f) => (f.username ? `@${f.username}` : `id ${f.id}`),
  };
}

// Проверка кода заказа без мессенджеров: node bot/bot.mjs --decode op7hym1…
if (process.argv[2] === '--decode') {
  console.log(decodeOrder(process.argv[3]) ?? 'Не код заказа');
  process.exit(0);
}

const transports = [];
if (process.env.ORDER_BOT_TOKEN) transports.push(telegram(process.env.ORDER_BOT_TOKEN, ids(process.env.ORDER_ADMIN_IDS)));
if (process.env.MAX_BOT_TOKEN) transports.push(max(process.env.MAX_BOT_TOKEN, ids(process.env.MAX_ADMIN_IDS)));
if (!transports.length) {
  console.error('Нет ни ORDER_BOT_TOKEN, ни MAX_BOT_TOKEN — впишите токены в bot/.env (см. bot/.env.example)');
  process.exit(1);
}
const byKey = Object.fromEntries(transports.map((t) => [t.key, t]));

// ─── Логика магазина ──────────────────────────────────────────

async function handle(t, m) {
  const reply = (html) => t.send(m.chat, html);

  if (m.text === '/id') return reply(`Ваш id в ${t.name}: <b>${m.chat}</b>`);

  // Продавец: реплай на пересланный заказ → ответ покупателю в его мессенджер
  // (заказ с сайта по ссылке — обрабатываем как покупательский даже от продавца: так удобно тестировать)
  if (t.admins.includes(m.chat) && !(m.start && decodeOrder(m.payload))) {
    const target = m.replyTo && state.links[`${t.key}:${m.chat}:${m.replyTo}`];
    if (target) {
      await byKey[target.via].send(target.chat, esc(m.text));
      return reply('✓ Отправлено покупателю');
    }
    if (m.start) return reply('Вы продавец. Сюда приходят заказы с сайта. Чтобы ответить покупателю — нажмите «Ответить» на его заказе и напишите текст.');
    return reply('Чтобы ответить покупателю, нажмите «Ответить» на его сообщении.');
  }

  // Покупатель пришёл с сайта по кнопке «Оформить» — заказ уже в ссылке
  const fromSite = m.start && decodeOrder(m.payload);
  if (fromSite) {
    m.text = fromSite;
    m.orderCode = m.payload;
    await forward(t, m);
    return reply(
      `Спасибо, заказ получен! ✅

${esc(fromSite)}

Продавец проверит наличие и напишет вам здесь. ` +
        'Если нужно — напишите сюда удобный пункт выдачи, время или вопрос по размеру.',
    );
  }

  // Покупатель пришёл из подсказки «Помочь с выбором?» на сайте: ?start=help или ?start=q_<slug товара>
  if (m.start && /^(help|q_[a-z0-9-]+)$/.test(m.payload)) {
    const product = m.payload.startsWith('q_') ? productBySlug(m.payload.slice(2)) : null;
    state.ctx[`${t.key}:${m.chat}`] = product?.slug ?? null;
    save();
    return reply(
      `Здравствуйте! Это магазин «${SHOP}» 🧦\n\n` +
        (product ? `Вы смотрели <b>${esc(product.title)}</b>. ` : '') +
        'Напишите вопрос — про размер, цвет, наличие или что выбрать в подарок. Продавец ответит здесь же.',
    );
  }

  // Покупатель
  if (m.start) {
    return reply(`Здравствуйте! Это магазин «${SHOP}» 🧦\n\nВставьте сюда текст заказа — он уже скопирован на сайте (нажмите на поле ввода → «Вставить») — и отправьте.\n\nИли просто напишите вопрос — продавец ответит здесь же.`);
  }
  if (!m.text) return;
  await forward(t, m);
  return reply(
    isOrder(m.text)
      ? 'Спасибо, заказ получен! ✅ Продавец проверит наличие и напишет вам здесь в ближайшее время.'
      : 'Сообщение передано продавцу — ответ придёт сюда.',
  );
}

/** Переслать сообщение покупателя всем продавцам (во все мессенджеры) с привязкой для ответа */
async function forward(t, m) {
  const head = isOrder(m.text) ? '🛒 <b>Новый заказ</b>' : '💬 <b>Сообщение</b>';
  const link = m.orderCode ? `\n\n📷 Заказ с фото: ${SITE}/order/?c=${m.orderCode}` : '';
  // о каком товаре спрашивает (запомнили, когда пришёл из подсказки на странице товара)
  const about = !m.orderCode && productBySlug(state.ctx[`${t.key}:${m.chat}`]);
  const ctx = about ? `\nПро товар: «${esc(about.title)}» — ${SITE}/product/${about.slug}/` : '';
  const html = `${head} · ${t.name}\nОт: ${esc(m.from.name ?? '')} (${t.contact(m.from)})${ctx}\n\n${esc(m.text)}${link}`;
  let delivered = 0;
  for (const a of transports) {
    for (const admin of a.admins) {
      try {
        const mid = await a.send(admin, html);
        state.links[`${a.key}:${admin}:${mid}`] = { via: t.key, chat: m.chat };
        delivered++;
      } catch (e) {
        console.error(`Не доставлено продавцу ${a.name} ${admin}:`, e.message);
      }
    }
  }
  save();
  if (!delivered) console.error('⚠ Заказ никому не доставлен — проверьте *_ADMIN_IDS:', m.text);
}

async function loop(t) {
  console.log(`${t.name}: бот ${await t.me()} запущен, продавцы: ${t.admins.join(', ') || '— (напишите боту /id)'}`);
  for (;;) {
    try {
      const msgs = await t.poll();
      for (const m of msgs) await handle(t, m).catch((e) => console.error(`${t.name}, ошибка обработки:`, e.message));
      save();
    } catch (e) {
      console.error(`${t.name}, сеть:`, e.message, '— повтор через 5 с');
      await sleep(5000);
    }
  }
}

// Простейший .env-загрузчик (без dotenv)
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

await Promise.all(transports.map((t) => loop(t).catch((e) => console.error(`${t.name} не запустился:`, e.message))));
