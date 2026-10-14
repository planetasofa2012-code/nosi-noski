#!/usr/bin/env bash
# Публикация демо-версии на GitHub Pages: https://planetasofa2012-code.github.io/nosi-noski/
# Запуск из корня проекта: bash deploy/publish-demo.sh
set -euo pipefail
cd "$(dirname "$0")/.."
REPO=https://github.com/planetasofa2012-code/nosi-noski.git
NAME=nosi-noski

# 1. Статичная сборка магазина (без сервера: заказ в демо только имитируется)
cd shop
rm -rf out
MSYS_NO_PATHCONV=1 DEMO=1 NEXT_PUBLIC_DEMO=1 NEXT_PUBLIC_BASE_PATH=/$NAME \
  NEXT_PUBLIC_SITE_URL=https://planetasofa2012-code.github.io/$NAME npx next build
cd ..

# 2. Демо фотостудии рядом: /nosi-noski/studio/
mkdir -p shop/out/studio
cp -r studio/public/. shop/out/studio/
cp studio/lib/scenes.mjs shop/src/lib/avito-text.mjs shop/src/data/products.json shop/out/studio/
touch shop/out/.nojekyll

# 3. Выкладка в ветку gh-pages
cd shop/out
rm -rf .git
git init -q -b gh-pages
git add -A
git commit -q -m "Демо-сборка $(date +%Y-%m-%d\ %H:%M)"
git push -f -q "$REPO" gh-pages
rm -rf .git
echo "Готово: https://planetasofa2012-code.github.io/$NAME/  (обновится через ~1 мин)"
