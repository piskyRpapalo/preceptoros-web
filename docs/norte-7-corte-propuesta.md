# NORTE 7 · propuesta de corte · la web en dos piezas

**Estado:** PROPUESTA (REQUIERE_FIRMA). Sin código hasta FIRMO del Soberano.
**Tablero:** web#312 · **Decreto:** NORTE 7 (Soberano, 2026-10-28).
**Autor:** arquitecto (Haiku 5.5), rama `haiku/norte7-corte-20261027`, desde `main` @ 07df88e.

## 0. Qué se midió (no se supuso)

| Pieza existente | Bytes | Uso en el decreto |
|---|---|---|
| `public/index.html` | 3.088 | Puerta actual: tres puertas (`/play/`, `/face/`, `/creation.html`) + bloque «web o app». Se reemplaza por la INTRO. |
| `public/face/atlantis.html` | 13.296 | Terreno Atlantis. Reutilizable como datos, no como página. |
| `public/face/zombie.html` | 13.529 | Terreno the Risen (nodo 1). Mismo criterio. |
| `public/face/basic.html` | 13.185 | Tercera variante («Neutral»). No es terreno del decreto. |
| `public/face/face_world_terrain.js` | 4.927 | Geometría de islas (`isles`). Fuente de datos del terreno. |
| `public/game/map_nodes_layer.js` | 1.772 | Capa de nodos del mapa. Reutilizar. |
| `public/game/map_bubble_figures.js` | 1.424 | Figuras de burbuja del mapa. Reutilizar. |
| `public/game/nodos.js` | 10.562 | Catálogo/nodos. Reutilizar; no reescribir. |
| `public/game/node_*.js`, `nodos-*.js`, `ui-nodos.js` | 177–13.441 c/u | Ninguno pasa de 16 KiB por fichero. Reutilizar. |
| `public/game/bubble_*.js` | 1.5K–16.2K c/u | `bubble_language.js` (16.240) **supera** el techo 16 KiB si se carga como ficha única: no se toca; se carga como dependencia. |
| `public/get-the-app/index.html` | 5.491 | Get the app v1.3. Su gate ya pinta «en una o dos clics». |
| `public/assets/pwa.js` | 1.596 | Guarda la oferta `beforeinstallprompt` (decisión a1). Base del botón PWA de Tools. |
| `public/release.json` | 3.724 | Tarjeta de release v1.3, medida 2026-09-13. |

Lo que **no** existe en el repo: una cabaña del Tutorial con ese nombre (ver §5, pregunta 2).

Techo: 16 KiB por ficha. Ninguna de las dos piezas nuevas se sirve como una sola
página inline sobre ese techo; los terrenos y los nodos viajan como datos o módulos
referenciados, y cada ficha se mide antes de fusionar.

## 0.1 Dirimencias de la Mesa (incorporadas)

1. **Terrenos dentro del mapa, en una sola ruta.** Atlantis, the Risen y la cabaña del Tutorial son terrenos *dentro* del mapa de OPENWORLD. No son tres HTML sueltos. Se sirven desde una sola ruta, `/openworld/`, y cambian de terreno en cliente.
2. **Desplegable de Tools = UI visible.** El desplegable de dispositivo/descarga es contenido visible en la INTRO, no un bloque oculto como hoy en `Info → Tools`.
3. **Chatbot local en cliente, cero servidor.** El chatbot de OPENWORLD corre en el navegador. El chatbot remoto queda diferido como pieza propia, con FIRMO propio.

Estas tres decisiones quedan ratificadas por el decreto del 2026-10-28 (§5), que cierra las cuatro preguntas. Con ello, la tensión que §3 señalaba entre el canon y las decisiones queda resuelta.

## 1. Pieza INTRO

- **Qué es:** una página self-contained con tres opciones: **OpenWorld · Tutorial · Tools**.
- **Sustituye:** `public/index.html`. Las rutas `/play/`, `/face/` y `/creation.html` dejan de ser puertas visibles; su destino pasa a ser una opción dentro de OpenWorld o de Tools (ver §4).
- **Tools:** clic directo a la PWA (reusa `pwa.js`, mismo `beforeinstallprompt` retenido) **más** un desplegable de dispositivo/descarga (enlaza a `get-the-app`).
- **Texto honesto mientras no haya clic:** el bloque Get the app v1.3 se refresca desde `release.json`. Si un dato no se puede medir en vivo, va como `NO_DATA` con su causa, no como cifra.
- **Sin peticiones externas al cargar** (regla vigente).
- **Caras públicas:** «Node Hexelion». Nunca marca de hierro. SCRUB vigente.
- **Reutiliza:** `pwa.js`, `landing.css`, `landing_doors.js`, `release.json`. No reescribe nada de `game/`.
- **Coste estimado:** pieza nueva pequeña (una página + un script de tres opciones). Medir al escribir.

## 2. Pieza OPENWORLD

- **Qué es:** mitad superior = mapa interactivo; mitad inferior = chatbot.
- **Tres terrenos:**
  1. **Atlantis** = nodo Hexelion. Datos de `face_world_terrain.js` + `atlantis.html`.
  2. **the Risen** = nodo 1. Datos de `zombie.html`.
  3. **Cabaña del Tutorial** = terreno del tutorial. Ver §5, pregunta 2.
- **Estilo:** burbujas de hoy (`bubble_*`), 3 colores, nada más.
- **Reutiliza, no reescribe:** `map_nodes_layer.js`, `map_bubble_figures.js`, `nodos.js`, `node_*.js`, `bubble_*.js`.
- **Chatbot:** la «terminal de chat» ya está en PR #363 (NORTE 5 p3, REQUIERE_FIRMA). Esta pieza la consume; no la duplica. Su fuente de respuesta (local o remota) es decisión del Soberano (§5, pregunta 1).
- **Techo:** cada terreno es un módulo de datos pequeño; la pieza no se monta como un HTML de terrenos inline.

