# PROTOCOLO DEL NODO WEB · cómo se construye y se fusiona la web viva (2026-11-01)

Fuente: la sesión del 2026-11-01 (director claude, Mesa, Soberano). Estado: vivo, append-only.
Norte: `/openworld/` es el **nodo web tutorial** y tiene que llegar a **triple AAA medido** en el Doogee S110.

## 1 · La estructura nativa de hoy (lo que cada pieza debe respetar)

| capa | qué | dónde vive |
|---|---|---|
| mapa | suelo 2.5D de chunks hex horneados, caminantes, cabaña, `?` de HITL | `colonia_pagina.js` (colocación única), `map_painter.js`, `map_chunks.js`, `map_carta.js`, `hitl_walkers.js` |
| capas sobre el mapa | joystick (abajo a la izquierda), zoom (arriba a la derecha) | `colony_controls.js`, `map_zoom.js`, CSS de `openworld/index.html` |
| botones | pestañas Map · News · Summons · Army, con hojas que cubren el mapa | `terminal_tabs.js` |
| estado | tira aria-live, siempre fuera de las hojas | `#state`, `#floor-state` |
| chatbot | la radio donde hablan las AIs y el cerebro del nodo web | `radio_message_log.js`, `map_chat.js`, `web_node_brain.js` |
| modelos | bloques del mismo origen, de 25 MiB o menos, cada byte fijado por SHA-256 | `public/models/<id>/manifest.json` |
| pantalla | lo que ve el carbono, en un marco < 1,024 B | `screen_frame.js` (`window.preceptorScreen()`) |

En un teléfono (390 px) el orden vertical es: mapa (40-50 %, de borde a borde) → botones → estado → chatbot.

## 2 · Las leyes de cada pieza

1. **Un PR por pieza**, con la plantilla `PROPUESTA · REQUIERE_FIRMA`.
2. **Cada prueba nueva se enseña primero en rojo** con un sabotaje real y luego en verde.
3. **Gate completo en local**: todos los comandos de `gate.yml`, `test_web.py`, `atlas/test_atlas.py` y `arnes_sw.mjs`, con 0 rojos.
4. **Ojo de carbono**: captura a 390 px, **mirada**. Objetivos de 44 px, teclado, aria-live, nada solo por color, texto y dibujo jamás solapados.
5. **F0**: toda función nueva de `/openworld/` entra en `atlas/f0_funciones.json` con una guarda de navegador que corre en CI.
6. **Sello**: VERSION **creciente** y nunca reutilizada (gate de #531). Cada pieza reserva su letra al nacer; si main ya sirve una mayor, se re-sella con la siguiente libre.
7. **Léxico trinquete, barrido sin colores crudos, cero peticiones externas al cargar, SCRUB**, y determinismo (sin `Math.random` ni `Date`).
8. **El render jamás decide** (P5): cámara, giro y zoom cambian la vista, nunca la niebla, los recursos ni los resultados.
9. **Cloudflare sin estado**: el borde sirve bytes horneados e inmutables; no calcula el mapa.
10. **Decreto p0 del 2026-11-01**: la web no nombra Atlantis ni the Risen hasta que los PCs del rack estén desplegados (guarda `atlas/nombres_retirados_casos.mjs`).

## 3 · El tren de PRs (cómo se llega a main)

1. Se empuja la cabeza; CI corre `test_web`, `phase` y `hitl`.
2. La Mesa sirve la línea HITL de esa cabeza en buzon#30 y firma al verde.
3. Con los tres checks en verde y el PR CLEAN, se fusiona (`gh pr merge --merge`). **Nunca** `--admin`, nunca force-push.
4. Cada fusión deja DIRTY a los demás, porque comparten el sello, el recuento de rutas, F0 e `index.html`. Se rebasa **uno** (el siguiente en el orden), se re-sella por encima de la VERSION servida y se empuja. Se vuelve al paso 1.
5. `deploy.yml` despliega lo fusionado; se comprueba en vivo con `curl https://preceptoros.org/sw.js` (VERSION) y en el Doogee por CDP (`adb forward tcp:9333 localabstract:chrome_devtools_remote`).

## 4 · Recibo de cada pieza (qué se mide)

- FPS sostenidos y p95 en el S110 (método CDP con `setBypassServiceWorker`), y primera escena en frío.
- Bytes por chunk y por conjunto visible, contra el `budget` de `atlas.carta/1`.
- Lo no medido es NO_DATA con su causa; TalkBack es de las manos del carbono.

## 5 · Antes de declarar NO_DATA

Se busca primero en `odd/tasks/claves-del-rack.md` y luego en el rack (`grep -rIl`). Las mejores fuentes son los folios de ideas de octubre y las joyas. Cada clave que desatasca algo se añade a ese índice.
