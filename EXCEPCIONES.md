# EXCEPCIONES.md · el techo de peso sube solo por excepción firmada

Gobernanza (joya adherida del modelo de elección §3.5): el constructor PROPONE el techo; nunca lo sube. Cada excepción: fecha, motivo, tamaño medido antes y después, nuevo techo y firma.

| fecha | qué | antes | después | techo nuevo | firma |
|---|---|---|---|---|---|
| 2026-10-11 | Revocación del tope de 16 KiB por fichero (`test_web.TOPE_FICHERO`; `test_atlas` ya estaba en 25 MiB). Motivo: los tres ficheros vivos más grandes estaban pegados al techo (ui-arena 16.382 B, escena 16.375, mar 16.365) y el techo se pagaba en piezas partidas sin ganancia medida; la vara de rendimiento pasa a ser los fps medidos en el Doogee | 16.384 B/fichero | — | 25 MiB por bloque sintético | Soberano, plan de ronda 2026-10-11, firma D2 |

Lo que NO cambia: la puerta del juego `gzip_juego_b < 153.600 B` (atlas/mundo.py, vigia.yml) sigue siendo ley del mundo.
