# PLAN DE RONDA · el refresco · theGame con gráficos renovados · 2026-10-11/12

Preceptor: Claude (Opus 5.5). Estado del plan: **PENDIENTE de tu FIRMO pieza a pieza.** Tu «el plan está firmado, adelante» llegó antes de que existiera este fichero. Lo leo como permiso para construir en ramas locales, con gates verdes y sin push, y no como firma de cada pieza. Cada pieza espera su FIRMO antes de salir del Beelink.

Sellos: MEDIDO (ancla) > DECLARADO (quién, cuándo) > PROPUESTA (coste S/M/L). Lo que no tiene dato va como NO_DATA con su causa.

## 0 · Hecho antes del plan (lo firmaste explícito)
| Paso | Resultado | Sello |
|---|---|---|
| Doctrina del stash rescatada | `juez_fuga`: «no filtra piezas de su plantilla ni repite tu pregunta» → nota del juez (`<private-ref>/memory/torre-estudio-y-juez.md`, sha256: NO_DATA, causa: fichero del repo privado) | MEDIDO · `git stash show -p` antes del drop |
| stash@{0} tirado, regeneraciones descartadas, fast-forward | `main` = `origin/main` = `5b82c31`, árbol limpio | MEDIDO · `git log -1` |
| Regeneración de contadores sobre el árbol nuevo | Dos corridas (n=2) dan las mismas 7 medidas y los mismos 3 NO_DATA que lo commiteado: sha16 sin `ultima_lectura` = `e6fc4890a1d77feb` ×3. **No hay nada que sellar.** Sellar solo la hora subiría `VERSION` del SW y obligaría a cada visitante a recargar la caché sin ningún cambio. Lo dejé sin commit y lo propongo así | MEDIDO |
| Gates en `5b82c31` | test_web 75 OK (1 skip) · test_atlas 110 OK · arnes_sw 22/22 · 13 suites `*_casos` en verde | MEDIDO |
| Micro-tarea `modelos.json` | papel `redactor` añadido (+6 líneas); diff en el informe; **sin commit**, esperando tu vista | MEDIDO · `git diff` |
| Delegación root de 9 h | **NO ACTIVADA**: ninguna pieza de esta ronda necesita sudo. El reloj empieza con el primer comando sudo, y no ha habido ninguno | DECLARADO |

## 1 · Contradicciones abiertas (no las resuelvo en silencio)
- **C1 · Techo por fichero.** Tu orden dice 16 KiB. `EXCEPCIONES.md` (D2, 2026-10-11) lo revocó: hoy `test_web.TOPE_FICHERO` = 25 MiB. **Aplico la regla más estricta, 16 KiB, a todo fichero que creo o toco.** Ya están por encima, desde antes de esta ronda: `thegame.js` 17.646 B y `escena.js` 16.455 B. Si toco uno, lo dejo por debajo.
- **C2 · «ES modules vanilla».** El juego no usa ES modules: son guiones clásicos UMD/IIFE (`window.AtlasX` y `module.exports`) que `thegame.js:pide()` carga en orden. Mezclar `import` crearía un segundo sistema de módulos, que es justo la torre paralela que T0-D prohíbe. **Sigo el patrón UMD.** La migración a ESM la dejo como pieza propuesta (P-ESM, coste L).
- **C3 · «web/bin».** No existe. Los gates reales son `test_web.py`, `atlas/test_atlas.py` y `arnes_sw.mjs` en la raíz, con `bin/sellar.py` (que sustituye a `sw-huella.py`, según la skill sello-del-juego). `doctor.py`, `sw-huella.py` y `coherencia-publica.py` viven en `<private-ref>/bin` (sha256: NO_DATA, causa: ficheros del repo privado), y `gate.sh` es el hook. Uso esos y no fabrico ninguno.
- **C4 · «contenido_v nuevo» (M18-B).** `contenido_v` es del MOTOR (`atlas-motor.js` CATALOGO, que no se toca sin firma) y versiona las **partidas** del piso, a las que el gacha no afecta. La versión del gacha y del Army es `valores.version`, que entra en `arena.packSha` («dos personas con distinto pack_sha no juegan el mismo juego»). **Propuesta:** subo `valores.version` y meto la tabla de aristas en `packSha`. Los duelos y paquetes exportados antes se rechazan con la causa `pack_sha` que ya existe. `contenido_v` no se toca. Necesito tu sí o tu no a esta lectura.
- **C5 · Corpus.** Sonar de Aristas, Gauss 60 %/5 %, Polvo de Taller, Prisma de Bandera, Cap. 1.5 «El Primer Eco», El Navegante, Leviatanes y Ecos de Superficie (`EV_SURFACE_ECHO`) **no están en ideas6oct ni en ideas7oct**. Están en la misma carpeta: `Cuarentena/simbiosis1/6 planes.txt:130-207` y `LEEME.md.txt:1123-1162`. ideas6oct sí dice `:1724` (huevo, «rareza por aristas», «Oscilatorio o Sonar de Aristas», residuo), `:1726` (Taller, la mesa bajo el agua), `:1730` (las ondas SUENAN al nacer y al modificarse), `:694` (Residuo Estático) y `:1736-1760` (mapa como lenguaje de líneas y colores, flechas «tamaño-AI»). ideas7oct `:271/:321` trae el Determinismo Reactivo. **Abzu, terminales cilíndricas/periscopio y bioluminiscencia: NO_DATA en el corpus** (son dirección tuya del 2026-10-11, DECLARADO).

