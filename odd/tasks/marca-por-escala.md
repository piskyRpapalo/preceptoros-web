# The mark draws the face at every scale (UI-COHERENCE-01 · P1)

Commission 2026-11-13, «Identidad única de PreceptorOS»: the Sovereign saw the preceptor emblem right on
DOOGEE and deformed in the WEB browser tab. Diagnose before replacing.

## Explore (measured 2026-11-13, web main c656c54d)

- One source: `atlas/emblem/preceptor_face.txt` (sha e10de8c2…, byte-identical to the APP copy). The APP and
  WEB PNG icons are byte-identical; `--comprobar` IGUAL for all five files. The identity was already one.
- DOOGEE shows `icon-512-maskable.png`: the full bust, large. Right.
- The tab shows `mark.svg`: `svg()` drew the head crop on a 28-cell grid inside a 32-unit viewBox, with four
  ink levels lifted by power 0.6. At 16 px a cell is half a pixel and the lift lights the whole crop evenly:
  the head reads as a block. That is the deformation.
- Yardstick: mean |difference| (0..255) against the same head drawn in true tone by the canonical `lienzo()`
  at the target size. Old mark: 22.7 at 16 px, 31.7 at 32 px (rsvg); Chromium: 26.8 / 38.5 / 38.7 at 16/32/48.

## Implement

- `svg()` writes two grids in one file: 16 cells (8 levels, no lift) and 32 cells (8 levels, lift 0.85), each
  filling the whole tile so one cell is one pixel at 16 and at 32. The SVG's own CSS shows the 16 grid when the
  image is drawn 24 px wide or less, else the 32 grid (a renderer without media support shows the 32 grid).
- One `<path>` per tone instead of one `<rect>` per run: 18,537 B → 8,826 B (gzip 2,003 B).
- Nothing else changes: same source, same PNG icons, same og-card, same `<link rel="icon">` in every page.

## Check

- `test_web.PWA.test_la_marca_dibuja_la_cara_en_cada_escala`: rasterizes each grid as written and compares
  with true tone; ceiling 9.0 (now 6.0 and 5.8). Sabotage: old lift/levels → 21.7 red; no media switch → red.
- Chromium (headless, `<img>` at 16/32/48): 6.9 / 10.0 / 17.0 (old 26.8 / 38.5 / 38.7).

## Log

- 2026-11-13 · `mark.svg` is cached by the service worker (`sw-listas.js:35`): a changed cached file needs a
  new VERSION, and the seal letter is the Mesa's. VERSION is left as main's; `version_sw_gate` is expected red
  with that single cause until the Mesa gives the letter.
