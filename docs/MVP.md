# MVP — the minimum PreceptorOS, drawn in its own idiom

State: **PROPOSAL** (propose-only · the silicon writes, the Sovereign signs).
Date: 2026-10-19 · base `eac293d` (main `9a72d4d` + the `haiku/huecos-ci` lot).
Machine twin: `atlas/mvp_mapa.json` · judge: `node atlas/mvp_casos.mjs`.

## ES · una pantalla para el carbono

- **Qué es:** el MVP como un mapa de 17 funciones (13 web, 4 app). Cada una
  lleva sello (LIVE · STALE · STATIC · SIMULATED · NO_DATA · ERROR), causa si
  no es LIVE, sus ficheros reales y el comando que la juzga.
- **Primero la web, después la app.** Hoy: 8 LIVE, 5 NO_DATA con causa, 4 STATIC.
- **Techos medidos, con contraprueba que se pone roja** (9 de 9 sabotajes en
  rojo): pieza ≤ 16.384 B (máx. hoy 16.365) · canal < 1.024 B (S_t 466 B; el
  gordo se rechaza entero) · carga inicial 71.277 B gzip < 153.600 · cero
  peticiones externas al cargar (0) · 9 lenguas verificadas.
- **Un mini local lo orquesta:** tres comandos, recibo < 1.024 B, sin frontera.
- **Hallazgo grande:** CI corría 5 de 22 guardianes `tests/` (1 directo, 4 vía
  `test_atlas`); este lote los mete todos (179 casos, 0 fallos, n=2 en 45 s).
- **Firmas para llegar al MVP web: tres.** F1 este lote (con `huecos-ci`),
  F2 el sello de la presentación (ya pedido), F3 el sello de «Questions???».
  Las decisiones de fondo (abrir lenguas del juego, motor A o B) van aparte.

## 1 · The idiom (AI-fluency of PreceptorOS)

Three rules make a function legible to a human and to an 8K local model alike:

1. **Every value wears a seal.** Six canonical seals; anything not LIVE
   carries its cause. A missing value is `NO_DATA: <cause>`, never a guess.
2. **Every ceiling is a number with a judge.** A ceiling without a case that
   turns red is a wish, not a law.
3. **Every state fits the channel.** One packet < 1,024 B, rejected whole above.

## 2 · The ceilings, measured

| Ceiling | Measured today | Judge (case) | Red shown by sabotage |
|---|---|---|---|
| Piece ≤ 16,384 B, every served text file | 207 files, max `atlas-en.json` 16,365 B | `mvp_casos` C4 | a 16,400 B file |
| Channel < 1,024 B (RC-07) | S_t 466 B; oversize closes at 960 B | C5 + `vector_casos` | `TOPE` 1024 → 4096 |
| Initial load < 153,600 B gzip | 71,277 B (`atlas/mundo.py`) | C6 | +200 KB in `thegame.css` |
| Zero external requests at load | 0 tags, 0 `fetch`/`import` | C7 + `test_web` | one CDN `<script>`; one `fetch` |
| Nine languages, true to the tree | 9 portals, 9 game texts, loader `en` | C8 + `LANGUAGES.md` | loader `['en','es']` |
| Every judge runs in CI | 13 web judges, all run by CI | C3 | drop a judge line |
| Map readable by an 8K mini | map < 8,192 B, rows < 1,024 B | C1 | a seal without cause |

The 16,384 B piece ceiling is the Sovereign's 2026-10-19 mission; the gate's
`TOPE_FICHERO` is 25 MiB per block (D2, 2026-10-11). Both stand; the gap is
proposed as **RC-17**.

## 3 · S_t, the state vector, legible

`public/game/state_vector.js` (`preceptoros.vector/1`) already exists; the MVP
joins it, it does not rebuild it. Keys:

| Key | Meaning | When missing |
|---|---|---|
| `c` | game cycle (the clock is the equation) | `nd.c` cause |
| `r` | resources [copper, light, biomass, oxygen] | `nd.r` names the missing one |
| `k` | crab [x, y, army, swim, reach] | `nd.k` |
| `p` / `t` | open panel [id, seal, age] / tutorial step | null = closed / done |
| `e` / `l` / `n` | buildings / places fought / rack nodes measured | empty list |
| `z` / `q` / `g` | tombstones / radio last 3 / last panel transition | null or empty |
| `nd` | `{key: cause}` for everything missing | always present |

Packing: under 1,024 B → `completo`; over → radio and places trimmed →
`recortado`; still over → `fail-closed`, a NO_DATA vector with the cause and
no partial state.

## 4 · The map of functions (web first, then app)