## 3. Conflictos con el canon (declarados, no resueltos aquí)

1. **«Cero HTML suelto» vs. las páginas actuales.** `public/face/*.html` (3 ficheros) y `creation.html` son HTML sueltos hoy. El corte los retira **por redirección**, nunca borrándolos (el canon de nada-se-borra manda). Requiere FIRMO explícito.
2. **«Nada oculto» vs. el área «Tools» actual.** `docs/web-inventory.md` dice que Tools vive en un bloque *Info → Tools of this product* oculto en cada página de mundo. El decreto lo quiere visible como opción de la INTRO. Eso cambia un comportamiento existente.
3. **Chatbot y «cero servidor».** El canon dice «sin servidor» y «cero peticiones externas al cargar». Un chatbot remoto choca con ambas. Un chatbot local o del propio nodo no choca, pero la fuente exacta es decisión del Soberano.
4. **Get the app «refrescado».** El decreto exige refrescar el texto v1.3. Solo puedo refrescar lo que `release.json` mide; no invento hashes ni fechas nuevas. Lo no medido sale como `NO_DATA`.
5. **LIBRO de firmas.** El repo privado de firmas no está clonado en este checkout, así que **no pude contrastar** la propuesta con los decretos vivos. Antes de fusionar hay que hacerlo, sea quien sea el que tenga el libro a mano.

## 4. Destino de las rutas actuales (aprobado por decreto, 2026-10-28)

| Ruta actual | Destino | Estado |
|---|---|---|
| `/` (index) | INTRO | sustituida |
| `/play/` | **`/openworld/`** (un solo destino) | redirección, no borrado |
| `/face/` | `/openworld/` (índice de terrenos absorbido por el mapa) | redirección, no borrado |
| `/face/atlantis.html` | terreno Atlantis dentro de `/openworld/` | redirección, no borrado |
| `/face/zombie.html` | terreno the Risen dentro de `/openworld/` | redirección, no borrado |
| `/face/basic.html` | `/openworld/` | **RETIRADA** con redirección (no es terreno del decreto) |
| `/creation.html` | opción Tools de la INTRO | redirección, no borrado |
| `/get-the-app/` | enlace desde Tools | se conserva |

## 4.1 Ruta nueva: `/openworld/` (declarada)

- **Es ruta nueva.** No existe hoy (`public/openworld/` no está en el repo).
- **Recuento actual medido** (2026-10-28, `main` @ 07df88e):
  - `public/sitemap.xml`: **9** URL.
  - Shell del SW (`rutasDelShell()` en `public/sw.js`): `/`, `/play/`, `/manifest.webmanifest` + `HUB` (`PORTADA` + `JUEGO` en `public/sw-listas.js`).
- **Efecto al construirla (PR 2, no ahora):**
  - Sitemap: 9 → 10 URL, con `/play/`, `/face/*` y `/creation.html` dejando de figurar como destinos.
  - SW: `/openworld/` entra en el shell; `/play/` sale como destino. Se recalcula el recuento de `HUB`.
  - **Sello SW:** `VERSION` sube por `bin/sellar.py --sellar` según `sello-del-juego`, antes de medir. Cualquier cambio bajo `public/` lo exige.

## 5. Preguntas del Soberano · cerradas por decreto (2026-10-28)

1. **Chatbot:** **LOCAL en cliente.** El remoto queda diferido como pieza propia con FIRMO aparte. Consume PR #363 (terminal de chat), no lo duplica.
2. **«Cabaña del Tutorial»:** **es el terreno del tutorial en el mapa.** Su interior reutiliza `en301_tutorial*` (`public/game/en301_tutorial*.js`). Nada inventado.
3. **`basic.html`:** **RETIRADA con redirección.** No es terreno del decreto.
4. **Redirecciones §4:** **APROBADAS**, con la corrección de `/play/` → `/openworld/`.

Las dirimencias de la Mesa (§0.1) quedan **ratificadas** por este decreto.

## 6. Plan de PRs, pieza por pieza (draft)

Cada PR es un bloque, con su propia FIRMO. Ninguno se fusiona ni se despliega sin la Mesa y el HITL del Soberano.

| # | PR | Alcance | Gate |
|---|---|---|---|
| 0 | **este** (docs, REQUIERE_FIRMA) | propuesta de corte | revisión de la Mesa |
| 1 | INTRO (draft) | `public/index.html` + `pwa.js` reuso + Tools | `test_web.py`, `arnes_sw.mjs`, sello si cambia `public/` |
| 2 | OPENWORLD (draft) | mapa + terrenos como datos + chat (según §5.1) | `atlas/test_atlas.py`, casos node, sello |
| 3 | redirecciones (draft) | §4, sin borrado | comprobación de enlaces |

Cada PR de código se enseña **en rojo antes de verde** (regla de la Mesa) y pasa el sello según `sello-del-juego`.

## 7. Sugerencias (coste S/M/L)

- **S:** cerrar §5 antes de abrir el primer PR de código. Evita reescribir la INTRO dos veces.
- **S:** medir el tamaño de cada ficha nueva en el worktree, no suponerlo; `bubble_language.js` ya está sobre el techo si se carga entera.
- **M:** unificar `face/index.html` (índice de mundos) con la INTRO para que haya una sola puerta, no dos.
- **M:** mover `Tools of this product` a la INTRO y retirar el bloque oculto de cada página de mundo.
- **L:** traer el LIBRO de firmas a este checkout para poder contrastar decretos antes de proponer.
