#!/bin/bash
# Publica la rama de trabajo como PR. NO fusiona a main: el merge es SOLO del Soberano (FIRMO explicito).
# Uso: bin/publica_pr.sh "titulo" "cuerpo" VERSION
# Las rutas salen de donde vive este script (sin rutas fijas de maquina).
set -u
REPO="$(cd "$(dirname "$0")/.." && pwd)"
JUEGO="$REPO/../preceptoros-web-juego"
cd "$JUEGO" || exit 1
git fetch -q origin && git merge --ff-only -q claude/mapa-unico && git merge --no-edit -q origin/main 2>&1 | tail -1
python3 test_web.py 2>&1 | tail -1
git push origin claude/web-solo-juego 2>&1 | tail -1
n=$(gh pr create --base main --head claude/web-solo-juego --title "$1" --body "$2" 2>&1 | grep -o "[0-9]*$"); echo "PR $n"
sleep 20
gh pr checks "$n" --watch --interval 10 2>&1 | tail -1
echo "PR $n ABIERTA. El merge a main es SOLO del Soberano (FIRMO explicito). No se fusiona aqui."
echo "Version a comprobar tras el merge del Soberano: $3"
