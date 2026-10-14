/**
 * Склад «Носи носки» — веб-приложение Google Таблицы.
 * Лист «stock»: A sku | B товар | C размер | D цвет | E остаток
 * Лист «log»:   дата | заказ | sku | кол-во | остаток после
 *
 * Установка: Расширения → Apps Script → вставить этот код → в KEY вписать секрет →
 * Развернуть → Новое развёртывание → Веб-приложение → «Выполнять от: меня», «Доступ: все» → скопировать URL.
 */
const KEY = 'ЗАМЕНИТЕ-НА-ДЛИННЫЙ-СЕКРЕТ'; // тот же, что STOCK_API_KEY на сайте
const STOCK_SHEET = 'stock';
const LOG_SHEET = 'log';

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readStock_() {
  const sheet = SpreadsheetApp.getActive().getSheetByName(STOCK_SHEET);
  const rows = sheet.getDataRange().getValues();
  const stock = {};
  const rowBySku = {};
  for (let i = 1; i < rows.length; i++) {
    const sku = String(rows[i][0]).trim();
    if (!sku) continue;
    stock[sku] = Math.max(0, Number(rows[i][4]) || 0);
    rowBySku[sku] = i + 1;
  }
  return { sheet, stock, rowBySku };
}

// GET ?key=… → { stock: { sku: остаток } }
function doGet(e) {
  if (e.parameter.key !== KEY) return json({ error: 'forbidden' });
  return json({ stock: readStock_().stock });
}

// POST { key, orderId, items: [{ sku, qty }] } → списание
function doPost(e) {
  let body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return json({ ok: false, error: 'bad json' });
  }
  if (body.key !== KEY) return json({ ok: false, error: 'forbidden' });

  const lock = LockService.getScriptLock();
  lock.waitLock(20000); // два заказа одновременно не уведут остаток в минус
  try {
    const { sheet, stock, rowBySku } = readStock_();
    for (const it of body.items) {
      if ((stock[it.sku] || 0) < it.qty) {
        return json({ ok: false, error: 'Недостаточно: ' + it.sku + ' (осталось ' + (stock[it.sku] || 0) + ')' });
      }
    }
    const log = SpreadsheetApp.getActive().getSheetByName(LOG_SHEET) || SpreadsheetApp.getActive().insertSheet(LOG_SHEET);
    const now = new Date();
    const result = {};
    for (const it of body.items) {
      const left = stock[it.sku] - it.qty;
      sheet.getRange(rowBySku[it.sku], 5).setValue(left);
      stock[it.sku] = left;
      result[it.sku] = left;
      log.appendRow([now, body.orderId, it.sku, it.qty, left]);
    }
    return json({ ok: true, stock: result });
  } finally {
    lock.releaseLock();
  }
}
