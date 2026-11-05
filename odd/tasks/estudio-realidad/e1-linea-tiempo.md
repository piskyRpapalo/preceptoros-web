# estudio-realidad · E-1 · the real timeline, 2-oct → 2-nov-2026

Date: 2026-11-02
Law: the Mesa's commission «El estudio de la realidad y la historia» (Part B), signed HITL by the Sovereign («Firmo todo. continua!», 2026-11-02). Method: `e0-metodo.md` (#576). Docs-only.

## How to read this

Each week puts what was **decreed** next to what the **rail answered** (merged PRs, seal letters, served state). Citation: `·id · date · source · sha`. A decree with no measured answer says so. One piece holds all five weeks: it fits under 16,384 B, so no fission.

## Sources measured for this piece (2026-11-02, fresh API)

| source | what | span |
|---|---|---|
| buzon#19 + buzon#30 | **1,974** comments (729 + 1,245 at the time of reading) | first comment **2026-10-20 11:17 UTC** |
| merged PRs of preceptoros-web | **476** merged since 2-oct | first merged 2026-10-03 |
| main, first parent | **167** `FIRMO` merge commits; **217** seal letters in `public/sw.js` | `abcd` (10-03) → `do` (11-02) |
| `firmas` · `LIBRO_DE_FIRMAS.md` | 22,512 B; dated entries only on 10-25, 10-26, 10-31, 11-01 | starts 2026-10-25 |
| p0x issues | channel before the mailbox; issue #1 dated 2026-09-25 | inherited history |

**The blind fortnight.** The mailbox starts on **10-20** and the book on **10-25**. Weeks 1 and 2 have **no decree text in either**: their decrees are known only through commit subjects (`FIRMO (Soberano): merge …`). For those weeks this timeline reads the rail and leaves the words as `NO_DATA: decree channel started 2026-10-20`. The p0x issues (from 09-25) are the likely source. They are cited as inherited history and not re-read in this piece.

## The weekly numbers (measured)

| week | merged PRs | mailbox comments | comments headed DECRETO/FIRMO | headed CORREGIDO | seal letters on main |
|---|---|---|---|---|---|
| S1 · 10-02 → 10-08 | 6 | 0 | NO_DATA | NO_DATA | 4 |
| S2 · 10-09 → 10-15 | 95 | 0 | NO_DATA | NO_DATA | 71 |
| S3 · 10-16 → 10-22 | 128 | 62 | 6 | 0 | 35 |
| S4 · 10-23 → 10-29 | 131 | 946 | 160 | 7 | 51 |
| S5 · 10-30 → 11-02 (4 days) | 116 | 966 | 205 | 2 | 56 |

How it was read: PR counts by `mergedAt`; comments by `created_at`; «headed» means the word appears in the first 80 (DECRETO/FIRMO) or 120 (CORREGIDO) characters; letters are `+const VERSION` lines on `git log --first-parent -p public/sw.js`. The headers are a lower bound: a correction written in the middle of a comment is not counted. Measurement scripts are proposed as text in E-3, never served.

**What the curve says.** The rail answered faster than the canon could record. In S5, 116 merges in four days against 205 decree/signature comments: more than one signed word for every merge.

## S1 · 10-02 → 10-08 · the seal is born

- Rail: 6 merges. The first sealed letter on main is `abcd` (`b4695fb8`, 10-03). The fixed-point order of the seal is measured on 10-04 (web `CLAUDE.md`, §4).
- Decrees: `NO_DATA: decree channel started 2026-10-20`. The determinism canon (no `Math.random`, 10-03) is cited as inherited history from the TheGame quarantine.

## S2 · 10-09 → 10-15 · the first flood

- Rail: 95 merges and 71 letters in a week, 25 of them on 10-12 alone. The first ODD-named PR is #31 (10-11), the first NO_DATA-named PR is #46 (10-12), and the first chunk-router PR is #58 (10-12).
- Decrees: `NO_DATA` (same cause). The flood is visible only as the rail's answer.

## S3 · 10-16 → 10-22 · the language and the mailbox

