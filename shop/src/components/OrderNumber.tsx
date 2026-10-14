'use client';
import { useSearchParams } from 'next/navigation';

export function OrderNumber() {
  const id = useSearchParams().get('id');
  return id ? <p className="mt-2 text-lg">Номер заказа: <b>{id}</b></p> : null;
}
