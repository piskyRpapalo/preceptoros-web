# FASE VISUAL DEL OPENWORLD · plan medido (brief del orquestador mistral + 12 correcciones) · 2026-11-01

Estado: **PLAN**. No se toca metal visual hasta que G0 esté entero en `main` y firmado.
Lecturas: `AGENTS.md`, `study/13-rosetta.md` (por `gh api`), `odd/tasks/mapa-25d-aldea.md`, `docs/PRUEBA_5_MINUTOS.md`.
Medido en: Beelink (soberano) contra `origin/main` del 2026-11-01. Doogee por `adb`.

## G0 · la puerta, medida hoy (no se empieza con ningún rojo)

| gate | estado | prueba |
|---|---|---|
| G0-1 · toda función de /openworld/ guardada en CI | **NO_DATA**: #535 abierto | `atlas/f0_funciones_casos.mjs` (15 funciones, 48 scripts; 8 pruebas de navegador que no corrían en CI entran) |
| G0-2 · router de chunks y `atlas.carta/1` en main con recibo | **NO_DATA**: #536 (P1) y #539 (P2/P3) abiertos | `map_carta_casos.mjs`, `map_chunks_casos.mjs`, `hornea_chunks.mjs --check` |
| G0-3 · cero peticiones externas al cargar; modelo solo con clic | **HECHO** en el código: `openworld_browser.mjs` exige `externas.length === 0`, y `chunk_router.js` solo se inyecta en el primer envío del chat (`openworld_page.js:203-210`) | se re-mide en el Doogee en P7 |
| G0-4 · PRUEBA_5_MINUTOS por un humano en el dispositivo de referencia, red real, con recibo (corrección 1) | **NO_DATA**: `docs/PRUEBA_5_MINUTOS.md` está **desfasado** (re-medido el 2026-10-27; cita `/play/` y `/face/`, ya retirados). Se reescribe para /openworld/ en pieza propia; la pasada la hace el carbono | recibo con fecha + dispositivo |

## Dispositivo de referencia (corrección 2): fijado

Doogee **S110** (`adb shell getprop ro.product.model`), Chrome **156.0.8078.73**, ahorro de batería **apagado**
(`settings get global low_power` = 0), 360×716 @3x. Si el ahorro está encendido, se mide aparte y se dice.
**El peor chunk de T1** no lo elige quien reporta: es el de mayor `bytes` × celdas visibles en la vecindad de la cabaña,
calculado desde `public/map/carta.json`. Método FPS: perfil CDP en el teléfono con un A/B en la misma pestaña y
`Network.setBypassServiceWorker` (huellas del laboratorio, 2026-10-13: 2.8 → 57.8 fps).

## Presupuesto declarado en el contrato (corrección 3)

