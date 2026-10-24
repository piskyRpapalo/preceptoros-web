---
name: rack-android-preview
description: Abrir y capturar paginas locales en el rack Android por adb (reverse + servidor loopback + am start + screencap), y en Chromium local con Playwright. Usala para que el ojo del Soberano vea un ejemplo; un HTTP 200 no es la revision.
---

# Vista previa en el rack Android

Procedimiento medido: `docs/rebuild/examples/RUNBOOK.md`.

1. `adb devices` -> exactamente un dispositivo. Si hay 0 o >1: PARA, `NO_DATA` con causa. No adivinar selector.
2. `adb reverse tcp:18765 tcp:18765` (si falla: PARA, `NO_DATA`).
3. `python3 -m http.server 18765 --bind 127.0.0.1 --directory <raiz del worktree>` (segundo plano).
4. `adb shell am start -a android.intent.action.VIEW -d 'http://127.0.0.1:18765/docs/rebuild/examples/index.html'`
5. Captura: `adb exec-out screencap -p > <scratchpad>/android-<skin>.png` y **leer la imagen** antes de decir nada.
6. Cerrar: Ctrl-C al servidor, `adb reverse --remove tcp:18765`.

## Ojos en el PC (sin MCP de Playwright)
La libreria Playwright y `chromium-1228` ya estan en disco (cache de npx). Script de captura:
`node docs/rebuild/examples/tools/shoot.mjs <url> <png> [ancho]` (registra peticiones no-loopback; deben ser 0).
