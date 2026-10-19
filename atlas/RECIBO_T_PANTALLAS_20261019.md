# RECIBO · VT5 · pantallas F0–F3 (solo forma)

- Rama `haiku/vt5-tutorial` (encima de 788997b). Sin push.
- Modelo de vista puro `public/game/ui-tutorial-fases.js`: `vista(st, medidas)` y `alPulsar(st, accion)`. La maquina sigue en `tutorial_fases.js`.
- Capa DOM `monta(doc, raiz, st, medidas, alEstado)`: solo createElement, className, textContent, dataset y addEventListener. Sin innerHTML.
- Primer edificio sin etiqueta medida: boton bloqueado con causa NO_DATA.
- `cruza` solo se ofrece en F3 · salto y lleva humano:true por el gesto del clic.
- Textos en ingles (UI), sin palabras prohibidas del canon.
- Casos `atlas/ui_tutorial_casos.mjs`: 7 (1 valido, 6 violaciones). Rojo demostrado: quitar la clase touch44 en copia desechable falla su caso.
- Grupo VT5 ampliado en `atlas/test_atlas.py`.
- PENDIENTE: la regla CSS que fija 44x44 px para `.touch44` no existe aun. Sin ella la clase no garantiza el tamano en pantalla. Pendiente tambien: cargador en thegame.js y precache (la pantalla aun no la carga el juego), y captura en el Doogee.
- Sello: VERSION intacta `preceptoros-2026-17-abje`; huella `89c9d55414f4bcca`.
- Gates: test_web OK (78, 1 saltado) · arnes_sw 22/22 · test_atlas 187 OK.
- Pendiente: commit y push (mano del carbono).
