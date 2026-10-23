# THE LEXICON — Official Names of PreceptorOS

**Status:** PROPOSAL by the Command Desk · REQUIRES_SIGN-OFF of the Sovereign · drafted 2026-10-18 (round 306), sources measured 2026-10-18 · extended 2026-10-20 (sections I–J), sources measured 2026-10-20 · destination: `docs/lexicon.md` in preceptoros-web, under the Renaming Law.

**Purpose (declared by the Sovereign):** the professional and literary evolution of the Sovereign. Every term below carries his work and his voice; the names are chosen to be readable by humans and by the preceptors in a single pass.

**The construction law this doc enacts (internal, standing):**

1. Every piece is proposed under its **official name, in English**. No Spanish in served code, no comments in served code (D1). Canon lives in `docs/` (see `INDEX_RENAMING.md`).
2. A term is coined **once, here, and reused everywhere** — reuse before duplicating.
3. Seals (letter-codes) are assigned only by the Desk. Sign-offs belong only to the Sovereign.
4. When sources conflict: the Ledger rules over measured facts, the Desk's paper over form, the Bible over lore.
5. A term earns its place the way an ID earns its (the Alphabet law): it **exists for real**, it **tokenizes cheap**, and it **collides with nothing**. And the Eye's rule binds every claim of use: *if no command shows it, it is not knowledge, it is a belief* — every term must carry a way to see it with your own eyes.

---

## A · Governance and method

| Official name | Replaces | Meaning | Status |
|---|---|---|---|
| the Sovereign | el Soberano | The carbon. The only signer. Silicon never signs. | in use |
| the Command Desk (the Desk) | la Mesa de Mando | Measures, triages, proposes; never decides for the Sovereign; surfaces one decision at a time. | in use |
| sign-off | FIRMO | The Sovereign's decision made visible; it authorizes exactly what it names, never future unmeasured merges. | in use |
| the Ledger | el registro de rondas | The append-only round log. Rules over measured facts when sources conflict. | in use |
| round | ronda | One sealed exchange, numbered, append-only. | in use |
| the Register | el registro del rack | The Sovereign's cryptographic record in the rack; entries signed with the rotating key (v2). NOT the Ledger. | in use |
| entry | entrada | One numbered record in the Register (e.g. Entry 24). | in use |
| seal | sello / letra | Short letter-code (abk…) assigned only by the Desk; travels in the merge commit. | in use |
| double gate (n=2) | gates n=2 | A measurement passes twice, in separate runs, before it travels. | in use |
| yardstick | vara | A declared local test standard; two yardsticks are never mixed (the Arm's `node --test` ≠ CI's `test_web`). | in use |
| scrub | scrub | Removing private names from public artifacts; figures and paths stay, names go. | in use |
| NO_DATA | NO_DATA | Declared, never invented — always with a cause. | in use |
| stamps | sellos de estado | LIVE · STALE · STATIC · SIMULATED · NO_DATA · ERROR. | in use |
| propose-only | proponer sin ejecutar | Silicon writes and proposes; it never merges, never signs, never pushes to jetson. | in use |
| **HITL** (hitl) | REQUIERE_FIRMA · IronClaw | Human-in-the-loop: the gate AND the carbon's everyday gesture — "Say Hi" is its living example. FIRMO 2026-10-22. | in use |
| the Signing Tray | la bandeja de firmas | The rack's pending table. A row closes with its measure; a close without a figure is a second opinion. | in use |
| measured close | cierre con la medida | "RESOLVED" must carry a verifiable number next to it. | in use |

## B · Infrastructure and lanes

