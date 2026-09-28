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

`ejemplo-navegador-sin-cabeza.json` es de prueba: la jugó un Chromium sin
cabeza el 2026-09-27, con una identidad desechable y el reloj acelerado, para
demostrar la cadena de la v1.5 (invocación firmada del Tesoro del Arrecife →
pago de 50 de Cobre → exportar → verificar). No es de una persona y no cuenta
para entrenar. La primera de ejemplo (versión de contenido `2026-09-26.1`)
dejó de reproducirse cuando el motor ganó `invocar`: el verificador lo dice
con su causa (`contenido_v distinto`) y por eso se sustituyó.
