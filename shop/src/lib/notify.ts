// Уведомления продавцу: Telegram и/или MAX — во все настроенные каналы параллельно
import { escapeHtml } from './telegram';

export { escapeHtml };

type Channel = { name: string; send: (html: string) => Promise<void> };

function channels(): Channel[] {
  const list: Channel[] = [];

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChat = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChat) {
    list.push({
      name: 'Telegram',
      send: async (html) => {
        const res = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: tgChat, text: html, parse_mode: 'HTML', disable_web_page_preview: true }),
        });
        if (!res.ok) throw new Error(`Telegram ${res.status}: ${await res.text()}`);
      },
    });
  }

  // MAX (dev.max.ru): POST /messages?chat_id=… или ?user_id=…, заголовок Authorization: <token>
  const maxToken = process.env.MAX_BOT_TOKEN;
  const maxChat = process.env.MAX_CHAT_ID;
  const maxUser = process.env.MAX_USER_ID;
  if (maxToken && (maxChat || maxUser)) {
    const base = process.env.MAX_API_URL ?? 'https://platform-api2.max.ru';
    const target = maxChat ? `chat_id=${encodeURIComponent(maxChat)}` : `user_id=${encodeURIComponent(maxUser!)}`;
    list.push({
      name: 'MAX',
      send: async (html) => {
        const res = await fetch(`${base}/messages?${target}&disable_link_preview=true`, {
          method: 'POST',
          headers: { Authorization: maxToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: html.slice(0, 4000), format: 'html', notify: true }),
        });
        if (!res.ok) throw new Error(`MAX ${res.status}: ${await res.text()}`);
      },
    });
  }

  return list;
}

export type NotifyResult = { configured: number; sent: string[]; failed: string[] };

/** Отправить во все каналы. Ошибка одного канала не мешает другим */
export async function notify(html: string): Promise<NotifyResult> {
  const list = channels();
  if (!list.length) {
    console.log('[notify] каналы не настроены, сообщение:\n' + html.replace(/<[^>]+>/g, ''));
    return { configured: 0, sent: [], failed: [] };
  }
  const results = await Promise.allSettled(list.map((c) => c.send(html)));
  const sent: string[] = [];
  const failed: string[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') sent.push(list[i].name);
    else {
      failed.push(list[i].name);
      console.error(`[notify] ${list[i].name}:`, r.reason);
    }
  });
  return { configured: list.length, sent, failed };
}
