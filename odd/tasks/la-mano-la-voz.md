# Piezas 3 y 4 · LA MANO y LA VOZ (plano medido, sin código)

Origen: `latido-visible.md` §piezas.
- Pieza 3: giro con dos dedos + paseo libre. *Decir antes qué lo hace monolítico.*
- Pieza 4: `speechSynthesis` del dispositivo, activable y silenciable.

Cada pieza va en su PR, con su FIRMA y su letra. Aquí solo hay medida y plan.

## 0. Lo que ya existe (medido 2026-11-03, rama main eb2aba39)

| Pedido | Estado real | Dónde |
|---|---|---|
| Giro con dos dedos | **YA EXISTE**: pellizco + giro anclado entre los dedos, botones ↺ ↻ con salto de 60°, Q/E, y Shift+arrastre o botón derecho | `public/game/map_zoom.js` (7.249 B) |
| Paseo libre | **YA EXISTE** como «Free walk» del tutorial: un toque fuera de un nodo da un paso al cangrejo | `openworld_page.js` (paso con un toque, 2026-11-02) |
| Arrastrar el mapa con un dedo | **NO EXISTE.** Un dedo solo da toques; para mover la vista hay que usar zoom o botones | — |
| Voz del dispositivo | **NO EXISTE** en OpenWorld. Hay sonido Acho tras «Listen» (`latido_vivo.js`), pero no lectura en voz | — |

La parte nueva de LA MANO se reduce, por tanto, a **arrastrar con un dedo**, y a que no choque con el toque que hace caminar.

## 1. Qué lo hace monolítico (lo pedido «decir antes»)

`/openworld/` carga **56 scripts, 347.872 B sin comprimir**. Cuatro de ellos pasan la regla de eficiencia de 16.384 B por pieza:

| Fichero | Bytes | Exceso |
|---|---|---|
| `game/openworld_page.js` | 20.695 | +4.311 |
| `game/map_painter.js` | 19.738 | +3.354 |
| `game/colonia_pagina.js` | 18.530 | +2.146 |
| `game/colony_controls.js` | 16.857 | +473 |

`openworld_page.js` es el monolito: junta la barra de zoom, el teclado, el dibujo, el paseo, el bucle de caminar y los paneles. **Toda pieza de mano o de voz que entre ahí lo engorda.**

Regla de este plano:
- lo nuevo entra en **ficheros propios** de menos de 7 KiB (`map_drag.js` y `map_voice.js`);
- `openworld_page.js` **no crece**: la prueba de cada pieza mide que su tamaño sea ≤ el de main.

Partir el monolito es una pieza aparte (L), fuera de este plano. Se propone, no se hace.

## 2. Pieza 3 · LA MANO — `map_drag.js`

- **Un dedo arrastra la vista** (`panx`/`pany` del dataset del lienzo, ley P5: solo cambia el dibujo). Dos dedos siguen siendo de `map_zoom.js`.
- **Toque frente a arrastre:**
  - por debajo de 6 px de recorrido es un toque, y camina o da un paso, como hoy;
  - por encima es un arrastre, y el click se traga, igual que ya hace `map_zoom.js` (`moved > 6`).
- **Inercia** con freno (como `world_camera.js`: FRENO 0,9). Con `prefers-reduced-motion` no hay inercia.
- **Límite:** la vista no sale más allá de la niebla medida (`fog_of_war.js`). Al pasarse, rebota hasta el borde.
- **J1:**
  - flechas con Alt = mover la vista (las flechas solas ya eligen nodo);
  - «⌂» devuelve la vista;
  - la frase `say()` da la posición de la vista;
  - ningún control nuevo (0 botones, 0 px nuevos).
- **Prueba `atlas/map_drag_browser.mjs`, con eventos táctiles CDP reales:**
  - un dedo con 40 px de recorrido mueve `panx` y no hace caminar;
  - un toque de 2 px camina;
  - con dos dedos manda el zoom;
  - el teclado mueve la vista;
  - `openworld_page.js` ≤ su tamaño en main.
  - Sabotaje: quitar la guarda de 6 px pone la prueba en rojo, porque el arrastre hace caminar.
- **Doogee:** arrastre real por `adb shell input swipe` y captura antes y después. El `panx` se lee por CDP.

## 3. Pieza 4 · LA VOZ — `map_voice.js`

- **Un interruptor, «Voice: off/on»** (44 px, `aria-pressed`). **Apagado por defecto**: no habla nada sin gesto. El estado se guarda en `localStorage` (preferencia del dispositivo, no del visitante).
- **Qué dice:** las frases que la escena ya tiene (`frases()`): el cambio de fase de la Boya, el sello LIVE o STALE, el nodo enfocado. **No hay texto nuevo.** Va con cola y deduplicación: no repite la misma frase en menos de 10 s.
- **Silenciar:** el interruptor y la tecla `M`. `pagehide` y `visibilitychange` (oculto) cancelan la voz.
- **Solo voz local:** se filtran las voces con `localService === true`. El texto nunca sale del dispositivo.
- **Sin voz local:** NO_DATA con causa, la misma clasificación que APP#159 (sin síntesis · 0 voces · solo red · otro idioma). En el Doogee (0 voces) se ve «NO_DATA · this device has no installed voices (0)…». Se avisa, no se calla.
- **El pitido de cambio de fase de la Boya** (que `mapa-vivo.md` aplazó a esta pieza) va detrás del mismo interruptor.
- **Prueba `atlas/map_voice_browser.mjs`** con un `speechSynthesis` espía:
  - apagado no dice nada;
  - encendido lee una frase por cambio y no repite dentro de 10 s;
  - `M` silencia;
  - con 0 voces sale NO_DATA con causa;
  - `openworld_page.js` no crece.
  - Sabotaje: quitar la deduplicación pone la prueba en rojo.
- **Choque con el plano (e).** e1–e4 piden menos controles en la primera pantalla. El interruptor de voz va **dentro de «⋯ Map tools»** (e3), no en el pliegue. Por eso LA VOZ entra **después de e3**.

## 4. Orden

1. e5, la prueba del infante, en rojo.
2. LA MANO (`map_drag.js`): no añade controles.
3. e3, «⋯ Map tools».
4. LA VOZ, dentro de las herramientas.

Antes de todo eso: firmar web#603, #604 y #605.

## 5. Fuera

- Partir `openworld_page.js` (L, propuesto).
- Voz en otros idiomas: el juego habla solo inglés.
- Tocar el cangrejo.

Agent: claude-code · Model: claude-opus-5-5
