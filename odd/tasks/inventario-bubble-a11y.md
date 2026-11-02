# Inventario medido · funciones de la Burbuja para la accesibilidad en /openworld/ (2026-11-02)

Encargo: el Soberano p0, buzon#30 (·6572069590). Rama `haiku/terminal-compacta-20261102`.
Medida: `node atlas/bubble_a11y_medida.mjs` (Chromium real por CDP, 390×844, árbol de accesibilidad completo) más
las guardas `atlas/openworld_browser.mjs` y `atlas/ojo_carbono_browser.mjs`. Nada de memoria: cada fila dice su medida.

**NO_DATA es un marcador vivo.** Primero se declaró cada hueco con su causa; luego se construyó en este mismo PR lo
que cabía; al final se volvió a medir y se rellenó. La columna «al abrir» guarda lo que había antes de construir.

## Recuento

| | filas |
|---|---|
| funciones inventariadas | **15** |
| presentes y medidas | **10** (3 de ellas construidas en este PR) |
| ausentes, con causa medida | **3** |
| NO_DATA que queda, con causa exacta | **2** |

## Filas

| # | función de la Burbuja | al abrir | medida al cerrar | estado |
|---|---|---|---|---|
| 1 | cada voz del panel nombra a quien habla (cabecera < 1.024 B) | NO_DATA: no había panel único; los textos sueltos no decían quién hablaba | 9/9 voces del árbol AX empiezan por su hablante (Guide, Tutorial, Map, Floor, Walkers, Zoom, House, Army, Radio) | **construida** (`terminal_panel.js`) |
| 2 | cada línea del registro de conversación (`#log`) empieza por su hablante | NO_DATA: las líneas del router empiezan por `NO_DATA ·`, sin hablante | 2/2 líneas de arranque llevan `Guide · ` como StaticText propio en el árbol AX (CSS `::before` de `data-speaker`) | **construida** |
| 3 | anillo de foco propio del teclado | NO_DATA: sin medir | antes `auto 1px` (el del navegador); ahora `solid 3px` en «Play now» alcanzado con Tab real | **construida** |
| 4 | burbujas de la radio con hablante y sello como texto | — | 6/6 burbujas con `<b>` de hablante y 6 sellos en texto | presente |
| 5 | equivalente de texto del mapa dibujado | — | `canvas role=img` con etiqueta que dice cómo caminar (tocar un nodo, flechas, Enter) | presente |
| 6 | frase por fotograma (lo dibujado, dicho) | — | 3 frases en `#frases` con la colonia por defecto | presente |
| 7 | movimiento reducido | — | con `prefers-reduced-motion: reduce`, `t` = 0 → 0 tras 2,2 s y transición `0s` | presente |
| 8 | texto al 200 % sin desplazamiento lateral | NO_DATA: sin medir | `scrollWidth` 390 = vista 390 | presente |
| 9 | idioma declarado | — | `lang="en"` | presente |
| 10 | objetivos táctiles de 44 px | — | 0 objetivos por debajo de 44×44 a 390 px (ojo de carbono) | presente |
| 11 | repintado en colores del sistema (`forced-colors`) | NO_DATA | **0** reglas `forced-colors`/`prefers-contrast` con `forced-colors: active` emulado | **ausente** · causa: el pintor de la Burbuja lee solo `comic_tokens`/`comic_accents` y el navegador no remapea los píxeles de un canvas. Elegir bandas de sistema es decisión de canon visual: se propone, no se hace aquí |
| 12 | foco de teclado por burbuja dibujada | NO_DATA | 0 elementos enfocables sobre el canvas con el estado por defecto (las marcas HITL `?` sí lo son: guarda P5a) | **ausente** · causa: cada nodo es píxeles del canvas, sin proxy DOM; hoy se llega con flechas + Enter (ley de `colony_controls.js`), no con Tab |
| 13 | el anuncio vivo dice el hablante | NO_DATA | la región viva es el `<p>` interior (`#state`, `#joy .state`…): su texto **no** empieza por el hablante; la cabecera está fuera de la región | **ausente** · causa: 28 lecturas de esas regiones en `atlas/*.mjs` (grep medido) anclan en su texto exacto (`^Colony`, `^terminal:`) y `openworld_page.js` reescribe `textContent`; meter el hablante dentro exige mover esas guardas en una pieza propia, sin debilitarlas |
| 14 | sonido de la burbuja de cada nodo | NO_DATA | «Playing 1 voices.» solo en la cabaña | **NO_DATA** · causa: la cabaña es el único nodo LIVE de `estado.json`; no hay otro fotograma que hacer sonar |
| 15 | lectura real con TalkBack en el Doogee S110 | NO_DATA | — | **NO_DATA** · causa: TalkBack es de las manos del carbono (PROTOCOLO-NODO-WEB §4); el silicio midió el árbol AX de Chromium, no la voz del lector |

