'use client';
// Панель «Склад» в карточке товара — видна только продавцу (вошёл на /admin с ключом).
// Ира меняет остатки по каждому цвету/размеру → «Сохранить» → запись в Google Таблицу.
import Link from 'next/link';
import { useState } from 'react';
import type { Product, StockMap } from '@/lib/catalog';
import { saveStock, useAdminKey } from '@/lib/liveStock';
import { site } from '@/lib/site';

export function StockPanel({ product, stock, onSaved }: { product: Product; stock: StockMap; onSaved: (s: StockMap) => void }) {
  const [draft, setDraft] = useState<StockMap>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | string>('idle');

  const adminKey = useAdminKey();
  if (!site.stockUrl || !adminKey) return null;

  const value = (sku: string) => draft[sku] ?? stock[sku] ?? 0;
  const set = (sku: string, v: number) => {
    setDraft((d) => ({ ...d, [sku]: Math.max(0, v) }));
    setStatus('idle');
  };
  const changed = Object.entries(draft).filter(([sku, v]) => v !== (stock[sku] ?? 0));
  const colorName = (id: string) => product.colors.find((c) => c.id === id)?.name ?? id;

  async function save() {
    setStatus('saving');
    try {
      const saved = await saveStock(changed.map(([sku, v]) => ({ sku, stock: v })));
      onSaved(saved);
      setDraft({});
      setStatus('saved');
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Не сохранилось');
    }
  }

  return (
    <section className="mt-6 rounded-2xl border-2 border-dashed border-ink bg-surface-2 p-4">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Склад · видно только вам</h2>
        <Link href="/admin" className="text-xs underline">выйти</Link>
      </div>
      <ul className="mt-3 divide-y divide-line">
        {product.variants.map((v) => {
          const val = value(v.sku);
          const dirty = draft[v.sku] !== undefined && draft[v.sku] !== (stock[v.sku] ?? 0);
          return (
            <li key={v.sku} className="flex items-center justify-between gap-3 py-2">
              <span className={`text-sm ${val === 0 ? 'text-muted' : ''}`}>
                {colorName(v.color)}, {v.size}
              </span>
              <span className="flex items-center gap-1.5">
                <button type="button" onClick={() => set(v.sku, val - 1)} className="h-9 w-9 rounded-full border border-line bg-surface text-lg" aria-label="Меньше">−</button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={val}
                  onChange={(e) => set(v.sku, Number(e.target.value) || 0)}
                  className={`h-9 w-14 rounded-lg border bg-bg text-center font-semibold ${dirty ? 'border-ink' : 'border-line'}`}
                />
                <button type="button" onClick={() => set(v.sku, val + 1)} className="h-9 w-9 rounded-full border border-line bg-surface text-lg" aria-label="Больше">+</button>
              </span>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={save}
        disabled={!changed.length || status === 'saving'}
        className="mt-3 w-full rounded-full bg-ink py-3 font-bold text-bg disabled:opacity-40"
      >
        {status === 'saving' ? 'Сохраняю…' : changed.length ? `Сохранить в таблицу (${changed.length})` : 'Сохранить в таблицу'}
      </button>
      <p className="mt-2 text-center text-xs text-muted" aria-live="polite">
        {status === 'saved' ? 'Сохранено ✓ — таблица и сайт обновлены' : status !== 'idle' && status !== 'saving' ? status : 'Измените числа и нажмите «Сохранить»'}
      </p>
    </section>
  );
}
