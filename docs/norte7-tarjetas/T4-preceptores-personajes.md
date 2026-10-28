# T4 · preceptores como personajes bubble en OpenWorld (la joya)

**Slug FIRMO:** `NORTE7-T4-PRECEPTORES-PERSONAJES`
**Estado:** FIRMADO por el Soberano («firmo. siguiente. vamos all in!»). Orden: T4 primero como fixture, luego T1 → T2 → T3.
**Dictado de decisiones:** web#387, comentario 6480922688.
**Cierra:** [1] proporción personaje/entorno (y es el cuerpo que hace probable el keep-out de T1).

## Dictado (decisiones firmadas)

- Conteo: carriles vivos. Hoy tres: Mesa, Luna, Claude.
- El «?» es un estado de la tabla («HITL»), con el mismo pipeline de hash que los demás estados.
- Posición: la decide el carril, de forma determinista, a partir de su estado registrado. Nunca en vivo.
- Hexelion es la figura del orquestador, no un canal de control en vivo ni un cuerpo que camina.

## Fixture (no es produccion; no se sirve)

Fichero: `atlas/fixtures/t4_caminante.mjs`. Casos: `atlas/t4_caminante_casos.mjs` (12/12).

- Destino de cada epoca (32 ticks) = hash canon(carril, estado, epoca) modulo la rejilla 7x5. Lee
  `public/game/bb_canon.js` en solo lectura; no toca `public/`.
- Un paso por tick, eje x primero. Un carril ocupa su celda; ningun par la comparte.
- Un carril sin estado registrado queda congelado y se muestra como NO_DATA con causa.

## Evidencia medida (500 ticks, tres carriles, rejilla 7x5)

| Carril | Celdas distintas visitadas | Mayor tiempo quieto (ticks) |
|---|---:|---:|
| Mesa | 26 de 35 | 62 |
| Luna | 30 de 35 | 61 |
| Claude | 28 de 35 | 30 |

- Ningun solape en 500 ticks; ningun salto de mas de una celda; nadie sale de la rejilla.
- Proporcion cuerpo/celda: 24 / 56 = 0.429 (rango legible 0.25–0.5).
- Hallazgo: los tiempos quietos de 61–62 ticks superan la epoca (32). Es espera detras de otro carril (bloqueo), no un
  fallo de destino. Pregunta de diseno: ¿se permite desviar o se acepta la espera?

## Vara del ojo que cierra

[1] proporcion personaje/entorno: 0.429 de la celda, medido. Un cuerpo se lee pequeño pero no perdido.

## Leyes que mantiene

bubble/1 · cuadros ≤1.024 B por cuerpo · determinismo (sin azar del sistema ni reloj; el azar sale del hash canon) ·
offline · 0 peticiones · tres colores · EN 301 549 con cuatro canales · reduced-motion (el paso por celdas no exige
animacion) · SCRUB: los personajes se llaman por su carril, no por una identidad externa · NO_DATA con causa.

## NO_DATA declarado

- Patron bot-thread de Bot Crossing: referencia externa, no leida en esta sesion; sin copiar identidad, nombres, sprites ni textos.
- Render del cuerpo y del sello: no hay dibujo; el fixture solo calcula posiciones y estados.
- HITL como estado de la tabla: la fila «HITL» no existe aun en `tabla_semantica.js`. Se anadira como extension aditiva en el
  pase de cableado, nunca en esta fixture.

## Pendiente para el pase de cableado

- La forma visual del «?» (hoy: forma propuesta `question`, no dibujada).
- Si el bloqueo de 61–62 ticks se acepta o se resuelve con desvio.
