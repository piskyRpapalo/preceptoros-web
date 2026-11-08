# Las misiones de claude · la reescritura v2 con el cruce polimático de hoy (2026-11-08)

> Decreto del Soberano (2026-11-08): «Usa lenguaje ASD-STE100, tu memoria (sobre todo tu biblioteca) y lo que estos repositorios hicieron bien y podemos adaptar. Reescribe las misiones para claude. Agrega las piezas que debe escribir él. Tienes libertad completa para traer optimizadores y motores de rendimiento. Respeta el lenguaje Acho, el renombramiento y las leyes de la casa en tamaño y arquitectura. Cruza polimáticamente: quizá encuentres cosas interesantes a día de hoy con lo que ya tenemos nativo.» Repos revisados hoy: openrig, celld, el examen de seguridad MCP, jobpilot y el ecosistema gentle.
> Esta pieza REESCRIBE y EXPANDE la comisión clave (docs/misiones-claude-clave-20261108.md, canon), su adenda (docs/comision-claude-polimatica-20261108.md), el cruce (docs/cruce-mina-gentle-hub-20261108.md) y las mejoras medidas (docs/mejoras-misiones-joyas-20261108.md). Conserva los IDs. No crea misiones. No crea lista paralela. Las misiones gráficas siguen en su documento propio (docs/comision-grafica-claude-20261108.md): aquí no se repiten. Propose-only: nada se fusiona sin FIRMO del Soberano por cabeza exacta. SCRUB limpio.

## 1 · Las leyes (se citan, no se reescriben)

- Recibo y frame <1.024 B. Paquete y llms.txt <1.024 B. Bloque servido 25 MiB. Primera carga del juego <153.600 B gzip. Audio ≤16 KiB, cero peticiones.
- Math.random queda PROHIBIDO. Usa xorshift32 o sfc32. La semilla viaja en el recibo.
- Fail-closed: ante la duda, cierra y declara NO_DATA con causa. Lo simulado se llama EMULADO. El esquema de counters se reusa tal cual (como / causa).
- UNA pieza por PR. La pieza se construye ANTES de pedir la firma. FIRMO por cabeza exacta.
- Renombra lo que adoptas. Cita la fuente UNA vez. Si el cruce ya puso nombre de joya (M1-M16), ese es su nombre en la casa.
- Ley G6: si una pieza ya respira en main, la pieza que la repite muere. El inventario nativo (§3) es el mapa de minas.
- Cero dependencias nuevas sin firma. Lo que el teléfono débil no mide, no se adopta.
- SCRUB: cero rutas privadas, cero IPs, cero aparatos con nombre. El rack se llama el rack.
- El juez cita o calla. Toda pieza gráfica declara sus cuatro canales (K3c). prefers-reduced-motion siempre.

## 2 · Los patrones del oficio · v2

Los ocho canon viven en la comisión clave (cítalos ahí; no se re-bautizan): EL CORO, EL ALBERGUE, LA ADUANA DE TRES LLAVES, EL MÉDICO DE GUARDIA, EL PULSO, LA MALETA, LA LOTERÍA HONESTA, EL DUELO DE VARIANZA BAJA.

Cuatro patrones NUEVOS, revisados hoy en los originales (cada fuente se cita UNA vez):

