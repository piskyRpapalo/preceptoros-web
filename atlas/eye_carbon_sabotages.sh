#!/usr/bin/env bash
# Ojo de carbono: each fix reverted on purpose must turn atlas/eye_carbon_browser.mjs RED; restored, GREEN.
# Usage: bash atlas/eye_carbon_sabotages.sh   (run from the repo root; restores every file it touches)
set -u
BK=$(mktemp)
run(){ timeout 120 node atlas/eye_carbon_browser.mjs 2>/dev/null | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['receipt'],d['fallos'])"; }
sab(){ f=$1; cp "$f" "$BK"; python3 -c "import sys;p=sys.argv[3];s=open(p).read();a=sys.argv[1];b=sys.argv[2];assert a in s;open(p,'w').write(s.replace(a,b,1))" "$2" "$3" "$f"; echo "## $4"; run; cp "$BK" "$f"; }
sab public/creation.html '<script src="/game/semantic_table.js"></script>
<script src="/game/comic_tokens.js"></script>' '<script src="/game/comic_tokens.js"></script>
<script src="/game/semantic_table.js"></script>' "S1 script order"
sab public/game/world_feed.js "'/api/world-state'" "'/api/world-state-retirado'" "S2a missing endpoint"
sab public/game/world_feed.js "if (nd && nd.cobertura" "if (false && nd.cobertura" "S2b generic cause"
sab public/openworld/index.html ".topbar > a{display:inline-flex;align-items:center;min-width:44px;min-height:44px}" "" "S3 Back 36px"
sab public/openworld/index.html "<div id=\"stage\" class=\"stage\">" "<div id=\"stage\" class=\"stage\"><div role=\"application\" aria-label=\"stick\"></div>" "S3b the stick pad comes back on the map"
sab public/game/terminal_panel.js "    paintArmy(null);
" "" "S4 empty Army"
sab public/assets/radio_message_log.js "R.lista.hidden = id !== 'radio';" "R.lista.hidden = false;" "S4b radio does not switch"
rm -f "$BK"
echo "## restored"; run
