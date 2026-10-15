import type { Metadata } from 'next';
import { AdminLogin } from '@/components/AdminLogin';

// Вход продавца: ключ из Apps Script (KEY) запоминается на устройстве — в карточках появляется панель «Склад»
export const metadata: Metadata = { title: 'Вход для продавца', robots: { index: false, follow: false } };

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-sm px-4 pt-14">
      <h1 className="font-display text-2xl font-semibold">Вход для продавца</h1>
      <AdminLogin />
    </div>
  );
}
