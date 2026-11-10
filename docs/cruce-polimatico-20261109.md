# El cruce polimático · piezas críticas y valiosas (2026-11-09)

> Decreto del Soberano (chat, 2026-11-09): cruzar los patrones externos con lo nativo y proponer piezas críticas o valiosas, en ASD-STE100. Ley de este documento: TODO es PROPUESTA L0. Nada entra al mapa sin FIRMO. La fuente única de misiones sigue siendo la sección 9 de docs/canon-map-details-20261107.md. Este documento propone filas para esa sección. Jamás crea misiones paralelas. Propose-only: ni código, ni fusión, ni despliegue.

Base medida: main 8d338bd7 == producción (sello hb, medido el 2026-11-09). Los rieles nativos se midieron en ese árbol. Fuentes leídas: OpenRig (activo el 9-nov), celld v0.6.3 (denoland), ai-security-interview-questions 05-mcp-security, JobPilot (bucle self-evolve), y la mina Gentle Hub destilada (94 entradas, 8-nov). La lotería (D4) y el duelo (D5) ya son canon fusionado. No se re-proponen.

## P1 · EL ANCLA LLENA — crítica
- Base medida: la cadena de confianza del nodo tiene el ancla y el manifiesto VACÍOS (null congelado; node_trust_anchor.js 254 B, node_trust_manifest.js 177 B en main). Las firmas se verifican contra nada.
- Patrón (MCP security): verificación criptográfica del token + fijación del manifiesto por hash. Pregunta del examen: ¿qué pasa si un servidor cambia sus descripciones tras la aprobación? Respuesta: se fijan por hash y el cambio exige reaprobación.
- ADAPTAMOS: plantar el primer ancla REAL (la llave de la aduana, tras su rotación) y fijar el manifiesto del nodo por sha256. Un cambio de manifiesto = NO_DATA con causa + FIRMO.
- RECHAZAMOS: anclas blandas, verificación sin valla, confianza por defecto.
- Rieles nativos: node_signature_verify.js, node_signature_messages.js, node_trust_anchor.js, node_trust_manifest.js.
- Vara: ancla no nula; 1 nodo firmado verificado en verde; sabotaje (firma ajena) en rojo.
- Riesgo: fijar una llave equivocada cierra la colonia. La cura es FIRMO con reversión declarada. NO_DATA: la ceremonia de rotación exige manos del Soberano.

