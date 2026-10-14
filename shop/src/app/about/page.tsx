import type { Metadata } from 'next';
import { Prose } from '@/components/Prose';
import { site } from '@/lib/site';

export const metadata: Metadata = { title: 'О нас' };

export default function AboutPage() {
  return (
    <Prose title={`О «${site.name}»`}>
      <p>Мы — небольшой магазин носков. Сами отбираем модели и проверяем каждую пару перед отправкой.</p>
      <p>Любим яркие принты, которые поднимают настроение даже в понедельник.</p>
      <h2>Почему у нас</h2>
      <ul>
        <li>Яркие принты: мишки, буквы, ромбы — носки, которые видно</li>
        <li>Живое общение: ответим в Telegram или MAX и подскажем размер</li>
      </ul>
      <p>Город: {site.city}. Телефон: {site.phone}.</p>
    </Prose>
  );
}
