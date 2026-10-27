# New_Naming_Proposal · PROPUESTA Mistral · 2026-10-15

Estado: **PROPUESTA — sin firma del Soberano; sin renombre aplicado.** Los renombres los ejecuta Codex tras FIRMO. Los números J (J1–J15) viven solo en este documento y en docs/mesa/PARA_LA_MESA.md: jamás van al código. Cero red, cero datos personales, piezas <16 KiB, inglés primero en UI, 1 cambio por pieza.

Regla FIRMO del vocabulario: cada nombre de código y UI debe poder leerse en dos claves a la vez — la humana (lore, castellano amable) y la de silicio (EU AI Act + matemática). Anclajes citados: CELEX (AI Act), ISO, W3C, RFC y conceptos matemáticos con nombre propio.

---

## 0 · Renombre ya firmado, pendiente de ejecutar (no se decide aquí; solo se recoge)

| Nombre actual | Dónde | Propuesto | Anclaje | Por qué |
|---|---|---|---|---|
| Forest incubator | ficha de la casa/expedición Bosque (`public/game/casa-lateral.js:10`, montaje en `casa-medidas.js`) | **WavesCraft** | — | Ya firmado por el Soberano. Ninguna acción mía: lo ejecuta Codex. |

## Choque abierto conocido (decisión pendiente)

**«Echoes» tiene hoy dos dueños:**
1. Pestaña del panel de comunicación (`public/assets/radio_message_log.js:117` — `['echoes', T('channel_echoes', 'Echoes')]`), con NO_DATA medido en la línea 100.
2. Pieza del mapa de nombres J11 «Echoes & Residue» (docs/mesa/PARA_LA_MESA.md:459) — el taller de disolución y lija (`ui-taller.js`, `primer_eco.js`).

Mi recomendación: renombrar la **pestaña** y conservar «Echoes & Residue» para la pieza J11, porque J11 ya está en el mapa firmado de piezas y moverlo rompería el mapa; la pestaña es un canal de comunicación y tiene mejor anclaje legislativo propio.

---

## 1 · Inventario de nombres con propuesta (uno a uno, para FIRMO individual)

### 1.1 Pestaña «Echoes» → «Transparency Log» (canal del panel de comunicación) · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex. J11 «Echoes & Residue» queda intacto.**
- **Actual:** `Echoes` — `public/assets/radio_message_log.js:117` (etiqueta) y `:100` (NO_DATA del canal).
- **Propuesto:** `Transparency Log` (UI en inglés; castellano del canal: «Registro de transparencia»).
- **Anclaje:** EU AI Act, CELEX 32024R1689, Art. 70.2 (obligación de documentación y transparencia para sistemas de IA de riesgo limitado) + W3C PROV (trazabilidad de datos).
- **Por qué mejora la doble lectura:** humano: dice exactamente qué es (lo que el arrecife ya dijo, con sello y fuente, visible para todos). Silicio: es el término literal del artículo 70.2; un auditor de la AI Act lo encuentra sin diccionario. Y desactiva el choque con J11 sin tocar el mapa firmado.

### 1.2 «GACHA ARMONICO» → «Deterministic Summon» (encabezado y semilla) · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `el GACHA ARMONICO` — `public/game/gacha.js:1` (cabecera del módulo; la pestaña usa sus reglas).
- **Propuesto:** `Deterministic Summon` (UI); el módulo en código puede pasar a `deterministic_summon.js` cuando Codex lo ejecute.
- **Anclaje:** concepto matemático: función determinista (misma semilla e input = mismo resultado) + AI Act Art. 50 (interacción con sistemas de IA: sin engaño). «Gacha» arrastra la lectura de FOMO/loot-box que los cercos prohíben.
- **Por qué:** humano: invocas lo que ves, sin ruleta oculta. Silicio: «deterministic» es el término técnico que ya usan los recibos de la casa; «gacha» en cambio es vocabulario de azar comercial, justo lo que la AI Art. 50 y los cercos quieren evitar. Nota: el propio gacha.js ya declara «NO ES UN VRF, y se dice» — la honestidad ya está; el nombre debería decirla también.

### 1.3 «juez» (pestaña/módulo) → «Replay Verdict» / mantener `juez.js` en código · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `el JUEZ` — `public/game/juez.js:1`.
- **Propuesto:** UI: `Replay Verdict`; el fichero puede seguir como `juez.js` (castellano, ya citado en recibos) — solo cambia la etiqueta visible.
- **Anclaje:** concepto matemático: verificación por repetición (reproducibilidad determinista, cf. ISO/IEC 25010 fiabilidad) + AI Act Art. 86 (derecho a explicación de decisiones individuales: el veredicto no es opinión, se reejecuta).
- **Por qué:** humano: explica qué hace (vuelve a jugar la partida y compara). Silicio: «replay» + «verdict» son términos auditables; «juez» en inglés no existe y obliga a traducir. Riesgo bajo: es etiqueta, no contrato.

