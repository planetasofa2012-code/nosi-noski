// Заказ: схема, пересчёт по каталогу, текст уведомления
import { z } from 'zod';
import { colorName, findVariant, type StockMap } from './catalog';
import { DELIVERY_METHODS, formatPrice, site, type DeliveryMethod } from './site';
import { escapeHtml } from './telegram';

const deliveryKeys = Object.keys(DELIVERY_METHODS) as [DeliveryMethod, ...DeliveryMethod[]];

export const orderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2, 'Укажите имя').max(80),
    phone: z.string().trim().regex(/^[+\d][\d\s()-]{9,19}$/, 'Проверьте номер телефона'),
    telegram: z.string().trim().max(40).optional().default(''),
    consent: z.literal(true, { error: 'Нужно согласие на обработку данных' }),
  }),
  delivery: z.object({
    method: z.enum(deliveryKeys),
    address: z.string().trim().max(300).optional().default(''),
  }),
  comment: z.string().trim().max(500).optional().default(''),
  items: z.array(z.object({ sku: z.string().max(120), qty: z.number().int().min(1).max(50) })).min(1, 'Корзина пуста').max(50),
  website: z.string().max(500).optional(), // honeypot: живые люди это поле не видят
});

export type OrderInput = z.infer<typeof orderSchema>;

export type OrderLine = { sku: string; title: string; size: string; color: string; qty: number; price: number; sum: number };

export class UnknownItemError extends Error {}

export class StockError extends Error {
  constructor(public shortages: { sku: string; title: string; available: number }[]) {
    super('Недостаточно товара');
  }
}

/** Пересчитать позиции по каталогу и проверить остатки */
export function buildLines(items: OrderInput['items'], stock: StockMap): OrderLine[] {
  // Склеиваем одинаковые sku
  const merged = new Map<string, number>();
  for (const it of items) merged.set(it.sku, (merged.get(it.sku) ?? 0) + it.qty);

  const lines: OrderLine[] = [];
  const shortages: StockError['shortages'] = [];
  for (const [sku, qty] of merged) {
    const found = findVariant(sku);
    if (!found) throw new UnknownItemError('Один из товаров в корзине больше не продаётся — обновите страницу корзины.');
    const { product, variant } = found;
    const title = product.title;
    const available = stock[sku] ?? 0;
    if (qty > available) shortages.push({ sku, title: `${title} (${variant.size}, ${colorName(product, variant.color)})`, available });
    lines.push({ sku, title, size: variant.size, color: colorName(product, variant.color), qty, price: product.price, sum: product.price * qty });
  }
  if (shortages.length) throw new StockError(shortages);
  return lines;
}

export function makeOrderId(now = new Date()) {
  const ymd = now.toISOString().slice(2, 10).replace(/-/g, '');
  return `M-${ymd}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function orderMessage(id: string, order: OrderInput, lines: OrderLine[], total: number) {
  const e = escapeHtml;
  const c = order.customer;
  const d = DELIVERY_METHODS[order.delivery.method];
  const tg = c.telegram ? ` · ${e(c.telegram)}` : '';
  return [
    `🧦 <b>Новый заказ ${id}</b>`,
    `👤 ${e(c.name)} · ${e(c.phone)}${tg}`,
    `🚚 ${d.title}${order.delivery.address ? ' — ' + e(order.delivery.address) : ''}`,
    '',
    ...lines.map((l) => `• ${e(l.title)} — ${e(l.size)}, ${e(l.color.toLowerCase())} × ${l.qty} = ${formatPrice(l.sum)}`),
    '',
    `💰 <b>Итого: ${formatPrice(total)}</b>${total >= site.freeShippingFrom ? ' (бесплатная доставка)' : ''}`,
    order.comment ? `💬 «${e(order.comment)}»` : '',
  ].filter((s, i, a) => s !== '' || a[i - 1] !== '').join('\n');
}

export function lowStockMessage(lines: OrderLine[], newStock: StockMap) {
  const low = lines.filter((l) => (newStock[l.sku] ?? 0) <= site.alertStockThreshold);
  if (!low.length) return null;
  return '⚠️ <b>Заканчивается:</b>\n' + low.map((l) => `• ${escapeHtml(l.title)} ${escapeHtml(l.size)} ${escapeHtml(l.color.toLowerCase())} — осталось ${newStock[l.sku] ?? 0}`).join('\n');
}
