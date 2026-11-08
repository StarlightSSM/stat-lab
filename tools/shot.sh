# usage: shot.sh <hash> <out.png> [width] [height]
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
W=${3:-1400}; H=${4:-1800}
"$CH" --headless=new --disable-gpu --hide-scrollbars --window-size=$W,$H --virtual-time-budget=4000 --screenshot="$2" "file:///C:/Users/sumin/Desktop/docker-test/stat-lab/index.html#$1" 2>/dev/null