### 1.4 «sobres» → mantener en castellano, UI: «Signed Envelopes» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `los SOBRES firmados` — `public/game/sobres.js:1`; la UI ya los firma con Ed25519.
- **Propuesto:** UI: `Signed Envelopes`; `sobres.js` se queda (castellano del contrato `atlas.sobre/1`, ya citado en recibos).
- **Anclaje:** RFC 9582 Ed25519 (firma de los sobres) + AI Act Art. 70.2. «Envelope» es el término de correo/interoperabilidad desde RFC 822.
- **Por qué:** humano: «sobre firmado» ya se entiende; en inglés UI gana precisión. Silicio: firma + secuencia + hash encadenado son legibles para un auditor RFC. No hay urgencia: es cosmético si la UI ya lo dice bien; pongo prioridad baja.

### 1.5 «mercado» → mantener en código; UI: «Trade Currents» (ya firmado J3 del mapa)
- **Actual:** `el MERCADO entre personas` — `public/game/mercado.js:1`; J3 «Trade Currents» en el mapa de nombres (docs/mesa/PARA_LA_MESA.md:459) ya lo cubre.
- **Propuesto:** ninguno nuevo. Recojo solo que **J3 ya ancla esta pieza** y que `mercado.js:5` ya dice «nunca dinero real ni cripto ni una moneda nueva» — el cerco del vocabulario ya está en el contrato.
- **Por qué:** no duplico lo firmado. Lo marco como «recogido, sin acción».

### 1.6 «latency_crystal» → «Latency Crystal» mantiene ficha, cambia el lore a «fósil de medidas» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `public/game/latency_crystal.js:3` — ya dice «Registros fósiles de como se comporta el render (...) no moneda: evidencia» (J-TG-10).
- **Propuesto:** mantener el nombre del fichero; en UI, traducir la ficha como «Latency Crystal (fossil evidence)» y NO usar «token» en la descripción visible.
- **Anclaje:** AI Act Art. 70.2 + concepto matemático de medida (evidencia vs. valor). ISO/IEC 25010 de nuevo.
- **Por qué:** el nombre ya es bueno; solo pido que la UI nunca diga «token» (palabra prohibida por cercos) cuando muestre tok/s medidos — «measured tokens/second» o «words/second» en su lugar. Este es el único ajuste.

### 1.7 «oraculo» (comentario interno) → «verificador» / «comparador» · **FIRMADA 2026-10-15 (noche) por el Soberano — pendiente de ejecución por Codex.**
- **Actual:** `public/game/gdpr-art25-ephemeral-crab.js:70` — comentario: «Huella de un paseo: lo que el oraculo compara entre aparatos».
- **Propuesto:** comentario → «lo que el comparador de huellas verifica entre aparatos»; y en cualquier UI futura, el mismo cambio.
- **Anclaje:** GDPR (Reglamento UE 2016/679, Art. 25 privacidad desde el diseño — ya en el nombre del fichero) + concepto matemático: verificación de igualdad (el término «oráculo» en computación es legítimo, pero el cerco prohíbe la palabra en código y UI).
- **Por qué:** es la única aparición de palabra prohibida que encontré en código servido; el resto de hits son negaciones («sin moneda», «nunca dinero real», regex de bloqueo). Cambio de una línea de comentario cuando Codex lo ejecute; cero riesgo.

### 1.8 «Forest incubator → WavesCraft» ya cubierto (0): sin duplicar decisión.

### 1.9 «Workshop dust» → mantener; recoger su anclaje ya implícito
- **Actual:** `public/game/ui-taller.js:142` — «Workshop dust» y «Static residue» como moneda interna del Taller.
- **Propuesto:** ninguno. J12 «Tuning» del mapa firmado ya ancla la pieza; «dust/residue» son recursos del motor, no dinero, y el cerco de «moneda» se cumple porque no son intercambiables fuera del Taller.
- **Por qué:** no toco lo que ya está firmado y es coherente. Prioridad informativa.

---

## 2 · Resumen para la firma (uno a uno)

**FIRMADAS 2026-10-15 (noche):** 1.1–1.8 (FIRMO total del Soberano). 1.5 y 1.8 ya estaban recogidas sin acción. Todas pendientes de ejecución por Codex; ninguna aplicada.

