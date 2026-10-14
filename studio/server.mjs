// Фотостудия «Носи носки» — локальный сервис: фото товара → Nano Banana → в каталог магазина
// Запуск: node studio/server.mjs  →  http://127.0.0.1:4545
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateImage } from './lib/nanobanana.mjs';
import { ASPECTS, buildPrompt, MODELS, SCENES } from './lib/scenes.mjs';
import { avitoAd } from '../shop/src/lib/avito-text.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SHOP = path.resolve(ROOT, '../shop');
const PRODUCTS_JSON = path.join(SHOP, 'src/data/products.json');
const OUTPUT = path.join(ROOT, 'output');
const PORT = Number(process.env.STUDIO_PORT ?? 4545);
const HOST = '127.0.0.1'; // только этот компьютер — ключ API не уходит в сеть

loadKeys();
fs.mkdirSync(OUTPUT, { recursive: true });

// Ключи берём из окружения или из ~/.env.keys (только нужные переменные)
function loadKeys() {
  const wanted = ['OPENROUTER_API_KEY', 'GEMINI_API_KEY', 'STOCK_API_URL', 'STOCK_API_KEY'];
  for (const file of [path.join(os.homedir(), '.env.keys'), path.join(ROOT, '.env')]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (m && wanted.includes(m[1]) && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const readProducts = () => JSON.parse(fs.readFileSync(PRODUCTS_JSON, 'utf8'));
const writeProducts = (list) => fs.writeFileSync(PRODUCTS_JSON, JSON.stringify(list, null, 2) + '\n');

async function readStock() {
  const base = {};
  for (const p of readProducts()) for (const v of p.variants) base[v.sku] = v.stock;
  if (!process.env.STOCK_API_URL) return { stock: base, source: 'products.json' };
  try {
    const r = await fetch(`${process.env.STOCK_API_URL}?key=${encodeURIComponent(process.env.STOCK_API_KEY ?? '')}`);
    const b = await r.json();
    if (!b.stock) throw new Error(b.error ?? 'нет данных');
    for (const sku of Object.keys(base)) base[sku] = Number(b.stock[sku] ?? 0);
    return { stock: base, source: 'Google Таблица' };
  } catch (e) {
    return { stock: base, source: `products.json (таблица недоступна: ${e.message})` };
  }
}

function send(res, status, data, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
}

async function readBody(req, limit = 60 * 1024 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw new Error('Слишком большие файлы (лимит 60 МБ)');
    chunks.push(c);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

function decodeDataUrl(url) {
  const m = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(url ?? '');
  if (!m) throw new Error('Неверный формат картинки');
  return { ext: m[1] === 'jpeg' ? 'jpg' : m[1], buf: Buffer.from(m[2], 'base64') };
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

function serveStatic(res, baseDir, rel) {
  const file = path.resolve(baseDir, '.' + decodeURIComponent(rel));
  if (!file.startsWith(baseDir + path.sep) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(res, 404, { error: 'not found' });
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
}

const routes = {
  'GET /api/config': async () => ({
    scenes: Object.entries(SCENES).map(([id, s]) => ({ id, title: s.title, icon: s.icon })),
    models: MODELS,
    aspects: ASPECTS,
    provider: process.env.OPENROUTER_API_KEY ? 'OpenRouter' : process.env.GEMINI_API_KEY ? 'Gemini API' : null,
    stockSheet: Boolean(process.env.STOCK_API_URL),
  }),

  'GET /api/products': async () => {
    const { stock, source } = await readStock();
    return { products: readProducts(), stock, source };
  },

  'POST /api/generate': async (body) => {
    const images = (body.images ?? []).slice(0, 3);
    if (!images.length) throw new Error('Загрузите хотя бы одно фото товара');
    const model = MODELS.some((m) => m.id === body.model) ? body.model : MODELS[0].id;
    const aspect = ASPECTS.includes(body.aspect) ? body.aspect : '4:5';
    const count = Math.min(4, Math.max(1, Number(body.count) || 1));
    const prompt = buildPrompt(body.scene, body.prompt);

    const results = await Promise.allSettled(Array.from({ length: count }, () => generateImage({ prompt, images, model, aspect })));
    const out = [];
    let cost = 0;
    const errors = [];
    for (const r of results) {
      if (r.status === 'rejected') { errors.push(r.reason.message); continue; }
      cost += r.value.cost ?? 0;
      for (const url of r.value.images) {
        // Сохраняем историю генераций
        const { ext, buf } = decodeDataUrl(url);
        const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${body.scene}-${out.length + 1}.${ext}`;
        fs.writeFileSync(path.join(OUTPUT, name), buf);
        out.push({ url, file: name });
      }
    }
    if (!out.length) throw new Error(errors[0] ?? 'Не получилось сгенерировать');
    return { images: out, errors, cost: cost || null };
  },

  'POST /api/save': async (body) => {
    const list = readProducts();
    const product = list.find((p) => p.slug === body.slug); // slug только из каталога — нельзя записать в чужую папку
    if (!product) throw new Error('Товар не найден');
    const { ext, buf } = decodeDataUrl(body.image);
    const dir = path.join(SHOP, 'public/products', product.slug);
    fs.mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}.${ext}`;
    fs.writeFileSync(path.join(dir, name), buf);
    const src = `/products/${product.slug}/${name}`;
    // Заглушки .svg убираем из галереи, как только появляется настоящее фото
    const real = product.images.filter((i) => !i.endsWith('.svg'));
    product.images = body.asCover ? [src, ...real] : [...real, src];
    writeProducts(list);
    return { ok: true, images: product.images };
  },

  'POST /api/images': async (body) => {
    // Порядок/удаление фото товара
    const list = readProducts();
    const product = list.find((p) => p.slug === body.slug);
    if (!product) throw new Error('Товар не найден');
    const allowed = new Set(product.images);
    const next = (body.images ?? []).filter((i) => allowed.has(i));
    if (!next.length) throw new Error('У товара должно остаться хотя бы одно фото');
    product.images = next;
    writeProducts(list);
    return { ok: true, images: next };
  },

  'GET /api/avito': async (_body, url) => {
    const product = readProducts().find((p) => p.slug === url.searchParams.get('slug'));
    if (!product) throw new Error('Товар не найден');
    const { stock } = await readStock();
    return { ...avitoAd(product, stock), images: product.images };
  },
};

http
  .createServer(async (req, res) => {
    const url = new URL(req.url, `http://${HOST}`);
    try {
      const handler = routes[`${req.method} ${url.pathname}`];
      if (handler) {
        const body = req.method === 'POST' ? await readBody(req) : {};
        return send(res, 200, await handler(body, url));
      }
      if (req.method !== 'GET') return send(res, 405, { error: 'method' });
      if (url.pathname.startsWith('/products/')) return serveStatic(res, path.join(SHOP, 'public/products'), url.pathname.slice('/products'.length));
      if (url.pathname.startsWith('/output/')) return serveStatic(res, OUTPUT, url.pathname.slice('/output'.length));
      return serveStatic(res, path.join(ROOT, 'public'), url.pathname === '/' ? '/index.html' : url.pathname);
    } catch (e) {
      console.error('[studio]', e.message);
      send(res, 400, { error: e.message });
    }
  })
  .listen(PORT, HOST, () => {
    const key = process.env.OPENROUTER_API_KEY ? 'OpenRouter ✓' : process.env.GEMINI_API_KEY ? 'Gemini API ✓' : '⚠️ ключ не найден';
    console.log(`\n  🧦 Фотостудия «Носи носки»: http://${HOST}:${PORT}   (${key})\n`);
  });