- **EL DESPERTADOR** (de gentle-shell, github.com/Gentleman-Programming/gentle-shell: bash_background despierta al agente UNA vez cuando el comando acaba; monitor convierte cada línea de salida en un evento). ADAPTAMOS: despierta en el evento; jamás preguntes en círculo con temporizador. RECHAZAMOS: el cron que despierta a preguntar lo que ya sabe callado.
- **LA CELDA DORMIDA** (de celld, github.com/denoland/celld: una celda inactiva casi no cuesta). ADAPTAMOS: lo que la niebla tapa, el motor no lo computa; el agente ocioso duerme a coste cero y despierta con el evento. RECHAZAMOS: el consenso (v1 ya lo vetó).
- **EL CUADERNO DE CURAS** (de jobpilot, github.com/maazbin/jobpilot: la memoria de evolución escribe cada encuentro en su cuaderno y la sesión siguiente lee la cura; la dedup es permanente). ADAPTAMOS: cada rojo deja UNA entrada con causa, cura y vara; la misma causa jamás escribe dos filas (G6). RECHAZAMOS: el merge propio (v1 ya lo vetó).
- **EL MOTOR DEL CUADRO** (nace de la casa; el decreto lo libera): tick fijo con semilla = lugar + tick, el melt reusa UN solo drawImage por frame, pooling sin basura por frame, presupuesto contado en cada trazo (líneas = vértices · válvula), escalera de degradación medida. WARNING: cero dependencias; cada adopción se mide en el teléfono débil antes de entrar; lo no medido no se adopta.

## 3 · Lo nativo de HOY (claude CONSUME; no lo re-escribe)

Medido en main y en la app el 2026-11-08:

- WEB: gamepad.js · caravan.js + data/caravana_schema.json (máquina de 6 estados) · skin_tokens.js · place_name.js · tutorial_walk.js · hitl_walkers.js · openworld/judge-corpus.json · building_chat.js · global_map.js · el worker del estado del mundo.
- APP: decisor.py (conjuntos de reglas sellados por sha256: el sello interno que canta solo) · la CLI con voz propia de agente (el juez piensa bajo, 512 fichas) · la memoria con índice de texto completo vivo (engramas, salidas y turnos contados).
- CERCAS: rulesets «tronco-solo-pr» y «cerco-hitl», medidos. current_user_can_bypass: never.
- CI: las puertas completas ya miden gacha_odds, duel_states y pulse_cases en cada corrida. Las varas de D4, D5 y K5 ya tienen juez: no se funda otro.

## 4 · Los cruces polimáticos de hoy (lo que ninguno dijo y juntos sí)

1. **LA NIEBLA ES LA HIBERNACIÓN** (LA CELDA DORMIDA × el canon de niebla por hash): la niebla ya canta qué píxel vive; el motor aprende la otra mitad: lo tapado no se computa ni se dibuja. El habitante fuera de vista duerme; despierta al acercarse la cámara. E4 y K5 se lo reparten.
2. **EL CERCO YA ES UN DESPERTADOR** (la valla del merge × EL DESPERTADOR): las cercas de la casa ya despiertan por evento (la edición del cuerpo dispara el check). El coro y el médico adoptan la misma ley: cero cron; el doctor se despierta cuando el gate imprime rojo.
3. **LAS VARAS YA VIVEN EN EL CI** (las puertas completas × las misiones): gacha_odds, duel_states y pulse_cases ya corren medidos en cada corrida. D4, D5 y K5 no construyen jueces nuevos: alimentan sus casos a las puertas existentes. Dos gramáticas es una pieza sobrante.
4. **EL CUADERNO DE CURAS** (jobpilot × counters como/causa): cada flake escribe su entrada; el tiempo de rojo a verde viaja en counters; la sesión siguiente lee la cura antes de empezar. B4 lo lleva al registro único (B1).
5. **EL MOTOR DEL CUADRO** (el decreto × el canon propio): melt de un solo drawImage (α 0,85-0,98), presupuesto contado (líneas = vértices · válvula), tick fijo (semilla = lugar + tick), pooling de arrays reusados (cero basura por frame, cero pico de GC), hitstop cortado por reduced-motion. N6 sella la huella de los frames.
6. **LA TRÍADA AJENA YA ES LA CASA** (gentle-ai: memoria, flujo, evidencia × el libro, ODD y las cinco marcas): confirmacional. Nada que adoptar; la verificación con fuente ya es ley.

## 5 · Las misiones reescritas (la comisión y las piezas que escribe claude)

