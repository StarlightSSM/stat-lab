#!/usr/bin/env bash
# usage: tools/preview.sh <module-id> <out.png> [light|dark] [width] [height]
# Renders ONE module in headless Chrome, prints runtime errors (or NO_JS_ERRORS), saves a screenshot.
# width < 600 renders inside an iframe of that width (Chrome windows can't go below ~500px).
cd "$(dirname "$0")/.."
ID=$1; OUT=$2; TH=${3:-light}; W=${4:-1400}; H=${5:-1700}
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
F=$(node tools/preview.js "$ID" "$TH")
FW=$(cygpath -m "$F" 2>/dev/null || echo "$F")
URL="file:///$FW#${ID%%,*}"
"$CH" --headless=new --disable-gpu --virtual-time-budget=5000 --window-size=1200,$H --dump-dom "$URL" 2>/dev/null | grep -o '<pre id="errbox">[^<]*' | sed 's/<pre id="errbox">//'
if [ "$W" -lt 600 ]; then
  WRAP="${F%.html}-frame.html"
  echo "<body style='margin:0;background:#888'><iframe src='$(basename "$F")#${ID%%,*}' style='width:${W}px;height:${H}px;border:0;display:block'></iframe></body>" > "$WRAP"
  "$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=$((W)),$H --screenshot="$OUT" "file:///$(cygpath -m "$WRAP" 2>/dev/null || echo "$WRAP")" >/dev/null 2>&1
else
  "$CH" --headless=new --disable-gpu --hide-scrollbars --virtual-time-budget=5000 --window-size=$W,$H --screenshot="$OUT" "$URL" >/dev/null 2>&1
fi
echo "screenshot: $OUT"
