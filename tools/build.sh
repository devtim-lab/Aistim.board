#!/bin/sh
# Bangun ulang CSS & salin Alpine (CSP). Jalankan setelah mengubah class di icu.html/app.js.
cd "$(dirname "$0")"
npm i --no-save tailwindcss@3.4.17 @alpinejs/csp@3.14.8
npx tailwindcss -c tailwind.config.js -i input.css -o ../extension/tailwind.css --minify
mkdir -p ../extension/vendor && cp node_modules/@alpinejs/csp/dist/cdn.min.js ../extension/vendor/alpine.js
