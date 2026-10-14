// Выгрузка всех позиций каталога в CSV для импорта в Google Таблицу «Склад»
// Запуск: npm run stock:export → файл stock.csv в папке shop
import fs from 'node:fs';

const products = JSON.parse(fs.readFileSync(new URL('../src/data/products.json', import.meta.url), 'utf8'));
const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
const rows = [['sku', 'товар', 'размер', 'цвет', 'остаток']];
for (const p of products) {
  for (const v of p.variants) {
    const color = p.colors.find((c) => c.id === v.color)?.name ?? v.color;
    rows.push([v.sku, p.title, v.size, color, v.stock]);
  }
}
const out = new URL('../stock.csv', import.meta.url);
fs.writeFileSync(out, '﻿' + rows.map((r) => r.map(q).join(',')).join('\n') + '\n');
console.log(`Готово: ${rows.length - 1} позиций → shop/stock.csv`);
