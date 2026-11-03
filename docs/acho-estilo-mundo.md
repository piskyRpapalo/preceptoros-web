# La sensación del mundo, en Acho

Encargo: BOLA DE LA NOCHE, punto 4 (Mesa TF, 2026-11-03). El Soberano enseñó un documento de
estilo de mapa y pidió su **sensación** en lengua Acho. Aquí se traducen principios, no se copia:
ni nombres, ni personajes, ni arte, ni aspecto de otro producto. Los personajes siguen siendo
ondas, el valor sigue pasando por HITL y lo que no se mide sigue siendo NO_DATA.

Prueba viva: `node atlas/acho_estilo_casos.mjs` (con `--frames` imprime los 10 fotogramas).
`ESTILO_SABOTAJE=cenit|insignia|todo-insignia|billboard` rompe una ley cada vez y la prueba sale roja.

## 1. Las cuatro leyes, ya escritas como fotogramas `preceptoros.acho/1`

| Ley | La sensación | En Acho | Lo que ya vivía y se cita |
|---|---|---|---|
| **L1 · el cielo es el entorno** | la luz del mundo no se elige a mano: sale del cielo | el `light` de cada fotograma se calcula del tic con `palette_cycle.palette(t).dia` | `palette_cycle.js` (CYCLE 240, día 0..256), sin tocarlo |
| **L2 · el sol nunca en el cénit** | toda forma conserva una sombra que se lee; nunca hay un mediodía plano | el ángulo de la luz vive en **[115,66°, 154,34°]**: sube hasta 90° + 25,66° y baja hasta 180° − 25,66° | `hex_projection.js` y `map_zoom.js` (`SQUASH = √3/4`): **25,66° = asin(√3/4)**, la elevación del suelo |
| **L3 · insignias de tamaño fijo, solo para lo urgente** | lo que te necesita se ve igual de lejos que de cerca; lo normal no grita | insignia de **44 px de pantalla** (la diana de J1), dibujada después de la cámara; solo la llevan `PROPUESTA` (espera tu firma) y `ERROR` | `tabla_semantica.js` (bandas de sello con su significado literal) |
| **L4 · billboards** | los nombres están de pie, miren desde donde miren | el rótulo se ancla a su celda proyectada y girada, pero el texto va con `rot: 0` y tamaño fijo | `isometric_floor_projection.js` (`proyecta`), `map_zoom.js` (giro Q/E) |

**La cifra bonita de L2.** A mediodía la luz vale **(−√3/4, −√13/4) = (−0,433, −0,901)**, y a
medianoche **(−0,901, −0,433)**: los dos extremos del día son la misma pareja con los ejes
cambiados, y los dos salen del suelo. Con la luz siempre desde el noroeste (la casa la pone
ahí: «bajo el mar la luz viene de arriba»), la sombra gira 38,68° a lo largo del día y nunca
desaparece bajo las cosas.

## 2. Los otros principios, traducidos a piezas nuestras

| Sensación | Pieza nuestra (existe o se propone) |
|---|---|
| Todo lo visible significa algo | La ley de la casa: sello en cada cosa (`LIVE`, `NO_DATA` con causa, `EMULADO`) |
| Es agradable sin hacer nada | El ciclo de 240 tics del cielo (J3: de triángulo a coseno) y la respiración de las ondas (J5) |
| El sitio de cada cosa es pegajoso | El sitio sale de la clave (`fog_of_war.sitioCasa`, `sitioLugar`): la misma clave, el mismo sitio |
| «Ir al siguiente que espera» | Una tecla que vuela a la próxima `PROPUESTA`: lo que espera tu firma (pieza propuesta, HITL) |
| Llegada y salida con ritual | El nacimiento armónico a armónico de `summon_reveal.js` (J6) para el sello LIVE |
| El aspecto sale del id | El emblema sale de la clave pública: 32 bytes son 8 armónicos (J8) |
| Parpadeos con relojes propios | La fase desde la clave del nodo (J2), nunca todas a la vez |
| Cámara que agarra el suelo | `map_drag.js` (web#606): el dibujo sigue al dedo, con inercia, y J7 anuncia dónde se parará |
| Profundidad y niebla | `fog_of_war.niebla` pintada sobre el suelo en `NO_DATA` (plano `mundo-grande.md`, G4) |

## 3. Lo medido y lo que no

- Los 10 fotogramas compilan con `acho_language.js` y pesan ≤ 1.024 B. Usan solo bandas que
  existen: `ink`, `paper`, `comic yellow.base` y `PROPUESTA.base/contorno`.
- L2 se comprueba en los 240 tics: el ángulo se mantiene en [115,66°, 154,34°] y |luz.x| ≥ 0,433.
- **Hallazgo:** la luz por defecto de la lengua, `[-0.35,-0.94]`, está a **110,4°**, 5,2° más
  empinada de lo que permite L2. No se cambia: hay fotogramas medidos que dependen de ella. Un
  fotograma que quiera la ley pasa su `light` explícito, como estos.
- **Píxeles en el Doogee: NO_DATA.** Esto es la lengua, no una pieza servida: nada de `public/`
  cambia. Se verá en el Doogee cuando una pieza del mundo grande (G4 y G5) dibuje con estas leyes.
- **Sonido: none.** Ninguno de estos fotogramas suena.

Agent: claude-code · Model: claude-opus-5-5