| Official name | Replaces | Meaning | Status |
|---|---|---|---|
| the Rack | el rack (beelink) | The lab machine; home of the local loops and the Register. | in use |
| the Arm | el brazo | The Mistral web-coder lane: writes, measures, receipts. Never merges, never signs, never pushes. | in use |
| the Descent | el descenso | The Claude Code lane building the game's visual language (the bubble language). | in use |
| the Codex lane (astra) | astra / Codex | The lane on the app side (L4a / tier-2 contract). | in use |
| preceptor | preceptor | Any AI that reads this world and works under these laws. | in use |
| the Comando | el Comando | The single GitHub lane: mirror of what the app hosts in its own database, and the place where commissions and receipts land. One channel, so no preceptor has to guess where anything lives. | proposal (rename of the Mailbox) |
| the Mailbox | el buzón | The issues-repo where commissions and receipts land. Rename to **the Comando** proposed (open decision 5). | in use |
| Customs | la aduana | The gate where a PR waits for the Desk's measurement before any sign-off. | in use |
| commission | encargo | A paste-ready work order with its law in the body. | in use |
| receipt | recibo | A return message stating form only: numbers, dates, shapes. Never keys, never private names. | in use |
| the Eye | el ojo | The Sovereign's visual port (8807 + S110) where served work is looked at before polishing. | in use |
| the Guardian | el guardián | The test that turns a law into an executable rule (red before green). | in use |
| the Tuner · the Curator · the Director | afinador · curador · director | The rack's systemd meta-loops. Display names only; unit filenames unchanged without a separate sign-off. | proposal |
| the Harvest | la cosecha | The recurring measured yield of fine receipts. | proposal |
| charter | cédula | A signed device/app identity credential (Ed25519). Final file names arrive with D3. | proposal |
| the Corpus | el corpus | The pinned reference corpus (XERJ · cf6fcf13). Declared evidence, never a source of code. | proposal |

## C · The Game (lore canon)

| Official name | Replaces | Meaning | Status |
|---|---|---|---|
| TheGame | TheGame | The game itself. | in use |
| the abyssal comic | el tebeo abisal | The served art style. | in use (measured served form) |
| the real-graphic style (working name) | el estilo gráfico real | The drawing style of the app test, signed off by the Sovereign 2026-10-18; adopted **in situ** across app and web. Known defect (measured by his eye): text covers the drawing → text moves to the **left side**. Official name pending (open decision 6). | proposal (signed, name pending) |
| the Rift | la Grieta | The world's break and its cause (canon ch. 2). | proposal |
| the personal crack | la grieta personal del caparazón | Each visitor's own, visible break in the shell (canon §2). Drawn as negative space: two soft edges that open, never teeth. | proposal |
| the Refuge | el Refugio | Where the world survived the Rift. | proposal |
| the Preceptor Statue | la Estatua del Preceptor | The statue that watches. | proposal |
| the Radio | la Radio | The only other voice. | proposal |
| Hexelion | Hexelion | The reader behind the switch (see Entry 24). | in use |
| the Five Storms | las Cinco Tormentas | The canonical storms. | proposal |
| the harmonic draw (gacha) | la gacha armónica | The wave-shaped draw engine; odds shown before the gesture. | proposal |


## C1 · Names signed 2026-10-23

The Sovereign signed these names in p0x#52 and p0x#54. The English form is canonical; Spanish forms remain aliases.

| Official name | Historical alias (ES) | Meaning | Status |
|---|---|---|---|
| the Risen | zombi / zombis | The zombie world, parallel to Atlantis. | FIRMO · p0x#52 |
| the rotor | superviviente | The playable character, parallel to the crab. | FIRMO · p0x#52 |
| the beacon | nodo / faro | The entry point that selects a world and an available tutorial. | FIRMO · p0x#52 |
| the Wastes | los Yermos | Habitat parallel to the Reef. | FIRMO · p0x#52 |
| the Flats | las Llanuras | Habitat parallel to the Forest. | FIRMO · p0x#52 |
| keepsake | recuerdo | Official name of the phase 2 tutorial object. | FIRMO · p0x#54 |
| the Trunk | el tronco | The web as one object: one served surface, one action register, and the preceptoros.bubble/1 contract. Worlds are WORLDS, never branches. | FIRMO · p0x#54 |
## D · Never confuse

- **Ledger vs Register** — rounds log vs the rack's signed record.
- **Ledger vs living glossary** — this doc coins official names; the rack's living glossary explains how the swarm works. Two contexts, one discipline (see H).
- **scrub list vs forbidden names** — the scrub list is the fail-closed list of *private names that must never appear in a public artifact*; section E lists *words that may never be coined as official terms, in any language*. Two different lists; neither substitutes the other.
- **Rift vs personal crack** — the world's break vs your shell's own break.
- **sign-off vs seal** — the Sovereign's decision vs the Desk's letter-code.
- **yardstick A vs yardstick B** — always declare which one a number came from.
- **receipt vs entry** — a return message vs a numbered record in the Register.

## E · Forbidden as names (standing law)

oracle · notary · depin · coin · clearing · magic · token-as-a-name · **cryptocurrency** (ES: criptomoneda). No official term in this project may be coined from them, in any language.

