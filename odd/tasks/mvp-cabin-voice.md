# MVP-CABIN-VOICE · la cabaña suena y el cambio de terreno se ve (MVP, Sovereign's creative freedom 2026-10-28)

## Objetivo
La cabaña del tutorial declara una onda con sus propios armónicos. El botón «Listen» suena desde el fotograma, y el
cambio de terreno se ve con una transición que respeta el movimiento reducido.

## Hecho
- Onda `wave` con `h` dentro de la capa de mar del fotograma del terreno (sc 0.35, dentro del lienzo, x=250).
- `gacha.js` y `valores.js` cargados antes de `bubble_language.js`: la onda necesita `AtlasGacha.punto`. Antes, la
  onda rompía el dibujo en el navegador (el error se tragaba en el `try`); el diagnóstico lo confirmó.
- Transición del lienzo: se atenúa a 0,25 y vuelve tras 300 ms. Con `prefers-reduced-motion`, redibujo inmediato.
- El botón dice «Playing 1 voices.» en vez de `NO_DATA`.

## Checklist
- [x] CV1 · la cabaña declara una onda; `sonify` devuelve 1 voz.
- [x] CV2 · navegador real: el mapa se pinta (17.373 px de tinta) y el botón reproduce 1 voz.
- [x] CV3 · la transición respeta el movimiento reducido (sin transición en ese caso).
- [x] CV4 · dependencias declaradas en `test_atlas` (`valores.js`, `gacha.js`).
- [x] CV5 · sello SW: VERSION `preceptoros-2026-17-abke` (abkb es main; abkc lo reclama #375).
- [ ] CV6 · re-base del lexicón tras #370: `valores` (ruta de `valores.js`, D3 pendiente) queda como deuda visible.

## Registro
- 2026-10-28 · Base `origin/main` 92d4515. Rama `haiku/mvp-cabin-voice-20261028`.
- 2026-10-28 · Diagnóstico del dibujo en blanco: `wavePoints` llamaba a `AtlasGacha.punto` sin que la página cargara
  `gacha.js`. Causa confirmada en el navegador (no en Node, donde `require` lo encontraba).
- 2026-10-28 · Cambio visual decidido por el Sovereign (libertad creativa): la cabaña tiene una onda. Él juzga en la web.