## Lo que se propone (no se hace aquí)
- Fila 11: tabla de bandas → colores de sistema para la Burbuja bajo `forced-colors`, con firma de canon visual.
- Fila 12: un proxy DOM (`button` por nodo visible, como la marca HITL) para llegar con Tab.
- Fila 13: una pieza que mueva el hablante dentro de cada región viva y actualice sus guardas a la vez.

## Relleno medido · 2026-11-02 · rama `haiku/a11y-rellena-20261102` (DECRETO-NO-DATA-ESTADO-VIVO)

Las filas 11-13 de arriba se quedan como estaban (fecha de apertura). Debajo, la misma fila con la medida nueva:
`node atlas/bubble_a11y_medida.mjs` reejecutado tras construir, y la guarda nueva `atlas/a11y_relleno_browser.mjs`
(roja con sabotaje, verde sin él).

| # | función | antes (2026-11-02, apertura) | medida al rellenar (2026-11-02) | estado |
|---|---|---|---|---|
| 11 | repintado en colores del sistema (`forced-colors`) | 0 reglas | **2** bloques `@media` (`forced-colors: active`, `prefers-contrast: more`) · **11** reglas aplicadas con `forced-colors: active` emulado (CDP) · lienzo por la ruta de alto contraste (`AtlasComicAtoms.highContrast()` = `true`: cada forma contorneada en `CanvasText` sobre `Canvas`, sombras y gradientes fuera, el suelo velado al 80 %) · anillo de foco `solid 3px` (`Highlight`) en «Play now» con Tab real · contraste del texto del panel **21:1** | **rellenada** |
| 12 | foco de teclado por burbuja dibujada | 0 enfocables | **1/1** nodo de la colonia por defecto con proxy `<button>` ≥ 44×44 sobre su ancla (`map_focus.js`, colocación única `anchorOf`) · Tab llega al proxy de la cabaña en **21** pulsaciones · Enter entra (`terminal: basic (the node)`) · anillo dibujado en el lienzo (sólido + discontinuo) | **rellenada** |
| 13 | el anuncio vivo dice el hablante | el texto de la región no empezaba por el hablante | **10/10** voces (Tutorial, Welcome, Guide, Map, Floor, Walkers, Zoom, House, Army, Radio) con su región viva leída «Hablante: …» en el árbol AX · `textContent` intacto: **0** de las 28 lecturas exactas de `atlas/*.mjs` tocadas | **rellenada** |

Elecciones, con su causa:
- **Fila 13 por CSS, no por las 28 lecturas.** El hablante va en un `::before` visualmente oculto por voz
  (`.voice[data-speaker="Map"] [aria-live]::before{content:"Map: "}`): el texto generado entra en el árbol de
  accesibilidad (medido: StaticText `Map:`) y no en `textContent`, así que `openworld_page.js` sigue reescribiendo la
  región y ninguna guarda se debilita ni se mueve. Un `<span class="sr">` dentro habría cambiado `textContent` y
  habría muerto en la primera reescritura.
- **Fila 12: el edificio va dentro del nodo.** El edificio se dibuja en el ancla de su nodo y Enter sobre el nodo lo
  entra; un segundo proxy en el mismo punto sería un Tab vacío. La frase del edificio va en el nombre del proxy. Los
  `?` HITL (ya botones) se mueven justo detrás de su nodo para que el orden de Tab siga la profundidad.
- **Fila 11, matiz honesto:** el 21:1 lo da también el remapeo del navegador; lo que se debe a esta pieza son las 11
  reglas (botones `ButtonText`/`ButtonFace`, enlaces `LinkText`, foco `Highlight`, bordes `CanvasText`) y el lienzo,
  que el navegador **no** remapea.

## Recuento al rellenar (2026-11-02)

| | filas |
|---|---|
| presentes y medidas | **13** |
| ausentes | **0** |
| NO_DATA con causa exacta | **2** (filas 14 y 15, sin cambio) |
