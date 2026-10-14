// Экранирование для HTML-разметки сообщений (Telegram и MAX понимают одинаковые теги <b>, <i>)
export function escapeHtml(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
