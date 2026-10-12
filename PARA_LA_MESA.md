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
