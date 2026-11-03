# Pieza 2 · el mapa vivo (plano, antes de código)

Orden del Soberano · Mesa TF · 2026-11-03. Decreto citado: ·6591940119 (lo vivo se muestra). Apilada sobre la
pieza 1 (web#599): usa `AtlasWorldFeed.follow()`. Una pieza, un PR. Propose-only.

Tres cosas, en este orden: **(A)** el sello LIVE dibujado en el hex, **(B)** el terreno del nodo encendido por su
latido, **(C)** la Boya del Estado con Proof of Tick.

## 0 · Lo medido antes de proponer (rama de la pieza 1, 2026-11-03)

| qué | medida |
|---|---|
| lo que trae el latido | por nodo solo `id, q, r, alive, seal, since`; edificios `{id, node}`; `cobertura`. **No trae terreno, ni tic, ni look** |
| el sello hoy | viaja en los fotogramas Acho (`seal`) y en las frases; **no se dibuja**: en el Doogee los nodos LIVE son hexes negros con tejado, sin marca |
| primitiva ya servida | `comic_atoms.js` átomo `stamp`: tono por sello y **late solo si es LIVE**, quieto con movimiento reducido |
| el suelo | `map_painter.js` pinta celdas horneadas `[q, r, altura, tipo]` en cuatro bandas con patrón; no sabe nada de nodos |
| la Boya | ley firmada (FIRMO 2026-10-12, commit `2ef43155`): `reef_building_lifecycle.js`, estado = función pura de (manifiesto `preceptoros.edificio/1`, tic); retirada en el corte D con `/play/`. Sus casos siguen vaciados en `atlas/reef_building_casos.mjs` |
| sonido J1 | cada fotograma Acho declara el suyo; `acho_sonify.js` lo toca solo tras un gesto (botón Listen) |

### Presupuestos que deciden dónde vive el código

| fichero | disco | gzip | margen gzip (7 168) | margen disco (16 384) |
|---|---|---|---|---|
| `openworld/index.html` | 16 367 | 4 712 | 2 456 | **17 B** — no cabe ni una etiqueta `<script>` |
| `openworld_page.js` | 20 695 | 7 125 | **43 B** | ya por encima |
| `map_painter.js` | 19 738 | 6 942 | **226 B** | ya por encima |
| `colonia_pagina.js` | 17 802 | 6 543 | 625 B | ya por encima |
| `world_feed.js` | 4 141 | 1 674 | 5 494 B | 12 243 B |

Consecuencia: **no se toca `index.html`, `openworld_page.js` ni `map_painter.js`**. Todo lo nuevo vive en un fichero
nuevo, `public/game/latido_vivo.js`, que se carga **a demanda** con el primer latido bueno (ley de la casa: «lo que no
hace falta al abrir se carga a demanda»). Sin nodos vivos, el mapa no paga ni un byte.

## 1 · Diseño

### Cableado (lo único que se toca fuera del fichero nuevo)
- `world_feed.js` · `follow()`: en cada lectura buena o fallida emite un evento `latido` en `window`
  (`{ok, causa}`) y, la primera vez que hay nodos, añade `<script src="/game/latido_vivo.js">`. Como `follow()` lo
  usan las dos terminales, **la paridad sale gratis**: `/openworld/` y `face/basic.html` cargan la misma capa.
- `colonia_pagina.js` · `draw()`: tras el suelo y antes de las capas, si existe `AtlasLatidoVivo`, le pide el suelo
  despierto y sus capas (sellos y boya) y las mete en el **mismo orden de profundidad** que edificios y bots. ~120 B gzip.
- `sw-listas.js`: el fichero nuevo entra en la lista de a demanda; el recuento de rutas de `arnes_sw.mjs` se ajusta
  **antes** de la cadena de sello (lección W1).

### (A) El sello visible en el hex
- Un `stamp` por nodo sellado LIVE o STALE (nunca la cabaña del tutorial, nunca un nodo oculto), anclado sobre su
  hex con la misma geometría (`anchorOf`), girando con el mapa.
- LIVE late (el átomo ya lo hace); STALE queda quieto; con movimiento reducido, ninguno late.
- Fotograma < 1 024 B con su frase — `seal LIVE · primer-ancla · since 2026-11-03` — y su **sonido declarado**: un
  pulso corto para LIVE, nada para STALE (declarado como tal, no omitido).

### (B) El terreno del nodo, desde su latido
- El latido no trae terreno, así que **no se inventa**: el suelo horneado sigue siendo el suelo. El latido solo lo
  **despierta**: las 7 celdas del nodo (la suya y su anillo) llevan un borde y un patrón de puntos con el tono del
  sello. Patrón y borde, nunca solo color (alto contraste incluido).
- LIVE: borde continuo y puntos. STALE: borde discontinuo, sin puntos. Sin sello mostrado: nada.
- Un fotograma por nodo, < 1 024 B: `ground of primer-ancla · awake by its heartbeat · LIVE · 7 cells`.

### (C) La Boya del Estado · Proof of Tick
- **Vuelve la ley firmada, no el código a ciegas**: `estado(manifiesto, t)` puro, de `2ef43155`, dentro de
  `latido_vivo.js` (naciendo → vivo → gastado → NO_DATA con causa; nunca «0»).
- **La cuida el latido**: `nace_tic` = el tic del primer latido bueno; cada latido bueno fija `cuidado_tic` al tic
  de ese momento. El tic es el del ciclo de la página (`AtlasOpenworldView().t`): paso fijo, **sin reloj de pared**.
- **Proof of Tick**: el fotograma de la boya lleva `{nace_tic, cuidado_tic, t}`. Con esos tres enteros cualquiera
  recalcula su fase y su vida: la boya no afirma que el latido está vivo, **lo demuestra en tics**. Sin latido se
  desgasta a la vista hasta `NO_DATA · unattended N cycles`.
- Flota junto a la cabaña del tutorial (el lado del visitante). Tamaño = vida medida; en NO_DATA, hueca y gris.
- Frase: `State buoy · alive · life 940/1000 · cared at tick 812 · now tick 872`. Sonido declarado: pitido ADSR
  corto **solo al cambiar de fase y solo con el sonido encendido** (la ley de 2026-10-12).

### J1 y voz
- Toda frase nueva entra en `frases()` de la escena: la lee el lector de pantalla, la lista «Map details» y, en la
  pieza 4, la voz del dispositivo. No hay botones nuevos (ningún objetivo < 44 px). El teclado ya recorre los nodos.

### EL OJO · pesos por pieza (se rellenan al construir)
| pieza | peso fuente | peso traducción (Acho) | peso servido |
|---|---|---|---|
| sello (A) | `latido_vivo.js` (código) | un fotograma < 1 024 B por nodo | B en disco / B gzip |
| suelo (B) | idem | un fotograma < 1 024 B por nodo | idem |
| boya (C) | idem | un fotograma < 1 024 B | idem |

## 2 · Pruebas (cada una enseñada en rojo antes que en verde)
- `atlas/latido_vivo_casos.mjs` (node, puro): fotogramas < 1 024 B; LIVE late y con movimiento reducido no;
  STALE nunca late; un nodo oculto no da sello ni suelo; 7 celdas por nodo LIVE; la boya se re-juega igual desde
  los mismos `(nace_tic, cuidado_tic, t)`; sin cuidado → gastado → NO_DATA con causa, nunca 0.
  Sabotajes: «lo desatendido nunca muere» y «STALE late» tienen que dar rojo.
- `atlas/latido_carga_browser.mjs` crece: con el latido, la frase del sello y la de la boya aparecen sin clic; sin
  publicador, ni sellos ni suelo despierto, y la boya dice NO_DATA.
- **fps en el Doogee**, antes y después, con dos nodos vivos (la vara de rendimiento de la casa). Si no hay medidor
  servido en `/openworld/`: `NO_DATA` con su causa, y se propone medirlo.

## 3 · Decisiones con valor por defecto (sigo con estas salvo que la Mesa diga otra cosa)
1. **Ancla de la boya**: junto a la cabaña del tutorial. Alternativa: junto al `observatorio-primer-ancla` que trae
   el propio latido.
2. **Desgaste**: con 1 tic por segundo y un latido por minuto, `desgaste_por_tic = 5` → gastada tras 120 tics sin
   latido (dos lecturas perdidas) y NO_DATA a los 200. Es una regla, no una medida.
3. **Sonido del sello**: un pulso para LIVE dentro de Listen; la boya, pitido solo en cambio de fase.

## 4 · Fuera de esta pieza
- Que la aduana publique tic o terreno en el latido: es otro repo; si hace falta, sale como propuesta.
- El Observatorio (otro de los 9 objetos) aunque el latido ya traiga `observatorio-primer-ancla`.
- Pieza 3 (LA MANO) y pieza 4 (LA VOZ).