### E4 + B5 · Put AIs in the buildings · Show agent telemetry (la oficina pixel viva) · WEB · STE-3

La comisión (STE): pon los habitantes en el mapa. Cada habitante muestra su estado de la tabla única. El estado caído muestra su causa. El habitante fuera de vista duerme. Cero fichas por cambiar el estado.

Las piezas que escribe claude:
1. LA TABLA ÚNICA consumida (ready / working / needs-you / unavailable, la de M2): el icono cambia solo; cero tokens; el estado es del sistema, no del modelo.
2. LA CAUSA medida: el caído trae su causa del registro (la conexión se cerró; la respuesta se cortó sin razón de fin).
3. EL SUEÑO: el habitante que la niebla tapa cuesta cero; despierta al acercarse la cámara (LA CELDA DORMIDA × la niebla por hash).

La vara: mismo estado produce el mismo cuadro; la causa del caído se lee en el registro. Alimenta: A6 (el coro lee la misma tabla), B9, CL1.

### K5c · La degradación honesta (la comisión la llama K5) · WEB · STE-3

La comisión (STE): declara los cuadros por segundo por aparato. Mide el cuadro. Muestra el número. Declara qué muere primero: niebla, luego melt, luego pulso. Bajo el mínimo, NO_DATA con causa. El aparato débil juega ENTERO.

Las piezas que escribe claude:
1. EL MOTOR DEL CUADRO: tick fijo (semilla = lugar + tick), melt de un solo drawImage, pooling sin basura por frame, presupuesto contado por trazo.
2. LA ESCALERA MEDIDA: cada peldaño (niebla → melt → pulso) declarado y contado; ninguno se encubre.
3. EL TEST DEL SOBRE: un ciclo del juego se mide solo; imprime cuadros y presupuesto; pasa en el teléfono débil.
4. LAS PIEZAS PESADAS con ETag/304 (hoy 0 medidos en la web): cada adopción con medida antes y después (G4).

El cruce: pulse_cases ya corre en el CI; el test del sobre alimenta sus casos a la puerta existente. La vara: el ciclo medido imprime cuadros y presupuesto; misma semilla, misma secuencia de frames (N6 sella la huella). Alimenta: K10, C9, la familia D entera.

### D4 · Make the honest gacha · WEB · STE-4

La comisión (STE): publica las probabilidades por clase ANTES del click. Aísla cada tabla. Repite la tirada con la misma semilla; obtén la misma secuencia. Guarda el inventario en local. Sella la crónica. El contador de lástima es visible.

Las piezas que escribe claude:
1. LA TABLA PUBLICADA: odds por clase, en la fila de la fuente, antes del código.
2. EL SORTEO con semilla nativa (xorshift32, hash a·73856093): cada tabla es un módulo aparte; el pity honesto y visible.
3. EL INVENTARIO local: append-only; moldes de 1 KB (K8c).
4. EL TEST DE LAS DIEZ MIL TIRADAS: semilla fija; la distribución medida coincide con la declarada, por clase.

El cruce: gacha_odds ya corre en el CI; el test alimenta la puerta existente, jamás funda juez. La vara: dos corridas con la misma semilla dan la MISMA secuencia, byte por byte; las odds visibles antes del click. Alimenta: D5, D6 (la misma semilla), J7.

### D5 · Make the duel without two nodes · WEB · STE-4

La comisión (STE): calcula el daño con varianza baja. Declara la dispersión. Valida cada transición: la ilegal cierra el duelo, no lo arregla. Procesa un frame de acción a la vez. El hitstop dura frames contados. Sella el compromiso ANTES de resolver.

Las piezas que escribe claude:
1. LA MÁQUINA en UNA tabla declarativa, gramática compartida con el coro; validación absoluta antes de cada transición.
2. LA FÓRMULA publicada: canon hash %100 < 40+3v+10·válvula; dispersión declarada; compromiso SHA-256 antes de resolver; ABANDON a los 900.
3. LOS FRAMES: acción e hitstop contados; reduced-motion corta el hitstop.
4. EL TEST DEL DUELO REPETIDO: misma semilla, misma pelea, frame a frame.

