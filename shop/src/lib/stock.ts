// Остатки по позициям: Google Таблица (Apps Script) → запасной вариант products.json
import { cacheLife, cacheTag } from 'next/cache';
import { jsonStock, type StockMap } from './catalog';

const API_URL = process.env.STOCK_API_URL;
const API_KEY = process.env.STOCK_API_KEY ?? '';

export const STOCK_TAG = 'stock';
export const isSheetConnected = () => Boolean(API_URL);

/**
 * fresh=false — кэш на 2 минуты (для страниц),
 * fresh=true — без кэша (проверка перед заказом).
 */
export async function getStock({ fresh = false } = {}): Promise<StockMap> {
  return fresh ? loadStock() : cachedStock();
}

async function cachedStock() {
  'use cache';
  cacheLife({ stale: 60, revalidate: 120, expire: 3600 });
  cacheTag(STOCK_TAG);
  return loadStock();
}

async function loadStock(): Promise<StockMap> {
  const base = jsonStock();
  if (!API_URL) return base;
  try {
    const res = await fetch(`${API_URL}?key=${encodeURIComponent(API_KEY)}`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as { stock?: StockMap; error?: string };
    if (!body.stock) throw new Error(body.error ?? 'нет поля stock');
    // Позиции, которых нет в таблице, считаем отсутствующими
    const merged: StockMap = {};
    for (const sku of Object.keys(base)) merged[sku] = Math.max(0, Number(body.stock[sku] ?? 0));
    return merged;
  } catch (err) {
    console.error('[stock] Таблица недоступна, берём остатки из JSON:', err);
    return base;
  }
}

/** Списать остатки после заказа. Возвращает новые остатки или null, если таблица не подключена */
export async function decrementStock(orderId: string, items: { sku: string; qty: number }[]): Promise<StockMap | null> {
  if (!API_URL) return null;
  const res = await fetch(API_URL, {
    method: 'POST',
    // text/plain — чтобы Apps Script принял запрос без CORS-preflight
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ key: API_KEY, orderId, items }),
    cache: 'no-store',
  });
  const body = (await res.json()) as { ok: boolean; stock?: StockMap; error?: string };
  if (!body.ok) throw new Error(body.error ?? 'Не удалось списать остатки');
  return body.stock ?? {};
}
