// Шаблоны сцен для фото товара. Промпты на английском — модель понимает их точнее.
const KEEP = `The product in the reference photo(s) must stay EXACTLY the same: identical colors, print/pattern, knit texture, ribbing, stitching, labels and proportions. Do not invent new details, do not change the design. Photorealistic, high-end e-commerce photography, soft natural light, sharp focus on the product, no text, no watermark, no logos added. Any shoes, clothing and props must be plain and unbranded — no brand logos, no swooshes, no stripes trademarks.`;

export const SCENES = {
  packshot: {
    title: 'Предметка на светлом фоне',
    icon: '⬜',
    prompt: `Clean studio packshot of this product on a seamless warm off-white (#FBF7F2) background, centered, soft shadow under the product, catalog style. ${KEEP}`,
  },
  flatlay: {
    title: 'Раскладка flat-lay',
    icon: '🧺',
    prompt: `Top-down flat lay of this product neatly arranged on natural beige linen fabric, with a few cozy props around (a cup of tea, dried flowers, a knitted blanket corner), lots of negative space, Scandinavian minimal style. ${KEEP}`,
  },
  legs: {
    title: 'На ногах модели (носки)',
    icon: '🦶',
    prompt: `Close-up lifestyle photo of an adult woman's feet and lower legs wearing these exact socks, sitting on a cozy sofa with a chunky knit blanket, warm home interior, morning light, cropped at the knees, natural skin. ${KEEP}`,
  },
  model: {
    title: 'Модель в белье (каталог)',
    icon: '🧍',
    prompt: `Tasteful, non-revealing e-commerce catalog photo of an adult model (25–35 years old) wearing this exact underwear item, standing in a bright minimal studio with warm beige backdrop, relaxed natural pose, cropped from shoulders to mid-thigh, body-positive, elegant and modest, like a premium basics brand lookbook. ${KEEP}`,
  },
  lifestyle: {
    title: 'Лайфстайл на улице',
    icon: '🍂',
    prompt: `Lifestyle street photo: adult person wearing these exact socks with white sneakers and cuffed jeans, stepping on autumn leaves on a city sidewalk, shallow depth of field, focus on the socks, warm golden hour light. ${KEEP}`,
  },
  custom: {
    title: 'Свой вариант',
    icon: '✍️',
    prompt: KEEP,
  },
};

export const MODELS = [
  // Замер 2026-10-15 (носки Teddy, сцена «на ногах»): 2.1 — $0.039 и лучший текст, 2 — $0.068, Lite — $0.034
  { id: 'google/gemini-nano-banana-2.1', title: 'Nano Banana 2.1 — ≈3,5 ₽ за фото, лучшее качество/цена (рекомендуется)' },
  { id: 'google/gemini-3.1-flash-lite-image', title: 'Nano Banana 2 Lite — черновики, ≈3 ₽' },
  { id: 'google/gemini-3.1-flash-image', title: 'Nano Banana 2 — ≈6 ₽ за фото' },
  { id: 'google/gemini-3-pro-image', title: 'Nano Banana Pro — максимальное качество (дороже)' },
  { id: 'google/gemini-2.5-flash-image', title: 'Nano Banana (первая версия)' },
];

export const ASPECTS = ['4:5', '1:1', '3:4', '9:16'];

export function buildPrompt(sceneId, extra) {
  const scene = SCENES[sceneId] ?? SCENES.packshot;
  const add = extra?.trim() ? `\nAdditional wishes from the shop owner (may be in Russian): ${extra.trim()}` : '';
  return scene.prompt + add;
}
