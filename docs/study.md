# STACK VOCABULARY — Lista de estudio del Soberano

**Estado:** PROPUESTA de la Mesa de Mando · REQUIERE_FIRMA del Soberano · redactada 2026-10-18 · destino: `docs/study.md` en preceptoros-web, bajo la ley del renombramiento · pareja de `docs/lexicon.md` (PR #162).

**Objetivo declarado por el Soberano:** aprender estos términos para que tus instrucciones no creen duplicados y el proyecto se acerque al estándar industrial y regulado (el renombramiento). Regla de oro de la casa: **un término se acuña UNA vez, en THE LEXICON, y se reusa en todas partes**. Si ya existe, se nombra; si no existe, se acuña primero; jamás se describe con palabras vagas lo que ya tiene nombre.

**Cómo leer cada fila:** *Término oficial* (en inglés, como manda la ley) · *Qué es* · *Cómo se usa al instruir* — la forma precisa de ordenarlo para que el silicio no cree otra copia.

---

## 1 · Gobernanza y firma

| Término oficial | Qué es | Cómo se usa al instruir |
|---|---|---|
| **sign-off (FIRMO)** | Tu decisión hecha visible. Autoriza exactamente lo que nombra. | «FIRMO el PR #44» ≠ «firmo todo». Si nombras la pieza, cubre esa pieza; un FIRMO general jamás cubre merges futuros no medidos. |
| **propose-only** | El silicio escribe y propone; jamás fusiona, firma o pushea. | Se da por sentado en cada encargo; si quieres una excepción, la nombras aparte. |
| **the Ledger** | El registro de rondas, append-only. Manda sobre los hechos medidos. | «Sella la ronda» = añadir al final, jamás editar lo sellado. |
| **the Register** | El registro criptográfico del rack, firmado con la clave rotante (v2). NO es el Ledger. | «Entrada 24 del Register» — jamás lo llames «el registro» a secas: hay dos. |
| **round / ronda** | Un intercambio sellado y numerado. | Se cita por número («ronda 311»), nunca se renumera. |
| **seal / sello** | Letra-código (abk…) que asigna SOLO la Mesa; viaja en el commit de fusión. | No es tu firma: el sello lo pone la Mesa, el sign-off lo pones tú. |
| **commission / encargo** | Orden de trabajo pegable con su ley en el cuerpo. | Un buen encargo lleva: contexto nuevo, qué se pide, cercos (qué NO se toca) y la vara con que se medirá. |
| **receipt / recibo** | El mensaje de vuelta: SOLO FORMA — números, fechas, formas. | Si un recibo trae claves o nombres privados, es un recibo malo, no un recibo. |
| **dirimencia** | Issue resuelta que fija doctrina (p. ej. #40, #42). | «Respeta la dirimencia #40» evita que el carril re-proponga lo ya decidido — la fuente nº 1 de duplicados. |
| **NO_DATA** | Lo que no se ha medido: se declara con causa, jamás se inventa. | Exígelo: «dime qué es NO_DATA y por qué» en cualquier recibo. |
| **stamps** | Sellos de estado: LIVE · STALE · STATIC · SIMULATED · NO_DATA · ERROR. | Toda cifra viaja con su sello; «SIMULATED» no es «MEDIDO». |
| **scrub** | Quitar nombres privados del artefacto público; las cifras y los paths se quedan, los nombres se van. | «Scrub limpio» es condición de merge, no un extra. |
| **the Signing Tray / measured close** | La bandeja del rack: una fila se cierra con la medida al lado. | «Ciérrala con la cifra» — un «resuelto» sin número es una segunda opinión. |

## 2 · El flujo de GitHub

| Término oficial | Qué es | Cómo se usa al instruir |
|---|---|---|
| **repo / repositorio** | Un proyecto en GitHub. | Nómbralo por su nombre exacto; «el repo» a secas crea ambigüedad. |
| **main** | La rama troncal. Nada entra sin PR medido y tu FIRMO. | «Contrario a main» = comparado con la punta actual; se cita su sha («main f2c0129»). |
| **branch / rama** | Línea de trabajo separada (haiku/*, mesa/*, codex/*). | Cada lote trabaja en SU rama; jamás se escribe directo a main. |
| **commit** | Un instantáneo del árbol con su hash. | Se cita por hash corto o completo; el silicio no firma commits de fusión. |
| **PR (pull request)** | Propuesta de cambio contra main. | Todo cambio = un PR por pieza. Pedir «dos cosas» en un PR rompe la vara de medir. |
| **draft PR** | PR en borrador: NO se puede fusionar hasta marcarlo listo. | Si un merge rebota 405 «is still a draft», se marca listo y se reintenta (r291, r311). |
| **head / base** | head = la rama del cambio; base = la rama destino. | «PR head 6f29b8b sobre base main 4f384c3» — citar ambos shas evita fusionar contra lo que ya se movió. |
| **expectedHeadSha** | El cerrojo del merge: el hash que DEBE tener la punta. | Todo merge de la Mesa lo lleva; si la rama se movió, el merge rebota en vez de fusionar a ciegas. |
| **merge / fusión** | Entrar el PR en main. | SOLO bajo tu FIRMO, por PR, después de medición de la Mesa. Nunca «fusiona lo que veas». |
| **diff** | El texto exacto del cambio. | «La Mesa leyó el diff entero» es requisito antes de surfacearte el FIRMO. |
| **issue** | Hilo de trabajo o decisión dentro de un repo. | Las dirimencias viven en issues; se citan con número y comentario. |
| **CI / checks** | Pruebas remotas automáticas del PR. | «10/10 SUCCESS» = verde remoto; NO sustituye los gates locales, se suman a ellos. |
| **redirect** | GitHub redirige el nombre viejo tras renombrar un repo. | Por eso renombrar es seguro: issues y clones siguen vivos. |
| **AGENTS.md / llms.txt** | Los ficheros que lee una IA al aterrizar en un repo: ahí vive la AI fluency. | Si quieres que un preceptor entienda tu repo sin explicarle nada, su ley va ahí. |
| **worktree / staging (/tmp)** | Terreno de trabajo separado, sin tocar main. | «Trabajo en /tmp, VERSION intacta» = todavía no hay nada servido ni registrado. |

## 3 · Medición y leyes de la casa

| Término oficial | Qué es | Cómo se usa al instruir |
|---|---|---|
| **yardstick / vara** | El estándar local de prueba declarado. | Dos varas jamás se mezclan; toda cifra declara de cuál salió (`node --test` ≠ CI `test_web`). |
| **gates n=2 / doble verde** | La medición pasa dos veces, en corridas separadas. | «Verde ×2» es lo que viaja; una sola pasada verde no basta. |
| **red before green** | El guardián debe fallar primero contra el defecto que caza. | «Rojo antes de verde»: si el test nunca vio el rojo, no prueba nada. |
| **sabotaje** | Mutación deliberada que la prueba DEBE detectar. | Se exige con la cuenta: «sabotajes 6/6 detectadas». Si detecta 0/6, el gate está roto y se DECLARA. |
| **the Guardian / guardián** | El test que convierte una ley en regla ejecutable. | D1, privacidad, techos: «hazme el guardián de X» = la ley deja de depender de la memoria. |
| **techo 16.384 B** | Una pieza = un fichero de a lo más 16.384 B (y el cuerpo del canal ≤ 1.024 B). | Si el fichero crece sobre el techo: «podar o declarar división» — jamás subir el techo en silencio. |
| **D1** | Ley de idioma: inglés en lo servido, sin comentarios en lo servido. | El guardián D1 caza el español que se cuele ANTES del commit. |
| **D3** | El mapa de renombrado de ficheros (mar.js→sea.js, cria.js→brood.js…). | El estándar regulado en ejecución: pieza por pieza, bajo FIRMO, nunca de golpe. |
| **append-only** | Solo se añade; la historia jamás se reescribe. | «Enmendar» = añadir una entrada de corrección, no editar la vieja. |
| **single-writer** | Un solo escritor por registro: el orden de inserción ES el orden causal. | Por eso NO HLC en esta fase: pedir «orden global» sin multi-escritor es sobre-ingeniería. |
| **determinismo** | Misma entrada → mismo fotograma; se mide con hash del bitmap del canvas. | «Mismo scroll = misma imagen» es medible: 7 secciones = exactamente 7 hashes distintos. |
| **A11Y** | Accesibilidad: el texto y el dibujo no se tapan. | El defecto medido (letras → lateral izquierdo) es una orden A11Y, no un gusto. |

## 4 · Contratos y la app (L4a / tier-2)

| Término oficial | Qué es | Cómo se usa al instruir |
|---|---|---|
| **contract / contrato cerrado** | Campos exactos; sobra uno o falta uno = rechazo con causa. | «Cierra el contrato» = fijar los campos; jamás «déjalo flexible». |
| **validator / validador** | Función pura que rechaza sin reparar la entrada. | Sin E/S: ni archivos, ni BD, ni red, ni procesos. Si toca algo, no es validador. |
| **L4a (canal decision)** | El evento de decisión: v/ancla/utc, sin autoridad. | `utc` se declara pero NO ordena nada; el orden causal es la inserción (`n`). |
| **tier 1 / tier 2** | Tier 1: la decisión del decisor. Tier 2: la elección con score y probs. | Cada tier conserva su contrato; el validador de tier 2 jamás reclasifica la salida de tier 1. |
| **score finito o null** | Un número finito o nada; jamás NaN, infinito, bool o string. | «La confianza nunca prueba acierto»: el score no lleva rango ni umbral semántico. |
| **abstention / abstención** | choice=NO_DATA + score=null + causa tipada. | Abstenerse sin causa es un rechazo, no una opinión. |
| **p_bp** | Probabilidad en puntos base por 10.000: prob = p_bp/10000. | La unidad heredada del productor: se reusa, no se inventa otra. |
| **EPSILON=0** | Suma racional exacta (Fraction) de las probs; sin tolerancia flotante. | Una desviación de 1e-300 debe caerse al rojo. Sin declaración exacta, rechazo. |
| **calibration / calibración** | El rastro del juez: estado, sha256, muestras, aciertos, causa. | «judge sin rastro» = rojo. La forma del hash no acredita calibración: se revisa aparte. |
| **arnés / harness** | tier, donde, modelo, modo, hash, build, configuración — todos obligatorios. | El productor sin digest se rechaza ANTES de inferir. |
| **digest / sha256** | La huella del artefacto. | Se mide, no se declara: el hash no se inventa desde su tag. |
| **charter / cédula** | Credencial de identidad firmada (Ed25519). | El Worker verifica; JAMÁS firma. Solo escribe hashes a D1. |

## 5 · Infraestructura y el ojo

| Término oficial | Qué es | Cómo se usa al instruir |
|---|---|---|
| **the Rack** | La máquina del laboratorio. Casa de los bucles locales y del Register. | Push jamás a jetson; los nombres privados viven dentro del rack. |
| **loopback (127.0.0.1)** | Solo local; jamás cola afuera. | «Sirve en 8807» = loopback; nada público sin FIRMO aparte. |
| **the Eye (8807 + S110)** | Tu puerto visual: donde miras lo servido antes del pulido. | «Sácalo al ojo» = servir en 8807 y vivirlo en el S110 con scrcpy. |
| **PWA / service worker** | La web instalable con shell offline en 9 lenguas. | La web ya es PWA (medido); lo que falta es TWO-CLICK, el camino de 2 gestos a la app local. |
| **worker (Cloudflare) + D1** | La aduana: verifica cédulas con tu clave pública y escribe solo hashes. | Despliegue = NO_DATA hasta FIRMO aparte; el worker jamás firma. |

## 6 · Del corpus de manifiestos de octubre (relectura inversa del 18-oct · PROPUESTA salvo lo medido)

| Término | Qué es | Cómo se usa al instruir |
|---|---|---|
| **countersign (contrafirma)** · PROPUESTA | El gesto mutuo del juego: el atacante firma el desafío; capturar más de un edificio NPC exige firma conjunta de 2+ nodos. | NO es sign-off (tu decisión) ni signature (la cédula Ed25519): tres palabras, tres actos. |
| **telemetry · measurement · receipt** | Telemetría = auto-reporte declarado, viaja con stamps («el sonido ES la telemetría»; modo avión: NO_DATA sin voz) · medición = lo que pasó la vara · recibo = solo forma. | Toda cifra declara de cuál de los tres salió; la Radio del Estado solo narra telemetría con stamps. |
| **privilege levels (N0–N4)** | La escalera de acceso de la casa; N0 = visitante sin clave (ya vivo en la web). | Jamás mezclar con los tiers: N0–N4 es privilegio, tier 1/2 es decisión. |
| **policy vs engine** | La fábrica de contratos: un motor fail-closed puro + políticas JSON cerradas («cuando firmas una tabla de umbrales, cambias un JSON, no ocho cerebros»). | Pedir política nueva = un JSON; pedir motor nuevo = pieza con su guardián. |
| **one state, many renders** · PROPUESTA | Si el taller y el mapa leen almacenes distintos, el contrato se rompió (hallazgo firmado del canal N1, 2026-10-12). | Un estado, muchas proyecciones (líneas/sonido/color por la misma causa); dos fuentes = defecto. |
| **consult, don't remember (R-D1)** | Toda afirmación sobre lo firmado en el pasado sale de lectura a disco (fichero+símbolo+línea) o es NO_DATA con causa. | «El preceptor no recuerda: consulta» — el contexto de un modelo no es un archivo; rige también al compactar. |
| **los canales del bus** | thegame-estado · thegame-taller · boya · radio-estado · mapa · terminal-cangrejo · thegame-batalla (medidos en la web). | Cada panel declara canal y estado LIVE/STALE(+Δ)/NO_DATA; canal nuevo se acuña, no se improvisa. |

**Los 9 objetos del corpus son leyes con cuerpo de juego** (4 de 9 HECHOS en la web; 5 sin revelar = NO_DATA; nombres EN PROPUESTOS para THE LEXICON §C, regla del Alfabeto): Boya del Estado → **the State Buoy** (Proof of Tick; stamps como máquina de estados medida: «alive: measured · fading: no news · NO_DATA · desatendido 132 tics») · Observatorio → **the Observatory** (lo visto envejece hacia NO_DATA: STALE jugable) · Arrecife de las Lápidas → **the Reef of Gravestones** (retención cero CON recibo: la Necrópolis con cara de juego) · Cristal de Latencia → **the Latency Crystal** (el bench del visitante: oro/plata/bronce/dithering — clase de hardware, no estante de cuarentena).

---

**Las 8 confusiones que más duplicados han creado** (memorízalas primero):
1. **Ledger ≠ Register** — rondas de la Mesa vs registro criptográfico del rack.
2. **sign-off ≠ seal** — tu decisión vs la letra-código de la Mesa.
3. **receipt ≠ entry** — mensaje de vuelta vs registro numerado del Register.
4. **SIMULATED ≠ MEDIDO** — fixture sintético vs medida real con vara.
5. **PR ≠ merge** — la propuesta abierta vs el acto de entrarla en main (solo con tu FIRMO).
6. **sign-off ≠ signature ≠ countersign** — tu decisión vs la cédula cripto vs la contrafirma mutua del juego.
7. **privilege levels (N0–N4) ≠ decision tiers (1/2)** — escalera de acceso vs escalera de decisión.
8. **telemetry ≠ measurement ≠ receipt** — auto-reporte declarado con stamps vs lo que pasó la vara vs la forma de vuelta.

**Fuentes medidas:** `docs/lexicon.md` (PR #162) · dirimencias #38–#42 · recibos de ambos preceptores · merges #158–#161 · glosario del ojo · Alfabeto del rack · relectura inversa del corpus de manifiestos de octubre (2026-10-18). Todo término de esta lista ya existe en el proyecto: **ninguno es nuevo, por eso ninguno crea duplicados**; los de la sección 6 existen medidos en el corpus — sus nombres oficiales esperan tu FIRMO antes de servir código con ellos. **Techo de pieza:** ≤ 16.384 B, verificado.
