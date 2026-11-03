# JOYAS · matemáticas bonitas que valen pieza (colección viva)

Encargo de la Mesa TF (2026-11-03, punto 4), con dos vías:
- **(a)** Claude colecciona leyendo el pasado y midiendo lo que ya funciona;
- **(b)** Hexelion, el oráculo, lee decretos y planos cuando el aula despierte.

Cada joya lleva:
- **dónde vive**;
- **la fórmula**;
- **lo medido**;
- **la pieza más simple** que la hace visible.

Ninguna pide `Math.random` ni `Date`: todo sale del tic, de la clave o de enteros (ley de determinismo).

Orden: la joya más simple y más viva primero. Este fichero solo crece por abajo. Lo que se construya se marca **HECHA** con su PR.

## Vía (a) · coleccionadas por Claude, medidas el 2026-11-03

### J1 · El hexágono entero que mira a 25,66° (YA VIVE; es la base de las proporciones)
- **Dónde:** `public/game/hex_projection.js`: `x = 48q`, `y = 12q + 24r`. El giro está en `map_zoom.js`: `SQUASH = √3/4`.
- **Lo bonito:**
  - Un hexágono regular de lado 32 tiene sus vecinos en (48, 27,71) y (0, 55,43).
  - Las cifras enteras 12 y 24 son esos mismos vecinos aplastados por **0,4330 = √3/4**, exactamente el `SQUASH` del giro.
  - Por eso el suelo y la rotación cuadran sin inventar nada: es un hexágono de verdad, visto en ortográfica desde **asin(√3/4) = 25,66°** de elevación.
  - La proyección es exacta y sin coma flotante, en enteros puros.
- **Medido:** 12/(√3/2·32) = 0,4330, y √3/4 = 0,4330.
- **Pieza simple:** ninguna, es suelo firme. Es la vara contra la que se miden las proporciones nuevas (J2).

### J2 · La burbuja que respira en la proporción del suelo (candidata de la Mesa)
- **Dónde:** la burbuja de nodo mide 320×96 (10:3, «chatísima», según la medida de la Mesa).
- **Lo bonito:** una losa cuadrada tendida en ese suelo se ve como **w × w·√3/4**. A 320 de ancho serían 139 de alto, no 96: hoy la burbuja está un 31 % más aplastada que el suelo que pisa. En la misma métrica del hex deja de ser una pegatina y pasa a parecer una losa del mismo mundo.
- **Respirar:** una escala `1 + a·sin(2π·tic/240)`, con `a` muy pequeño (≤ 0,02), fase desplazada por la clave del nodo. Así no respiran todas a la vez.
- **Pieza simple:** medir primero cuánto ocupa cada burbuja a 390 px (lectura ≥ 12 px CSS). Después, una sola constante de proporción y la respiración apagada con `prefers-reduced-motion`.

### J3 · El día sin aristas: de triángulo a coseno (palette_cycle)
- **Dónde:** `public/game/palette_cycle.js`: `CYCLE 240`, y `tri = f < 120 ? f : 240 − f`.
- **Lo bonito:** hoy el cielo va de noche a día en **triángulo**. Tiene un pico seco a mediodía y a medianoche, y la luz cambia a velocidad constante. Con `(1 − cos(2π f/240))/2` el amanecer y el atardecer se frenan solos, como un día de verdad.
- **Ley:** puros enteros, con una tabla de 241 valores en milésimas precalculada (la tabla es la ley y no hay `Math.cos` en caliente). Sale un fotograma Acho < 1.024 B.
- **Pieza simple (S):** sustituir `tri` por la tabla. Prueba: los 240 tics dan valores en [0, 1000], con la derivada en el tic 0 y en el 120 igual a 0 (rojo con el triángulo).

### J4 · La marea de dos trenes (map_painter)
- **Dónde:** `public/game/map_painter.js:74`: `amp·sin((2c₀ + 3c₁ + wt/8)/len)`, con `SEA = {amp 2, len 5}`.
- **Lo bonito:** hoy hay **un** tren de olas con vector (2, 3), un oleaje diagonal limpio. Si se suma un segundo tren con el vector primo entre sí y ortogonal **(3, −2)**, a otra velocidad, aparecen **batidos**: zonas que se calman y zonas que se encrespan, y se desplazan. Eso es una marea, y sale gratis de la interferencia.
- **Pieza simple (S):** segundo término con `amp/2`, redondeado a décimas como el primero. Prueba: la varianza de altura por fila deja de ser constante (rojo con un solo tren).

### J5 · Respiración desafinada de los armónicos (wave_render)
- **Dónde:** `public/game/wave_render.js:190`: `1 + 0,05·sin(0,0011·t·(j+1) + 1,7·j)`.
- **Lo bonito:** cada armónico respira a su frecuencia (j+1) con su fase 1,7·j. 1,7 rad está cerca del ángulo áureo (2,39 rad) sin serlo. Con el ángulo áureo exacto, las fases no se alinean nunca: la onda jamás vuelve a «respirar en bloque».
- **Pieza simple (S):** fase `j·2,39996` (2π/φ²). Prueba: en 10.000 tics, ninguna pareja de armónicos coincide en fase por debajo de 0,05 rad más de N veces.

