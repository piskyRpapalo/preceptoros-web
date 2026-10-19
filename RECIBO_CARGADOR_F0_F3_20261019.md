# RECIBO · cargador de F0–F3 en modo aparte (solo forma)

- Base: `origin/main` 4e4cad1 · rama `haiku/cargador-f0-f3` · sin commit ni push.
- Decisión: Soberano 2026-10-19 (modo aparte, la intro del rift se conserva).
- Hecho:
  - `descent_view.js` (14,8 KB): puerta «Start in the Fog» dentro del último fotograma de la intro (no es `descent-step`; el orden de fotogramas no cambia). Al pulsar, monta la máquina F0–F3 con `ui-tutorial-fases.js` en el mismo panel.
  - `thegame.js`: carga `tutorial_fases.js` y `ui-tutorial-fases.js` antes de `descent_view.js`. `sw-listas.js`: precache de los tres ficheros (`tutorial-fases.css` incluido). `arnes_sw.mjs`: 177 → 180 rutas, con su línea de historial.
  - `world_creator.js`: límite de la consulta 200 → 600 (decisión del puente #181). Envoltorios `descent-local-query` y `descent-local-result` (aria-live polite).
- Caso 9 de `descent_view_casos` (ROJO en origin/main, medido sin mis cambios): el fix de la Mesa (2ccb22f) tocó solo el harness; el envoltorio del producto no existía. Añadido aquí: 10/10.
- Gates: `test_web` 78 (1 saltado) · `arnes_sw` 22/22 · `test_atlas` 188/188 · `descent_view_casos` 10/10 · `ui_tutorial_casos` 7/7. Sello: `VERSION` intacta `preceptoros-2026-17-abjf`.
- Registraciones en `test_atlas.py`: `world_creator.js`, `tutorial_fases.js`, `ui-tutorial-fases.js` en DESCENSO; `combate_ticks.js` en ARENA; `etiqueta.js` y `silueta.js` fuera de la puerta. Son faltas ya presentes en origin/main.
- Verificación visual (Chrome headless y Doogee S110, página de prueba que monta la intro vía `TheGame.codex`):
  - Chrome: último fotograma con la puerta «Start in the Fog» bajo «Questions???». Tras pulsar, F0 «Two doors» 1/9 dentro de la intro.
  - Doogee: mismo estado; la puerta y el tutorial se ven.
- DEFECTOS ABIERTOS (vistos, no corregidos):
  1. Doogee: tras montar, el scroll deja el título y la primera línea de F0 tapados por la imagen. Falta llevar el tutorial a la vista (`scrollIntoView` del contenedor).
  2. El tutorial NO se autoguía hasta el final: `primer_edificio` queda bloqueado con `NO_DATA` porque no hay etiqueta de edificio medida que pasar. Hace falta una fuente medida de etiqueta (p. ej. `deploy_building`).
  3. Las pantallas y el CSS de VT5 no están en la rama remota de VT5 (la reconstrucción de la Mesa, 79c9afe, las dejó fuera). Esta caja sí las incluye.
- NO hecho del encargo: el epílogo de historia continua de la intro, J2 Batalla de Ondas, el barrido de `soberano.css`.
- Commit y push: mano del carbono (Ley del Buzón).
