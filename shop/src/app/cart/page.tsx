import type { Metadata } from 'next';
import { CartView } from '@/components/CartView';

export const metadata: Metadata = { title: 'Корзина', robots: { index: false } };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <h1 className="font-display text-3xl font-semibold">Корзина</h1>
      <CartView />
    </div>
  );
}
