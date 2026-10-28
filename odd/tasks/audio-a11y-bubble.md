# AUDIO-A11Y-BUBBLE · sonido nativo del fotograma de burbuja (NORTE 8 · mandato 3)

## Objetivo
El mundo audible que la ley A11Y promete, **nativo del lenguaje**: un fotograma de burbuja suena con sus propios
armónicos, con la receta de sonido del juego, de forma determinista. Lo que no suena lo dice con su causa.
Teclado y lector de pantalla en la página (rebanada 2).

## Decisión de diseño (corregida por el Soberano, 2026-10-28)
La primera versión de esta rebanada (commit `73bab0a`) inventaba un mapeo clase de átomo → nota. **Estaba mal:** el
audio vive dentro del lenguaje. Esta versión lo reemplaza. Fuentes, todas en el repo:
- `docs/bubble-language.md` §2: el fotograma declara `sound` y `soundCause`; el lector responde «qué suena» desde el
  fotograma. §3: los primitivos `wave` y `blob` llevan `h: [[k, ax, ay, ph], …]`.
- `atlas/param_gate.mjs` (línea 75): el contrato compartido de `sound` es `ok` o `NO_DATA: causa`.
- `public/game/core.js`, `vozDe(t)` (líneas 56-70): de `armonicos` a receta de sonido. El 2.º armónico fija el grado
  de la escala (portador 110 Hz, `PENTA_V`); el resto fija la modulación. Mismo formato `[k, ax, ay, ph]`.
- `docs/bubble-visual-audio-contract.md` (LF-2, 2026-10-24) decía «no shared Bubble-frame audio player». Esa
  ausencia es lo que esta rebanada cubre con la receta nativa, no con un reproductor paralelo.

## Fuera de esta rebanada (declarado, no inventado)
- **Transición worm** (`public/assets/worm_transition.js`): el gusano es **estado** (`ciclo`, `intentos`, `sello`,
  progreso del scroll), dibujado como círculos sobre una curva `neck`. Su sonido no se decide aquí: se
  sonificará desde su estado en la rebanada 2, si el canon lo pide.
- **Círculos** (primitivo `bubbles`, `circle` de `comic_atoms.js`): mismo criterio. No tienen receta de sonido
  declarada; su sonido queda `NO_DATA` con causa hasta que el canon la fije.
- **Audio de habilidad** (`audio_feedback_manager.js`, base 220 Hz): otra escala, otro uso. No se mezcla.

## Alcance
- **Rebanada 1 (PR #371, sin fusionar):** núcleo puro `atlas/puros/bubble_sonify.js`, fuera de `public/`.
  `receta(armonicos)` replica `vozDe` de core.js; `sonifica(fotograma)` devuelve las voces de las ondas y blobs
  con armónicos, o `ok: false` con causa.
- **Rebanada 2 (este PR, base `origin/main` adca0ab, #367 ya fusionado y en vivo):** el módulo pasa a
  `public/game/bubble_sonify.js` y se cablea en `/openworld/`, con botón, región `aria-live` y sello SW en el mismo commit.

## Restricciones
- Determinismo: sin `Math.random`, `Date` ni red (comprobado sobre el código, no sobre los comentarios).
- Ficha < 16 KiB (comprobado).
- Vanilla JS. Funciona como módulo de Node y como global del navegador (UMD).

## Checklist
- [x] AA1 · `receta(armonicos)`, réplica de `vozDe` de core.js.
- [x] AA2 · test de deriva: extrae la función `vozDe` **del texto de core.js** y la ejecuta sobre 6 tablas
      (incluida una con el grado 4 de `PENTA_V`), comparando con `receta()`.
- [x] AA3 · sabotaje en copia de core.js: cambiar la modulación (`8 + a1` → `9 + a1`) y `PENTA_V` → deriva detectada.
- [x] AA4 · sabotaje en el árbol real: `PENTA_V` del núcleo modificado → 2 tests rojos; restaurado → 9/9.
- [x] AA5 · `sound: NO_DATA: causa` del fotograma → silencio con su causa.
- [x] AA6 · fallo cerrado: sin ondas con armónicos, o sin fotograma → `ok: false`.
- [x] AA7 · determinismo, orden temporal, tamaño < 16 KiB, sin azar/reloj/red.
- [x] AA8 · cableado en `/openworld/`: botón (teclado: Enter/Espacio), estado en región `aria-live`.
- [x] AA9 · navegador real: el módulo no existe en la página antes del clic; el clic dice `NO_DATA` con su causa (la cabaña no declara ondas); cero peticiones externas; sin errores.
- [ ] AA10 · sonido del gusano (worm) y de los círculos: pendiente de canon (ver «Fuera de esta rebanada»).

## Evidencia
- `node --test atlas/puros/bubble_sonify_casos.mjs` → 9/9.
- Sabotaje real: `PENTA_V` [0,2,4,7,9] → [0,2,4,7,11] en el núcleo → 2 tests rojos; restaurado → 9/9.

## Registro de decisiones (modo desatendido)
- 2026-10-28 · Base `origin/main` ed76a53. Rama `haiku/audio-a11y-20261028`.
- 2026-10-28 · **Corrección de diseño:** el commit `73bab0a` mapeaba clases de átomo a notas. Se sustituye por la
  receta nativa de `vozDe` sobre los `h` de cada onda. Motivo: el Soberano indicó que el audio vive nativo en el
  lenguaje. El commit anterior queda en el historial, sin reescribirlo.
- 2026-10-28 · Se mantiene fuera de `public/` en la rebanada 1: un archivo servido sin página es huérfano y `test_web` lo rechaza.
- 2026-10-28 · Propuesta de doctrina (INTANGIBLE, se propone y espera): «el sonido de una pieza sale de sus armónicos,
  por la receta del juego, nunca de un mapeo paralelo».

- 2026-10-28 · **Respuestas del Soberano (cierran los cuatro puntos):** rutas viejas por tabla 301 en el Worker (infra,
  con HITL y FIRMO); identificadores de API en inglés por fases, con sus consumidores; rebanada 2 en `/openworld/`, con
  #367 ya fusionado; gusano y círculos sin receta de sonido en el canon: `NO_DATA` con causa, estado lícito.
- 2026-10-28 · **Identificadores en inglés en lo que toco:** `public/game/bubble_sonify.js` y `public/openworld/index.html`
  se renombran por completo (map, cabin, alive, render, draw, listen, state, log, question…). Las claves de `core.js`
  (`tipo`, `portadora`, `indice`…) no se tocan: la deriva las traduce en el test.
- 2026-10-28 · **Carga a demanda:** el módulo entra en el precache? **No.** La regla «a demanda» de `test_atlas` lo
  prohíbe. La página lo carga al primer clic. Se declara como dependencia de OpenWorld en `test_atlas`.
- 2026-10-28 · **Versión del SW:** se conserva `VERSION` (`preceptoros-2026-17-abjz`) por la ley de `sello-del-juego`.
  Riesgo declarado: `sw.js` no cambia en bytes, así que una pestaña ya instalada no recibe la nueva lista del precache
  hasta que `VERSION` suba. El módulo a demanda se pide por red en el primer clic, así que el riesgo es solo offline.
  Decisión del Soberano: subir `VERSION` o no.
- 2026-10-28 · Gusano y círculos: fuera de esta rebanada (`NO_DATA` lícito; la propuesta del gusano por estado queda registrada).

## Siguiente paso
Fusión de la rebanada 2 por la Mesa (FIRMO). Después: sonido del gusano y de los círculos solo si el canon lo decreta.