## P2 · LA ROTACIÓN DE LA LLAVE CON CANAL SEPARADO — crítica
- Base medida: el latido del rack falla con HTTP 401 desde el 11-06 (256 fallos medidos). El worker rechaza la llave vieja. Los nodos reales muestran STALE/NO_DATA. El mapa miente sobre la vida.
- Patrón (OpenRig fix #2850 + MCP): la credencial jamás vive en el entorno del servidor; la autorización viaja por un canal separado de los datos.
- ADAPTAMOS: protocolo de rotación bilateral: el secreto vive SOLO en el almacén del worker y en el fichero local del rack. Nunca en el repo, nunca en el chat, nunca en la página. Un comando de rotación con recibo. Tras la rotación, el latido vuelve a 200 y el nodo a LIVE.
- RECHAZAMOS: secretos en texto, canales mixtos, rotación sin recibo.
- Rieles nativos: el emisor F1 del latido, la aduana D1, el contrato preceptoros.latido/1 (idempotente), G2 del índice.
- Vara: latido 200 dos veces seguidas; 0 errores 401 en el registro; sello LIVE en el estado del mapa.
- Riesgo: una rotación mal hecha mata la litera otra vez. Se declara E-STOP y la vía de reversión ANTES de girar. PARA SOBERANO: sus manos en ambos lados.

## P3 · EL CORO DE LA COLONIA — crítica para el norte del juego
- Base medida: los bots existen (chat, ruta, combate) pero su conducta es código, no dato. El norte pide AIs que se muevan por el mapa y duelen con ondas. Hoy cada conducta nueva exige código nuevo.
- Patrón (OpenRig): máquinas de estado declarativas sobre nodos aislados.
- ADAPTAMOS: cada bot lleva una máquina de estado en JSON <1.024 B (estados, transiciones, semilla). La transición deja un frame <1.024 B. El juez reproduce la máquina y los frames deben casar byte a byte, dos corridas iguales.
- RECHAZAMOS: tmux, demonios, procesos externos, azar sin semilla. Un bot = un fichero = un caso en el gate.
- Rieles nativos: agent_states.json, walk_route.js, wave_rules.js, combat_ticks.js, state_frames.js, battle_choreography.js.
- Vara: 2 bots reproducidos 2 veces con huella igual; 0 transiciones sin declarar.
- Riesgo: máquinas malformadas. La valla es el validador puro + el caso de sabotaje.

## P4 · EL ALBERGUE PROPIO — valiosa y estratégica (PARA SOBERANO)
- Base medida: la web vive en Workers + D1 + wrangler.jsonc. celld ejecuta ESE MISMO stack en máquinas propias (V8 embebido + SQLite por celda + escritura condicional de propiedad + HTTP firmado entre pares; sin servicio de consenso; en Rust).
- ADAPTAMOS: un ejercicio de soberanía (drill), no una mudanza: la MISMA wrangler.jsonc sirve un hex del estado desde una celda del rack. La respuesta debe ser byte igual a producción. El registro de propiedad de celld alimenta P5. El Rust de celld casa con el decreto Rust vigente.
- RECHAZAMOS (v1): dependencia de bucket externo para el estado (se declara NO_DATA hasta medir un almacén local); demonios nuevos sin FIRMO; mudanza del LIVE (la web es la única realidad y LIVE==main sigue siendo lo servido).
- Rieles nativos: wrangler.jsonc, worker/, acho_ledger.wasm (el Rust ya entra), holdings_wasm.js.
- Vara: 1 hex servido desde la celda; 0 forks de código; respuesta byte-igual.
- Riesgo: alcance desbocado. Se decreta ejercicio declarado, con duración y recibo. PARA SOBERANO: un segundo destino de despliegue toca la doctrina LIVE==main. Solo su decreto lo abre.

## P5 · EL LEASE DE LA CELDA — valiosa
- Base medida: «un dueño por celda» es doctrina, pero ninguna valla lo exige en las escrituras del estado.
- Patrón (CellD): la escritura condicional da la propiedad. Exactamente un dueño por celda. Sin consenso.
- ADAPTAMOS: toda escritura al mapa lleva dueño, id de lease y vencimiento. El worker rechaza escrituras con lease vencido o ajeno. El latido renueva el lease. Vencido = STALE con causa.
- RECHAZAMOS: subastas, colas de consenso, escritura doble silenciosa.
- Rieles nativos: estado v2 (alive/seal/since), la boya del tick (K2), el worker de 16 KiB, D1.
- Vara: sabotaje con dos escritores y una celda: 1 gana, 1 rechazado con causa. 0 escrituras dobles.
- Riesgo: relojes. El vencimiento se declara en segundos y se mide en el juez, no se asume.

## P6 · EL MÉDICO DE LA LITERA — valiosa
- Base medida: la deriva producción-detras-del-canon se midió varias veces (fc vs fq, y otras). El redeploy ritual quedó pendiente en actas repetidas.
- Patrón (JobPilot): bucle de autocura: el diagnóstico del runtime escribe un parche nombrado en el espacio de trabajo git.
- ADAPTAMOS: el doctor corre tras cada FIRMO. Mide: sello LIVE == sello main (lectura directa de sw.js), estado del CI, cuenta de 401. Si la deriva es >0, escribe un recibo <1.024 B con el comando de despliegue exacto, pegable. El doctor JAMÁS despliega (la doctrina manual-only queda intacta).
- RECHAZAMOS: auto-merge, auto-deploy, credenciales dentro del doctor.
- Rieles nativos: deploy_guard, el juez de acciones, counters.json, tower_floors.json (un piso por sello medido: el mismo patrón de libro de datos).
- Vara: deriva 0 dentro de un ciclo FIRMO; recibo del doctor <1.024 B; 0 despliegues automáticos.
- Riesgo: falsas alarmas. El doctor declara causa medible en cada recibo.

## P7 · LA VALLA DE LO NO CONFIADO — crítica
- Base medida: la web alimenta texto de modelos (el mini, y Hexelion bajo firma) a los paneles. El texto del visitante llega a los modelos por el chat y el insertor.
- Patrón (MCP security): distinguir la SALIDA NO CONFIADA de la INSTRUCCIÓN CONFIADA. Un servidor comprometido devuelve contenido con instrucciones que manipulan a la IA.
- ADAPTAMOS: el sello de procedencia. Todo texto que nace de un modelo o de un visitante llega MARCADO como dato. Ninguna cadena de esos canales llama rutas, escribe estado ni cambia autoridad de UI. Casos hostiles en el gate (el patrón prompt-shield de la mina Gentle).
- RECHAZAMOS: eval de salida de modelo como si fuera código; canales sin marca; excepciones sin FIRMO.
- Rieles nativos: chunk_router.js, building_chat.js, web_node_brain.js, el insertor, values.js (la tabla semántica ya marca SIMULATED/NO_DATA: mismo oficio).
- Vara: N cargas hostiles -> 0 acciones; casos en rojo bajo sabotaje; 0 falso positivo en main.
- Riesgo: sobre-bloqueo. Cada rechazo declara causa y queda en el recibo.

## P8 · EL LEAK-GUARD DEL SCRUB — valiosa
- Base medida: el SCRUB hoy es deber manual de la Mesa. Se midió al menos un agujero de SCRUB cazado tarde (fila M16, corregido).
- Patrón (OpenRig ARCHITECTURE.md): reglas leak-guard leídas de un fichero local opcional.
- ADAPTAMOS: un paso del gate escanea SOLO el diff contra un fichero local de reglas (rutas privadas, nombres de aparatos, IPs de malla, palabras vetadas). Falla en rojo con la CUENTA de hallazgos, nunca con el contenido. El fichero de reglas públicas se declara; el local queda fuera del repo.
- RECHAZAMOS: escanear el árbol entero (lento y ruidoso); imprimir el secreto cazado.
- Rieles nativos: gate.yml, el juez del atlas, los guardianes retired_names_cases y face_retirement_cases (el mismo oficio de valla).
- Vara: secreto sembrado en rama de prueba -> rojo; 0 falsos positivos en main.
- Riesgo: el fichero de reglas filtra lo que prohíbe. Se usan clases de patrón, no literales.

## P9 · EL COMPACTADOR DEL TECHO — crítica para la voz del cerebro
- Base medida: el libro de citas quema el presupuesto del modelo (techo 160/512 medido) y trunca el JSON; station_extract_not_verified ocurrió por tres bloqueos medidos (techo, valla, duplicado).
- Patrón (Gentle: pi-auto-compaction; gentle-dot siembra sesión fresca con resumen, medido en rotation.ts/supervisor.ts): compactar ANTES de pedir, no subir el techo.
- ADAPTAMOS: compacción determinista de las FUENTES antes de la pregunta: resumen <1.024 B por fuente, cacheado por sha256 de la fuente; el modelo verifica dentro del presupuesto. Citas byte-exactas intactas; fail-closed intacto.
- RECHAZAMOS: subir el techo por defecto; resúmenes inventados (la compacción cita, no parafrasea); citas sin hash.
- Rieles nativos: el libro de citas (verificar_citas), el proxy (think low, techo 512), construir_prompt (ya valida sha256 por fuente).
- Vara: tasa de extract_not_verified a la baja con línea base medida; tokens por cita verificada a la baja; 0 cita sin hash.
- Riesgo: resumen pierde la cita exacta. La compacción conserva el fragmento citable byte-exacto.

## Orden sugerido (la Mesa propone; el Soberano decreta)
1. P2 (el mapa miente hoy) -> 2. P1 (la confianza sin ancla) -> 3. P7 (la valla antes de más voz) -> 4. P9 (la voz del cerebro) -> 5. P6 -> 6. P3 -> 7. P8 -> 8. P5 -> 9. P4 (con decreto aparte).
P2 y P4 piden decisión del Soberano. El resto espera FIRMO por cabeza exacta, una pieza por PR.

Trailer: Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA