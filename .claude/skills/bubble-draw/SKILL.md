---
name: bubble-draw
description: Dibujar en la lengua de burbujas (preceptoros.bubble/1) - bandas de paleta, geometria familiar y los criterios medibles del inventario NORTE 5. Usala antes de crear o cambiar cualquier fotograma, skin o dibujo.
---

# Dibujar en `preceptoros.bubble/1`

Especificacion: `docs/bubble-language.md`. Compilador: `public/game/bubble_language.js`.
Criterios medibles: `docs/rebuild/2026-10-26-foundation-inventory.md` (seccion "sounds like Bubble").

## Paleta: solo bandas que existen
- Neutras (`comic_tokens.js`): `ink paper ocean cyan`.
- Acentos firmados (`comic_accents.js`): `vermilion.*`, `comic yellow.*` con `base brillo sombra contorno`.
- Sellos (`tabla_semantica.js`): `LIVE PROPUESTA FIRMADO ERROR NO_DATA SIMULATED STALE` **solo con su significado literal**
  (p. ej. `STALE`/`NO_DATA` para el skin dormido).
- Banda que no existe = `NO_DATA` y propuesta aparte. Jamas inventar un token.

## Geometria familiar
- Primitivas `blob`, `wave` (armonicos bajos), `ribbon`, `arcs`. Sin pinchos, dientes ni grietas dentadas.
- Las palabras del bestiario (`crab`, `star`, `bust`) llevan bandas fijas: para recolorear por skin, componer con primitivas en el fotograma con sus mismas proporciones.
- Skins: misma topologia, mismas coordenadas, mismos ids; solo cambian `f`/`s` y `bands`.

## Medir
- Fotograma <= 1.024 B UTF-8 en **todo** estado alcanzable.
- Geometria normalizada (sin `fill/stroke/shadow`) identica entre skins: `node docs/rebuild/examples/validate.mjs`.
- Contraste de texto >= 4,5:1 por skin. Dianas >= 44 px.
- Sonido: trazar el campo del fotograma hasta la receta FM de `core.js` (`vozDe`), o decir "none". Fase visual != fase de audio (LF-2).
