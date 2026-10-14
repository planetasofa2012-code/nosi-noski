'use client';
// Корзина: хранится в localStorage, без регистрации
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { findVariant } from './catalog';

export type CartItem = { sku: string; qty: number };

type CartCtx = {
  items: CartItem[];
  ready: boolean;
  count: number;
  total: number;
  add: (sku: string, qty?: number, max?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = 'myagko-cart-v1';

function load(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]') as CartItem[];
    // Убираем позиции, которых больше нет в каталоге
    return raw.filter((i) => findVariant(i.sku) && i.qty > 0);
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- читаем localStorage только после гидрации
    setItems(load());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* приватный режим — корзина живёт до закрытия вкладки */
    }
  }, [items, ready]);

  const add = useCallback((sku: string, qty = 1, max = Infinity) => {
    setItems((prev) => {
      const cur = prev.find((i) => i.sku === sku);
      if (cur) return prev.map((i) => (i.sku === sku ? { ...i, qty: Math.min(max, i.qty + qty) } : i));
      return [...prev, { sku, qty: Math.min(max, qty) }];
    });
  }, []);

  const setQty = useCallback((sku: string, qty: number) => {
    setItems((prev) => (qty <= 0 ? prev.filter((i) => i.sku !== sku) : prev.map((i) => (i.sku === sku ? { ...i, qty } : i))));
  }, []);

  const remove = useCallback((sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(() => {
    let count = 0;
    let total = 0;
    for (const i of items) {
      const f = findVariant(i.sku);
      if (!f) continue;
      count += i.qty;
      total += f.product.price * i.qty;
    }
    return { items, ready, count, total, add, setQty, remove, clear };
  }, [items, ready, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCart вне CartProvider');
  return ctx;
}
