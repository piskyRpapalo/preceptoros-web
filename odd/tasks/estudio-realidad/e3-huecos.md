# estudio-realidad · E-3 · the gap map, TOP-10 + annex

Date: 2026-11-02
Law: the Mesa's commission «El estudio de la realidad y la historia» (Part B), signed HITL by the Sovereign («Firmo todo. continua!», 2026-11-02). Method: `e0-metodo.md` (#576) · timeline `e1-linea-tiempo.md` (#577) · inventory `e2-inventario.md` (#578). Docs-only. Measured on main `dbd5c114`.

## How to read this

A gap is something that neither the Sovereign nor the Mesas see. Triage (fixed in E-0): **score = impact (1-3) × blocking (1-3) ÷ cost (S=1, M=2, L=3)**. Each card names **the first measurable step**: the smallest measurement that unblocks it. The vantage that saw it comes from E-0: **R** = repo by API, **N** = this node (quarantine, app, clones, phone), **P** = production probe.

## Part 1 · the Mesa's seed, checked one by one

| seed | verdict | measured |
|---|---|---|
| Hands: Ed25519 in the browser is NO_DATA | **CONTRADICTED** (and it corrects the Acho plan, finding 4) | WebCrypto Ed25519 **exists on main**: `generateKey` and `sign` in `public/assets/auth.js:107,152,165`, `verify` in `public/game/creation_package.js:89` and `node_signature_verify.js:80`, `sign` in `visitor_account.js:28`. What is NO_DATA is **the measurement on the Doogee**, not the code. The messages even carry `crypto_unavailable` for devices without it |
| Hands: customs asleep; `units: []` | confirmed | `aduana_page.js`: registry `NO_DATA`, sending «Asleep»; `estado.json` `units: []` |
| Hands: heartbeat producer | confirmed, **worse** | no producer on main; `estado.json` has 5 commits in its life, all by hand; `since: 2026-10-30` frozen (E-1) |
| Registry of creations: no public store | confirmed, **with a nuance** | the client exists: `creation_flow.js:59` calls `fetch('/api/creaciones/…')`. Production answers **404** to `/api/creaciones/` (P). A door painted on a wall with nothing behind it |
| Chain of life: heartbeat → nodes → combats → lab → LoRA | broken at the **first** link | no heartbeat producer → `units: []` → no measured combats on the map → no feed. The lab's `pruebas` is red on main (10-30, E-2). LoRA: `NO_DATA: p0x master frozen since 10-28` (R) |
| Identity: anchors empty | confirmed | `public/game/node_trust_manifest.js` exports **`null`**; `node_signature_verify.js:102` → `pending · trust_missing` («Human approval of the trust anchor is pending»). Every credential stays unpublishable |
| Canon in conflict: seed engine | **closed** | D1 (§5) signed HITL on 11-02, recorded on #575 |
| Canon: lore by building (the 9 objects) | open | 6 files on main mention it, **0 under `public/`**: decreed in the corpus, not served |
| Canon: status-chat | open | **0 files** on main. It lives only in a Mesa's context: `NO_DATA` here |
| Canon: rename bubble → Acho reach | **wider than AC-0** | the old seal in 62 files, the word in **195** (39 under `public/`) (#575). A seal-only AC-0 leaves ~130 |
| Fluency FA1-FA6 (NORTE 10) | **invisible from here** | «NORTE 10» appears in **0** text files on main and in **0** mailbox comment heads. Only one text hit for «FA1» (a vendored library). `NO_DATA: the steps are not written where the rail can read them` |
| Advisor's instruments | **mostly absent** | «scoreboard» 0 files; «crossings» 1; «entropy» 3; «resurrection» 1. No instrument with a gate |
| Corpus promises vs served | partly measured | see gaps 3, 4, 7 and 10 below |

## Part 2 · TOP-10 (seed + mine, triaged)

| # | gap | I | B | C | score | seen by | first measurable step |
|---|---|---|---|---|---|---|---|
| 1 | **No heartbeat producer.** The live map shows frozen data dated 10-30. Every link of the chain of life hangs from it | 3 | 3 | M | **4.5** | R | run the decreed chain once by hand and diff `estado.json` before and after: does any field move? |
| 2 | **Trust anchors are `null`.** All credential checks end in `pending`. Nobody can be published, so the hands of Acho have no one to sign for | 3 | 3 | M | **4.5** | R | list who would be anchor #1 (the Sovereign's public key) and measure the manifest's bytes with one entry |
| 3 | **`/api/creaciones/` answers 404**, yet the page calls it. A signed creation has nowhere to live | 3 | 2 | M | **3.0** | P | read the deploy config for a route named `creaciones`: does it exist on any branch? |
| 4 | **29 seal letters re-issued** on main after #271 (10-23). Each letter names two builds, so a phone's SW may keep an old build under a «current» letter | 2 | 2 | S | **4.0** | R | count, on the Doogee, which letter its SW holds now against `do` |
| 5 | **Lab main red** (`pruebas`, 10-30) and **9 of 13 repos without CI**, `firmas` and `aduana` among them | 2 | 2 | S | **4.0** | R | open the failing run of lab main and name the failing test |
| 6 | ~~**Ed25519 on the phone is unmeasured**~~ **CLOSED, see below**, while the code is already served. The Acho plan said the code was missing; the measure is what is missing | 2 | 3 | S | **6.0** | N | open `/` on the Doogee and run `crypto.subtle.generateKey({name:'Ed25519'})` once: ok or `NotSupportedError` |
| 7 | **The rename reaches farther than the seal**: 195 files carry the word | 2 | 2 | S | **4.0** | R | classify the 39 hits under `public/` (rename / historical / out of scope) |
| 8 | **The book is 6,128 B over its own ceiling** (22,512 B vs 16,384), against its own rule | 1 | 2 | S | **2.0** | R | measure which section of the book is the largest and propose that one as the first new file |
| 9 | **FA1-FA6 / NORTE 10 and status-chat are not written where the rail reads.** Decrees that live only in a context cannot be gated | 2 | 2 | S | **4.0** | R | ask the Mesa for the ·id of NORTE 10 and the 6 steps; they go to an `odd/` piece |
| 10 | **`aduana` serves a feature branch as default**, and three repos claim preceptoros.org while only the web answers | 1 | 1 | S | **1.0** | R | read the aduana repo's README on its default branch: does it describe the 16-oct proposal or the current gateway? |

**Order of work by score:** 6 → 1, 2 → 4, 5, 7, 9 → 3 → 8 → 10. Gap 6 comes first because it is the cheapest unblocking measurement in the whole map: one call on one phone. It also closes AC-5b of Acho.

## Measured after writing (2026-11-02, the Doogee by ADB, read-only, tab on production `/openworld/`)

- **Gap 6 closed.** Chrome 156 on Android 10: `generateKey Ed25519` ok · signature **64 B** · `verify` **true** · tampered message **false** · first key+sign+verify **9.2 ms** · 50 verifies **29.9 ms** (about 0.6 ms each). Nothing stored: the key was non-extractable and lived in memory only. AC-5b of Acho has its number. AC-6 is no longer blocked by the device.
- **Gap 4, first step done.** The phone's service worker cache is **`shell-preceptoros-2026-17-dl`**. Production serves **`do`**. The phone is behind by the letters `dm` and `do`, with the page open. `dl` is not one of the 29 re-issued letters, so this lag is an update that has not landed, not a collision. Next step: read whether a new SW is `waiting`, and how long it takes to activate.

## Part 3 · annex (lower score or out of reach)

- **The blind fortnight** (2 → 15-oct): no decree text in the mailbox or the book (E-1). Cost L, impact on history only. First step: read the p0x issues #1-#15 (09-25 → 10-21) as inherited history.
- **Three deleted repos** (`preceptor-internal`, `cinek-automatico`, `codice-emancipacion-atomica`) survive only in clones on this node (N). First step: `git log -1` of each clone and a one-line note on what each held.
- **`p0x` clone with 130 uncommitted files** on a side branch (N). First step: `git status --porcelain | cut -c4- | cut -d/ -f1 | sort | uniq -c` to see which folders hold them.
- **86 checkouts on this node, 64 of the web** (N). Each one is a place where a session can measure a stale world. First step: list those more than 7 days behind origin.
- **buzon#52 (NO_DATA tuning) has 0 replies** since 11-02 08:11 UTC, the same day as two NO_DATA decrees.
- **The `hitl` gate needs one mailbox line per PR head.** Every rebase or branch update (as on #576) asks the Mesa for a new line. Its cost per PR is `NO_DATA`; first step: count the HITL lines per merged PR in a week.
- **No history of production.** Before the actions instrument, what was served on a given day is unknowable (E-1).
- **Lore of the 9 objects**: in 6 corpus files, 0 served. It waits for its decree.

## Part 4 · open decisions of the Sovereign (the queue)

1. **Who is trust anchor #1** (gap 2). Without it, publishing stays `pending` forever.
2. **The heartbeat producer**: where it runs (rack or edge) and who signs its unit (gap 1; any systemd unit needs its own signature in this node's canon).
3. **The creations store**: a route on the edge or packages only (Send / Copy / Download, «no server» in the web's `CLAUDE.md`). The web's own law points to packages. The page's `fetch` contradicts it. One of the two must change.
4. **AC-0 scope**: seal only, or the 195-file rename.
5. **The book's fission** (gap 8): which section leaves first.
6. **lab main red**: fix, or declare the test retired.
7. **`aduana` default branch**: keep the feature branch or move it back to main.

D1, D2, D3 and D5 of Acho: signed HITL on 11-02 (recorded on #575). D4 waits for the TF train.

## Correction of this study's own work

The Acho plan (#575, finding 4) said «verifying Ed25519 in the browser is NO_DATA (only node:crypto and ssh-keygen are measured)». **CORREGIDO POR this E-3**: WebCrypto Ed25519 sign and verify are on main in four files. The missing piece is the device measurement (AC-5b), not the code. #575 will carry the line.

## Limits of this piece

- Every «0 files» is a text search over main. A concept written under another name is missed (lower bound).
- Mailbox searches read the first 220 characters of each comment. A term deep inside a long comment is not seen.
- Scores are this observer's judgment over measured facts. The facts are measured; the weights are proposed.

## Checklist

- [x] E3-1 · the seed checked point by point (2 contradicted or nuanced, 1 closed).
- [x] E3-2 · my own gaps added (letters, CI, rename reach, book ceiling, unwritten decrees, aduana branch).
- [x] E3-3 · TOP-10 triaged, each with a first measurable step.
- [x] E3-4 · annex and the Sovereign's open decisions.
- [x] E3-5 · the study corrects its own earlier piece.

## Log

- 2026-11-02 · E-3 written on main `dbd5c114`. Docs-only. The study (E-0 → E-3) is complete as proposals; each piece waits for its FIRMO.
