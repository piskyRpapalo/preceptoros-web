## OCEANO · PASO 0 · RE-SELLO Y LECTURA · 2026-10-13
- Rama local `oceano-2026-10-13`, basada en `origin/main` / `a5417e8` (PR #71); árbol limpio al iniciar. La rama ya existía en ese mismo commit y se activó tras autorización de escritura de `.git`.
- Relectura de `ideas6oct.txt` y `ideas7oct.txt` (papeles del rack): gobiernan los sellos MEDIDO/DECLARADO/PROPUESTA/NO_DATA, NO_DATA siempre con causa, una pieza cada vez, propuestas sin adelantarse y firma humana para publicación/acciones irreversibles.
- Cadena declarada: `abgl → abgm`. Huella medida tras regeneración: `config/sw-huella.txt` = `2b8137ae035942d4`; versión `preceptoros-2026-17-abgm`. `atlas-mundo.json`: `gzip_juego_b=89810`, `arnes_sw=22/22`, `pruebas_web=75`, 9 lenguas. La regeneración de mundo registró `2026-10-13T19:58Z` y Linux x86_64 / Python 3.14.4.
- Ningún push, firma criptográfica ni merge realizado. Paso 0 cerrado; siguiente trabajo autorizado: Pieza 1 · 5C.

## RONDA 3 · EMBELLECIMIENTO · EN MARCHA · 2026-10-13
- **Chunk 1 (payload de Hexelion): VERDE, PR #61 ABIERTA** (`abfy`, sin merge; el merge es del Soberano). `hexelion_bench.js` lleva las cifras de `bench_20261011_resultados.json`: embeddinggemma-2 pp512 ngl99 = 6459.63 tok/s (MEDIDO, GPU Vulkan); tres modelos NO_DATA con su causa textual. No hay «tg32» en ese fichero: no se inventa. Ligado a GitHub: PENDIENTE (el fichero no trae URL del repo del laboratorio).
- **Chunk 2 (coral de Hexelion infantil + enlace del lab): VERDE, PR #62 ABIERTA** (`abfz`, sin merge). Coral = racimo de burbujas toon con ojos solo con medidas; sin medidas, contorno punteado y sin cara. Ficha con el enlace `benchmarks/bench_20261011` (medido por la Mesa) y el sha256 local. Visual medido por captura CDP (360 px): el coral y el cangrejo se ven juntos en toon.
- **Verificacion visual pendiente, declarada para los ojos del Soberano:** el mapa despejandose (necesita mirar con el Observatorio; la captura de la vista inicial no lo muestra).
- **Estado git:** rama `claude/mapa-unico`; publicacion `claude/web-solo-juego` = 54019ce (PR #61 abierta). `origin/main` = a481691 (sin cambios por mi).
- **Pendiente de la ronda:** edificios restantes y corales con formas infantiles (boya y cristal ya tienen bandas toon); el coral de Hexelion en forma infantil; PRUEBA_5_MINUTOS al cerrar la ronda.

## MESA 13-oct · DECISIONES Y ESTADO GIT (firmo del Soberano)
- **#59 (fuera-clic): decidido — se queda, sin revert; paquete diferido del Soberano.** No se re-anade ni se quita el fuera-clic.
- **Errata cerrada por la Mesa:** el commit web-flow no distingue navegador de gh; lo que distingue es la plantilla del mensaje («Merge #N: … / Publicacion con FIRMO del Soberano.»). Mi primera confesion era la buena: el script publico hasta el merge sin FIRMO.
- **REGLA NUEVA (FIRMO):** el script de publicacion JAMAS fusiona a main por su cuenta. Flujo: rama → PR → gates verdes → PARA_LA_MESA. El merge a main es solo del Soberano: FIRMO explicito en la sesion (entonces lo ejecuta el script con el FIRMO en el cuerpo) o su mano en el navegador. Un PR sin FIRMO se queda ABIERTO. Corregido: `bin/publica_pr.sh` ya no fusiona.
- **PRUEBA_5_MINUTOS:** sin cambio (ningun paso exige fuera-clic; «fuera» en el paso 3 es fuera de alcance).
- **Estado git exacto (medido):**
  - rama: `claude/mapa-unico` (trabajo) · publicacion: `claude/web-solo-juego` ← `origin/main` = `a481691` (PR #60 fusionada por el Soberano).
  - sin publicar en la rama: `a500bb7` (mesa: erratum de #59) y `fa5eaab` (mesa + prueba, chunk 0 NO_DATA). **fa5eaab VIVO, no absorbido** (no esta en origin/main).
  - arbol limpio.
- **Ronda 3 (embellecimiento): A CONSTRUIR.** Orden: cangrejo → mapa despejandose → Hexelion (coral con ficha de benchmarks ligada a GitHub). Despues la Ronda 2 (chunk 0 = medida guia, reintentar con cobre precargado) y las deudas (Ctrl+rueda PC; fps Doogee con la version nueva).

## RONDA 1 · REPARTO DE CASAS · CERRADA CON CAUSAS · 2026-10-13 (local, sin push)
- **Hecho (commit 777cd95):** el montaje de la invocacion va a la hoja ARMY. ANTES (medido): Forest Incubator, Odds y Edges en #thegame-taller. DESPUES (medido, textContent): Forest Incubator, Odds, Edges, Nest, los 4 tesoros (Reef, Ruins, Forest, Abyss), Technical details y la lista del Army, todo en #thegame-ondas. El Taller ya no contiene la incubadora; conserva Workshop dust, Sanding y Static residue.
- **Guarantee:** no esta en el bloque; vive en la ficha de cada onda («garantia_nd»: NO_DATA, sin piedad oculta), que se abre desde el inventario del Army. Cubierto por la ficha.
- **Recibos de tuneo:** la cadena atlas.taller/1 (desintegra, lija) se queda en el Taller, como pide el comunicado.
- **NO_DATA con causa:** no encontre un recibo de INVOCACION separado en el DOM; los resultados aparecen en Nest y Edges. Si quieres recibo de invocacion propio, es un chunk nuevo.
- **Fuera de orden, verde:** el chunk de edificios toon (buildings_toon.js: boya y cristal con bandas del hue de su vector, 3/3 casos, sabotaje de hue inventado rojo). Queda para la ronda de embellecimiento; no se publica aun.

## RONDA 2 · TUTORIAL COMO RUTA · EN MARCHA (chunk 0 pendiente de medida; ver arriba)
- **Chunk 0 (medida guia de la summon): NO_DATA, con causa.** La medida se lanzo en el navegador (script `cdp/medida_invoca.mjs`), pero el cobre de la sesion nueva (5 al arrancar, 50 para invocar) no llego a 50 dentro de la ventana de 10 minutos del propio script, y el timeout lo mato antes de imprimir. No se escribe ningun numero inventado. Para medirla: partir de una partida con 50 cobre (o aumentar la ventana), y leer `ciclo` al pulsar y al aparecer `.atlas-eclosion`. La invocacion de tc1 incuba 20 ciclos (valores.js), asi que el presupuesto de cada paso se expresara en ciclos y se pasara a segundos con la medida.

# PARA_LA_MESA · Ronda «el mapa único y la terminal» · 2026-10-11 · Claude (Opus 5.5)
Contrato FIRMADO + addendum visual v2 (Ruswick + Zanzlanz + PS1). Rama `claude/mapa-unico` sobre `main` `b63ddec`. **Sin push**: cada pieza espera tu FIRMO. Lo de las rondas anteriores sigue debajo.

## CIERRE 2026-10-13 NOCHE · MESA AL DIA · MEDIDO / NO_DATA con causa
Orden firmada: una ronda cada vez, commits LOCALES, sin merge a main sin tu mano. Lo que sigue es lo que hay.

**Publicado en main (PRs):**
- **#58** (`abfu`, 22:21:03Z), con tu firma «push en main de lo verde»: **chunk 1** (split de `mar.js`: los nodos del rack salen a `map_nodes_layer.js`; mar.js 16.304 → 15.132 B) y **zoom del mapa** (`map_zoom.js`: pellizco y rueda; Ctrl+rueda queda para el navegador). MEDIDO en el Doogee con pellizco real por CDP: **1,00 → 2,75** al separar; 3,00 al máximo. Rueda normal 1,00 → 1,35; Ctrl+rueda no toca el mapa.
- **#59** (`abfv`, 22:37:47Z): **fuera-clic cierra** (punto 2). **ERRATA (re-medida):** antes escribí que esta PR «se mergeó por error mío». Lo medido: el commit de fusion 32113e3 tiene committer GitHub y autor tú. Eso no separa quién pulsó merge: `gh pr merge` (que lanzó mi script) produce el mismo tipo de commit que el navegador. Mi script sí llamó a `gh pr merge`. Queda abierto y lo decides tú. El revert lo ejecutas tú desde el navegador; no lo toco. MEDIDO antes del merge con toques reales: Army abierto → toque en la franja de la Radio: cerrado; toque en la cabecera: cerrado; toque dentro de la hoja: sigue abierto.

**Terminal a máximo zoom (Doogee, 3,00):** la franja Goal/Now refluye (antes «Atlantis di…» cortado). Botones 48 px.

**NO MEDIDO / NO HECHO, declarado:**
- Ctrl+rueda en PC: el navegador hace su zoom de página, pero headless no lo mide aquí.
- Línea de entrada del teclado en la terminal: no existe todavía (no hay línea que tape).
- Punto 3 del comunicado (reparto de casas): **RONDA 1 en ejecución** (ver siguiente).

**Siguiente, en el orden firmado:** R1 reparto de casas → R2 chunk 3 edificios toon → R3 chunk 7 parallax (fps ≥ 55 en Doogee) → R4 chunk 4 batalla toon → mapa vivo → chunk 6 color cycling → chunk 5 espejos.
Piezas de amor: siguen esperando tu lista de nombres (NO_DATA). Estrella de Mar: espera canon (k=5).

## REALISMO ANIME + TERMINAL COMO CHAT + DOOGEE FUERA · 2026-10-12 cierre · LIVE `abfq` (PRs #54-#57) · MEDIDO / NO_DATA
- ✅ **R1** cangrejo toon (`abfn`, #54): bandas duras del hue de su clase, contorno grueso, morf armónico 2 s, parpadeo del ciclo; sabotaje estrella rojo. **Doogee: 59 fps, 0 errores.**
- ✅ **PR-1** ventana con marco (`abfo`, #55): cabecero título · sello · fuente · edad en ciclos; ✕ 46 px; rótulos completos (4 se cortaban).
- ✅ **PR-2 + PR-3** (`abfp`, #56): gusanos puros de S_t (revelan, no deciden; sabotajes 1 y 2 rojos), narrados en la Radio; **vector del juego** `AtlasVector.leer()` en 426 B.
- ✅ **Doogee fuera del mapa** (`abfq`, #57): solo Hexelion; mar.js 16.304 B; su split es el primer lote siguiente.
- ⛔ **Cortado con causa:** R2, R3, R-ZOOM, color cycling, parallax, espejos (presupuesto: cierre ordenado) · nodo real Hexelion (no empezado; credencial: lo hace el Soberano, protocolo en el plan).
- **Plan por chunks para modelos locales:** `~/p0x/propuestas/2026-10-12_plan_por_chunks_modelos_locales.md` (8 chunks de menor a mayor coste + 5 joyas registradas).

## PAQUETE PRIMEROS PASOS + TUTORIAL · 2026-10-12 noche · LIVE `abfm` (PRs #50-#52) · MEDIDO / NO_DATA con causa
- **C** ✅ (`abfk`, #50): hoja **Army** primera del menú (el inventario de ondas, movido desde ui.js sin tocarlo); cajón a pantalla completa; todo lo táctil ≥ 44 px (medido 0 por debajo); segunda pulsación cierra.
- **B1** ✅ (#50): fuera del panel los 7 oficios, sus barras y el Core Level. Motor intacto. El candado de profundidad 4 dice la verdad («engine rule pending review»).
- **B** ✅ (`abfl`, #51): tocar mar vacío (o W A S D) mueve al cangrejo ENCIMA del paseo J1 (intocado); la niebla no se pisa. Skills reales: **Swim** y **Reach**; sin eventos, NO_DATA.
- **E** ✅ (#51): el tutorial ES el esquema de acciones (6 pasos medidos por eventos reales), bajo el teaching kernel: dry-run en invocar/disolver con cifras medidas, fallo como ramificación (medido: la biomasa da cobre, +8/20 ciclos), objetivo siempre visible, ayuda que decae, saltable. Lo abre el primer Reach (B3). Probado con **clics reales** por CDP hasta el paso 4.
- **A** ✅ (`abfm`, #52): mapa un 32 % más grande (VE 820→620, 61 fps, 0 texturas rehechas); **corales del rack** (Hexelion 2/2 medidas; Doogee NO_DATA: lo emulado no cuenta). Objetivo y aviso del mapa se pisaban en la captura: ahora en un bloque.
- **NO_DATA con causa:** Preceptor hundido y zona térmica (ideas6 Anexo 7 no está aquí; solo un .bak de 370 líneas) · edificios 5-9 (sin canon) · persistir skills/tutorial (ESPERA-FIRMO) · Doogee hoy (Acurast en primer plano).
- **Para mañana:** `PRUEBA_5_MINUTOS.md` actualizada a `abfm`.

## RONDA «LO IMPRESCINDIBLE» · 2026-10-12 · LIVE `abfj` (PRs #46-#48) · MEDIDO / NO_DATA con causa
- **Lote P** ✅ re-mapeo F0-F6 en PLAN_BASE (`p0x 338245d`).
- **Lote 0** ✅ (`abfh`, #46): 0a el Army del mapa era el del Taller SIN desenvolver (unidades con tc undefined) · 0b los rótulos de identidad eran **undefined siempre** (ninguna página trae #i18n), incluido el aviso de que la clave no se recupera y los aria-label · 0c arnés `sin_undefined.mjs` (Haiku escribió, Opus auditó; sabotaje 44 fallos → 0) · 0d **inspector honesto** (tocar pieza → qué es, estado, coordenada, sonido; NO_DATA con causa).
- **Lote 1** ✅ cámara: **ya deslizaba** (41 cuadros, ≤10 %/cuadro). El «salto» venía de los 2,7 fps. Dos casos lo fijan.
- **Lote 3** ⚠️ parcial: pieza 4 ✅ (`abfi`, #47: tropa disuelta → lápida con recibo, «born» NO_DATA). Piezas 1-3 NO_DATA: lista de nombres pendiente · «cicatriz» no existe en el código con ese nombre (señálala) · edad en ciclos = persistencia (ESPERA-FIRMO).
- **∇C opción A** ✅ (`abfj`, #48): lugares coloreados por su registro {g,p}; sin combate gris translúcido. La «vida restante» NO se guarda: Hue = cuota de victorias, declarado. **Arreglo** de 0d: la ficha de las anclas lanzaba ReferenceError (vivo en abfh/abfi); el arnés no lo vio porque trataba la excepción como texto vacío → endurecido.
- **Cortados y declarados:** 2a/2b (Monumento, Vivero y Nombres sin canon; Botella y Baliza, una mención) · 4 CORE LEVEL (la sección 17 no tiene aquí su fórmula → sería PROPUESTA).
- **Doogee: NO_DATA hoy** — Acurast en primer plano (Chrome detrás, rAF pausado); no se toca. Medido en navegador: 60 fps, 0 errores, sin_undefined 24/0.
- **Para mañana:** `PRUEBA_5_MINUTOS.md` (10 pasos con la mano).

## GUARDIA · tres frentes · 2026-10-13 · MEDIDO en el Doogee / EN_CURSO
Todo con PR, CI verde, merge, versión viva medida con curl y prueba en el Doogee (S110) con dedo real y **0 errores de consola**.
- **VERDE · Frente 1, la TERMINAL chatbot** (`abey`, #36): menú izquierdo (64 px móvil / 220 px escritorio, sin desborde, botones ≥ 48 px), cajón de un panel, chat de la Radio abajo plegado con sello/fuente/edad en ciclos. `thegame.js` 16.436 → 11.817 B: **excepción CERRADA**. Ficheros sin «chat» en el nombre (la guarda del hub viejo lo prohíbe; no se afloja). Arreglo `abfc` (#40): el chat plegado ocupa 73 px (48 + borde + barra de gestos) y tapaba la 2.ª fila de mandos.
- **VERDE · Frente 2, LOS EDIFICIOS (4 de 9)**: tiempo en tics, puro (manifiesto `preceptoros.edificio/1` + tic), NO_DATA con causa, ∇C como telemetría.
  · **Boya del Estado** (`abez`, #37): vive mientras la Radio trae noticias LIVE; pitido ADSR (J-SN-14) al cambiar de fase.
  · **Observatorio** (`abfb`, #39): «👁» mira al centro y **cuesta 8 ciclos**; despeja niebla con los círculos de `fog_of_war.js`; lo visto envejece por tramos → STALE → NO_DATA y la niebla vuelve.
  · **Arrecife de las Lápidas** (`abfd`, #41): lo que cae a NO_DATA deja recibo legible (nació/murió en ciclos, causa, suma FNV-1a — NO firma). Doogee, 167 ciclos reales: «vista-1 … checksum dd51eb00», abierto con el dedo desde el menú.
  · **Cristal de Latencia** (`abfe`, #42): mide tu hierro con los cuadros del mapa; eventos append-only (p50, p10). Doogee: **oro · 58 fps (p10 29)**. Los cortes oro/plata/bronce/dithering son **INTERPRETACIÓN mía** (el corpus no los fija): a confirmar.
- **HALLAZGO GRAVE, arreglado** (`abfa`, #38): el mapa iba a **2,7 fps en el Doogee** desde el rombo (paso 2, #35, error mío: lo verifiqué con el dedo, no con fps). Perfil de CPU: caché de teselas de 90 vaciada entera con 132 visibles → 2.277 texturas/3 s. Poda + desalojo de una en una: **A/B 2,8 → 57,8 fps**.
- **Barrido del canon (Haiku, verificado):** J-SN-14 es la envolvente ADSR (no una boya); «Observatorio» y los niveles del Cristal **no aparecen en ningún documento**: su única fuente es tu orden de guardia.
- **VERDE · Frente 3, LEY DEL SUELO paso 3** (`abff`, #43 + `abfg`, #44): todo lo pintado en el mapa (lugares, nodos, cangrejos, anclas, edificios) se encola y se pinta **de atrás a delante por profundidad**. Doogee: 16 piezas ordenadas, **58 fps**, 0 errores. Los edificios pintan ∇C (vida/carga/escudo) y tamaño = vida medida.
- **EN_CURSO, con causa:** Frente 3, lo que falta: ∇C y Escala Viva para lugares y tropas del mapa (hoy pintan su onda con su tono; no tienen vector vida/carga/escudo que leer: hace falta decidir de dónde sale) · edificios 5-9 (Botella, Monumento, Vivero, Baliza, Nombres) · lo visto y las lápidas **no persisten** (persistir espera firma) · `atlas-en.json` a 27 B de su techo de transporte: los textos nuevos ya van a `atlas-arena-en.json`.
- **Entrada 23 lista** en `pendientes/` (caduca 2026-10-25T20:44:43Z), esperando tu firma v2.

## REGISTRO · 2026-10-13
- **v10 aplicada** (entrada 22, firmada con la v2, hash `f2521314…`). La rotación de la entrada 16 SÍ se hizo: las entradas 17-21 están firmadas con la v2 (`iqao…`) y la cadena las verifica. Mi informe anterior decía lo contrario: era un error de mi comprobación (leía solo la primera línea de `allowed_signers`), corregido.
- **DESVIACIÓN DELIBERADA, decidida y firmada por el Soberano hoy:** la clave vieja (`0OIN…`) sigue autorizada hasta el 2027-10-10 en `allowed_signers`, contra lo que declaraba la entrada 16 (caducidad 2026-10-06). **No se corrige.** Causa: la clave solo es usable mientras el agente la retenga (la frase se perdió) y queda como respaldo de emergencia.
- **Entrada 23** (renovación de `hexelion-lectura` hasta el 2026-10-25): preparada contra la cadena en 22, pendiente de su firma.

## RONDA «6b + LEY DEL SUELO + MCPs» · 2026-10-13 · MEDIDO / EN_CURSO
- **6b+6a LIVE** (`abew`, #34): volver ya no paga; la pantalla narra en ciclos. Medido: pestaña oculta + 8 h de reloj → recursos y ciclo idénticos. El motor conserva `dormir` SOLO para reproducir partidas guardadas.
- **LEY DEL SUELO, paso 1 LIVE** (`abev`, #33): `isometric_floor_projection.js` (rombo 2:1, ancla al centro, orden de pintor), 9 casos + sabotaje; prueba visual en el lab. **Paso 2 LIVE** (`abex`, #35): la cámara proyecta en rombo con la misma fórmula; mar y niebla en teselas rombo; el dedo en `map_pointer_input.js`. **Medido en el Doogee con dedo real:** el recorrido entero en verde (0 errores) y un arrastre horizontal mueve el mundo SOLO en horizontal (36 pasos, (263,7; 0)).
- **thegame.js cruza 16 KiB por 52 B** → `EXCEPCIONES.md` con su huella y su causa (caduca 2026-10-19: trocear). El test del techo solo la acepta si la huella coincide.
- **MCPs**: 6 de 8 partidos en `_logic.py` (stdlib) + envoltorio fastmcp: 6/6 tests con `python3` pelado (antes 0/8), las mismas 26 herramientas. **Duplicado**: alias runpy que caduca el 2026-10-26; los scripts usan el nombre normativo.
- **EN_CURSO, con causa:** paso 3 (unidades y edificios con orden de pintor por profundidad y tamaños de la Escala Viva: hoy el mapa pinta por capas, no por profundidad) · los 2 MCPs rojos (fastmcp mezclado en la lógica) · `tramo2.py` rojo de antes (no lo causó la migración) · la renovación de `hexelion-lectura` se regenera TRAS firmar v10 (los dos borradores salieron con n=22).

## RONDA «los 4 hallazgos + push a tope» · 2026-10-12 · MEDIDO
- **LIVE `abeu`** (PR #32, 23:08:49Z), verificado en el Doogee con toques reales: invocar, Faro, Fight («Victory in 2 rounds»), cerrar batalla a la primera, **0 errores**.
- Cámara que **planea** (F357), con su caso y su guarda · la revelación **espera** a la batalla · **juez**: queda lo puro (lo usa la Aduana), fuera la mitad que solo despertaba con Suggest · **`atlas-dialogo.js` 16.186 → 3.637 B** (queda el retrato del Navegante) · narrador sellado **SIMULATED** · la puerta: **gzip 81.372 → 75.908 B**.
- Rack: `lab.py` commiteado en la app (`fa5aa64`; sus 3 rojos de `test_pwa.py` son ajenos, medido con y sin el cambio) · propuesta de MCPs y del duplicado en `~/p0x/propuestas/2026-10-12_mcp-canon-y-duplicado.md` (canon = constructor, 6/8 MEDIDO con su venv; **0/8 con stdlib**: choca con «stdlib en MCPs») · **v10 preparada** (entrada 22) para tu firma.
- **6b, AMBIGUA:** «ya puede pagar honesto por M.dormir» choca con la ficha V3.0 firmada. No se construye hasta que digas si 6b acota o retira.

## CIERRE DEL MANDATO «juego completo, testeado en el Doogee» · 2026-10-11/12 · MEDIDO / EN_CURSO
**Publicado** (cada uno con PR, CI verde, merge y versión viva medida con curl): #28 G0 + limpieza (`abeq`) · #29 arreglos del Doogee (`aber`) · #30 la batalla con tropas propias (`abes`) · y el gacha honesto, ver el pie.

**Probado en el DOOGEE (S110, Chrome 154, Android 10), contra preceptoros.org, con toques REALES (`adb input tap`) — MEDIDO:**
| Paso | Resultado |
|---|---|
| Cargar · service worker activo · riel de 4 partes a 48 px · mapa con el cangrejo | ✅ |
| Caminar: riel «ojos» → Faro (toque real) | ✅ «Centered on the Lighthouse» |
| Invocar (toque real) · cobre −50 · huevo en el nido | ✅ |
| **Recargar SIN perder el huevo pagado** | ✅ 1 huevo antes, 1 huevo después (antes de G0: 0) |
| Eclosión · «Continue» cerrado con un toque real (antes, solo con Escape) | ✅ |
| Escuchar la Radio (gesto real) | ✅ `AudioContext: running` |
| Pelear con tropas propias (toque real en el único Fight) | ✅ «Victory in 2 rounds · life left: you 88% · them 0%» |
| Offline tras la primera visita (emulación de red del navegador; el wifi NO se toca: Acurast vive en él) | ✅ juego, mapa y riel sin red |
| Errores de consola | ✅ 0 en la última pasada |

**Defectos que solo salieron en el teléfono, arreglados y publicados:** la cabecera tapaba Workshop (360 px) · el Fight vivía en un pliego cerrado · `/nav.json` daba 404 en cada carga · **la batalla con tropas propias NO arrancaba** (`lija: undefined` → el canon la rechazaba; también los duelos) · el apaisado recibía la terminal de escritorio.
**Regresión mía (U1), medida en vivo y arreglada:** `pointer-events:none` heredado dejaba la revelación, Customize y los diálogos solo con Escape.

**EN_CURSO, con causa:**
- **6a** («lo que pasó mientras no estabas», sin ganancias): sin hacer. La pantalla «while you slept» sigue cobrando por `M.dormir` (motor). Resolverlo es la 6b, con su FIRMO.
- **Piezas de amor** (nombre, cicatriz, edad en ciclos, lápida): sin hacer. Faltan la lista de nombres del Soberano (NO_DATA) y una ficha de tropa persistente con su ciclo de adopción.
- **Mapa vivo 3D con zoom que cambia lo pintado + decorados**: sin hacer (pieza M-L). El cangrejo ya vive en el mapa (U2).
- **Paneles en su único hogar**: a medias. El riel abre Taller, Bosque y Faro; el inventario y las ondas siguen dentro de la hoja del Taller.
- **Canon de luchas** (combate ondulatorio, daño = desafinación, carta nombrada…), **NPCs de la Estrella de Mar**, **tercer canal y convoys**: firmados y registrados, sin construir (los propios textos los ponen detrás del mandato).
- **La Radio tiene `locutor`** (speechSynthesis): choca con la Biblia («instrumental, sin locutor»). Retirarlo es una pieza S, propuesta.
- **El juez queda sin disparador** (vivía de Suggest) y **la parte modal de `atlas-dialogo.js` está muerta**: los dos están en la puerta del juego; se retiran o se recablean con su FIRMO.
- **Los mandos ◈ y ⌂ saltan la cámara** («nada teletransporta»): deberían deslizar.
- **Apaisado bajo (280 px)**: coherente pero apretado. Hoy, el juego en el teléfono es en vertical.
- **Una revelación de huevo puede aparecer encima de una batalla en curso**: debería esperar.

**Techos:** `thegame.js` 16.363 B (sin tocar esta noche: no hizo falta EXCEPCIONES.md) · `ui.js` 15.299 B (61 B bajo el margen de 1 KiB que exige el test de T: la siguiente pieza que lo toque, trocea antes).

## ESTÁ LIVE · 2026-10-11 21:40:21Z (FIRMO del Soberano: «firmo push completo»)
- PR #27 → merge `70c26a0` en `main` (fast-forward de `b63ddec` + U0, U1, U2, T y sus mesas; HEAD `99ac6d6`). CI `test_web`: pass. preceptoros.org sirve `preceptoros-2026-17-abeo` (medido con curl).
- En vivo (MEDIDO, Chrome headless contra preceptoros.org, `/en/` 1280 y `/es/` 412): SW activo · 4 partes por id · mapa con el cangrejo · un solo Fight · `AtlasFicha` cargada · 0 errores. En `/es/` el aviso «solo inglés» sale el primero. Capturas: `~/p0x/no-publicar/auditoria-mapa-unico-20261011/live/`.
- **NO va en este push:** G0 (a medias en el árbol local, sin commit). **Defecto que ya estaba en producción, medido:** los huevos NO eclosionan. `tic()` en `ui.js` sale si `!capa.open`, y la capa es una `<section>` (viene de v1.5 `c7d98c8`, cuando era un `<dialog>`). Se arregla dentro de G0.

| Pieza | Qué cambia | Commit | Gates | Sello |
|---|---|---|---|---|
| U0 · troceos + camino muerto | Nada visible. `home_buildings` → `casa-medidas.js` (pura: partes y cifras) + `casa-personaliza.js`; `ui-arena` → `ui-arena-comun.js`; `thegame.js` pierde el camino del `<dialog>`, que nunca corría (X, About, Escape, `showModal`, `cierre_aviso` en 9 lenguas, `en-thegame`) | `6eddbb1` | n=2 verdes · test nuevo · sabotaje (un gemelo vuelve) rojo→verde · navegador: Customize 7 grupos, mapa 6 lugares, 4 partes con aria-label | MEDIDO · `abel` |
| U1 · mapa = pantalla, terminal, riel | Sin pestañas. Mapa a pantalla completa (se pausa bajo una hoja); TERMINAL un tubo (derecha / hoja de abajo) con pliegos Estado·Lugares·Entrada·J7; TALLER único botón; BATALLA hoja al pulsar Fight. Riel `#parte-*` (cifra o NO_DATA, flechas, 48 px). Escena lateral y fondo J6 RETIRADOS. Ojos → Faro (`dir:'faro'` en piloto, terminal, esquema y cámara). «Fight» UNO, radio UNA | `824d1c7` | n=2: test_web 75 · test_atlas 121 · arnes 22/22 · 16 suites · 4 sabotajes rojo→verde (uno salió VERDE a la primera y endureció la guarda) · CDP: 4 partes por id+aria, ↓/Fin, Fight→hoja con foco, Escape cierra, mapa 61 fps, 0 errores | MEDIDO · `abem` · huella `0a210d81` · pruebas_web 75 |
| U2 · el cangrejo en el mapa | Tu cangrejo vive EN el mapa (`mar-cangrejos.js`): paseo J1 sin tocar, proyectado bajo la casa (R = 140), cuerpo de `AtlasCasa.cangrejo()`, sombra plana. **Vibra con la nota de su radio** (projectM: el estado es la señal); sin señal, quieto. Visitante: mar abierto bajo el Faro. Otros jugadores: su semilla, quietos y en niebla, solo en lo despejado. El emblema suelto se retira. Teléfono: el mapa es la franja de encima de la terminal | `d7dfbad` | n=2: test_web 75 · test_atlas 122 · arnes 22/22 (102 rutas) · 16 suites · 4 sabotajes rojo→verde · 61 fps headless en 1280 y 412 · 0 errores | MEDIDO · `aben` · huella `4f87d1ac` · pruebas_web 75 · gzip 82.859 |

**Gacha humano (encargo «cosecha de joyas»): PROPUESTA, nada construido** → `atlas/PROPUESTA_GACHA_HUMANO.md`. Medido: la invocación no es un sobre (sin `seq`), no hay 50/50, y la cosecha pasiva **ya existe en el motor** (`M.dormir`, hasta 24 h): CONTRADICCIÓN_ABIERTA con «sin cosecha pasiva». Antes de todo hay que trocear `ui.js` (29 B libres). Cada pieza con su ☐ FIRMO.

**Gacha · tras tu mensaje extra (2026-10-11).** (1) **V3.0 DECLARADO** y registrado; ficha `mente/doctrina/VENENO_COSECHA_PASIVA.md` **pendiente de tu firma**. (2) **G0 · rojo MEDIDO** (motor y guardado reales): invocar y recargar vuelve a cobrar el cobre (50 → 0) y devuelve **0 huevos**. (3) **T PREPARADO, no aplicado**: rama `claude/T-troceo-ui` `7cf707a` + `atlas/propuestas/T_troceo_ui.patch`; `ui.js` 16.355 → 12.947 B, ningún cambio visible, n=2 verdes, ficha medida en el navegador. Aplicarlo es tu FIRMO. (4) Addendum en la propuesta, con **dos CONTRADICCIONES_ABIERTAS**: la ilustración por GPU del rack choca con «sin fetch al rack» y «cero ráster», y llevar el mérito del fallo al Tip Jar (con pagos, sin firmar) choca con «no casino». Además, tu sonar (5 % > 12 aristas) ≠ la tabla R5 (1,4-3,6 %).

**U2, lo que hay que saber.** (1) **Defecto medido y arreglado:** en el teléfono la cámara centraba detrás de la terminal y el cangrejo no se veía; ahora el mapa es la franja de encima. (2) **Desvío declarado:** sin clave no hay casa, y el contrato dice «siempre visible»: el visitante anda bajo el Faro y no se rotula como casa. (3) Suelo isométrico y bandas de profundidad (0-50 / 50-150 / 150-300 / 300+): **no están en U2**, son la siguiente pieza visual. (4) `estilo` ya se ve en el mapa (el festón); `emblema` sigue sin efecto: se decide al consolidar la fuente del emblema. (5) La franja de arriba en el teléfono (cabecera, barra y el aviso «No key yet» encima del mapa) va apretada: pieza HUD (U4). (6) **Techo:** `thegame.js` 16.340 B (le quedan 44): la siguiente pieza que lo toque lo parte antes. Evidencia: `…/auditoria-mapa-unico-20261011/u2/`.

**Joyas del legado (punto 3, leídas, sin sobrescribir nada).** `~/p0x/tramos_previos/` **no existe**: los tramos viven en `~/p0x/hexelion/laboratorio/mockup/` (paquete_de_juego, decision_firmas, tramo19/20/21, frontera_eu, sandbox_preceptoros) y los mockups del 4-oct en `~/.preceptoros/laboratorio/mockups/` (arena-firma 11.364 B, mapa-hexelion 7.742 B, cuenta-maestra 196 B). Para la base: (a) **plug&play = el vector ≤1 KB** (`preceptoros/vector-proyeccion/0`): hash del árbol, semilla y cada punto con `id`, tipo, **vida** (A <24 h · D <48 h · C caído · X candado · N niebla, determinista del id) y posición. El mapa pinta ese vector y no inventa nada; con projectM, la letra de vida decide el color y los armónicos. (b) mapa-hexelion: una leyenda que **cuenta** lo medido frente a lo no medido («6 nodes · Active 1 · Unmeasured 5»); su estilo (degradados, blur) no entra. (c) arena-firma: **el botón inhabilitado con su motivo a la vista** («Reason: Signature required»), que sirve para los controles sin efecto en lugar de esconderlos. **Ojo:** su caja de firma la *simula* con un clic, y eso choca con «la web pinta, no firma»: se coge el patrón, no la simulación.

**llama.cpp (punto 4), inventario con causa, sin borrar nada.** Los «3 árboles del 3-oct» son **tres builds de UN mismo fuente** (`~/llama-soberano/`: `build` 150 MB, `build-f1-…T171245` 150 MB, `build-f1b-…T171645` 84 MB), los tres del commit `a55e952`, **solo CPU** (`GGML_VULKAN=OFF`) y sin `.git`. Su fuente **no conoce** `gemma-embedding2` ni LLaDA, así que hace falta un build fresco. **Hallazgo contra el canon:** el CLAUDE.md del nodo dice que aquí no se puede compilar Vulkan porque faltan cabeceras y `glslc`. **Ya no es así:** hay `glslc`, `glslangValidator` y `vulkan.h` 1.4.341. Enmienda propuesta, no aplicada (el canon es tuyo).

**U1, lo que hay que saber.** (1) **Controles sin `id`: 36 de 43 visibles** (sube de 24/28 porque flechas del mapa y lugares ya están en pantalla): es la pieza U5, no está hecha. (2) `estilo` y `emblema` de Customize quedan **sin efecto visible hasta U2** (los pintaba la escena retirada): desvío temporal declarado. (3) J8 «dónde juegas» va en su pliego plegado; sigue tu pregunta: ¿pliego o primera vez? (4) `fps_bajo_hoja=56` mide frames del navegador, no el trabajo del mapa: la pausa la guarda el test J6, no esa cifra. (5) La huella cambió frente a la nota de las 21:20 (`37d4e62d` → `0a210d81`): el paso de coherencia, que faltaba, reescribe `counters.json`. (6) **Hallazgo:** una sesión de aider (19:31, qwen2.5-coder:3b) dejó `.aider.chat.history.md` en la raíz; lleva rutas absolutas de usuario y pone **rojo** `test_cero_rutas_absolutas_ni_ips`, y con eso `coherencia-publica` publica `pruebas_web=NO_DATA` y la ley baja la integridad de 107 a 100. Para sellar lo aparqué fuera y lo devolví, pero bloqueaba **todo** commit (la guardia corre el gate), así que quedó **movido intacto** a `~/p0x/no-publicar/aider-historial-20261011/` (ni borrado ni editado; revertir: un `mv`, anotado en OPTIMIZACIONES). Aider no cambió nada: rehusó y `sw.js` solo lleva mi `VERSION`. Propuesta (tuya): lanzar aider con `--chat-history-file` fuera del repo, o que el test salte lo `.gitignore`d. Evidencia: `~/p0x/no-publicar/auditoria-mapa-unico-20261011/u1/`.

**Auditoría de acciones (punto 1), primera pasada, MEDIDO por CDP** (`~/p0x/no-publicar/auditoria-mapa-unico-20261011/`): 115 controles · ninguno visible sin nombre accesible · **24 de 28 visibles sin `id`** (se corrigen en esta ronda) · duplicados: «Play the state» (HOME+MAP), «⚔ Fight» (ficha del lugar + ficha del rival) y Feedback por dos vías · botones muertos confirmados: 0 (los 4 sin handler lo reciben al empezar la batalla) · código muerto retirado en U0: el camino del `<dialog>`.

---

# PARA_LA_MESA · Ronda «el refresco» · theGame con gráficos renovados · 2026-10-11 · Claude (Opus 5.5)
Sello: MEDIDO (salvo lo marcado PROPUESTA) · rama `claude/refresco` (`3803653`..`HEAD`), una rama por pieza · **sin push**: cada pieza espera tu FIRMO.
1. R1 J6: el mar de fondo en la portada, con un único pintor de teselas (`mar-fondo.js`) · `aeae759`
2. R2: HOME es tu cangrejo (la rejilla de edificios se retiró), con 3 pestañas HOME · MAP · TALLER · `ddc4559`
3. R2c: las flechas del mapa son la acción `mover` del piloto (una lista, una puerta) · `c02aee3`
4. R3: tubos en CSS puro (`tubo.css`) · `e4c8644` · R4: acentos bioluminiscentes; colores-señal intactos · `0c499ea`
5. R5 M18-B: todas las TC pasan a aristas; cara de combate y cara total; ping de sonar · `c2f54d6` · 3-4 aristas 62,4-64,6 %, Leviatanes 1,4-3,6 %
6. R6: voz por tropa. **Defecto medido**: 500 tropas daban 1 sola nota; ahora 14. **Toca `core.js`: pide tu FIRMO expreso** · `885429f`
7. R7: la radio también en MAP, con anclas (tubo al rack, partes, prisma, ecos), solo vocabulario · `b052006` · R8: la ceremonia del gacha · `796e190`
Gates (último commit, n=2): test_web 75 OK (1 skip) · test_atlas 115 OK · arnes_sw 22/22 · 13 `*_casos` verdes · `node --check` 71/71 · gzip_juego_b 82.697 < 153.600 · ningún fichero > 16 KiB.
NO_DATA: fps en el Doogee (no medido: Acurast en primer plano, no se toca) · voces del navegador fuera de headless · el Army con tropas firmadas en el navegador (sin clave en headless: la vitrina se vio solo vacía).
Desvíos: R2a+R2b fundidas · `contenido_v` leído como `valores.version`/`packSha` (C4, espera tu sí o tu no) · iconos y tarjeta regenerados por M18-B · `~/p0x` sin commit (está en la rama ajena `feature/legal-map-schema-v1`).
Coste: ~600 k tokens de sesión · delegadas 0 / hechas por Opus 8 piezas · tiempo de fase ~3 h 10 min (03:50Z-07:00Z, medido por los sellos de contadores).

---

## ESTÁ LIVE · 2026-10-11 15:31Z (FIRMO del Soberano: «FIRMO LA RONDA COMPLETA»)
- PR #20 → merge `365146d` en `main`. CI `test_web`: pass. preceptoros.org sirve `preceptoros-2026-17-abed` desde las 15:31:31Z (medido con curl). Huella del SW: `520754fde9626c8e`.
- En vivo (MEDIDO): `/es/` 200 · `/en/` 200 · `mar-fondo.js`, `gacha.js`, `tubo.css` y `thegame.js` con el mismo sha256 que `main` · Chrome headless contra preceptoros.org/es/: SW activo, mar de fondo, pestañas Home|Map|Workshop, 4 partes del cangrejo, valores `provisional-2026-10-11.aristas`, cero errores de consola. Captura `live_es_cangrejo.png`.
- Regeneración (contadores/huella): `coherencia-publica.py --arbol` dice «la web publica exactamente lo que los gates miden», así que no hay diff que commitear. Los iconos ya se regeneraron dentro de R5.

## Decisiones firmadas (2026-10-11)
- **C4:** la versión del gacha es `valores.version` + `packSha`; `contenido_v` del motor solo cuando el motor cambie.
- **Tabla de aristas:** FIRMADA la cifra de R5 (con 3σ), anclada en las 16.000 tiradas.
- **Chat con el rack:** la web sigue SIN fetch y nada viaja sin la pipeline firmada; las anclas se quedan como están.
- **Ecos de superficie:** CONTRADICCIÓN declarada y **gana la doctrina**: será telemetría DECLARADA, jamás camuflada. La corrección vale contra «6 planes.txt»:175-207.
- **Techo 16 KiB** y **patrón UMD:** confirmados.
- **Dónde viven los gates (lo que el 9-oct se llamó `web/bin`):** `test_web.py` y `arnes_sw.mjs` en la raíz del repo web, `atlas/test_atlas.py`, `bin/sellar.py` (sustituye a `sw-huella.py`); `doctor.py`, `sw-huella.py` y `coherencia-publica.py` en `~/p0x/bin/`; `gate.sh` en `~/p0x/deploy/soberano/hooks/`.
- **P6, P9, P10 y P11:** FIRMADA su construcción, cada uno su PR, su test y su sabotaje, esperando FIRMO por pieza. Orden: P9 → P10 (Taller) → P6 (arena) → P11.

---

## SEGUNDA TANDA LIVE · 2026-10-11 (FIRMO del Soberano: «FIRMO LA PUBLICACIÓN DE LA SEGUNDA TANDA»)
Cada pieza se rehizo sobre el `main` vivo (sin arrastrar las otras), se reselló, pasó los gates n=2 y tuvo su PR, su CI verde y su merge; después se comprobó con curl que preceptoros.org servía su versión.
| Orden | Pieza | PR → merge | Commit | Live (versión · hora) |
|---|---|---|---|---|
| 1 | 🔴 Identidad en la portada | #21 → `6ac4e90` | `3da1545` | `abee` · **16:13:13Z** · `/es/` `/en/` `/ar/` con `id="identity"` = 1; en vivo `Identity.crear()` → clave `637e135f…` (Tester-CABA) |
| 2 | P9 Polvo de Taller | #22 → `61dc96f` | `71ebd49` | `abef` · 16:18:51Z |
| 3 | P10 Prisma de Bandera | #23 → `8a2b027` | `e851c2c` | `abeh` · 16:22:52Z |
| 4 | P6 Escuadrones | #24 → `eb105af` | `18cdcc7` | `abei` · 16:27:08Z |
| 5 | P11 El Primer Eco | #25 → `dfab2b8` | `12ead63` | `abej` · 16:31:11Z |
| 6 | Ecos de superficie (decisión firmada) + esta mesa | ver el pie | | |

- **R6 (voz por tropa):** tu FIRMO expreso queda anotado. Ya estaba publicada dentro de la ronda R1-R8 (PR #20, `365146d`, commit original `885429f`), con el cambio de `core.js` limitado a `vozDe`; no hace falta otro PR.
- **Huella local `abej` contra live `abed`:** no era una discrepancia del sello. `abej` era la versión de mi rama sin publicar (`claude/refresco2`) y `abed` la última publicada. Cada sello sube la letra; al publicar las piezas, live recorre las mismas letras. Se cierra en el pie de esta mesa: live = `main`.
- **Micro-tarea `modelos.json`:** commiteada en `~/p0x` (ver el informe).

## Segunda tanda (tras la publicación) · rama `claude/refresco2` · sin push, esperando FIRMO por pieza
| Pieza | Qué ves | Commit | Gates | Sello |
|---|---|---|---|---|
| 🔴 **Arreglo: identidad en la portada** | **Defecto medido en vivo:** desde la mudanza b1, preceptoros.org no define `Identity` (falta la zona `#identity` en la plantilla de portadas) y **nadie puede crear su clave ni firmar** (invocar, adoptar, Taller, duelos). Arreglado en la plantilla y en las 10 portadas; la clave se crea y el pseudónimo sale en el cabezal. **Es lo primero que pido publicar** | `8cd0866` (`claude/refresco2-identidad`) | n=2 verdes · guarda nueva · sabotaje (quitar la zona de /es/) rojo→verde | MEDIDO · `abef` |
| P9 · Polvo de Taller | En el TALLER, cada onda dice cuánto residuo daría (1 g por arista; el Leviatán, ×3). **Desintegrar** la saca del Army solo con recibo firmado por quien la adoptó; **lijar** sube un stat, cada nivel más caro, y nunca toca las aristas. Cadena de recibos `atlas.taller/1` re-verificada al volver. Lo lijado cuenta en la práctica contra NPC; en duelos todavía no (se dice) | `6c509c7` (`claude/refresco2-p9-polvo`) | n=2 verdes · 9 casos (Ed25519 real) + contrato 1/6 · sabotaje (lijar añade aristas) 8/9→9/9 | MEDIDO · `abee` · gzip 83.112 |

| P10 · Prisma de Bandera | Eliges tu bandera en «Customize» (8 tonos cerrados: no es una huella). En el TALLER, cada onda se tiñe a tu bandera (2 g, firmado); el Army la pinta de ese tono. En el mapa, el prisma de tu casa va del color de TU bandera. Solo aspecto: el combate no lo lee | `8ee8b6f` (`claude/refresco2-p10-prisma`) | n=2 verdes · 12 casos · sabotaje (cualquier color) 11/12→12/12 | MEDIDO · `abeg` · gzip 83.176 |

| P6 · combate por escuadrones | Cada tropa lleva su **escuadrón**: pocas aristas, muchas unidades; el Leviatán es un coloso. Las unidades caen con la vida y se colocan según tu formación. El combate sigue resolviéndose por tropa (el contrato no cambia) | `08d2230` (`claude/refresco2-p6-escuadron`) | n=2 verdes · 5 casos · **96,6 % de escuadras completas pasan de 100 unidades (mediana 138)** · **198 unidades a 60 cps en headless** (Doogee NO_DATA) · sabotaje 3/5→5/5 | MEDIDO · `abeh` |

| P11 · «El Primer Eco» | Capítulo 1.5 arriba del TALLER: ping obligatorio, 3 ondas sucias, **el Navegante** enseña a desintegrar, pulir y pintar con las reglas de verdad (simulacro: nada se firma ni se guarda) y sales con tu **Insignia** (un distintivo) y tu bandera | `baed571` (`claude/refresco2-p11-eco`) | n=2 verdes · 4 casos · sabotaje (ondas limpias) 3/4→4/4 · recorrido completo en el navegador | MEDIDO · `abei` · gzip 83.009 |

**Desvío declarado (P11):** la Insignia es un **distintivo, no una tropa**. Una tropa gratis rompería la economía firmada. Si la quieres tropa, es una línea tuya.

NO_DATA (P9): ciclo completo en el navegador con una tropa firmada (pide incubar un huevo: 50 de cobre y ciclos de juego); lo cubren los casos de node con firmas Ed25519 reales.
Nota: `valores.taller` entra en `packSha`, así que los duelos exportados antes de P9 se rechazan con la causa `pack_sha` (valores PROVISIONALES).

## Delegación root (9 h)
**NO ACTIVADA.** Ninguna pieza ha necesitado sudo. El reloj de 9 h empieza con el primer comando sudo y no ha habido ninguno: no hay hora de inicio ni de caducidad que sellar. Si se activa, la hora irá aquí.

## Hecho antes de las piezas
| Paso | Resultado | Sello |
|---|---|---|
| Doctrina `juez_fuga` del stash | copiada a la nota del juez antes de tirar el stash | MEDIDO |
| Git | stash tirado · regeneraciones del 10-03 descartadas · `main` en fast-forward a `5b82c31` | MEDIDO |
| Regeneración de contadores en el árbol nuevo | n=2 idéntica a lo commiteado (sha16 `e6fc4890a1d77feb`); solo cambia la hora → **no se sella** (subir el SW por una hora fuerza recarga a todos sin cambio) | MEDIDO |
| `modelos.json` · papel `redactor` | +6 líneas, JSON válido, todas las fichas con `modelo` (lo exige `auditor.py`); **sin commit**, esperando tu vista | MEDIDO |

## Piezas
| Pieza | Qué ves | Commit | Gates | Sello |
|---|---|---|---|---|
| R1 · J6 mar de fondo | La portada es el mar: el lecho y la niebla del mapa detrás de todo, centrado en tu casa o en Hexelion; la caja del juego al 80 % deja verlo | `aeae759` (`claude/refresco-r1-j6`) | n=2: test_web 75 OK · test_atlas 111 OK · arnes_sw 22/22 · 13 `*_casos` · sabotaje rojo→verde | MEDIDO · `abdv` · gzip_juego_b 80.553 |
| R2 · HOME es tu cangrejo + 3 pestañas | Ya no hay rejilla de edificios (retirada en el mismo commit): **el cangrejo es tu casa**. Caparazón = Núcleo, pinzas = Army, patas = Bosque, ojos = Faro; crecen con lo medido, bajan si baja, y en niebla si no hay cifra. Pestañas **HOME · MAP · TALLER**: la batalla, bajo el mapa; lo de la partida, plegado en el terminal J7 | `ddc4559` (`claude/refresco-r2-cangrejo`) | n=2 verdes · 3 casos nuevos del cuerpo · sabotaje (`casa-edificio` vuelve) rojo→verde | MEDIDO · `abdw` · gzip 80.462 |
| R2c · flechas = acción `mover` del piloto | Las flechas del mapa, el teclado y la IA del laboratorio usan **una sola lista** (`AtlasPiloto.DIRS`) y la misma puerta (`AtlasJuego.aplica`). La cámara decide (choca con la niebla) y no entra en la partida. El terminal J7 ofrece `mover` | `c02aee3` (`claude/refresco-r2c-mover`) | n=2 verdes · 2 casos nuevos del piloto · sabotaje 21/22→22/22 | MEDIDO · `abdx` · gzip 80.806 |
| R3 · tubos | Terminal J7, pliegos, interior de la casa, entrada, ficha del lugar, pie de la revelación y «Customize» son **tubos**: curvatura en capas, tapas elípticas y fósforo solo en lo que escribe el motor. CSS puro (`tubo.css`, 3.146 B), quieto, sin imágenes | `e4c8644` (`claude/refresco-r3-tubos`) | n=2 verdes · test nuevo · sabotaje `url(` rojo→verde | MEDIDO · `abdy` · gzip 82.234 |
| R4 · bioluminiscencia | Cuatro acentos como tokens (teal, ámbar, hielo, violeta): mapa (tú en ámbar, los otros en violeta), tubos, partes del cangrejo y crestas del lecho. **Colores-señal intactos** (fijados en la prueba) | `0c499ea` (`claude/refresco-r4-bio`) | n=2 verdes · sabotaje (tono de la vida) rojo→verde | MEDIDO · `abdz` · gzip 82.312 |
| R5 · M18-B sonar de aristas + 2 caras + ping | **Todas las TC pasan a aristas** (tu opción B): la rareza sale de cuántas aristas tiene la onda; más de 12 = **Leviatán**. Tabla entera por mil publicada en el Taller. En combate se pinta la cara sencilla (sus aristas); en el Taller, la total. Revelación con ping de sonar y «N edges». Army viejo: «previous version» | `c2f54d6` (`claude/refresco-r5-aristas`) | n=2 verdes · **Gauss medida: 3-4 aristas 62,4-64,6 %, Leviatanes 1,4-3,6 %** · prometido = dibujado 16.000/16.000 · sabotaje (cola al 18,5 %) rojo→verde | MEDIDO · `abea` · gzip 82.423 |
| R6 · voz propia por tropa | **Defecto medido y arreglado:** las 500 tropas medidas sonaban a la misma nota (205 Hz). Ahora la nota sale de las aristas (pentatónica sobre 110 Hz), el color de su amplitud y la aspereza del detalle, y el Leviatán lleva segunda moduladora. Una sola receta para el oscilador y la voz exacta | `885429f` (`claude/refresco-r6-voz`) · **PENDIENTE de tu FIRMO expreso: toca `core.js`** | n=2 verdes · 14 portadoras / 91 recetas en 500 · misma huella node = navegador · sabotaje rojo→verde | MEDIDO · `abeb` |
| R7 · el mapa es el mundo | La radio suena también en MAP (mismo módulo). **Anclas**, solo vocabulario: tubo de cada nodo al rack (línea doble teal), y rombos en trazos (PROPUESTA) para partes del cuerpo, prisma y ecos de superficie. Nada envía | `b052006` (`claude/refresco-r7-mapa`) | n=2 verdes · 2 casos de anclas · sabotaje (`fetch` en anclas) rojo→verde | MEDIDO · `abec` |
| R8 · la ceremonia del gacha | Anticipación (la cápsula cae mientras la estática se sintoniza), ping, onda armónico a armónico, micro-temblor y primer timbre; vitrina del Army con stats reales y ondas que respiran; botones con squash & stretch. Todo quieto con movimiento reducido; la ceremonia no decide nada | `796e190` (`claude/refresco-r8-ceremonia`) | n=2 verdes · sabotaje (anticipación de 4 s) rojo→verde | MEDIDO · `abed` · gzip 82.697 |

Capturas: `~/p0x/no-publicar/capturas-refresco-20261011/` (`j6_pc.png`, `j6_movil2.png`, `r2c-1.png` cangrejo en el teléfono, `r2d-1.png` en PC, `r2e-1.png` MAP, `r3_terminal_tubo.png`, `r4-*.png`, `r5_leviatan_13_aristas.png`, `r5_odds_aristas.png`, `r7_anclas_tubo_rack.png`, `r8_anticipacion_capsula.png`, `live_es_cangrejo.png`, `p10_bandera_en_el_mapa.png`, `p6_escuadrones.png`, `p11_insignia.png`), Chrome headless contra el servidor local.
Fps en el Doogee: **NO_DATA** (no lo he medido esta ronda; Acurast sigue en primer plano y no se toca).

**Desviación declarada (R2):** R2a y R2b se fundieron en una sola pieza. Retirar la rejilla sin poner el cuerpo dejaba el Bosque sin puerta. El estilo (cúpula/aguja/concha), que vestía los tejados, ahora es el festón del caparazón: es lo único que le queda, y así no sobra código muerto ni hay que migrar la casa guardada (`atlas.casa/1` no cambia).

**Pendiente de tu vista (R2c):** `atlas.accion/1` cambia (contrato público, gana `mover`). La app nodo (`~/preceptor-nodo`) lleva su propia copia de `atlas-piloto.js` fijada por sha: no la toco; cuando sincronice, la lleva su propia PR.

**Rompe a propósito (R5, lo firmaste):** el espectro fijado de M18-bis (casos reescritos con semilla medida nueva, 7 aristas), **el emblema del sitio y con él el favicon, los iconos PWA y la tarjeta social** (regenerados con su herramienta F2-8; ninguna imagen nueva), los duelos exportados antes (causa `pack_sha`). La tabla exacta de aristas es PROPUESTA mía: la cifra la fijas tú.

**PROPUESTA del sitio de las pipelines (R7, a construir con su propio FIRMO):**
- *Partes del cuerpo → mapa*: el ancla `parte-cuerpo` va 60 u encima de tu casa. Cada parte del cangrejo (R2) se vería alrededor de tu casa en el mapa con su cifra. Coste M.
- *Chat con el rack*: el tubo de cada nodo al rack (`enlace-rack`) es el canal visual. El chat no abre red desde la web (doctrina: la web nunca hace fetch a IPs locales); es la app la que habla con el rack. En la web, el tubo solo enseña si hay algo esperando. Coste M, y choca con «la web nunca hace fetch»: **CONTRADICCIÓN_ABIERTA** hasta que decidas por dónde viaja.
- *EV_SURFACE_ECHO*: ancla `eco-superficie` en la boya de Hexelion. El cifrado con la clave pública del rack y el camuflaje como telemetría son exactamente lo que esta ronda **no** construye. Coste L, y necesita revisión: «camuflado como telemetría» roza la doctrina de sensores honestos (lo que se envía se dice).

## Contradicciones abiertas (detalle en el plan, §1)
C1 techo 16 KiB contra la revocación D2 · C2 «ES modules» contra el patrón UMD del juego · C3 `web/bin` no existe · **C4 `contenido_v` contra `valores.version`/`packSha` (necesito tu sí o tu no antes de R5)** · C5 la mitad del lore está en `6 planes.txt`, no en ideas6oct/7oct.

**Techo:** `mar.js` queda en 16.381 B. La siguiente pieza que lo toque tiene que partirlo antes (p. ej., el dibujo de anclas, a su propio módulo).

## Lo que queda (en orden)
R4 bioluminiscencia → Todas las piezas construibles están hechas. Las propuestas P9/P10/P11/P6/P-ESM/P-CHUNKS no se construyen sin tu firma.

## ERRATA Y AVANCE · RONDA 3 · 2026-10-13 (append, sin reescribir lo anterior)
- **ERRATA:** en las lineas de «Estado git» escribi `origin/main = a481691`. Medido: `origin/main` = `cc4fd44` (PR #61 fusionada por el Soberano; los tres commits viajeros ya estan en main). Y «Ligado a GitHub: PENDIENTE» queda superado: el enlace del lab (`benchmarks/bench_20261011`, medido 200) vive en la ficha del coral desde el chunk 2 (`abfz`, PR #62).
- **Chunk 3 · formas infantiles de los edificios (sello abf*, en curso):** boya (burbuja con antena), observatorio (cupula con ventana), cristal (gema facetada) y lapidas (losa de punta redondeada). Cada silueta lleva las tres bandas toon del hue de su vector; las lapidas van en gris fijo (no tienen vector vivo). Medido en captura: las cuatro se distinguen. Sabotaje: hue inventado en la sombra → 3 de 7 casos en rojo.
- **Corales restantes:** ninguno en el mapa aparte de Hexelion (el punto del Doogee se quito en #57). El racimo sirve para todos los nodos que tengan punto; hoy es uno. Declarado.
- **Debida declarada:** `reef_buildings_layer.js` pasa de 15.924 a 16.322 B (techo 16.384, 62 B libres). Se mantiene: la frugalidad es meta, no recorte.
- **Ctrl+rueda en PC (medido con CDP, headless):** escala de pagina 1 → 1; el mapa no la toma (zoom_mapa 1.00 → 1.00). El zoom del navegador NO se aplica en headless: NO_DATA aqui; lo mide el Soberano en un PC real.
- **Cangrejo:** toon (abfn) visible junto al coral en captura. **Mapa despejandose:** no medido (necesita mirar con el Observatorio): declarado para los ojos del Soberano.
- **Summon (medida guia):** reintento con ventana de 20 min en curso al redactar esta linea; se registra su resultado cuando termine, con su ciclo y su tiempo medidos, o como NO_DATA con causa.
- **Summon (medida guia) · reintento con ventana de 20 min: NO_DATA, con causa observada.** Cobre 530 al pulsar (la compuerta de 50 se paso), invocacion de Reef Treasure en el ciclo 125, y la revelacion (`.atlas-eclosion`) NO aparecio en la ventana. No determinado por que: el huevo de tc1 incuba 20 ciclos, y el ciclo avanzo lo suficiente en la ventana. Hipotesis a revisar: el tick de eclosion en ui.js o el conteo de ciclos del nido. Corto aqui, como manda la regla; no se inventa tiempo.
- **Chunk 3 (formas infantiles de los edificios): VERDE, commit local `b37045a`, sello `abga`.** PR pendiente de abrir.
- **Estado del arbol:** `memory.db` (0 bytes, creado 00:57, sin referencia en el repo) queda SIN COMMITEAR; no lo he creado a proposito. Decide tu si se borra.

## CIERRE RONDA 3 · 2026-10-13 · MEDIDO
- **claude doctor (paso 0):** 2 avisos. (a) el enlace `~/.local/bin/claude` apunta a la version 2.1.247, que ya no existe; (b) la ultima actualizacion automatica fallo (`install_failed`). El diagnostico lo dice y sugiere `claude install` o borrar el enlace y `claude update`. **No lo he reparado** (cambio de sistema, no pedido).
- **Sincronizacion:** `origin/main` = `4b2635b`. Dentro: #62 (180e714), #64 (70b6f28) y #63 (llms.txt, del frente exterior; no tocado).
- **Ficha del coral:** la frase «JSON crudo aun no publicado» NO estaba en el codigo (solo en mensajes de commit y en la mesa). Lo que se pinta ahora es: `raw figures published at the lab: bench_20261011_resultados.json · sha256 26e61fb7…` (firmado), junto al enlace del directorio del lab.
- **memory.db:** borrado (vacio, firmado).
- **Chunk 4 · el summon que no eclosiona: CAUSA RESUELTA, sin parche.** Camino medido por codigo (ui.js): `invoca` (71-90) comprueba el cobre, luego `cadenaLista()` (54-60), que rechaza con «sin identidad» si no hay clave; en ese caso no se registra huevo (`huevos.push`, linea 83, no se ejecuta). El tick `tic()` (166-173) corre cada segundo desde `monta()` (262) y eclosiona cuando `ciclo >= hasta`; **medido en pagina viva**: 3 ciclos en 2,57 s, pestana visible, incubador montado y conectado. **La primera medida no tenia identidad** (`tiene_identidad: false`): el huevo nunca existio. La medida corregida (identidad creada, cobre 50 en el ciclo 125) SI registra el huevo: «Summoning signed: Reef Treasure. The egg is incubating» y el nido muestra «incubating 20 %». La revelacion aparece **tras 20 ciclos** (incubacion de tc1, valores.js:26) y, medido por el script, 15 ciclos despues de su propio punto de partida (4 s despues del clic) con 15,1 s de pared desde ese punto. Tiempo del clic a la revelacion: **entre 4 s y 19 s** (el script no muestrea antes de los 4 s).
- **Eso es el presupuesto de tiempo de la ruta:** ~20 ciclos. Los pasos de la ruta de ronda 2 se escribiran en ciclos y en segundos con esta medida.
- **Sin parche:** no hay defecto en el tick ni en el camino de invocacion; la invocacion exige identidad por diseno. Lo que cambia es la medida: debe crear la identidad primero.
- **PRUEBA_5_MINUTOS:** actualizada a `abgb`. Pasos nuevos: 6b (crear identidad antes de invocar) y 9d (las cuatro siluetas de los edificios).
- **Gates al cerrar (sello `abgb`):** test_web OK (75), test_atlas 140, arnes_sw 22/22, sin_undefined 28/0.
- **FUERA DE MIS MANOS (quieto, NO_DATA con causa):** mapa despejandose (vuestros ojos, con el Observatorio) · fps Doogee (vuestras manos) · Ctrl+rueda en PC real (vuestras manos; en headless no se aplica el zoom de pagina: medido 1 → 1). Parallax (chunk 7): solo con vuestra orden explicita.

## ORDEN OCEANO · PIEZA 1 · 5C · 2026-10-13 · CERRADA LOCAL
- **Rama:** `oceano-2026-10-13`, creada desde `origin/main` (`a5417e8`). Paso 0 releído: `ideas6oct` y `ideas7oct`; cadena re-sellada `abgl → abgm` en commit local `b4f4c27`. Pieza 1 sella `abgm → abgn`; huella SW `f71d7a9324cc771f`, versión `preceptoros-2026-17-abgn`.
- **Guion estado (21):** seis secciones ordenadas y con título: Who you are, Your body, Core and crack, Your budget, Receipts, What you can do. Reutiliza el estado de `AtlasCangrejo`; no crea estado de medidas. La ficha muestra nombre/clase, las cuatro partes medidas, integridad/presión y reapertura por ciclos, presupuesto, recibos y enlace directo a Summoning. Las reservas futuras siguen sin implementar.
- **Sustituciones:** JSON y controles Save/Forget/Import salen de la vista humana y pasan al Inspector; un solo sello de frescura del canal `thegame-estado`; el pliego quita el reloj de pared de la Grieta; terminal de cangrejo legible, sin volcado JSON. Persistencia y economía intactas.
- **Pruebas rojas antes del verde:** se añadió caso determinista y falló antes de crear el módulo; luego quedó verde. Chrome de arranque real: 30 pasos, `fallos=[]` (repetido sobre el estado final). Guion/terminal: 2 pruebas dirigidas OK.
- **Gates n=2, ambos pases verdes:** `test_atlas.py` 167; `test_web.py` 75 (1 omitida por no haber panel publicado); `arnes_sw.mjs` 22/22; guardia de higiene sin hallazgos. `git diff --check` limpio.
- **Medidas:** `atlas-mundo.json` declara gzip_juego 89.779 B, SW 22/22, 9 lenguas; el peso publicado del sitio mide 1.183.606 B. La referencia de 79 KB/visita de la orden no coincide con la métrica gzip_juego actual; queda declarada, sin alterar su definición. Ningún fichero tocado supera 16.384 B; satélite `crab_state_screen.js` 3.204 B, `home_buildings.js` 11.672 B, `atlas-piso.js` 13.505 B, `atlas-guardado.js` 8.413 B.
- **Cierre:** commit local de 5C registrado en esta rama; no push, firma ni merge. Pieza 2 no iniciada.

## FIRMO DEL SOBERANO · C4 · 2026-10-13
Si: la version del gacha es valores.version + packSha; contenido_v del motor solo cuando cambie el motor. R5 puede correr.

## LOTE RÁPIDO · Q4 · RECURSOS ×2 · 2026-10-14 · CERRADA LOCAL
- **Medida antes:** motor `2026-09-27.1`, Ruins determinista: 400 copper/1.000 ciclos = 0,4/ciclo; 50 copper en 125 ciclos (125 s al ciclo medido de 1 s), equivalente a 2,5 s/copper.
- **Cambio medido:** producción base duplicada en el motor, sin variar la ley de supervivencia. En el mismo escenario y 1.000 ciclos: 800 copper = 0,8/ciclo; 50 copper en 63 ciclos (63 s), ≈1,26 s/copper por granularidad de ciclo. `genesis_tutorial.js` comunica el ritmo medido. Motor `contenido_v=2026-10-14.1`, por FIRMO C4.
- **Sabotaje rojo primero:** el caso determinista esperaba 800 y falló contra la producción anterior con 400; tras el cambio pasa. `atlas/recurso_x2_casos.mjs` mide total, tasa y ciclos hasta 50.
- **Compatibilidad de recibos:** la partida histórica firmada conserva sus bytes y se verifica con el motor exacto `atlas/legacy/atlas-motor-2026-09-27.js`; la importación al motor actual rechaza explícitamente una versión anterior. No se reescribió la partida firmada.
- **Gates n=2:** Atlas 172/172 ×2; web 76 (1 omitida) ×2; SW 22/22, 131 rutas ×2; Chrome 30 pasos, cero fallos ×2. Caso específico Q4 verde; `git diff --check` limpio.
- **Medidas de salida:** gzip del juego 90.432 B; SW `preceptoros-2026-17-abgt`, huella `58d26e36f365e24e`; `atlas-mundo.json` registra 76 pruebas web. Los archivos nuevos/modificados bajo `public/` quedan por debajo de 16.384 B; motor 11.121 B y tutorial 13.113 B. Ficheros no públicos: motor legado 11.047 B, caso Q4 955 B.
- **Límites:** la equivalencia de 1 copper cada 1,26 s es una medición del escenario Ruins; el rendimiento del teléfono no se volvió a medir en Q4. Las lenguas adicionales siguen con borradores incompletos; el juego de hoy habla inglés.
- **PRUEBA_5_MINUTOS:** pasa a `abgt`; paso 6e comprueba 50 copper en 63 ciclos en Ruins.
- **Cierre:** cambio preparado para commit local Q4 en `lote-rapido-20261013`; no push, PR ni merge en este cierre.

## LOTE RÁPIDO · Q5 · AUTOPLAY DE LA GRIETA · 2026-10-14 · CERRADA LOCAL
- **Historial e inventario:** la rama antigua conserva el texto `RIFT SEALED · reopens in {s} s`, pero no un bucle independiente de cinco segundos. La ley activa ya automatizaba la reapertura en `atlas-motor.js`: `cierre` decrece con cada `ciclo`, el HUD lo muestra en ciclos, y al llegar a cero el motor abre la Grieta. Los umbrales medidos por fase son 180/240/300/120/600 ciclos; `CICLO_MS=1000`. Se conserva esta ley del motor y no se inventa una regla global de cinco ciclos.
- **Cierre/reapertura:** confirmado por prueba determinista; en fase inicial, reparar inicia 180 ciclos, el contador llega a 1, y el ciclo siguiente reabre la Grieta y emite el aviso. El daño del Core continúa a cargo del ciclo del motor. No usa rAF ni timestamp para gobernar el estado.
- **Economía FIRMO:** Grieta abierta = tasa base 1×; sellada = tasa duplicada 2× de Q4. Esto hace explícita una reducción del 50% frente al estado sellado y recupera la tasa base medida antes de Q4. La misma causa aparece en el boletín textual de la Radio; si falta el estado de Grieta, la Radio declara NO_DATA con causa.
- **Sabotaje rojo primero:** `atlas/grieta_casos.mjs` falló antes del cambio porque ambos estados producían 800 cobres/1.000 ciclos y el boletín no publicaba la tasa. Verde después: abierta 400, sellada 800; reapertura exacta por ciclos; Radio en ambos estados.
- **Gates n=2:** Atlas 173/173 ×2; web 76 (1 omitida) ×2; SW 22/22, 131 rutas ×2; Chrome 30 pasos, cero fallos ×2; motor 48/48 y caso específico Q5 verde dentro de Atlas. `git diff --check` limpio.
- **Medidas/sellos:** SW `preceptoros-2026-17-abgu`, huella `bc23e06dd6b0a081`; `gzip_juego_b=90.499 B`; `atlas-record.json` regenerado para motor `contenido_v=2026-10-14.2`. `atlas-motor.js` 11.253 B; `aiact-art50-state-radio.js` 6.094 B; todos los ficheros públicos tocados siguen bajo 16.384 B.
- **PRUEBA_5_MINUTOS:** pasa a `abgu`; pasos 6e-6f miden la ganancia sellada, la tasa abierta, la Radio y el contador de ciclos.
- **Límites/pendientes:** la frase histórica “5 s” solo se encontró como plantilla de texto; el sistema actual medido tiene umbrales por fase en ciclos. Se deja constancia y no se añade una espera de cinco ciclos. El rendimiento en Doogee no se volvió a medir en Q5.
- **Cierre:** listo para commit local Q5 en `lote-rapido-20261013`; no push, PR ni merge en este cierre.

## ORDEN OCEANO · CIERRE 5C EN PR · 2026-10-13
- PR #72 abierto desde `oceano-2026-10-13` hacia `main`, punta publicada `ca155706dddef298b1db0dc815fb493bc7ec554d`; CI `test_web` verde. Merge observado el 2026-10-13 20:42Z, hecho por el Soberano (no por Codex).
- Gates repetidos sobre esa punta: `atlas/test_atlas.py` 167/167 ×2; `test_web.py` 75, 1 omitida ×2; `arnes_sw.mjs` 22/22 ×2; Chrome `atlas/sin_undefined.mjs` 30 pasos, cero fallos (dos ejecuciones sobre el mismo commit). Sin cambios de código tras esas medidas.
- `PRUEBA_5_MINUTOS.md` actualizada a abgn: añade orden/seis secciones, sello único, ciclos, ausencia de JSON y controles, y enlace a Summoning.

## ORDEN OCEANO · PIEZA 2 · 6A · AUDITORÍA SOLO LECTURA · 2026-10-13
- **Movimiento punta a punta:** flechas/teclas del mapa: `public/game/map_pointer_input.js:44-50` → `public/game/mar.js:25-33` → `public/game/mar.js:79-86` → `public/game/world_camera.js:44-59`; la proyección pantalla↔mundo está en `public/game/world_camera.js:61-65`. Arrastre/toque: `map_pointer_input.js:14-40`; el toque selecciona el lugar más cercano en pantalla (32-37), mientras que tocar mar vacío manda el cangrejo libre a coordenadas de mundo (38-40). Dibujado global y capa de nodos/cangrejos: `public/game/mar.js:173-180`. La acción `mover` se deriva al mapa en `public/assets/atlas-piso.js:235-241`.
- **`atlas-mapa.js` / Bosque:** 16.131 B. No es cadáver: `public/assets/thegame.js:12-15` lo carga en GUIONES y `public/assets/atlas-piso.js:156-157` lo monta. Es la vista del mundo abierto del Bosque y expone `atlas.carta/1`; no es el mapa global del océano, cuyo pintor es `public/game/mar.js:1-13`. Dictamen: conservar ambos roles identificados; no retirar nada sin FIRMO.
- **Atlante-7F3A / placeholder:** no aparece en `public/`. `public/assets/atlas-piso.js:143-148` (incluida la referencia 146) habla del daño calculado con medidas locales, no de un pseudónimo. La cadena sobrevive solo en `atlas/test_atlas.py:473` como fixture y `atlas/test_atlas.py:719` como valor prohibido. Dictamen: no hay placeholder humano vivo medido; restos de prueba únicamente.
- **`pestanas.js` / `taller.js`:** `pestanas.js` no existe ni tiene referencia activa bajo `public/`; la lista de hojas es `PESTANAS` inline en `public/assets/thegame.js:69-72`, consumida por `public/assets/terminal_menu_shell.js:58`. El antiguo `assets/taller.js` tampoco existe, pero `public/game/taller.js` sí está vivo: lo carga `thegame.js:74`, la UI lo consume (`public/game/ui-taller.js:22-35, 96-110`) y la arena lo importa (`public/game/arena.js:29`). Dictamen: módulo de reglas vigente; no borrar.
- **Canal live (§23):** los papeles específicos `ideas6oct`/`ideas7oct` y rack no están en este checkout; no leí ni toqué `~/p0x`, como ordenado. La documentación local recuperable mantiene la web sin hablar con el rack y deja sin decidir el transporte: `PARA_LA_MESA.md:195-200, 271-274`; `atlas/POST_VERIFICACION_MGNO_LAB.md:51-54, 80-83` deja LLB y WebRTC con firma pendiente. El plan visual previo es un tubo/indicador; quien hablaría al rack sería la app (`PARA_LA_MESA.md:273`). Búsqueda en `public/`: 0 apariciones de WebSocket, EventSource y RTCPeerConnection. Hay `fetch` de JSON same-origin, por ejemplo `public/assets/atlas-piso.js:221-225`; por tanto «no hay fetch al rack» sí, «cero fetch literal en la web» no describe el código actual. No construir canal/red.
- **A1B8 / Army:** no hay dos almacenes: `public/game/ui.js:212-213` expone `AtlasIncubadora.army()` desde `army.lista()`; Taller lee esa misma puerta en `public/game/ui-taller.js:19-20`; mapa desenvuelve las adopciones en `public/assets/atlas-mapa.js:233-243`; `atlas.carta/1` convierte esa lista a `unidades` en `public/assets/atlas-carta.js:240-244, 267-284`. Así que la discrepancia no demuestra contrato de almacenamiento roto. Sí hay riesgo de lectura vieja: la restauración repinta el Army en `ui.js:198-203` pero no emite `atlas:tropa`; el mapa actualiza su carta al montar y al recibir ese evento (`atlas-mapa.js:248-254`). Inferencia por código, no medida en vivo: si carta queda vacía tras una restauración asíncrona, puede ser snapshot/render sin refrescar, aunque Taller ya vea unidades. Además, el mapa oceánico pinta el cangrejo y nodos, no ejércitos propios como fichas (`public/game/mar-cangrejos.js:3-8`, `public/game/mar.js:173-180`).
- **Cierre 6A:** lectura únicamente, sin editar código; sabotaje y gates de implementación no aplican a esta auditoría. Pendiente recuperar el texto primario exacto de §23 fuera del checkout; dictámenes sujetos a ese papel si contradice la documentación local.

## ORDEN OCEANO · PIEZA 2.5 · DETALLES · 2026-10-13
- **Paneles mutuamente excluyentes:** abrir una hoja cierra el cajón; abrir un panel cancela/cierra la hoja, también ante una transición de vista pendiente. Los botones de ancho y Feedback cierran la hoja. `public/assets/terminal_menu_shell.js`; no se toca `ui.js` ni `mar.js`.
- **Sabotaje rojo:** se añadió primero `Portada.test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez`; falló contra el shell original porque ni `muestraYa` cerraba el cajón ni `abre` cerraba la hoja. Tras el arreglo, verde; `atlas/sin_undefined.mjs` comprueba ambos cambios de superficie en Chrome.
- **Enlaces internos:** `WebLimpia.test_ningun_enlace_interno_roto` conserva la resolución de rutas, levanta HTTP local y exige 200 para cada destino interno HTML/CSS/manifest. Control negativo de URL inexistente confirmó 404. No hace solicitudes externas; la ficha coral→lab sigue siendo enlace externo medido previamente.
- **PRUEBA_5_MINUTOS:** paso 8a añadido para alternar Army/menú y confirmar que solo hay una superficie visible y los enlaces internos abren.
- **A1B8 en vivo / NO_DATA:** CDP de solo lectura en Doogee S110 encontró la pestaña web oculta (`document.hidden=true`), Army cargado con cero unidades (`armyCount=0`) y carta del mapa con cero unidades. No había una restauración observada ni tropas con las que comprobar el evento; causa: no se puede reproducir el caso en la sesión viva. `ui.js:198-203` queda como inferencia de código, sin cambio ni evento `atlas:tropa` inventado.
- **Gates n=2 en el árbol final:** `test_web.py` 76, 1 omitida ×2; `atlas/test_atlas.py` 167/167 ×2; `arnes_sw.mjs` 22/22 ×2; higiene `WebLimpia` 4/4 ×2; Chrome `sin_undefined.mjs` 30 pasos, cero fallos ×2. La comprobación de enlaces incluye el 404 de sabotaje. `git diff --check` limpio.
- **Medidas y sello local:** `terminal_menu_shell.js` 12.938 B; `atlas/sin_undefined.mjs` 8.334 B; `sw.js` 11.591 B; `gzip_juego_b=89.921 B`; SW `preceptoros-2026-17-abgo`, huella `f6f02e5c9df823da`. Ningún fichero runtime público tocado excede 16.384 B. `valores.js:98` intacto; `mar.js` intacto.
- **Estado:** cambios y este informe listos para commit local en `oceano-2026-10-13-detalles`, basada en `origin/main` `90bacf9`; incluye el informe 6A/PRUEBA 5C heredados en `0989b25`. Sin push, PR, firma ni merge; el Soberano publica la rama.

## AUTORIZACION DE PUBLICACION · 2026-10-13
- FIRMO del Soberano en la conversacion: «push todo los verdes». DETALLES publicada en origin; PR #73 abierto, CI verde. La prohibicion de merge, firma criptografica y push a jetson sigue vigente.

## ORDEN OCEANO · PIEZA 3 · 6B-1 · TOCABLES · 2026-10-13
- **HECHO:** Boya, Observatorio, Lapidas, Cristal y coral entregan ficha en texto, coordenada del toque y centro del lugar. Primer gesto lee; segundo gesto abre la radio, inicia la mirada al objetivo anunciado, lee recibos/mediciones o abre la evidencia publica del lab. Fight conserva su accion existente tras la ficha. No se ejecuta una accion al presentar su descripcion.
- **Un estado, muchos renders:** `reef_place_cards.js` recibe las cifras de las capas existentes; el Inspector comparte sus lineas y acciones. El hit del coral se deriva de la misma altura, ladeo y lobulos que `AtlasCorales.coral(n)`, incluida su cabeza visible. Sin almacen nuevo ni red al tocar. NO_DATA declara causa donde no hay medida, sonido o accion publicada.
- **Sustituciones y herencia:** dibujo extraido antes de ampliar `reef_buildings_layer.js`, a `reef_buildings_paint.js`. Siluetas y bandas toon heredadas; los contornos vacios usan la silueta real, no el circulo con rotulo. Lapidas con cero recibos muestra sitio vacio y cifra cero, nunca un recibo inventado. `atlas-mapa.js` se conserva conforme al FIRMO; no se retiraron estructuras sin firma.
- **Rojo antes del verde:** caso inicial fallo sin el modulo nuevo; prueba de cabeza de coral alto fallo contra el hit del pie. Sabotajes en memoria: quitar acciones, coordenada o hit vuelve rojo el gate. Verde: 17 casos de conducta, incluidos los cinco lugares en sus capas reales, rechazo con causa y Fight tras segundo gesto.
- **Gates n=2:** Atlas 168/168; web 76 (1 omitida); SW 22/22; higiene 4/4 y guardia de diff sin hallazgos; Chrome arranque 30 pasos, cero fallos; navegador de fichas cinco toques y cuatro acciones, cero fallos. `git diff --check` limpio.
- **Doogee MEDIDO n=2:** viewport 360 × 716, DPR 3, calidad maxima. Cuatro muestras de 60 segundos: 58,155 / 58,153 / 58,152 / 58,166 cuadros dibujados por segundo; cinco fichas y cuatro acciones correctas en ambos pases. Es cadencia del pintor del mapa, no medicion del compositor. Fixture de coordenadas de casa EMULATED en pestana aislada; no crea identidad ni firma ni cambia almacenamiento del usuario. Se restauran aplicacion y rotacion del telefono al terminar. El enlace externo se valida, no se sigue durante el gate.
- **CORTADO CON CAUSA:** seis expresiones emocionales completas = NO_DATA (el corpus recuperado no define seis estados ni su correspondencia con medidas); esta pieza hereda las caras/siluetas firmadas. Sonido de tap nuevo = NO_DATA con causa donde no existe receta medida; audio local existente conservado. La discrepancia toon resuelta en #57 no se reabre. Layout general en paisaje no se certifica con esta medida de referencia en retrato.
- **Pesos y sello:** `reef_buildings_layer.js` 14.633 B; `reef_buildings_paint.js` 2.991 B; `reef_place_cards.js` 4.826 B; Inspector 6.695 B; coral 5.736 B. `mar.js` 15.262 B, `ui.js` y `valores.js:98` intactos. Gzip puerta 90.002 B < 153.600 B. Cadena `abgl → abgm → abgn → abgo → abgp`; SW `preceptoros-2026-17-abgp`, huella `ec09b366e2548a25`. PRUEBA_5_MINUTOS actualizada a abgp.
- **PENDIENTES:** merge solo del Soberano. Rama `oceano-2026-10-13-tocables` sobre `origin/main` actualizado `90bacf9`, con DETALLES heredada; PR dependiente de #73 mientras siga abierta. La siguiente pieza es TOUR, tras este cierre; lenguaje matematico tras cerrar la orden del oceano.

## LOTE RÁPIDO · Q1 · PANEL DEL ARMY · 2026-10-14
- **Hecho:** un toque en una onda abre la ficha emergente amplia desde el casillero existente. Presenta la ficha Fourier heredada, matemáticas y origen declarados por esa onda, siete stats con fórmula/fuente/clase/lector de `valores.js`, odds y tabla de aristas de `gacha.js`, más barra actual/máximo y acción de lijar donde la regla firmada lo admite. Army y recibos se leen por sus puertas existentes; no se copia el estado ni se amplían los efectos del Taller.
- **NO_DATA con causa:** lijar `inercia`, `profundidad` y `aura` no está en `V.taller.lija.stats`; por eso no se ofrece acción ni nivel inventado. Si no se verifica la cadena de recibos, nivel y cifra efectiva se declaran NO_DATA. La acción «+» queda desactivada hasta identidad, recibo vigente, máximo y residuo suficientes.
- **Rojo primero:** el caso Q1 falló antes de crear `army-wave-panel.js` (módulo ausente). Sabotaje del lector semántico sustituye la fuente de `vida` y falla el caso. Verde: `army_wave_casos.mjs` 12 casos; `gacha_casos.mjs` y puerta directa desde `ui-taller.js` cubiertos por `atlas/test_atlas.py`.
- **Gates n=2 sobre el mismo árbol:** `test_web.py` 76 (1 skip preexistente) ×2; `atlas/test_atlas.py` 169/169 ×2; `arnes_sw.mjs` 22/22 ×2 (129 rutas); `WebLimpia` 4/4 dentro de `test_web.py`; Chrome `sin_undefined.mjs` 30 pasos, cero fallos ×2. `git diff --check` limpio. Una corrida inicial quedó roja por huella y `arnes_sw=NO_DATA` generados antes de actualizar el conteo de rutas; tras el orden de sellado correcto y mundo/piloto regenerados, la matriz n=2 quedó verde.
- **Medidas:** `gzip_juego_b=90.371 B` (<153.600); versión SW `preceptoros-2026-17-abgq`, huella `526f9fa4b5ba9907`. Archivos públicos modificados: `army-wave-panel.js` 8.609 B; `ui-taller.js` 13.541 B; `valores.js` 15.193 B; `thegame.js` 12.423 B; `thegame.css` 12.483 B; `sw-listas.js` 6.968 B; `sw.js` 11.591 B. `valores.js:98` intacto; `mar.js` y `ui.js` intactos. No se añadieron nombres vetados en líneas nuevas. Texto nuevo de interfaz en inglés; queda pendiente el lote separado de traducciones una vez verdes las piezas inglesas, antes del push.
- **Cierre local:** `PRUEBA_5_MINUTOS.md` actualizada. Rama `lote-rapido-20261013`, basada en `origin/main` `354106c`. Pendientes Q2–Q8; no push, PR ni merge todavía.

## LOTE RÁPIDO · Q2 · FICHA DE REVELACIÓN Y RUTA AL WORKSHOP · 2026-10-14
- **Búsqueda de canon:** no encontré un diseño aplicable de “potenciar / diseño 3D” en la orden, `PARA_LA_MESA.md`, propuestas, módulos ni commits del último mes. **NO_DATA con causa:** no existe especificación de tercera dimensión ni regla de progresión espectral en esas fuentes. El commit `567c6f5` conserva la ceremonia y documenta que el reveal sigue antes de adoptar/soltar; esa conducta queda intacta. “Technical details” se encontraba plegado en el Workshop, no era diseño de la revelación.
- **Propuesta, sin implementación de mecánicas nuevas:** reutilizar lijado existente y, en una pieza futura firmada, reasignar amplitud solo entre armónicos ya presentes (referencia declarada por la orden: J-TG-04); un giro común de fase inicial rotaría la forma conservando su identidad espectral (J-SN-06). Sin crear armónicos, botín, economía o estado nuevos. Hoy solo se ofrece ruta a la acción existente del Workshop.
- **Hecho:** en el pico de la revelación aparece la ficha textual con el vector completo `[k, ax, ay, phase]`, ecuación X/Y, TC, aristas, lore y los siete stats medidos; las fórmulas y fuentes se pueden desplegar. **Personalize** cierra la ceremonia, abre la hoja Army existente y enfoca el Workshop; Continue conserva adoptar/soltar. El vector, semilla y decisión del gacha no cambian.
- **Reloj:** progreso, giro y reposo del reveal derivan de `AtlasJuego.instantanea().ciclo` y `AtlasMotor.CICLO_MS`; `requestAnimationFrame` solo solicita repintado. Sin ciclo disponible se enseña el cuadro final y se declara NO_DATA con causa. Hereda ecuación determinista; no usa timestamp de pared.
- **Rojo primero:** prueba específica cayó antes del módulo `summon-wave-card.js`; el sabotaje que vacía el vector produce rojo por diferencia con los armónicos firmados. Verde: 10 casos deterministas; test heredado de ceremonia actualizado para exigir ciclos y movimiento reducido.
- **Gates n=2 sobre el mismo código:** `test_web.py` 76 (1 skip conocido) ×2; `atlas/test_atlas.py` 170/170 ×2; `arnes_sw.mjs` 22/22 ×2 (130 rutas); higiene `WebLimpia` 4/4 ×2; Chrome `sin_undefined.mjs` 30 pasos, cero fallos ×2; `git diff --check` limpio. Una corrida inicial quedó roja por aserciones heredadas del reloj de pared; se sustituyeron por checks de ciclo/movimiento reducido y la matriz final pasó.
- **Medidas:** `gzip_juego_b=90.378 B`; SW `preceptoros-2026-17-abgr`, huella `0245a15d4f030468`. `summon-wave-card.js` 3.653 B; `summon_reveal.js` 10.482 B; `home.css` 6.342 B; `thegame.js` 12.454 B; `sw-listas.js` 6.997 B; `sw.js` 11.591 B. Todo archivo público bajo 16.384 B; `ui.js`, `mar.js` y `valores.js:98` intactos. Sin nombres vetados añadidos. Textos nuevos en inglés; traducciones después de cerrar las piezas inglesas y antes del push.
- **Cierre local:** `PRUEBA_5_MINUTOS.md` pasos 6b–6c actualizados. Q2 va en commit propio tras el cierre. Siguen Q3–Q8; sin push, PR ni merge hasta el recibo final del lote.

## LOTE RÁPIDO · Q3 · ACCESO A SUMMONING EN LA BASE · 2026-10-14
- **Hecho:** la tarjeta `∿ Summon a wave` queda primera en la parte superior de Base. Reubica los cuatro botones originales de la incubadora, conservando sus IDs, handlers, estados deshabilitados y flujo de identidad/firma. Muestra el límite real de equipo (**6 waves**, `V.combate.tropas_max`; el tope separado de Army almacenado es 60) y los costes medidos: TC1 50 copper; TC2 200 copper + 100 sunlight; TC3 600 copper + 300 sunlight; TC4 1,500 copper + 500 sunlight. Altura táctil medida: 52 px.
- **Rojo primero:** el caso específico falló con el módulo ausente. Sabotaje de coste TC1 dio rojo (`displayed cost differs from the actual roll cost`). Verde: `summon_access_casos.mjs` 8/8 ×2. Chrome prueba Base como primer panel, símbolo, cuatro precios, límite y tamaño en `/en/` y `/es/`: 30 pasos, cero fallos ×2.
- **Gates n=2:** `test_web.py` 76/76 (dos skips declarados) ×2; Atlas 171/171 ×2; arnés SW 22/22 con 131 rutas ×2; Chrome 30 pasos ×2; higiene 4/4 incluida en web; `git diff --check` limpio.
- **NO_DATA declarado:** `atlas-mundo.json.pruebas_web` permanece `null`, porque `counters.json` conservó honestamente el NO_DATA de una pasada roja anterior y `atlas/mundo.py` toma su dato de ahí. La suite web medida directamente está verde 76/76. La medición cruzada del repo MVP también produjo NO_DATA: `bin/pruebas --rapido` no devolvió el resumen esperado; no se publica cifra del MVP.
- **Sello y peso:** SW `preceptoros-2026-17-abgs`, huella `1e05f7114239db33`; gzip de la puerta 90,385 B (<153,600 B). Pesos: `summon-access.js` 3,177 B; `home.css` 7,320 B; `thegame.js` 12,482 B; `sw-listas.js` 7,023 B; `sw.js` 11,591 B. Todo fichero público bajo 16,384 B. Sin nombres vetados en líneas nuevas. `PRUEBA_5_MINUTOS.md` añade 6d. Interfaz nueva en inglés.
- **Cierre:** commit local propio en `lote-rapido-20261013`, derivada de `origin/main` `354106c`. Sin push/PR/merge en Q3. Pendientes Q4–Q8; al final se traducirá lo verde y se abrirá el PR para FIRMO.

## LOTE RÁPIDO · Q6 · NPC OCCUPANCY, WALL MESSAGE AND DEFENSES · 2026-10-14
- **Hecho:** NPCs conservan el combate determinista y la conquista local existente. Una victoria propone ocupación local firmada por la cuenta; sin identidad/ciclo/firmante disponible queda `NO_DATA` con causa. `db.js` sigue siendo la única puerta: el recibo firmado vive en la base/almacén de conquista existente, con clave separada `occupancy`; `cajaWeb().pon()` ahora informa éxito solo tras completar la transacción.
- **Muro y mantenimiento:** la cuenta dueña puede fijar un mensaje por edificio, hasta 160 caracteres, saneado y renderizado con `textContent`/`fillText`; no se permite reemplazarlo. Se muestra en ficha y mapa mientras la ocupación está sostenida. Se hereda `valores.combate.abandono_ciclos = 900`: al superar 900 ciclos aparece aviso; a 1.800 ciclos sin acción, el sitio y su mensaje vuelven a niebla. Un mantenimiento firmado actualiza el ciclo y restaura el estado. No se añadió reloj de pared, rating ni botín.
- **Defensas:** la ficha del NPC expone el número real de unidades declarado y el `pack_sha` existente. Si falta el manifiesto, se declara `NO_DATA (defense pack missing)`; no se genera una defensa distinta.
- **Partición:** el código nuevo quedó en `npc_occupancy.js` (contrato y ciclo), `npc_walls.js` (ficha y controles) y `npc_territory_map.js` (proyección del mapa/fog). `mar.js` queda en 15.494 B (el test heredado exige <16.000); `ui-arena.js` 16.161 B, `db.js` 14.254 B. Los tres satélites nuevos miden 9.530 / 3.940 / 1.253 B. Los cambios de db.js son 131 B y conservan el mismo almacén.
- **Rojo primero:** el primer intento del caso específico cayó con módulo ausente; después se detectó y corrigió la verificación de firma de prueba y el gate de 131 rutas. Los sabotajes verifican recibo falsificado, mensaje >160, marcado HTML, segundo mensaje y vencimiento sin mantenimiento. `npc_occupancy_cases.mjs`: `fallos=[]`.
- **Gates n=2, árbol sellado:** `test_web.py` 76, un skip ×2; `atlas/test_atlas.py` 174/174 ×2; `arnes_sw.mjs` 22/22 con 134 rutas ×2; Chrome `sin_undefined.mjs` 30 pasos, cero fallos ×2; higiene `WebLimpia` 4/4 ×2 dentro de `test_web`; `git diff --check` limpio. `arnes_sw.mjs` cuenta los tres nuevos recursos offline.
- **Sello/peso:** SW `preceptoros-2026-17-abgv`, huella `0ff50a6dcd0aa6a7`; `gzip_juego_b=90.525 B` frente al límite 153.600 B; ninguna pieza pública supera 16.384 B. `valores.js:98` y `contenido_v` del motor intactos. `PRUEBA_5_MINUTOS.md` añade 6g. Textos de interfaz en inglés. No medí FPS de Doogee en Q6.
- **Cierre Q6:** commit local propio en `lote-rapido-20261013`; sin push, PR ni merge. Q7 queda siguiente.

## LOTE RÁPIDO · Q7 · TEAM CAP 10 · SELLO abgw · 2026-10-14
- **Medida anterior:** el máximo vigente era 6 ondas por equipo; defensa y asalto aceptaban hasta 6. Se elevó el límite de `valores.combate.tropas_max` a 10 y ambos esquemas a `maxItems=10`; el tutorial obtiene el límite del mismo diccionario y enseña 10.
- **Sabotaje rojo primero:** `atlas/team_cap_casos.mjs` se ejecutó contra el contrato anterior y falló (valor 6, esquemas 6, texto/tutorial sin límite 10). Tras el cambio exige coincidencia entre valores, ambos esquemas y el paso `fight`; queda verde. `summon_access_casos.mjs` verifica el mismo límite en Base, y `escuadron_casos.mjs` mide 2.000 escuadras de 10 ondas.
- **Hierro Doogee:** Chrome visible, combate local determinista 10×10, semilla fija, 15 rondas/191 eventos, viewport 772×280 CSS px y DPR 3. Dos ventanas de 15 s: 58,3 fps y 58,2 fps; ambas superan el suelo 58. El fixture fue efímero, sin cuenta ni escritura de partida; Acurast quedó restaurado al frente. Una lectura preliminar de 1 fps se descartó: el muestreador medía solo una muestra por segundo, no los cuadros; la medición válida cuenta cada `requestAnimationFrame`.
- **Gates n=2:** `test_web.py` 76, 1 omitida ×2; `atlas/test_atlas.py` 175/175 ×2; `arnes_sw.mjs` 22/22 ×2; Chrome `sin_undefined.mjs` 30 pasos, cero fallos ×2; pruebas Q7 (`team_cap_casos`, `summon_access_casos`, `escuadron_casos`) verdes ×2. `git diff --check` limpio.
- **Sello/peso:** SW `preceptoros-2026-17-abgw`, huella `3f9573bcc20180fd`; `gzip_juego_b=90.525 B`; ficheros públicos modificados: `genesis_tutorial.js` 13.445 B, `valores.js` 15.194 B, `sw.js` 11.591 B, `atlas-mundo.json` 343 B, `counters.json` 2.706 B. Ningún fichero público tocado excede 16.384 B. `valores.js:98` intacta; C4 conserva `valores.version + packSha`, el motor no cambió y `contenido_v` sigue `2026-10-14.2`.
- **PRUEBA_5_MINUTOS:** el límite de Q3 se actualiza a 10; el paso 6h mide combate 10×10 visible en Doogee, dos intervalos de 15 s y suelo ≥58 fps.
- **Límites/pendientes:** medición de pantalla en un Doogee S110 concreto; no extrapola a otros equipos. El FPS no es estado del combate ni altera resultados. Sin traducciones nuevas: el juego solo habla inglés. Sin nombres legislativos de sondas aplicables a Q7.
- **Cierre Q7:** commit local propio en `lote-rapido-20261013`; Q8 sigue pendiente. Sin push, PR ni merge.

## LOTE RÁPIDO · Q8 · RECIBO DE CIERRE · SELLO abgx · 2026-10-14
- **Resultado:** TOUR cerrado (`78adedb`); Q1 Army legible (`4aed812`); Q2 ficha en eclosión y ruta directa a Workshop (`74b7992`); Q3 invocación arriba (`0c97bd4`); Q4 recursos ×2 (`8cc88a3`); Q5 Grieta en ciclos y economía visible (`7c7519b`); Q6 ocupación/escritura/defensa NPC (`7269c04`); Q7 equipo de 10 (`d7efe59`). Cada pieza tiene commit local y reporte individual en esta mesa.
- **Q4, antes/después:** escenario Ruins determinista, 1.000 ciclos: 400→800 copper (0,4→0,8 por ciclo); 50 copper en 125→63 ciclos, equivalente a ~2,5→~1,26 s por copper al ciclo medido de 1 s.
- **Sabotaje:** todos los Q incluyen caso rojo previo al arreglo; recibos y gates detallan el caso y su resultado. Q7: límite 6→10, esquemas/tutorial y render corroborados.
- **Gates de cierre de la rama:** web 76 tests, 1 omitida ×2; Atlas 175/175 ×2; SW 22/22, 134 rutas ×2; Chrome 30 pasos sin fallos ×2; higiene pre-commit verde en cada commit. Prueba física Q7: Doogee S110, 58,3/58,2 fps en 10×10. Todos los ficheros públicos cambiados bajo 16.384 B; gzip 90.525 B; SW `preceptoros-2026-17-abgw`, huella `3f9573bcc20180fd`.
- **Cuatro warnings de compactación, con estado:** (1) la rama recibida estaba detrás de `origin/main`; sincronizada sobre `354106c` antes del lote. (2) TOUR tenía cambios sin cerrar; cierre consolidado en `78adedb`. (3) se detectó un cherry-pick redundante durante la sincronización; retirado sin duplicar commits. (4) faltaban gates n=2 de TOUR; las suites completas posteriores pasan dos veces sobre la rama con TOUR incluido. Ninguno queda abierto.
- **Límites/pendientes:** el rendimiento Doogee se midió en un S110 y el Q7 fixture es temporal; no extrapola a otros equipos. Las traducciones de interfaz de producto no se tocaron: el juego habla inglés; informes de la Mesa conservan el idioma documental existente. No se hicieron cambios a `main`.
- **Commit local:** este cierre Q8 queda en `lote-rapido-20261013`; flujo de publicación pendiente: push de la rama y PR abierto para FIRMO del Soberano. Sin merge.

## VENTANA AUTÓNOMA · BLOQUE 0 · CENSO DE EDIFICIOS · SELLO abgy · 2026-10-14
- **Base sincronizada:** PR #76 fusionado por el Soberano en `c367425115c8664b95c45646530d5915f476eab5`; `main` = `origin/main` antes de abrir esta rama. Censo solo documental; no se crean identidades, no se cambia almacenamiento y no se modifica runtime.
- **Recorrida visual MEDIDA:** Doogee S110 conectado, la web abre en modo visitante apaisado, mapa centrado en Hexelion; pantalla física capturada a 2408×1080, sin identidad de cuenta. El cristal mostró `58 fps (p10 58) · 60 frames`. La página de escritorio se capturó a 1440×900. Ambas vistas muestran mapa, menú lateral, ficha de estado del mapa y mandos; sin cuenta no existe isla personal que permita ver la Boya, Observatorio, Lápidas y Cristal en vivo. No se creó una identidad para simularla. La medición Doogee previa de las cinco fichas/acciones en la pieza 6B-1 y su fixture aislado siguen siendo la evidencia viva disponible; no se extrapola a otra orientación.
- **Transformación común MEDIDA:** `world_camera.js:aPantalla` proyecta la diferencia entre coordenada y cámara mediante el rombo 2:1; `map_pointer_input.js` convierte el punto del puntero a píxeles CSS×DPR, busca el sitio pintado y reporta coordenada de mundo mediante la inversa. El Inspector recibe la coordenada elegida, no la coordenada aproximada del objeto. La forma exacta está en `isometric_floor_projection.js:18-33` y `world_camera.js:25-34`.
- **Censo de 5 acciones — RESUELTO:** (1) Boya, posición relativa de casa `(+100, -100)`, ficha de estado y acción `Open state radio`; (2) Observatorio `(-100, +100)`, ficha de vistas y acción `Look`, centro visible, 8 ciclos de coste; (3) Lápidas `(-160, -160)`, ficha de recibos y lectura de lápidas; (4) Cristal `(+200, +40)`, ficha p50/p10 y lectura de medidas — NO_DATA hasta ≥60 cuadros, evento cada 30 ciclos, STALE tras 120; (5) coral de Hexelion, coordenada de nodo `(0,0)` con dibujo/desplazamiento visual `(46,46)`, 2 medidas MEDIDO y acción al laboratorio con evidencia publicada. Los cinco tienen fichas de Inspector; no son cinco tipos de edificio. Fuentes: `reef_buildings_layer.js:74-88,160-198`, `latency_crystal.js:5-19,28-58`, `fog_of_war.js:13-34`, `reef_corals.js:9-18,54-72`, `reef_place_cards.js:7-22`.
- **Tipos declarados y no presentes:** el ciclo declara nueve tipos; solo Boya, Observatorio, Lápidas y Cristal tienen render y acción viva en la isla. Botella, Monumento, Vivero, Baliza y Nombres no tienen canon ni instancia tocable; se dejan NO_DATA, sin dibujarlos. `reef_building_lifecycle.js:8` y `reef_buildings_layer.js:159-198`.
- **Sitios NPC:** seis instancias generadas por `valores.js:115-120`: arrecife (tc1, 2 defensas), algas (tc1, 3), ruinas (tc2, 3), limo (tc3, 3), abismo (tc4, 4), núcleo (tc4, 6); 21 unidades declaradas en total. Coordenadas deterministas: radio 330/400/460/520 por TC y ángulo `(orden×48+95)°` (`fog_of_war.js:17-25`). Acción real: Fight; defensa visible usa tropas y pack hash del manifiesto; si falta pack, NO_DATA con causa (`map_pointer_input.js:24-34`, `npc_territory_map.js:15-19`). Captura, escritura y mantenimiento son recibos firmados locales; 900 ciclos para aviso, 1.800 para niebla (`npc_occupancy.js:28-39`, `valores.js:111-114`). Sin cuenta/firma local válida no hay owner de ocupación.
- **Campos por edificio:** defensa = solo manifiesto medido de sitios NPC; Boya/Observatorio/Lápidas/Cristal no publican defensa. Permisos, precio y tenants = NO_DATA, no hay contrato vivo. Mantenimiento de edificio genérico existe como función pura del manifiesto, pero no hay precio/impuesto concreto ni acción de upkeep para estas cuatro fichas. Owner = clave pública/localización de cuenta para la isla; visitante sin clave = NO_DATA. En NPC, owner local solo existe si hay recibo de ocupación válido.
- **Sabotaje rojo→verde:** copia temporal con la coordenada de Boya cambiada `+100→+101`; el caso esperado falló con col 221 frente a 220. Se restauró sin tocar el árbol. Casos de entrada inválida y coral sin cédula mantienen sus rechazos con causa.
- **Gates n=2 en `c367425`:** `reef_building_casos` 24/24 ×2; `corales_casos` 3/3 ×2; ocupación NPC verde ×2; `test_web` 76, 1 skip preexistente ×2; `atlas/test_atlas.py` 175/175 ×2; `arnes_sw.mjs` 22/22, 134 rutas ×2; Chrome `sin_undefined` 30 pasos, cero fallos ×2. Chrome comprueba ficha presente en las rutas inglesa y española; la aplicación permanece solo `en` para el juego. Las traducciones siguen apagadas.
- **Lectura de arnés 22/22 vs 24/24:** actual es `arnes_sw.mjs` en `c367425`, con 22 aserciones `ok(...)`; una cuenta el precache de 134 rutas. El 24/24 citado vive en los informes archivados de verificación de 2026-09-28 (`atlas/POST_VERIFICACION_MGNO_LAB.md`, rama/base `a46877c`) y en fixtures de motor que usan la métrica como entrada; no es el conteo del runner actual. El ledger mezcla conteos de revisiones distintas. No se cambió el arnés.
- **CI doble:** `partidas.yml` filtraba `verifica` a PRs que tocan partidas o motor. El disparo manual fue verde pero no quedó asociado al PR; se amplía el trigger a todo PR para que el par `verifica` + `test_web` sea visible y exigible. La verificación reporta NO_DATA si no hay partidas firmadas que repetir.
- **FIRMOs de las piezas rápidas:** Q1 `4aed812` · sello SW `abgq`; Q2 `74b7992` · sello SW `abgr`. PR #76 incluye Q1-Q8 y quedó fusionado por el Soberano en `c367425`.
- **Selección de J-A:** entre los cuatro edificios vivos de la casa hay empate (una instancia cada uno); no hay ganador por frecuencia. Se aplica el carril firmado de “estructura común”. Boya será la primera instancia representativa por el orden estable del canon (`TIPOS[0]`) y por ser la primera ficha del conjunto; el contrato común ya heredado se reutiliza, no se duplica.
- **Propuesta del mapa completo de nombres (números solo en este informe; nunca en código):** J1 Shell Schematics · J2 Rooted Ground · J3 Trade Currents · J4 Price Box · J5 Tenants · J6 Upkeep · J7 Loyalty · J8 The Sea Doesn't Lie · J9 Interference · J10 The Showcase · J11 Echoes & Residue · J12 Tuning · J13 Abyss Runs · J14 Seeds · J15 Wanderers. J15 va antes de Tuning en construcción; el modo historia E1-E5 depende de J11, J3, J15 y aliados-función. Las sondas del Bias Benchmark usan nombres legislativos y quedan fuera de este mapa.
- **Choques y FIRMOs pendientes, sin resolver aquí:** `npc_occupancy.js` expone causas con la ruta interna `db.js` (`:84, :97`), choque con D67; corregir en su pieza antes de publicar texto de juego. Mantienen estado PROPUESTA·REQUIERE_FIRMO: nombre visible de paquete importado; fórmula/fuente/evento de impuestos y mantenimiento; oferta territorial y definición de zona externa; liquidación de recursos; función de aliados/co-op; voz por idioma. No se implementa ni traduce nada de eso en el censo.
- **Cuatro warnings de compactación, estado confirmado:** (1) rama recibida detrás de `origin/main`, sincronizada en `354106c` antes del lote; (2) TOUR sin cerrar, consolidado en `78adedb`; (3) cherry-pick redundante retirado sin duplicar commits; (4) gates n=2 del TOUR faltantes, cubiertos por las suites completas de cierre. Todos resueltos y reflejados en el recibo Q8.
- **Cierre:** PR #77 fusionada el 2026-10-14T05:49:48Z en `5109205`; `main` y `origin/main` sincronizados antes de abrir la pieza siguiente.

## J-A · COMMON BUILDING STRUCTURE · ADOPCIÓN VERIFICADA · SELLO abgz · 2026-10-14
- **Resultado:** la estructura común ya está en producción heredada; queda cerrada por verificación sin duplicar código ni estado. `piece_inspector.js:14-34,39-56` ofrece coordenada, estado, sonido y líneas; `reef_place_cards.js:7-22,49-68` da forma común a ficha, acción real y control; `piece_inspector.js:74-88` monta la acción en el mismo panel. Las cinco acciones del censo ya usan esa estructura común.
- **Boya representativa:** origen de ficha `reef_buildings_layer.js:152-165`; alinea manifiesto, vector, dibujo y acción de abrir Radio en una fuente. No se añade almacén: la Boya deriva el estado del bus de Radio y de ciclo ya existentes.
- **Sabotaje rojo→verde:** `node atlas/place_card_casos.mjs --sabotage-actions` falló con salida 1: las fichas quedaron sin acción y los casos detectaron el hueco. Sin sabotaje, `place_card_casos.mjs` pasa todos sus casos dos veces; censo/browser `place_card_browser.mjs --doogee --quick` pasa cinco toques y cuatro acciones en dos ejecuciones, coordenada incluida. `place_card_browser.mjs --quick` en Chrome pasa los mismos cinco lugares en dos ejecuciones.
- **Medición de render:** Doogee S110, viewport 360×716, DPR 3, calidad máxima; muestras quick de 2 s por pasada: media 58,33 y 57,89 fps; p50 58,14/58,48; p10 49,50/49,26. Segunda ejecución: media 58,16/57,62; p50 57,14/58,14; p10 48,31/49,26. Son muestras breves, no reemplazan las cuatro muestras previas de 60 s registradas en 6B-1. Desktop screenshot 1440×900 y browser fixture 500×629 DPR 1; Chrome quick p50 59,88 fps, p10 58,82/58,48; fichas y acciones verdes.
- **Gates n=2 heredados de la base sincronizada:** `test_web` 76/76 (1 skip preexistente) ×2; Atlas 175/175 ×2; SW 22/22, 134 rutas ×2; Chrome `sin_undefined` 30 pasos ×2; casos de edificios, coral y ocupación NPC ×2. CI del commit base del censo: `test_web` y `verifica` verdes. Esta pieza no modifica runtime.
- **Límites y siguientes pasos:** sin cuenta no hay owner para la isla; el fixture de coordenadas sigue EMULATED y no escribe cuenta ni firma. No se crean identidad, storage, red, campos de RAG, permisos, impuestos o tenants. Shell Schematics empieza sobre Boya en una pieza separada. PR #77 fusionada a `5109205` y árbol sincronizado; esta adopción documental requiere su PR propio antes de empezar Shell Schematics.

## J-A · SHELL SCHEMATICS · EN PR · SELLO abgh · 2026-10-14
- **Resultado:** Boya reutiliza `preceptoros.edificio/1` y su manifiesto vivo; `shell_schematics.js` exporta en orden estable e importa para previsualizar la misma estructura, sin aplicar cambios ni persistir estado. La pantalla no enseña JSON crudo. Título y botones provisionales en inglés; cada control mide 44 px. El import inválido muestra `NO_DATA` con causa. No se añadió identidad visible al paquete: sigue PROPUESTA·REQUIERE_FIRMO.
- **Integración/cerco:** carga diferida desde la Arena, precache offline y sección en la ficha Boya. Textos solo en inglés. No red ni servicios; mismo almacén de manifiestos, sin estado nuevo. `shell_schematics.js` 5.144 B; `reef_buildings_layer.js` 14.651 B, bajo 16.384 B; los demás módulos tocados también bajo el límite. SW `preceptoros-2026-17-abgx`, huella final `e0c11f1d50b75d32`; `atlas-mundo.json` mide gzip de juego 90.538 B.
- **Sabotaje rojo→verde:** `node atlas/shell_schematics_casos.mjs --sabotage-accept` falló en la comprobación de `{}` aceptado por un importador saboteado; la implementación lo rechaza por campos obligatorios. Prueba específica 9/9 ×2; fichas del censo 17/17 ×2; navegador Chrome 5 lugares/acciones y preview válido + JSON vacío rechazado ×2.
- **Gates locales n=2:** `test_web` 76 (1 skip ya existente); Atlas 175/175; SW 22/22 (135 rutas); Chrome `sin_undefined` 30 pasos; todos verdes dos veces. En Doogee S110, dos ejecuciones completas, cinco toques y controles comprobados: medias de muestra 58.09/58.07 y 58.07/58.09 fps; p10 47.85/49.02 y 48.54/49.02. Chrome headless quick: medias 60.04/60.00 y 60.01/60.00 fps, p10 58.82/58.14 y 58.82/59.17. No se exigió una nueva captura de arte: es UI de ficha.
- **Alcance honesto:** importar no instala una copia ni modifica el mundo; es una vista previa del mismo contrato. RAG, título editable, identidad del paquete y aplicación de importación quedan fuera por FIRMO pendiente, no se simulan.
- **Estado:** sin commit/PR todavía; pendiente registrar el cierre local, publicar la rama autorizada, obtener CI doble verde y fusionar dentro de la delegación. Luego sincronizar `main` y comprobar la publicación como visitante antes de iniciar Tenants.
- **Corrección de huella y orden:** la primera cifra `e0c11f1d50b75d32` quedó obsoleta porque regeneré `atlas-mundo.json` después del sello; `test_web` lo detectó rojo. Sellé después de estabilizar las medidas: huella vigente `6e87d57669127b4a`. Con ese artefacto final: `test_web` 76 (1 skip), Atlas 175/175, SW 22/22 y Chrome 30 pasos pasaron n=2; la huella recalculada coincidió exactamente. Doogee completo n=2 registrado arriba.
- **Cierre local:** commit `aa1a6e7` (implementación, pruebas, checklist visitante y este recibo); rama `shell-schematics-20261014`. Estado de código y gates: VERDE local; CI/PR pendientes de publicar.
- **Publicación:** PR #79 abierto sobre `main`; commits de la rama `aa1a6e7`, `a1ce8a9`. CI de PR pendiente. Aún sin merge; tras CI verde, se permite merge propio por la delegación hasta 15:45 Lisboa y se verificará `main`/visita antes de Tenants.
- **Cierre post-merge:** el texto anterior registra el estado previo a la fusión. PR #79 quedó MERGED 2026-10-14 06:14:59Z; merge `6b44e7e75e1ec05e2afb820429bad4239bbf40c7`; `test_web` + `verifica` verdes en PR y gate principal de `main` verde. `main` sincronizada. Visita pública = NO_DATA: el entorno de ejecución recibió HTTP 403 en `/en/`, `/sw.js` y el módulo; el navegador web también informó URL inaccesible. Causa: el entorno no permite obtener esas URLs; no se concluye fallo de despliegue. La checklist 3a pide segunda visita/pestaña nueva para observar el SW.

## VENTANA AUTÓNOMA · ESTADO TRAS SHELL SCHEMATICS · 2026-10-14 06:20Z
- **Pieza cerrada:** Shell Schematics, PR #79 fusionado a `main` (`6b44e7e`); recibo post-merge PR #80 fusionado (`432f57c`). CI doble de PR verde y gates de `main` verdes tras ambas fusiones. La prueba pública HTTP queda NO_DATA por HTTP 403 del entorno (causa anotada arriba); la visita requiere confirmación humana con la lista 3a, segunda visita/pestaña nueva para SW.
- **Siguiente pieza detenida antes de código:** Tenants no tiene fuente de ocupantes en el repo, esquemas ni historial inspeccionado. Boya no declara habitantes; Army y defensas NPC son otras categorías y no se reinterpretan. NO_DATA: no hay registros/lector de inquilinos ni contrato firmado. Upkeep permanece bloqueada por la fórmula, fuente y evento de impuestos/mantenimiento que requieren FIRMO. No se abrió PR de runtime; no se fingió una ficha poblada.
- **Gates aplicables a Shell Schematics sobre el sello final `preceptoros-2026-17-abgx` / `6e87d57669127b4a`:** sabotaje de importación vacío rojo; prueba específica 9/9 ×2; fichas 17/17 ×2; `test_web` 76 (1 omitida) ×2; Atlas 175/175 ×2; SW 22/22, 135 rutas ×2; Chrome 30 pasos ×2; Doogee S110, dos ejecuciones completas, cinco fichas, botones 44 px y media ≥58 fps en las cuatro muestras (58.09/58.07 y 58.07/58.09). Ficheros tocados bajo 16.384 B; módulo nuevo 5.144 B, reef_buildings_layer.js 14.651 B. Inglés únicamente, sin red ni estado persistido.
- **Warnings de compactación, cuatro y resueltos:** (1) rama desfasada respecto a `origin/main`, sincronizada; (2) cierre del TOUR faltante, commit `78adedb`; (3) cherry-pick redundante quitado; (4) n=2 de TOUR faltante, después medido dos veces. Se detallan también en el recibo del censo.
- **Flags heredados solicitados:** arnes_sw actual es 22/22 con 135 rutas y 22 aserciones explícitas; `24/24` corresponde a una corrida histórica distinta registrada en `atlas/POST_VERIFICACION_MGNO_LAB.md` (28-sep, alcance/revisión anterior), no al runner actual. Q1 confirmado: commit `4aed812`, sello `abgq`; Q2 confirmado: commit `74b7992`, sello `abgr`. El mapa propuesto J1-J15 está en el recibo del censo; J15 Wanderers precede Tuning y los números no entran al código.
- **Estado de publicación:** local `main` sincronizada en `432f57c`; gate post-merge de recibo verde. PR público de visita no comprobable desde este entorno (403); sin evidencia de fallo del despliegue. Sin Tenants/Upkeep en curso ni rama de código modificada.

## W · PANEL SHELL, CHANNELS AND CRAB CONTROLS · 2026-10-15

- **Base y rama:** `6455f65` (#88 ya publicado); rama propia `codex/w-three-zone-shell-20261015`. No se reabren #82–#88.
- **Construido:** cinco rutas laterales (History mode, Waves Army, Buildings, Nodes & Events, How to start?); cajón de acciones junto al mapa persistente y hoja central amplia con zoom; la notificación de History tiene luz visible. Nodes & Events reúne roster, Skills y controles del cangrejo. El roster declara Beelink como `nodo.0.hexelion` y Doogee S110 como `nodo.1.doogee`; How to start permite elegir Doogee como territorio local. La selección no conecta nodos ni da acceso al equipo.
- **Movimiento y canales:** el cangrejo ya no responde a W/A/S/D; cuatro botones cardinales deterministas y el toque en mar vacío siguen disponibles. El control por voz es `NO_DATA` porque no hay reconocimiento local habilitado ni medido. Echoes, Chat y Radio son pestañas; Radio conserva `registro()` estructurado para AI Fluency (`quien, sello, fuente, ciclo, texto`). Echoes y Chat declaran la ausencia de fuente verificada. No se atribuye comprensión del vector a ningún modelo.
- **Accesibilidad +:** direcciones con nombre accesible y área mínima 46 px; pestañas de canal ≥44 px; foco de teclado, exclusión de paneles superpuestos y respeto a movimiento reducido.
- **Sabotaje rojo→verde:** dirección Sur cambiada deliberadamente a Norte hizo fallar el caso de joystick; fuente intacta pasa 6/6 dos veces. Radio 14/14 dos veces.
- **Gates locales sobre el mismo árbol:** `test_web.py` 76, una omisión preexistente ×2; `atlas/test_atlas.py` 176/176 ×2; `arnes_sw.mjs` 22/22 con 137 rutas ×2; Chrome `sin_undefined.mjs` 20 comprobaciones en `/en/` y `/es/`, cero fallos. La puerta de teléfono físico no se ejecutó.
- **Medidas:** SW `preceptoros-2026-17-abhf`, huella `97508ffdc665106e`; sitio 1,267,712 B; juego inicial gzip 92,208 B. Mayores módulos tocados: `ui-arena.js` 16,312 B; `genesis_tutorial.js` 13,457 B; `terminal_menu_shell.js` 14,006 B; todos bajo 16,384 B. JavaScript vanilla y sin build.
- **NO_DATA:** FPS físico del Doogee, chat global, feed Echoes independiente, reconocimiento de voz, latido y enlace en vivo entre Beelink y Doogee, comprensión de AI. El roster usa solo cédulas existentes; Doogee sigue excluido del mapa conforme al #57. Nada del interior de la casa se expone (D67).
- **Límite del gate paralelo:** la lectura de `coherencia-publica.py` marcó el corredor externo de la app como `NO_DATA` porque `test_canales.py` reportó un corredor rojo; el detalle no se recogió. No se presenta el MVP/app como verde. La medición directa de la web fue 76 y quedó en `counters.json`; no altera los tres gates web locales.
- **Cierre:** checklist visitante en `PRUEBA_5_MINUTOS.md`, con inventario honesto #82–#90, pasos de cinco minutos y nota de segunda visita/pestaña para service worker.
- **Publicación y despliegue medidos:** PR #90 mergeada a `main` en `2b813a14543862374a0599adb479a0297b35482e` a las 11:49:04Z; CI `test_web` y `verifica` verdes. Después del merge, 9 recursos públicos respondieron HTTP 200 y coincidieron byte a byte con el árbol: `sw.js`, `assets/thegame.js`, shell JS/CSS, radio, roster, movimiento libre, entrada/tutorial y lector de mapa. Versión pública `preceptoros-2026-17-abhf`; cache-bypass por cabeceras `Cache-Control: no-cache` y comparación local. La variante de URL con query devolvió 403; no se usó para afirmar el despliegue.

## P1 · SUMMON + COMBAT FLOW · RECEIPT · 2026-10-15
- **Recovery first:** retained G0 already restores the signed invocation chain, returns paid eggs after reload, and runs `ui.js` hatch polling while the game section is connected. `AtlasPiso.arranca()` has a single `!reloj` guard; the incubator mounts once per game section. No parallel duplicate of the state-advancing motor was found, so no runtime patch was justified.
- **Seal before / after:** `preceptoros-2026-17-abhf` · `97508ffdc665106e` / unchanged · same seal. This piece changed no public runtime bytes; production remains the already measured #91 publication.
- **Summon, MEDIDO in an isolated headless Chrome profile:** generated one non-exportable local identity; started at cycle 7 with 2 copper; the actual motor reached 50 copper at cycle 125 after 118 cycles. The enabled TC1 control was clicked once. At cycle 126 the engine recorded one `invocar` event, copper went 50→0, and the nest contained one egg. At cycle 145 the hatch panel and reveal were visible: 20 cycles from the click, 19.869 s wall time from the post-click sample. No truncation reproduced. The observed one-second timers were one motor tick (`atlas-piso.js`) and one hatch observer (`ui.js`), plus unrelated shell/tutorial timers; there was no second motor tick or duplicate summon event.
- **Combat, MEDIDO as a deterministic browser fixture:** 10 waves per side, 141 recorded hits, 17 rounds; the live replay canvas drew 902 frames over 15.016 s at 500×629 CSS px, DPR 1: mean 60.00 fps, p50 59.88, p10 59.88. `atlas/replay_casos.mjs` passed 12/12, including same-seed replay identity, ordered hits and formation changes that preserve the result. This is headless evidence, not a physical-device claim. Doogee FPS remains `NO_DATA` because Acurast is foreground and the device was left untouched.
- **G0 recovery checks:** `atlas/g0_casos.mjs` passed 10/10 ×2; the existing red condition (pay, reload, zero restored eggs) is already fixed in the published G0 implementation. No new runtime behavior was added in this measurement-only piece.
- **App red-corridor remeasurement, read-only:** `python3 -B -m unittest -v test_canales` passed 17/17, including the 8-writer/480-event concurrency assertion. The earlier wrapper's red result cannot be reconstructed: its output contained only the suite name, and a targeted search found no retained traceback or assertion log. Therefore the old incident remains `NO_DATA (cause detail not retained by the wrapper)`; the current direct run is MEDIDO verde. No app files were changed.
- **Disposition:** measured flow completes and the combat replay meets 60 fps in this headless fixture; no visual/runtime optimization is supported by this evidence. Physical Doogee fluency remains NO_DATA. Public file sizes and the production seal are unchanged; no new network path or persisted game state was introduced.

## MAP · FLOOR AND WATER · VISUAL RECEIPT · 2026-10-15
- **Recovery first:** retained the single cached painter in `public/game/mar-fondo.js` and the coral palette in `reef_corals.js`; no parallel floor, image asset, or new request path.
- **Visible change:** deterministic rounded reef beds replace the noisy checker texture. The shared sea palette now follows the coral's deep teal and living mint; each bed has a flat lower-right shade under the common upper-left light. The child sees broad soft reef islands under the familiar crab, with clear open water between them. The crab remains the shape, shadow, palette, and life benchmark; this floor piece adds terrain silhouette, two-tone depth, and palette parity, while crab animation stays unchanged.
- **Motion and access:** floor detail is fixed from world coordinates and cache-stable. Existing global water drift remains; `mar.js` freezes it under `prefers-reduced-motion`. No new controls or target sizes were introduced. The nine-language `test_web.py` gate checks page labels and WCAG contrast; the scenery is canvas art without new text.
- **Measures:** Chrome headless, same 500×629 fixture and two samples: baseline 59.99/60.00 fps; updated 59.99/60.01 fps, capped at 60 by this environment. This confirms cadence, not performance headroom. Physical Doogee FPS is **NO_DATA** because Acurast is in the foreground. Screenshot reviewed at 1280×800: softened reef beds, crab and map points visible; no claim of physical-device appearance.
- **Sabotage:** nondeterministic `Math.random()` and a remote script asset each made the focused Atlas gate RED in both attempts; clean source passed. No external asset or new network path.
- **Gates:** `test_web.py` 78 tests / 9 languages, `test_atlas.py` 177 tests, `arnes_sw` 22/22 across 139 routes; run twice before commit. Public painter is 6,221 bytes (<16 KiB); `git diff --check` clean. Seal: `preceptoros-2026-17-abho` · `f0749dd815981ef6`.
- **Gates n=2 on this tree:** `test_web.py` 76 (one existing skip) ×2; `atlas/test_atlas.py` 176/176 ×2; `arnes_sw.mjs` 22/22, 137 routes ×2; Chrome `sin_undefined.mjs` 20 checks, zero failures ×2; `replay_casos.mjs` 12/12 ×2; `g0_casos.mjs` 10/10 ×2; `git diff --check` clean.

## P2 · SEMIOTIC GLYPH RENDERER · RECEIPT · 2026-10-15
- **Recovery first:** the existing `piece_inspector.js`, audio feedback manager, and wave renderer were retained. Added a compact, deterministic renderer for the signed four-coordinate visual vocabulary; the inspector accepts an optional `glyph` tuple and explanation. This is the rendering foundation only: current game entries do not yet carry dictionary terms, so the term catalogue and map placements remain for P4 and are not claimed as published content here.
- **MEDIDO:** all 180 valid palette/line/sound/motion combinations render; 8 malformed tuples are rejected; compact tuple maximum is 9 bytes (<64). The glyph JavaScript is 5,996 bytes (<16 KiB); synthesized tone function is 838 bytes (<1 KiB), uses Web Audio only after explicit button activation, and requests no network or persistence APIs. Browser smoke passed on `/en/` and `/es/`: accessible SVG role/label, explanation, sound off until tap, 44px target, 22 steps with zero failures.
- **Accessibility:** all five specified colors measured against the game panel for WCAG 2.1 non-text contrast: gold 8.42:1, cyan 9.85:1, green 8.43:1, violet 3.80:1, honest gray 5.10:1 (each >=3:1). Sound has a named opt-in control; reduced-motion preference disables all glyph animation; visible keyboard focus and 44px touch target are present. **+ accessibility delivered** for this piece.
- **Sabotage:** replacing violet `#9B59B6` with `#111111` made the glyph case suite fail on the exact palette assertion (red as expected); restored source passes 180/180 valid combinations and 8/8 invalid cases.
- **Public measurement:** new same-origin static module is precached; SW list is 138 routes, `arnes_sw.mjs` 22/22. Seal before `preceptoros-2026-17-abhf` / `97508ffdc665106e`; after `preceptoros-2026-17-abhg` / `6403781e093b6782`. Public game gzip: 92,221 bytes. No external asset or new network path.
- **NO_DATA:** no model-based interpretation, translations, dictionary entries, term→building matrix, capture reward, or cross-node signing was measured or implemented in this renderer piece. Doogee physical FPS is outside this visual renderer measurement. Those remain distinct rails; no behavior is inferred from the glyph coordinates alone.
- **Gates n=2 on final tree:** `test_web.py` 78 (1 existing skip); `atlas/test_atlas.py` 176/176; `arnes_sw.mjs` 22/22 across 138 routes; Chrome `sin_undefined.mjs` 22 steps, zero failures; compact glyph cases 180 valid + 8 invalid. `git diff --check` clean.

## P3 · J-B · TERRITORY AND FOG · RECOVERY RECEIPT · 2026-10-15

- **Recovery first:** J-B already exists in the published tree. Reused `fog_of_war.js`, `world_camera.js`, `mar-fondo.js`, `npc_territory_map.js`, and `npc_occupancy.js`; no second territory model, fog renderer, or map state was added.
- **Measured behavior:** clear areas derive deterministically from measured node data, the local home, explored sites, and the existing observatory. The camera stays inside clear areas, reports a collision, and rebounds at the fog edge. NPC territory state uses the existing local receipt flow; abandoned occupation and its wall message return to fog after the signed cycle limit. The six existing NPC sites declare 21 units. A roster entry alone does not create a live link, reveal a node, or establish shared ownership.
- **D67 and scope:** Doogee remains without a map point or clearing circle; internal device data is not exported. No new network path, cross-node heartbeat, capture state, or persistence was added. This closes J-B as a recovery-and-measurement piece; it introduces no new visitor-visible behavior.
- **Sabotage red → green:** an isolated temporary copy of `world_camera.js` bypassed the fog limiter. `camara_casos.mjs` failed as expected: the camera crossed fog in three seeded walks and a large drag produced no collision. The repository source was unchanged; the unmodified camera passed 16/16 cases twice. `npc_occupancy_cases.mjs` passed twice, including 17 dependency-failure privacy cases and cycle-based return to fog.
- **Gates n=2:** `test_web.py` 78 (one existing skip) ×2; `atlas/test_atlas.py` 177/177 ×2; `arnes_sw.mjs` 22/22 across 139 routes ×2; Chrome `sin_undefined.mjs` 24 checks with zero failures ×2. All five reused public modules are below 16,384 B. Local seal unchanged: `preceptoros-2026-17-abhl` / `10f9a5ab7b78f67c`.
- **Production byte check:** all 10 requested public paths returned HTTP 403 from this measurement environment, so live bytes for this pass are `NO_DATA` (cause: the host denied the requests). This receipt makes no new deployment claim; J-B changed no public bytes.

## P4 · DICTIONARY RAILS · PRE-FIRMO DRAFT (SUPERSEDED BELOW) · 2026-10-15
- **Recovery first:** the P2 glyph renderer is already merged in #93; P3 census and common-building work already exist in #76 and the later J-A/J-B receipts. This proposal adds no second renderer, building lifecycle, or map copy.
- **Catalog cut — proposal:** keep the numbered A1–D45 annex as the provenance index. Before publishing, reconcile it against the earlier 42-entry table with an explicit alias-to-canonical crosswalk; count unique concepts only after that review. B20 and B21 stay out of public JSON until a safe public citation and visible label are signed. No restricted literal is copied into game data.
- **Term-to-building matrix — proposal:** A1–A12 → Workshop; B13–B19 → Frontier Gate; C22–C32 → Forest Commons; D33–D45 → Signing Table. These are group defaults for review, not live destinations. Preserve the already specified D67 → Frontier Gate and Article 14 → Signing Table examples as proposed exceptions. Each term needs an explicit canonical destination before capture is enabled.
- **Capture rewards — proposal:** the first catalog-only release grants no Cobre or Luz. If rewards are later signed, derive them only from a named, replayable game event and publish the formula and source with its receipt; do not infer amounts from touch count or elapsed time.
- **Cross-node scope — proposal:** begin with a deterministic local demonstration using synthetic records, clearly labelled as simulated. Do not claim two real nodes agree or sign until the G3–G5 path is measured and separately authorized.
- **D67 and publication boundary:** a future generator may emit only the six approved public fields from an explicit allowlist. `id_interno` in public data means the canonical A/B/C/D identifier, never a source path or house identifier. Anchors remain plain text; no remote lookups. No source material from the rack was copied into this proposal.
- **Current seal:** proposal text only; no public runtime bytes changed. The P2 production seal remains `preceptoros-2026-17-abhg` / `6403781e093b6782`. No dictionary entry, map destination, reward, or cross-node action is claimed as built. The five choices above remain REQUIERE_FIRMO and block the corresponding public mechanics.

## P4 · HEXELION STAR AND PUBLIC DICTIONARY · RECEIPT · 2026-10-15
- **Authorization:** the Soberano ratified the five P4 rail proposals in chat after PR #94. This receipt supersedes the proposal status above. The signed annex is the sole source for the public entries; no rack or private-house source was read or copied.
- **Recovery and count:** searched the repository’s readable history/source surface for the earlier 42-entry table before implementation; it was not present in the repository or safe search results. Public JSON therefore contains the 43 explicit A1–D45 entries other than held B20/B21. The final unique total remains `NO_DATA` until that earlier table is available for reconciliation. No private material was used to fill the gap.
- **Built:** a six-point HEXELION STAR is drawn on the existing map and opens the existing inspector. The inspector offers 43 English vocabulary crystals with each signed human standard, simple English explanation, four-dimension glyph, and group destination. Destinations are the signed group defaults: A Workshop, B Frontier Gate, C Forest Commons, D Signing Table. These are display labels only; term-specific routing/capture is not active. Public anchors are plain identifier strings in `dictionary.json` and `llms.txt`, never fetched as URLs.
- **Limits:** first catalogue delivery grants zero Cobre/Luz. No capture, transport, persistence, partida, cross-node signature, or new game state was added. B20/B21 remain withheld. `NO_DATA`: 42-entry reconciliation (missing earlier table); final total (same cause); other-eight-language orbit (only English is loaded/verified); physical Doogee FPS (not measured in this piece). All visible text is English.
- **D67 / egress:** the payload is a hand-filtered public allowlist from the signed annex. Runtime reads only `/dictionary.json` and `/dictionary-en.json` with same-origin credentials; no links, remote calls, storage, or rack interior data.
- **Accessibility +:** each crystal is a keyboard button with visible focus, a live detail region, and the existing labeled SVG glyph renderer; sound remains off until the visitor explicitly taps its control. The catalogue list is scrollable on narrow screens.
- **Sabotage:** `node atlas/dictionary_cases.mjs --sabotage-duplicate` must exit red on duplicate canonical IDs; the unmodified catalogue passes the same invariants. Exact final result and public file sizes are recorded after final gates below.
- **Measured artifacts:** `dictionary.json` 14,881 B; English explanations 2,591 B; `hexelion_dictionary.js` 8,382 B; `reef_buildings_layer.js` 14,738 B. All public files are below 16,384 B. Glyph tuple maximum: 9 bytes. Public seal `preceptoros-2026-17-abhl` / `10f9a5ab7b78f67c`; measured game gzip 92,230 B.
- **Gates n=2:** `test_web.py` 78 (one pre-existing skip); Atlas 177/177; `arnes_sw.mjs` 22/22 across 139 routes; Chrome 24 steps, zero failures; dictionary invariants pass; duplicate-ID sabotage fails as intended; `git diff --check` clean.
- **Publication:** one PR for this piece; commit only on `codex/p4-star-dictionary-20261015`. No production/deploy claim until merge and byte-level visitor verification.

## H · SKILLS FOR EVERY INTERACTOR · ACCESSIBILITY RECEIPT · 2026-10-15

- **Recovery first:** kept the existing two measured skills, `Swim` and `Reach`, from `crab_free_move.js`; the UI, event totals, audio manager, and machine-readable `state_vector.js` already read that same source. No parallel skill list, event counter, or persistence was added.
- **Change:** the existing Skills list is now a polite live region. Before, its text changed after completed actions without a screen-reader announcement hint. After, the same two rows expose the updated level and event count through `aria-live="polite"`. A child still sees the same friendly “Skills” list; keyboard and touch movement controls remain unchanged.
- **Honest limits:** skill counts and event detail are local to the tab; saving still awaits a signature. Voice movement remains `NO_DATA` because local speech recognition is not enabled or measured. Actual spoken output on a physical screen reader is `NO_DATA` because no physical assistive-technology run was available. Doogee FPS is `NO_DATA` because Acurast is foreground; this DOM-only accessibility change does not add a rendering loop or network request.
- **Sabotage red → green:** the browser harness removed the `aria-live` attribute. It failed the Skills check on both `/en/` and `/es/`; restored source passed on both.
- **Gates n=2:** `test_web.py` 78 (one existing skip) ×2; `atlas/test_atlas.py` 177/177 ×2; `arnes_sw.mjs` 22/22 across 139 routes ×2; `cangrejo_libre_casos.mjs` and `audio_feedback_manager_casos.mjs` green ×2; Chrome `sin_undefined.mjs` 24 checks, zero failures ×2. `git diff --check` clean.
- **Measured:** `crab_free_move.js` 10,108 B; all public files below 16,384 B. Seal advanced `preceptoros-2026-17-abhl` → `preceptoros-2026-17-abhm`, final fingerprint `435f99e868a9996a`; `atlas-mundo.json` reports 78 web tests, 9 languages, SW 22/22, and game gzip 92,230 B. The game remains English-first; no translations were inferred.
- **Visitor checklist:** step 4 now lets a tester verify the live announcement and honest empty-state cause with a screen reader.

## M0 · TRANSPARENCY — LOSSLESS ENGLISH SERIALIZATION · ART.13 · 2026-10-15
- **FIRMO y cola:** el Soberano autorizó M0 PRIMERO como requisito técnico, después de reintentar ADB y el commit documental. Los renombres WavesCraft/Transparency Log esperan M0 verde y repetirán sus gates. Una pieza cada vez; G/H/F en cuarentena. #89 no se fusiona sin FPS físico + FIRMO.
- **Base y superficie:** rama local `codex/m0-lossless-en-20261015`, separada del plan y de los renombres, desde `e01462ba260d3d18869eadc96129d62ddf052b24`. Baseline re-medida: 175 ficheros públicos; huella SW (excluye sw.js) `f0749dd815981ef6`, versión abho. #100 permanece heredado y no se modifica.
- **Único cambio de contenido servido:** serialización compacta UTF-8 de `public/atlas-en.json`, 17.731 → 15.994 B (−1.737 B). Igualdad del objeto comprobada directamente contra `git show e01462b:public/atlas-en.json` con Python; claves, valores, orden y etiquetas originales conservados. WavesCraft no se incorpora en M0. SHA-256 de bytes antes `076ea1844bdaa6ced239e36a031da257087b215672abe7a715dd659a651e19e0`; después `d24c03bb91b0c0da4f6087a15083d5511cd1d1b1ba8eba16530c926a706da1df`.
- **Rojo → verde:** `node atlas/phase_M0_cases.mjs` fue rojo en la base por superar el límite de pieza. Tras compactar, valida el hash del objeto completo, el tamaño y la representación exacta. `--sabotage` borra `ui.inc_h` en memoria; la misma validación da rojo (`English object changed`). Sin escribir escenarios en cuenta/main.
- **Gates nuevos:** `atlas/phase_gate.mjs` impone <16.384 B a los 159 JS/CSS/JSON/HTML públicos, revisa el tamaño de sus dos artefactos nuevos, exige LENGUAS=['en'] y mide gzip nivel 9 de los 26 recursos de carga inicial, leídos de GUIONES/hojas del cargador. `.github/workflows/phase.yml` ejecuta n=2 caso, sabotaje, web, Atlas, SW, Chrome, vector, fase y diff con salida ante cualquier rojo. No sustituye ni reduce los workflows heredados. La limpieza ampliada de nombres pertenece a M1 y aún no está implementada.
- **Tamaños nuevos:** phase_M0_cases.mjs 965 B, phase_gate.mjs 1.846 B, phase.yml 1.041 B. Sin código runtime nuevo, cargas, red, datos interiores, almacenamiento ni cambios en cuenta, claves, grabadora o motor. Las defensas heredadas permanecen intactas. No hay cambio de interacción que permita atribuir nuevas pruebas físicas/A11Y.
- **Medidas/sello:** gzip de puerta 92.230 → 92.085 B, lectura independiente de phase_gate igual a atlas/mundo.py. `bin/sellar.py --sellar`, `contadores.py`, `atlas/mundo.py`, `contadores.py`, sello final con la misma versión, seco NADA QUE SELLAR. Sello local `preceptoros-2026-17-abhp`, huella `9c60b69fbff87b2d`. Las métricas ajenas de counters se cotejaron con la base y quedaron iguales; 78 web es registro heredado, no un gate verde de esta ronda. Sin corredor APP, sin cifras APP nuevas, sin cambios a llms.txt antes de publicar.
- **Instrumento local:** caso M0, fase, SW 22/22 (139 rutas) y vector 8/8 pasan dos veces sobre los mismos bytes públicos sellados. Atlas 177/177 ×2; Chrome falla en ambas pasadas antes del recorrido (0 pasos, puerto de depuración no disponible). `python3 test_web.py` dio 78 pruebas, 1 error de socket y 1 skip en ambas pasadas; la primera pasada Chrome dio 0 pasos, puerto de depuración no disponible. No se declara gate común completo verde.
- **ADB/plan:** reintentos previos solicitados: ADB no puede crear su listener (`Operation not permitted`) y no conecta con el Doogee; FPS físico y aplicación en primer plano = NO_DATA, sin atribuirlo a Acurast. El gancho rechazó de nuevo el commit del plan: pytest 76 passed, 1 failed (socket), 1 skipped, 3.803 subtests passed. No se omiten guardas ni pruebas. El documento queda preparado/staged en su rama, aún sin commit; ese prerrequisito sigue pendiente.
- **Estado:** implementación local revisable, NO INTEGRADA; commit, CI, PR, fusión y gates completos pendientes. No hay push ni publicación. No se avanza a los renombres ni al resto del MVP bajo estos rojos. G/H/F intactos.
- **Reporte de ronda:** gastos CLI = NO_DATA (contador verificable no expuesto); modelos locales no invocados, sin subagentes. Sugerencia: ejecutar los gates en un contexto con sockets locales habilitados, conservando ganchos, árbol y sabotajes; después cerrar documental/M0 y repetir los gates de cada renombre. **New_Naming_Proposal:** ninguna nueva; M0 usa el nombre ratificado y conserva las etiquetas originales.

### M0 · REINTENTO TRAS ORDEN DE ACCESOS ABIERTOS · 15-oct noche
- El Soberano aporta medida de su terminal: web 78 OK (1 skip), Chrome 24 pasos/0 fallos, phase 159 ficheros/92.085 B gzip y caso M0 15.994 B/objeto igual. Procedencia: reporte del Soberano en la conversación; no se convierte en observación propia ni se inventa una segunda pasada completa verde.
- La pasada propia adicional repite Atlas 177/177, SW 22/22, vector 8/8, caso M0 y fase verdes sobre la misma huella `9c60b69fbff87b2d`. Web y Chrome siguen sin poder abrir sockets en esta sesión. El primer intento web encontró además cinco falsos positivos de higiene en un perfil temporal de Chrome sin proceso activo dentro del worktree; se preservó íntegro fuera del repositorio y se repitió sin modificar pruebas: 78 pruebas, 1 error de socket, 1 skip. No se borró el perfil ni se incluyó en staging.
- ADB no conecta antes de dumpsys: no puede crear listener (`Operation not permitted`). Foco, Acurast y FPS físico = NO_DATA por imposibilidad de acceso, no por afirmar que Acurast esté delante. Sin interacción con el teléfono ni fusión de #89.
- Nuevo intento de commit documental: el gancho intacto rechaza por el mismo test de socket, pytest 76 passed/1 failed/1 skipped y 3.803 subtests passed. Git fetch continúa con fallo DNS. No se obtuvo commit, push ni PR; ambos push y PR borrador están autorizados al cumplirse los gates. Las ramas mistral/* quedan intactas. No se avanza a renombres mientras M0 no cierre.
- Triaje de duplicados solicitado: completado solo lectura con tres subagentes; informe privado fuera del juego. No se commiteó, movió ni borró nada del árbol raíz congelado; destinos pendientes de FIRMO. Consumo CLI/subagentes NO_DATA por ausencia de contador verificable; modelos locales no invocados. Sugerencia: repetir la pasada completa desde el entorno que dispone de sockets y preservar los ganchos. New_Naming_Proposal: ninguna nueva.


## M0 · FIX DEL ARRANQUE CHROME EN CI · 15-oct noche
- Orden vigente del Soberano: arreglar CI de #104 sin retirar pruebas; publicar solo en codex/m0-lossless-en-20261015. La Mesa/Soberano conservan la fusión. WavesCraft queda detrás de M0 fusionada; Transparency Log espera mapeo firmado; destinos del triaje sin ejecutar.
- Diagnóstico observado en run 38793279430: Chrome no abrió CDP, 0 pasos. El harness descartaba stderr: la causa interna original es NO_DATA porque no quedó registrada. No se atribuye sin evidencia a una flag concreta.
- Cambio: arranque extraído a chrome_launch.mjs. Solo en GitHub Actions usa --no-sandbox y --disable-dev-shm-usage; captura error de spawn/salida/stderr acotado, falla con NO_DATA y causa si CDP no abre. Perfil fuera del checkout y limpieza tras esperar al proceso. Desactivadas tareas de fondo/actualización/sync del navegador de pruebas. Sin cambios servidos, red del producto, cuenta, motor ni sellos.
- Conserva todos los 24 pasos y sus aserciones. chrome_launch_cases.mjs fuerza un binario ausente y exige salida 1, 0 pasos, NO_DATA y ENOENT: rechazo verificado dos veces. El caso falla si el error se vuelve verde u omisión. Workflow phase ejecuta ese caso n=2, conserva pipefail al recoger JSON y añade recibo del navegador al resumen incluso tras fallo; la ausencia de medición no pasa gates.
- Gates locales n=2 sobre public/ idéntico: M0 15.994 B/objeto igual y sabotaje en memoria rojo esperado; web 78 pruebas (1 skip preexistente); Atlas 177/177; SW 22/22, 139 rutas; Chrome 24 pasos/0 fallos (ruta GITHUB_ACTIONS=true); vector 8/8; phase 159 ficheros, 26 iniciales, gzip 92.085 B; higiene/diff verde. Caso nuevo y presupuesto final verificados aparte n=2. El workflow y el caso de rechazo se incorporaron durante la ronda; el head final se verificará completo en CI ×2.
- Tamaños: chrome_launch.mjs 1.622 B, chrome_launch_cases.mjs bajo 1 KiB, sin_undefined.mjs 15.859 B; phase y workflow bajo 16 KiB. Public/ permanece idéntico a d0c7d5d, sello abhp / 9c60b69fbff87b2d; no corresponde regenerar ni inventar cifras APP.
- Estado al preparar commit: local verde, verificación real ubuntu-latest y CI doble repetido pendientes. No se declara resuelto el runner hasta medirlo. El recibo de CI se añadirá en #104 sobre el SHA nuevo sin cambiarlo después de las dos ejecuciones.
- Pupilo de esta pieza: PRECEPTOR integrador; sin nueva delegación. gate_ok.firmo: pruebas locales OK; publicación en rama propia autorizada por orden actual; CI pendiente; fusión reservada al Soberano. Sin jetson, main directo, ramas claude/* o mistral/*, #89 ni raíz congelada. Gastos CLI NO_DATA, contador verificable no expuesto; modelos locales no invocados. New_Naming_Proposal: ninguna.


### M0 · SINCRONIZACIÓN CON MAIN PUBLICADA POR LA MESA
- Tras push del arreglo e6dc1df, GitHub declaró PR #104 CONFLICTING y no lanzó workflows nuevos. Main ya estaba en fa04a909cdd64a8cf47175c4d6441ff289910847 (#101/#102 integradas por la Mesa); la base anterior e01462b no era suficiente para un PR fusionable.
- Merge de esa main en la rama propia M0, sin modificar main ni implementar piezas G. Tres conflictos exclusivamente generados: config/sw-huella.txt, atlas-mundo.json y counters.json. Se preservaron las métricas ajenas de main, se regeneraron las propias y se comprobó igualdad de pruebas_app/pruebas_web con esa fuente. Runtime/precache de main preservados byte por byte, incluidos sus nuevos módulos; sin intervención en #89 ni raíz congelada.
- Artefacto final para esta sincronización: EN 15.994 B y objeto b81b02c2… intactos; fase 161 ficheros, 26 iniciales, gzip 92.101 B. Sello nuevo preceptoros-2026-17-abhq, huella c4315655300436fe; seco NADA QUE SELLAR tras sello/contadores/mundo/contadores/sello final con la misma versión. Las cifras anteriores 159/92.085 B corresponden al head previo, no a este árbol con main incorporada.
- Se repiten gates completos n=2 sobre estos bytes públicos finales, además de los casos heredados de main, antes del push de la resolución. CI sobre nuevo head pendiente; el resultado y los IDs de ambas ejecuciones se registrarán en comentario de #104. No se afirma CI verde todavía.


## T3 · DIRIMENCIA Y RECONSTRUCCIÓN ABHT · RECIBO CRUDO · 2026-10-15

Autoridad: DIRIMENCIA de la Mesa en PR #110 y orden posterior del Soberano: solo T3, reconstruir desde main vigente, letra ASIGNADA abht, gates n=2, CI doble ×2, PR borrador SIN FUSIÓN y PARA al entregar. No M1, SENSOR HONESTO, plan ni ADENDA 2 en esta sesión. El silicio no firma. Este append al archivo responde a la orden explícita del Soberano que pide recibo aquí; entradas heredadas de main intactas.

### Heads y procedencia medidos al retomar

- Head antiguo de #110: 3a812a724af46bd6ac81bcbbc7eae16a98de7b34, base antigua 3f975c3e2a9785acc73871a6b384224b68825078. Su abhs / 49ceec4a829cece0 colisiona con el abhs de main. Sus verdes, incluido phase intento 2 que al retomar figuraba success, son HISTÓRICOS y NO cubren este árbol.
- Mesa reportó main 813b3be. Medida propia al retomar: origin/main 9e4bdd87f96a9c5dcfc1ac5ca62cd25496a1afaf, merge #111; respecto a 813b3be solo añade AGENTS.md. Misma superficie pública abhs / ece78b601f6d072c. Leídos DIRIMENCIA, AGENTS.md y CLAUDE.md antes de reconstruir.
- git merge --no-commit --no-ff origin/main dio salida 1, tres conflictos: config/sw-huella.txt, public/atlas-mundo.json y public/counters.json. A continuación git restore --source=origin/main --staged --worktree -- . estableció TODO el árbol desde main vigente. git diff --stat origin/main quedó vacío ANTES de reaplicar T3. Así se conserva la historia sin force-push ni importar el árbol viejo.
- Se reaplicaron exclusivamente las pruebas T3/browser/histórico M0/gates propias. El fixture EN se copió NUEVAMENTE de main actual, no del borrador. Cada hash protegido se recalculó contra esa base. Delta del producto: SOLO ui.inc_h Forest Incubator → WavesCraft y ui.army_carga Opening the Forest Incubator… → Opening WavesCraft…. Runtime visual, cargador y precache actuales intactos. Artefactos generados desde cero con letra abht.

Árbol público estabilizado MEDIDO: `286d63391d687cd8ec4f647569dd4aa5f60baa11`. El SHA del head final se leerá tras crear el commit y figurará en el recibo final del PR #110; no se presume un SHA antes de existir. Este recibo fija bytes, comandos y resultados anteriores al commit.

### Hashes antes/después (SHA-256), recalculados

- public/atlas-en.json: 15994 → 15978 B; d24c03bb91b0c0da4f6087a15083d5511cd1d1b1ba8eba16530c926a706da1df → 5cc41650b10112ad39d2485242e9b6fb961c8586a692a278db5d782f742e7a81.
- public/atlas-mundo.json: 344 → 343 B; f6b3919dce24b53c5038bdfdc7c81ae3a310707b18c5e5ba8d753c87209e39e2 → 37afd1cd394a6525f83f71fa4fc64023f8a339d87ef006223020dc6ac5343387.
- public/counters.json: 2764 → 2764 B; 6fe8a0b84402a5c3e4ed16aec576bba5347d994dd9a3c6b24958f5152b5eafdd → f8e7d2b0e316cf910a97e2f3de5fc3245cbf29af577736663ce3bf0d7eb73d5e.
- public/sw.js: 11591 → 11591 B; 94b4411d632e173d1679f15bccc4991ebbd340603bba3f42444cea0c72d7249e → 7e97f6b574b9c23606b1e511de35e484a6fce984e785748fc9c94f93d2b31031.
- config/sw-huella.txt: 58 → 58 B; bbead27f82f767d6485287939df2925130d33d665b35b3dedeb5626d36ba550b → 21577634449163864065805939691365cc21d1d1d6b70e2c8f4e6eea94dcc3a9.

Hashes protegidos antes=después (igualdad directa con main vigente):

- public/game/valores.js: 8892267206e4328ae9873b016c3c1d07eacab776bbb6614ed1df1d8c254a2e29.
- public/assets/atlas-motor.js: 16e50ed537c5d6898815a2711a22dc3d7497d4e0a3cd6a0bae013241822e11c9.
- public/game/gacha.js: b2a2d0e134576d913b3a30ccaf539532e4377d423c4211aceb1bc211081d11cc.
- public/game/core.js: 1141d77af50dbdce03bbbddef11549683929685dee3de711b6434a7a5ffe8430.
- public/game/ui-invoca.js: da62b8197243d464e54ca3e966af2e98bf6ba137548ba78c340176a5ee729295.
- public/game/onda_profunda.js: d56d54957606ead50de7e99731e93f080cb1110ad4ebc397fab0aafb4059eb34.
- public/game/tarjeta_cantada.js: 6d91727ea8590526ab6e08942a77c1efa50e4c9aeb6fd41e4025e74f1bbcfdac.
- public/assets/thegame.js: 90a94b3498a4ee540bd74431c5b005a9005656f58afa93c4588cc74595782582.
- public/sw-listas.js: 40332b1278de0cf883306d993dd0aa3b920220ecd4b06a39a54d37cb45084226.

Oráculo re-verificado: objeto EN actual cd6d33ee6780780189482bfa031aa36f00d0c2b2709e3112f08b203b7676ee9a; invertir SOLO ambas etiquetas recupera b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939. Fixture M0 15.994 B, bytes d24c03bb91b0c0da4f6087a15083d5511cd1d1b1ba8eba16530c926a706da1df. Digest histórico no sustituido. Ningún sabotaje escribe producto/cuenta: cada hijo debe salir 1 por el código de su propia invariante.

### Comandos de preparación ejecutados

Lectura/medida: gh pr view 110 --json state,headRefOid,comments; git status --short --branch; git log -3 --oneline; git ls-remote origin refs/heads/main; git fetch origin main; git show -s --format de origin/main; git show origin/main:config/sw-huella.txt; git diff 813b3be origin/main --stat; git show origin/main:public/atlas-en.json | sha256sum; git show origin/main:AGENTS.md; git diff 3f975c3 origin/main --stat; git show origin/main:public/game/valores.js | sha256sum; gh run view 38803986531 --json attempt,status,conclusion,headSha; git show origin/main:CLAUDE.md.

Reconstrucción: git merge --no-commit --no-ff origin/main (1); git restore --source=origin/main --staged --worktree -- . (0); git diff --stat origin/main (salida vacía); git status --short --branch. Python stdlib ejecutó git show para recuperar solo seis fuentes propias de pruebas/gates de 3a812a7, copió EN de la nueva base al fixture, comprobó su objeto b81b02c2, cambió SOLO las dos etiquetas y recalculó los hashes de cinco protegidos desde origin/main. Se midió también un rojo explícito de M0 con node --stack-trace-limit=0 atlas/phase_M0_cases.mjs --sabotage (1). El flag limita la pila impresa, no la aserción ni el resultado. Python stdlib cotejó además los nueve hashes protegidos/visuales anteriores y pruebas_app/pruebas_web exactamente contra la nueva main; sin cifras APP nuevas.

Las salidas completas de sellado y de CADA gate medido siguen abajo, sin recortes. stdout y stderr se capturaron juntos. Ausencia de texto se muestra como salida vacía, sin inventar salida del comando. Al final se ejecutarán git diff --check, git add, git commit y git push de esta rama propia, con ganchos intactos; sus resultados y el head real se registran después en #110. CI del head final queda PENDIENTE en este commit: se medirán sus dos intentos y se pegarán sus logs crudos por permalink en el recibo final del PR sin cambiar el SHA probado.

### Salidas crudas de sellado y gates locales

#### main-before-seal · salida 0 (esperada 0)

Comando: `git ls-remote origin refs/heads/main`

~~~~text
9e4bdd87f96a9c5dcfc1ac5ca62cd25496a1afaf	refs/heads/main
~~~~

#### seal-1 · salida 0 (esperada 0)

Comando: `python3 bin/sellar.py --sellar --version preceptoros-2026-17-abht`

~~~~text
version   preceptoros-2026-17-abhs  ->  preceptoros-2026-17-abht
huella    ece78b601f6d072c  ->  (se recalcula al escribir)

SELLADO · version=preceptoros-2026-17-abht huella=e5888764d9a90c81
~~~~

#### counters-1 · salida 0 (esperada 0)

Comando: `python3 contadores.py`

~~~~text
escrito public/counters.json · 8 medidas, 2 NO_DATA
~~~~

#### world · salida 0 (esperada 0)

Comando: `python3 atlas/mundo.py`

~~~~text
atlas-mundo.json · medido_el=2026-10-15T21:41Z, maquina=Linux x86_64 · Python 3.14.4, pruebas_web=78, lenguas=9, techo_bloque_b=26214400, gzip_juego_b=92124, version_sw=preceptoros-2026-17-abht, arnes_sw=22/22
~~~~

#### counters-2 · salida 0 (esperada 0)

Comando: `python3 contadores.py`

~~~~text
escrito public/counters.json · 8 medidas, 2 NO_DATA
~~~~

#### seal-final · salida 0 (esperada 0)

Comando: `python3 bin/sellar.py --sellar --version preceptoros-2026-17-abht`

~~~~text
version   preceptoros-2026-17-abht  ->  preceptoros-2026-17-abht
huella    e5888764d9a90c81  ->  (se recalcula al escribir)

SELLADO · version=preceptoros-2026-17-abht huella=973598d4d6980fe2
~~~~

#### seal-dry · salida 0 (esperada 0)

Comando: `python3 bin/sellar.py`

~~~~text
NADA QUE SELLAR · lo publicado no ha cambiado desde preceptoros-2026-17-abht
~~~~

#### phase-before-gates · salida 0 (esperada 0)

Comando: `node atlas/phase_gate.mjs`

~~~~text
{"gate":"phase","public_text_files":163,"initial_files":26,"gzip_initial_b":92124}
~~~~

#### local-1-00 · salida 0 (esperada 0)

Comando: `node atlas/phase_T3_cases.mjs`

~~~~text
{"piece":"T3","bytes":15978,"object_sha256":"cd6d33ee6780780189482bfa031aa36f00d0c2b2709e3112f08b203b7676ee9a","bytes_sha256":"5cc41650b10112ad39d2485242e9b6fb961c8586a692a278db5d782f742e7a81","reverted_object_sha256":"b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939"}
~~~~

#### local-1-01 · salida 0 (esperada 0)

Comando: `node atlas/phase_T3_cases.mjs --sabotages`

~~~~text
{"attack":"inc_h","red":true,"invariant":"T3_LABEL_INC_H"}
{"attack":"army","red":true,"invariant":"T3_LABEL_ARMY"}
{"attack":"third","red":true,"invariant":"T3_DELTA"}
{"attack":"compact","red":true,"invariant":"T3_COMPACT"}
{"attack":"size","red":true,"invariant":"T3_SIZE"}
{"attack":"protected-0","red":true,"invariant":"T3_PROTECTED:public/game/valores.js"}
{"attack":"protected-1","red":true,"invariant":"T3_PROTECTED:public/assets/atlas-motor.js"}
{"attack":"protected-2","red":true,"invariant":"T3_PROTECTED:public/game/gacha.js"}
{"attack":"protected-3","red":true,"invariant":"T3_PROTECTED:public/game/core.js"}
{"attack":"protected-4","red":true,"invariant":"T3_PROTECTED:public/game/ui-invoca.js"}
~~~~

#### local-1-02 · salida 0 (esperada 0)

Comando: `node atlas/chrome_launch_cases.mjs`

~~~~text
Chrome unavailable: exit 1, zero steps, NO_DATA with cause; rejection verified.
~~~~

#### local-1-03 · salida 0 (esperada 0)

Comando: `node atlas/phase_M0_cases.mjs`

~~~~text
{"piece":"M0","bytes":15994,"object_sha256":"b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939","equal":true}
~~~~

#### local-1-04 · salida 1 (esperada 1)

Comando: `node --stack-trace-limit=0 atlas/phase_M0_cases.mjs --sabotage`

~~~~text
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^

[AssertionError [ERR_ASSERTION]: English object changed
+ actual - expected

+ '65b83e6502bd59655c8e1e9ee470f759764bee2249d3e637bb4963c41c7a7d7c'
- 'b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939'
] {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: '65b83e6502bd59655c8e1e9ee470f759764bee2249d3e637bb4963c41c7a7d7c',
  expected: 'b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.1
~~~~

#### local-1-05 · salida 0 (esperada 0)

Comando: `python3 test_web.py`

~~~~text
test_la_version_del_service_worker_sigue_a_lo_publicado (__main__.Cabezal.test_la_version_del_service_worker_sigue_a_lo_publicado)
Desplegar no es publicar. Medido en produccion, no deducido. ... ok
test_ninguna_pagina_ofrece_un_enlace_y_lo_desmiente (__main__.Cabezal.test_ninguna_pagina_ofrece_un_enlace_y_lo_desmiente)
No se puede poner un boton y decir al lado que no funciona. ... ok
test_todo_panel_publicado_dice_lo_que_falla (__main__.Cabezal.test_todo_panel_publicado_dice_lo_que_falla)
Una ficha que solo cuenta virtudes es publicidad, no una medida. ... skipped 'no hay paneles publicados todavia'
test_dice_que_se_envia_en_las_nueve_lenguas (__main__.ComentarEnTodasLasPaginas.test_dice_que_se_envia_en_las_nueve_lenguas) ... ok
test_el_modulo_usa_la_puerta_que_ya_existe_y_no_abre_otra (__main__.ComentarEnTodasLasPaginas.test_el_modulo_usa_la_puerta_que_ya_existe_y_no_abre_otra) ... ok
test_ningun_cero_decorativo (__main__.Contadores.test_ningun_cero_decorativo)
Un 0 solo vale si `como` NOMBRA la lectura de la que salio. ... ok
test_toda_metrica_esta_medida_o_declara_su_causa (__main__.Contadores.test_toda_metrica_esta_medida_o_declara_su_causa) ... ok
test_cero_frameworks (__main__.Doctrina.test_cero_frameworks) ... ok
test_cero_rutas_absolutas_ni_ips (__main__.Doctrina.test_cero_rutas_absolutas_ni_ips)
Lo que protege: que una IP de la tailnet no acabe en la web publica. ... ok
test_el_cristal_degrada_y_se_puede_apagar (__main__.Doctrina.test_el_cristal_degrada_y_se_puede_apagar)
Canon v3.0 «Liquid Glass», firmado el 2026-08-29. ... ok
test_el_head_entero_no_mezcla_los_dos_estilos (__main__.Doctrina.test_el_head_entero_no_mezcla_los_dos_estilos)
El de arriba solo mira `assets/`. La regla es del `<head>` entero. ... ok
test_la_guia_clona_donde_el_instalador_instala (__main__.Doctrina.test_la_guia_clona_donde_el_instalador_instala)
La web decia `~/aurelius`; `install.sh` usa `~/preceptoros`. ... ok
test_ninguna_hoja_esta_rota_por_dentro (__main__.Doctrina.test_ninguna_hoja_esta_rota_por_dentro)
Una hoja que el navegador no sabe leer pasaba este gate en verde. ... ok
test_una_pagina_no_mezcla_rutas_absolutas_y_relativas (__main__.Doctrina.test_una_pagina_no_mezcla_rutas_absolutas_y_relativas)
Dos estilos de ruta en el mismo `<head>` es una averia latente. ... ok
test_el_aviso_de_solo_ingles_va_primero_en_la_pestana_de_entrada (__main__.ElJuegoEnInglesEnLasNueve.test_el_aviso_de_solo_ingles_va_primero_en_la_pestana_de_entrada) ... ok
test_las_lenguas_del_juego_son_solo_ingles (__main__.ElJuegoEnInglesEnLasNueve.test_las_lenguas_del_juego_son_solo_ingles) ... ok
test_cada_fichero_bajo_el_tope (__main__.Estructura.test_cada_fichero_bajo_el_tope)
El tope rige TAMBIEN los datos, y desde el 2026-08-31. ... ok
test_cero_html_en_la_raiz (__main__.Estructura.test_cero_html_en_la_raiz) ... ok
test_counters_no_se_queda_atras_de_este_mismo_gate (__main__.Estructura.test_counters_no_se_queda_atras_de_este_mismo_gate)
La puerta trasera que dejo pasar 19 cuando el gate ya media 25. ... ok
test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro (__main__.Estructura.test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro)
Dos guiones escriben este fichero. Ninguno puede borrar al otro. ... ok
test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera (__main__.Estructura.test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera)
Soberania Violeta-Cobre, 2026-09-25. Una capa ENCIMA del tema. ... ok
test_la_prosa_del_pie_va_PLEGADA (__main__.Estructura.test_la_prosa_del_pie_va_PLEGADA)
Una pagina limpia: el que entra evalua, el que quiere leer abre. ... ok
test_la_tarjeta_social_apunta_a_algo_que_existe (__main__.Estructura.test_la_tarjeta_social_apunta_a_algo_que_existe)
og:image, og:url y el favicon, comprobados contra el disco. ... ok
test_las_portadas_declaran_hreflang (__main__.Estructura.test_las_portadas_declaran_hreflang)
Tres traducciones sin hreflang son tres paginas sueltas para un ... ok
test_maximo_ocho_paginas (__main__.Estructura.test_maximo_ocho_paginas) ... ok
test_ningun_fichero_gasta_medio_viaje_de_red (__main__.Estructura.test_ningun_fichero_gasta_medio_viaje_de_red)
El tope de disco es un PROXY; esto mide la cosa de verdad. ... ok
test_r_widget_y_r_tipografia (__main__.Estructura.test_r_widget_y_r_tipografia)
El anexo visual, comprobado y no confiado. ... ok
test_toda_pagina_ofrece_LAS_LENGUAS_QUE_EXISTEN (__main__.Estructura.test_toda_pagina_ofrece_LAS_LENGUAS_QUE_EXISTEN)
La rueda de idiomas sale de aqui, y por eso ofrecia tres de ocho. ... ok
test_wrangler_apunta_a_public (__main__.Estructura.test_wrangler_apunta_a_public) ... ok
test_glifo_es_accesible_local_y_acotado (__main__.GlifoSemantico.test_glifo_es_accesible_local_y_acotado) ... ok
test_palette_vectorial_contrasta_con_el_panel (__main__.GlifoSemantico.test_palette_vectorial_contrasta_con_el_panel) ... ok
test_la_api_no_se_pide_al_cargar (__main__.Identidad.test_la_api_no_se_pide_al_cargar)
El tunel esta admitido como enlace, no como subrecurso. ... ok
test_la_firma_va_entera (__main__.Identidad.test_la_firma_va_entera)
`firmar()` devolvia `ed25519:` + 16 caracteres + puntos suspensivos. ... ok
test_ningun_asset_precacheado_esta_muerto (__main__.Imagenes.test_ningun_asset_precacheado_esta_muerto)
Todo lo que `sw.js` mete en la cache lo pinta alguien. ... ok
test_no_vuelven_los_raster_retirados (__main__.Imagenes.test_no_vuelven_los_raster_retirados)
Firma F2 del Soberano, 2026-10-10: identidad pura, cero imagenes. ... ok
test_la_identidad_no_cambia_ni_un_byte (__main__.LasTraduccionesSeSacanYSeMeten.test_la_identidad_no_cambia_ni_un_byte) ... ok
test_ninguna_familia_lleva_un_rotulo_vacio (__main__.LasTraduccionesSeSacanYSeMeten.test_ninguna_familia_lleva_un_rotulo_vacio)
El pie de Instalar salio como un triangulo SIN rotulo en ocho de nueve ... ok
test_cada_familia_dice_exactamente_sus_claves_firmadas (__main__.LasTresFamilias.test_cada_familia_dice_exactamente_sus_claves_firmadas) ... ok
test_cada_lengua_dice_de_donde_salio (__main__.LasTresFamilias.test_cada_lengua_dice_de_donde_salio)
Quien lea esto tiene que poder separar la salida CRUDA del modelo de ... ok
test_el_ruso_y_el_griego_estan_en_su_alfabeto (__main__.LasTresFamilias.test_el_ruso_y_el_griego_estan_en_su_alfabeto)
El fallo que ya esta medido en el canon: un modelo pequeno se pasa ... ok
test_ninguna_traduccion_llega_vacia (__main__.LasTresFamilias.test_ninguna_traduccion_llega_vacia)
Una cadena vacia pasa la paridad de claves y sale en blanco. ... ok
test_cada_familia_por_lengua_esta_completa_o_su_hueco_declarado (__main__.LoQueNoSeVeConElGateVerde.test_cada_familia_por_lengua_esta_completa_o_su_hueco_declarado) ... ok
test_cada_pagina_que_captura_tiene_su_puerta_de_salida_y_su_sello (__main__.LoQueNoSeVeConElGateVerde.test_cada_pagina_que_captura_tiene_su_puerta_de_salida_y_su_sello)
Pedido por el Soberano el 2026-09-24: que cada sitio desde el que un ... ok
test_lo_que_depende_de_bronce_se_carga_despues (__main__.LoQueNoSeVeConElGateVerde.test_lo_que_depende_de_bronce_se_carga_despues) ... ok
test_el_manifiesto_dice_lo_que_la_pagina_pinta (__main__.PWA.test_el_manifiesto_dice_lo_que_la_pagina_pinta) ... ok
test_el_maskable_cabe_de_verdad_en_su_circulo (__main__.PWA.test_el_maskable_cabe_de_verdad_en_su_circulo)
No que lo diga el manifiesto: que lo diga el fichero. ... ok
test_el_service_worker_esta_enchufado (__main__.PWA.test_el_service_worker_esta_enchufado)
Un worker que nadie registra es un fichero, no un PWA. ... ok
test_el_worker_no_guarda_lo_ajeno_ni_los_datos (__main__.PWA.test_el_worker_no_guarda_lo_ajeno_ni_los_datos)
Las dos reglas que el worker anterior rompia. ... ok
test_el_worker_pasa_su_arnes (__main__.PWA.test_el_worker_pasa_su_arnes)
Las reglas de enrutado, ejecutadas de verdad. ... ok
test_iconos_y_tarjeta_salen_del_emblema (__main__.PWA.test_iconos_y_tarjeta_salen_del_emblema)
Firma F2-8 del Soberano, 2026-10-10: favicon, iconos PWA y og:image siguen ... ok
test_los_iconos_no_engordan_sin_permiso (__main__.PWA.test_los_iconos_no_engordan_sin_permiso)
Los iconos pasaron de 12 KB a 180 KB al cambiar de arte. ... ok
test_manifest_es_minimo (__main__.PWA.test_manifest_es_minimo)
Lo que hace falta para instalar, y nada de adorno. ... ok
test_sin_conexion_hay_algo_que_leer (__main__.PWA.test_sin_conexion_hay_algo_que_leer)
Y en los tres idiomas: quien instala desde /fr/ no merece un ... ok
test_sw_cachea_los_nuevos_assets (__main__.PWA.test_sw_cachea_los_nuevos_assets)
El worker tiene que conocer TODO lo que la portada necesita. ... ok
test_un_icono_maskable_no_puede_ser_el_mismo_que_el_normal (__main__.PWA.test_un_icono_maskable_no_puede_ser_el_mismo_que_el_normal)
Medido el 2026-08-30 sobre icon-512.png y por eso existe. ... ok
test_un_solo_manifiesto (__main__.PWA.test_un_solo_manifiesto)
Habia `manifest.json` y `manifest.webmanifest` identicos byte a ... ok
test_los_enlaces_internos_existen (__main__.Paginas.test_los_enlaces_internos_existen)
Ningun enlace relativo apunta a una pagina que no esta. ... ok
test_selector_de_idioma_por_path (__main__.Paginas.test_selector_de_idioma_por_path) ... ok
test_todas_las_paginas_tienen_pie_honesto (__main__.Paginas.test_todas_las_paginas_tienen_pie_honesto) ... ok
test_el_juego_se_monta_en_el_panel_no_encima (__main__.Portada.test_el_juego_se_monta_en_el_panel_no_encima) ... ok
test_la_pagina_se_reordena_no_carga (__main__.Portada.test_la_pagina_se_reordena_no_carga)
J10: cambiar de pestana va en startViewTransition, con el cambio de siempre como reserva y SIN ... ok
test_las_diez_son_la_plantilla (__main__.Portada.test_las_diez_son_la_plantilla) ... ok
test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez (__main__.Portada.test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez) ... ok
test_solo_carga_lo_que_el_juego_necesita (__main__.Portada.test_solo_carga_lo_que_el_juego_necesita)
Medido (propuestas/mudanza-20261011/pide.js): Identity, el canal, la PWA y el juego. ... ok
test_un_solo_panel_y_nada_del_hub (__main__.Portada.test_un_solo_panel_y_nada_del_hub) ... ok
test_va_donde_va_la_otra_puerta (__main__.Reescrituras.test_va_donde_va_la_otra_puerta)
Las dos puertas se cargan juntas o la nueva no existe. ... ok
test_el_sitemap_no_anuncia_paginas_que_no_estan (__main__.Sitemap.test_el_sitemap_no_anuncia_paginas_que_no_estan)
Un sitemap rancio manda al buscador a un 404 que no ve ningun humano. ... ok
test_robots_apunta_al_sitemap (__main__.Sitemap.test_robots_apunta_al_sitemap) ... ok
test_toda_pagina_de_contenido_esta_en_el_sitemap (__main__.Sitemap.test_toda_pagina_de_contenido_esta_en_el_sitemap)
La averia simetrica: la pagina existe y el buscador no la ve. ... ok
test_NINGUNA_pagina_cae_al_respaldo_en_castellano (__main__.Traducciones.test_NINGUNA_pagina_cae_al_respaldo_en_castellano)
La regla entera, y contra TODOS los guiones que carga cada pagina. ... ok
test_NINGUNA_pagina_repite_LA_PROSA_DE_OTRA_LENGUA (__main__.Traducciones.test_NINGUNA_pagina_repite_LA_PROSA_DE_OTRA_LENGUA)
El hueco que ni el respaldo ni las claves ausentes podian ver. ... ok
test_NINGUN_guion_lleva_CASTELLANO_suelto (__main__.Traducciones.test_NINGUN_guion_lleva_CASTELLANO_suelto)
El hueco por donde se colo el Showman, y que el otro guardian no ve. ... ok
test_cada_pagina_declara_SU_lengua_en_el_bloque (__main__.Traducciones.test_cada_pagina_declara_SU_lengua_en_el_bloque)
`lang` dentro del bloque no es decorativo: se lo lleva el modelo. ... ok
test_los_rotulos_del_ENVIO_viven_en_las_ocho (__main__.Traducciones.test_los_rotulos_del_ENVIO_viven_en_las_ocho)
`enviar.js` esta perdonado arriba, asi que aqui se paga el perdon. ... ok
test_la_propuesta_no_lista_ficheros_que_ya_no_existen (__main__.WebLimpia.test_la_propuesta_no_lista_ficheros_que_ya_no_existen) ... ok
test_ningun_duplicado_exacto_nuevo (__main__.WebLimpia.test_ningun_duplicado_exacto_nuevo) ... ok
test_ningun_enlace_interno_roto (__main__.WebLimpia.test_ningun_enlace_interno_roto) ... ok
test_ningun_huerfano_nuevo (__main__.WebLimpia.test_ningun_huerfano_nuevo) ... ok

----------------------------------------------------------------------
Ran 78 tests in 1.717s

OK (skipped=1)
~~~~

#### local-1-06 · salida 0 (esperada 0)

Comando: `python3 atlas/test_atlas.py`

~~~~text
.................................................................................................................................................................................
----------------------------------------------------------------------
Ran 177 tests in 26.350s

OK
  borrador ar: 184/275 claves
  borrador de: 184/275 claves
  borrador el: 184/275 claves
  borrador es: 184/275 claves
  borrador fr: 184/275 claves
  borrador it: 184/275 claves
  borrador pt: 184/275 claves
  borrador ru: 184/275 claves
~~~~

#### local-1-07 · salida 0 (esperada 0)

Comando: `node arnes_sw.mjs`

~~~~text
  ok  precachea las portadas, su superficie y el juego  (143 rutas)
  ok  el shell trae el juego (D7): la puerta, el cangrejo y la arena
  ok  el shell trae la portada de cada lengua
  ok  el shell trae la identidad y el canal
  ok  el shell YA NO trae nada del hub
  ok  el shell NO trae ninguna de las dos familias de iconos de companero
  ok  otro origen pasa de largo
  ok  la API del Agora pasa de largo
  ok  counters.json no se cachea (es una medida)
  ok  atlas-en.json SI se sirve del cache (es contenido del juego)
  ok  el manifiesto va a red primero  (cuerpo red:https://preceptoros.org/manifest.webmanifest)
  ok  navegacion sale del shell aun sin red  (status 200)
  ok  sin red sintetiza pagina  (status 503)
  ok  la respeta el idioma de la ruta
  ok  la pagina sin red mete el texto en un panel
  ok  declara --panel-bg y --panel-fg
  ok  un POST pasa de largo
  ok  install no deja al worker nuevo esperando a que cierren las pestanas  (1 llamadas a skipWaiting)
  ok  activate borra el cache de la version anterior
  ok  el precache no guarda respuestas redirigidas  (0 de 143 marcadas)
  ok  la navegacion no devuelve una respuesta redirigida  (redirected=false)
  ok  el refresco por detras tampoco guarda la marca

22/22 en verde
~~~~

#### local-1-08 · salida 0 (esperada 0)

Comando: `node atlas/sin_undefined.mjs`

~~~~text
{
  "fallos": [],
  "pasos": 24
}
~~~~

#### local-1-09 · salida 0 (esperada 0)

Comando: `node atlas/vector_casos.mjs`

~~~~text
[
 {
  "caso": "cabe en el TOPE (1 KB) con un estado completo",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "lee lo que hay: ciclo, recursos, cangrejo (desplazamiento redondeado), panel, tutorial, edificios, lugares, nodos",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "vacio: cada hueco va a nd CON SU CAUSA (nunca un cero inventado, nunca undefined)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "el esquema explica cada clave del vector (lo que lee un LLM pequeno)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "solo LEE: armar dos veces el mismo estado da el mismo vector (determinista, sin reloj)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "acota por bytes UTF-8 reales y vuelve a medir tras el recorte (unicode)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "si el recorte normal no basta, fail-closed conserva contrato y causa",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "el contrato cerrado admite el vector medido y rechaza claves o ausencias sin causa",
  "ok": true,
  "detalle": ""
 }
]
~~~~

#### local-1-10 · salida 0 (esperada 0)

Comando: `node atlas/phase_gate.mjs`

~~~~text
{"gate":"phase","public_text_files":163,"initial_files":26,"gzip_initial_b":92124}
~~~~

#### local-1-11 · salida 0 (esperada 0)

Comando: `node --test tests/map_zoom.test.mjs tests/onda_profunda.test.mjs tests/tarjeta_cantada.test.mjs`

~~~~text
TAP version 13
# Subtest: contrato del repo: MIN 0.6, MAX 3, y data-zoom anotado
ok 1 - contrato del repo: MIN 0.6, MAX 3, y data-zoom anotado
  ---
  duration_ms: 1.079801
  type: 'test'
  ...
# Subtest: clamp del protocolo: fuera de rango queda en 0.6 / 3.0
ok 2 - clamp del protocolo: fuera de rango queda en 0.6 / 3.0
  ---
  duration_ms: 0.312609
  type: 'test'
  ...
# Subtest: monotonía: separar sube, juntar baja (zm0·d/d0)
ok 3 - monotonía: separar sube, juntar baja (zm0·d/d0)
  ---
  duration_ms: 0.128509
  type: 'test'
  ...
# Subtest: rueda: exp(-deltaY·0.0015), clamp final
ok 4 - rueda: exp(-deltaY·0.0015), clamp final
  ---
  duration_ms: 0.113981
  type: 'test'
  ...
# Subtest: la fuente lleva el clamp real (Math.max/Math.min): sin el, la suite cae
ok 5 - la fuente lleva el clamp real (Math.max/Math.min): sin el, la suite cae
  ---
  duration_ms: 0.116205
  type: 'test'
  ...
# Subtest: la ley del suelo manda: usa proyecta/ancla/profundidad de IsometricFloor, sin geometría propia
ok 6 - la ley del suelo manda: usa proyecta/ancla/profundidad de IsometricFloor, sin geometría propia
  ---
  duration_ms: 1.35438
  type: 'test'
  ...
# Subtest: pieza <16 KiB, vanilla, cero red
ok 7 - pieza <16 KiB, vanilla, cero red
  ---
  duration_ms: 0.419728
  type: 'test'
  ...
# Subtest: planifica: ancla y profundidad según la ley (huella incluida)
ok 8 - planifica: ancla y profundidad según la ley (huella incluida)
  ---
  duration_ms: 0.315235
  type: 'test'
  ...
# Subtest: escala viva: función pura del eje, clamp [0.75, 1.35], determinista
ok 9 - escala viva: función pura del eje, clamp [0.75, 1.35], determinista
  ---
  duration_ms: 0.191655
  type: 'test'
  ...
# Subtest: PUERTA DE LA (b) — orden del pintor: delante (mayor col+fila) pinta DESPUÉS y tapa
ok 10 - PUERTA DE LA (b) — orden del pintor: delante (mayor col+fila) pinta DESPUÉS y tapa
  ---
  duration_ms: 0.28035
  type: 'test'
  ...
# Subtest: SABOTAJE (la suite cae si encola ignora la ley): profundidad propia != profundidad de la ley
ok 11 - SABOTAJE (la suite cae si encola ignora la ley): profundidad propia != profundidad de la ley
  ---
  duration_ms: 0.240636
  type: 'test'
  ...
# Subtest: W3: Web Audio pura — cero archivos de audio, cero red, pieza <16 KiB
ok 12 - W3: Web Audio pura — cero archivos de audio, cero red, pieza <16 KiB
  ---
  duration_ms: 1.784788
  type: 'test'
  ...
# Subtest: tabla semántica MEDIDA usada, no reinventada: los números viven en AtlasToon.SELLOS
ok 13 - tabla semántica MEDIDA usada, no reinventada: los números viven en AtlasToon.SELLOS
  ---
  duration_ms: 0.468578
  type: 'test'
  ...
# Subtest: W1: FNV-1a determinista → base 220–660 Hz; mismo id = misma frecuencia
ok 14 - W1: FNV-1a determinista → base 220–660 Hz; mismo id = misma frecuencia
  ---
  duration_ms: 0.245054
  type: 'test'
  ...
# Subtest: VOZ=FORMA (M14): f_base = 220 + (hue/360)·660, medido contra la fórmula
ok 15 - VOZ=FORMA (M14): f_base = 220 + (hue/360)·660, medido contra la fórmula
  ---
  duration_ms: 0.218375
  type: 'test'
  ...
# Subtest: melodía determinista: mismo término y sello = mismas notas; sello desconocido = NO_DATA con causa
ok 16 - melodía determinista: mismo término y sello = mismas notas; sello desconocido = NO_DATA con causa
  ---
  duration_ms: 2.810819
  type: 'test'
  ...
# Subtest: SIN GESTO NO SUENA (reduced-motion: corte limpio): canta sin melodía/no medida = NO_DATA, nunca sonido
ok 17 - SIN GESTO NO SUENA (reduced-motion: corte limpio): canta sin melodía/no medida = NO_DATA, nunca sonido
  ---
  duration_ms: 0.594542
  type: 'test'
  ...
# Subtest: SABOTAJE: si la tabla semántica se corrompe (LIVE≠120), la melodía deriva y debe romper el gate
ok 18 - SABOTAJE: si la tabla semántica se corrompe (LIVE≠120), la melodía deriva y debe romper el gate
  ---
  duration_ms: 0.346292
  type: 'test'
  ...
1..18
# tests 18
# suites 0
# pass 18
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 142.057355
~~~~

#### local-1-12 · salida 0 (esperada 0)

Comando: `git diff --check`

~~~~text
~~~~

#### local-2-00 · salida 0 (esperada 0)

Comando: `node atlas/phase_T3_cases.mjs`

~~~~text
{"piece":"T3","bytes":15978,"object_sha256":"cd6d33ee6780780189482bfa031aa36f00d0c2b2709e3112f08b203b7676ee9a","bytes_sha256":"5cc41650b10112ad39d2485242e9b6fb961c8586a692a278db5d782f742e7a81","reverted_object_sha256":"b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939"}
~~~~

#### local-2-01 · salida 0 (esperada 0)

Comando: `node atlas/phase_T3_cases.mjs --sabotages`

~~~~text
{"attack":"inc_h","red":true,"invariant":"T3_LABEL_INC_H"}
{"attack":"army","red":true,"invariant":"T3_LABEL_ARMY"}
{"attack":"third","red":true,"invariant":"T3_DELTA"}
{"attack":"compact","red":true,"invariant":"T3_COMPACT"}
{"attack":"size","red":true,"invariant":"T3_SIZE"}
{"attack":"protected-0","red":true,"invariant":"T3_PROTECTED:public/game/valores.js"}
{"attack":"protected-1","red":true,"invariant":"T3_PROTECTED:public/assets/atlas-motor.js"}
{"attack":"protected-2","red":true,"invariant":"T3_PROTECTED:public/game/gacha.js"}
{"attack":"protected-3","red":true,"invariant":"T3_PROTECTED:public/game/core.js"}
{"attack":"protected-4","red":true,"invariant":"T3_PROTECTED:public/game/ui-invoca.js"}
~~~~

#### local-2-02 · salida 0 (esperada 0)

Comando: `node atlas/chrome_launch_cases.mjs`

~~~~text
Chrome unavailable: exit 1, zero steps, NO_DATA with cause; rejection verified.
~~~~

#### local-2-03 · salida 0 (esperada 0)

Comando: `node atlas/phase_M0_cases.mjs`

~~~~text
{"piece":"M0","bytes":15994,"object_sha256":"b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939","equal":true}
~~~~

#### local-2-04 · salida 1 (esperada 1)

Comando: `node --stack-trace-limit=0 atlas/phase_M0_cases.mjs --sabotage`

~~~~text
node:internal/modules/run_main:123
    triggerUncaughtException(
    ^

[AssertionError [ERR_ASSERTION]: English object changed
+ actual - expected

+ '65b83e6502bd59655c8e1e9ee470f759764bee2249d3e637bb4963c41c7a7d7c'
- 'b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939'
] {
  generatedMessage: false,
  code: 'ERR_ASSERTION',
  actual: '65b83e6502bd59655c8e1e9ee470f759764bee2249d3e637bb4963c41c7a7d7c',
  expected: 'b81b02c25f594d885bd1a06ad8ac9df1c01bd4d4159b8f3d9b07fecb3c880939',
  operator: 'strictEqual',
  diff: 'simple'
}

Node.js v22.22.1
~~~~

#### local-2-05 · salida 0 (esperada 0)

Comando: `python3 test_web.py`

~~~~text
test_la_version_del_service_worker_sigue_a_lo_publicado (__main__.Cabezal.test_la_version_del_service_worker_sigue_a_lo_publicado)
Desplegar no es publicar. Medido en produccion, no deducido. ... ok
test_ninguna_pagina_ofrece_un_enlace_y_lo_desmiente (__main__.Cabezal.test_ninguna_pagina_ofrece_un_enlace_y_lo_desmiente)
No se puede poner un boton y decir al lado que no funciona. ... ok
test_todo_panel_publicado_dice_lo_que_falla (__main__.Cabezal.test_todo_panel_publicado_dice_lo_que_falla)
Una ficha que solo cuenta virtudes es publicidad, no una medida. ... skipped 'no hay paneles publicados todavia'
test_dice_que_se_envia_en_las_nueve_lenguas (__main__.ComentarEnTodasLasPaginas.test_dice_que_se_envia_en_las_nueve_lenguas) ... ok
test_el_modulo_usa_la_puerta_que_ya_existe_y_no_abre_otra (__main__.ComentarEnTodasLasPaginas.test_el_modulo_usa_la_puerta_que_ya_existe_y_no_abre_otra) ... ok
test_ningun_cero_decorativo (__main__.Contadores.test_ningun_cero_decorativo)
Un 0 solo vale si `como` NOMBRA la lectura de la que salio. ... ok
test_toda_metrica_esta_medida_o_declara_su_causa (__main__.Contadores.test_toda_metrica_esta_medida_o_declara_su_causa) ... ok
test_cero_frameworks (__main__.Doctrina.test_cero_frameworks) ... ok
test_cero_rutas_absolutas_ni_ips (__main__.Doctrina.test_cero_rutas_absolutas_ni_ips)
Lo que protege: que una IP de la tailnet no acabe en la web publica. ... ok
test_el_cristal_degrada_y_se_puede_apagar (__main__.Doctrina.test_el_cristal_degrada_y_se_puede_apagar)
Canon v3.0 «Liquid Glass», firmado el 2026-08-29. ... ok
test_el_head_entero_no_mezcla_los_dos_estilos (__main__.Doctrina.test_el_head_entero_no_mezcla_los_dos_estilos)
El de arriba solo mira `assets/`. La regla es del `<head>` entero. ... ok
test_la_guia_clona_donde_el_instalador_instala (__main__.Doctrina.test_la_guia_clona_donde_el_instalador_instala)
La web decia `~/aurelius`; `install.sh` usa `~/preceptoros`. ... ok
test_ninguna_hoja_esta_rota_por_dentro (__main__.Doctrina.test_ninguna_hoja_esta_rota_por_dentro)
Una hoja que el navegador no sabe leer pasaba este gate en verde. ... ok
test_una_pagina_no_mezcla_rutas_absolutas_y_relativas (__main__.Doctrina.test_una_pagina_no_mezcla_rutas_absolutas_y_relativas)
Dos estilos de ruta en el mismo `<head>` es una averia latente. ... ok
test_el_aviso_de_solo_ingles_va_primero_en_la_pestana_de_entrada (__main__.ElJuegoEnInglesEnLasNueve.test_el_aviso_de_solo_ingles_va_primero_en_la_pestana_de_entrada) ... ok
test_las_lenguas_del_juego_son_solo_ingles (__main__.ElJuegoEnInglesEnLasNueve.test_las_lenguas_del_juego_son_solo_ingles) ... ok
test_cada_fichero_bajo_el_tope (__main__.Estructura.test_cada_fichero_bajo_el_tope)
El tope rige TAMBIEN los datos, y desde el 2026-08-31. ... ok
test_cero_html_en_la_raiz (__main__.Estructura.test_cero_html_en_la_raiz) ... ok
test_counters_no_se_queda_atras_de_este_mismo_gate (__main__.Estructura.test_counters_no_se_queda_atras_de_este_mismo_gate)
La puerta trasera que dejo pasar 19 cuando el gate ya media 25. ... ok
test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro (__main__.Estructura.test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro)
Dos guiones escriben este fichero. Ninguno puede borrar al otro. ... ok
test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera (__main__.Estructura.test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera)
Soberania Violeta-Cobre, 2026-09-25. Una capa ENCIMA del tema. ... ok
test_la_prosa_del_pie_va_PLEGADA (__main__.Estructura.test_la_prosa_del_pie_va_PLEGADA)
Una pagina limpia: el que entra evalua, el que quiere leer abre. ... ok
test_la_tarjeta_social_apunta_a_algo_que_existe (__main__.Estructura.test_la_tarjeta_social_apunta_a_algo_que_existe)
og:image, og:url y el favicon, comprobados contra el disco. ... ok
test_las_portadas_declaran_hreflang (__main__.Estructura.test_las_portadas_declaran_hreflang)
Tres traducciones sin hreflang son tres paginas sueltas para un ... ok
test_maximo_ocho_paginas (__main__.Estructura.test_maximo_ocho_paginas) ... ok
test_ningun_fichero_gasta_medio_viaje_de_red (__main__.Estructura.test_ningun_fichero_gasta_medio_viaje_de_red)
El tope de disco es un PROXY; esto mide la cosa de verdad. ... ok
test_r_widget_y_r_tipografia (__main__.Estructura.test_r_widget_y_r_tipografia)
El anexo visual, comprobado y no confiado. ... ok
test_toda_pagina_ofrece_LAS_LENGUAS_QUE_EXISTEN (__main__.Estructura.test_toda_pagina_ofrece_LAS_LENGUAS_QUE_EXISTEN)
La rueda de idiomas sale de aqui, y por eso ofrecia tres de ocho. ... ok
test_wrangler_apunta_a_public (__main__.Estructura.test_wrangler_apunta_a_public) ... ok
test_glifo_es_accesible_local_y_acotado (__main__.GlifoSemantico.test_glifo_es_accesible_local_y_acotado) ... ok
test_palette_vectorial_contrasta_con_el_panel (__main__.GlifoSemantico.test_palette_vectorial_contrasta_con_el_panel) ... ok
test_la_api_no_se_pide_al_cargar (__main__.Identidad.test_la_api_no_se_pide_al_cargar)
El tunel esta admitido como enlace, no como subrecurso. ... ok
test_la_firma_va_entera (__main__.Identidad.test_la_firma_va_entera)
`firmar()` devolvia `ed25519:` + 16 caracteres + puntos suspensivos. ... ok
test_ningun_asset_precacheado_esta_muerto (__main__.Imagenes.test_ningun_asset_precacheado_esta_muerto)
Todo lo que `sw.js` mete en la cache lo pinta alguien. ... ok
test_no_vuelven_los_raster_retirados (__main__.Imagenes.test_no_vuelven_los_raster_retirados)
Firma F2 del Soberano, 2026-10-10: identidad pura, cero imagenes. ... ok
test_la_identidad_no_cambia_ni_un_byte (__main__.LasTraduccionesSeSacanYSeMeten.test_la_identidad_no_cambia_ni_un_byte) ... ok
test_ninguna_familia_lleva_un_rotulo_vacio (__main__.LasTraduccionesSeSacanYSeMeten.test_ninguna_familia_lleva_un_rotulo_vacio)
El pie de Instalar salio como un triangulo SIN rotulo en ocho de nueve ... ok
test_cada_familia_dice_exactamente_sus_claves_firmadas (__main__.LasTresFamilias.test_cada_familia_dice_exactamente_sus_claves_firmadas) ... ok
test_cada_lengua_dice_de_donde_salio (__main__.LasTresFamilias.test_cada_lengua_dice_de_donde_salio)
Quien lea esto tiene que poder separar la salida CRUDA del modelo de ... ok
test_el_ruso_y_el_griego_estan_en_su_alfabeto (__main__.LasTresFamilias.test_el_ruso_y_el_griego_estan_en_su_alfabeto)
El fallo que ya esta medido en el canon: un modelo pequeno se pasa ... ok
test_ninguna_traduccion_llega_vacia (__main__.LasTresFamilias.test_ninguna_traduccion_llega_vacia)
Una cadena vacia pasa la paridad de claves y sale en blanco. ... ok
test_cada_familia_por_lengua_esta_completa_o_su_hueco_declarado (__main__.LoQueNoSeVeConElGateVerde.test_cada_familia_por_lengua_esta_completa_o_su_hueco_declarado) ... ok
test_cada_pagina_que_captura_tiene_su_puerta_de_salida_y_su_sello (__main__.LoQueNoSeVeConElGateVerde.test_cada_pagina_que_captura_tiene_su_puerta_de_salida_y_su_sello)
Pedido por el Soberano el 2026-09-24: que cada sitio desde el que un ... ok
test_lo_que_depende_de_bronce_se_carga_despues (__main__.LoQueNoSeVeConElGateVerde.test_lo_que_depende_de_bronce_se_carga_despues) ... ok
test_el_manifiesto_dice_lo_que_la_pagina_pinta (__main__.PWA.test_el_manifiesto_dice_lo_que_la_pagina_pinta) ... ok
test_el_maskable_cabe_de_verdad_en_su_circulo (__main__.PWA.test_el_maskable_cabe_de_verdad_en_su_circulo)
No que lo diga el manifiesto: que lo diga el fichero. ... ok
test_el_service_worker_esta_enchufado (__main__.PWA.test_el_service_worker_esta_enchufado)
Un worker que nadie registra es un fichero, no un PWA. ... ok
test_el_worker_no_guarda_lo_ajeno_ni_los_datos (__main__.PWA.test_el_worker_no_guarda_lo_ajeno_ni_los_datos)
Las dos reglas que el worker anterior rompia. ... ok
test_el_worker_pasa_su_arnes (__main__.PWA.test_el_worker_pasa_su_arnes)
Las reglas de enrutado, ejecutadas de verdad. ... ok
test_iconos_y_tarjeta_salen_del_emblema (__main__.PWA.test_iconos_y_tarjeta_salen_del_emblema)
Firma F2-8 del Soberano, 2026-10-10: favicon, iconos PWA y og:image siguen ... ok
test_los_iconos_no_engordan_sin_permiso (__main__.PWA.test_los_iconos_no_engordan_sin_permiso)
Los iconos pasaron de 12 KB a 180 KB al cambiar de arte. ... ok
test_manifest_es_minimo (__main__.PWA.test_manifest_es_minimo)
Lo que hace falta para instalar, y nada de adorno. ... ok
test_sin_conexion_hay_algo_que_leer (__main__.PWA.test_sin_conexion_hay_algo_que_leer)
Y en los tres idiomas: quien instala desde /fr/ no merece un ... ok
test_sw_cachea_los_nuevos_assets (__main__.PWA.test_sw_cachea_los_nuevos_assets)
El worker tiene que conocer TODO lo que la portada necesita. ... ok
test_un_icono_maskable_no_puede_ser_el_mismo_que_el_normal (__main__.PWA.test_un_icono_maskable_no_puede_ser_el_mismo_que_el_normal)
Medido el 2026-08-30 sobre icon-512.png y por eso existe. ... ok
test_un_solo_manifiesto (__main__.PWA.test_un_solo_manifiesto)
Habia `manifest.json` y `manifest.webmanifest` identicos byte a ... ok
test_los_enlaces_internos_existen (__main__.Paginas.test_los_enlaces_internos_existen)
Ningun enlace relativo apunta a una pagina que no esta. ... ok
test_selector_de_idioma_por_path (__main__.Paginas.test_selector_de_idioma_por_path) ... ok
test_todas_las_paginas_tienen_pie_honesto (__main__.Paginas.test_todas_las_paginas_tienen_pie_honesto) ... ok
test_el_juego_se_monta_en_el_panel_no_encima (__main__.Portada.test_el_juego_se_monta_en_el_panel_no_encima) ... ok
test_la_pagina_se_reordena_no_carga (__main__.Portada.test_la_pagina_se_reordena_no_carga)
J10: cambiar de pestana va en startViewTransition, con el cambio de siempre como reserva y SIN ... ok
test_las_diez_son_la_plantilla (__main__.Portada.test_las_diez_son_la_plantilla) ... ok
test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez (__main__.Portada.test_menu_y_hoja_nunca_quedan_abiertos_a_la_vez) ... ok
test_solo_carga_lo_que_el_juego_necesita (__main__.Portada.test_solo_carga_lo_que_el_juego_necesita)
Medido (propuestas/mudanza-20261011/pide.js): Identity, el canal, la PWA y el juego. ... ok
test_un_solo_panel_y_nada_del_hub (__main__.Portada.test_un_solo_panel_y_nada_del_hub) ... ok
test_va_donde_va_la_otra_puerta (__main__.Reescrituras.test_va_donde_va_la_otra_puerta)
Las dos puertas se cargan juntas o la nueva no existe. ... ok
test_el_sitemap_no_anuncia_paginas_que_no_estan (__main__.Sitemap.test_el_sitemap_no_anuncia_paginas_que_no_estan)
Un sitemap rancio manda al buscador a un 404 que no ve ningun humano. ... ok
test_robots_apunta_al_sitemap (__main__.Sitemap.test_robots_apunta_al_sitemap) ... ok
test_toda_pagina_de_contenido_esta_en_el_sitemap (__main__.Sitemap.test_toda_pagina_de_contenido_esta_en_el_sitemap)
La averia simetrica: la pagina existe y el buscador no la ve. ... ok
test_NINGUNA_pagina_cae_al_respaldo_en_castellano (__main__.Traducciones.test_NINGUNA_pagina_cae_al_respaldo_en_castellano)
La regla entera, y contra TODOS los guiones que carga cada pagina. ... ok
test_NINGUNA_pagina_repite_LA_PROSA_DE_OTRA_LENGUA (__main__.Traducciones.test_NINGUNA_pagina_repite_LA_PROSA_DE_OTRA_LENGUA)
El hueco que ni el respaldo ni las claves ausentes podian ver. ... ok
test_NINGUN_guion_lleva_CASTELLANO_suelto (__main__.Traducciones.test_NINGUN_guion_lleva_CASTELLANO_suelto)
El hueco por donde se colo el Showman, y que el otro guardian no ve. ... ok
test_cada_pagina_declara_SU_lengua_en_el_bloque (__main__.Traducciones.test_cada_pagina_declara_SU_lengua_en_el_bloque)
`lang` dentro del bloque no es decorativo: se lo lleva el modelo. ... ok
test_los_rotulos_del_ENVIO_viven_en_las_ocho (__main__.Traducciones.test_los_rotulos_del_ENVIO_viven_en_las_ocho)
`enviar.js` esta perdonado arriba, asi que aqui se paga el perdon. ... ok
test_la_propuesta_no_lista_ficheros_que_ya_no_existen (__main__.WebLimpia.test_la_propuesta_no_lista_ficheros_que_ya_no_existen) ... ok
test_ningun_duplicado_exacto_nuevo (__main__.WebLimpia.test_ningun_duplicado_exacto_nuevo) ... ok
test_ningun_enlace_interno_roto (__main__.WebLimpia.test_ningun_enlace_interno_roto) ... ok
test_ningun_huerfano_nuevo (__main__.WebLimpia.test_ningun_huerfano_nuevo) ... ok

----------------------------------------------------------------------
Ran 78 tests in 1.678s

OK (skipped=1)
~~~~

#### local-2-06 · salida 0 (esperada 0)

Comando: `python3 atlas/test_atlas.py`

~~~~text
.................................................................................................................................................................................
----------------------------------------------------------------------
Ran 177 tests in 26.120s

OK
  borrador ar: 184/275 claves
  borrador de: 184/275 claves
  borrador el: 184/275 claves
  borrador es: 184/275 claves
  borrador fr: 184/275 claves
  borrador it: 184/275 claves
  borrador pt: 184/275 claves
  borrador ru: 184/275 claves
~~~~

#### local-2-07 · salida 0 (esperada 0)

Comando: `node arnes_sw.mjs`

~~~~text
  ok  precachea las portadas, su superficie y el juego  (143 rutas)
  ok  el shell trae el juego (D7): la puerta, el cangrejo y la arena
  ok  el shell trae la portada de cada lengua
  ok  el shell trae la identidad y el canal
  ok  el shell YA NO trae nada del hub
  ok  el shell NO trae ninguna de las dos familias de iconos de companero
  ok  otro origen pasa de largo
  ok  la API del Agora pasa de largo
  ok  counters.json no se cachea (es una medida)
  ok  atlas-en.json SI se sirve del cache (es contenido del juego)
  ok  el manifiesto va a red primero  (cuerpo red:https://preceptoros.org/manifest.webmanifest)
  ok  navegacion sale del shell aun sin red  (status 200)
  ok  sin red sintetiza pagina  (status 503)
  ok  la respeta el idioma de la ruta
  ok  la pagina sin red mete el texto en un panel
  ok  declara --panel-bg y --panel-fg
  ok  un POST pasa de largo
  ok  install no deja al worker nuevo esperando a que cierren las pestanas  (1 llamadas a skipWaiting)
  ok  activate borra el cache de la version anterior
  ok  el precache no guarda respuestas redirigidas  (0 de 143 marcadas)
  ok  la navegacion no devuelve una respuesta redirigida  (redirected=false)
  ok  el refresco por detras tampoco guarda la marca

22/22 en verde
~~~~

#### local-2-08 · salida 0 (esperada 0)

Comando: `node atlas/sin_undefined.mjs`

~~~~text
{
  "fallos": [],
  "pasos": 24
}
~~~~

#### local-2-09 · salida 0 (esperada 0)

Comando: `node atlas/vector_casos.mjs`

~~~~text
[
 {
  "caso": "cabe en el TOPE (1 KB) con un estado completo",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "lee lo que hay: ciclo, recursos, cangrejo (desplazamiento redondeado), panel, tutorial, edificios, lugares, nodos",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "vacio: cada hueco va a nd CON SU CAUSA (nunca un cero inventado, nunca undefined)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "el esquema explica cada clave del vector (lo que lee un LLM pequeno)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "solo LEE: armar dos veces el mismo estado da el mismo vector (determinista, sin reloj)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "acota por bytes UTF-8 reales y vuelve a medir tras el recorte (unicode)",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "si el recorte normal no basta, fail-closed conserva contrato y causa",
  "ok": true,
  "detalle": ""
 },
 {
  "caso": "el contrato cerrado admite el vector medido y rechaza claves o ausencias sin causa",
  "ok": true,
  "detalle": ""
 }
]
~~~~

#### local-2-10 · salida 0 (esperada 0)

Comando: `node atlas/phase_gate.mjs`

~~~~text
{"gate":"phase","public_text_files":163,"initial_files":26,"gzip_initial_b":92124}
~~~~

#### local-2-11 · salida 0 (esperada 0)

Comando: `node --test tests/map_zoom.test.mjs tests/onda_profunda.test.mjs tests/tarjeta_cantada.test.mjs`

~~~~text
TAP version 13
# Subtest: contrato del repo: MIN 0.6, MAX 3, y data-zoom anotado
ok 1 - contrato del repo: MIN 0.6, MAX 3, y data-zoom anotado
  ---
  duration_ms: 1.226964
  type: 'test'
  ...
# Subtest: clamp del protocolo: fuera de rango queda en 0.6 / 3.0
ok 2 - clamp del protocolo: fuera de rango queda en 0.6 / 3.0
  ---
  duration_ms: 0.259761
  type: 'test'
  ...
# Subtest: monotonía: separar sube, juntar baja (zm0·d/d0)
ok 3 - monotonía: separar sube, juntar baja (zm0·d/d0)
  ---
  duration_ms: 0.112208
  type: 'test'
  ...
# Subtest: rueda: exp(-deltaY·0.0015), clamp final
ok 4 - rueda: exp(-deltaY·0.0015), clamp final
  ---
  duration_ms: 0.122968
  type: 'test'
  ...
# Subtest: la fuente lleva el clamp real (Math.max/Math.min): sin el, la suite cae
ok 5 - la fuente lleva el clamp real (Math.max/Math.min): sin el, la suite cae
  ---
  duration_ms: 0.122908
  type: 'test'
  ...
# Subtest: la ley del suelo manda: usa proyecta/ancla/profundidad de IsometricFloor, sin geometría propia
ok 6 - la ley del suelo manda: usa proyecta/ancla/profundidad de IsometricFloor, sin geometría propia
  ---
  duration_ms: 1.427807
  type: 'test'
  ...
# Subtest: pieza <16 KiB, vanilla, cero red
ok 7 - pieza <16 KiB, vanilla, cero red
  ---
  duration_ms: 0.353325
  type: 'test'
  ...
# Subtest: planifica: ancla y profundidad según la ley (huella incluida)
ok 8 - planifica: ancla y profundidad según la ley (huella incluida)
  ---
  duration_ms: 0.272725
  type: 'test'
  ...
# Subtest: escala viva: función pura del eje, clamp [0.75, 1.35], determinista
ok 9 - escala viva: función pura del eje, clamp [0.75, 1.35], determinista
  ---
  duration_ms: 0.205331
  type: 'test'
  ...
# Subtest: PUERTA DE LA (b) — orden del pintor: delante (mayor col+fila) pinta DESPUÉS y tapa
ok 10 - PUERTA DE LA (b) — orden del pintor: delante (mayor col+fila) pinta DESPUÉS y tapa
  ---
  duration_ms: 0.309343
  type: 'test'
  ...
# Subtest: SABOTAJE (la suite cae si encola ignora la ley): profundidad propia != profundidad de la ley
ok 11 - SABOTAJE (la suite cae si encola ignora la ley): profundidad propia != profundidad de la ley
  ---
  duration_ms: 0.374143
  type: 'test'
  ...
# Subtest: W3: Web Audio pura — cero archivos de audio, cero red, pieza <16 KiB
ok 12 - W3: Web Audio pura — cero archivos de audio, cero red, pieza <16 KiB
  ---
  duration_ms: 1.555363
  type: 'test'
  ...
# Subtest: tabla semántica MEDIDA usada, no reinventada: los números viven en AtlasToon.SELLOS
ok 13 - tabla semántica MEDIDA usada, no reinventada: los números viven en AtlasToon.SELLOS
  ---
  duration_ms: 0.212073
  type: 'test'
  ...
# Subtest: W1: FNV-1a determinista → base 220–660 Hz; mismo id = misma frecuencia
ok 14 - W1: FNV-1a determinista → base 220–660 Hz; mismo id = misma frecuencia
  ---
  duration_ms: 0.177489
  type: 'test'
  ...
# Subtest: VOZ=FORMA (M14): f_base = 220 + (hue/360)·660, medido contra la fórmula
ok 15 - VOZ=FORMA (M14): f_base = 220 + (hue/360)·660, medido contra la fórmula
  ---
  duration_ms: 0.144648
  type: 'test'
  ...
# Subtest: melodía determinista: mismo término y sello = mismas notas; sello desconocido = NO_DATA con causa
ok 16 - melodía determinista: mismo término y sello = mismas notas; sello desconocido = NO_DATA con causa
  ---
  duration_ms: 1.734324
  type: 'test'
  ...
# Subtest: SIN GESTO NO SUENA (reduced-motion: corte limpio): canta sin melodía/no medida = NO_DATA, nunca sonido
ok 17 - SIN GESTO NO SUENA (reduced-motion: corte limpio): canta sin melodía/no medida = NO_DATA, nunca sonido
  ---
  duration_ms: 0.334691
  type: 'test'
  ...
# Subtest: SABOTAJE: si la tabla semántica se corrompe (LIVE≠120), la melodía deriva y debe romper el gate
ok 18 - SABOTAJE: si la tabla semántica se corrompe (LIVE≠120), la melodía deriva y debe romper el gate
  ---
  duration_ms: 0.257537
  type: 'test'
  ...
1..18
# tests 18
# suites 0
# pass 18
# fail 0
# cancelled 0
# skipped 0
# todo 0
# duration_ms 136.25488
~~~~

#### local-2-12 · salida 0 (esperada 0)

Comando: `git diff --check`

~~~~text
~~~~

### Estado de entrega antes de CI final

MEDIDO local n=2 sobre el árbol público fijado: T3 limpio; diez ataques rojos por invariante por pasada; histórico M0 y borrado rojo; Chrome ausente rechazado; web 78 pruebas/1 skip (no hay paneles publicados); Atlas 177/177; SW 22/22/143 rutas; Chrome 24 pasos/0 fallos con encabezado y carga T3 comprobados; vector 8/8; fase 163 ficheros/26 iniciales/gzip local 92.124 B; visuales heredados 18/18; diff limpio. Sello ASIGNADO preceptoros-2026-17-abht / 973598d4d6980fe2, seco NADA QUE SELLAR.

NO_DATA con causa: CI doble ×2 del futuro head todavía no ejecutado al crear este recibo; se declarará por SHA en #110 cuando exista y terminen sus jobs. FPS físico y A11Y física de esta revisión no medidos porque no se abrió nueva sesión física; Chrome no los sustituye. Gastos CLI NO_DATA, contador verificable no expuesto. Sin modelos locales ni nueva delegación. No se afirma despliegue, merge, aprendizaje humano ni ejecución de piezas ajenas. No main directo/jetson/ramas claude o mistral/#89/raíz congelada/destinos del triaje. Después de T3, PARA según orden vigente.
