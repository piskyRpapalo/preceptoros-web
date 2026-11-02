# acho-interpreter

Date: 2026-11-02
Law: Comisión ACHO (the Mesa, under the Sovereign's verbal decree of 2026-11-02: the interpreter of the bubble language is called **Acho**). Plan mode: propose-only, zero code. Status: **PROPOSAL · REQUIRES_SIGNATURE**, piece by piece. Audited and accepted as base by the Mesa (2026-11-02, findings 1-2 re-measured on `5406d6bd`).

**Name decree (after the first draft).** The Sovereign removed «bubble» as a name: the language and everything about it is **Acho** from today. «bubble» stays only as a historical name in old receipts (precedent faro→Actions), never re-coined. Below, `bubble_*` paths are cited as they are on main today.

## Objective

Acho is the interpreter of the bubble language already signed (`docs/bubble-language.md`, `preceptoros.bubble/1`). It gives a preceptoros agent in OpenWorld **eyes** (evaluate a frame into picture + sound + alt text) and **hands** (validate a frame the agent writes, signed, and let it live on the map). The schema is renamed with the language (AC-0); its old seal `preceptoros.bubble/1` becomes a historical alias.

## Problem and why

The pieces exist but are spread: the compiler (`bubble_language.js`), the gate (`checkFrame`), the sound (`bubble_sonify.js`), the seeds (`bb_det.js`), the seal table (`tabla_semantica.js`). No single pure core takes a frame and returns *one* verdict + *one* evaluation an agent can rely on, and there is no path for an agent's own frame to reach the map.

## Step 1 · Inventory measured (main `5406d6bd`, fetched 2026-11-02)

| piece | where · lines | covered by | what Acho absorbs |
|---|---|---|---|
| compiler | `public/game/bubble_language.js` · 319 | `atlas/bubble_language_casos.mjs` · 302 | `compile`, `wavePoints`, `smoothPath`, `hash32`, `rng` → the evaluator (eyes, visual) |
| app copy | `p0x/preceptor` `interface/face/bubble/bubble_language.js` · 319 | `cmp` = **identical** | proves the two-terminal pattern already works |
| the gate | `atlas/param_gate.mjs` `checkFrame` (l. 89) · 259 | `frame_seal_casos`, colony gates | the customs of the language: < 1,024 B (`Buffer.byteLength`), reader fields, seal |
| native sound | `public/game/bubble_sonify.js` · 70 | `bubble_sonify_casos.mjs` | eyes, audio: recipe `vozDe` (carrier 110 Hz, PENTA_V) from the frame's own harmonics |
| seeds | `public/game/bb_det.js` · 47 (xorshift32) + `bb_canon.js` · 25 | `bb_lote1_casos.mjs` | see FINDING 2 |
| seal table | `public/game/tabla_semantica.js` · 62 (HUE/SAT/LUZ, DERIVADOS pulso/feedback) | `tests/tabla_semantica.test.mjs` | state → band/pulse for seal-bearing frames |
| pure-core pattern | `public/game/combate_ticks.js` · 137 | its cases | the shape to copy: no DOM, no net, no clock, no random |
| colony frames | `public/game/colonia_pagina.js` · 243; `atlas/puros/colonia_pagina_casos.mjs` · 126 | `colonia_pagina_gate.mjs` | first producer of frames from live state |
| world state | `public/openworld/estado.json` (`preceptoros.openworld-estado/2`): 4 colony nodes, 3 buildings, `units: []`, top `nodes: []` | IC1-IC7 gates | where an agent's frame would be anchored |
| customs page | `public/assets/aduana_page.js` · 31 | `tests/aduana_page.test.mjs` | sending is **asleep** (registry `NO_DATA`); nothing leaves the page |
| crab signature | app `cuenta_cangrejo.py` (`ssh-keygen -t ed25519`, `firmar`, `_verify`) + web `atlas/mp_firma.mjs` (node:crypto, deterministic test keys) | `test_cuenta_cangrejo.py`, `tests/hitl_firma.test.mjs` | hands: who wrote the frame |
| `fourier-shapes.js`, `render_seed.js`, `audio-engine-core.js`, `audio-engine-recipes.js` | **not in either repo.** Only in the local quarantine `Cuarentena/TheGame.v1.1/` (outside the repo) (215 / 32 / 169 / 190 lines) | none | see FINDING 3 |

### Findings (each one a correction of the commission, declared)

1. **There is no binary mould.** The canon frame is **JSON**, < 1,024 UTF-8 bytes, checked by `checkFrame`. `docs/bubble-language.md` has no bit layout, no field offsets, no byte order. «The mould» = the key table of §2 + `checkFrame`. Drawing a bit layout now would be redesigning the canon, which the commission forbids. Checklist point 2 is answered as **NO_DATA: the canon has no binary layout; the mould is the JSON schema**.
2. **Two seed engines coexist.** The spec (§5) fixes FNV-1a + mulberry32 for frames; `xorshift32` lives in `bb_det.js` (the `bb_*` lot). Changing the frame's engine changes every picture. Proposal: Acho keeps §5 for frames (same pixels), cites `bb_det` only for `bb_*` words. **REQUIRES_SIGNATURE.**
3. **The Fourier form and the FM engine are quarantine, not live code.** `fourier-shapes.js:181-187` (`r(θ)=Σ a·sin(kθ+φ)`) is already covered in the live house by `wave` (`AtlasGacha.punto`). The FM bug is **confirmed**: `audio-engine-core.js:106-108` connects `modGain1/2` to the carrier, but no line connects the modulator oscillators to those gains — FM is silent. Live sound today is `bubble_sonify.js` (→ `acho_sonify.js` in AC-0), which does not carry the bug. Proposal: **do not port** the quarantine engine; if the 220+(hue/360)·660 Hz recipe is wanted, it enters as one pure function with a case that proves the modulator reaches the carrier.

## Step 2 · The plan answers

1. **Pure core** `acho.js` (proposal): `valida(frame) → {ok, bytes, causas}` (wraps `checkFrame` rules, no `Buffer`: `TextEncoder`-free UTF-8 count so it runs in the browser too) · `evalua(frame, p) → {items, voz, alt}` (`compile` + `bubble_sonify.recipe` + `alt` from `r`/`change`/`seal`) · `huella(frame) → hash32` over the canonical item list. Judge: same frame → same `huella`, two passes byte by byte. No DOM, net, clock, random. Quarantine: < 350 lines or fission. Estimate: ~150 lines, because it composes, it does not rewrite.
2. **Mould**: NO_DATA (finding 1). The mould is the JSON key table, renamed in AC-0, otherwise frozen.
3. **Hosts**: web `/openworld/` paints `items` (canvas), plays `voz` (Web Audio), writes `alt` to a live region. App: same file, byte-identical copy. **Home of the source (REQUIRES_SIGNATURE):** `atlas/puros/acho.js` with copies in `public/game/` and `interface/face/bubble/`, parity by `cmp` (the house pattern, already working for `bubble_language.js`).
4. **Eyes and hands, measured:** *eyes* exist today in pieces (compile + sonify on `/openworld/`); missing: one call that returns all three and alt text. *Hands* do not exist: the customs sending is asleep, `units: []`, no field in `estado.json` holds a foreign frame, and verifying Ed25519 in the browser is NO_DATA (only node:crypto and ssh-keygen are measured). Pieces needed: an envelope `{frame, autor, firma}` verified **server-side** (crab account), and a `frames` slot in the state. Both REQUIRE_SIGNATURE.
5. **Silicon door** (separate phase): `acho.valida` as the only judge. Metric: **conformity rate** = valid frames on the first try / attempts, over a fixed bank of 20 prompts, mini models 1B/3B on the Doogee. Gate: rate reported with model tag, backend and n; no threshold until a first measurement exists (NO_DATA today).
6. **WASM**: NO_DATA until a phone measures JS too slow. Out of v1.
7. **Ladder** (one piece per PR, its own FIRMO, never bundled).

## Checklist

- [ ] AC-0 · the rename bubble → Acho. Scope measured on `5406d6bd` (2026-11-02): `preceptoros.bubble/1` in **62** files (the Mesa counted 61; same sha, re-measure at execution), **14** served under `public/`; **9** `public/game/bubble_*`; 2 canon docs. The word «bubble» appears in **195** files (39 under `public/`): a seal-only rename leaves ~130 live mentions, so AC-0 lists them and classifies each (rename / historical / out of scope). Reseal with a new letter + cascade world → counters → fingerprint; deploy after FIRMO. **Not executed today.** Rail: shares `public/` with the Terminal Familia train (TF-1/TF-2): **TF goes first**; the seal letter goes to whoever merges first; never two live PRs resealing the same tree. The Mesas administer the letters; this PR only declares that AC-0 reseals.
- [ ] AC-0b · coinage: entry «Acho» in `docs/lexicon.md` with the decree receipt and the historical alias «bubble». Without it the rename is not canon.
- [ ] AC-0 · this plan signed (and the decisions D1-D3 below).
- [ ] AC-1 · `acho.valida`: pure validator, browser-safe byte count; gate: every case of `frame_seal_casos` + `bubble_language_casos` gives the same verdict as `checkFrame` (parity table).
- [ ] AC-2 · `acho.evalua` + `huella`: gate: 2 passes, identical `huella`, over all frames of the Codex and colony; pixels unchanged (contact sheet).
- [ ] AC-3 · alt text: gate: every evaluated frame gives non-empty `alt`, ≤ 280 chars, with seal word.
- [ ] AC-4 · web host on `/openworld/`: eyes wired; gate: 16 KiB page ceiling, a11y measure unchanged or better.
- [ ] AC-5 · app host: byte-identical copy; gate: `cmp` three copies + app test.
- [ ] AC-5b · measure Ed25519 verify with WebCrypto on the Doogee (browser, real phone) **before** AC-6; NO_DATA today.
- [ ] AC-6 · signed envelope (hands), verify server-side with the crab account; gate: valid / tampered / foreign-key cases. Stays asleep until the registry is LIVE.
- [ ] AC-7 · conformity bench (silicon door); gate: reported rate, model tag, backend, n.
- [ ] AC-8 (optional) · FM recipe fixed, only if signed; gate: case proving the modulator is connected. Meanwhile the broken engine is **marked in the quarantine, not ported**.

Decisions that need the Sovereign:
- **D1** · seed engine for frames: keep §5 (recommended) or move to xorshift32.
- **D2** · home of the source: `atlas/puros/acho.js` + two copies (recommended).
- **D3** · the mould: the JSON schema, renamed (no binary layout).
- **D4** · order of execution of AC-0 (after the TF train, see the rail note).
- **D5** · seal transition. **Recommended: WINDOW** — accept both seals, count hits of the old seal on each deploy, cut when the counter reads zero for N declared cycles. Cost: one extra branch in the validator and one counter. **Clean cut** costs: frames already signed with the old seal and kept by old service workers and phone IndexedDB stop validating, silently. The house does not break in silence. Cost of either is NO_DATA until the counter of old-seal frames on real devices is measured.

## Ties

- The conformity rate (AC-7) feeds NORTE 4 (the node bench).
- Acho will be the first live vocabulary of the HITL panel (Tower of Babel).

## Limits of the observer

This plan was measured from the Sovereign's node. That vantage sees what the Mesas do not: the local quarantine (findings 3 and the FM bug), the private app repo (the identical app copy, the crab account) and the physical Doogee. It does **not** see: production except through a probe (the `actions.py` instrument), the Cloudflare panels, other nodes of the rack, or the Mesas' own context. Findings 1-2 are re-measured by the Mesa; 3-4 rest on this vantage alone.


## Constraints

Vanilla JS, no build, no new dependencies (Ohm/Langium forbidden). No `Math.random`, clock or network in the core. Frames < 1,024 B. SCRUB on every diff. propose-only: branch, never main.

## Standing signature

Needed: FIRMO of the plan and of D1-D3; then one FIRMO per AC piece. Search done: `docs/bubble-language.md` (§2, §5, §8), `atlas/param_gate.mjs`, `public/game/{bubble_language,bubble_sonify,bb_det,tabla_semantica,combate_ticks,colonia_pagina}.js`, `public/openworld/estado.json`, `public/assets/aduana_page.js`, app `cuenta_cangrejo.py`, the local quarantine `Cuarentena/TheGame.v1.1/laboratorio/cosecha_joyas/mockup_mvp/` (outside the repo).

## Methodology relief

None.

## Log

- 2026-11-02 · Plan written on fresh main `5406d6bd` (worktree `claude/acho-plano-20261102`). Zero code.
- 2026-11-02 · Mesa audit accepted; name decree bubble → Acho; AC-0, AC-0b, AC-5b, D4, D5, ties and limits added; TF rail note.
