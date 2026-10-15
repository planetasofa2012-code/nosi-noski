#!/usr/bin/env bash
# PNG из SVG логотипа и OG-картинка через Chrome headless (без ImageMagick)
# Запуск из корня проекта: bash brand/render.sh
set -euo pipefail
cd "$(dirname "$0")"
CHROME="/c/Program Files/Google/Chrome/Application/chrome.exe"
DIR="$(cygpath -m "$PWD")"
shot() { # $1 — html, $2 — png, $3 — ширина, $4 — высота, $5 — фон (прозрачный по умолчанию)
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 \
    --default-background-color="${5:-00000000}" --window-size="$3,$4" \
    --screenshot="$DIR/$2" "file:///$DIR/$1" 2>/dev/null
}
page() { # обёртка: SVG во весь кадр
  printf '<!doctype html><style>html,body{margin:0;background:transparent}img{display:block;width:100vw;height:100vh}</style><img src="logo/%s">' "$1" > "_tmp_$1.html"
}
for f in logo-sticker logo-mono; do page "$f.svg"; shot "_tmp_$f.svg.html" "logo/$f.png" 2240 528; done
page logo-mark.svg; shot _tmp_logo-mark.svg.html logo/logo-mark.png 1024 1024
shot og.html og.png 1200 630 f4f1eaff
rm -f _tmp_*.html
cp og.png ../shop/public/og.png
echo "Готово: brand/logo/*.png, brand/og.png → shop/public/og.png"
