# NO-LIVE-WORLDS · la web no presenta mundos vivos sin nodo (comisión del Soberano, 2026-10-28)

## Objetivo
Hoy no hay ningún nodo real en la web. Ni Atlantis (el Beelink) ni the Risen se presentan como mundos vivos. La
web muestra solo el mapa, la cabaña del tutorial y el panel de chat, que aún no habla.

## Alcance (slice 1, solo web, sin Worker)
- `public/face/index.html`: el hub deja de enlazar a los tres mundos. Texto honesto: no hay nodo vivo, y se enlaza al mapa.
- Lo que NO se toca, por instrucción: las páginas `face/atlantis.html`, `face/zombie.html`, `face/basic.html`, sus deep
  links, y el combate de duelo de onda. Preservación (app#115): los deep links siguen válidos hasta que haya una regla de
  redirección medida y una puerta propia de Worlds.
- Sitemap y precache: sin cambio, porque las páginas siguen existiendo y el test exige que el sitemap liste el contenido.

## Fuera de alcance (declarado)
- `public/face/face_tutorial.js` (tutorial de elección de nodo, Hexelion/Doggee): enseña los nodos como opciones del
  tutorial. Su mecánica es del tutorial, no de esta slice. Se señala al orquestador.
- `public/game/en301_tutorial_copy.js` y `en301_tutorial_model.js`: ya dicen «Atlantis and the Risen show NO_DATA». Sin cambio.
- Enlaces del tipo `public/play/index.html` (`Worlds` → `/face/`): llevan ahora a un hub honesto. Sin cambio.
- Slice 2 (tabla 301 en el Worker): NO empezada. Hay un conflicto: el decreto §4 manda `/face/*` → `/openworld/`, y la
  comisión de hoy prohíbe redirigir `/face/` hasta tener una regla medida. Se pide al Soberano que lo resuelva.

## Checklist
- [x] NLW1 · el hub `face/index.html` no enlaza a Atlantis ni a the Risen ni a Neutral.
- [x] NLW2 · texto honesto: no hay nodo vivo; enlace al mapa.
- [x] NLW3 · las páginas de mundo y sus deep links siguen en su sitio (sin borrar, sin redirigir).
- [x] NLW4 · gates ×2 verdes: test_web 86/86, arnes 23/23, test_atlas, get_the_app, a11y, landing_doors_browser, openworld_browser.
- [x] NLW5 · sello SW en el mismo commit (public/ cambió). VERSION sin subir: `preceptoros-2026-17-abjz`, huella `42927e5b99738ea3`.
- [x] NLW6 · test que puede ponerse rojo: `HubSinMundosVivos`. Sabotaje real (enlace a Atlantis en el hub) → rojo; restaurado → verde.

## Registro de decisiones (modo desatendido)
- 2026-10-28 · Base `origin/main` 90dc2ec. Rama `haiku/no-live-worlds-20261028`.
- 2026-10-28 · El hub conserva el texto «Worlds» y el enlace al mapa; no se elimina la página.
- 2026-10-28 · Conflicto detectado (ver «Fuera de alcance», slice 2). Se para ahí; no se redirige.
