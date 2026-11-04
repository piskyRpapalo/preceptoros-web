# RECIBO · J1 · Estrella Hexelion capturable (solo forma)

- Base: `origin/main` 1194fdd · rama `haiku/vt6-launch-gate` (encima de VT6, sin commit ni push).
- Modulo puro `public/game/estrella_captura.js`: `captura(st, dic, estrella, edificio)` y `constelacion(st, dic)`.
- Enlaces: `mesa_de_firma` ↔ D33 (EUR-Lex Art.14, `Human Hand`). `puerta_frontera` ↔ D67: NO es entrada de dictionary.json, queda NO_DATA.
- Reglas: una captura por estrella; retiradas (`withheld_ids`) no se capturan; sin semiotica medida no se captura.
- Casos `atlas/estrella_captura_casos.mjs`: 7 (1 valido, 6 violaciones).
- Rojo demostrado: quitar la comprobacion de retiradas en copia desechable falla su caso.
- Grupo `J1` en `atlas/test_atlas.py` (fuera de la puerta).
- PENDIENTE: la mecanica en el mapa (piece_inspector, la vista Faro) no se hace; la regla de radio de captura no tiene medida (NO_DATA).
- Sello: VERSION intacta `preceptoros-2026-17-abje`; huella `84e1ad09d7499cf7`.
- Gates: test_web OK (78, 1 saltado) · arnes_sw 22/22 · test_atlas 187 OK.
- Pendiente: commit y push (mano del carbono).
