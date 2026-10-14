'use client';
import { useRef } from 'react';
import type { Category } from '@/lib/catalog';

// Размерные сетки — поправьте под свою продукцию
const GUIDES: Record<'socks' | 'underwear', { head: string[]; rows: string[][] }> = {
  socks: {
    head: ['Размер носков', 'Размер обуви', 'Длина стопы'],
    rows: [
      ['35-40', '35–40', '22,5–25,5 см'],
      ['36-39', '36–39', '23–25 см'],
      ['40-45', '40–45', '25,5–29 см'],
      ['40-43', '40–43', '25,5–28 см'],
      ['44-46', '44–46', '28,5–30 см'],
    ],
  },
  underwear: {
    head: ['Размер', 'RU', 'Обхват бёдер', 'Обхват талии'],
    rows: [
      ['XS', '40–42', '86–90 см', '62–66 см'],
      ['S', '42–44', '90–94 см', '66–70 см'],
      ['M', '44–46', '94–98 см', '70–76 см'],
      ['L', '46–48', '98–104 см', '76–82 см'],
      ['XL', '48–50', '104–110 см', '82–90 см'],
      ['XXL', '50–52', '110–116 см', '90–98 см'],
    ],
  },
};

export function SizeGuide({ category }: { category: Category }) {
  const ref = useRef<HTMLDialogElement>(null);
  const guide = GUIDES[category === 'socks' || category === 'sets' ? 'socks' : 'underwear'];
  return (
    <>
      <button type="button" onClick={() => ref.current?.showModal()} className="text-sm underline underline-offset-4">
        Таблица размеров
      </button>
      <dialog
        ref={ref}
        onClick={(e) => e.target === ref.current && ref.current?.close()}
        className="m-auto w-[min(92vw,520px)] rounded-[20px] bg-surface p-0 text-ink backdrop:bg-black/40"
      >
        <div className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Таблица размеров</h2>
            <button type="button" onClick={() => ref.current?.close()} className="h-10 w-10 rounded-full hover:bg-surface-2" aria-label="Закрыть">
              ✕
            </button>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>{guide.head.map((h) => <th key={h} className="py-2 pr-3 font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {guide.rows.map((r) => (
                  <tr key={r[0]} className="border-t border-line">
                    {r.map((c, i) => <td key={i} className="py-2 pr-3">{c}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">Если вы между размерами — берите больший или напишите нам, подскажем.</p>
        </div>
      </dialog>
    </>
  );
}
