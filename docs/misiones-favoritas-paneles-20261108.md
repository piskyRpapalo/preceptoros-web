# Misiones nuevas y cierres · paneles del visitante y favoritos de Claude (2026-11-08)

> Propuesta de la Mesa para el mapa de misiones (seccion 9 del canon del mapa, docs/canon-map-details-20261107.md). Nada aqui se ejecuta sin FIRMO. La proxima revision del canon absorbe los cierres y las misiones nuevas. Documento propose-only: no toca codigo.

## 1 · Cierres propuestos (medidos el 7-8 de noviembre)

- G7 (prune the merged branches): HECHA. El Soberano ejecuto el barrido con la guardia en verde en los cuatro repos de la casa: web 41 a 39 ramas, app 50 a 15, tablero menos 6, flota limpia. Recibo servido.
- D2 (cara de hoy): cumplida en web#697. La web sirve un solo joystick (izquierdo, el mapa). El hueco derecho declara NO_DATA con causa (el personaje no ha nacido). El tramo del personaje queda abierto dentro de la familia.
- E2 (contrato de caravanas): contrato en main (web#700: estados, firma, evento publico propose-only). Motor de caravanas: NO_DATA, sin causa medida.
- F4 (interiores de los paneles): HECHA en la app. El plan se entrego y fusiono (app#214) y los interiores de los nueve paneles aterrizaron en cadena (app#213 a #223).
- H3 (re-medir el canon tras cada FIRMO): primera pasada fusionada. Queda como rutina: tras cada FIRMO, el sello y el canon se re-miden.

## 2 · Ley del preceptor (recordatorio del contrato)

El preceptor hace la pieza primero y pide la firma al terminar. Pedir la firma antes de construir crea cuellos de botella (medido el 7-nov). Excepcion: las piezas que solo piden decision de diseno (planos, mapas, contratos) se sirven como propuesta y esas si esperan firma. Un plano aprobado no es una pieza construida.

## 3 · Paneles del visitante (familia D, nuevas)

Los tres paneles que hoy despliegan botones con enlaces rotos y prosa acumulada se reconstruyen por dentro, en paralelo a la cuenta efimera. Todo grafico desde Acho (state_frames + tabla_semantica): cero assets, cero red. Todo elemento declara su sonido y su coordenada. 44 px, teclado alcanza todo, reduced-motion.

- D13 · Rebuild the three panels: reconstruccion interna de los tres paneles (welcome, profile, comms). Se mide: cero enlaces rotos, cero letra innecesaria, cada boton lleva a una pieza viva o declara NO_DATA con causa.
- D14 · Make the welcome panel: el visitante entra y ve el aviso (triangulo con exclamacion, color acompañado, jamas solo color). Lista desplegable con iconos: como minimo "Brain download", que activa la IA local ya dormida en chunks (activar smollm2-135m, carga perezosa, fail-closed). Muestra los edificios cercanos (world_feed) e invita a probar los chatbots o preguntar al preceptor. Explica que son los npcs y donde luchar; explica como capturar un edificio y lleva a uno disponible en la niebla.
- D15 · Make the profile panel the player home: la casa del jugador. Las summons como regalo de una mascota que evoluciona contigo: pura matematica canon que evoluciona con los recursos de los combates y los edificios bajo tu poder (reusa D4, D9, D11).
- D16 · Split the comms into radio, chat and echoes: tres botones separados. Radio: modo completo para personas invidentes (TTS local; si no existe, NO_DATA sonoro con causa). Chat: abajo, los 3 ultimos mensajes en letra pequena; al hacer clic el panel crece (44 px). Echoes: eventos y estado de la app y la web (panel honesto con NO_DATA, latido, estado del openworld).
- D17 · Keep the fog stocked: la niebla siempre ofrece edificios preparados al visitante que entra. Invariante: minimo N edificios disponibles por visitante; el stock se rellena en segundo plano. Sabotaje: quitar el stock = ROJO.

## 4 · Boundary y benchmarks (criterio de cierre)

Extension de H1, H2 y E3: el boundary del nodo declara la lista cerrada y tipada de lo que un nodo puede cambiar (postura, politicas de frontera, visitantes, color por tabla_semantica). La pieza no se cierra hasta el primer benchmark de nodos medido con recibo. El bench reusa los read models ya fusionados (hit-rate app#219, age per loop app#220) y sirve a los benchmarks historicos y futuros. Cerrar sin la primera medida queda prohibido.

## 5 · Familia I · Los favoritos de Claude (decreto del Soberano, 7-8 nov)

Cuatro misiones elegidas por impacto, apuntadas para que cualquier preceptor con tiempo las tome. Cada una se sirve como las demas: UNA por turno, pieza primero, firma despues.

### I1 · Give each agent its own voice with Hexelion

Codex y Claude hablan con Hexelion en la ventana del chat, cada uno con su propia voz, jamas con la del Soberano.

Rieles ya medidos: la cadena app a /api/hexelion/chat, proxy, tunel, estacion (verde, think low, 512 num_predict); la puerta customs verificar_entrada (cuenta, firma, signers); el equipo con cara (app#218, agentes dibujados en Acho); los read models (app#219, app#220); el decreto: Hexelion escribe como un preceptor mas (recibos, SCRUB, append-only, FIRMO jamas).

Roadmap: (1) contrato de voz por agente: cedula Ed25519 propia, postura propia, system prompt propio, jamas el del Soberano; (2) el remitente viaja firmado: verificar_entrada con signers, la ventana muestra quien habla; (3) cada agente conserva su cara Acho en el chat; (4) sabotaje: un agente que hable con la voz del Soberano = ROJO. Se mide: cada voz con su recibo; identidad jamas compartida.

### I2 · Make the buildings interactive (web)

Rieles ya medidos: building_chat.js (la puerta del edificio con cadena de confianza, classroom_chat); D3 (el visitante planta su chatbot); D8 (botella, monumento, guarderia, baliza: logica medida, colocacion NO_DATA); C7 (auditoria de elevacion antes de construir); E4 (bots ciudadanos, primera medida de fps en el dispositivo mas debil); D17 (niebla con stock).

Roadmap: (1) colocacion de los cuatro del esquema; (2) interiores con auditoria de elevacion; (3) lector vivo del chat del edificio (puente firmado); (4) bots como ciudadanos; (5) stock de niebla garantizado. Se mide: edificio interactivo = chat vivo con citas o NO_DATA con causa; jamas prosa inventada.

### I3 · Align the web icons with the app

Lo nuevo manda y lo viejo se adapta. Rieles ya medidos: acho_icons.js ya vive en la web (5.104 B, hoy dormido); tabla_semantica y state_frames (el color es el dato); la ley Acho en las fuentes; el mapa de renombres ya mide el vocabulario; el patron de iconos desde el emblema.

Roadmap: (1) censo medido icono por icono, web contra app, tabla con dueño; (2) canon del icono: simbolo Acho, sonido (sting 220-880 Hz), 44 px, teclado; (3) migracion por lotes, cada lote su PR y su sello; (4) el icono viejo se retira en el MISMO PR que trae el nuevo. Se mide: icono huerfano (sin sonido o sin 44 px) = ROJO.

### I4 · Spread the Hexelion context across devices

Rieles ya medidos: la app es RAG y harness de la flota y Hexelion la cabeza que integra veredictos tipados, jamas corpus crudo; la memoria que permanece (rotacion por resumen, patron Engram); el cerebro remoto del usuario con llave propia; el latido menor que 1.024 B por nodo con receptor de 240 s; la memoria como territorio soberano (por agente y dispositivo, expirable, revocable, auditable, portable solo con firma humana); la estacion medida (ctx 65536, mesh-only).

Roadmap: (1) contrato de contexto por dispositivo: la estacion guarda el cerebro y los veredictos; los nodos guardan RAG local y resumenes; la web sirve solo veredictos tipados; (2) rotacion por resumen medida, con entropia de la memoria (que sabe, que caduca, que no puede verificar); (3) sincronia por latido y aduana; (4) la puerta del cerebro remoto con llave propia en Ajustes. Se mide: un cambio de contexto viaja con recibo (maquina, fecha, huella); nada de corpus crudo en la web.

## 6 · Como se elige

Un preceptor con tiempo elige UNA, la propone (que, por que ahora, como se mide) y construye la pieza antes de pedir la firma. El enjambre de haikus ejecuta las rebanadas disjuntas que salgan de cada mision: una rebanada, un PR, CI verde, SCRUB, recibo, firma por cabeza exacta.
