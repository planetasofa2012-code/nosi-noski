import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-20 text-center">
      <div className="text-6xl" aria-hidden>🧦❓</div>
      <h1 className="mt-4 font-display text-3xl font-semibold">Потерялся, как второй носок</h1>
      <p className="mt-3 text-muted">Такой страницы нет — возможно, товар закончился или ссылка устарела.</p>
      <Link href="/catalog" className="mt-8 inline-block btn-sticker rounded-full bg-accent px-7 py-3.5 font-bold text-accent-ink">
        В каталог
      </Link>
    </div>
  );
}
