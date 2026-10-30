#!/bin/sh
# Bygger utvärderingsmallens PDF och förhandsbild från template.src.html.
# Loggan lånas från matchmallen så att båda mallarna ser likadana ut.
set -e
cd "$(dirname "$0")"
ROOT=../../..
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

python3 -I - <<'EOF'
import re
logo = re.search(r'data:image/png;base64,[A-Za-z0-9+/=]+',
                 open('../game-tracking-template/template.html').read()).group(0)
src = open('template.src.html').read().replace('{{LOGO}}', logo)
open('template.html', 'w').write(src)
EOF

"$CHROME" --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$PWD/ice-iq-player-evaluation-template-en.pdf" "file://$PWD/template.html" 2>/dev/null

# Förhandsbilden visar tryoutbladet (sida 1), som är det folk söker efter.
sips -s format png -Z 1400 ice-iq-player-evaluation-template-en.pdf --out preview-en.png >/dev/null

cp ice-iq-player-evaluation-template-en.pdf "$ROOT/public/downloads/"
cp preview-en.png "$ROOT/src/assets/images/player-evaluation-template-preview-en.png"
echo "Built PDF and preview"
