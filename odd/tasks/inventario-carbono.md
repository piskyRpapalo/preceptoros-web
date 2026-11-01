# Inventario a ojos de carbono · cada pieza de la web, su marco, su sello y lo que falta

> Encargo A de la Mesa (2026-11-01). PROPUESTA · REQUIERE_FIRMA. Documento de texto: no toca `public/`.
> Append-only: lo que contradiga una medida posterior se anota debajo, no se borra.

## Cómo se midió (no se declaró)

- **Servido local** de `public/` (y de `public/` de cada rama en PR, extraída con `git archive`) con un servidor HTTP efímero en el bucle local; **Chrome headless por CDP** con `atlas/chrome_launch.mjs`, a 390×844 (móvil), mismo patrón que `atlas/openworld_browser.mjs`.
- Generador: `atlas/inventario_carbono.mjs` (medida → JSON) y `atlas/inventario_carbono_md.mjs` (JSON → estas tablas, marcos y bytes). No se sirven y **no entran en `gate.yml`**: dependen del tiempo de carga del navegador (1,8 s por página), no son una comprobación determinista.
- Selector de piezas: `button, a[href], input, select, textarea, details, summary, dialog, [aria-live], [role], [hidden], canvas, iframe`.
- **Clic**: solo `button`/`summary` visibles y habilitados cuyo texto o id **no** casa con firma/invocación/envío/descarga/borrado/instalación/reset. Se mide si cambia el DOM (longitud de `body.innerHTML` + nº de `[open]`/`[aria-expanded=true]`/`[aria-selected=true]`) y si salta una excepción o un error de consola. Los enlaces internos se piden por HTTP (código medido); los externos no se siguen.
- **Bytes del marco**: `Buffer.byteLength(JSON.stringify(marco), 'utf8')`, calculado por el script. Techo pedido: < 1.024 B. **Marco mayor medido: 205 B** (piezas) y 233 B (piezas dormidas).
- **Fuente** (`fichero:línea`): primera línea de un `.html`/`.js` de `public/` que contiene el id, la clase o el texto, empezando por la propia página. Si nada casa: `NO_DATA (generado en tiempo de ejecucion)`. Es heurística: una coincidencia por texto puede apuntar a la plantilla JS que pinta la pieza, no a la página.

### Reglas de sello (escritas en `inventario_carbono_md.mjs`)

| sello | cuándo |
|---|---|
| LIVE | enlace interno con HTTP 200; o clic que cambia el DOM sin error; o pieza visible con contenido |
| STALE | lápida de página retirada el 2026-11-01 que sigue servida |
| NO_DATA (causa) | clic con error de consola; deshabilitada al cargar; flujo de firma/envío/descarga no pulsado; oculta/plegada (0 px); región viva vacía al cargar; enlace externo no seguido; clic sin cambio medido |
| unbuilt_mechanic | botón deshabilitado cuyo texto declara que la mecánica espera (aprobación, release, catálogo); y toda mecánica del lore aún no construida (L-074) |

Las filas «en PR» llevan siempre `NO_DATA (causa: en PR, no desplegado)` y, al lado, el sello que se midió **en la rama**.

## Producción frente a `main`

- `curl -s https://preceptoros.org/sw.js | grep VERSION` → `preceptoros-2026-17-bv`.
- `public/sw.js` en `origin/main` → `preceptoros-2026-17-bv`.
- **Coinciden**: lo que se mide en `main` es lo que está en producción a la hora de la medida (2026-11-01). Las ramas de #545 y #543 suben `VERSION` en su propio `sw.js` y no están desplegadas.

## Recuento

