'use client';
import Link from 'next/link';
import { useState } from 'react';
import { adminLogin, adminLogout, useAdminKey } from '@/lib/liveStock';
import { site } from '@/lib/site';

export function AdminLogin() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const adminKey = useAdminKey();

  if (!site.stockUrl) return <p className="mt-4 text-muted">Склад ещё не подключён: в настройках сайта не указан адрес Google Таблицы (stockUrl).</p>;
  if (adminKey === undefined) return null;

  if (adminKey)
    return (
      <div className="mt-4 space-y-4">
        <p>Вы вошли ✓ Откройте любой товар — под кнопкой «В корзину» будет панель «Склад»: меняйте остатки и жмите «Сохранить».</p>
        <Link href="/catalog" className="btn-sticker block rounded-full bg-accent py-3.5 text-center font-bold text-accent-ink">В каталог</Link>
        <button type="button" onClick={adminLogout} className="w-full rounded-full border border-line py-3 text-sm font-semibold">
          Выйти на этом устройстве
        </button>
      </div>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (!(await adminLogin(key.trim()))) setError('Ключ не подходит');
    } catch {
      setError('Нет связи с таблицей — попробуйте ещё раз');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <p className="text-sm text-muted">Введите ключ склада один раз — телефон его запомнит.</p>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        autoComplete="current-password"
        className="h-12 w-full rounded-[14px] border border-line bg-bg px-3.5 outline-none focus:border-ink"
        placeholder="Ключ"
      />
      {error && <p className="text-sm font-semibold text-hot">{error}</p>}
      <button disabled={busy || !key.trim()} className="btn-sticker w-full rounded-full bg-accent py-3.5 font-bold text-accent-ink disabled:opacity-50">
        {busy ? 'Проверяю…' : 'Войти'}
      </button>
    </form>
  );
}
