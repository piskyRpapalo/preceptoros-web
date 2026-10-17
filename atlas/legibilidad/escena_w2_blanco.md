# Blanco de cotejo · escena W2 · lo que midió el ojo

Escena cerrada: 412 px de ancho, fondo papel. Tres átomos de `public/game/comic_atoms.js`, fotogramas t = 0, 4, 8, 16 (ciclos).
Fuente: captura en navegador headless (perfil limpio) + hash de píxeles por fotograma. Lectura del rack: se puntúa contra este texto.

## Elementos (de arriba abajo, de izquierda a derecha)
1. **stamp** en (10, 10), 220×48: caja de papel, borde de tinta grueso (3,5), sombra dura de tinta abajo a la derecha; franja izquierda de 8 px en color de sello LIVE; texto en tinta «LIVE · reef live».
2. **chip** en (200, 150): caja de papel más fina (borde 2,5, sombra 2,5); franja izquierda en color de sello STALE; texto «STALE · 3 cycles». No late.
3. **badge** con centro en (190, 104), radio 24: círculo relleno del color de sello FIRMADO, borde de tinta, sombra dura; número «7» en tinta en el centro; la palabra «FIRMADO» en tinta, debajo del círculo y fuera de él.

## Colores (por nombre, nunca hex)
paper (fondo de cajas) · ink (bordes, sombras, texto) · LIVE.base (franja del stamp) · STALE.base (franja del chip) · FIRMADO.base (relleno del badge). Ningún otro color pintado.

## Qué cambia entre fotogramas
- Solo cambia la **sombra del stamp LIVE** (latido de periodo 16): desplazamiento horizontal de la sombra t0 = 5,5 · t4 = 4,0 · t8 = 2,5 · t16 = 5,5.
- t16 es idéntico a t0 (hash de píxeles igual); t8 es el extremo opuesto.
- chip y badge: idénticos en los cuatro fotogramas.
- Con movimiento reducido: la sombra queda fija en 4 y los cuatro fotogramas son iguales.

## Sello y sonido
- Sellos visibles con su palabra: LIVE, STALE, FIRMADO (color siempre con texto).
- Sonido: ninguno. Cada átomo declara `NO_DATA` con causa «no audio contract yet». Silencio declarado, no decorativo.

## Rúbrica del ojo (1-10)
gancho 7 · legibilidad móvil 8 · movimiento 8 · variedad 8 · fidelidad cómic 9 · sincronía sonora NO_DATA (sin contrato de audio).

## Errata del ojo (cotejo con los parámetros, 2026-10-17)
El ojo describió la sombra del stamp LIVE como «desplazamiento horizontal». Los parámetros (`escena_w2_fotogramas.json`, campo `sh`) muestran que el desplazamiento es **diagonal**, con x e y iguales: [5,5, 5,5] → [4, 4] → [2,5, 2,5] → [5,5, 5,5]. Los valores coinciden; el eje no. Primer acierto del test: el lector de parámetros corrigió al ojo.
