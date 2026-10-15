// Текст объявления для Авито — общий для сайта (XML-фид) и фотостудии (помощник)
// Правила Авито: заголовок до 50 символов, в описании НЕЛЬЗЯ ссылки на сайты и внешние контакты.

/**
 * @param {{ title: string, price: number, description: string, composition: string, care: string,
 *   colors: {id: string, name: string}[], variants: {size: string, color: string, stock: number}[] }} product
 * @param {Record<string, number>} [stock] — остатки по sku
 * @param {{ shopName?: string }} [opts]
 */
export function avitoAd(product, stock, opts = {}) {
  const left = (v) => (stock && v.sku in stock ? stock[v.sku] : v.stock);
  const inStock = product.variants.filter((v) => left(v) > 0);
  const sizes = [...new Set(inStock.map((v) => v.size))];
  const colors = [...new Set(inStock.map((v) => v.color))].map((id) => product.colors.find((c) => c.id === id)?.name ?? id);

  const title = cut(product.title.replace(/[«»"]/g, ''), 50);
  const description = [
    product.description,
    '',
    sizes.length ? `✅ В наличии размеры: ${sizes.join(', ')}` : '❌ Сейчас нет в наличии',
    colors.length ? `🎨 Цвета: ${colors.join(', ')}` : '',
    `🧵 Состав: ${product.composition}`,
    `🧺 Уход: ${product.care}`,
    '',
    '📦 Отправляем Авито Доставкой.',
    '📏 Подскажем размер — напишите в сообщениях.',
    '👉 Больше моделей носков и белья — в нашем профиле.',
    opts.shopName ? `\n${opts.shopName}` : '',
  ].filter((s, i, a) => !(s === '' && a[i - 1] === '')).join('\n').trim();

  return { title, description, price: product.price, sizes, colors };
}

function cut(s, n) {
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}
