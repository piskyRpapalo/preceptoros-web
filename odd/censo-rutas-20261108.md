# Censo de rutas del shell · 2026-11-08 (solo lectura)

## Duplicada eliminada
- Ruta: `/game/local_app_bridge.js`, repetida dentro del mismo array `JUEGO`.
- Antes: public/sw-listas.js:15 (conservada) y :22 (quitada).
- Despues: una sola aparicion en :15. Ambas estaban en el mismo array sin papel distinto; decision mia (sin firma).
- DEPLOY.md: `Rutas precargadas por el shell: 126` -> `125`. Distintas se mantiene en 125.
- sw_harness.mjs: no requirio cambio (ya esperaba `rutas.length === 125`).

## Salidas
- `count_routes.py --check-doc DEPLOY.md`: `OK · 125 shell entries, 125 unique routes, 0 duplicate` (rc 0).
- `node sw_harness.mjs`: 24/24 en verde.
- `test_web.py`: `FAILED (failures=2, skipped=1)`. Dos fallos:
  1. Huella del SW (`config/sw-huella.txt`) y VERSION de sw.js: pendiente de sello por Opus. No se toco.
  2. `counters.json` peso_sitio=115688916 vs medido 115688887 (diferencia 29 B = la linea quitada). Requiere `counters.py`, prohibido aqui: pendiente por Opus.

## Censo
- Rutas muertas: 0 (125 distintas, todas existen bajo public/).
- Ficheros huerfanos en public/game/*.js (ni en listas ni nombrados en ningun .html): 16:
  acho_sonify, battle_choreography, bb_canon, bb_det, bb_form, bb_radio, brood, building_chat,
  chunk_router, judge_corpus, lexical_projector, rack_ideas, skin_tokens, star_capture, state_vector, vector_contract (.js).
- Criterio: grep solo en .html; un .js puede cargarse desde otro .js. Ninguno borrado.
