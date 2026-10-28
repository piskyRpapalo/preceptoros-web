# Norte 7 · tarjetas propose-only del mapa (OpenWorld)

Estado: PROPUESTA. Una tarjeta por pieza, cada una con su FIRMO. Ninguna toca `public/`.
Orden de cola: T1 → T2 → T3 → T4, una a la vez (FIRMO por pieza). Referencia: Bot Crossing
(Station-Sciences/bot-crossing, MIT) para la **disciplina de medidas** y el patrón de bot-thread;
**no** su motor (decreto isométrico 2:1 vigente) ni su identidad (fuera de límites).

Vara del ojo (aviso del Soberano, no lista de trabajo):
[1] proporción personaje/entorno · [2] crecer es altura, no anchura · [3] nada se solapa sin intención ·
[4] lo que el ojo sigue no encoge · [5] siempre legible.

Leyes que cada tarjeta conserva: bubble/1 (`docs/bubble-language.md`), cuadros ≤1.024 B, tope vigente de 25 MiB
por bloque (firma D2 2026-10-11; el 16 KiB revocado), determinismo (sin `Math.random` ni `Date.now`), offline,
0 peticiones externas, proyección isométrica 2:1 (`odd/tasks/isometric-colony.md`; el nombre «colony-projection/1»
no aparece en el repo: NO_DATA), tres colores, EN 301 549 con cuatro canales, movimiento reducido, SCRUB, NO_DATA con causa.

## Hallazgo de orden (cambia la cola propuesta)

T1 (colisión) **no tiene objeto hoy**: en OpenWorld no hay ningún cuerpo que se mueva. Los nodos son marcos fijos
(`public/game/global_map.js:22-26`) y la cabaña es fija. La colisión solo se puede probar con un cuerpo móvil, que es
T4. Propongo **T4 primero como fixture** (el cuerpo) y T1 después sobre ese cuerpo. El Soberano pidió el orden T1→T4;
lo señalo como decisión suya, no lo cambio.

## Tarjetas

- `T1-keepout-radio.md` · cierra [3]
- `T2-altura-log.md` · cierra [2]
- `T3-nombres-pantalla.md` · cierra [4] y [5]
- `T4-preceptores-personajes.md` · cierra [1] (la joya)