- **Piezas medidas: 122** (108 en `main` = producción, 12 nuevas en #545, 2 nuevas en #543) + **6 piezas dormidas del lore** = **128 filas**.
- Sellos de lo medido (las filas en PR cuentan como NO_DATA): **LIVE 68 · STALE 3 · NO_DATA 47 · unbuilt_mechanic 4**; con las 6 dormidas, **unbuilt_mechanic 10**.
- Toque < 44 px en `main`: **23 de 108** piezas visibles (sobre todo enlaces de salto «Skip to…», «← PreceptorOS», enlaces del pie y regiones de estado de una línea).

## Hallazgos medidos (se anotan, no se tocan: están bajo `public/`)

1. **`/creation.html` lanza 4 excepciones al cargar**: `Cannot read properties of undefined (reading 'TABLA' | 'NEUTRAL' | 'FRONT_DOOR')`. Causa leída en la fuente: `public/creation.html:49-51` carga `comic_tokens.js` **antes** que `tabla_semantica.js`, y `comic_tokens.js:3-4` lee `raiz.AtlasSemantica.TABLA` al evaluarse. La cadena arrastra a `comic_accents.js`, `bubble_paint.js` y `creation_flow.js`. «Load local voice files» y «Create my key» se pulsan sin cambio de DOM medido.
2. **`/openworld/` · «Check live nodes»** (`#world-refresh`) pide `/api/world-state` y recibe **404** en el sitio estático: la pieza existe y su fuente no.
3. **`/openworld/` · «Radio»** (pestaña de `#radio-chat`) no cambia el DOM al pulsarla; Echoes y Conversation sí.
4. **#545 · pestaña «Army»** (`#tab-army`) no cambia el DOM medido al pulsarla en la rama; «Summons» no se pulsó (su nombre casa con la regla de no invocar).
5. **#545 · «Back»** baja a 36×44 en la barra superior (en `main` mide 358×44).
6. **#543** quita de `/openworld/` «Download the browser brain and verify its weights» y lo sustituye por «Download the web node brain and verify it» (`public/game/map_chat.js:11`); no se pulsó (descarga).
7. `/game/army.html` en `main` es solo un enlace a la terminal del mapa compartido: la Army vive ya dentro de `/openworld/`.

## Piezas dormidas del lore (REFRESH DEL LORE, buzón #30, 2026-11-01 10:57Z)

L-074: campamentos, colonización NPC, captura, caravanas entran como estructura viva sujeta a medición, firma y revisión. **Ninguna se declara medida.** No tienen selector porque no existen en la página.

| pieza dormida | marco preceptoros.bubble/1 | B | sello |
|---|---|---|---|
| npc.niebla | `{"v":"preceptoros.bubble/1","id":"lore#npc.niebla","t":0,"atoms":[{"k":"dormida","r":"Edificios NPC fijos en la niebla, revelados solo por actividad de visitantes sin cuenta; hoy fog-push NO_DATA (RC-15), sin ataques NPC."}]}` | 225 | unbuilt_mechanic (L-074: diseño, nunca medido) |
| pared.mensaje | `{"v":"preceptoros.bubble/1","id":"lore#pared.mensaje","t":0,"atoms":[{"k":"dormida","r":"Derrotar el reto NPC de un edificio da derecho a un mensaje publico en sus paredes; el letrero de J5 es la pared conquistada. No construido."}]}` | 233 | unbuilt_mechanic (L-074: diseño, nunca medido) |
| ruta.captura | `{"v":"preceptoros.bubble/1","id":"lore#ruta.captura","t":0,"atoms":[{"k":"dormida","r":"Captura de ondas en ruta: desafio firmado, motor determinista, recibo firmado; jamas robo silencioso. No construido."}]}` | 208 | unbuilt_mechanic (L-074: diseño, nunca medido) |
| caravana.firma | `{"v":"preceptoros.bubble/1","id":"lore#caravana.firma","t":0,"atoms":[{"k":"dormida","r":"Caravana de comercio: ruta firmada que puede atacarse y romperse; Boyas de Sonar, Sondas de Eco, Equipos de Cartografia. No construido."}]}` | 229 | unbuilt_mechanic (L-074: diseño, nunca medido) |
| mareas.ruido | `{"v":"preceptoros.bubble/1","id":"lore#mareas.ruido","t":0,"atoms":[{"k":"dormida","r":"Mareas de Ruido: interferencia ambiental, no enemigo inteligente. Diseno L-074, no medido."}]}` | 182 | unbuilt_mechanic (L-074: diseño, nunca medido) |
| campamento.borde | `{"v":"preceptoros.bubble/1","id":"lore#campamento.borde","t":0,"atoms":[{"k":"dormida","r":"L-068 campamentos NPC en los bordes del nodo: DORMIDO hasta firma y balance."}]}` | 172 | unbuilt_mechanic (L-074: diseño, nunca medido) |

## Lo que falta, agrupado por contrato

Nombres **propuestos**, sin firma. Entre paréntesis, cuántas piezas medidas lo necesitan; después, dónde.
Lista generada por las reglas de `REGLAS` en `atlas/inventario_carbono_md.mjs`:

- **caravana.firma/1** (9): /face/basic.html #joy · /face/basic.html #walker · /openworld/ div · /openworld/ p · /openworld/ button · /openworld/ select · /openworld/ #walkers-state
- **radio.canal-repo/1** (8): /openworld/ #radio-chat-alterna · /openworld/ div · /openworld/ button · /openworld/ #radio-chat-no-data · /openworld/ #radio-chat-ecos · /openworld/ #radio-chat-lista
- **gacha.tirada/1** (7): /openworld/ a · /openworld/ #sheet-summons (en PR · pr545) · /openworld/ #sheet-army (en PR · pr545) · /openworld/ a (en PR · pr545) · /openworld/ #tab-summons (en PR · pr545) · /openworld/ #tab-army (en PR · pr545) · /openworld/ a (en PR · pr543)
- **npc.niebla/1** (6): /openworld/ div · /openworld/ button · /openworld/ #surface · /openworld/ #visitor-start · /openworld/ div (en PR · pr545) · /openworld/ button (en PR · pr545)
- **pared.mensaje/1** (6): /openworld/ div · /openworld/ button · /openworld/ #surface · /openworld/ #visitor-start · /openworld/ div (en PR · pr545) · /openworld/ button (en PR · pr545)
- **chat.boca-local/1** (6): /openworld/ #log · /openworld/ #brain-load · /openworld/ #question · /openworld/ button · /openworld/ #brain-load (en PR · pr543)
- **ruta.captura/1** (5): /openworld/ div · /openworld/ button · /openworld/ #surface · /openworld/ div (en PR · pr545) · /openworld/ button (en PR · pr545)
- **chat.boca-hexelion/1** (4): /openworld/ #log · /openworld/ #question · /openworld/ button
- **aduana.entrega/1** (3): /aduana/ button · /aduana/ #catalogo-carga · /aduana/ #catalogo
- **creacion.firma/1** (3): /creation.html button · /creation.html #sign-creation
- **sonido.coordenada/1** (3): /creation.html #listen-statement · /openworld/ #listen · /openworld/ #sheet-news (en PR · pr545)
- **mundo.estado-estatico/1** (3): /openworld/ #surface · /openworld/ #world-refresh · /openworld/ #sheet-news (en PR · pr545)
- **release.binario/1** (2): /get-the-app/ button
- **cerebro.pesos-verificados/1** (2): /openworld/ #brain-load · /openworld/ #brain-load (en PR · pr543)
- **noticias.feed/1** (2): /openworld/ #sheet-news (en PR · pr545) · /openworld/ #tab-news (en PR · pr545)

### Qué haría cada contrato (una línea, para que la Mesa elija)

| contrato | qué cerraría | lore / doctrina |
|---|---|---|
| `chat.boca-local/1` | la boca del chat del mapa con el cerebro descargado en el navegador (`#question`, Send, `#log`) | A2A: el chat de texto es el denominador común |
| `chat.boca-hexelion/1` | la misma boca hablando con el pilar Hexelion cuando está en línea; si cae, NO_DATA declarado | §2.4 «si el pilar cae, el mapa sigue» |
| `cerebro.pesos-verificados/1` | huella de los pesos que baja `#brain-load` (hoy dos textos distintos en main y #543) | sensores honestos |
| `radio.canal-repo/1` | el canal global que hoy dice «NO_DATA · global chat has no tested repository channel» | 4 capas de audio |
| `mundo.estado-estatico/1` | sustituir `/api/world-state` (404) por un fichero estático firmado | sin servidor |
| `gacha.tirada/1` | Summons/Army sobre el mapa (#545) con la tirada y la adopción firmadas | HITL |
| `npc.niebla/1` | edificios NPC en la niebla revelados por visitantes sin cuenta | §1, unbuilt (RC-15) |
| `pared.mensaje/1` | mensaje público en la pared del edificio conquistado | §2.1 |
| `ruta.captura/1` | captura de ondas en ruta con recibo firmado | §2.3 |
| `caravana.firma/1` | ruta de caravana firmada, atacable, revocable; los caminantes efímeros (`#joy`, `#walkers-state`) serían su cuerpo visible | §3 |
| `noticias.feed/1` | la hoja News de #545, hoy un collage de piezas existentes | — |
| `sonido.coordenada/1` | «Listen…» con su sonido o su NO_DATA sonoro en cada pieza | D4 (PROPUESTA) |
| `aduana.entrega/1` · `release.binario/1` · `creacion.firma/1` | los botones deshabilitados de Aduana, Get the app y Creation | — |

### Los cinco primeros por piezas que desbloquean

1. `caravana.firma/1` (9)
2. `radio.canal-repo/1` (8)
3. `gacha.tirada/1` (7)
4. `npc.niebla/1` (6) — empatado con `pared.mensaje/1` (6) y `chat.boca-local/1` (6)
5. `ruta.captura/1` (5)

Contradicción que se conserva: el recuento premia a `caravana.firma/1` porque las reglas asocian los caminantes efímeros a la caravana; el lore pone delante lo jugable sin mecánicas dormidas (conquista de sesión, gacha, duelos visitante vs NPC). Por uso, `chat.boca-local/1` y `gacha.tirada/1` son lo que el carbono toca primero.

## Cómo repetirlo

```
node atlas/inventario_carbono.mjs public main > main.json
git archive -o pr.tar origin/<rama> public && mkdir pr && tar -xf pr.tar -C pr
node atlas/inventario_carbono.mjs pr/public pr > pr.json
node atlas/inventario_carbono_md.mjs main.json pr.json > tabla.md
```

## Tablas por página

### /aduana/ 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > a.skip` · public/aduana/index.html:20 | Skip to the card checker | 179×25 (no) | `{"v":"preceptoros.bubble/1","id":"/aduana/#1","t":0,"atoms":[{"k":"pieza","r":"a «Skip to the card checker» en /aduana/: LIVE, toque <44 px."}]}` | 146 | LIVE | — |
| 2 | `body > main.guide > p:nth-of-type(1) > a` · public/aduana/index.html:22 | ← PreceptorOS | 115×22 (no) | `{"v":"preceptoros.bubble/1","id":"/aduana/#2","t":0,"atoms":[{"k":"pieza","r":"a «← PreceptorOS» en /aduana/: LIVE, toque <44 px."}]}` | 137 | LIVE | — |
| 3 | `#pasos > tbody > tr:nth-of-type(1) > td:nth-of-type(3) > a` · public/aduana/index.html:27 | Get the app | 144×43 (no) | `{"v":"preceptoros.bubble/1","id":"/aduana/#3","t":0,"atoms":[{"k":"pieza","r":"a «Get the app» en /aduana/: LIVE, toque <44 px."}]}` | 133 | LIVE | — |
| 4 | `#comprueba > section > button.boton-sec:nth-of-type(1)` · public/game/node_preview.js:4 | Choose local file | 154×45 (si) | `{"v":"preceptoros.bubble/1","id":"/aduana/#4","t":0,"atoms":[{"k":"pieza","r":"button «Choose local file» en /aduana/: NO_DATA."}]}` | 133 | NO_DATA (causa: el clic no cambia el DOM medido) | — |
| 5 | `#comprueba > section > button.boton-sec:nth-of-type(2)` · public/game/node_preview.js:4 | Review file | 111×45 (si) | `{"v":"preceptoros.bubble/1","id":"/aduana/#5","t":0,"atoms":[{"k":"pieza","r":"button «Review file» en /aduana/: NO_DATA."}]}` | 127 | NO_DATA (causa: requiere paso previo; deshabilitado al cargar) | — |
| 6 | `#comprueba > section > input` · NO_DATA (generado en tiempo de ejecucion) | — | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/aduana/#6","t":0,"atoms":[{"k":"pieza","r":"input «#comprueba > section > input» en /aduana/: NO_DATA."}]}` | 143 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 7 | `#comprueba > section > p` · NO_DATA (generado en tiempo de ejecucion) | Choose locally, then review with a second click. | 358×25 (no) | `{"v":"preceptoros.bubble/1","id":"/aduana/#7","t":0,"atoms":[{"k":"pieza","r":"p «Choose locally, then review with a second click.» en /aduana/: LIVE, toque <44 px."}]}` | 170 | LIVE | — |
| 8 | `#comprueba > section > button.boton-sec:nth-of-type(3)` · public/game/node_preview.js:4 | Delivery awaits approval; disabled. | 291×45 (si) | `{"v":"preceptoros.bubble/1","id":"/aduana/#8","t":0,"atoms":[{"k":"pieza","r":"button «Delivery awaits approval; disabled.» en /aduana/: unbuilt_mechanic."}]}` | 160 | unbuilt_mechanic | aduana.entrega/1 |
| 9 | `#catalogo-carga` · public/aduana/index.html:39 | Load the catalogue | 129×21 (no) | `{"v":"preceptoros.bubble/1","id":"/aduana/#catalogo-carga","t":0,"atoms":[{"k":"pieza","r":"button «Load the catalogue» en /aduana/: unbuilt_mechanic, toque <44 px."}]}` | 170 | unbuilt_mechanic | aduana.entrega/1 |
| 10 | `#catalogo` · public/aduana/index.html:40 | NodeStateCauseReceivedReceipt | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/aduana/#catalogo","t":0,"atoms":[{"k":"pieza","r":"table «NodeStateCauseReceivedReceipt» en /aduana/: NO_DATA."}]}` | 151 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | aduana.entrega/1 |
| 11 | `body > main.guide > details.tech` · public/aduana/index.html:41 | Technical details | 358×47 (si) | `{"v":"preceptoros.bubble/1","id":"/aduana/#11","t":0,"atoms":[{"k":"pieza","r":"details «Technical details» en /aduana/: LIVE."}]}` | 132 | LIVE | — |
| 12 | `body > main.guide > details.tech > summary` · public/aduana/index.html:41 | Technical details | 358×47 (si) | `{"v":"preceptoros.bubble/1","id":"/aduana/#12","t":0,"atoms":[{"k":"pieza","r":"summary «Technical details» en /aduana/: LIVE."}]}` | 132 | LIVE | — |

### /creation.html 

Errores de consola al cargar: exception: TypeError: Cannot read properties of undefined (reading 'TABLA') · exception: TypeError: Cannot read properties of undefined (reading 'NEUTRAL') · exception: TypeError: Cannot read properties of undefined (reading 'FRONT_DOOR') · exception: TypeError: Cannot read properties of undefined (reading 'FRONT_DOOR').

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `#identity > button.leve.identity-icono` · public/assets/auth.js:188 | Create my key | 326×316 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#1","t":0,"atoms":[{"k":"pieza","r":"button «Create my key» en /creation.html: NO_DATA."}]}` | 141 | NO_DATA (causa: el clic no cambia el DOM medido) | creacion.firma/1 |
| 2 | `#creation-description` · public/creation.html:26 | — | 376×78 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#creation-description","t":0,"atoms":[{"k":"pieza","r":"textarea «#creation-description» en /creation.html: LIVE."}]}` | 167 | LIVE | — |
| 3 | `#voice-catalog-file` · public/creation.html:27 | — | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#voice-catalog-file","t":0,"atoms":[{"k":"pieza","r":"input «#voice-catalog-file» en /creation.html: LIVE."}]}` | 160 | LIVE | — |
| 4 | `#voice-declaration-file` · public/creation.html:28 | — | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#voice-declaration-file","t":0,"atoms":[{"k":"pieza","r":"input «#voice-declaration-file» en /creation.html: LIVE."}]}` | 168 | LIVE | — |
| 5 | `#voice-audio-file` · public/creation.html:29 | — | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#voice-audio-file","t":0,"atoms":[{"k":"pieza","r":"input «#voice-audio-file» en /creation.html: LIVE."}]}` | 156 | LIVE | — |
| 6 | `#load-voice` · public/creation.html:30 | Load local voice files | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#load-voice","t":0,"atoms":[{"k":"pieza","r":"button «Load local voice files» en /creation.html: NO_DATA."}]}` | 159 | NO_DATA (causa: el clic no cambia el DOM medido) | — |
| 7 | `#voice-status` · public/creation.html:31 | Voice guidance is not loaded. | 376×24 (no) | `{"v":"preceptoros.bubble/1","id":"/creation.html#voice-status","t":0,"atoms":[{"k":"pieza","r":"p «Voice guidance is not loaded.» en /creation.html: LIVE, toque <44 px."}]}` | 174 | LIVE | — |
| 8 | `#listen-statement` · public/creation.html:33 | Listen to author statement | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#listen-statement","t":0,"atoms":[{"k":"pieza","r":"button «Listen to author statement» en /creation.html: NO_DATA."}]}` | 169 | NO_DATA (causa: requiere paso previo; deshabilitado al cargar) | sonido.coordenada/1 |
| 9 | `#sign-creation` · public/creation.html:34 | Sign drawing and statement | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#sign-creation","t":0,"atoms":[{"k":"pieza","r":"button «Sign drawing and statement» en /creation.html: NO_DATA."}]}` | 166 | NO_DATA (causa: requiere paso previo; deshabilitado al cargar) | creacion.firma/1 |
| 10 | `#download-creation` · public/creation.html:35 | Download creation | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#download-creation","t":0,"atoms":[{"k":"pieza","r":"button «Download creation» en /creation.html: NO_DATA."}]}` | 161 | NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | — |
| 11 | `#creation-status` · public/creation.html:36 | Nothing signed. | 376×24 (no) | `{"v":"preceptoros.bubble/1","id":"/creation.html#creation-status","t":0,"atoms":[{"k":"pieza","r":"p «Nothing signed.» en /creation.html: LIVE, toque <44 px."}]}` | 163 | LIVE | — |
| 12 | `#reader-panel` · public/creation.html:38 | Verified creation Choose a creation file to verify. Creation package | 376×402 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#reader-panel","t":0,"atoms":[{"k":"pieza","r":"section «Verified creation Choose a creation file to verify. Creation» en /creation.html: NO_DATA."}]}` | 200 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 13 | `#reader-status` · public/creation.html:40 | Choose a creation file to verify. | 376×24 (no) | `{"v":"preceptoros.bubble/1","id":"/creation.html#reader-status","t":0,"atoms":[{"k":"pieza","r":"p «Choose a creation file to verify.» en /creation.html: LIVE, toque <44 px."}]}` | 179 | LIVE | — |
| 14 | `#creation-file` · public/creation.html:41 | — | 376×44 (si) | `{"v":"preceptoros.bubble/1","id":"/creation.html#creation-file","t":0,"atoms":[{"k":"pieza","r":"input «#creation-file» en /creation.html: LIVE."}]}` | 150 | LIVE | — |
| 15 | `body > footer.honest-footer > a` · public/creation.html:46 | Home | 78×38 (no) | `{"v":"preceptoros.bubble/1","id":"/creation.html#15","t":0,"atoms":[{"k":"pieza","r":"a «Home» en /creation.html: LIVE, toque <44 px."}]}` | 139 | LIVE | — |
| 16 | `#identity-menu > button.boton` · public/assets/auth.js:188 | Create my key | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/creation.html#16","t":0,"atoms":[{"k":"pieza","r":"button «Create my key» en /creation.html: NO_DATA."}]}` | 142 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | creacion.firma/1 |

### /face/atlantis.html 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > main > p:nth-of-type(1)` · NO_DATA (generado en tiempo de ejecucion) | This test page was retired on 2026-11-01. Its code is kept, unserved,  | 374×36 (no) | `{"v":"preceptoros.bubble/1","id":"/face/atlantis.html#1","t":0,"atoms":[{"k":"pieza","r":"p «This test page was retired on 2026-11-01. Its code is kept, » en /face/atlantis.html: STALE, toque <44 px."}]}` | 205 | STALE (lapida: pagina retirada el 2026-11-01, sigue servida) | — |
| 2 | `body > main > p:nth-of-type(2) > a:nth-of-type(1)` · public/face/atlantis.html:17 | Open the map | 90×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/atlantis.html#2","t":0,"atoms":[{"k":"pieza","r":"a «Open the map» en /face/atlantis.html: LIVE."}]}` | 142 | LIVE | — |
| 3 | `body > main > p:nth-of-type(2) > a:nth-of-type(2)` · public/face/atlantis.html:17 | Open the shared map terminal | 193×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/atlantis.html#3","t":0,"atoms":[{"k":"pieza","r":"a «Open the shared map terminal» en /face/atlantis.html: LIVE."}]}` | 158 | LIVE | — |

### /face/basic.html 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `#map` · public/face/basic.html:16 | Shared OpenWorld colony map. Colony: 1 nodes · 1 buildings · 1 bots wi | 390×844 (si) | `{"v":"preceptoros.bubble/1","id":"/face/basic.html#map","t":0,"atoms":[{"k":"pieza","r":"canvas «Shared OpenWorld colony map. Colony: 1 nodes · 1 buildings ·» en /face/basic.html: LIVE."}]}` | 193 | LIVE | — |
| 2 | `#state` · public/face/basic.html:18 | Colony: 1 nodes · 1 buildings · 1 bots with faces · sky #f4ebd0 · walk | 334×45 (si) | `{"v":"preceptoros.bubble/1","id":"/face/basic.html#state","t":0,"atoms":[{"k":"pieza","r":"p «Colony: 1 nodes · 1 buildings · 1 bots with faces · sky #f4e» en /face/basic.html: LIVE."}]}` | 191 | LIVE | — |
| 3 | `#joy` · public/face/basic.html:19 | Colony joystick. Drag to walk between LIVE or STALE nodes. Arrow keys  | 132×132 (si) | `{"v":"preceptoros.bubble/1","id":"/face/basic.html#joy","t":0,"atoms":[{"k":"pieza","r":"canvas «Colony joystick. Drag to walk between LIVE or STALE nodes. A» en /face/basic.html: LIVE."}]}` | 191 | LIVE | caravana.firma/1 |
| 4 | `#walker` · public/face/basic.html:20 | Ephemeral walker: cabin · not node state · seal NO_DATA. | 334×45 (si) | `{"v":"preceptoros.bubble/1","id":"/face/basic.html#walker","t":0,"atoms":[{"k":"pieza","r":"p «Ephemeral walker: cabin · not node state · seal NO_DATA.» en /face/basic.html: LIVE."}]}` | 187 | LIVE | caravana.firma/1 |
| 5 | `body > main > footer.honest-footer > a` · public/face/basic.html:20 | Open the shared map | 164×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/basic.html#5","t":0,"atoms":[{"k":"pieza","r":"a «Open the shared map» en /face/basic.html: LIVE."}]}` | 143 | LIVE | — |

### /face/ 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > main > nav > a.world` · public/face/index.html:36 | Open the map The global map and the tutorial cabin. | 358×76 (si) | `{"v":"preceptoros.bubble/1","id":"/face/#1","t":0,"atoms":[{"k":"pieza","r":"a «Open the map The global map and the tutorial cabin.» en /face/: LIVE."}]}` | 155 | LIVE | — |
| 2 | `body > main > footer > p:nth-of-type(2) > a` · public/face/index.html:38 | Home | 41×19 (no) | `{"v":"preceptoros.bubble/1","id":"/face/#2","t":0,"atoms":[{"k":"pieza","r":"a «Home» en /face/: LIVE, toque <44 px."}]}` | 122 | LIVE | — |

### /face/walker.html 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > main > p:nth-of-type(1)` · NO_DATA (generado en tiempo de ejecucion) | This test page was retired on 2026-11-01. Its code is kept, unserved,  | 374×36 (no) | `{"v":"preceptoros.bubble/1","id":"/face/walker.html#1","t":0,"atoms":[{"k":"pieza","r":"p «This test page was retired on 2026-11-01. Its code is kept, » en /face/walker.html: STALE, toque <44 px."}]}` | 201 | STALE (lapida: pagina retirada el 2026-11-01, sigue servida) | — |
| 2 | `body > main > p:nth-of-type(2) > a:nth-of-type(1)` · public/face/walker.html:17 | Open the map | 90×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/walker.html#2","t":0,"atoms":[{"k":"pieza","r":"a «Open the map» en /face/walker.html: LIVE."}]}` | 138 | LIVE | — |
| 3 | `body > main > p:nth-of-type(2) > a:nth-of-type(2)` · public/face/walker.html:17 | Open the shared map terminal | 193×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/walker.html#3","t":0,"atoms":[{"k":"pieza","r":"a «Open the shared map terminal» en /face/walker.html: LIVE."}]}` | 154 | LIVE | — |

### /face/zombie.html 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > main > p:nth-of-type(1)` · NO_DATA (generado en tiempo de ejecucion) | This test page was retired on 2026-11-01. Its code is kept, unserved,  | 374×36 (no) | `{"v":"preceptoros.bubble/1","id":"/face/zombie.html#1","t":0,"atoms":[{"k":"pieza","r":"p «This test page was retired on 2026-11-01. Its code is kept, » en /face/zombie.html: STALE, toque <44 px."}]}` | 201 | STALE (lapida: pagina retirada el 2026-11-01, sigue servida) | — |
| 2 | `body > main > p:nth-of-type(2) > a:nth-of-type(1)` · public/face/zombie.html:17 | Open the map | 90×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/zombie.html#2","t":0,"atoms":[{"k":"pieza","r":"a «Open the map» en /face/zombie.html: LIVE."}]}` | 138 | LIVE | — |
| 3 | `body > main > p:nth-of-type(2) > a:nth-of-type(2)` · public/face/zombie.html:17 | Open the shared map terminal | 193×44 (si) | `{"v":"preceptoros.bubble/1","id":"/face/zombie.html#3","t":0,"atoms":[{"k":"pieza","r":"a «Open the shared map terminal» en /face/zombie.html: LIVE."}]}` | 154 | LIVE | — |

### /game/army.html 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > main > a` · public/game/army.html:19 | Open the shared map terminal | 278×52 (si) | `{"v":"preceptoros.bubble/1","id":"/game/army.html#1","t":0,"atoms":[{"k":"pieza","r":"a «Open the shared map terminal» en /game/army.html: LIVE."}]}` | 150 | LIVE | — |

### /get-the-app/ 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > a.skip` · public/get-the-app/index.html:20 | Skip to the steps | 124×25 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#1","t":0,"atoms":[{"k":"pieza","r":"a «Skip to the steps» en /get-the-app/: LIVE, toque <44 px."}]}` | 149 | LIVE | — |
| 2 | `body > main.guide > p:nth-of-type(1) > a` · public/get-the-app/index.html:22 | ← PreceptorOS | 115×22 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#2","t":0,"atoms":[{"k":"pieza","r":"a «← PreceptorOS» en /get-the-app/: LIVE, toque <44 px."}]}` | 147 | LIVE | — |
| 3 | `#gate-carriles > li.gate-carril:nth-of-type(1) > button.gate-boton` · public/game/launch_gate.js:25 | Install the web app | 175×45 (si) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#3","t":0,"atoms":[{"k":"pieza","r":"button «Install the web app» en /get-the-app/: NO_DATA."}]}` | 145 | NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | — |
| 4 | `#gate-carriles > li.gate-carril:nth-of-type(2) > button.gate-boton` · public/assets/intro.js:20 | Install the app | 140×45 (si) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#4","t":0,"atoms":[{"k":"pieza","r":"button «Install the app» en /get-the-app/: unbuilt_mechanic."}]}` | 150 | unbuilt_mechanic | release.binario/1 |
| 5 | `#gate-carriles > li.gate-carril:nth-of-type(3) > button.gate-boton` · NO_DATA (generado en tiempo de ejecucion) | Download mini | 145×45 (si) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#5","t":0,"atoms":[{"k":"pieza","r":"button «Download mini» en /get-the-app/: unbuilt_mechanic."}]}` | 148 | unbuilt_mechanic | release.binario/1 |
| 6 | `body > main.guide > ol:nth-of-type(1) > li:nth-of-type(1) > a` · public/get-the-app/index.html:41 | install.sh | 67×22 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#6","t":0,"atoms":[{"k":"pieza","r":"a «install.sh» en /get-the-app/: NO_DATA, toque <44 px."}]}` | 145 | NO_DATA (causa: enlace externo no seguido) | — |
| 7 | `body > main.guide > ol:nth-of-type(2) > li:nth-of-type(1) > a` · public/get-the-app/index.html:48 | install.ps1 | 76×22 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#7","t":0,"atoms":[{"k":"pieza","r":"a «install.ps1» en /get-the-app/: NO_DATA, toque <44 px."}]}` | 146 | NO_DATA (causa: enlace externo no seguido) | — |
| 8 | `body > main.guide > p:nth-of-type(4) > a` · public/get-the-app/index.html:52 | INSTALACION_ANDROID.md | 212×22 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#8","t":0,"atoms":[{"k":"pieza","r":"a «INSTALACION_ANDROID.md» en /get-the-app/: NO_DATA, toque <44 px."}]}` | 157 | NO_DATA (causa: enlace externo no seguido) | — |
| 9 | `body > main.guide > p.get-app:nth-of-type(5) > a` · public/get-the-app/index.html:53 | Next: create a node | 182×49 (si) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#9","t":0,"atoms":[{"k":"pieza","r":"a «Next: create a node» en /get-the-app/: LIVE."}]}` | 137 | LIVE | — |
| 10 | `body > main.guide > details.tech` · public/get-the-app/index.html:56 | Technical details | 358×47 (si) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#10","t":0,"atoms":[{"k":"pieza","r":"details «Technical details» en /get-the-app/: LIVE."}]}` | 142 | LIVE | — |
| 11 | `body > main.guide > details.tech > summary` · public/get-the-app/index.html:56 | Technical details | 358×47 (si) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#11","t":0,"atoms":[{"k":"pieza","r":"summary «Technical details» en /get-the-app/: LIVE."}]}` | 142 | LIVE | — |
| 12 | `body > main.guide > details.tech > p > a:nth-of-type(1)` · public/get-the-app/index.html:56 | /release.json | 83×20 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#12","t":0,"atoms":[{"k":"pieza","r":"a «/release.json» en /get-the-app/: LIVE, toque <44 px."}]}` | 146 | LIVE | — |
| 13 | `body > main.guide > details.tech > p > a:nth-of-type(2)` · NO_DATA (generado en tiempo de ejecucion) | https://github.com/piskyRpapalo/PreceptorOS/releases/tag/v1.3 | 217×20 (no) | `{"v":"preceptoros.bubble/1","id":"/get-the-app/#13","t":0,"atoms":[{"k":"pieza","r":"a «https://github.com/piskyRpapalo/PreceptorOS/releases/tag/v1.» en /get-the-app/: NO_DATA, toque <44 px."}]}` | 196 | NO_DATA (causa: enlace externo no seguido) | — |

### / 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > a.skip` · public/index.html:31 | Skip to the doors | 127×25 (no) | `{"v":"preceptoros.bubble/1","id":"/#1","t":0,"atoms":[{"k":"pieza","r":"a «Skip to the doors» en /: LIVE, toque <44 px."}]}` | 125 | LIVE | — |
| 2 | `#doors > a.door` · public/index.html:37 | OpenWorld The map and the chat, side by side. Your node's world. | 358×164 (si) | `{"v":"preceptoros.bubble/1","id":"/#2","t":0,"atoms":[{"k":"pieza","r":"a «OpenWorld The map and the chat, side by side. Your node's wo» en /: LIVE."}]}` | 154 | LIVE | — |
| 3 | `#doors > a.door > canvas.door-art` · NO_DATA (generado en tiempo de ejecucion) | — | 320×96 (si) | `{"v":"preceptoros.bubble/1","id":"/#3","t":0,"atoms":[{"k":"pieza","r":"canvas «#doors > a.door > canvas.door-art» en /: LIVE."}]}` | 132 | LIVE | — |
| 4 | `#door-tools` · public/index.html:38 | Tools Install the app on this device with one click. | 358×139 (si) | `{"v":"preceptoros.bubble/1","id":"/#door-tools","t":0,"atoms":[{"k":"pieza","r":"button «Tools Install the app on this device with one click.» en /: NO_DATA."}]}` | 163 | NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | — |
| 5 | `#door-tools > canvas.door-art` · NO_DATA (generado en tiempo de ejecucion) | — | 320×96 (si) | `{"v":"preceptoros.bubble/1","id":"/#5","t":0,"atoms":[{"k":"pieza","r":"canvas «#door-tools > canvas.door-art» en /: LIVE."}]}` | 128 | LIVE | — |
| 6 | `#tools-dispositivo` · public/index.html:40 | Tools Close tools Device and download Linux and macOS: the installer a | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#tools-dispositivo","t":0,"atoms":[{"k":"pieza","r":"section «Tools Close tools Device and download Linux and macOS: the i» en /: NO_DATA."}]}` | 179 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 7 | `#close-tools` · public/index.html:42 | Close tools | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#close-tools","t":0,"atoms":[{"k":"pieza","r":"button «Close tools» en /: NO_DATA."}]}` | 123 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 8 | `#tools-dispositivo > details` · NO_DATA (generado en tiempo de ejecucion) | Device and download Linux and macOS: the installer and its fingerprint | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#8","t":0,"atoms":[{"k":"pieza","r":"details «Device and download Linux and macOS: the installer and its f» en /: NO_DATA."}]}` | 163 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 9 | `#tools-dispositivo > details > summary` · public/index.html:44 | Device and download | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#9","t":0,"atoms":[{"k":"pieza","r":"summary «Device and download» en /: NO_DATA."}]}` | 122 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 10 | `#tools-dispositivo > details > ul.dispositivos > li:nth-of-type(1) > a` · NO_DATA (generado en tiempo de ejecucion) | Linux and macOS: the installer and its fingerprint | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#10","t":0,"atoms":[{"k":"pieza","r":"a «Linux and macOS: the installer and its fingerprint» en /: LIVE."}]}` | 145 | LIVE | — |
| 11 | `#tools-dispositivo > details > ul.dispositivos > li:nth-of-type(2) > a` · public/index.html:47 | Windows: the PowerShell installer | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#11","t":0,"atoms":[{"k":"pieza","r":"a «Windows: the PowerShell installer» en /: LIVE."}]}` | 128 | LIVE | — |
| 12 | `#tools-dispositivo > details > ul.dispositivos > li:nth-of-type(3) > a` · public/index.html:48 | Android: the Termux guide | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#12","t":0,"atoms":[{"k":"pieza","r":"a «Android: the Termux guide» en /: LIVE."}]}` | 120 | LIVE | — |
| 13 | `#tools-dispositivo > details > ul.dispositivos > li:nth-of-type(4) > a` · NO_DATA (generado en tiempo de ejecucion) | Creation studio: draw a ribbon and sign it | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/#13","t":0,"atoms":[{"k":"pieza","r":"a «Creation studio: draw a ribbon and sign it» en /: LIVE."}]}` | 137 | LIVE | — |

### /openworld/ 

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `body > a.skip` · public/openworld/index.html:57 | Skip to the chat | 116×25 (no) | `{"v":"preceptoros.bubble/1","id":"/openworld/#1","t":0,"atoms":[{"k":"pieza","r":"a «Skip to the chat» en /openworld/: LIVE, toque <44 px."}]}` | 144 | LIVE | — |
| 2 | `#map > a` · public/openworld/index.html:60 | Back | 358×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#2","t":0,"atoms":[{"k":"pieza","r":"a «Back» en /openworld/: LIVE."}]}` | 118 | LIVE | — |
| 3 | `#map > div.press:nth-of-type(1)` · public/openworld/index.html:62 | Terrains | 358×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#3","t":0,"atoms":[{"k":"pieza","r":"div «Terrains» en /openworld/: LIVE."}]}` | 124 | LIVE | npc.niebla/1, pared.mensaje/1, ruta.captura/1 |
| 4 | `#map > div.press:nth-of-type(1) > button` · public/openworld/index.html:63 | Tutorial cabin | 134×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#4","t":0,"atoms":[{"k":"pieza","r":"button «Tutorial cabin» en /openworld/: LIVE."}]}` | 133 | LIVE | npc.niebla/1, pared.mensaje/1, ruta.captura/1 |
| 5 | `#joy > div` · public/game/colony_controls.js:76 | Terminal and tutorial | 334×236 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#5","t":0,"atoms":[{"k":"pieza","r":"div «Terminal and tutorial» en /openworld/: LIVE."}]}` | 137 | LIVE | caravana.firma/1 |
| 6 | `#joy > div > div:nth-of-type(1)` · NO_DATA (generado en tiempo de ejecucion) | Move your character: drag inside the circle, let go to walk | 168×168 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#6","t":0,"atoms":[{"k":"pieza","r":"div «Move your character: drag inside the circle, let go to walk» en /openworld/: LIVE."}]}` | 175 | LIVE | caravana.firma/1 |
| 7 | `#joy > div > p.state` · public/openworld/index.html:70 | — | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#7","t":0,"atoms":[{"k":"pieza","r":"p «#joy > div > p.state» en /openworld/: NO_DATA."}]}` | 137 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | caravana.firma/1 |
| 8 | `#joy > div > div:nth-of-type(2)` · public/openworld/index.html:63 | Tutorial | 106×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#8","t":0,"atoms":[{"k":"pieza","r":"div «Tutorial» en /openworld/: LIVE."}]}` | 124 | LIVE | caravana.firma/1 |
| 9 | `#joy > div > div:nth-of-type(2) > button` · public/game/colony_controls.js:91 | Skip tutorial | 106×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#9","t":0,"atoms":[{"k":"pieza","r":"button «Skip tutorial» en /openworld/: LIVE."}]}` | 132 | LIVE | caravana.firma/1 |
| 10 | `#joy > div > select` · public/face/face_openworld_terminal.js:85 | Terminal look | 132×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#10","t":0,"atoms":[{"k":"pieza","r":"select «Terminal look» en /openworld/: LIVE."}]}` | 133 | LIVE | caravana.firma/1 |
| 11 | `#surface` · public/openworld/index.html:66 | The global map: tutorial cabin and live nodes | 358×240 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#surface","t":0,"atoms":[{"k":"pieza","r":"canvas «The global map: tutorial cabin and live nodes» en /openworld/: LIVE."}]}` | 170 | LIVE | mundo.estado-estatico/1, npc.niebla/1, pared.mensaje/1, ruta.captura/1 |
| 12 | `#zoom-controls` · public/game/openworld_page.js:32 | Map zoom | 358×60 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#zoom-controls","t":0,"atoms":[{"k":"pieza","r":"div «Map zoom» en /openworld/: LIVE."}]}` | 136 | LIVE | — |
| 13 | `#zoom-in` · public/game/openworld_page.js:35 | Zoom in | 64×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#zoom-in","t":0,"atoms":[{"k":"pieza","r":"button «Zoom in» en /openworld/: LIVE."}]}` | 132 | LIVE | — |
| 14 | `#zoom-out` · public/game/openworld_page.js:35 | Zoom out | 72×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#zoom-out","t":0,"atoms":[{"k":"pieza","r":"button «Zoom out» en /openworld/: LIVE."}]}` | 134 | LIVE | — |
| 15 | `#zoom-reset` · public/game/openworld_page.js:35 | Reset zoom | 87×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#zoom-reset","t":0,"atoms":[{"k":"pieza","r":"button «Reset zoom» en /openworld/: NO_DATA."}]}` | 141 | NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | — |
| 16 | `#zoom-state` · public/game/openworld_page.js:33 | — | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#zoom-state","t":0,"atoms":[{"k":"pieza","r":"p «#zoom-state» en /openworld/: NO_DATA."}]}` | 137 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 17 | `#walkers-state` · public/game/hitl_walkers.js:78 | walker of cabin: building · at cabin · stops cabin | 358×23 (no) | `{"v":"preceptoros.bubble/1","id":"/openworld/#walkers-state","t":0,"atoms":[{"k":"pieza","r":"p «walker of cabin: building · at cabin · stops cabin» en /openworld/: LIVE, toque <44 px."}]}` | 192 | LIVE | caravana.firma/1 |
| 18 | `#listen` · public/openworld/index.html:68 | Listen to the cabin | 170×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#listen","t":0,"atoms":[{"k":"pieza","r":"button «Listen to the cabin» en /openworld/: LIVE."}]}` | 143 | LIVE | sonido.coordenada/1 |
| 19 | `#listen-state` · public/openworld/index.html:70 | — | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#listen-state","t":0,"atoms":[{"k":"pieza","r":"p «#listen-state» en /openworld/: NO_DATA."}]}` | 141 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 20 | `#world-refresh` · public/openworld/index.html:71 | Check live nodes | 358×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#world-refresh","t":0,"atoms":[{"k":"pieza","r":"button «Check live nodes» en /openworld/: NO_DATA."}]}` | 150 | NO_DATA (causa: Failed to load resource: the server responded with a status ) | mundo.estado-estatico/1 |
| 21 | `#state` · public/openworld/index.html:72 | Colony: 1 nodes · 1 buildings · 1 bots with faces · sky #17131f | 358×46 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#state","t":0,"atoms":[{"k":"pieza","r":"p «Colony: 1 nodes · 1 buildings · 1 bots with faces · sky #171» en /openworld/: LIVE."}]}` | 181 | LIVE | — |
| 22 | `#floor-state` · public/openworld/index.html:73 | Map chunks: 7 of 7 around area 0_0. Cabin chunk: 49 water, 77 sand, 54 | 358×68 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#floor-state","t":0,"atoms":[{"k":"pieza","r":"p «Map chunks: 7 of 7 around area 0_0. Cabin chunk: 49 water, 7» en /openworld/: LIVE."}]}` | 184 | LIVE | — |
| 23 | `#map > p:nth-of-type(5) > a` · NO_DATA (generado en tiempo de ejecucion) | Army · NO_DATA: no troops adopted in this visit yet | 358×50 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#23","t":0,"atoms":[{"k":"pieza","r":"a «Army · NO_DATA: no troops adopted in this visit yet» en /openworld/: LIVE."}]}` | 167 | LIVE | gacha.tirada/1 |
| 24 | `#visitor-play > p:nth-of-type(2)` · NO_DATA (generado en tiempo de ejecucion) | — | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#24","t":0,"atoms":[{"k":"pieza","r":"p «#visitor-play > p:nth-of-type(2)» en /openworld/: NO_DATA."}]}` | 150 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | — |
| 25 | `#visitor-start` · public/game/visitor_play.js:25 | Start an ephemeral visit | 156×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#visitor-start","t":0,"atoms":[{"k":"pieza","r":"button «Start an ephemeral visit» en /openworld/: LIVE."}]}` | 155 | LIVE | npc.niebla/1, pared.mensaje/1 |
| 26 | `#log` · public/openworld/index.html:80 | The chat is not live yet: NO_DATA until you download the optional brow | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#log","t":0,"atoms":[{"k":"pieza","r":"ul «The chat is not live yet: NO_DATA until you download the opt» en /openworld/: NO_DATA."}]}` | 180 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | chat.boca-local/1, chat.boca-hexelion/1 |
| 27 | `#brain-load` · public/game/map_chat.js:10 | Download the browser brain and verify its weights | 358×70 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#brain-load","t":0,"atoms":[{"k":"pieza","r":"button «Download the browser brain and verify its weights» en /openworld/: NO_DATA."}]}` | 180 | NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | chat.boca-local/1, cerebro.pesos-verificados/1 |
| 28 | `#question` · public/openworld/index.html:85 | — | 280×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#question","t":0,"atoms":[{"k":"pieza","r":"input «#question» en /openworld/: LIVE."}]}` | 134 | LIVE | chat.boca-local/1, chat.boca-hexelion/1 |
| 29 | `#entry > button` · public/openworld/index.html:86 | Send | 70×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#29","t":0,"atoms":[{"k":"pieza","r":"button «Send» en /openworld/: NO_DATA."}]}` | 127 | NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | chat.boca-local/1, chat.boca-hexelion/1 |
| 30 | `#radio-chat-alterna` · public/assets/radio_message_log.js:115 | ♪ Radio · NO_DATA · Map chunks: 7 of 7 around area 0_0. Cabin chunk: 4 | 354×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#radio-chat-alterna","t":0,"atoms":[{"k":"pieza","r":"button «♪ Radio · NO_DATA · Map chunks: 7 of 7 around area 0_0. Cabi» en /openworld/: LIVE."}]}` | 200 | LIVE | radio.canal-repo/1 |
| 31 | `#radio-chat > div.radio-chat-tabs` · public/assets/radio_message_log.js:121 | Communication channels | 354×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#31","t":0,"atoms":[{"k":"pieza","r":"div «Communication channels» en /openworld/: LIVE."}]}` | 139 | LIVE | radio.canal-repo/1 |
| 32 | `#radio-chat > div.radio-chat-tabs > button.radio-chat-tab:nth-of-type(1)` · public/assets/radio_message_log.js:87 | Echoes | 109×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#32","t":0,"atoms":[{"k":"pieza","r":"button «Echoes» en /openworld/: LIVE."}]}` | 126 | LIVE | radio.canal-repo/1 |
| 33 | `#radio-chat > div.radio-chat-tabs > button.radio-chat-tab:nth-of-type(2)` · public/game/face_terminal.js:16 | Conversation | 109×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#33","t":0,"atoms":[{"k":"pieza","r":"button «Conversation» en /openworld/: LIVE."}]}` | 132 | LIVE | chat.boca-local/1, chat.boca-hexelion/1, radio.canal-repo/1 |
| 34 | `#radio-chat > div.radio-chat-tabs > button.radio-chat-tab:nth-of-type(3)` · public/assets/radio_message_log.js:39 | Radio | 109×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#34","t":0,"atoms":[{"k":"pieza","r":"button «Radio» en /openworld/: NO_DATA."}]}` | 128 | NO_DATA (causa: el clic no cambia el DOM medido) | radio.canal-repo/1 |
| 35 | `#radio-chat-no-data` · public/assets/radio_message_log.js:135 | NO_DATA · global chat has no tested repository channel | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#radio-chat-no-data","t":0,"atoms":[{"k":"pieza","r":"p «NO_DATA · global chat has no tested repository channel» en /openworld/: NO_DATA."}]}` | 189 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | radio.canal-repo/1 |
| 36 | `#radio-chat-ecos` · public/assets/radio_message_log.js:134 | — | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#radio-chat-ecos","t":0,"atoms":[{"k":"pieza","r":"ol «#radio-chat-ecos» en /openworld/: NO_DATA."}]}` | 148 | NO_DATA (causa: oculto/plegado al cargar, 0 px) | radio.canal-repo/1 |
| 37 | `#radio-chat-lista` · public/assets/radio_message_log.js:133 | PreceptorNO_DATAchat · Δ NO_DATA (game cycle unavailable or reset) cyc | 354×338 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#radio-chat-lista","t":0,"atoms":[{"k":"pieza","r":"ol «PreceptorNO_DATAchat · Δ NO_DATA (game cycle unavailable or » en /openworld/: LIVE."}]}` | 192 | LIVE | radio.canal-repo/1 |

### /openworld/ (en PR · pr545)

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `#map > div.topbar:nth-of-type(1) > a` · public/openworld/index.html:84 | Back | 36×44 (no) | `{"v":"preceptoros.bubble/1","id":"/openworld/#1","t":0,"atoms":[{"k":"pieza","r":"a «Back» en /openworld/: LIVE, toque <44 px."}]}` | 132 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | — |
| 2 | `#map > div.topbar:nth-of-type(1) > div.press` · public/openworld/index.html:86 | Terrains | 134×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#2","t":0,"atoms":[{"k":"pieza","r":"div «Terrains» en /openworld/: LIVE."}]}` | 124 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | npc.niebla/1, pared.mensaje/1, ruta.captura/1 |
| 3 | `#map > div.topbar:nth-of-type(1) > div.press > button` · public/openworld/index.html:87 | Tutorial cabin | 134×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#3","t":0,"atoms":[{"k":"pieza","r":"button «Tutorial cabin» en /openworld/: LIVE."}]}` | 133 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | npc.niebla/1, pared.mensaje/1, ruta.captura/1 |
| 4 | `#sheet-news` · public/openworld/index.html:92 | News of the map Listen to the cabin Check live nodes bot of cabin · ba | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#sheet-news","t":0,"atoms":[{"k":"pieza","r":"section «News of the map Listen to the cabin Check live nodes bot of » en /openworld/: NO_DATA."}]}` | 192 | NO_DATA (causa: en PR, no desplegado) · en rama: NO_DATA (causa: oculto/plegado al cargar, 0 px) | mundo.estado-estatico/1, noticias.feed/1, sonido.coordenada/1 |
| 5 | `#sheet-summons` · public/openworld/index.html:100 | Summons Play without a nodeYour visit key stays in memory and ends wit | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#sheet-summons","t":0,"atoms":[{"k":"pieza","r":"section «Summons Play without a nodeYour visit key stays in memory an» en /openworld/: NO_DATA."}]}` | 195 | NO_DATA (causa: en PR, no desplegado) · en rama: NO_DATA (causa: oculto/plegado al cargar, 0 px) | gacha.tirada/1 |
| 6 | `#sheet-army` · public/openworld/index.html:104 | Army Army · NO_DATA: no troops adopted in this visit yet | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#sheet-army","t":0,"atoms":[{"k":"pieza","r":"section «Army Army · NO_DATA: no troops adopted in this visit yet» en /openworld/: NO_DATA."}]}` | 189 | NO_DATA (causa: en PR, no desplegado) · en rama: NO_DATA (causa: oculto/plegado al cargar, 0 px) | gacha.tirada/1 |
| 7 | `#sheet-army > p > a` · NO_DATA (generado en tiempo de ejecucion) | Army · NO_DATA: no troops adopted in this visit yet | 0×0 (n/a) | `{"v":"preceptoros.bubble/1","id":"/openworld/#7","t":0,"atoms":[{"k":"pieza","r":"a «Army · NO_DATA: no troops adopted in this visit yet» en /openworld/: LIVE."}]}` | 166 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | gacha.tirada/1 |
| 8 | `#map > div.tabs:nth-of-type(3)` · public/openworld/index.html:109 | What covers the map | 358×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#8","t":0,"atoms":[{"k":"pieza","r":"div «What covers the map» en /openworld/: LIVE."}]}` | 135 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | — |
| 9 | `#tab-map` · public/openworld/index.html:110 | Map | 85×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#tab-map","t":0,"atoms":[{"k":"pieza","r":"button «Map» en /openworld/: LIVE."}]}` | 128 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | — |
| 10 | `#tab-news` · public/openworld/index.html:111 | News | 85×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#tab-news","t":0,"atoms":[{"k":"pieza","r":"button «News» en /openworld/: LIVE."}]}` | 130 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | noticias.feed/1 |
| 11 | `#tab-summons` · public/openworld/index.html:112 | Summons | 85×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#tab-summons","t":0,"atoms":[{"k":"pieza","r":"button «Summons» en /openworld/: NO_DATA."}]}` | 139 | NO_DATA (causa: en PR, no desplegado) · en rama: NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | gacha.tirada/1 |
| 12 | `#tab-army` · public/openworld/index.html:113 | Army | 85×44 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#tab-army","t":0,"atoms":[{"k":"pieza","r":"button «Army» en /openworld/: NO_DATA."}]}` | 133 | NO_DATA (causa: en PR, no desplegado) · en rama: NO_DATA (causa: el clic no cambia el DOM medido) | gacha.tirada/1 |

### /openworld/ (en PR · pr543)

Errores de consola al cargar: ninguno medido.

| # | pieza (selector · fuente) | texto visible | tamaño (≥44?) | marco preceptoros.bubble/1 | B | sello | falta |
|---|---|---|---|---|---|---|---|
| 1 | `#map > p:nth-of-type(4) > a` · NO_DATA (generado en tiempo de ejecucion) | Army · NO_DATA: no troops adopted in this visit yet | 358×50 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#1","t":0,"atoms":[{"k":"pieza","r":"a «Army · NO_DATA: no troops adopted in this visit yet» en /openworld/: LIVE."}]}` | 166 | NO_DATA (causa: en PR, no desplegado) · en rama: LIVE | gacha.tirada/1 |
| 2 | `#brain-load` · public/game/map_chat.js:11 | Download the web node brain and verify it | 351×45 (si) | `{"v":"preceptoros.bubble/1","id":"/openworld/#brain-load","t":0,"atoms":[{"k":"pieza","r":"button «Download the web node brain and verify it» en /openworld/: NO_DATA."}]}` | 172 | NO_DATA (causa: en PR, no desplegado) · en rama: NO_DATA (causa: firma/envio/descarga no se pulsa en la prueba) | chat.boca-local/1, cerebro.pesos-verificados/1 |

