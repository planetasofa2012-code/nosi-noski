// Заказ в ссылке на бота: t.me/<бот>?start=<код>. Telegram пропускает до 64 символов [A-Za-z0-9_-],
// поэтому артикул сжимаем до 4 символов (хэш), количество — 1 символ.
// Формат: "o" + способ получения (p|y|a) + N × (код артикула 4 + кол-во 1), base36.
// ⚠ Та же функция — в bot/bot.mjs (skuCode); менять только вместе.
import { products, type Product, type Variant } from './catalog';
import type { DeliveryMethod } from './site';

/** FNV-1a 32 бит → 4 символа base36 */
export function skuCode(sku: string) {
  let x = 0x811c9dc5;
  for (const c of new TextEncoder().encode(sku)) {
    x ^= c;
    x = Math.imul(x, 0x01000193) >>> 0;
  }
  return (x % 1679616).toString(36).padStart(4, '0');
}

const METHOD_CODE: Record<DeliveryMethod, string> = { pickup: 'p', yandex: 'y', avito: 'a' };

/** Код заказа для ссылки на бота или null, если корзина не влезает (тогда — копирование текста) */
export function encodeOrder(items: { sku: string; qty: number }[], method: DeliveryMethod) {
  if (!items.length || items.some((i) => i.qty < 1 || i.qty > 35)) return null;
  const code = 'o' + METHOD_CODE[method] + items.map((i) => skuCode(i.sku) + i.qty.toString(36)).join('');
  return code.length <= 64 ? code : null;
}

const METHOD_BY_CODE = Object.fromEntries(Object.entries(METHOD_CODE).map(([m, c]) => [c, m])) as Record<string, DeliveryMethod>;

export type DecodedOrder = {
  method: DeliveryMethod;
  items: { product: Product; variant: Variant; qty: number }[];
  /** позиции, которых нет в каталоге (сайт обновился после заказа) */
  unknown: number;
};

/** Код из ссылки → заказ (для страницы /order у продавца). null — не код заказа */
export function decodeOrder(code: string | null): DecodedOrder | null {
  const m = /^o([pya])((?:[0-9a-z]{5})+)$/.exec(code ?? '');
  if (!m) return null;
  const index = new Map<string, { product: Product; variant: Variant }>();
  for (const product of products) for (const variant of product.variants) index.set(skuCode(variant.sku), { product, variant });
  const items: DecodedOrder['items'] = [];
  let unknown = 0;
  for (const chunk of m[2].match(/.{5}/g)!) {
    const hit = index.get(chunk.slice(0, 4));
    const qty = parseInt(chunk[4], 36);
    if (hit && qty) items.push({ ...hit, qty });
    else unknown++;
  }
  return { method: METHOD_BY_CODE[m[1]], items, unknown };
}