*Amendment · FIRMO 2026-10-22:* `cryptocurrency`/`criptomoneda` join the list (L1 to any public example, until new request). **Approved:** `cryptography`·`cryptographic`·`criptográfica`.

## F · Open decisions (each needs its own sign-off, surfaced one at a time)

1. **`window.Atlas*` public module names** (AtlasJuego, AtlasToon…) — public contract consumed by tests and the rack; unchanged without a separate sign-off. Their future official names get recorded here when decided.
2. **Marker `REQUIERE_FIRMA` → `HITL`** — RESUELTO por FIRMO 2026-10-22. Ver entrada HITL en §A. `REQUIERE_FIRMA` queda como alias histórico; textos nuevos usan HITL.
3. **systemd unit filenames** (`afinador.service`…) — English display names here only; renaming the units is a separate sign-off.
4. **D3 file-name map** (`mar.js→sea.js`, `cria.js→brood.js`, …) — adopted as official from `INDEX_RENAMING.md`; execution still travels piece by piece under sign-off. As of main f2c0129 the Spanish filenames are still in main — D3 remains pending work, nothing here pre-empts it.
5. **Rename the Mailbox → the Comando** — one rename, no new repo (the Sovereign's answer, 2026-10-18). GitHub keeps the redirect; the issues live on. Automatic pointer to land in `AGENTS.md`/`llms.txt`. The fate of Customs (aduana) is measured before anything moves. GitHub stays untouched until his sign-off.
6. **Official name of the signed real-graphic style** — the style is signed (adoption in situ, app and web); its official English name is not coined yet. Coined here, once, when he chooses.

## G · Sources (all measured)

- `docs/INDEX_RENAMING.md` (D1/D2/D3 law, guardian list, file map) · main f2c0129.
- `docs/` listing of main: 30 entries, **no existing lexicon** — no duplicate created.
- The Game Bible (canon, sign-off 2026-10-11 / chapters 2026-10-14) · the Signing Tray rule (measured close) · ruled issues #38–#42, #156–#159.
- Byte budget: this doc lives under the one-piece discipline (≤ 16,384 B), verified at build time.
- Rack ground truth, 13 read-only blocks measured 2026-10-20 20:23–20:53Z (recorded in the Desk's private session receipt): live Crucible / LoRA / red-team lanes, MiniCPM5 2B (2.52B params, ctx 131072, no vision capability), qwen3.5:4b VL with mmproj, 24 signed Register entries (latest: Entry 24, 2026-10-19 20:43Z).

## H · Absorbed from the rack (measured 2026-10-18 — reuse before duplicating)

- **The Eye's living glossary** (~40 entries in the rack). Fixed shape per entry: term · state · what it does · **where to see it** · source · note. Absorbed here: the shape and the rule (a term without a way to see it is a belief). Not duplicated: it keeps its own subject (how the swarm works); this doc covers official names.
- **The Alphabet** — the rack's inter-silicon tongue. Its ID admission test is: exists in the system, tokenizes no more expensively than the longer form, and does not collide with an existing ID. **Audit · 2026-10-23 · seven signed names:** existence is confirmed by FIRMO p0x#52/#54; the names use ordinary words and introduce no symbols. Token-cost result: **NO_DATA**, cause: no paired 20-message run with the local model tokenizer was supplied. Collision result: **the beacon / faro** collides with the existing rack ID faro in the organ category; rename-winner makes the beacon canonical for tutorial selection and keeps faro as a historical alias. The historic ID oraculo remains retired under the forbidden-name law and is not coined again. A full eight-repository collision scan remains NO_DATA. Historical Alphabet records are left intact.
- **The HEXELION-era lexicon pages** — the name lineage (the Forge · the Tower · the Watchman · the Synod · the Sovereign) and the Necropolis pattern (CANONIZE / GUARD / DISCARD, each with its reason). Pattern reused to judge the signed style; names of retired nodes stay historical.
- **The scrub list** — the fail-closed private-name list in the rack; distinct from section E (see D).
- **`GLOSSARY-FORMAT` (mattpocock skills)** — format inspiration: opinionated terms, an *Avoid* line per term, project-specific terms only, multi-context map. Used here; nothing copied as canon.

---

## I–L · Implementation records

Benchmark, lexical-screen, Bubble-language, and lexical-vision entries continue in [lexicon implementation records](lexicon-implementation.md).