| ID | Function | Seal | Cause / note |
|---|---|---|---|
| W1 | door, initial load under the gzip ceiling | LIVE | |
| W2 | S_t vector, rejected whole at the channel ceiling | LIVE | |
| W3 | seal palette | LIVE | 7 web seals, STATIC has no colour (RC-18) |
| W4 | the Descent, bubble language | LIVE | |
| W5 | A11Y four channels | NO_DATA | no four-channel parity case yet |
| W6 | nine languages | LIVE | game loader `en` only, a fence |
| W7 | «Questions???» at the end of the rift | NO_DATA | waits the sealed presentation lot |
| W8 | Easy Start A, browser model | NO_DATA | no chunked model in any repo |
| W9 | Easy Start B, Hexelion node | NO_DATA | fetch to the rack waits sign-off |
| W10 | zero external requests at load | LIVE | |
| W11 | piece ceiling | LIVE | |
| W12 | visiting AIs (`llms.txt`, MCP manifest) | STATIC | manifest not served, 4,008 B |
| W13 | D1 guardian | LIVE | |
| A1 | api-guia layer 1, read-only guard | STATIC | other repo, read at `88aedec` |
| A2 | channel events, seals and bytes | STATIC | 6 app seals differ (RC-18) |
| A3 | `RACK.md` TTL and STALE | NO_DATA | Codex piece P08 |
| A4 | 1 app = 1 node | STATIC | other repo, read at `88aedec` |

App rows are read, never touched, from this repo: the app is its own tree
(measured ruling, issue #38: the web does not touch the app).

## 5 · How a small local model runs it

No frontier model is needed to keep the MVP honest:

```
node atlas/mvp_casos.mjs            # whole map → one receipt < 1,024 B
node atlas/mvp_casos.mjs --fila W7  # one row → one packet < 1,024 B
<the row's "juez">                  # exit 0 = green, anything else = red
```

The mini reads a row, runs its judge, reports the exit code. It decides
nothing: the judge is deterministic, the seal is in the file, the cause is
written. A red goes to the Command as a receipt; the carbon signs.

## 6 · The pieces joined, not rebuilt (quarry)

| Need | Found | Where |
|---|---|---|
| state vector S_t | yes, live | `public/game/state_vector.js`, `atlas/vector_casos.mjs` |
| seal colours | yes, live | `public/game/tabla_semantica.js` |
| door weight | yes, live | `atlas/mundo.py` `gzip_juego()` (called, not copied) |
| brain picker (browser GPU / browser Prompt API) | yes, archived | `public/assets/engine.js` at `84621c2^` |
| visitor's own local model (loopback) | yes, archived | `public/assets/localai.js` at `84621c2^` |
| chat turn and router | yes, archived | `chat.js`, `chat-router.js` at `84621c2^` |
| measured brains and the browser mini | yes, live | `public/cerebros.json` (`navegador`, `pisos`) |
| «Questions???» texts, chunked model < 25 MiB | NO_DATA | not in the rack nor in 7 repos (measured 2026-10-18) |
| seal compatibility matrix (RC-07) | NO_DATA | not in web nor app; draft in §8 |

The archived chat carries Spanish comments and lived under the old 10 KiB
law: it returns through the D1 scrub and the 16,384 B case, piece by piece.

## 7 · Landing with the fewest signatures

| Sign-off | What lands | Touches `public/` | State |
|---|---|---|---|
| **F1** | this lot + `haiku/huecos-ci` (stacked, one reading) | no | REQUIRES_FIRMO |
| **F2** | presentation seal `abiw` (rift: falls → finds) | yes | already asked in Command #14 |
| **F3** | «Questions???»: trigger after RIFT, the nine-language selector, Easy Start honest panel | yes, one seal | to build after F2 |
| D1 | open the game loader beyond `en` | yes | decision, a fence today |
| D2 | Easy Start A: host a chunked model, or the visitor's browser Prompt API only | yes | decision |
| D3 | Easy Start B: the Hexelion node on click, via the admitted tunnel | yes | decision |
| D4 | RC-17, RC-18, RC-19 | no | seeds in `DISAGREEMENTS.md` |

F3 is built on the quarry of §6, not from zero: the trigger reads the rift's
final page; the selector reuses the nine portals; Easy Start shows each engine
with its seal — the visitor's own browser model or loopback model when the
device answers, the node only if it answers LIVE, otherwise `NO_DATA` with the
cause. Nothing is fetched at load: every engine waits for a click.

**Then the app** (after the web closes F1–F3): A1–A4 rows, and Codex's pieces
P02 (schemas), P03 (SSHSIG), P08 (TTL), each with its own judge row added here.

## 8 · Seal matrix (draft for RC-18)

| Canonical (P02) | Web `tabla_semantica.js` | App `canales.py` |
|---|---|---|
| LIVE | LIVE | MEDIDO |
| STALE | STALE | — |
| STATIC | — (painted neutral) | — |
| SIMULATED | SIMULATED | EMULADO |
| NO_DATA | NO_DATA | NO_DATA |
| ERROR | ERROR | — |
| *(governance axis)* | PROPUESTA, FIRMADO | PROPUESTA, REQUIERE_FIRMA, DECLARADO |

Proposal: the six describe **data**; proposal, signature and declaration
describe **governance**. Two axes, not one list of nine. Codex's matrix
(RC-07) decides; this is a draft for it.

## 9 · What this lot does not do

It does not touch `public/`, the service worker, the seal or the engine
(`atlas-motor.js`, `core.js`). It does not build «Questions???» (F3). It does
not download a model. It does not fetch the rack. It does not edit RC-07; it
proposes RC-19 beside it.
