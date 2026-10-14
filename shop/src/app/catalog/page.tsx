import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogView } from '@/components/CatalogView';
import { getStock } from '@/lib/stock';

export const metadata: Metadata = { title: 'Каталог' };

// Страница статическая; фильтр и сортировка по ?c= и ?sort= — в браузере
export default async function CatalogPage() {
  const stock = await getStock();
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogView stock={stock} />
    </Suspense>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <div className="h-9 w-56 animate-pulse rounded-full bg-surface-2" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-[20px] bg-surface-2" />)}
      </div>
    </div>
  );
}
