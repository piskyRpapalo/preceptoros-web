# OPENWORLD · la ruta `/openworld/` (NORTE 7 · PR 2)

## Objetivo
Dar a `/openworld/` su forma de decreto: mitad superior, mapa interactivo; mitad inferior, chat siempre presente. El estado por defecto (cero nodos) muestra solo el mapa global y la cabaña del tutorial.

## Problema y por qué
La INTRO (PR #366) envía OpenWorld a `/play/` de forma provisional. Este PR crea el destino definitivo, sin nodos vivos y sin red externa.

## Alcance
- Ruta nueva `public/openworld/index.html` (una sola ficha, bajo 16 KiB).
- Mapa: cabaña del tutorial siempre; Atlantis y the Risen solo mientras su nodo esté vivo.
- Chat: panel siempre presente en la mitad inferior. Su motor de respuesta llega con PR #363.
- Sitemap 9 → 10 (`sitemap.py`).
- SW: precache +1 (`/openworld/`).
- INTRO: el destino de OpenWorld pasa de `/play/` a `/openworld/`.
- VERSION sube en el mismo commit que `public/` (ver registro).
- Sello SW en el mismo commit.

## Restricciones
- Cliente: cero peticiones externas. Ningún `api.` ni `atlas.` desde el navegador.
- Estado de nodos: fichero same-origin, `public/openworld/estado.json`, con cero nodos por defecto. No hay Worker nuevo ni despliegue.
- Gráficos: burbuja de hoy, 3 colores (`paper`, `ink`, `cyan`), nada más.
- Textos de UI en inglés. Sin nombres de dispositivo ni rutas de usuario. Sin vocabulario vetado.
- No merge, no deploy, no Cloudflare.

## Checklist
- [x] OW1 · ficha `public/openworld/index.html` con las dos mitades y la cabaña siempre visible.
- [x] OW2 · estado por defecto: cero nodos; el mapa muestra solo la cabaña.
- [x] OW3 · Atlantis y the Risen aparecen solo si `estado.json` los lista como vivos; si no, no existen en pantalla.
- [x] OW4 · chat siempre presente, sin botón de «Chat»; entrada desactivada y texto honesto hasta que llegue #363.
- [x] OW5 · INTRO: OpenWorld → `/openworld/`.
- [x] OW6 · sitemap 9 → 10, regenerado con `sitemap.py`.
- [x] OW7 · precache 222 → 223 en `arnes_sw.mjs`, con línea de historial.
- [x] OW8 · tests: ruta, estado por defecto, cero peticiones externas, sin botón de chat.
- [x] OW9 · sello: VERSION sube, huella, `gzip_juego_b`, contadores.
- [ ] OW10 · gates ×2 verdes en local y en CI antes de informar.

## Evidencia
- OW1-OW4: `atlas/openworld_browser.mjs` (navegador real, 390 px): titulo OpenWorld; botones solo «Tutorial cabin»; 17.319 px con tinta en el mapa; estado «Nodes online: 0»; entrada apagada; sin boton de Chat; sin scroll lateral; 0 peticiones externas; 0 excepciones. Captura en la conversacion.
- OW8: `test_web.OpenWorld` 6/6 (ficha <= 16 KiB, estado por defecto cero nodos, nodos solo si vivos, cero peticiones externas, chat siempre sin boton, sitemap y precache).
- OW5: `local_first_surface_build.py` cambia el destino de OpenWorld a /openworld/; `test_web.Puerta` y `landing_doors_browser` actualizados.
- OW6: `sitemap.py` 9 -> 10 URL (`sueltas()` gana `openworld/`); `sitemap.xml` regenerado.
- OW7: `arnes_sw.mjs` 222 -> 223 (linea de historial).
- OW9: VERSION `preceptoros-2026-17-abjy` -> `preceptoros-2026-17-abjz` (bump en el mismo commit); huella final `90dde68cece3fcda`; `gzip_juego_b` 111321 (< 153600); `arnes_sw` 23/23; `pruebas_web` 84 (medido por `Ran 84 tests`).

## Registro de decisiones (modo desatendido: feature-branch-chain)
- 2026-10-28 · Base: `origin/main` = `7d909bb` (PR #366 fusionado). Rama `haiku/openworld-20261028`.
- Búsqueda previa. Hallazgo: «5.42» y «Punto 6» no están en `main` (`git grep`). Las joyas y el registro de decretos viven en el rack, fuera del repo. No se han verificado y no se usan como base.
- Hallazgo: PR #363 está ABIERTO y sin fusionar (REQUIERE_FIRMA). No se consume su código. El panel de chat queda como hueco con texto honesto. Se conecta cuando #363 se fusione.
- Firmas: el trabajo no necesita ninguna. No hay acciones de valor (invocar, adoptar, retar, aceptar, liquidar). No hace falta buscar firmas en el corpus.
- Conflicto de VERSION: la skill `sello-del-juego` dice «VERSION intacta» (ley del encargo de 2026-10-17). El encargo de esta noche pide subir VERSION en el mismo commit. Se sigue el encargo más reciente. Queda declarado en el PR.
- Precache: `/openworld/` más un fichero JS = +2. Para mantener +1, el script va inline en la ficha. Así el recuento es 223, como pide el encargo.
- Reutilizo `bubble_language.js`, `bubble_letters.js` y `comic_atoms.js` tal cual (ya en el precache). No reescribo `game/`.

- 2026-10-28 · Dos unidades de commit: (1) `odd/tasks/openworld.md`; (2) ruta, sitemap, precache, tests, gate de CI y sello. La unidad 2 supera ~400 lineas porque el sello regenera ficheros de `public/`; el sello va en el mismo commit que `public/`, como pide el encargo.
- 2026-10-28 · `pruebas_web` = 84. El campo `como` de `counters.json` dice «python3 test_web.py, cifra Ran N tests». Lo actualicé con esa cifra medida. `coherencia-publica.py` no existe en esta maquina, así que no pude correr el medidor externo; queda declarado.
- 2026-10-28 · `atlas/test_atlas.py`: nueva lista `OPENWORLD_PAGE_DEPENDENCIES` (las mismas piezas de burbuja que la portada), con excepcion en las dos aserciones de piezas a demanda.

## Siguiente paso
Abrir el PR draft REQUIERE_FIRMA y esperar CI. Luego, la entrega para los ojos del Soberano (servidor en puerto nuevo).
