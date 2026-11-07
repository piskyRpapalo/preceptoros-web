# Detalles del mapa · canon consolidado (2026-11-07)

> La Mesa destila aquí los detalles del mapa que vivían dispersos en las anclas históricas del ecosistema y en los decretos de esta semana. Documento de canon y estado: cada mecánica se marca como implementada, propuesta o NO_DATA antes de diseñarse como interacción. Propose-only.

## 1 · Dónde vive el mapa

Resolución del Soberano (2026-11-07, cierra la bifurcación abierta por el decreto de LA PIEZA):

- El mapa vive SOLO en la web. La pieza instalable no empaqueta el mapa.
- Si la app usa el killswitch: no hay cuenta efímera y no hay openworld. Offline = NO_DATA con causa, nunca emulación.
- Re-confirma la base del lore del sistema (2026-11-01): la web es el mundo y sostiene la estructura completa sin necesidad de nodos; la app es el laboratorio; la cuenta efímera vive solo en la web; la app no duplica mundos.

Consecuencia de diseño: el openworld no necesita modo offline empaquetado. La visita efímera, los edificios habitados y la colonia son actividad de red declarada; la app los muestra o declara su ausencia.

## 2 · La ley del suelo (FIRMO 2026-10-12 · decreto APLANADO 2026-11-07)

Los 3 pasos de la ley:

1. La celda se pinta como rombo 2:1 (hexágono aplanado).
2. El mapa proyecta y el dedo lo sigue: el mapa es la verdad, el dedo declara.
3. Orden de pintor por profundidad: lo lejano se pinta primero.

Decreto APLANADO: todos los hexágonos se pintan como SUELO plano; la altura es solo de los edificios. El suelo es transitable; la colisión es contra edificios y contra otros personajes.

Rebanadas:

- S1 · Suelo plano por TABLA_SEMANTICA. Implementado y medido.
- S2 · Edificios con volumen y clave de léxico por tipo. Propuesta.
- S3 · Contrato preceptoros.suelo/1 (tipo: suelo o edificio; transitable) fail-closed. Propuesta.
- S4 · JN-3 (cuenta y mapa conectados) + colisión personaje-personaje determinista (misma celda prohibida). Propuesta; JN-2 (par Ed25519 de la cuenta efímera) sí medido.

## 3 · El cromo del mapa (decreto ANEXO 2026-11-07 · decreto del segundo joystick)

Medido a 420×437 en la versión de trabajo:

- Sobre el mapa solo queda 1 joystick: el de la izquierda (pan). El segundo, a la derecha, está reservado al personaje efímero y nace cuando este exista.
- La barra de botones desaparece.
- La cabecera muestra el nombre del lugar generado desde las coordenadas (Nombre · q, r), declarado como generado. Muestra de 289 trozos: 6 nombres repetidos.
- Abajo, iconos interactivos ◇ ♙ ◉ con el estilo plano y delineado de la terminal.

DECRETO del Soberano (2026-11-07 noche, cierra la discrepancia): en la web viven 2 joysticks en lados opuestos. El de la izquierda mueve el mapa (pan). El de la derecha pertenece AL PERSONAJE efímero: hoy el personaje no existe, así que hoy vive solo 1 joystick, el de la izquierda; cuando el personaje exista, su joystick nace a la derecha. Giro y zoom no son el rol del segundo joystick: la versión medida que le asignaba giro y zoom queda corregida por este decreto.

## 4 · El canon del nodo como detalle del mapa

El nodo es un terreno, con soldados, edificios y caravanas de comercio, cada uno con sus políticas (desciende del manifiesto del mapa federado). El territorio muestra sus reglas antes de entrar: entrar como cangrejo; elegir territorio no da ventaja.

Políticas del terreno (las elige su dueño; legibles, versionadas y firmadas):

- Pacífico: defensa automática.
- Hostil: permite invasiones.
- Cooperativo: acepta ayuda externa.
- Cerrado: no expone interior.
- Abierto: publica presión territorial.

