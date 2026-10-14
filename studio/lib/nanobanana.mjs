// Генерация изображений Nano Banana: через OpenRouter (по умолчанию) или напрямую через Gemini API

/**
 * @param {{ prompt: string, images: string[], model: string, aspect: string }} opts
 *   images — data URL картинок-референсов (фото товара)
 * @returns {Promise<string[]>} data URL сгенерированных картинок
 */
export async function generateImage({ prompt, images, model, aspect }) {
  if (process.env.OPENROUTER_API_KEY) return viaOpenRouter({ prompt, images, model, aspect });
  if (process.env.GEMINI_API_KEY) return viaGemini({ prompt, images, model, aspect });
  throw new Error('Нет ключа: задайте OPENROUTER_API_KEY или GEMINI_API_KEY (в ~/.env.keys или в переменных окружения)');
}

async function viaOpenRouter({ prompt, images, model, aspect }) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Title': 'Nosi Noski Photo Studio',
    },
    body: JSON.stringify({
      model,
      modalities: ['image', 'text'],
      image_config: { aspect_ratio: aspect },
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }, ...images.map((url) => ({ type: 'image_url', image_url: { url } }))],
        },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(humanError(res.status, body?.error?.message ?? JSON.stringify(body).slice(0, 300)));
  const msg = body.choices?.[0]?.message;
  const out = (msg?.images ?? []).map((i) => i.image_url?.url).filter(Boolean);
  if (!out.length) throw new Error('Модель не вернула картинку' + (msg?.content ? `: «${String(msg.content).slice(0, 200)}»` : '') + '. Попробуйте другую сцену или модель.');
  return { images: out, cost: body.usage?.cost };
}

async function viaGemini({ prompt, images, model, aspect }) {
  const id = model.replace(/^google\//, '');
  const parts = [{ text: prompt }];
  for (const url of images) {
    const m = /^data:([^;]+);base64,(.+)$/.exec(url);
    if (m) parts.push({ inline_data: { mime_type: m[1], data: m[2] } });
  }
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${id}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: aspect } },
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(humanError(res.status, body?.error?.message ?? ''));
  const out = (body.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.inlineData ?? p.inline_data)
    .filter(Boolean)
    .map((d) => `data:${d.mimeType ?? d.mime_type};base64,${d.data}`);
  if (!out.length) throw new Error('Модель не вернула картинку. Попробуйте другую сцену или модель.');
  return { images: out };
}

function humanError(status, detail) {
  if (status === 401 || status === 403) return 'Ключ API не подошёл (401/403). Проверьте ключ.';
  if (status === 402) return 'На балансе OpenRouter закончились деньги (402). Пополните баланс на openrouter.ai.';
  if (status === 429) return 'Слишком много запросов (429). Подождите минуту и попробуйте снова.';
  return `Ошибка ${status}: ${detail}`;
}
