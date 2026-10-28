# PRECEPTOR-CODER · dibujos en lenguaje de burbujas para la web y la app (comisión 2026-10-28)

## Objetivo
Un CLI que convierte fotogramas `preceptoros.bubble/1` en SVG que la web y la app pueden dibujar. Hoy hay laboratorio,
web y app, y no hay dibujos. El CLI es el creador.

## Alcance (slice 1)
- `tools/preceptor-coder/bin/preceptor-coder.mjs`: `draw` (fotograma → SVG), `check` (la ley), `measure` (bytes y conteo).
- `tools/preceptor-coder/frames/cabin.json`: el fotograma de la cabaña del tutorial, como ejemplo.
- Casos: 6/6, con sabotaje de frase vacía y de fotograma sobredimensionado.
- Sin dependencias: usa el compilador de `public/game/bubble_language.js`, el mismo de la web.

## Medido (honesto)
- La cabaña dibujada ocupa **19.462 bytes de SVG** y 219 operaciones. **Supera el techo de pieza de 16 KiB.** Dos
  decisiones quedan para el Sovereign: qué operaciones se pueden quitar, o si el techo se aplica al fotograma y no al SVG.
- Las letras se pintan con círculos por glifo. Un texto largo dispara el conteo de operaciones (en la prueba,
  31.761 operaciones con dos palabras). Un texto largo no cabe en un dibujo pequeño.
- Nada se oculta: las operaciones que el pintor no conozca se cuentan y se avisan, no se descartan en silencio.

## Checklist
- [x] PC1 · `check` aplica la ley del fotograma.
- [x] PC2 · `draw` produce SVG determinista, con las frases del fotograma como etiqueta.
- [x] PC3 · `measure` informa bytes y conteo; el tamaño por encima de 16 KiB queda declarado.
- [x] PC4 · sabotaje de frase vacía y de fotograma sobredimensionado → rechazados por la ley.
- [ ] PC5 · edificios del mundo abierto (skyline, interiores, lore): pendientes de decisión visual del Sovereign.
- [ ] PC6 · reducir el SVG de la cabaña bajo 16 KiB: decisión (qué operaciones se quitan).

## Registro
- 2026-10-28 · Base `origin/main` 92d4515. Rama `haiku/preceptor-coder-20261028`.
- 2026-10-28 · El CLI no toca `public/`: no lleva sello. Los dibujos que se sirvan en la web irán en su propio PR con sello.
