// Помощник настройки MAX:
//   npm run max:setup         — показать бота и ID чатов, откуда ему писали (сначала напишите боту что-нибудь)
//   npm run max:setup -- test — отправить тестовое сообщение в MAX_CHAT_ID / MAX_USER_ID
// Токен берётся из MAX_BOT_TOKEN (переменная окружения или shop/.env.local)
import fs from 'node:fs';

const envFile = new URL('../.env.local', import.meta.url);
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(MAX_[A-Z_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const TOKEN = process.env.MAX_BOT_TOKEN;
const BASE = process.env.MAX_API_URL ?? 'https://platform-api.max.ru';
if (!TOKEN) {
  console.log('❌ Нет MAX_BOT_TOKEN. Создайте бота в MAX у @MasterBot (/newbot), токен впишите в shop/.env.local:\nMAX_BOT_TOKEN=...');
  process.exit(1);
}

async function api(path, init = {}) {
  const res = await fetch(BASE + path, { ...init, headers: { Authorization: TOKEN, 'Content-Type': 'application/json', ...init.headers } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`);
  return body;
}

const me = await api('/me');
console.log(`🤖 Бот: ${me.name ?? me.first_name ?? ''} (@${me.username ?? '?'}), id ${me.user_id}`);

if (process.argv.includes('test')) {
  const target = process.env.MAX_CHAT_ID ? `chat_id=${process.env.MAX_CHAT_ID}` : process.env.MAX_USER_ID ? `user_id=${process.env.MAX_USER_ID}` : null;
  if (!target) {
    console.log('❌ Укажите MAX_CHAT_ID (группа) или MAX_USER_ID (личка) в .env.local');
    process.exit(1);
  }
  await api(`/messages?${target}`, {
    method: 'POST',
    body: JSON.stringify({ text: '🧦 <b>Тест</b>: уведомления о заказах будут приходить сюда.', format: 'html' }),
  });
  console.log('✅ Тестовое сообщение отправлено — проверьте MAX');
  process.exit(0);
}

console.log('⏳ Жду сообщения боту до 30 секунд… (напишите боту в личку или в группу, где он админ)');
const { updates = [] } = await api('/updates?timeout=30&limit=100');
const seen = new Map();
for (const u of updates) {
  const m = u.message;
  const chatId = m?.recipient?.chat_id ?? u.chat_id;
  const userId = m?.sender?.user_id ?? u.user?.user_id;
  const key = `${chatId}/${userId}`;
  if (seen.has(key)) continue;
  seen.set(key, true);
  const type = m?.recipient?.chat_type ?? (u.update_type === 'bot_started' ? 'dialog' : '?');
  const name = m?.sender?.name ?? u.user?.name ?? '';
  console.log(`\n• ${type === 'dialog' ? 'Личка' : 'Группа/канал'} от ${name}: «${(m?.body?.text ?? u.update_type).slice(0, 40)}»`);
  if (type === 'dialog') console.log(`  MAX_USER_ID=${userId}`);
  else console.log(`  MAX_CHAT_ID=${chatId}`);
}
if (!seen.size) console.log('Сообщений нет. Напишите боту и запустите ещё раз.');
else console.log('\nВпишите нужную строку в .env.local (и в Vercel), затем: npm run max:setup -- test');
