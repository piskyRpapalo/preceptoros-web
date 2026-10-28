# T1 · radio de respeto por interactivo (keep-out)

**Slug FIRMO propuesto:** `NORTE7-T1-KEEPOUT`
**Cierra:** [3] nada se solapa sin intención.
**Depende de:** un cuerpo móvil (T4). Sin él no hay qué empujar.

## Evidencia medida (origin/main a9a6d31)

- Los nodos tienen posición de rejilla fija: `public/game/global_map.js:22-26` (`reco: [0,0]`, `[-2,1]`, `[2,-1]`).
  Separación por diseño, no por colisión.
- No existe ninguna colisión ni radio: `git grep -i -E "colision|collision|keep.?out|radio.*(edificio|beacon)"` sobre
  `public/game` y `public/openworld` no devuelve nada.
- La cabaña y los nodos son marcos de 320×96 (`global_map.js:12`), no cuerpos con posición libre.
- Patrón `navigation.js` de Bot Crossing: **referencia externa, no leída en esta sesión**. Lo que sigue usa solo el
  patrón tal como lo describe el Soberano (radio por edificio/beacon/rift, separación lateral ≤ un lean). Los detalles
  del patrón original quedan NO_DATA hasta leerlo.

## Propuesta (propose-only)

Cada interactivo declara un **radio de respeto** en unidades de referencia (480×240). Un cuerpo móvil que entra en ese
radio se empuja hacia fuera a lo largo de la normal, y su separación lateral no supera un lean. Todo el cálculo es función
pura de la posición y del tick: sin azar, sin reloj.

## Criterio medible (fixture primero)

- Dado un cuerpo sobre un interactivo, la posición resultante queda fuera del radio, y la distancia no crece en un tick.
- Dos interactivos cercanos: ninguno invade el radio del otro (prueba de propiedad sobre una rejilla de posiciones).
- Un cuerpo que ya está dentro sale en un número acotado de ticks (medido, no supuesto).

## Leyes que mantiene

bubble/1 · cuadros ≤1.024 B (la prueba de separación no genera cuadros) · determinismo · offline · 0 peticiones ·
reduced-motion (el empuje se hace en un tick, sin animación obligatoria; si anima, tiene su versión estática) ·
NO_DATA con causa (interactivo sin radio declarado = NO_DATA, no radio por defecto invisible).

## Decisiones que pido al Soberano

1. ¿El radio se declara por tipo de interactivo o por instancia?
2. ¿Qué pasa con la cabaña: tiene radio o es el origen?
