// Заказ в ссылке на бота: t.me/<бот>?start=<код>. Telegram пропускает до 64 символов [A-Za-z0-9_-],
// поэтому артикул сжимаем до 4 символов (хэш), количество — 1 символ.
// Формат: "o" + способ получения (p|y|a) + N × (код артикула 4 + кол-во 1), base36.
// ⚠ Та же функция — в bot/bot.mjs (skuCode); менять только вместе.
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
