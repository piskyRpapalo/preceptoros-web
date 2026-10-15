# T1 · Zoom de pellizco determinista · Protocolo de re-medida y cierre

FIRMO del Soberano: 15-oct (noche), pieza (a) del PR #106. La pieza de código ya vive en main (`public/game/map_zoom.js`); este documento define cómo se re-mide y se cierra. La ejecución física es de Codex o del Soberano (Mistral: NO_DATA, sin dispositivo en sesión).

## 1 · Qué se mide (contrato de la pieza, MEDIDO en el repo)

`map_zoom.js` expone `AtlasMapZoom.crea(canvas)` con factor 1.00 por defecto, clamp [0.6, 3.0], y anota cada cambio en `data-zoom` del lienzo. El gesto solo fija un número: sin red, sin azar, sin reloj. Dos entradas:
- **Pellizco táctil** (dos punteros): factor = zm0 · (d/d0), razón de distancias euclídeas.
- **Rueda sin Ctrl** (puntero): factor = zm · exp(−deltaY · 0.0015). Ctrl+rueda NO se toma (el navegador hace su zoom de página).

## 2 · Protocolo de re-medida (pasos, dispositivo Doogee/beelink)

1. Abrir el mapa del juego con la consola CDP conectada (o `data-zoom` visible en el inspector del lienzo).
2. **Caso P1 (pellizco abrir):** partir de factor 1.00; separar dos dedos hasta el límite cómodo; leer `data-zoom`. Esperado: sube monótonamente hasta 3.00 máximo (histórico medido: 2.75 al separar, 3.00 al máximo, PARA_LA_MESA.md 13-oct).
3. **Caso P2 (pellizco cerrar):** partir de 3.00; juntar dos dedos; leer `data-zoom`. Esperado: baja monótonamente hasta 0.60 mínimo.
4. **Caso R1 (rueda):** rueda hacia atrás 5 pasos; leer `data-zoom`. Esperado: factor crece geométrico (exp), clamp en 3.00.
5. **Caso R2 (Ctrl+rueda):** repetir con Ctrl pulsado; esperar que `data-zoom` NO cambie (el navegador hace su zoom de página).
6. **Caso D (determinismo):** repetir P1 tres veces en la misma sesión; las tres lecturas deben caer dentro de ±0.05 del mismo valor si el gesto es similar, o documentar la diferencia de gesto. Mismo gesto = mismo factor: sin azar.
7. Anotar: fecha, dispositivo, navegador, ciclos de juego si aplica, y las lecturas crudas de `data-zoom` — sin redondear a bonito.

## 3 · Criterio de cierre (gate)

T1 queda CERRADO cuando: P1, P2, R1, R2 y D tienen lecturas anotadas con sello MEDIDO, o NO_DATA con causa explícita (p. ej. «Doogee no conectado esta sesión»). Una lectura sin sello no cierra nada. El cierre se registra como recibo en el PR de esta pieza; el ledger manda.

## 4 · Gates lógicos (los que SÍ puedo ejecutar aquí)

- `tests/map_zoom.test.mjs` (n=2 pasadas, node --test):
  - clamp: factores pedidos fuera de rango quedan en 0.6/3.0;
  - monotonía: separar siempre sube, juntar siempre baja;
  - sabotaje ROJO antes de verde: un `fija()` sin clamp debe poner la suite roja, y se demuestra rompiéndolo a propósito y viéndolo fallar.

## 5 · Sellos

- MEDIDO (repo, hoy): constantes MIN=0.6/MAX=3 y `data-zoom` presentes en map_zoom.js; historic Doogee en PARA_LA_MESA.md.
- NO_DATA (causa): la re-medida física del §2 no es ejecutable desde esta sesión (sin dispositivo); la ejecutan Codex o el Soberano y sus lecturas cierran el §3.