Caravanas: rutas entre nodos con estados explícitos: propuesto, activa, interceptada, completada, huida, caducada. El evento público no revela identidad ni datos privados. Los agentes proponen rutas, peajes, escoltas o cambios; la validación es determinista; lo irreversible requiere firma humana.

Edificios: puestos con rol y capacidad declarados (un edificio por hexágono; el central es el nodo principal). La interfaz ofrece puerta a su actividad solo si esa capacidad existe; si no, NO_DATA con causa. El edificio da contexto y estilo; no decide por el motor.

## 5 · La colonia y los benchmarks

La colonia viva: varias AIs habitan edificios y se enfrentan a NPCs o entre sí. Los benchmarks son el deporte de la colonia, en SIETE FAMILIAS: soberana · epistémica · termodinámica · adversarial · creativa · política · utilitarista.

Un resultado lleva condiciones, fuente, edad y recibo. Un gate verde no es una puntuación de seguridad ni una prueba de buen comportamiento.

Estado: colonia sellada sin productor (el estado del mundo con colonia sellada y el worker con colonia vacía); la cadena latido, aduana, worker y world_feed está viva con el primer ancla LIVE. Invasiones, comercio, combate entre IAs y benchmarks de colonia: NO_DATA hasta medirlos.

## 6 · Reglas de coherencia para cada pantalla del mapa

- Separar siempre hecho medido, propuesta, emulado y NO_DATA.
- Mostrar fuente y frescura cuando aplique.
- El resultado de un combate o invocación sale del motor medido, incluidos victoria, abandono o ausencia de datos. Nunca inventar desenlaces.
- Canon no es implementación: donde falte motor, interfaz o medición, NO_DATA con causa.
- Al entrar queda claro si la persona visita o gobierna el nodo.

## 7 · Estado medido hoy (2026-11-07)

- Tutorial: dentro del mapa. Medido.
- Carga diferida por chunk: dentro del mapa; se activa con el primer envío del chat. Medido.
- Radio: FUERA del mapa; los módulos de radio viven fuera de /openworld/. Acción propuesta: re-montar el radio en /openworld/ reutilizando lo existente, con sello de estado.
- Retiro de la cabaña del tutorial (colonia vacía, sin nombres internos): PR #695 abierto, sin fundir; un test aún busca el nodo retirado y debe curarse antes de la firma.
- Cromo del mapa (joystick del mapa a la izquierda, nombre del lugar, iconos de terminal): hecho y medido, sin commit y sin PR; el joystick del personaje espera a que el personaje exista.

## 8 · La mesa: cómo se construye este canon

Decreto del Soberano (2026-11-07 noche): quien construye el mapa va a esta mesa antes de cada turno.

