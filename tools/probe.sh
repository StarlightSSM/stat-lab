#!/usr/bin/env bash
# usage: tools/probe.sh "<u>" "<do-steps>" <t-ms> [out.png] [w] [h]
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
W=${5:-1440}; H=${6:-900}
DO2="$2;$(( $3 - 200 ))|w.__frozen=true"
ENC=$(node -e "console.log(new URLSearchParams({u:process.argv[1],do:process.argv[2],t:process.argv[3],w:'$W',h:'$H'}).toString())" "$1" "$DO2" "$3")
URL="http://localhost:8800/tools/bookprobe.html?$ENC"
B=$(( $3 + 3000 ))
DO2="$2;$(( $3 - 200 ))|w.__frozen=true"
SHOT=""; [ -n "$4" ] && SHOT="--screenshot=$(cygpath -m "$(realpath -m "$4")")"
"$CH" --headless=new --use-angle=swiftshader --enable-unsafe-swiftshader --hide-scrollbars --virtual-time-budget=$B --window-size=$W,$((H+200)) $SHOT --dump-dom "$URL" 2>/dev/null | sed -n '/<pre id="out">/,/</pre>/p' | sed 's/<[^>]*>//g'
[ -n "$4" ] && echo "shot $4"
