# New_Naming_Proposal_2 · PROPUESTA Mistral · 2026-10-15 (noche, ronda 2)

Estado: **PROPUESTA — sin firma del Soberano; sin renombre aplicado.** Extiende New_Naming_Proposal (#99, ya en main): las entradas 1.2–1.8 siguen esperando FIRMO individual y NO se reescriben aquí. J1–J15 intactos, sin renumerar. La Estrella Hexelion (public/dictionary.json, 43 entradas, esquema preceptoros.dictionary/1) es la capa de gobernanza: cada alineación cita su término estándar tal como vive en el diccionario; sin anclaje = NO_DATA con causa. Vocablos prohibidos ausentes por cerco. Piezas <16 KiB, cero red, inglés primero.

**Anclas del corpus citadas como fuentes reales:** EU AI Act (CELEX 32024R1689; canon ideas13oct §18) · GDPR Art. 25 · «la interfaz no es código estático: es la sombra de la matemática» (ideas7oct:85) · apéndice F130-131 (HRTF, morphing Fourier, foveado, flow fields, metaballs, phyllotaxis) · gpt-oss (open-weight, MXFP4, HARMONY con canal de análisis visible — NO_DATA: no encontré el enlace en el repo; lo pido al Soberano).

---

## 1 · Propuestas nuevas (para FIRMO individual, una a una)

### 1.9 «Odds» (puntos básicos por 10.000) → «Outcome Distribution» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `Odds` en puntos básicos — `public/game/canon.js:91` (y `cria.js:114`).
- **Propuesto:** UI: `Outcome distribution (basis points, rounded down)`; en código el comentario puede decir «distribución, no promesa».
- **Anclaje doble:** legislación: AI Act Art. 13 (CELEX 32024R1689, transparencia de riesgos y límites — «odds» es vocabulario de apuestas; «distribution» es vocabulario de divulgación honesta). Matemática: distribución de probabilidad discreta sobre pesos normalizados; el propio puntosBasicos es una función de masa redondeada hacia abajo «para que la suma enseñada no mienta» (canon.js:91-92).
- **Por qué mejora la doble lectura:** humano: deja de sonar a casa de apuestas («sin FOMO, la casa no gana»). Silicio: un auditor lee «distribution» y sabe que hay una función de masa verificable, no una promesa comercial.
- **Riesgo:** bajo; es etiqueta y comentario, el contrato de 10.000 puntos no cambia. Alineación Estrella: D33 Human Hand / D35 Memory Log (la distribución se declara, no se oculta). **PROPUESTA.**

### 1.10 «GACHA ARMONICO» (nombre de fichero) → mantener «gacha.js» corto, UI «Harmonic Spectrum» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `el GACHA ARMONICO` — `public/game/gacha.js:1` (la etiqueta 1.2 «Deterministic Summon» ya está propuesta para la pestaña; esto es SOLO el nombre visible del espectro/armónico, distinto de la entrada 1.2: no la reescribe, la complementa).
- **Propuesto:** UI del espectro: `Harmonic Spectrum` (el dibujo Fourier del tesoro); el fichero sigue siendo gacha.js.
- **Anclaje doble:** legislación: AI Act Art. 50 (interacción sin engaño: «spectrum» es medible, «gacha» es marketing de azar). Matemática: serie de Fourier / espectro armónico (apéndice F130-131 del corpus; el estudio de 455 KB hecho solo con senos, J-SN, es el techo de referencia de la casa).
- **Por qué:** humano: «espectro armónico» describe el dibujo real (los armónicos del vector). Silicio: «harmonic spectrum» es un término DSP auditable; honra la casa de la matemática con senos.
- **Riesgo:** medio; toca el nombre de una pieza con recibos. Alineación Estrella: A6 Same Tide (Deterministic Static Surface Generator, Reproducible-Builds-Spec). **PROPUESTA (depende de la 1.2, no la sustituye).**

### 1.11 «Narragrafo» → mantener en castellano; UI «Story Graph (CRDT)» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `el NARRAGRAFO` — `public/game/narragrafo.js:1`.
- **Propuesto:** UI: `Story Graph`; el fichero narragrafo.js se queda (contrato `atlas.mgno_nodo/1` ya citado en recibos).
- **Anclaje doble:** legislación: DSA (CELEX 32022R2065, Art. 14 — los nodos son contenido de usuario sin metadatos personales: 280 caracteres sin IPs ni rutas, medido en narragrafo.js:3-5). Matemática: CRDT con fundición por conjunto (funde; dos aparatos con los mismos sobres sacan el mismo grafo, byte a byte — narragrafo.js:9-10); el término estándar es CRDT join-semilattice.
- **Por qué:** humano: «grafo de historias» dice lo que es. Silicio: «Story Graph (CRDT)» le dice a un auditor que hay convergencia verificable sin coordinación central.
- **Riesgo:** bajo (etiqueta). Alineación Estrella: NO_DATA con causa — no hay entrada de la Estrella para CRDT ni para narrativa colaborativa; queda propuesto para futura entrada, decisión del Soberano. **PROPUESTA.**

### 1.12 «Escuadrón» → mantener; UI «Squad Choreography (MDA)» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `EL ESCUADRON` — `public/game/escuadron.js:1`.
- **Propuesto:** UI: `Squad Choreography`; escuadron.js se queda.
- **Anclaje doble:** legislación: AI Act Art. 14 (la caída de unidades es supervisable y legible: «el daño se lee a escala, sin barras», escuadron.js:6-7). Matemática: coreografía determinista = función del estado de la tropa (vivas = ceil(N·vida/max), techo de referencia MDA); «choreography» ya vive en battle_choreography.js, así que es vocabulario de la casa, no importado.
- **Por qué:** humano: «coreografía» ya lo usa el equipo (battle_choreography.js). Silicio: MDA (Mechanics-Dynamics-Aesthetics) es término auditable de diseño de juegos.
- **Riesgo:** bajo. Alineación Estrella: NO_DATA con causa (sin entrada para MDA en la Estrella). **PROPUESTA.**

### 1.13 «Radio» (canal) → mantener; pestaña «Radio» → «State Broadcast» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** pestaña `Radio` — `public/assets/radio_message_log.js:117` (['radio', T('channel_radio', 'Radio')]).
- **Propuesto:** UI: `State Broadcast` (lo que suena es estado + voz; el chat lo escribe).
- **Anclaje doble:** legislación: AI Act Art. 12 (registro automático: la Radio ES el log audible del estado, radio_message_log.js:1-2). Matemática: emisión = muestreo periódico de un vector de estado; el «measured chord rising from 432 to 528 Hz» de semiotic_glyph.js:6 es la parte audible del mismo vector.
- **Por qué:** humano: «emisión de estado» explica por qué la melodía cambia con el juego. Silicio: «state broadcast» es patrón de arquitectura auditable; un auditor de Art. 12 lo encuentra sin diccionario.
- **Riesgo:** bajo; solo si el Soberano quiere distinguir la Radio que suena del canal escrito (la pestaña 1.1 ya fue firmada como Transparency Log para el canal 'echoes'; esta es la 'radio'). Alineación Estrella: D35 Memory Log (Automatic Logging, EUR-Lex-CELEX:32024R1689-Art12). **PROPUESTA.**

### 1.14 «workshop dust» / «static residue» → mantener «residue»; renombrar «dust» → «Residue Ledger (grams)» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `Workshop dust` — `public/game/ui-taller.js:142`; «Static residue: {g} g» en :105.
- **Propuesto:** UI: unificar en `Residue Ledger (g)` — el saldo de lija con su unidad.
- **Anclaje doble:** legislación: AI Act Art. 12 (asiento encadenado por hash, atlas.asiento/1, mercado.js — el residuo se contabiliza igual: cada gramo sale de una disolución firmada). Matemática: libro mayor de enteros (integer ledger); el gramo es la unidad mínima indivisible del contrato.
- **Por qué:** humano: «ledger (g)» dice que cada gramo está contado y trazado, no «polvo» decorativo. Silicio: «ledger» es el término estándar de contabilidad verificable; «dust» en cripto-jerga significa moneda minúscula — vocabulario prohibido por cercos de moneda.
- **Riesgo:** bajo (etiquetas del Taller). Alineación Estrella: D35 Memory Log. **PROPUESTA.**

### 1.15 Los cinco colores semánticos → mantener; DOCUMENTAR su anclaje (sin renombre)
- **Actual:** `solar gold, signal cyan, community green, law violet, honest gray` — `public/game/semiotic_glyph.js:6`.
- **Propuesto:** ningún renombre: ya son doble-lectura. Solo se recoge su alineación para la Estrella: `law violet` ↔ D33/D13 (términos legislativos); `honest gray` ↔ C24 Epistemic Humility (NO_DATA); `signal cyan` ↔ matemática de señales; `community green` ↔ C22 Symbiotic Agency; `solar gold` ↔ A6 Same Tide (superficie determinista).
- **Riesgo:** cero (sin cambio). **RECOPILADO, SIN ACCIÓN.**

## 2 · NO_DATA con causa (nada inventado)

- **gpt-oss / HARMONY / canal de análisis:** lo MEDIDO del corpus (open-weight, MXFP4, reasoning effort configurable) no está en el repo; aquí no hay enlace verificable. Lo pido al Soberano. La 1.10 no depende de ese enlace: su anclaje es Fourier (F130-131), no OpenAI.
- **CRDT y MDA no tienen entrada en la Estrella** (verificado hoy contra public/dictionary.json, 43 entradas): las alineaciones 1.11 y 1.12 quedan propuestas para futuras entradas, decisión del Soberano.
- **projectM y el estudio J-SN de 455 KB:** citados como techo de referencia del corpus; no los encontré como ficheros en el repo (viven en los papeles del rack). Sus nombres no se proponen para renombre: solo se citan como ancla matemática de la 1.10.

## 3 · Resumen para firma (uno a uno)

| # | Cambio | Fichero:línea | Riesgo | Recomendación |
|---|---|---|---|---|
| 1.9 | Odds → Outcome distribution | canon.js:91, cria.js:114 | Bajo | **FIRMADA 15-oct** |
| 1.10 | GACHA (espectro UI) → Harmonic Spectrum | gacha.js:1 | Medio | **FIRMADA 15-oct** |
| 1.11 | Narragrafo (UI) → Story Graph (CRDT) | narragrafo.js:1 | Bajo | **FIRMADA 15-oct** |
| 1.12 | Escuadrón (UI) → Squad Choreography | escuadron.js:1 | Bajo | **FIRMADA 15-oct** |
| 1.13 | Pestaña Radio → State Broadcast | radio_message_log.js:117 | Bajo | **FIRMADA 15-oct** |
| 1.14 | Workshop dust → Residue Ledger (g) | ui-taller.js:142,105 | Bajo | **FIRMADA 15-oct** |
| 1.15 | Colores semánticos | semiotic_glyph.js:6 | — | Recopilado, sin acción |

J1–J15 del mapa firmado: intactos, sin renumerar. **1.9–1.15: FIRMADAS 15-oct (noche).** 1.2–1.8 de la ronda 1: FIRMADAS 15-oct (noche) — ver New_Naming_Proposal.md. Ninguna aplicada todavía: las ejecuta Codex.
