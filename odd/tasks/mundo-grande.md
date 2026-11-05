# El mundo grande · un sitio donde pasear (plano, sin código)

Encargo: BOLA DE LA NOCHE, punto 3 (Mesa TF, 2026-11-03). Palabras del Soberano:
«quiero que un usuario vea un mundo donde pasear, algo más grande — niebla de guerra, NPCs,
combates de ondas» y «más espacio para moverse».

Este fichero es el plano. Cada pieza va en su PR, en su fichero, con su sabotaje y su prueba
de navegador. `openworld_page.js` (20.695 B) **no crece**, y `openworld/index.html` está a 5 B
de su techo (16.379 de 16.384 B), así que lo nuevo nunca entra ahí.

## 1. Lo que ya vive (medido el 2026-11-03 en producción y en el Doogee, 360×716 CSS)

| Pieza | Qué hace hoy | Lo medido |
|---|---|---|
| `map/chart.json` + `map_chunks.js` | 7 chunks hexagonales de radio 8 alrededor de la cabaña, pedidos por clave de zona y comprobados por SHA-256 | **7 chunks × 217 celdas = 1.519 celdas cargadas**; el Doogee pide los 7 |
| `map_painter.js` | Hornea el suelo 2.5D por chunk (ImageBitmap por zoom, ángulo y dpr) | El mar queda horneado en reposo (`still`); la ola no se ve (J4) |
| `visitor_walk.js` | El cangrejo camina celda a celda por el suelo horneado; agua o celda sin cargar = NO_DATA y no se mueve | Ya camina por las 1.519 celdas |
| `global_map.js` | El campo de terreno: **las 19 celdas** a dos pasos de la cabaña | Es el núcleo; los 7 chunks lo rodean |
| `fog_of_war.js` | La niebla sale de lo MEDIDO: círculos despejados por nodo (380+160·k), casa (360) y lugar luchado (200); borde suave de 90 | **No se pinta en `/openworld/`**: solo la usan `visitor_conquest.js` (panel aparte, escala /1300) y `visitor_battle.js` |
| `visitor_battle.js` | **6 patrullas NPC** (Reef, Kelp, Ruins, Silt, Abyss, Core) en anillos 330–520 de la niebla, con tropas sembradas de su id | Viven en coordenadas de niebla, **no en el suelo que se pisa** |
| `wave_rules.js` | Duelo determinista por commit-reveal (SHA-256), sin azar ni reloj | Núcleo puro, 4.463 B |
| `wave_duel_scene.js` | La única cara de combate: columnas, barra de vida y escuadrón de ondas | 16.200 B, **184 B bajo el techo**: no se le añade nada |
| `face_terminal.js` | La radio: lo que el mundo dice en voz alta llega al chat con su sello | 2.091 B |
| `map_drag.js` (web#606, por fusionar) | Un dedo arrastra el mapa, con inercia y W A S D | Listo; espera cabeza al día y su letra |

**El hallazgo que manda:** el mundo ya es grande en datos (1.519 celdas, 6 patrullas, un
duelo vivo), pero en el Doogee **el mapa ocupa 360×348 px CSS**, la mitad de la pantalla
(`main{grid-template-rows:1fr 1fr}`), y la cámara sigue al cangrejo. El usuario no ve
espacio porque no le damos pantalla ni le dejamos mirar. Lo que falta es ventana, no mundo.

## 2. Las piezas, de la más simple que se siente a la más cara

| # | Pieza | Fichero nuevo | Coste | Se siente en el Doogee porque… |
|---|---|---|---|---|
| G1 | **La ventana grande.** Un botón «Explore» (44 px) pone el mapa a pantalla completa (`100dvh` menos la cabecera) y lo devuelve; la tecla Escape también | `public/game/map_wide.js` + `public/game/map_wide.css` | S | el mapa pasa de 348 a ~650 px de alto: **×1,9 de mundo visible** sin tocar el pintor |
| G2 | **La mano** (web#606) fusionada encima de G1 | ya existe | — | se arrastra hasta el borde de los 7 chunks |
| G3 | **Ver lejos.** Medir cuántas celdas caben a `MIN = 0,6` y, si los fps del Doogee lo aguantan, bajar el zoom mínimo con el número medido | `map_zoom.js` (una constante) | S | los 7 chunks enteros en una pantalla |
| G4 | **La niebla sobre el suelo.** Cada celda lleva su `niebla(x, y, despejado(e))` de `fog_of_war.js`; la celda con niebla 1 se pinta en `NO_DATA` (banda de sello, significado literal: no medido), y el borde de 90 da la transición | `public/game/map_fog_layer.js` | M | se ve **dónde acaba lo conocido**; pasear despeja |
| G5 | **Las patrullas en el suelo.** Las 6 de `visitor_battle.places()` pasan de coordenadas de niebla a la celda más cercana (anillo 330–520 ≈ 6–10 celdas de la cabaña si una unidad de niebla vale un píxel de suelo a zoom 1; la escala se mide en la pieza, no se supone) y se dibujan con sus ondas (`wave_render`, armónicos bajos); se mueven por `walk_route` con el tic | `public/game/map_patrols.js` | M | hay **alguien más** en el mundo, que se mueve |
| G6 | **El encuentro.** Pisar la celda de una patrulla abre `wave_duel_scene` con `visitor_battle.run` (que ya existe); ganar despeja su círculo de 200 en la niebla (`luchados`) | `public/game/map_encounter.js` | M | pasear lleva a pelear, y pelear abre mapa |
| G7 | **Más chunks.** Subir el radio de la carta (de 7 a 19 chunks, la segunda corona) con el mismo horneado y la misma comprobación por hash | `atlas/` (generador) + `public/map/chunks/` | L | el mundo crece ×2,7, **solo si G1–G6 ya se sienten** |

G1 va primero porque es la más simple (CSS y un botón), no toca el pintor ni el motor, y es la
única que cambia de un golpe lo que el ojo ve en el Doogee.

## 3. Reglas de cada pieza

- **Su sabotaje en rojo primero.** G1: la prueba mide el alto del lienzo en el modo Explore a
  360×716 (el Doogee) y exige ≥ 80 % de `innerHeight`; sale roja en main (348/716 = 49 %). G4: una celda fuera de todo
  círculo despejado tiene que pintarse NO_DATA; sale roja sin la capa. G5: las 6 patrullas en
  celdas pisables y distintas; sale roja con las coordenadas de niebla en crudo.
- **Determinismo.** Todo sale del tic, de la semilla y de la clave. Sin `Math.random` y sin
  `Date` con autoridad.
- **J1.** Dianas de 44 px, coordenada dicha en `#zoom-state` y teclado que alcanza todo (Explore
  con Enter, salida con Escape).
- **Peso.** Cada fichero < 16.384 B; `gzip_juego_b` medido por `atlas/world.py` antes y después.
  Hoy sale `None` en `atlas-world.json` de main: el primer recibo lo declara NO_DATA con su causa,
  o lo mide.
- **Fps.** La vara es el Doogee. G3 y G4 llevan su medida de fps antes y después en el recibo.
- **Lo que no se toca:** `atlas-motor.js`, el cangrejo (`visitor_account.js`) y
  `wave_duel_scene.js` (está a 184 B del techo; G6 lo llama, no lo cambia).

## 4. Lo que busca firma (ODD) y lo que queda fuera

- G6 **no persiste** el resultado fuera del dispositivo. Persistir el multijugador, el botín y
  la pérdida definitiva siguen en la lista de firma de CLAUDE.md.
- G7 cambia el peso del bloque: necesita la medida de `gzip_juego_b` y la letra de la Mesa.
- No se traduce nada; los textos nuevos van a su familia `atlas-*-en.json`.

Agent: claude-code · Model: claude-opus-5-5
