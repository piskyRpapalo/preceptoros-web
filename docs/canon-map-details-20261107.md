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

Edificios: puestos con rol y capacidad declarados (un edificio por hexágono; el central es el nodo principal). La interfaz ofrece puerta a su actividad solo si la capacidad existe; si no, NO_DATA con causa. El edificio da contexto y estilo; no decide por el motor.

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
- Lo único que no espera turno: un test rojo medido es urgencia técnica; se cura y se declara antes de proponer lo siguiente (caso abierto hoy: un test busca el nodo retirado del tutorial en #695).

## 9 · El mapa de misiones (donde elegir)

Catálogo gigante y vivo. Cada constructor propone UNA misión por turno y puede proponer misiones nuevas: este mapa se alimenta. Cada misión dice qué es, cómo se mide y su estado. El orden lo decreta el Soberano.

### A · Soberanía de Hexelion y LoRA

- A1 · Cerebro propio del usuario: guía de cerebro remoto y llave propia en Ajustes; alguien ajeno conecta su cerebro sin ayuda. Estado: propuesta (decreto de la casa).
- A2 · LoRA de la casa: entrenado con las preguntas medidas de la fábrica; responde con el estilo de la casa y cita fuentes. Estado: NO_DATA (fase 2 del insertor).
- A3 · Hexelion escribe como preceptor más: recibos, SCRUB, append-only, jamás FIRMO. Estado: propuesta.
- A4 · Voz del faro en la app: el faro midió voz directa (fría y caliente) y la app con fuente, citando; llevar la voz medida a la app. Estado: medido en el faro, NO_DATA en la app.
- A5 · Memoria persistente de Hexelion: patrón de memoria que salva a su propio proyecto; la memoria vive en el edificio. Estado: NO_DATA.
- A6 · Mini orquestador blob local: agente local alimentando a Hexelion en continuo. Estado: propuesta.

### B · El Lab · la fábrica de tests

- B1 · LAB-1: censo y contrato de la fábrica; un registro único alimenta Mando, Lab y cabecero. Estado: propuesta.
- B2 · LAB-2: la cara del Lab. Estado: propuesta.
- B3 · LAB-3: enlace vivo harness y app. Estado: propuesta.
- B4 · LAB-4: ciclo cerrado, el agente escribe. Estado: propuesta.
- B5 · Telemetría de agentes (solo medido), reporte de estado de 100 caracteres y enlaces entre paneles. Estado: propuesta.

### C · El suelo y los hexágonos

- C1 · S2: edificios con volumen y clave de léxico por tipo. Estado: propuesta.
- C2 · S3: contrato preceptoros.suelo/1 fail-closed. Estado: propuesta.
- C3 · S4: JN-3 (cuenta y mapa) + colisión personaje-personaje determinista. Estado: propuesta.
- C4 · Nacimiento interactivo de hexágonos por click: un click en el mapa OpenWorld hace nacer un hexágono pintado por TABLA_SEMANTICA, con recibo. Estado: propuesta.
- C5 · Gráficos de hexágonos hasta las fuentes: el hexágono del dato conecta con su fuente (RAG visual). Estado: propuesta.
- C6 · Radio re-montado en /openworld/ con sello de estado. Estado: propuesta.

### D · El visitante y el personaje

- D1 · El personaje efímero nace: la cuenta efímera juega gacha honesto, luchas y conquistas sin nodo. Estado: canon, NO_DATA en el mapa.
- D2 · El joystick derecho del personaje: nace con el personaje (decreto del 2026-11-07). Estado: decreto, NO_DATA.
- D3 · Edificio con chatbot del visitante: el visitante planta su chatbot en un edificio desde su despliegue local. Estado: canon, NO_DATA.
- D4 · Huevos del visitante. Estado: canon, NO_DATA.
- D5 · Batallas del visitante. Estado: canon, NO_DATA.
- D6 · Conquistas del visitante. Estado: canon, NO_DATA.
- D7 · Combate de ondas: el motor medido decide el desenlace, jamás inventado. Estado: canon, NO_DATA en la web.
- D8 · Invocaciones y controles. Estado: canon, NO_DATA.

### E · La colonia

- E1 · Productor del estado: puente de la aduana al estado del mapa, escritura firmada; la colonia des-sellada. Estado: propuesta, cadena viva con primer ancla.
- E2 · Caravanas con estados explícitos y eventos públicos sin identidad. Estado: canon, NO_DATA.
- E3 · Las 7 familias de benchmarks en vivo, con condiciones, fuente, edad y recibo. Estado: canon, NO_DATA.
- E4 · AIs habitando edificios, contra NPCs o entre sí. Estado: propuesta.

### F · La pieza

- F1 · Empaquetado de 2 clics: instala en hardware ajeno; el test del hardware ajeno. Estado: propuesta.
- F2 · Tronco único traducido a Android, Ubuntu, Windows e iPhone 8. Estado: propuesta.
- F3 · Cura de la tensión medida: 10 paneles de 44 px no caben en el viewport. Estado: medido, cura pendiente.
- F4 · Interiores de los 9 paneles de la app: plan documento con PR y recibo. Estado: propuesta.
- F5 · Blindaje de telemetría del conjunto. Estado: propuesta.
- F6 · Benchmarks de dispositivos live con sello de procedencia nativo. Estado: propuesta.
- F7 · Accesibilidad completo: EN 301 549, 44 px táctiles, reduced-motion, 8 lenguas, doctrina sin teclado. Estado: doctrina, plan pendiente.
- F8 · Ley ACHO hasta en las fuentes tipográficas: escala determinista compartida. Estado: canon, NO_DATA.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