## 2 · Piezas, en orden (MDA: estética → dinámica → mecánica)

Por cada pieza: módulo y puerta, ficheros que toca (para ver colisiones), objetivo MDA, riesgo, test y sabotaje. Una pieza va en una rama, y la rama se convierte en PR cuando firmes.

### R1 · J6 · el mar de fondo en la portada (TU PRIMERA)
- **Módulo:** `public/game/mar-fondo.js` → `AtlasMarFondo.monta(lienzo)`. Sale del **troceo de `mar.js`**: las teselas del terreno, la niebla y la deriva se van de `mar.js` (16.365 B, a 19 B del techo) a este módulo, y `mar.js` lo **usa**. Es el mismo código movido, no un gemelo. La portada pinta el fondo desde la puerta del juego, con una cámara quieta en tu casa (o en Hexelion), detrás de `#juego-panel`.
- **Toca:** `mar.js` (adelgaza), `thegame.js` (carga el fondo en GUIONES; de paso se queda <16 KiB), `thegame.css` (capa fija detrás), `sw-listas.js` (precache), `test_web`/`test_atlas` (pruebas nuevas).
- **MDA:** SENSACIÓN. El mar está ahí antes de que hagas nada; con eso la portada ya cuenta qué juego es. También DESCUBRIMIENTO: la niebla se ve desde el primer segundo.
- **Arreglo que va dentro (optimizador):** la «respiración» M4 de `mar.js` horneaba en cada tesela el desfase del instante en que se generaba. Teselas hechas en momentos distintos quedaban desplazadas: costuras, y nada respiraba. La deriva pasa a la cámara (un offset global por cuadro) y no se hornea.
- **Riesgo:** `gzip_juego_b`. Hoy 80.798 B, el fondo suma unos 3-4 KB gz, muy lejos de 153.600. Los fps en el Doogee son NO_DATA hasta medirlos allí. Con movimiento reducido: un cuadro quieto.
- **Test/sabotaje:** test_atlas exige que `mar.js` no defina teselas propias (una sola fuente) y que `mar-fondo.js` no use `Math.random`/`Date.now`/`fetch`. Sabotaje: un `Math.random` en el fondo da rojo.

