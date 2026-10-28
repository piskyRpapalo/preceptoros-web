# MVP-STATE-FRAMES · cada estado visible es un fotograma (MVP, slice 1 de 2)

## Objetivo
Cada cambio de estado visible se dibuja como un fotograma del lenguaje de burbujas, y su sonido sale de los datos
del propio fotograma (`vozDe`). Con movimiento reducido, ninguna transición dura.

## Decisión pendiente (visual)
El sonido sale de las ondas (`wave`, con `h`). La cabaña del tutorial hoy no tiene ninguna onda, así que su sonido
dice `NO_DATA`. Añadir una onda a un estado es un cambio visual: tu regla dice que un icono extra solo se añade si lo
ves. **Pregunta:** ¿qué estados llevan ondas? Hasta entonces, el sonido de esos estados es `NO_DATA`, que es lícito.

## Alcance (slice 1, núcleo puro, sin tocar la página)
- `atlas/puros/state_frames.js`: `stateFrame`, `transitionMs` (movimiento reducido → 0), `valida` (ley: < 1.024 B, frase
  en cada átomo, sonido declarado).
- `atlas/puros/state_frames_casos.mjs`: 7 casos, con sabotaje de frase vacía (real: rojo, restaurado: verde) y de fotograma
  sobredimensionado.
- Slice 2 (pendiente de la decisión de ondas): cablear en la página, con sello SW y su propio PR.

## Dependencia de ramas
Esta rama está apilada sobre `haiku/audio-slice2-20261028` (#373). Los re-bumps de #373 (abkb) y #375 (abkc) se hacen
cuando #363 se fusione, según la escalera del Desk.

## Checklist
- [x] SF1 · `stateFrame` produce un fotograma válido con frase y sonido declarado.
- [x] SF2 · sin ondas → `NO_DATA` con causa, y el núcleo de sonido dice que no suena.
- [x] SF3 · con ondas → sonido desde sus propios armónicos (`S.sonify` devuelve las voces).
- [x] SF4 · ley: < 1.024 B, frase en cada átomo, sonido declarado (`valida`).
- [x] SF5 · movimiento reducido: 0 ms; tope de 1 s.
- [x] SF6 · sabotaje real: frase vacía → rojo; restaurado → verde.
- [ ] SF7 · cablear en `/openworld/` (slice 2, tras la decisión de ondas).
- [ ] SF8 · prueba en el móvil y en la web en vivo (decreto: se puede probar en preceptoros.org).

## Registro
- 2026-10-28 · Base: `haiku/audio-slice2-20261028` @ 04746a5 (apilada). Rama `haiku/mvp-state-frames-20261028`.
- 2026-10-28 · `valida` usa `TextEncoder` (el módulo corre en el navegador; `Buffer` no existe allí).