Se añade a `atlas.carta/1` (enmienda de #536, pieza propia) un campo `budget`. Valor propuesto, medido sobre lo
horneado (máximo 4,236 B por chunk; 30,476 B entre los 9 ficheros):
- `chunk_bytes_max`: 65,536. Holgura de 15× sobre lo horneado, y muy lejos de los 25 MiB.
- `visible_bytes_max`: 458,752, es decir, 7 × 65,536.

`checkCarta` da rojo si un chunk o la vecindad lo superan. Las cifras las ajusta el FPS del Doogee, no el gusto.

## Principios del brief, con las correcciones dentro

- **P1** · el marco de burbuja (< 1,024 B) es la fuente; el dibujo sale de él.
- **P2 + corrección 6** · un chunk, un PR, un recibo. **Las paletas, léxicos y assets compartidos van en PR propio,
  jamás dentro del PR de un chunk**: hoy `sea-palette` la usan los 7.
- **P3 + corrección 5** · A11Y como contrato. Los textos equivalentes salen de una tabla con claves, no de cadenas sueltas.
  ✗ **Contradicción preservada**: la web tiene 9 lenguas solo en `public/assets/enviar-*.js`, y el CLAUDE.md del repo
  dice «el juego habla solo inglés hoy; no se traduce sin orden». Se hace la tabla en inglés, con claves, para que
  traducir sea añadir un fichero; traducir espera la orden del Soberano.
- **P4** · «AAA» es un perfil medido (T1-T6), nunca una frase.
- **P5 + corrección 7** · lo visual jamás cambia reglas ni resultados. **La niebla es información**: la decide
  `fog_of_war.js` (`AtlasNiebla.niebla`). Verificado en interno: la cuenta efímera revela lugares por **conquista de
  sesión** (`visitor_conquest.js:36`, círculos r=200 de los registros de esta visita) y el dibujo solo cambia la opacidad
  (`:47`, 0.5 ↔ 1). La fase visual pinta ese estado y nunca toca la regla.

## Fase 1 · censo por chunk (corrección 11: extiende, no re-censa)

Parte de F0 (#534, `mapa-25d-aldea.md`) y de `public/map/carta.json`. Por chunk añade marcos, bytes, assets por id, FPS
en el S110 y estado A11Y. Hoy hay 7 chunks horneados (de 3,807 a 4,236 B). Los FPS por chunk son **NO_DATA** hasta P4,
porque todavía nada pinta los chunks.

## Fase 2 · un chunk cada vez

Pasos a-f del brief, más lo siguiente:
- **Sonido (corrección 4)**: el marco nuevo pasa `tests/bubble_audio_contract.test.mjs`, `atlas/bubble_sonify_casos.mjs`
  y `atlas/audio_feedback_manager_casos.mjs`. Si la radio (#532) dice algo distinto, eso necesita **recibo propio** en el PR.
- **Guardián de hash (corrección 8)**: `atlas/frames_hash_casos.mjs` sella el hash del conjunto de marcos de cada chunk.
  Un cambio sin hash nuevo declarado en el PR da rojo: una regresión visual que una máquina puede ver lleva su check.
- **Cola (corrección 12)**: primero lo que todo visitante ve primero, la cabaña (`0_0`) y su primer anillo. Ese chunk
  es también la referencia lado a lado de T4.

## El perfil AAA, medido

- **T1**: FPS sostenidos en el S110, con el peor chunk calculado a la vista.
- **T2**: tiempo hasta la primera escena en frío y en caliente, con `performance.mark('first-scene')` y la traza CDP.
- **T3**: bytes contra `budget`.
- **T4 (corrección 10)**: el Soberano juzga lado a lado con la **misma semilla y el mismo tick** y los hashes de ambos
  marcos, y escribe `FUNCIONA` / `FUNCIONA CON CORRECCIÓN` / `TENSIÓN`. Nunca un número.
- **T5**: lectura completa con TalkBack en el S110, por manos del carbono.
- **T6**: G0 verde tras cada chunk.

## Trabajo externo (M1-M5 + corrección 9)

Cada idea adoptada lleva su entrada de procedencia en la Rosetta: URL, licencia, commit o fecha, qué se tomó y qué se
reescribió, **más la cita textual de la línea de licencia que lo autoriza**.
- bot-crossing (MIT): la metáfora ya está leída en `8cd9d76`. La entrada de `CREDITS.md` sigue en la §6 del Soberano.
- openring: **NO_DATA**, porque su fichero de licencia todavía no se ha leído. No se infiere.

## Gates, en las dos pasadas de cada PR

Cada marco y recibo < 1,024 B · cero peticiones externas · sin paso de build en `public/` · palabras vetadas fuera del
código y de la UI (token, moneda, oraculo, notario, depin, clearing, magia) · sin rutas privadas, repos privados, IPs ni
prompts crudos en lo versionado.

## STOP

Credencial, fusión, deploy, línea HITL, escritura en PARA_LA_MESA.md, prompt crudo, IP, ruta privada, build o CDN de
terceros, o cambio de reglas o resultados: **se para y se reporta**.

## Piezas que este plan abre (en orden)

1. G0-4: reescribir `docs/PRUEBA_5_MINUTOS.md` para /openworld/. La pasada humana es del carbono.
2. Enmienda `budget` de `atlas.carta/1`.
3. `frames_hash_casos.mjs`.
4. Tabla de textos con claves (inglés).
5. P4: el pintor de chunks y la primera medida T1/T2 en el S110 sobre `0_0`.
