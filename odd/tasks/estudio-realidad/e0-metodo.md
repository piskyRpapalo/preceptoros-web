# estudio-realidad · E-0 · method, skeleton, limits, budget

Date: 2026-11-02
Law: the Mesa's commission «El estudio de la realidad y la historia» (Part B, 2026-11-02), signed HITL by the Sovereign («HITL. Firmo! adelante», 2026-11-02). Mode: study. Read, measure, write documents. No code that changes the game or the canon; zero merge without FIRMO; zero deploy.

## Objective

Give the house a **measured** picture of what is real, how it got there, and what is missing that nobody sees. This piece does not promise the full picture. It promises a measured picture with its blindness declared, and it fixes the method the next three pieces follow.

## The ladder (one piece per PR, its own FIRMO each)

| piece | file | what it answers | budget |
|---|---|---|---|
| E-0 | `e0-metodo.md` | method, sources, limits, budget (this file) | 1 doc |
| E-1 | `e1-linea-tiempo-s1.md` … `-s5.md` | each decree and FIRMO of 2-oct → 2-nov, against what the rail answered | one doc per week if it does not fit in one |
| E-2 | `e2-inventario.md` | one card per repo: production / main / texts, plus measured debt | fission by repo group if > budget |
| E-3 | `e3-huecos.md` + `e3-anexo.md` | the gap map: TOP-10 triaged, the rest in the annex | 2 docs |

Budget of every doc: **< 16,384 B** (house ceiling) or declared fission. Each piece is docs-only under `odd/tasks/estudio-realidad/`; it never touches `public/`, so it never reseals.

## Citation (mechanical, one form)

`·id · date · source · sha`. Examples: `·6586615380 · 2026-11-02 · buzon#30 · —` for a comment; `#575 · 2026-11-02 · preceptoros-web · 837a7ae3` for a PR. Without a trace: `NO_DATA: <cause>`. Never decorated, never inferred.

## Reading rule (·6522739184)

The most recent weighs more; the oldest closes the why. Sources before 2-oct (the quarantine of TheGame, the HEXELION era, the Alphabet audit of 23-oct that settles the double meaning of «faro») enter as **inherited history**: cited, never re-measured, never discarded.

## Chain of custody

The mailbox is append-only and holds measurements corrected on the same day. The timeline separates **what was said then** from **what is true now**: every contradiction gets a line `CORREGIDO POR ·id`. Without it this is not history, it is smoothed memory.

## Measured at start (2026-11-02, by API, not inherited)

| what | value | source |
|---|---|---|
| main of the web | `5406d6bd` (merge #573, Actions formerly faro) | `git fetch`, origin/main |
| served version letter | `preceptoros-2026-17-do` | `public/sw.js` on main |
| production vs main | **LIVE 181 equal · 0 distinct · 0 absent · 0 network errors** | `python3 atlas/actions.py` from this node |
| buzon#30 | open · **1,239** comments · opened 2026-10-22 | `gh api …/issues/30` (the Mesa counted 1,235 earlier tonight: it grows; nothing is inherited) |
| buzon#19 | closed **2026-10-21 22:59 UTC** · 729 comments | `gh api …/issues/19` |
| buzon#52 | open · **0** comments · opened 2026-11-02 08:11 UTC (NO_DATA tuning) | `gh api …/issues/52` |
| buzon issues | 31 (9 open); the numbering reaches #52 because PRs share it | `gh issue list --state all` |
| repos of the owner | **13**, not 12: preceptoros-web, preceptoros-companion, study, lab, PreceptorOS, piskyRpapalo (public); p0x, CineK, hexelion-nexo, roadmap, firmas, buzon, aduana (private) | `gh repo list` |

The count of 13 against the commission's 12 is the first correction of the study. E-2 says which one was left out and why.

## Backbone (cheap consistency)

The VERSION letter chain (bv → … → do) is read from `git log -p public/sw.js` (the same regex as `bin/sellar.py`). Against production, the instrument is `atlas/actions.py` with the diagnostic ladder of `DEPLOY.md` (read the instrument first, run locally, read the probe fields). Today main and production agree byte for byte.

## Sources, in order of weight

1. GitHub by fresh API (PRs, merges, runs, issues of `buzon`).
2. `main` of each repo, fetched before measuring (lesson of the stale clone).
3. Production through `atlas/actions.py`.
4. The text corpus: `odd/`, `docs/`, `atlas/*.md`, the private `firmas` repo (`LIBRO_DE_FIRMAS.md`).
5. Inherited history (see the reading rule).

## Limits of the observer

**What this vantage sees that the Mesas do not.** It runs on the Sovereign's node: the local quarantine of TheGame, the private app repo checked out, and the physical phone by ADB (read-only). The Acho plan (#575) proved the value: findings 3 and 4 rest on this vantage alone.

**What it does not see, with cause.**
- The Cloudflare panels and the edge cache: no credential here; production is seen only through the probe.
- The other nodes of the rack: propose-only, no SSH missions for this study.
- The Mesas' own context and the chats that never reached the mailbox: no access.
- Deleted or edited comments: the API gives the current text, not the past one. Corrections inside an edited comment are invisible unless another comment cites them.
- Private repos are seen with the owner's token: what is visible here may not be visible to a Mesa, and the reverse.
- Anything before 2-oct is cited, not re-measured (declared on purpose).

Blindness declared on purpose is valid; undeclared blindness is not. Every card of E-3 says which of these limits it touches.

## Where the study's queue sits

The study is the **slow lane**: it reads, and it never holds a lock on `public/`. It never competes with the PR train (TF-1/TF-2, Acho) for a seal letter. Against the single chatbot it is source material: its documents are plain text the chatbot can retrieve; it does not feed the chatbot directly. If the train needs this session, the study pauses at the end of its current piece, never in the middle of one.

## Triage (fixed now, used in E-3)

Each gap: **impact** (1-3: who stops working or believes something false) × **blocking** (1-3: how many pieces wait on it) ÷ **cost** (S=1, M=2, L=3). TOP-10 by score; ties go to the one with the cheapest first measurable step. Each card names **the first measurable step**: the smallest measurement that unblocks it.

## Measurement scripts

Proposed as text inside each doc, never served, never committed as code.

## Checklist

- [x] E0-1 · method, citation, reading rule, custody.
- [x] E0-2 · measured start (mailboxes, repos, version, production).
- [x] E0-3 · limits of the observer.
- [x] E0-4 · budget, fission, queue, triage.
- [ ] E-1 · timeline (next PR).
- [ ] E-2 · inventory (PR after it).
- [ ] E-3 · gap map, TOP-10 + annex, open decisions of the Sovereign.

## Log

- 2026-11-02 · E-0 written on main `5406d6bd`. Docs-only.
