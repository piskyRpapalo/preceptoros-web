# La comisión de claude · adenda polimática (2026-11-08)

Propose-only. Esta adenda EXPANDE `docs/misiones-claude-clave-20261108.md`: conserva sus IDs, no crea misiones, no crea lista paralela. Se ancla a dos piezas ya medidas: el cruce (`docs/cruce-mina-gentle-hub-20261108.md`, en main: las joyas M1-M16 asignadas a las filas) y las mejoras al detalle (PR #723: los números del plegado, la compuerta, la llave, la música). Ley que esta adenda se impone: lo que el cruce ya nombró, aquí no se renombra; se cita por su joya. SCRUB limpio: sin IPs, sin caminos privados, sin secretos.

## 1. Leyes innegociables (se citan, no se re-escriben)

- Recibo <1.024 B. Bloque 25 MiB (el tope de 16.384 B quedó revocado; los 1.024 B siguen para frames, paquetes y llms.txt). Primera carga del juego <153.600 B gzip.
- Math.random PROHIBIDO: sfc32 o xorshift32, con la semilla en el recibo.
- Fail-closed: todo NO_DATA lleva su causa. El esquema de counters.json se reusa tal cual (`como` / NO_DATA con `causa`).
- Renombramiento: cada regalo foráneo se cita UNA vez con su origen y declara ADAPTAMOS o RECHAZAMOS. Si el cruce ya le puso nombre de joya, ese es su nombre en la casa.
- UNA pieza por PR. FIRMO por hash exacto. Main está vallado: «tronco-solo-pr» y «cerco-hitl» obligan a pasar por PR y por el check hitl; nadie los salta.
- Audio ≤16 KiB, cero peticiones, f_base = 220 + (hue/360)·660 Hz (J-SN-16). `prefers-reduced-motion` se respeta siempre.

## 2. Lo nativo de HOY (claude CONSUME; no lo re-escribe)

Medido el 2026-11-08 en main y en la app:

- WEB: `gamepad.js` · `caravan.js` + `data/caravana_schema.json` (máquina de 6 estados) · `skin_tokens.js` · `place_name.js` · `tutorial_walk.js` · `hitl_walkers.js` · `openworld/judge-corpus.json` · `building_chat.js` · `global_map.js`.
- APP: `decisor.py` (conjuntos de reglas sellados por sha256: el sello nativo de la casa) · piezas clavadas por sha256 en los tests de la cara · CLI de consulta con voz propia para los agentes del rack (el juez pide pensar bajo, 512 fichas).
- CERCAS: rulesets «tronco-solo-pr» y «cerco-hitl», medidos. `current_user_can_bypass: never`.

Ley G6 (anti-duplicación): si claude empieza una pieza que ya respira en main, la pieza muere. Este inventario es su mapa de minas.

## 3. Anclas al cruce (lo que ya está nombrado y medido)

Nada de esto se vuelve a bautizar ni a re-medir aquí: el cruce lo nombró, #723 lo midió al detalle. La tabla declara qué añade esta adenda, si algo:

| Regalo (origen citado una vez) | Joya del cruce | Fila | Qué añade esta adenda |
|---|---|---|---|
| gentle-dot, rotation (el plegado reusa el resumen ya escrito; cero llamadas) | M1, la compactación del techo | A5 | Los umbrales medidos: rota a los 20 MiB o 10 compactions; si no hay resumen, handoff previo + 12 mensajes × 2.000 caracteres |
| gentle-dot, status/AskCard (4 estados, cola de esperas) | M2, la cola de FIRMO | B1/B5 | Nada: ya medido en el cruce y en #723 |
| [gentle-dot, voice/](https://github.com/Gentleman-Programming/gentle-dot) (dictado local, revisable) | M4, la voz local | A4 | Nada: el adorno de la comunidad ya lo viste de accesibilidad |
| [gentle-stream](https://github.com/Gentleman-Programming/gentle-stream) (ánimo → música) | M12, la música por estado | A4/C6/K3c | Nada: la síntesis ya es canon propio |
| [gentle-dot, secure_store](https://github.com/Gentleman-Programming/gentle-dot) y qbit-vault (secretos que no se ven) | M5, la aduana de llaves | F1 | Nada: #723 ya mide el gesto |
| [gentle-dot, approvals](https://github.com/Gentleman-Programming/gentle-dot) (la compuerta fuera del alcance del agente) | M15, la compuerta | H4/F10/K12 | Solo la tabla de ataques (misión H4 abajo) |
| gentle-dot, stage-runtime/smoke-runtime (paquete probado con humo) | M14, la distribución de 2 clics | F1/F2 | Nada |

## 4. Cruces polimáticos (lo que ninguno dijo y juntos sí)

- [CellD](https://github.com/denoland/celld) vende leases sobre celdas aisladas; la casa ya tiene la máquina de 6 estados de la caravana. El lease es un estado más, no un servicio nuevo. RECHAZAMOS el consenso: la casa no lo necesita.
- La [lista MCP](https://github.com/taimurijjal/ai-security-interview-questions/blob/main/questions/05-mcp-security.md) ata el token a la sesión; la casa ya ata el FIRMO a un hash exacto de cabeza. La aduana NO inventa criptografía: consume el sello sha256 nativo.
- [JobPilot](https://github.com/maazbin/jobpilot) escribe parches al repo; la casa ya mide cada flake con causa en counters.json. El médico diagnostica con `como`/`causa`, no con lloraderas.
- La lotería honesta necesita semilla; el render ya la siembra (xorshift32, hash a·73856093). La lotería REUSA esa semilla; jamás un motor nuevo de azar.
- [El coro](https://github.com/mvschwarz/openrig) orquesta por máquinas de estado declarativas; los conjuntos sellados de decisor.py SON esa máquina. El coro consume conjuntos, no inventa gramática. Y UNA sola tabla de estados para toda la casa (la de M2/E4/B5): el coro, el timbre, la voz y el health la leen; nadie funda otra.

## 5. Las misiones reescritas (piezas que escribe claude)

### A5 · LA MALETA · app · STE-4

**Litigio de dueño, declarado:** la comisión clave se la dio a claude; el cruce (§6) y #723 (§5) la ponen en manos de codex con los números del plegado (M1). FIRMO decide. Mientras tanto, las piezas no se mueven y nadie más las toca.

1. EL ALMACÉN: cada cita con su origen y su sha256. Techo de cita 320 B medido; lo que no cupo, NO_DATA con causa.
2. LA RUEDA (M1): los umbrales de la tabla de anclas. Al compactar, reusa el resumen que el motor ya escribió; cero llamadas extra.
3. EL TEST DEL PESO: medir tras cada guarda (hoy mide: hallazgos 1.122 B, salidas 357 B, prompts 6.143 B). Lo que rompa el techo, causa al frente.

**La vara:** la memoria responde con cita exacta o NO_DATA con causa; jamás parafrasea. **Alimenta:** la voz de los agentes, el juez del tablero.

### A6 · EL CORO Y EL TIMBRE · app/lab · STE-4

**Comisión:** orquesta sin cerebro central; que cada estado se vea y se oiga.

1. CONSUME la tabla única de estados (la de M2/E4/B5: ready / working / needs-you / unavailable): el coro, el timbre y el health la leen todos. Nadie funda otra tabla.
2. El supervisor LEE estados; jamás manda. Sin consenso (RECHAZAMOS el de CellD): el lease es un estado más de la caravana.
3. TEST DEL CORO: dos agentes preguntan a la vez; ambos reciben respuesta; ninguno bloquea; tope 5 s medido.

**La vara:** el health expone el estado del agente sin abrir nuevas rutas. **Alimenta:** B9, CL1, E4.

### B4 · EL MÉDICO DE GUARDIA · lab · STE-4

**Comisión:** cierra el lazo del test: del rojo al verde, con causa escrita.

1. El diagnóstico LEE el gate y counters con `como`/`causa`. Cuando un test falla, el médico escribe su nota como parche de documento (propose-only, estilo JobPilot).
2. El parche se PROPONE; jamás se empuja. FIRMO decide.
3. EL LAZO MEDIDO: el tiempo de rojo a verde viaja en counters. Sin número, no hay lazo.

**La vara:** cada flake curado deja recibo <1.024 B con su causa. **Alimenta:** B1 (el registro), G3.

### CL1 · LA VOZ DEL PARLANTE · app · STE-4

**Comisión:** que cada agente pregunte con su voz y responda solo con lo medido.

1. El CLI ya aterriza la voz del agente en el chat (medido). Cierra la cadena de fusión que falte; nada nuevo se inventa aquí.
2. Cada respuesta es cita exacta + fuentes, o NO_DATA con causa (la ley del libro). El juez ya piensa corto (512); se consume tal cual.
3. El estado del agente se ve en el cabecero: consume la tabla única, jamás otra.

**La vara:** cero peticiones no declaradas; cada respuesta pasa el verificador de citas. **Alimenta:** todo el que pregunta.

### D2 · EL SEGUNDO JOYSTICK · web · STE-3

**Comisión:** que la cámara obedezca a la segunda palanca, sin re-escribir lo nativo.

1. CONSUME `gamepad.js` (aterrizó hoy en main). Si claude re-escribe el gamepad, la pieza muere (G6).
2. La segunda palanca mueve la cámara con el MISMO amortiguado que el arrastre táctil. Un solo valor de damping para todo.
3. Todo control se alcanza con una mano; blancos de 44 px; `inputmode` y `enterkeyhint` donde aparezcan teclas.

**La vara:** una vuelta al mapa solo con la mano izquierda; luego solo con táctil. Ambas pasan o no hay pieza. **Alimenta:** J1 (el paseo).

### D4 · LA LOTERÍA HONESTA · web · STE-3

**Comisión:** regala premios con azar sembrado y probabilidades publicadas.

1. La tabla de probabilidades se publica ANTES del código, en la fila de la fuente.
2. El sorteo usa la semilla nativa (xorshift32 del render) y la semilla VIAJA en el recibo.
3. Inventario local, sin servidor. El contador de lástima (pity) es honesto y visible.

**La vara:** dos corridas con la misma semilla dan la MISMA secuencia, byte por byte. **Alimenta:** K10, la caravana.

### D5 · EL DUELO DE VARIANZA BAJA · web/app · STE-3

**Comisión:** pelea que se puede leer: daño bajo en varianza, transiciones selladas.

1. CONSUME la tabla única de transiciones compartida con el coro. Dos gramáticas de estados en la casa es una pieza sobrante (anti-slop).
2. Fórmula de daño de baja varianza, publicada en la fila. Misma entrada, mismo resultado.
3. Frames de acción y de hitstop contados; `prefers-reduced-motion` corta el hitstop. El compromiso se sella como decisor: hash de la orden ANTES de resolver.

**La vara:** mismo ataque, mismo resultado; dos duelos idénticos sin causa se marcan en rojo. **Alimenta:** F6, el juez.

### H4 · LA ADUANA DE TRES LLAVES Y EL GUARDIÁN · web · STE-4

**Comisión:** piensa todos los ataques y su respuesta; la puerta se abre solo desde fuera.

1. LA COMPUERTA (M15): la ley ya está medida en #723 (fuera del alcance del agente; negar es gratis; el sin freno expira solo). Se consume; no se re-escribe.
2. TRES LLAVES: quién pide, qué alcance, cuándo caduca. La aprobación se ata al hash exacto de la cabeza (estilo FIRMO); no se inventa otra criptografía.
3. LA TABLA DE ATAQUES (lo que esta adenda añade): cada ataque de la lista de seguridad MCP con su respuesta escrita, en la fila de la fuente.

**La vara:** se prueba cada ataque; cada uno tiene respuesta medida o confesada. **Alimenta:** F10, K1, la cartera ciega (M5).

### K5 · EL PULSO HONESTO · web · STE-3

**Comisión:** cuando el aparato es lento, el juego declara qué muere primero.

1. ESCALERA MEDIDA: niebla primero, luego el melt, luego el pulso. Cada peldaño se declara; ninguno se encubre.
2. La caja de utilidades de accesibilidad (forced-colors, prefers-contrast y demás) se consume del adorno de la comunidad; no se duplica.
3. Las piezas pesadas viajan con ETag/304; cero peticiones no declaradas.

**La vara:** jugar en el aparato más lento a mano; cada caída lleva su causa. **Alimenta:** G7, el tablero.

### C7 · EL CUERPO DE LOS EDIFICIOS · web · STE-3

**Comisión:** interiores de verdad, hechos con la piel que ya es nativa.

1. El contrato primero: el PR #721 (abierto, draft) es la pieza 1. Se consume; no se bifurca.
2. Los interiores se visten con `skin_tokens` (la lengua de pieles ya nativa) y cada uno recibe nombre de `place_name`.
3. UNA puerta por edificio, que alimenta la misión de interacción (I8). Sin puerta no hay edificio.

**La vara:** cada edificio se entra, tiene nombre y se lee en modo alto contraste. **Alimenta:** I8, la campaña del nodo.

## 6. Orden de costura (alineado al cruce y a #723; esta adenda solo añade precedencias)

El cruce (§6) y #723 (§5) ya decretaron el inicio para claude: primero la tabla de estados con causas (E4/B5, la oficina pixel viva), luego la música por estado (A4/C6/K3c). El contrato de interiores ya corre en #721. Esta adenda añade dos precedencias y nada más:

- La tabla única de estados va antes que la voz: CL1 consume lo que E4/B5 fundan.
- `gamepad.js` es nativo: D2 lo consume, jamás lo re-escribe.

UNA pieza por PR. Cada PR cita su fila de la fuente y su joya. SCRUB limpio en cada cuerpo de PR. Se re-mide tras cada FIRMO.