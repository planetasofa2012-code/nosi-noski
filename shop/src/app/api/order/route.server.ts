// Приём заказа: валидация → проверка остатков → списание → уведомление (Telegram / MAX)
import { revalidateTag } from 'next/cache';
import { buildLines, lowStockMessage, makeOrderId, orderMessage, orderSchema, StockError, UnknownItemError } from '@/lib/order';
import { decrementStock, getStock, STOCK_TAG } from '@/lib/stock';
import { notify } from '@/lib/notify';

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return Response.json({ ok: false, error: 'Неверный формат запроса' }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? 'Проверьте данные' }, { status: 400 });
  }
  const order = parsed.data;
  if (order.website) return Response.json({ ok: true, orderId: makeOrderId() }); // бот — делаем вид, что всё ок

  try {
    const stock = await getStock({ fresh: true });
    const lines = buildLines(order.items, stock);
    const total = lines.reduce((s, l) => s + l.sum, 0);
    const orderId = makeOrderId();

    // Сначала списываем остаток, чтобы последнюю пару не купили дважды
    const newStock = await decrementStock(orderId, lines.map((l) => ({ sku: l.sku, qty: l.qty })));
    if (newStock) revalidateTag(STOCK_TAG, 'max');

    const sent = await notify(orderMessage(orderId, order, lines, total));
    // Заказ потерян, только если его нет ни в одном мессенджере и ни в таблице
    if (sent.configured > 0 && !sent.sent.length && !newStock) throw new Error('Ни один канал уведомлений не ответил');
    const low = newStock && lowStockMessage(lines, newStock);
    if (low) await notify(low);

    return Response.json({ ok: true, orderId, total });
  } catch (err) {
    if (err instanceof StockError) {
      const list = err.shortages.map((s) => (s.available ? `${s.title} — осталось ${s.available} шт` : `${s.title} — закончился`)).join('; ');
      return Response.json({ ok: false, error: `Не хватает товара: ${list}`, shortages: err.shortages }, { status: 409 });
    }
    if (err instanceof UnknownItemError) return Response.json({ ok: false, error: err.message }, { status: 400 });
    console.error('[order] ошибка:', err);
    return Response.json({ ok: false, error: 'Не получилось отправить заказ. Напишите нам в мессенджер — всё оформим вручную.' }, { status: 500 });
  }
}
