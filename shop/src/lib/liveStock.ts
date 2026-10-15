// Живые остатки из Google Таблицы прямо в браузере (статичный сайт, без своего сервера)
// и режим продавца: Ира вводит ключ один раз — в карточках появляется панель «Склад».
import { useSyncExternalStore } from 'react';
import type { StockMap } from './catalog';
import { site } from './site';

let pending: Promise<StockMap | null> | null = null;

/** Остатки из таблицы (один запрос на открытие страницы) или null, если склад не подключён/недоступен */
export function fetchLiveStock(): Promise<StockMap | null> {
  if (!site.stockUrl) return Promise.resolve(null);
  pending ??= fetch(site.stockUrl)
    .then((r) => r.json())
    .then((b: { stock?: StockMap }) => b.stock ?? null)
    .catch(() => null);
  return pending;
}

/** POST в Apps Script: text/plain — без CORS-preflight, который Apps Script не умеет */
async function post<T>(body: object): Promise<T> {
  const res = await fetch(site.stockUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) });
  return res.json() as Promise<T>;
}

const KEY_STORAGE = 'nosinoski-admin-key';

export function getAdminKey(): string | null {
  try {
    return localStorage.getItem(KEY_STORAGE);
  } catch {
    return null;
  }
}

/** Проверить ключ в таблице и запомнить на этом устройстве */
export async function adminLogin(key: string): Promise<boolean> {
  const r = await post<{ ok: boolean }>({ key, action: 'check' });
  if (r.ok) {
    localStorage.setItem(KEY_STORAGE, key);
    listeners.forEach((l) => l());
  }
  return r.ok;
}

export function adminLogout() {
  try {
    localStorage.removeItem(KEY_STORAGE);
  } catch {}
  listeners.forEach((l) => l());
}

// Подписка на вход/выход — чтобы React перерисовал страницу (ключ живёт в localStorage)
const listeners = new Set<() => void>();
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
/** Ключ продавца на этом устройстве; undefined — ещё не известно (рендер на сервере) */
export function useAdminKey(): string | null | undefined {
  return useSyncExternalStore(subscribe, getAdminKey, () => undefined);
}

/** Записать остатки (абсолютные значения) — вернёт сохранённые значения */
export async function saveStock(items: { sku: string; stock: number }[]): Promise<StockMap> {
  const r = await post<{ ok: boolean; stock?: StockMap; error?: string }>({ key: getAdminKey(), action: 'set', items });
  if (!r.ok) throw new Error(r.error === 'forbidden' ? 'Ключ не подходит — войдите заново' : (r.error ?? 'Не сохранилось'));
  return r.stock ?? {};
}