- Lee el canon y el estado medido de este documento.
- Elige UNA misión del mapa de misiones (sección 9) y la PROPONE al Soberano: qué, por qué ahora, y cómo se va a medir. Sin ejecutar antes de la propuesta.
- No hay cola fija: la prioridad se decreta turno a turno.
- Propose-only: FIRMO sigue siendo del Soberano. SCRUB en todo artefacto público.
- ENTREGA EN MAIN, LIVE: la entrega no termina en el PR. La pieza en la que se trabajó debe quedar en main y verse live: 1 mapa, 1 lengua (Acho), 1 app (el mini-html que el Soberano ve live) y 1 web (preceptores.org, servida por Cloudflare y respaldada en GitHub). Si el FIRMO o el despliegue no son suyos, deja la cadena exacta para que el Soberano firme; tras el FIRMO mide y declara que está live. Una pieza fuera de main, o que no se ve live, no está entregada.
- GRÁFICO DESDE ACHO (decreto del Soberano 2026-11-07 noche): TODO gráfico del mapa y de la pieza se hace desde Acho (la casa acho/1: las burbujas que DECLARAN; el pintor pinta las primitivas del compilador). Cero assets, cero red. El suelo floor/1 y las burbujas acho/1 obedecen la misma ley (state_frames) y el mismo color (tabla_semantica). Todo elemento gráfico declara su sonido y su coordenada: lo que aún no suena es NO_DATA sonoro con causa, no un hueco oculto.
- LECTURA PROBADA POR EL JUEZ MINI (decreto del Soberano 2026-11-07 noche): todo gráfico se entrega con su lectura probada por el mini-modelo local LoRA (su único propósito: traducir Acho), que actúa como revisor juez nativo. El preceptor auto-revisa: los ojos del mini-modelo leen el Acho y traducen lo que ven; esa lectura se compara con lo que el preceptor construyó. Si la lectura y la construcción no coinciden, la pieza no está entregada.
- NATIVO PRIMERO (decreto del Soberano 2026-11-07 noche): todo lo que se pueda se hace nativo. Si una función actual puede optimizar o abrir el paso a una función antigua escrita en el sistema, el preceptor que la encuentre como referencia puede traerla como PROPUESTA bajo la arquitectura ground truth: para optimizar, para rellenar un NO_DATA, o para abrir una puerta nueva de automatización de Hexelion y su control del ecosistema. La referencia se trae medida (fichero, línea, contrato); jamás se copia sin declarar.
- Lo único que no espera turno: un test rojo medido es urgencia técnica; se cura y se declara antes de proponer lo siguiente (caso abierto hoy: un test busca el nodo retirado del tutorial en #695).

## 9 · El mapa de misiones (donde elegir)

Catálogo gigante y vivo, cosechado de la biblioteca de la casa (2026-11-07 noche). Cada constructor propone UNA misión por turno y puede proponer misiones nuevas: este mapa se alimenta. Regla del catálogo: solo lo medido se afirma; todo NO_DATA lleva su causa; nada de esto es compromiso de orden; el catálogo se re-mide tras cada FIRMO. Los nombres de las misiones están en inglés con vocabulario ASD-STE100 (decreto del Soberano): una palabra, un significado; frases cortas.

### A · Soberanía de Hexelion y LoRA

- A1 · Connect the user brain: guía de cerebro remoto y llave propia en Ajustes; alguien ajeno conecta su cerebro sin ayuda; credenciales jamás dentro de la app descargable. Estado: propuesta (decreto de la casa). NO_DATA: flujo medido, causa: sin implementar.
- A2 · Make the house LoRA: entrenado con las preguntas medidas de la fábrica; el juez es semideterminista con salida tipada (elección, score, noul, probs, NO_DATA con causa), gramática restringida. Estado: propuesta. NO_DATA: pares de entreno medidos, causa: la fábrica aún no los produce.
- A3 · Let Hexelion write receipts: recibos <1.024 B, SCRUB, append-only, jamás FIRMO. Estado: propuesta (decreto). NO_DATA: primer recibo suyo, causa: escritura sin habilitar.
- A4 · Add voice to the app: canon de audio medido (ADSR, FM de tres senos, receta de tono por color 220 a 880 Hz, vibrato 3 Hz con 5 Hz de desvío) con 3 arreglos ya diagnosticados: FM sin conectar, pulso sin sincronizar al audio, lector del grosor del pulso ausente. Estado: canon medido. NO_DATA: voz en la app, causa: los 3 arreglos sin portar.
- A5 · Make memory that stays: una sola conversación continua con memoria y rotación por resumen; la memoria salva a su propio proyecto. Estado: propuesta (patrón de referencia MIT). NO_DATA: medida propia, causa: sin adoptar.
- A6 · Make the local mini orchestrator: agente local en el estilo de la casa alimentando a Hexelion en continuo. Estado: propuesta. NO_DATA: medida, causa: sin construir.
- A7 · Add the GitHub reader (read only): ya medido y aprobado: GET público sin credenciales, allowlist, NO_DATA con huella, suite de tests verde. Estado: medido PASS, esperando aterrizar en la pieza. NO_DATA: integración, causa: sin FIRMO.
- A8 · Wake the brain by message: puerta de despertar al cerebro desde la app; protocolo y juez. Estado: propuesta. NO_DATA: socket medido, causa: diseño sin firmar.
- A9 · Make the Acho LoRA: el mini-modelo local cuyo único propósito es traducir Acho; revisor juez nativo de todo gráfico (lee el Acho, traduce lo que ve, su lectura se compara con lo construido). Estado: decreto del Soberano (2026-11-07 noche). NO_DATA: entreno del mini, causa: sin pares medidos de lectura.

### B · El Lab · la fábrica de tests

- B1 · Make the factory record (LAB-1): un registro único alimenta Mando, Lab y cabecero: una fuente de verdad, muchas vistas. Estado: propuesta.
- B2 · Make the Lab face (LAB-2). Estado: propuesta.
- B3 · Link harness and app (LAB-3). Estado: propuesta.
- B4 · Close the test loop (LAB-4): el agente escribe. Estado: propuesta.
- B5 · Show agent telemetry: solo medido (encendido y apagado), reporte de estado de 100 caracteres y enlaces entre paneles. Estado: propuesta.
- B6 · Add the governance grafts: beacon-row (un faro rojo auto-redacta UNA fila de comisión <1.024 B con huella, propose-only siempre), family-blind gate (quien escribió jamás sondea su propia familia; juez de familia distinta o ROJO por regla), delta-ranked-tray (el delta ordena, no decide; NO_DATA conserva su lugar). Estado: propuesta.
- B7 · Open the study rooms: conversación a tres con juez de familia distinta, consentimiento por sesión con hash revocable, reglas NO_DATA con causa obligatoria, divulgación de IA al inicio. Estado: propuesta.
- B8 · Make the self-review loop: el arnés que corre al juez mini (A9) sobre cada gráfico nuevo: Acho ops, lectura del mini, diff contra lo construido, veredicto o NO_DATA con causa. Estado: propuesta (depende de A9).

### C · El suelo y los hexágonos

- C1 · Give volume to the buildings (S2): edificios con volumen y clave de léxico por tipo. Estado: propuesta.
- C2 · Make the soil contract (S3): preceptoros.suelo/1 fail-closed. Estado: propuesta.
- C3 · Join account and map (S4): JN-3 y colisión personaje-personaje determinista (misma celda prohibida). Estado: propuesta.
- C4 · Make hexagons by click: un click en el mapa OpenWorld hace nacer un hexágono pintado por TABLA_SEMANTICA; proyección medida x=48·q, y=12·q+24·r; el trozo se declara como marco de suelo <1.024 B, determinista. Estado: propuesta (decreto del Soberano).
- C5 · Link hexagons to sources: el hexágono del dato conecta con su fuente; el juez cita o calla con NO_DATA. Estado: propuesta.
- C6 · Add radio to the open world: radio del estado a 220 Hz; doctrina de radio sin red: TTS local o NO_DATA sonoro con causa, jamás silencio falso. Estado: propuesta.
- C7 · Make the building interiors: auditoría de elevación medida antes de construir (qué pieza ya vive y dónde), luego interiores con la vara del ojo de juez. Estado: propuesta.
- C8 · Make three projections of one state (ley D4): nada se renderiza salvo con 3 proyecciones deterministas del MISMO estado: visual, matemática (<1.024 B) y radio. La pantalla y el audio nunca se contradicen. Estado: propuesta del corpus, pendiente de FIRMO.
- C9 · Port the F2 scenes: espectro a criatura, Lissajous por armónico, gusanos de transición, batímetro y hueco honesto (columna que nunca toca fondo), hierba viento y agua sobre niebla, eco de procedencia (emulado; NO_DATA corta el borde). Estado: canon medido. NO_DATA: en la web, causa: no portadas.

### D · El visitante y el personaje

- D1 · Make the ephemeral visitor: identidad en 2 pasos (clave local Ed25519, seudónimo = hash de la pública, sin correo ni teléfono ni huella; puerta de viaje firmada por el nodo); fases efímera (solo memoria, muere con la pestaña), puente y errante. El cangrejo visual y el paseante NO son cuenta: sus pruebas prohíben almacenamiento. Estado: canon medido (identidad opcional persiste en IndexedDB). NO_DATA: ciclo del visitante en navegador, causa: plano sin firmar.
- D2 · Add the second joystick: nace con el personaje (decreto 2026-11-07); ley de accesibilidad: coordenada y sonido, 44 px, teclado alcanza todo; movimiento por clic con reporte de audio por coordenada (la interacción por clic ES accesibilidad). Estado: decreto. NO_DATA: personaje, causa: cuenta sin firmar.
- D3 · Add chat to the buildings (U1): responde desde el léxico de la casa, hecho medido o NO_DATA con causa, jamás prosa inventada; el visitante planta su chatbot en un edificio. Estado: canon (la puerta del edificio ya existe con cadena de confianza). NO_DATA: lector vivo, causa: puente sin firmar.
- D4 · Make the honest gacha: costes visibles y odds exactas por clase (Arrecife 50 de cobre, Ruinas 200 y 100, Bosque 600 y 300, Abismo 1500 y 500), crónica sellada por invocación, semilla determinista sfc32, piedad NO_DATA sin firma. Estado: medido en el metal (gacha.js, db.js, adopción y tropa con firma Ed25519 verificada). NO_DATA: gacha de la visita con semilla propia, causa: cuenta efímera sin firmar.
- D5 · Make the duel without two nodes (JN-4): combatientes = tropas del visitante contra NPC o lugar del mapa, semilla = lugar + semilla de la visita; commitment SHA-256, ABANDON 900; balance NO_DATA hasta medirse. Estado: canon medido (duelo puro en el metal, esquema de combate sin DOM ni red ni reloj ni azar). NO_DATA: cara de ondas, causa: puerto sin FIRMO.
- D6 · Make the wave combat (carta [W]): una sola cara de combate en el juego; el modo actual se retira en la MISMA PR que trae el de ondas; tropa = espectro <200 B; el ataque ES la criatura viajando por camino ondulado; 27 de 30 olas clasificadas (una muerta por decreto, dos esperan decisión territorial). Estado: canon medido y capturado de referencia. NO_DATA: O1 a O3 (duelo visual, audio FM, pulso sincronizado), causa: FIRMO del plano pendiente.
- D7 · Make the conquest honest (JN-5): lugar luchado queda despejado (la niebla ya se limpia en radio 200 tras la lucha); conquista = registro fechado de sesión, sin identidad; campamentos NPC y guerra entre nodos DUERMEN hasta firma propia. Estado: niebla medido. NO_DATA: conquista, causa: sin firmar.
- D8 · Put the schema buildings on the map: botella, monumento, guardería (nursery) y baliza (beacon): lógica medida en el metal, sin colocación en el mapa. Estado: medido (lógica). NO_DATA: colocación, causa: sin colocar.
- D9 · Add summons and controls: santuario = 1 edificio inconquistable, 1 onda, techo 1.024 B, acuñar = FIRMA aparte. Estado: canon. NO_DATA: acuñación, causa: tier sin acuñar.
- D10 · Make audio mode (Preceptor report): uso sin mirar la pantalla; el comando responde con opciones contextuales de la pantalla actual; TTS local sin red; la entrada de voz en Android suele viajar a la nube del proveedor: declarar qué oye el micrófono y adónde va. Estado: propuesta con cimiento hecho (fase 1 fusionada). NO_DATA: modo completo, causa: sin plan FIRMO.
- D11 · Keep the crab honest: forma y paseo calculados del espectro; Math.random prohibido (xorshift32); cada golpe desafina una onda. Estado: medido.
- D12 · Keep the ephemeral tutorial: entrar como cangrejo, el territorio muestra sus reglas antes de entrar; tutorial dentro del mapa, medido; la cabaña se retira (PR #695). Estado: medido.

### E · La colonia

- E1 · Open the state producer: puente de la aduana al estado del mapa, escritura firmada; aduana viva (contrato v2, D1 medido), latido <1.024 B por nodo, receptor cada 240 s. Estado: cadena medida con primer ancla LIVE. NO_DATA: colonia des-sellada, causa: emisor sin desplegar y tramo sin firmar.
- E2 · Make the caravans: estados explícitos (propuesto, activa, interceptada, completada, huida, caducada); el evento público jamás revela identidad. Estado: canon. NO_DATA, causa: sin motor.
- E3 · Make the seven benchmark families: tríada telemetría, medida y recibo (máquina, fecha, huella); plantilla de estudio con vector de tendencia, modelos base, corpus, adaptador y matriz de hardware; solo pesos abiertos en local, jamás servicios de terceros en vivo. Estado: canon. NO_DATA: en vivo, causa: sin productor.
- E4 · Put AIs in the buildings: meta visual de colonia isométrica sobre rejilla hexagonal (módulos por color, domos y torres, bots como ciudadanos de primera clase); la referencia externa se cita, NO se copia su motor; la PRIMERA medida de fps corre en el dispositivo más débil. Estado: propuesta. NO_DATA: colisión, causa: por medir.
- E5 · Climb the isometric ladder: IC1 a IC5 fusionadas (incluida paleta día y noche); IC6 en obra con la referencia descargada; IC7 tutorial, IC8 verificación visual, IC9 gemelo en la app. Estado: medido hasta IC5. NO_DATA: IC6 en adelante, causa: en obra.
- E6 · Keep the wave army block: bloque visible del mapa (4 ondas sintéticas, malla 7×5, tabla de tier, celda, bordes y armónicos); cada mundo aporta su dibujo al mapa global. Estado: medido.
- E7 · Open the valve (fase 4): adaptadores propios en sandboxes sin E/S; estudios raw contra estudios bajo harness; el producto se mide a sí mismo y publica lo que pierde. Estado: propuesta.

### F · La pieza

- F1 · Make the two-click package: patrón de 4 paquetes (daemon, protocolo, ui, escritorio); la seguridad vive FUERA del agente: grant de sesión, parada de pánico, blocklist, aprobaciones nativas; iconos desde el emblema. Estado: propuesta (patrón MIT medido).
- F2 · Translate the trunk to four targets: Android, Ubuntu, Windows e iPhone 8; test del hardware ajeno: la pieza abre sin cerebro, sin proxy y sin la web; ausencias NO_DATA con causa. Estado: propuesta.
- F3 · Cure the small viewport: 10 paneles de 44 px no caben en la pantalla del teléfono. Estado: medido. NO_DATA: cura, causa: pendiente.
- F4 · Make the panel interiors: plan documento con PR y recibo. Estado: propuesta.
- F5 · Shield the telemetry: cero peticiones no declaradas; auditoría de runtime (buscar palabras no es prueba de presencia ni de ausencia: se mide la red al ejecutar). Estado: propuesta.
- F6 · Make live device benchmarks: con sello de procedencia nativo. Estado: propuesta.
- F7 · Make full accessibility: EN 301 549, 44 px táctiles, reduced-motion, 8 lenguas, color y texto jamás solo color, texto a la izquierda, «undefined» jamás llega al usuario (NO_DATA con causa), lector de pantalla lee el espectro, no los píxeles. Estado: doctrina medido. NO_DATA: plan completo, causa: pendiente de dar la app por buena.
- F8 · Put the Acho law in the fonts: escala determinista compartida; tipografía como senos. Estado: canon. NO_DATA, causa: sin portar.
- F9 · Make the Rosetta twin: la misma interfaz en navegador y escritorio; one state, many renders (el mapa isométrico es SOLO otro render del vector); mismo vector, mismo bitmap byte-idéntico (n=2). Estado: canon; 4 vectores validados por el juez real (4/4).
- F10 · Keep approval by exact hash: el review se agrupa, la aprobación NO; cada pieza lleva su línea HITL con hash y fecha; los batches caducan; todo cambio de valor lleva su propio HITL. Estado: ley de la casa, ya en obra en los gates.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
