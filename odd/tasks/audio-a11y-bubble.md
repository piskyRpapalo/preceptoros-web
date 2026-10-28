# AUDIO-A11Y-BUBBLE · sonificación del tronco de burbujas (NORTE 8 · mandato 3)

## Objetivo
El mundo audible que la ley A11Y ya promete: un fotograma de burbuja suena de forma determinista, con la escala
del juego, y se puede usar con teclado y con lector de pantalla. Sin red, sin azar, por debajo de 16 KiB por pieza.

## Hallazgo previo (búsqueda en el corpus, no inventado)
- `docs/bubble-visual-audio-contract.md` (LF-2, medido 2026-10-24) dice textualmente: «No shared Bubble-frame audio
  player traced». **No existe un reproductor compartido de fotogramas de burbuja.** Este feature lo crea.
- La escala ya existe en `public/game/core.js` (líneas 55-61): `PENTA_V = [0, 2, 4, 7, 9]` y el portador de 110 Hz,
  `Math.round(110 * 2^((PENTA_V[g%5] + 12*floor(g/5))/12))`. Se reutiliza: no se inventa una escala nueva.
- `aiact-art50-state-radio.js` usa otra base (220 Hz) para la radio. No es esta escala; no se mezcla.

## Alcance y rebanadas
- **Rebanada 1 (este PR):** núcleo puro `atlas/puros/bubble_sonify.js` (fuera de `public/`, como el validador del
  genoma), con casos y test de deriva contra `core.js`.
- **Rebanada 2 (pendiente):** cablear el núcleo en una página servida, con controles de teclado y etiquetas para
  lector de pantalla. Eso toca `public/` y lleva sello SW en el mismo commit. Se hace en su PR.

## Restricciones
- Determinismo: sin `Math.random`, sin `Date`, sin red. Comprobado en el test sobre el código (no sobre los comentarios).
- Ficha < 16 KiB (comprobado por el test).
- Vanilla JS, sin dependencias. Funciona como módulo de Node y como global del navegador (UMD).

## Checklist
- [x] AA1 · núcleo `sonifica()` y `hzDeGrado()`: mismas constantes que `core.js`.
- [x] AA2 · test de deriva: la escala del núcleo coincide con la de `core.js` en los grados 0-14.
- [x] AA3 · sabotaje en casos: cambiar el portador o `PENTA_V` en una copia de `core.js` → deriva detectada.
- [x] AA4 · sabotaje en el árbol real: `PORTADOR_HZ` 110 → 111 en el núcleo → 3 tests rojos; revertido → 9/9 verdes.
- [x] AA5 · fallo cerrado: clase desconocida o sin átomos → `ok: false` con causa (nada de sonido inventado).
- [x] AA6 · determinismo, orden temporal, tamaño < 16 KiB, sin azar/reloj/red.
- [ ] AA7 · cableado en página servida (rebanada 2).
- [ ] AA8 · controles de teclado (Enter/Espacio) y etiquetas `aria` para lector de pantalla (rebanada 2).
- [ ] AA9 · prueba en navegador real: sonido solo tras un gesto del usuario, cero peticiones externas (rebanada 2).

## Evidencia
- `node --test atlas/puros/bubble_sonify_casos.mjs` → 9/9 (rebanada 1).
- Sabotaje real: `PORTADOR_HZ = 111` → `not ok` en 3 casos (deriva y `hzDeGrado`), revertido → 9/9.

## Registro de decisiones (modo desatendido)
- 2026-10-28 · Base `origin/main` ed76a53. Rama `haiku/audio-a11y-20261028`.
- 2026-10-28 · Se mantiene fuera de `public/` en la rebanada 1. Motivo: un archivo servido sin página que lo cargue
  es huérfano y `test_web` lo rechaza. Cablearlo es la rebanada 2, con su sello.
- 2026-10-28 · Propuesta de doctrina (toca INTANGIBLE, se propone y espera): «cada escala sonora de la web se prueba
  contra su fuente (test de deriva), no contra una copia».

## Siguiente paso
Rebanada 2: página y controles, con sello SW en el mismo commit.