| # | Cambio | Fichero/línea | Riesgo | Mi recomendación |
|---|---|---|---|---|
| 1 | Echoes (pestaña) → Transparency Log | radio_message_log.js:117 | Bajo (etiqueta + ARIA) | Sí, resuelve choque J11 |
| 2 | GACHA ARMONICO → Deterministic Summon | gacha.js:1 + UI | Medio (nombre de pieza con recibos) | Sí, alinea con cercos AI Act 50 |
| 3 | JUEZ (UI) → Replay Verdict | juez.js:1 solo etiqueta | Bajo | Sí |
| 4 | sobres (UI) → Signed Envelopes | sobres.js:1 | Bajo | Opcional, prioridad baja |
| 5 | mercado | mercado.js:1 | — | Recogido en J3, sin acción |
| 6 | latency_crystal: quitar «token» de UI | latency_crystal.js:3 | Bajo | Sí (palabra prohibida en UI) |
| 7 | oraculo (comentario) → verificador | gdpr-art25-ephemeral-crab.js:70 | Bajo | Sí (palabra prohibida en código) |
| 8 | Forest incubator → WavesCraft | casa-lateral.js:10 | Ya firmado | Solo lo ejecuta Codex |

Los J1–J15 del mapa firmado no se tocan ni se renumeran aquí.

## 3 · NO_DATA (con causa)

- No encontré «Echoes & Residue» como fichero ni función: vive solo como entrada del mapa de nombres J11 en docs/mesa/PARA_LA_MESA.md:459. La pieza real son `taller.js`/`ui-taller.js`/`primer_eco.js`. Si el Soberano quiere renombrar la pieza J11, es decisión nueva, no de esta propuesta.
- No pude medir si `preceptoros-2026-17-abho` está ya en el repo: el espejo dice `abgm` (docs/mesa/PARA_LA_MESA.md, cierre OCEANO). Si `abho` está desplegado, su recibo vive en el rack: NO_DATA aquí, confirmado por la Mesa como en producción.

---

## 4 · Anchored Naming · capa de gobernanza sobre la Estrella Hexelion (canon ideas13oct)

La Estrella — el Diccionario Soberano Vivo (`public/dictionary.json`, esquema `preceptoros.dictionary/1`, 43 entradas públicas, anclajes abiertos, D67 filtrado) — es el vocabulario; esta sección es su capa de gobernanza para los nombres de mi ronda. No decido adopción: alineo cada entrada 1.2–1.8 con su TÉRMINO ESTÁNDAR y su ANCLAJE ABIERTO tal como vive en el diccionario. Lo que no tiene anclaje se declara NO_DATA con causa; no se inventa.

| Entrada | Nombre propuesto | Término estándar (Estrella) | Anclaje abierto | Estado |
|---|---|---|---|---|
| 1.2 | Deterministic Summon | Hidden Seed ya cubre el VRF; el gacha determinista se alinea con **Deterministic State Machine** (A7 Steady Current) | IETF-RFC-9381-ECVRF, IEEE-1516-HLA-Lockstep, Lamport-State-Machine-Replication | PROPUESTA |
| 1.3 | Replay Verdict | **Empirical Ablation Loop** (C26 Question Loop) + Human Hand (D33) | Popperian-Falsifiability, EUR-Lex-CELEX:32024R1689-Art14 | PROPUESTA |
| 1.4 | Signed Envelopes | **Cryptographically Signed Ingress Packet** (B19 Signed Note) | IETF-RFC-9421, detached-Ed25519-payload | PROPUESTA |
| 1.5 | (recogido en J3) | **Data Governance** (D37 Root Garden) | EUR-Lex-CELEX:32024R1689-Art10 | ya cubierto |
| 1.6 | Latency Crystal (ficha sin «token») | **Automatic Logging** (D35 Memory Log) + Data Protection by Design (D44) | EUR-Lex-CELEX:32024R1689-Art12, EUR-Lex-CELEX:32016R0679-Art25 | PROPUESTA |
| 1.7 | verificador (ex-oraculo) | **Measurable Explainability** (D45 Explainable Star): verifica, no profetiza | IEEE-Std-7001-2021, IEEE-P7003 | PROPUESTA |
| 1.8 | WavesCraft (firmado) | NO_DATA (con causa): no existe aún entrada de la Estrella para la incubadora; su anclaje propio (AI fluency + C23 Symbiotic Agency) queda propuesto para una futura entrada, decisión del Soberano | — | FIRMADO, anclaje abierto |

G2/G3 ya usan este vocabulario: firma = **Cryptographic HITL** (B13 Human Key, IETF-RFC-8032, NIST-SP-800-63B); recibo = **Attestation Receipt** (B17 Proof Pebble, IETF-RFC-9334-RATS); cerco D67 = **DLP Air-Gap** (B14 Blue Shield, NIST-SP-800-53-SC-7); NO_DATA = **Epistemic Humility** (C24 Honest Fog, Kleene-Three-Valued-Logic); la Mesa = **Multi-Agent Debate** (C25 Council Circle, arXiv:2305.14325).

**NO_DATA (causa):** las entradas 1.2–1.7 citan anclajes que ya viven en `public/dictionary.json` (verificado hoy en el repo); cualquier anclaje adicional no presente en la Estrella no se inventa aquí.
