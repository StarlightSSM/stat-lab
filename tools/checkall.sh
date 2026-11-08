#!/usr/bin/env bash
# Load the full built site at each module hash and report JS errors per module.
cd "$(dirname "$0")/.."
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
node tools/preview.js all light >/dev/null 2>&1
F=".preview/full.html"
node -e '
const fs=require("fs");let h=fs.readFileSync("index.html","utf8").replace(/src="js\//g,"src=\"../js/");
const trap=fs.readFileSync(".preview/"+fs.readdirSync(".preview").find(f=>f.endsWith("-light.html")),"utf8").match(/^<script>[\s\S]*?<\/script>/)[0];
fs.writeFileSync(".preview/full.html",trap+h);'
for f in js/m/*.js; do id=$(basename "$f" .js)
  r=$("$CH" --headless=new --disable-gpu --virtual-time-budget=5000 --window-size=1300,1200 --dump-dom "file:///$(cygpath -m "$PWD/$F")#$id" 2>/dev/null | grep -o '<pre id="errbox">[^<]*' | sed 's/<pre id="errbox">//')
  echo "$id: ${r:-NO_OUTPUT}"
done