### R2 · Estructura · 3 pestañas HOME · MAP · TALLER
- **Puerta:** `thegame.js` `PESTANAS`: `casa`, `mapa`, `taller`. La batalla vive dentro de MAP (`ui-arena.js` ya pinta Map y Battle: se juntan en un panel) y lo de PARTIDA se pliega dentro del terminal J7 (`aiact-art50-crab-terminal.js`), como firmaste. **Te lo reflejo aquí para que lo firmes.**
- **HOME:** la **rejilla de edificios se RETIRA en el mismo PR**: botones, `PARCELAS` y `pintaBotones` de `home_buildings.js`/`home_base_scene.js`. Los edificios pasan a ser **partes del cuerpo del cangrejo** (`gdpr-art25-ephemeral-crab.js`): caparazón = Núcleo, pinzas = Army, patas = Bosque, ojos = Faro, festón = Taller. Crecen con el tiempo de partida y las unidades, y bajan si bajan. Cada parte es un botón del DOM sobre su sitio en la onda y abre la pantalla completa de sus ondas y estadísticas. El dato ya lo da `medidas()`; solo cambia el sitio donde se pinta.
- **Movimiento = enum del piloto (una lista):** `atlas-piloto.js` `ACCIONES` gana `mover` con `dir ∈ {izq, arr, aba, der, casa}`, y `data/atlas_accion_schema.json` igual. Las flechas de `mar.js` se construyen **desde esa lista**. El motor no recibe `mover`: lo despacha la cámara. Con eso la misma flecha mueve a la persona y a la IA del laboratorio (ideas6oct:1756, flechas tamaño-AI).
- **MAP:** el mapa siempre detrás de la terminal; el terminal es un tubo encima (R3).
- **TALLER:** junta oficios, núcleo y técnico (hoy en `home_buildings DENTRO.taller`), la incubadora (`ui.js`) y `summon_reveal`.
- **MDA:** EXPRESIÓN (tu cangrejo ES tu army: se ve sin leer) y DESAFÍO más legible (la batalla está en el mundo, no en una pestaña aparte).
- **Riesgo ALTO:** es la pieza más grande. Toca `thegame.js`, `home_buildings.js`, `home_base_scene.js`, `gdpr-art25-ephemeral-crab.js`, `ui-arena.js`, `aiact-art50-crab-terminal.js`, `atlas-piloto.js`, `data/atlas_accion_schema.json`, `atlas-casa-en.json`, `atlas-en.json` y `home.css`. **El enum `mover` además se refleja en la app nodo** (`aiact_art14_node_decide.py` en el rack server, «idéntica a la regla del motor»): es propose-only, y su PR va aparte. Esta pieza la parto en R2a (pestañas + retirada de la rejilla), R2b (cuerpo del cangrejo) y R2c (enum `mover`).

### R3 · Terminales cilíndricas (CSS puro)
- **Módulo:** `public/assets/tubo.css`, una clase `.tubo` (más `.tubo-h` horizontal). Curvatura con `radial-gradient` + `inset box-shadow`, extremos elípticos con `::before/::after` y `border-radius: 50%`, cristal en capas, brillo de fósforo `text-shadow`. Quieto con `prefers-reduced-motion`.
- **Toca:** se aplica a `.thegame-capa` (terminal), `.revela` (popup), `.casa-interior` y `.radio-estado`, añadiendo la clase. **No toca** `canon.css` ni `atlas.css`.
- **MDA:** SENSACIÓN (un periscopio, no un rectángulo) y NARRATIVA (estás dentro de un submarino). Corpus: NO_DATA, dirección DECLARADA.
- **Test/sabotaje:** test_web exige ≤16 KiB, cero `url(`, cero `@import`, y un bloque `prefers-reduced-motion` que anule animaciones. Sabotaje: un `url(` da rojo.

### R4 · Colores vivos bioluminiscentes
- **Puerta:** tokens en `thegame.css :root` (`--bio-teal`, `--bio-ambar`, `--bio-hielo`, `--bio-violeta`). `ui-arena.colores()` ya lee variables CSS: se extiende, no se duplica. Los colores-señal (sellos, vida: `wave_render.colorVida`, `E.tono`) **no se tocan** (test).
- **MDA:** SENSACIÓN. El color también es RUTEO SEMÁNTICO legible por el laboratorio (ideas6oct:1736-1752: hue = familia, saturación = confianza). La paleta se cruza con el Inyector de Espectro del corpus (LEEME:1145: ámbar = masa inercial, índigo = penetración, verde fósforo = latido, cian = ruta fría, rojo = solo fallo duro).
- **Riesgo:** contraste AA (lo mide test_web). Se pinta sobre fondo profundo.

