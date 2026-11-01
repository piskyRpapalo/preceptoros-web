# Retiro de nombres y del «shared map» de Army · decreto p0 · 2026-11-01

Decreto del Soberano: buzon#30 · comentario 6557670225 (2026-11-01).
(1) lo heredado que no encaja con el mapa de hoy y no funciona se retira con recibo;
(2) fuera el acceso al «shared map» desde la pestaña Army;
(3) hasta que los PCs del rack se desplieguen con la app, la web no nombra «Atlantis» ni «the Risen» (ni «zombie», su cara).

## Medida

- Antes: `git grep -nIi "atlantis\|risen\|zombie" -- public` → 23 líneas en 11 ficheros (más 7 líneas de «shared map»).
- Después: `git grep -nIi "atlantis\|the risen\|zombie" -- public` → 0. «shared map» en public/ → 0.
- Guarda: `node --test atlas/nombres_retirados_casos.mjs` (registrada en `.github/workflows/gate.yml`). Sabotaje: devolver
  «atlantis» al comentario de `public/game/terminal_tabs.js:1` → ROJO (`game/terminal_tabs.js:1 · atlantis`); restaurado → VERDE.

## Lo retirado

| Qué era | Dónde vivía | Por qué | Ahora |
|---|---|---|---|
| Acceso al walker efímero desde Army: frase «The ephemeral walker is available on the shared map terminal…» y enlace «Open the shared map terminal» → `/face/basic.html` | `public/game/army.html:18-19`, generador `atlas/generate_wave_army_face.mjs` | decreto (2): no encaja con el mapa de hoy | borrado; Army queda NO_DATA con un enlace «Back to OpenWorld» (`/openworld/`, 48 px). Guardas adaptadas: `atlas/wave_army_face_casos.mjs`, `atlas/wave_army_browser.mjs`, `tests/face_openworld_terminal.test.mjs` |
| Lápida «Atlantis is retired» | `public/face/atlantis.html` + precache `public/sw-listas.js:24` | decreto (3) | `git mv` → `retirados/face/atlantis.lapida.html`; la URL da 404 |
| Lápida «Zombie terminal is retired» | `public/face/zombie.html` + precache `public/sw-listas.js:25` | decreto (3) | `git mv` → `retirados/face/zombie.lapida.html`; la URL da 404 |
| Aspectos de terminal `atlantis` / `zombie` | `public/game/colony_controls.js` (LOOKS, colores, select), `public/game/openworld_state.js`, `public/game/colonia_pagina.js`, `public/game/openworld_page.js` (FIXTURE_LOOKS), `bin/estado_v2.py`, `public/openworld/estado.json`, copias en `atlas/puros/` | decreto (3): se va el NOMBRE, no el color | renombrados a `ocean` / `flat`; los tokens de color (ocean/paper/comic yellow; ink/cyan/vermilion) quedan igual |
| Nodos `atlantis` «Atlantis · Node Hexelion» y `risen` «the Risen» | `public/game/global_map.js:23-24`, filtro `public/game/openworld_page.js:130` | decreto (3) | `hexelion` «Node Hexelion» y `second` «Second node»; siguen apareciendo solo si `estado.json` los lista vivos |
| Comentarios «atlantis/zombie» | `public/game/terminal_tabs.js:1`, `public/openworld/index.html:53` | decreto (3), comentarios incluidos | «the first face terminals (retirados/face/)» |
| Rótulos «shared map» | `public/face/basic.html` («Open the shared map»), `public/face/face_openworld_terminal.js` («Moved on the shared map»), `public/face/walker.html` («Open the shared map terminal») | la guarda prohíbe la cadena en todo lo servido | «Open the map», «Moved on the colony map», «Open the basic terminal» |

Pruebas y fixtures que siguen la misma regla: `test_web.py` (HubSinMundosVivos, OpenWorld), `atlas/puros/colonia_pagina_casos.mjs`,
`colony_controls_casos.mjs`, `openworld_state_casos.mjs`, `colonia_edificios_casos.mjs`, `catalogo_iso(.js,_casos.mjs)`,
`atlas/fixtures/t1_keepout.mjs` + `atlas/t1_keepout_casos.mjs`, `atlas/fixtures/hitl_estado.json`, `atlas/global_map_casos.mjs`,
`atlas/global_map_recibos.json`, `atlas/barrido_web_casos.mjs` (esperaba ≥3 lápidas; ahora exige exactamente `walker.html`),
`atlas/retiro_face_casos.mjs` (atlantis y zombie ya no se sirven y su lápida vive en retirados/). Precache 115 → 113 entradas,
114 → 112 distintas (`DEPLOY.md`, `arnes_sw.mjs`).

## Desviaciones declaradas

- Las lápidas no van a `retirados/face/atlantis.html` / `zombie.html` porque esos nombres ya los ocupan los originales retirados
  por H2: van como `*.lapida.html`.
- `/face/basic.html` sigue servida (el decreto retira el acceso desde Army, no la terminal); solo pierde el rótulo «shared map».

## Contradicciones preservadas

- `retirados/`, la historia de git, `docs/` y `odd/tasks/inventario-carbono.md` siguen conteniendo los nombres: son el recibo,
  no se sirven. La guarda solo mira `public/`.
- Comentarios en arneses no servidos (`atlas/visitor_*_browser.mjs`, `atlas/openworld_browser.mjs`, `arnes_sw.mjs`) los citan como historia.
- `docs/lexicon.md` sigue definiendo «the Risen» (no se sirve). `atlas/lexicon_base.json` no se regeneró: la base no encogió (77 → 77).

Revertir: `git revert <commit del decreto p0>`.
