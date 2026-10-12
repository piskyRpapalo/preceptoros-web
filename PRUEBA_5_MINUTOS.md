# PRUEBA DE 5 MINUTOS · theGame · para la mano del Soberano · versión `preceptoros-2026-17-abfj`

Antes de empezar (10 s): abre https://preceptoros.org/en/ y **recarga una vez**. Si al pie del juego (o en
`preceptoros.org/sw.js`) no pone `abfj`, recarga otra vez: el service worker cambia en la segunda visita.
En el Doogee: Chrome **delante** (si Acurast está en primer plano, el mapa se pausa; no es un fallo).

| # | Haz esto | Debes ver | Si no, anota |
|---|---|---|---|
| 1 | Mira la pantalla al abrir | El mapa isométrico ocupa el centro; menú de iconos a la izquierda; una línea de la Radio abajo. Ningún panel abierto | qué tapa el centro |
| 2 | Busca la palabra «undefined» o «NaN» en cualquier sitio, también en tu nombre arriba | **No aparece nunca**. Lo que falta dice `NO_DATA (causa)` | dónde y qué decía |
| 3 | Pulsa ◈ (Faro) y luego ⌂ (casa) | La cámara **desliza** (~0,7 s), no salta | si salta, cuántos fps (paso 10) |
| 4 | Toca un lugar del mapa (una onda con nombre) | Se abre el panel **Inspector**: What · State · Coordinate · Sound. Si no has luchado allí: `NO_DATA (not fought on this device)` y la onda en gris translúcido | campo vacío o raro |
| 5 | Menú ◉/⌖ → **Places** → **Fight** | Batalla; al cerrar (← Map), ese lugar cambia de color y su ficha dice `win share …/1000 · N fights · shield …` | si el color no cambia |
| 6 | Toca la boya verde, la cúpula del Observatorio y el rombo dorado (Cristal) junto a tu casa | Cada uno abre su ficha con estado y sonido declarado; el Cristal dice sus fps medidos | ficha que no abre |
| 7 | Pulsa 👁 (junto a las flechas) | El botón cuenta 8 ciclos y no deja mirar otra vez; luego la niebla se despeja donde mirabas | — |
| 8 | Menú ⚒ → **Workshop** → disuelve una tropa (si tienes) | Mensaje «Dissolved: +N g»; en el menú ▤ **Reef of tombstones** aparece su lápida: `born ↻NO_DATA` (la adopción no guarda su ciclo: honesto, no fallo) y su checksum | lápida que no aparece |
| 9 | Pulsa la línea de la Radio abajo | Se despliega el chat: cada burbuja dice quién, sello (LIVE/STALE/NO_DATA/SIMULATED), fuente y edad en ciclos. Vuelve a pulsar: se pliega | — |
| 10 | Deja el mapa quieto 5 s | Va fluido. Referencia medida: 58 fps en el Doogee (`abfa`), 60 fps en el navegador hoy | si va a tirones |

Lo que **no** está hoy (y es a propósito, no un fallo): edificios 5-9 (sin canon) · edad de las tropas en ciclos
(necesita persistencia, espera tu firma) · lo visto y las lápidas se olvidan al recargar (persistencia, espera firma) ·
el nivel real del núcleo (sección 17 sin fórmula aquí).
