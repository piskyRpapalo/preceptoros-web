# MAPA 2.5D · LA ALDEA · plan (modo plan, sin metal visual) · 2026-11-01

Encargo: `roadmap/odd/GUIA-SESION-NUEVA-20261101.md` §3 y `roadmap/odd/PLAN-SESION-IDEAS-NOV-20261101.md` (F0, F3 y F4).
Leyes: `DECRETO-TECHO-NUEVO-20261101` (Doogee + chunk ≤ 25 MiB), sin build, A11Y como contrato del asset, cero peticiones externas.
Medido en: Beelink (soberano), `origin/main` 02c313e (2026-11-01T07:18Z), VERSION servida `preceptoros-2026-17-bk`.
Más H2 (#533, cabeza 64e313c): `/face/face_terminal.js` pasa a `/game/face_terminal.js`.

## 0 · Lo que el censo corrige del plan (HECHO, con medida)

- **«atlas.carta/1 ya existe»: solo a medias.** Vive únicamente en `public/assets/atlas-mapa.js` (12,989 B, `:38`), y
  **ninguna página servida carga ese fichero** (`grep -rl atlas-mapa.js public` = 0). Tampoco hay esquema en `data/`.
  Hoy el contrato es un huérfano: F3 lo **define** (esquema + casos) en vez de heredarlo.
- **Cinco módulos señalados, uno ya fuera.** `face_world*.js` salen con H2 (#533, a `retirados/face/`). `bubble_world.js`
  (6,249 B) no pinta: no tiene canvas ni bucle.
- **Censo de pintores servidos, sin /face**: 12 ficheros con `getContext('2d')`. Bucles `requestAnimationFrame` en
  `sea.js`, `openworld_page.js`, `summon_reveal.js`, `summon-wave-card.js`, `wave_duel_scene.js` y `atlas-mapa.js`
  (huérfano). La niebla la nombran 7 módulos servidos, pero solo `fog_of_war.js` (`AtlasNiebla`) la calcula.
- **/openworld/ hoy**: 48 scripts, **249,094 B** sin comprimir, todos del mismo origen. Una sola colocación
  (`colonia_pagina.js` → `geometry`) y un solo lienzo de mapa (`#surface`, `openworld_page.js`).
- **Contradicción preservada**: el plan pide «un solo módulo que pinte». Ya es casi cierto en el mapa (un lienzo,
  una geometría), pero no en la escena (el duelo, la revelación y el mar tienen lienzo propio). El plan unifica el
  **mapa**; las escenas siguen siendo vistas a demanda.

## F0 · Inventario de funciones vivo (gate: cero funciones perdidas)

Método: `grep -oE 'src=' public/openworld/index.html`. Por cada script se mide el global que exporta, el estado de
navegador que toca y cuántas pruebas lo nombran (`grep -rl` en `atlas/`, `tests/` y `test_web.py`). Un 0 no significa
«sin prueba»: los `visitor_*` se prueban por navegador en `visitor_conquest_browser.mjs`/`openworld_browser.mjs`, que
los ejercen sin nombrarlos. El gate F0 lo hace explícito.

| # | módulo | B | global | estado que toca | pruebas que lo nombran |
|---|---|---|---|---|---|
| 1 | `game/tabla_semantica.js` | 5462 | AtlasSemantica | — | 20 |
| 2 | `game/comic_tokens.js` | 1344 | AtlasComicTokens | — | 20 |
| 3 | `game/comic_accents.js` | 2974 | AtlasComicAccents | — | 13 |
| 4 | `game/comic_atoms.js` | 5201 | AtlasComicAtoms | — | 11 |
| 5 | `game/valores.js` | 8584 | AtlasValores | — | 23 |
| 6 | `game/gacha.js` | 6005 | AtlasGacha | — | 26 |
| 7 | `game/bubble_language.js` | 16240 | AtlasBubble | — | 20 |
| 8 | `game/bubble_letters.js` | 5197 | AtlasBubbleLetters | — | 10 |
| 9 | `game/isometric_floor_projection.js` | 1486 | — | — | 4 |
| 10 | `game/global_map.js` | 10717 | AtlasMapaGlobal | — | 5 |
| 11 | `game/state_frames.js` | 2772 | AtlasStateFrames | — | 14 |
| 12 | `game/hex_projection.js` | 542 | HexProjection | — | 9 |
| 13 | `game/colony_state.js` | 1019 | — | — | 7 |
| 14 | `game/map_scene.js` | 2188 | AtlasMapScene | — | 1 |
| 15 | `game/colonia_edificios.js` | 7543 | AtlasEdificios | — | 7 |
| 16 | `game/palette_cycle.js` | 3525 | AtlasPaletteCycle | — | 4 |
| 17 | `game/openworld_state.js` | 4208 | AtlasOpenworldState | — | 3 |
| 18 | `game/colonia_pagina.js` | 11432 | AtlasColoniaPagina | dataset.zoom | 4 |
| 19 | `game/map_zoom.js` | 1568 | AtlasMapZoom | dataset.zoom | 3 |
| 20 | `game/tutorial_walk.js` | 4196 | AtlasTutorialWalk | — | 1 |
| 21 | `game/walk_route.js` | 4419 | AtlasWalkRoute | — | 1 |
| 22 | `game/map_stick.js` | 4182 | AtlasMapStick | — | 1 |
| 23 | `game/colony_controls.js` | 14617 | AtlasColonyControls | localStorage | 4 |
| 24 | `game/db.js` | 11900 | AtlasArmy | indexedDB | 6 |
| 25 | `game/visitor_account.js` | 3025 | AtlasVisitorAccount | — | 2 |
| 26 | `game/visitor_eggs.js` | 3156 | AtlasVisitorEggs | — | 0 |
| 27 | `assets/atlas-coord.js` | 2250 | AtlasCoord | — | 5 |
| 28 | `game/canon.js` | 3149 | AtlasCanon | — | 25 |
| 29 | `game/gdpr-art25-ephemeral-crab.js` | 4645 | AtlasCangrejo,AtlasCrab | — | 7 |
| 30 | `game/taller.js` | 4010 | AtlasTaller | — | 11 |
| 31 | `game/combate_ticks.js` | 6679 | AtlasCombateTicks | — | 5 |
| 32 | `game/escuadron.js` | 2786 | AtlasEscuadron | — | 4 |
| 33 | `game/escena.js` | 5136 | AtlasEscena | — | 10 |
| 34 | `game/wave_rules.js` | 4463 | AtlasWaveRules | — | 1 |
| 35 | `game/wave_duel_scene.js` | 16200 | AtlasCalidad,AtlasWaveDuel | — | 4 |
| 36 | `game/fog_of_war.js` | 3176 | AtlasNiebla | — | 4 |
| 37 | `game/visitor_battle.js` | 3510 | AtlasVisitorBattle | — | 0 |
| 38 | `game/battle_replay_controls.js` | 1782 | AtlasBattleReplayControls | — | 1 |
| 39 | `game/visitor_battle_ui.js` | 4417 | — | — | 0 |
| 40 | `game/visitor_conquest.js` | 3843 | — | — | 0 |
| 41 | `game/hatch_reveal.js` | 1838 | AtlasHatchReveal | — | 0 |
| 42 | `game/visitor_play.js` | 3541 | — | — | 0 |
| 43 | `game/world_feed.js` | 1115 | AtlasWorldFeed | — | 1 |
| 44 | `game/map_chat.js` | 4952 | — | — | 1 |
| 45 | `assets/radio_message_log.js` | 8790 | AtlasRadioChat | dataset.ciclo,dataset.fuente,dataset.quien,dataset.sello | 3 |
| 46 | `face/face_terminal.js` | 2091 | — | — | 0 |
| 47 | `assets/pwa.js` | 1596 | — | — | 6 |
| 48 | `game/openworld_page.js` | 15623 | — | dataset.zoom | 1 |

### Funciones de cara al visitante (lo que no puede perderse)

| función | dónde vive | estado | cómo queda intacta tras los chunks |
|---|---|---|---|
| Mapa, cabaña siempre, nodos solo si viven | `global_map.js` `estado()`, `openworld/estado.json` | ninguno (lee frames) | el chunk aporta suelo; quién vive lo sigue diciendo el frame del nodo |
| Colocación única + clic en nodo | `colonia_pagina.js` `geometry/anchorOf/nodeAt` | `dataset.zoom` | sigue siendo la ÚNICA colocación; el pintor de chunks la consume |
| Joystick, rutas, caminar | `map_stick.js`, `walk_route.js`, `tutorial_walk.js`, `colony_controls.js` | `localStorage` | ninguna coordenada cambia de sistema: los chunks se indexan en axial (q,r) |
| Zoom: pinza, rueda, teclado, botones, voz | `map_zoom.js`, `openworld_page.js` | `dataset.zoom` | la vecindad de chunks se calcula desde `factor()`, no al revés |
| Cuenta efímera, cangrejo | `visitor_account.js`, `gdpr-art25-ephemeral-crab.js` | memoria | intacto: el cangrejo es actor, no chunk |
| Huevos, eclosión, revelación | `visitor_eggs.js`, `hatch_reveal.js`, `summon_reveal.js` (a demanda) | IndexedDB (`db.js`) | intacto |
| Conquista y duelo | `visitor_conquest.js`, `visitor_battle*.js`, `wave_duel_scene.js`, `combate_ticks.js` | memoria | intacto: la conquista apunta a un nodo (id), no a una celda del chunk |
| Niebla | `fog_of_war.js` | derivado | la niebla se calcula por chunk; un chunk no cargado = NO_DATA con causa (niebla honesta) |
| Chat, radio, terminal | `map_chat.js`, `radio_message_log.js`, `face_terminal.js` | `dataset.*` de la radio | intacto: el chatbot del edificio escribe en la MISMA radio |
| Registro de estado (A11Y) | `#state` aria-live + radio | DOM | cada chunk y cada asset añade su frase al registro; nunca se quita una |

**Gate F0** (pieza P0): `atlas/f0_funciones_casos.mjs` lee la tabla de arriba como dato y comprueba tres cosas.
Cada global sigue exportado, cada script sigue cargado en `/openworld/`, y cada función tiene al menos una prueba
de navegador que la ejerce. Quitar una función da rojo. Se enseña en rojo quitando `map_zoom.js` del HTML.

## F3 · Cómo se trocea atlas.carta/1

- **Unidad**: un **chunk hex** de radio 8 en coordenadas axiales (217 celdas). Su clave es `(cq, cr)`, el centro
  cuantizado. Los chunks teselan el plano con la misma `hex_projection.js` que ya usa la colonia.
- **Ficheros, todos estáticos, del mismo origen y en el repo**:
  - `public/map/carta.json` · `atlas.carta/1`: la lista de chunks con `id`, `sha256`, `bytes` y `frame`. El frame es
    un marco de burbuja de menos de 1,024 B que lo nombra y lo describe en texto.
  - `public/map/chunks/<cq>_<cr>.<sha8>.json` · `atlas.chunk/1`: suelo (alturas t2, agua, zonas vedadas t1), semilla de
    detalle y referencias a assets **por id**.
  - `public/art/<id>.json` · `atlas.asset/1`: el arte hornado. Ondas `[k, ax, ay, fase]` enteras, paletas, texturas
    procedurales con su semilla y datos de sonificación, cada uno con su `frame` (texto, alt, rol). **No hay PNG ni GLB**:
    el arte de la casa son ondas, y una onda es un dato.
- **Carga por vecindad**: el chunk del jugador + sus 6 vecinos. Se piden por **clave cuantizada**, nunca por coordenada
  exacta, y cada petición queda declarada en el registro («Map loaded chunk 0,8 · 7 of 7»). El resto es niebla con causa.
- **Integridad**: SHA-256 por chunk, el mismo patrón que `chunk_router.js` (`chunk_hash_mismatch`,
  `cache_chunk_missing`), sin duplicar código. Como el sha va en el nombre, el SW cachea de forma inmutable; un
  `carta.json` viejo frente a uno nuevo = `STALE` + Δ en el registro.
- **Culling** por la caja de pantalla según `factor()` del zoom.
- **Techo**: un chunk de 217 celdas pesa unos KB, lejos de 25 MiB. El límite que manda es el **Doogee**, así que se mide
  el FPS antes de subir el radio.

## F4 · Cómo se dibuja la aldea

- **Parcela por nodo**: cada nodo vivo de `estado.json` tiene `(q, r)` y su parcela, que es un anillo hex alrededor.
  La cabaña del tutorial es la parcela 0 y siempre está.
- **Casas = edificios**: los dibuja `colonia_edificios.js` (ya servido), nunca sprites. El tipo y las condiciones los
  decide la app (laboratorio) en un contrato firmado que **referencia el edificio por id**. La web tiene el catálogo
  pre-creado en `public/art/`.
- **El `?` de HITL**: un nodo con `REQUIERE_FIRMA` pendiente lleva un `?` sobre su casa. El `?` es un **botón real**
  de 44 px como mínimo, enfocable con Tab, con `aria-label` «Needs you: <pieza>», y se anuncia en el registro.
  Pulsarlo abre la pieza. Es el HITL hecho visible: el silicio propone y el `?` espera al carbono.
- **Cangrejos con walk() determinista**: los walkers de NORTE 7 (fixture t4, `walk_route.js`) llevan cada bot de nodo
  hasta su parcela. La posición es función de `(semilla, tick)`, sin `Math.random`. Estados = taxonomía:
  `walking` · `building` · `needs-you` · `NO_DATA`, cada uno con forma y texto, nunca solo color.
- **Ciclo de día**: `palette_cycle.js` y `global_map.js paleta(t)` ya existen; se reusan.
- **Movimiento reducido**: con `prefers-reduced-motion`, los walkers saltan de parada en parada y el registro narra el paso.

## Edificios con chatbot

- Cada edificio del catálogo trae `chat`: un guion en bubble language (saludo, qué mide, qué ofrece) y su **interfaz**.
  El banco habla de huevos, la arena de duelos y la cabaña del tutorial.
- Entrar en un edificio (Enter o tap, `colony_controls` select/enter) abre su conversación en la **misma radio**
  (`AtlasRadioChat`). Así, el lector de pantalla oye el edificio igual que oye el mapa.
- **Conversación nativa del navegador, sin servidor**: el guion se ejecuta en el cliente. Si hace falta un modelo, va
  por `chunk_router.js`, y sin modelo instalado responde `NO_DATA · model_not_installed`. Nada se inventa.
- El enlace al modelo local del Soberano: **NO_DATA**, slot reservado por el Soberano.

## Qué se toma de cada referencia

| referencia | se toma | no se toma |
|---|---|---|
| bot-crossing (Station-Sciences, MIT) | parcela por repo/nodo; el bot camina hasta ella; el `?` cuando necesita a la persona; estado separado del render | Three.js, Vite, GLB, su código (sin mantenimiento garantizado). Atribución en `CREDITS.md` (decisión §6 del Soberano) |
| Zelda | exploración: la niebla se levanta al caminar; un chunk nuevo se descubre, no se lista | combate de acción en tiempo real: aquí el duelo es determinista |
| la aldea (hogar) | tu casa y tus vecinos, rutina diaria (el ciclo de día), los bots con vida cotidiana visible | economía de grind |
| Diablo (el pueblo como hub) | la cabaña y el pueblo son el hub: de ahí sales al mapa y vuelves; los edificios son servicios (huevos, arena, taller) | botín aleatorio: el gacha sigue siendo honesto y con su tabla publicada |

## Piezas (un PR cada una, rojo→verde, sello con VERSION creciente)

| pieza | qué | gate nuevo |
|---|---|---|
| P0 · F0 | `f0_funciones_casos.mjs` + la tabla como dato | quitar una función = rojo |
| P1 · carta | `data/atlas_carta_schema.json`, `atlas_chunk`, `atlas_asset`; casos buenos + 6 violaciones (como `test_atlas.py`) | frame > 1,024 B o sin texto = rojo |
| P2 · horno | `atlas/hornea_chunks.mjs` (laboratorio, fuera de lo servido) genera `public/map/` desde los fixtures t1/t2 | determinista: dos hornadas = mismo sha |
| P3 · vecindad | `public/game/map_chunks.js`: carga 7 chunks por clave cuantizada; integridad; niebla con causa | petición fuera de la vecindad = rojo; byte corrupto = `chunk_hash_mismatch` |
| P4 · pintor | el lienzo de `openworld_page.js` pinta el suelo de los chunks por la colocación única | F0 verde; FPS en el Doogee medido |
| P5 · aldea | parcelas, casas, `?` HITL, walkers | `?` enfocable con Tab y anunciado; reduced-motion |
| P6 · chatbots | `chat` por edificio en la radio | entrar con el teclado abre la charla; sin modelo = NO_DATA |
| P7 · medida | FPS sostenidos, bytes/chunk, time-to-first-scene en el Doogee (adb + traza de Chrome), TalkBack | cifra con comando, máquina y fecha, o NO_DATA |

Medición de referencia: `adb` contra el Doogee S110 (360×716 @3x), Chrome remoto con `Tracing` y
`performance.mark('first-scene')`. La lectura con TalkBack necesita las manos del carbono, así que queda **NO_DATA**
hasta su recibo.

## Decisiones abiertas del Soberano (§6, no se toman aquí)

1. ¿2D/2.5D sin build durante el MVP? (este plan lo asume) · 2. Atribución MIT de bot-crossing en `CREDITS.md`.
3. Política de assets binarios: este plan no usa ninguno; un GLB necesitaría enmienda.
4. Radio del chunk (8) y vecindad (7): se proponen y se miden; los cambia el FPS del Doogee, no el gusto.

## Adenda · NO_DATA desatascados con el rack (búsqueda por palabras clave, 2026-11-01)

Busqué con `grep -rIl` en `p0x/`, `roadmap/`, `mapa-registro/` y en `odd/` y `atlas/` de la web.

- **atlas.carta/1 sí tuvo módulo, y es recuperable.** `public/assets/atlas-carta.js` era el estado **puro** del mundo
  abierto («ni DOM, ni red, ni reloj, ni azar»: mismo estado, mismo mundo, misma niebla). Tenía 11,750 B y salió con
  Norte 7 corte D (`752338f`). Se lee con `git show 752338f^:public/assets/atlas-carta.js`. Hay una copia comentada de
  16,238 B en `p0x/propuestas/obra-abku/instantaneas/d1-assets-comentados-2026-10-18/`. Por eso, en el §0, «sin
  esquema» se mantiene, pero «sin módulo» queda corregido. **P1 parte de ese módulo**, no de cero; `atlas-mapa.js` fue
  su vista y quedó huérfano.
- **El FPS del Doogee tiene método medido** (`p0x/hexelion/laboratorio/espacios/web-pupilo/huellas.jsonl`, 2026-10-13).
  Es un perfil de CPU por CDP en el teléfono, con un A/B en la misma pestaña y `Network.setBypassServiceWorker`, y su
  guarda con sabotaje. Medidas de entonces: **2.8 → 57.8 fps** (cache de teselas rehecha cada cuadro) y 59 fps. La
  decisión de entonces sigue viva: medir los fps tras **cualquier** cambio de cámara o proyección. P4 y P7 reusan ese
  método; la vara es ~58 fps.
- **bot-crossing ya fue leído** (`p0x/preceptor-runtime/odd/tasks/status-bus-research.md:5-7`, 2026-10-28, commit
  `8cd9d76`). La frontera de casa ya está propuesta: observaciones tipadas `{id, state, cause, source, sequence}` →
  autoridad local → snapshot → el renderer pinta y **no infiere trabajo de la animación**. Los estados del walker en F4
  se toman de ahí.
- **Siguen siendo NO_DATA, porque no los resuelve una búsqueda:**
  - Lectura con TalkBack: hacen falta las manos del carbono.
  - Enlace al modelo local del Soberano: el slot lo reservó él.
  - Atribución MIT en `CREDITS.md`: es decisión §6.