El cruce: duel_states ya corre en el CI; la máquina alimenta la puerta existente. La vara: mismo ataque, mismo resultado; dos duelos idénticos sin causa se marcan en rojo. Alimenta: D6 (la carta W), K6c, la campaña Acto IV.

### A6 · Make the local mini orchestrator (el coro con el despertador) · APP/LAB · STE-4

La comisión (STE): declara los estados del coro en UNA tabla. Pon cada agente en su celda. Despierta en el evento, jamás con cron. El agente ocioso duerme a coste cero. Limita cada lectura a cinco segundos. Cada agente pregunta con SU voz.

Las piezas que escribe claude:
1. LA TABLA ÚNICA consumida (M2/E4/B5): nadie funda otra.
2. EL DESPERTADOR: el supervisor LEE estados; despierta en el evento (gate rojo, pregunta nueva); cero temporizador de ronda; tope de lectura 5 s.
3. EL SUEÑO: la celda sin lease duerme (LA CELDA DORMIDA); sin consenso (RECHAZAMOS el de celld): el lease es un estado más de la caravana.
4. EL TEST DEL CORO: dos agentes preguntan a la vez; ambos reciben respuesta; ninguno bloquea.

La vara: el health expone el estado sin abrir rutas nuevas; el ciclo deja recibo <1.024 B. Alimenta: B4, CL1, B9.

### CL1 · Give the agents their voice (la voz del parlante) · APP · STE-4

La comisión (STE): cada agente pregunta con su voz. Cada respuesta cita exacto o declara NO_DATA con causa. El estado del agente se ve en el cabecero.

Las piezas que escribe claude:
1. CONSUME la CLI ya medida (la voz del agente en el chat). Cierra la cadena de fusión pendiente; nada se inventa aquí.
2. EL VERIFICADOR de citas en cada respuesta: cita byte-exacta + fuentes, o NO_DATA con causa.
3. EL ESTADO en el cabecero: consume la tabla única, jamás otra.

La vara: cero peticiones no declaradas; cada respuesta pasa el verificador de citas. Alimenta: todo el que pregunta.

### B4 · Close the test loop (LAB-4, el médico con su cuaderno) · LAB · STE-4

La comisión (STE): lee el gate fallido. Escribe la causa con como/causa. Propón la cura como PR. Jamás la fusiones. Escribe el encuentro en el cuaderno. La sesión siguiente lee la cura.

Las piezas que escribe claude:
1. EL LECTOR de diagnóstico: gate + counters, como/causa; arma el parte médico.
2. EL MÉDICO: parche en rama propia, PR con causa, cura y vara (propose-only, el patrón de jobpilot con la ley de la casa).
3. EL CUADERNO DE CURAS: cada rojo deja UNA entrada (causa, cura, vara, tiempo de rojo a verde); la misma causa jamás escribe dos filas (G6, dedup permanente); append-only al registro único (B1).

WARNING: jamás FIRMO, jamás merge, jamás firma ajena. La cura auto-fusionada se llama EMULADA y el juez la marca rojo.
La vara: un gate rojo curado por PR propuesto, con el tiempo medido en counters y recibo <1.024 B. Alimenta: B1, G3, L14.

### A5 · Make memory that stays (la maleta) · APP · STE-4

Litigio de dueño, declarado (FIRMO decide): la comisión clave se la dio a claude; el cruce y las mejoras la midieron para el carril de función. Mientras FIRMO no hable, las piezas no se mueven.

La comisión (STE): guarda UNA conversación continua. Pesa la maleta. Si pasa el presupuesto, pliega: resume lo viejo. El resumen cita lo que resume. La memoria responde con cita exacta o NO_DATA con causa.

