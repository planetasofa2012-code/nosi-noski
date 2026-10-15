import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrderView } from '@/components/OrderView';

// Заказ для продавца: бот присылает ссылку /order/?c=<код> — здесь он виден с фото, цветом и размером
export const metadata: Metadata = { title: 'Заказ', robots: { index: false, follow: false } };

export default function OrderPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-10">
      <Suspense fallback={null}>
        <OrderView />
      </Suspense>
    </div>
  );
}
