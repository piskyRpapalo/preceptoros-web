# EXCEPCIONES · lo que cruza un techo, con su huella y su causa

Regla del Soberano (bloque maestro, 2026-10-12): «si thegame.js cruza (hoy 16.363 B), entrada en EXCEPCIONES.md con huella y
causa, no silencio». Los gates miden el techo D2 (25 MiB por fichero); el de 16 KiB es la regla de legibilidad de la ronda.
Cada entrada caduca: o se trocea el fichero, o se firma de nuevo.

## 2026-10-12 · public/assets/thegame.js · 16.436 B (cruza 16.384 por 52 B)
- **Huella (sha256):** `0190c5d7f1d46f5ec38c71c6ccb9ef91c8648f349c40d03346da0088de36143f`
- **Causa:** la LEY DEL SUELO, paso 2 (isometrico, urgente y firmado), necesita cargar dos modulos nuevos en las listas de
  carga del juego: `isometric_floor_projection.js` (antes de la camara) y `map_pointer_input.js` (antes del mapa). Las listas
  viven en `thegame.js`, que estaba a 21 B de su techo.
- **Lo que NO se hizo para no cruzar:** recortar comentarios (es documentacion para quien hereda el fichero).
- **Salida (caducidad 2026-10-19):** trocear `thegame.js`: las listas GUIONES/ARMY/ARENA/CASA a un modulo de datos propio, o las
  hojas y la terminal (`hoja`, `pliego`, `muestra`) a su modulo. Al trocear, esta entrada se cierra.
