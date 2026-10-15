#!/usr/bin/env bash
# Боевой сайт https://nosinoski.ru — статичная сборка в ветку `site`,
# оттуда её забирает Timeweb Cloud App Platform (Frontend, автодеплой).
# Пилот: заказ уходит сообщением в Telegram, серверная часть не нужна.
# Запуск из корня проекта: bash deploy/publish-site.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=https://github.com/planetasofa2012-code/nosi-noski.git
URL=https://nosinoski.ru

# 1. Статичная сборка без подпапки (DEMO=1 — режим статичной выгрузки, см. next.config.ts)
cd shop
rm -rf out
DEMO=1 NEXT_PUBLIC_DEMO=1 NEXT_PUBLIC_BASE_PATH= NEXT_PUBLIC_SITE_URL=$URL npx next build
cd ..

# 2. robots.txt и sitemap.xml (серверные маршруты в статичную сборку не попадают)
python - "$URL" <<'PY'
import json, sys
url = sys.argv[1]
products = json.load(open('shop/src/data/products.json', encoding='utf-8'))
pages = ['', 'catalog/', 'delivery/', 'about/'] + [f"product/{p['slug']}/" for p in products if any(not i.endswith('.svg') for i in p['images'])]
open('shop/out/sitemap.xml', 'w', encoding='utf-8').write(
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{url}/{p}</loc></url>\n' for p in pages) + '</urlset>\n')
open('shop/out/robots.txt', 'w', encoding='utf-8').write(f'User-agent: *\nAllow: /\nDisallow: /cart/\nSitemap: {url}/sitemap.xml\n')
PY

# 3. Выкладка в ветку site
cd shop/out
rm -rf .git
git init -q -b site
git add -A
git commit -q -m "Сайт $(date +%Y-%m-%d\ %H:%M)"
git push -f -q "$REPO" site
rm -rf .git
echo "Готово: ветка site обновлена → $URL (Timeweb пересоберёт за 1–2 мин)"