### J6 · La onda nace armónico a armónico (summon_reveal, YA VIVE)
- **Dónde:** `public/game/summon_reveal.js`. Easing `1 − (1 − u)³`, y al llegar, un rebote amortiguado `0,02·sin(30(k − 0,8))·(1 − k)`.
- **Lo bonito:** la serie de Fourier de la tropa (`[k, ax, ay, fase]`) se construye a la vista, y el trazo se asienta como una cuerda. Es la firma de la casa: **los personajes son ondas**.
- **Pieza simple:** reusar ese nacimiento para el **sello LIVE** del mapa cuando un nodo despierta (hoy se estampa de golpe).

### J7 · La inercia de freno geométrico (map_drag, web#606)
- **Dónde:** `public/game/map_drag.js`: `FRENO 0,9` por fotograma.
- **Lo bonito:** el recorrido total del deslizamiento tiene forma cerrada, `v·0,9/(1 − 0,9) = 9v`. Se sabe dónde se parará el mapa en el instante en que se levanta el dedo, así que se puede **anunciar** antes de que llegue (J1 de accesibilidad: coordenada sin esperar).
- **Pieza simple:** que `say()` dé el destino final al levantar el dedo, no el intermedio.

### J8 · El emblema que sale de la clave (ley de la casa, a extender)
- **Dónde:** CLAUDE.md: «el emblema de cada nodo sale de su clave pública».
- **Lo bonito:** 32 bytes de clave dan 8 armónicos `[k, ax, ay, fase]` enteros. El contorno de la burbuja del nodo **es** su firma, la misma clave dibujada como epiciclo cerrado: sin imagen y sin sprite.
- **Pieza simple (M):** el borde de la burbuja (J2) trazado con 3 armónicos de la clave, ±2 px. Se reconoce de lejos y no añade texto.

## Vía (b) · lecturas encargadas a Hexelion (pendientes: el aula duerme)

Estado: **NO_DATA**. Causa: la conexión del aula a onexstation (`127.0.0.1:21434/v1`) y la `AULA_API_KEY` están en manos del Soberano. Con ellas puestas, cada lectura va por `/api/v1/chat`: CIEF < 1 KiB y burbuja < 1.024 B. Por eso cada pregunta es pequeña:

1. «Given a hex floor seen at 25.66° (squash √3/4), what width:height should a label plate have to read as part of the floor?» (J2)
2. «Two integer wave vectors on a hex lattice for a tide with visible beats, both under 5?» (J4)
3. «A closed curve from 32 bytes: which 3 harmonics make it most recognisable at 48 px?» (J8)

La respuesta del oráculo entra aquí, citada con su tic y su hash de burbuja. **Aconseja; no firma.**

## Orden propuesto (el más simple y vivo primero)

1. J3, el día sin aristas: S, una tabla, se ve en todo el mapa.
2. J4, la marea de dos trenes: S, una línea, se ve en todo el mar.
3. J2, la burbuja en proporción y que respira: M, la candidata de la Mesa.
4. J8, el borde-firma.

J5, J6 y J7 son de pulido.

## Medido al construir (2026-11-03, tarde): lo que la medida corrigió

- **J4, la marea: la teoría estaba MAL y la pieza no se siente.**
  - Dos trenes **ortogonales** (3, −2) no baten. El batido sale tan corto como la ola: el rango de cresta por ventana de 6×6 es **0,20**. Los batidos salen de trenes **cercanos**: (2, 3) + (3, 2), cuya diferencia (1, −1) da batidos de ~22 celdas, con un rango de **1,50** y crestas acotadas en 3.
  - El código está en la rama `claude/joya-marea-20261103` (f419593e). La prueba sale roja con un tren y verde con dos.
  - Pero **en el Doogee el mar está horneado en reposo** (`mode: baked`, `still: true`): la ola solo se pinta durante un giro. Forzando el modo vivo, el mapa cambia un **0,15 %** de píxeles en 3 s, porque la ola mueve 1–3 px. **No mueve el ojo.**
  - Para que se vea haría falta una capa de agua viva sobre los chunks horneados, con los fps medidos en el Doogee: es una pieza M aparte. Se queda como base, sin PR de función.
- **J3, el día sin aristas: sí se vería, pero despacio.** La página avanza el tic 1 por segundo (`openworld_page.js` `cycle()`, medido en el Doogee: t de 8 a 11 en 3 s). El ciclo de 240 tics dura 4 minutos, así que el pico del triángulo (mediodía y medianoche) cae una vez cada 2 minutos.
- **Hallazgo de la vista previa:** un service worker viejo en un puerto reciclado sirvió un `map_zoom.js` antiguo (`AtlasMapZoom.create is not a function`) y la página no arrancó su ciclo. Es justo el fallo de primera carga que cura la pieza M (web#603).

### Orden corregido
1. **J2**, la burbuja en la proporción del suelo: la candidata de la Mesa. Está siempre en pantalla y no depende del tic.
2. **J7**, el destino de la inercia anunciado: es de LA MANO (#606) y cuesta S.
3. **J3**, el día sin aristas: S, se ve en minutos.
4. **J8**, el borde-firma.
5. **J4**, la marea: M, necesita la capa de agua viva con fps medidos.

Agent: claude-code · Model: claude-opus-5-5