Las piezas que escribe claude (números medidos, ya citados en las mejoras):
1. EL ALMACÉN: cada cita con su origen y su sha256; techo de cita 320 B medido.
2. LA RUEDA (M1): rota a los 20 MB o 10 compactaciones; reusa el resumen ya escrito; cero llamadas extra; sin resumen, el relevo previo + 12 mensajes recortados a 2.000.
3. EL TEST DEL PESO: medir tras cada guarda (hoy: prompts 6.143 B, hallazgos 1.122 B, salidas 357 B); lo que rompa el techo, causa al frente.

La vara: la memoria cita exacto o NO_DATA con causa; jamás parafrasea. Alimenta: la voz de los agentes, el juez del tablero.

### H4 · Threat-model the first write door (la aduana de tres llaves) · OTROS · STE-4

La comisión (STE): modela la puerta de escritura. Aísla la entrada. Autoriza por canal aparte. Verifica el token. Escribe cada ataque pensado y su respuesta. Marca lo NO_DATA con causa.

Las piezas que escribe claude:
1. LA COMPUERTA (M15) consumida: fuera del alcance del agente; negar es gratis; el sin freno expira solo (máximo una hora, solo lo enciende el humano).
2. TRES LLAVES: quién pide, qué alcance, cuándo caduca; la aprobación se ata al hash exacto de la cabeza (estilo FIRMO); no se inventa criptografía: el sello sha256 nativo se consume.
3. LA TABLA DE ATAQUES (del examen MCP, github.com/taimurijlal/ai-security-interview-questions): repetición de firma, tamaño del paquete, replay, suplantación; y la regla de confianza: el texto que llega de herramientas es entrada, jamás orden.

La vara: cada ataque probado; cada respuesta medida o confesada; tres rojos obligatorios. Alimenta: E1, F10, K12, L9.

### L4 · El contrato de la cascada (la celda y el lease) · LAB · STE-4

La comisión (STE): levanta el tier 2 como proceso hijo por tubería. Dale un lease con vencimiento. Si el lease vence, la celda muere y la respuesta es NO_DATA con causa. El proceso jamás cuelga. Fail-closed en cada mensaje. Sin socket.

Las piezas que escribe claude:
1. LA CELDA: runtime embebido con estado local (cada objeto con su base); sin daemon central, sin consenso.
2. EL LEASE: contrato con vencimiento; el guardián mata la celda vencida y lo declara; la celda sin lease duerme (LA CELDA DORMIDA): coste casi cero.
3. EL TEST del lease vencido: la celda muerta devuelve NO_DATA con causa en tiempo medido, jamás un silencio.

La vara: el primer NO_DATA de tier 1 resuelto o declarado por tier 2 con rastro completo. Depende: L2 (el censo vivo de cerebros).

## 6 · El orden de costura v2

1. E4 + B5 primero (el cruce ya lo decretó): la tabla única con causas alimenta todo.
2. K5c después: el motor del cuadro alimenta todo lo que dibuja.
3. D4 y luego D5: la lotería siembra; el duelo come la misma semilla.
4. CL1 con la tabla viva; A6 con el despertador.
5. B4 en el lab desde el día uno: el médico trabaja mientras el mapa se construye.
6. H4 antes de que E1 abra la primera puerta de escritura.
7. A5 espera el FIRMO del litigio; L4 espera a L2.

## 7 · Cómo se cierra cada pieza

Las cinco marcas del método de autenticidad: fuente con ancla, estado medido, la vara, el recibo y el FIRMO. Recibo <1.024 B en la puerta 19 del canal de la casa, con la cuenta exacta. Al cerrar, UN comentario corto en la puerta 54: qué se sirvió y qué misión se elige después. Y antes de pararse: la siguiente misión del índice ya elegida (el bucle). El índice vivo: docs/indice-territorios-ste-20261108.md.

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA