// Настройки XML-фида для Автозагрузки Авито.
// ⚠️ Перед включением сверьте значения категорий с актуальным шаблоном:
//    Авито → Профиль → Автозагрузка → «Правила и шаблоны» → категория «Одежда, обувь, аксессуары».
import type { Category } from '@/lib/catalog';

export const avitoConfig = {
  address: 'Новосибирск', // адрес/город, где лежит товар
  contactPhone: '', // можно оставить пустым — возьмётся из профиля
  managerName: '',
  condition: 'Новое с биркой',
  adType: 'Товар приобретен на продажу',
  delivery: 'Включена', // Авито Доставка
};

// Соответствие категорий сайта категориям Авито
export const avitoCategories: Record<Category, { Category: string; GoodsType: string; Apparel: string }> = {
  socks: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Женская одежда', Apparel: 'Нижнее бельё' },
  'women-socks': { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Женская одежда', Apparel: 'Нижнее бельё' },
  'men-socks': { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Мужская одежда', Apparel: 'Нижнее бельё' },
  kids: { Category: 'Детская одежда и обувь', GoodsType: 'Для девочек', Apparel: 'Нижнее бельё' }, // ⚠️ сверить с шаблоном Авито
  sport: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Мужская одежда', Apparel: 'Нижнее бельё' },
  warm: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Мужская одежда', Apparel: 'Нижнее бельё' },
  soft: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Мужская одежда', Apparel: 'Нижнее бельё' },
  women: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Женская одежда', Apparel: 'Нижнее бельё' },
  men: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Мужская одежда', Apparel: 'Нижнее бельё' },
  sets: { Category: 'Одежда, обувь, аксессуары', GoodsType: 'Женская одежда', Apparel: 'Нижнее бельё' },
};
