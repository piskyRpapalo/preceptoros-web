# Pieza 1 · el latido llega a la cara («Nodes online: 0»)

Orden del Soberano · Mesa TF · 2026-11-03. Decreto citado por la orden: ·6591940119 (lo vivo se muestra).
Una pieza, un PR. Propose-only: jamás se fusiona main desde aquí.

## 1 · Medido contra producción (2026-11-03 ~00:27Z, no contra el clon)

| eslabón | medida | resultado |
|---|---|---|
| aduana `GET api.preceptoros.org/api/v1/latidos` | `curl` | 200 · 380 B · `no-store` · 2 nodos `LIVE` (primer-ancla 0,0 · onexstation 1,0) · `cobertura MEDIDO 2 node_heartbeats` |
| worker `GET preceptoros.org/api/world-state` | `curl` | 200 · 380 B · mismos bytes: el puente worker → aduana **funciona** |
| `GET preceptoros.org/openworld/estado.json` | `curl` + `cmp` | 200 · 588 B · **idéntico al del repo** · `nodes:[]` + colonia horneada del 2026-10-30 (cabin LIVE, 3 nodos NO_DATA) |
| service worker | `public/sw.js:151-153` | salta `/api/world-state`; `estado.json` va red-primero (`RED_PRIMERO`). **No es caché** |
| página, al cargar | Chromium headless contra producción | pide **solo** `estado.json`; `#state` = «Your cabin is awake · 3 more still asleep.» |
| página, rama viva | `#world-refresh.click()` forzado | pide `/api/world-state` → «3 places are awake.» · los dos nodos LIVE dibujados |
| botón «Check live nodes» | `getComputedStyle` | `display:none` por su voz (`Radio`, pestaña About): un clic real no llega |

## 2 · Dónde se rompe la cadena (la causa, con recibo)

El latido llega entero hasta el worker. Se rompe **en la página**, por tres cosas a la vez:

1. **Al cargar solo se lee `estado.json`**, el fichero que hornea `bin/estado_v2.py` desde `odd/data/nodes.json`
   al compilar. Lo vivo (`/api/world-state`) solo se pide al pulsar un botón escondido en la pestaña About.
2. **Lo vivo caduca a los 60 s y vuelve a lo horneado** (`fallback('refresh required')`): aunque se pulse, el mapa
   vuelve a mostrar la colonia vieja al minuto.
3. **El contador «Nodes online: N» cuenta nodos v1** (`id === 'hexelion' || 'second'`, `openworld_page.js:149`).
   Con el esquema v2 da **siempre 0**: es el texto que se ve antes de que la colonia cargue (y el HTML estático
   lo trae escrito). Es una cifra que no se midió presentada como medida.

El SW queda descartado; `estado_v2.py` hace lo suyo (no es su trabajo saber del latido).

## 3 · La cura (esta pieza)

- `public/game/world_feed.js` gana `merge(tutorial, live)`, pura, sacada de la página: las dos terminales la usan.
- `public/game/openworld_page.js`: la lectura viva corre **al cargar** (tras `estado.json`) y con el botón; al
  caducar se **vuelve a leer** si la página está visible, y si está oculta se cae a lo horneado con su causa y se
  relee al volver. «Nodes online: N» cuenta los sellos `LIVE` de la colonia (sin la cabaña del tutorial) y los
  nombra; sin colonia dice `NO_DATA` con causa, nunca «0».
- `public/openworld/index.html`: el texto inicial deja de afirmar «0».
- Paridad de terminales: `public/face/face_openworld_terminal.js` + `basic.html` leen el mismo latido.
- `public/llms.txt`: la promesa «no external request on load» sigue siendo cierta (la petición es del mismo
  origen), pero «calls api.preceptoros.org only when a visitor presses send» deja de serlo **por el worker**.
  Se reescribe para decir exactamente quién llama a quién.
- Prueba nueva `atlas/latido_carga_browser.mjs`: enseñada **en rojo** contra el código de main, luego verde.

## 3b · Lo que salió al construir (desviaciones declaradas)

- **El bucle vivo vive en `world_feed.js` (`follow`)**, no en la página: `openworld_page.js` pasaba su reparto
  gzip (7 539 > 7 168 B, `test_ningun_fichero_gasta_medio_viaje_de_red`). Queda en 7 125 B, por debajo de main (7 156).
  En disco sigue por encima de la regla de eficiencia de 16 KiB, como ya estaba en main (21 108 → 20 695 B).
- **Sin red no se pide nada**: `navigator.onLine === false` → `Live nodes NO_DATA: offline`, y se relee con el evento
  `online`. Lo exigió `offline_brain_browser.mjs` (cero peticiones en modo avión), que dio rojo con la primera versión.
- **`llms.txt` tenía 5 B de margen** (8 187 / 8 192). La frase pasa a «the browser calls api.preceptoros.org only when
  a visitor sends»: cierta y exacta en el techo, **margen cero**. La frase larga (worker, sin datos del visitante) queda
  aquí y en el PR; ampliar el techo o recortar otra línea es decisión de la Mesa.
- **Arnés de pruebas**: cinco servidores de prueba (`a11y_relleno`, `acho_a11y_medida`, `dos_clics`, `tutorial_walk`,
  y el nuevo) escribían la cabecera 200 *antes* de leer el fichero; el primer 404 los tumbaba con
  `ERR_HTTP_HEADERS_SENT`. Nadie pedía una ruta inexistente al cargar hasta hoy. Se lee primero, se responde después.
- **`openworld_browser.mjs`** fijaba como correcto «Your cabin is awake · 3 more still asleep.» sin decir que faltaba
  el latido: era el bug escrito como esperado. Ahora exige la cabeza `Nodes online: NO_DATA.|checking…`.
- **`index.html` a 17 B del techo** de 16 384 tras el cambio (16 367): el texto inicial es «Nodes online: checking…».
- **VERSION intacta** (`preceptoros-2026-17-ds`, la de main): solo se re-selló la huella. La letra la asigna la Mesa.

## 4 · Fuera de esta pieza (sus propios PRs, plano antes de código)

- Pieza 2 · mapa vivo: sello LIVE dibujado en el hex, terreno desde el latido, Boya del Estado con Proof of Tick.
- Pieza 3 · LA MANO: giro con dos dedos + paseo libre (decir antes qué lo hace monolítico).
- Pieza 4 · LA VOZ: `speechSynthesis` del dispositivo, activable y silenciable.
- Mover «Check live nodes» a la voz Map: con la lectura automática deja de ser imprescindible; se anota.

## Riesgo declarado

Una petición de mismo origen más al cargar `/openworld/` (y otra por minuto con la página visible). No sale del
navegador a ningún tercero; el worker llama a la aduana con una petición fija, sin cabeceras del visitante.