### R5 · M18-B · aristas (FIRMADO por ti: opción B) + las dos caras de la onda
- **Módulo:** `gacha.js` (extiende, no hermano): `aristas(tropa)` **pura**, que cuenta lóbulos, los máximos del radio sobre 720 puntos de `G.punto` (la medida de la propuesta M18). `tirada` sortea primero **las aristas** con una tabla entera por mil y por TC en `valores.js` (`aristas_odds`). Los armónicos salen de las aristas (k = 1 − n·j, amplitudes decrecientes) para que `aristas(tropa)` = lo sorteado. La rareza sale de las aristas: 3-4 normal, 5-8 mágico, 9-12 raro, >12 **Leviatán** (`unico`).
- **Tabla PROPUESTA (por mil, todas las TC cumplen la meta firmada: 60 % en 3-4, ≤5 % por encima de 12):** tc1 = 3:320 4:300 5:120 6:90 7:60 8:40 9:25 10:15 11:10 12:10 13:5 14:5 → 0,5 % Leviatán. tc4 sube la cola hasta el 5 %, a costa de 5-12. Las intermedias quedan entre las dos. Las ODDS publicadas salen de esta misma tabla (`odds(tc)`).
- **LOD (punto 5):** `G.lod(tropa, 'combate'|'taller')`. En combate: el armónico base + el que fija las aristas (n lóbulos, colores del sistema). En taller: el espectro entero. Misma semilla, LOD de los mismos datos (test: `lod(t,'combate')` es prefijo de `t.armonicos`).
- **Ping de sonar** en `summon_reveal.js`: anillo que se expande y «N edges». **Aviso del Army anterior:** una tropa sin el campo `aristas` es de la versión anterior y se dice en su ficha (`ui.js`).
- **Versión:** C4. `valores.version` sube y `packSha` incluye `aristas_odds`. `data/atlas_gacha_schema.json` gana `aristas`. Los casos M18-bis que fijaban el espectro viejo **se rompen a propósito y se reescriben** (firmado).
- **Test de la Gauss:** 4.000 tiradas por TC con semillas `sha256("m18:<tc>:<i>")`. ≥60 % con 3-4 y ≤5 % con >12, en dos corridas iguales (n=2). Además, `aristas(t)` = lo sorteado en el 100 % de los casos. Sabotaje: una tabla con la cola al 6 % da rojo.
- **MDA:** DESCUBRIMIENTO y DESAFÍO (el jackpot es raro y se ve: 6 planes:136-142) y EXPRESIÓN (la forma es tuya).
- **Toca:** `gacha.js`, `valores.js` (firmado vía B), `arena.js` (packSha), `summon_reveal.js`, `ui.js`, `data/atlas_gacha_schema.json`, `atlas/gacha_casos.mjs` y `atlas/motor_casos.mjs` (solo los casos M18-bis).

### R6 · Cada tropa con su PROPIO SONIDO (prioridad alta)
- **Puerta:** `core.js vozDe(t)` YA existe. Se extiende: las aristas mandan la razón portadora/moduladora (timbre), la riqueza del espectro el índice, y el Leviatán lleva la segunda moduladora. Sigue siendo la misma síntesis FM: `AtlasSintesis.suena`. Suena al revelar (ideas6oct:1730) y a un toque en el Taller. **`core.js` es núcleo:** lo toco solo dentro de `vozDe`, y esta pieza pide tu FIRMO expreso antes del PR.
- **Test:** misma tropa → misma receta (huella); dos tropas con distintas aristas → timbres distintos. Sabotaje: una receta que no depende de las aristas da rojo.

### R7 · El mapa es el mundo: radio en el mapa + anclas
- **Radio:** `aiact-art50-state-radio.js` gana `monta(panel)` también en MAP. Misma síntesis y misma instantánea; ningún módulo nuevo.
- **Anclas (solo vocabulario visual):** en `mar.js`, cada nodo de las cédulas con su **tubo al rack** (una línea doble). Puntos de anclaje declarados: `AtlasMar.anclas()` devuelve `{ id, x, y, clase: 'parte-cuerpo'|'enlace-rack'|'eco-superficie'|'prisma' }`, solo datos, sin red. **EV_SURFACE_ECHO** (6 planes:175-207): esta ronda solo dibuja el ancla, sin envío, cifrado ni fetch (test: el módulo no contiene `fetch`).
- **Propuesta del sitio:** las partes del cuerpo y el chat con el rack anclan en el anillo de tu casa en el mapa, y el eco de superficie en la boya de Hexelion. Su construcción será su propio FIRMO.