- 10-17: «Actions» first appears in a PR title as `faro` (#158). It is renamed on 11-02 (#573).
- 10-18: the bubble language is signed (`docs/bubble-language.md`). Rail: compiler and cases on main the same week.
- 10-20: **the mailbox opens** (#19, first comment 11:17 UTC). #19 closes **10-21 22:59 UTC** with 729 comments; #30 opens on **10-22**.
- Rail: 128 merges. Letters `abiw` … `abkh` are minted between 10-19 and 10-22.

## S4 · 10-23 → 10-29 · the canon catches up

| decree | ·id | rail's answer |
|---|---|---|
| keys to the preceptors (10-24) | ·6388329153 | lab#86-92 merged the same day (·6388562058, ·6389027789) |
| chunk model + deploy track (10-24) | ·6390184206 | chunk PRs continue; the last one merged so far is #543 (11-01) |
| approval rules: individual HITL (10-25) | ·6397006920 | `LIBRO_DE_FIRMAS.md` starts on 10-25 (70 dated entries that day) |
| public names in English (10-25) | ·6399350392 | #331 (10-25). **Partly overruled on 11-02 by the Acho name decree.** |
| worlds are the real nodes (10-26) | ·6403956477 | **CORREGIDO POR** «cero nodos» (10-28, ·6458152283): web without real nodes |
| night decree «firmo todo + ir pusheando» (10-26) | ·6429370626 | valid «until dawn 27-oct» (LIBRO §1): a dated cover, closed by its own words |
| NORTE 5, removal of the old (10-27) | ·6452880777 | 14 retire/purge PRs, from #298 (10-24) to #522 (11-01) |
| Workers Builds deploys from main (10-27) | ·6455850004 | `DEPLOY.md` + the actions ladder (measured 10-25) |
| ODD (10-28) | ·6456780704 | #374 ODD template (10-28); 16 ODD PRs in total |
| one single global map (10-28) | ·6469690198 | served in #387; 7 single-map PRs, the last #454 (10-30) |

**The seal regression of 10-23 (measured, not reported before).** After `abkh` (`acc074a6`), the merge of #271 (`0d0ade6c`, a branch cut before 10-19) took `public/sw.js` back. Main then **re-issued 29 letters already served** (`abiw` … `abkh`) between 10-23 and 10-29. Each of those 29 letters names two different builds. A service worker that cached `abix` on 10-20 sees the same letter on 10-23 and has no reason to refresh. The impact on phones is `NO_DATA: no telemetry of SW versions on devices`. The repeated letters go to E-3 as a gap. The window of double seals proposed in Acho (D5) is the same lesson.

## S5 · 10-30 → 11-02 · the terminal, the heartbeat and the name

| decree | ·id | rail's answer |
|---|---|---|
| answers to Claude's plan (10-30) | ·6521940119 | IC7 lot: seal contract #419 (10-30) |
| THE TERMINAL (10-30) | ·6522236505 | 13 terminal PRs; Terminal Familia plan #574 merged 11-02 (`dbd5c114`) |
| heartbeat and waking (10-30) | ·6522643836 | **only a plan** (#451, 10-30). `public/openworld/state.json` has 5 commits in its whole life, all by hand in PRs, with `since: 2026-10-30` frozen. **No producer of the heartbeat on main** |
| communication of the 4 preceptors (10-31) | ·6547016566 | the mailbox as common channel (practice since 10-20) |
| goal: HEXELION, the sovereign of the rack (10-31) | ·6550117460 | `NO_DATA: no PR names it` (likely lives in p0x) |
| app = harness; openworld = the only place (11-01) | ·6551164303 | #522 (W-4) and the shared-map removal `ca9f668a` (11-01) |
| «we build as today» (11-01) | ·6559275893 | `odd/DECRETO-CONSTRUIMOS…` in roadmap `f7415afc` (another repo) |
| NO_DATA as a living state (11-02) + addendum | ·6572180254, ·6572233599 | `odd/DECRETO-NO-DATA-ESTADO-VIVO-20261102.md` on main; buzon#52 opened the same day, **0 replies** |
| Alphabet open to collaborators with public keys (11-02) | ·6585001168 | `NO_DATA: no PR yet` |
| HITL contains «firma» (11-02) | ·6585440331 | terms of this study already use HITL |
| Acho replaces bubble (11-02) | Mesa message, Part A | plan #575 (draft); AC-0 not executed |

## Corrections (what was said then / what is true now)

- **«12 repos»** (commission) → **13** (`gh repo list`, 11-02, E-0).
- **buzon#30 «1,235 comments»** (Mesa, evening of 11-02) → 1,239 at E-0 and **1,245** at this reading. It is not wrong; it grows.
- **«61 files cite the seal»** (Mesa) → **62** on the same sha `5406d6bd` (#575).
- **Worlds = real nodes** (10-26) → **zero nodes** (10-28) → single map + measured heartbeat (10-30), still without a producer.
- **Public names in English** (10-25) → except Acho, by name decree (11-02). The rule of reading (·6522739184) settles it: the most recent weighs more.
- **The book's own ceiling.** `LIBRO_DE_FIRMAS.md` is 22,512 B. The house ceiling is 16,384 B, and the web's `CLAUDE.md` says that when the book reaches it, new material goes in new files. It is 6,128 B over. Measured, not judged: it goes to E-3.

## Limits of this piece

- Comments are read as they are today. An edited comment hides its first version (E-0, limits).
- Weeks 1-2 have no decree text: the p0x issues are not re-read here.
- The «rail's answer» column matches PR titles by keyword. A PR that answered a decree under another name is missed (lower bound).
- Production is read only today (E-0: 181 equal). There is **no historical record of what production served on each day**: the timeline of production is `NO_DATA` before the actions instrument.

## Checklist

- [x] E1-1 · sources measured and the blind fortnight declared.
- [x] E1-2 · weekly numbers with the method.
- [x] E1-3 · decree → rail tables for S4 and S5; the rail for S1-S3.
- [x] E1-4 · corrections with CORREGIDO POR.
- [x] E1-5 · new findings: 29 re-issued seal letters; no producer of the heartbeat; the book over its ceiling.

## Log

- 2026-11-02 · E-1 written on main `dbd5c114`. Docs-only.
