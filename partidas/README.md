# Partidas firmadas de theGame

Aquí entran, por pull request, las partidas que alguien exporta desde theGame
con **«Exportar partida»**. Cada fichero es un sobre `atlas.partida.firmada/1`:
la ley, las acciones (con su origen: `humano`, `piloto_base` y, más adelante,
`lora`), las sugerencias respondidas y la firma Ed25519 de quien jugó.

El workflow `partidas` las vuelve a jugar con el mismo motor y rechaza, con su
motivo, cualquiera que no reproduzca su final. Es la misma comprobación que
hará la Aduana del rack (`node atlas/verifica_partida.mjs <fichero>`).

**Lo que hay en un fichero, para que decidas antes de subirlo:** tu pseudónimo
y tu clave pública (los dos ya son públicos por definición), y lo que hiciste
en la partida. No hay fechas de reloj, ni la página, ni nada del navegador.
Subirlo es publicarlo: el repositorio es público.

Solo las partidas con acciones `humano` y con sugerencias respondidas sirven
para entrenar el LoRA del juego, y solo cuando el Soberano fije el umbral.

`ejemplo-navegador-sin-cabeza.json` es la primera, y es de prueba: la jugó un
Chromium sin cabeza el 2026-09-27, con una identidad desechable, para demostrar
la cadena entera (sugerencia ignorada → piloto firmado → exportar → verificar).
No es de una persona y no cuenta para entrenar.