### R8 · El gacha divertido: la CEREMONIA
- **Puerta:** `ui.js invoca()` + `summon_reveal.js` (extiende). (a) Anticipación: la cápsula cae, con un segundo de tensión, y el ruido se va «sintonizando». (b) Reveal: armónico a armónico (ya existe), más el ping de sonar (R5) y su primer timbre (R6). (c) Showcase en TALLER: el Army respira, con sus stats y su sonido a un toque. (d) Juice: squash & stretch CSS, partículas deterministas (`E.hash`), micro-shake. Todo quieto con movimiento reducido.
- **Honestidad:** las ODDS exactas, de la misma tabla (R5); semilla firmada; la ceremonia NO decide nada (test: `tirada` no cambia con o sin ceremonia). «Gasta Cobre y Luz»: ya es así (`valores.tcs.coste`).
- **MDA:** el placer está en la ceremonia, no en el azar (6 planes:131: «sintoniza frecuencias en el ruido»).

### PROPUESTAS MDA con anclas (NO se construyen hasta tu firma)
- **P9 · Polvo de Taller** (6 planes:146-155; LEEME:1155; ideas6oct:694). Desintegrar da residuo = f(aristas): cuadrada 4 g, Leviatán fallido más (propuesta: g = aristas² / 4). Lijar sube un stat (velocidad, blindaje) con coste creciente y **nunca añade aristas** (test futuro: `aristas(lija(t)) == aristas(t)`). El recibo va encadenado (LEEME:1157). Ancla de esta ronda: ninguna en código; solo el hueco `taller.residuo` en el plan. Coste M.
- **P10 · Prisma de Bandera** (6 planes:156-163; LEEME:1159-1161). Color de bandera del jugador; tinte de las ondas gastando residuo. Te identifica en el mapa A2A. **Nada decide color por otro.** Ancla R7: `clase:'prisma'` en tu casa. Coste M. Riesgo: un color también es huella (LEEME: «identidad visual sin huella silenciosa»), así que la bandera viaja solo si tú la firmas.
- **P11 · Tutorial «El Primer Eco»** (6 planes:165-174). Ping obligatorio → 3 ondas sucias (`campo_origen:'emulado'` = niebla, que ya existe) → El Navegante (la IA del taller, como guía-onda con nombre propio en `atlas-dialogo.js`) enseña a desintegrar, pulir y pintar → tu INSIGNIA. Depende de P9 + P10. Coste L.
- **P6-dinámicas · Combate a escala (>100 unidades por persona; hoy `tropas_max`=6).** Mecánica PROPUESTA: la tropa firmada es un **escuadrón**. Cada tropa adoptada despliega N = f(aristas) partículas-onda (3 aristas → 24 infantes, Leviatán → 1 coloso), así que 6 tropas ≈ 100-140 unidades sin cambiar ni el contrato firmado (`tropas_max`) ni `arena.combate` (el combate se resuelve por tropa; las unidades son coreografía de LOD, `battle_choreography.js`). Rendimiento: dibujo por **lotes** (un `Path2D` por escuadrón con la cara de combate de R5), sprites cacheados (`O.sprite`), presupuesto de 2 ms por cuadro con degradación automática (`AtlasCalidad`). Riesgo: los fps del Doogee son NO_DATA. Dinámicas: formación (agresiva/defensiva/flanqueo ya en `casa.formacion`), oleadas, el sonido de cada escuadrón (R6). Coste L.
- **P-ESM** (C2) y **P-CHUNKS** (modelo mini en trozos: el fragmento inicial en la web y el resto por cuadrante, ideas7oct:321-331). Lo tengo **permitido** esta ronda, pero dónde está el «modelo mini» en la web es NO_DATA (no encuentro un modelo servido en `public/`, porque la mudanza b3 retiró el chat). Antes de trocear nada, propongo identificar qué es. Coste M.

## 3 · Autoverificación (corre al cerrar cada pieza, contra este plan)
1. `python3 test_web.py && python3 atlas/test_atlas.py && node arnes_sw.mjs` + las 13 suites `atlas/*_casos.mjs`: todo verde, dos corridas.
2. `wc -c` de cada fichero tocado ≤ 16.384 (C1). `atlas/mundo.py`: `gzip_juego_b` < 153.600.
3. `grep` en lo tocado: cero `Math.random`, `Date.now`, `fetch(` nuevos, `localStorage`, imágenes o `url(`.
4. Sello en su orden (skill sello-del-juego). `coherencia-publica.py` **solo en el árbol principal**; en worktree se declara.
5. La pieza cumple su fila: módulo y puerta, la retirada de lo viejo en el mismo commit, y su test con sabotaje enseñado en rojo.
6. `PARA_LA_MESA.md` se actualiza tras CADA pieza.
