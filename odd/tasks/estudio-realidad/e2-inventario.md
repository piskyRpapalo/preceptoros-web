# estudio-realidad · E-2 · inventory of reality, one card per repo

Date: 2026-11-02
Law: the Mesa's commission «El estudio de la realidad y la historia» (Part B), signed HITL by the Sovereign («Firmo todo. continua!», 2026-11-02). Method: `e0-metodo.md` (#576). Timeline: `e1-linea-tiempo.md` (#577). Docs-only.

## How to read this

Three columns per repo: **production** (what is served, measured), **main** (what the default branch says, by fresh API) and **texts** (what the repo says about itself in its description). Then the measured debt. All read on 2026-11-02 from this node, with the owner's token (E-0, limits).

## Production, measured once for all

- `https://preceptoros.org/` → **200**. `atlas/actions.py`: **181 equal, 0 distinct, 0 absent, 0 network errors** against web main (E-0).
- `/lab/`, `/app/`, `/study/`, `/companion/` → **404**. No repo other than the web is served under the house domain at those paths. Every other «production» cell below is therefore `NO_DATA: no served surface measured and no probe instrument for it`. The web is the only repo with an instrument that compares served bytes to main.

## The 13 cards

| repo | vis. | default · head · date | open PRs | CI, last 20 completed runs | texts (its own description) | production |
|---|---|---|---|---|---|---|
| preceptoros-web | public | main · `dbd5c114` · 11-02 | 4 | 11 ok · 1 fail · 2 cancelled; main green (`gate`, `actions`, `phase` on `dbd5c114`) | «The WEB part of PreceptorOS: public gateway and game» · homepage preceptoros.org | **LIVE = main** (181/181) |
| lab | public | main · `14ed512f` · 11-02 | 0 | 15 ok · **5 fail** (`pruebas`, one on **main** 10-30) | «The LAB part … the measured record» · homepage preceptoros.org | `/lab/` 404 · NO_DATA |
| PreceptorOS | public | main · `0900d858` · 11-02 | 0 | 17 ok · 3 cancelled | «The APP part … local-first companion» · homepage preceptoros.org | `/app/` 404 · NO_DATA |
| preceptoros-companion | public | main · `3e75d288` · 11-02 | 0 | no CI | description **«n/a»** | NO_DATA |
| study | public | main · `6d23ca31` · 11-02 | 0 | no CI | «The Study — the public doctrine of PreceptorOS» | `/study/` 404 · NO_DATA |
| piskyRpapalo | public | main · `2638ac0a` · 11-01 | 0 | 20 ok | «HEXELION» (profile) · **the only repo with Pages on** | Pages · not probed |
| p0x | private | **master** · `78e97857` · **10-28** | 0 | 1 ok | «Monorepo del rack soberano: forja LoRA, bucles…» | not served (rack) |
| roadmap | private | main · `81290ff7` · 11-02 | 0 | no CI | «PreceptorOS ROADMAP: the path that guides the plan» | not served |
| firmas | private | main · `270448e5` · 11-01 | 0 | no CI | «Libro único de firmas…» | not served |
| buzon | private | main · `e0c0909e` · 10-31 | 0 | no CI | «Canal MESA ↔ RACK · solo comentarios, solo forma» | not served |
| aduana | private | **`codex/node-gateway-worker-20261016`** · `01811dc9` · 10-31 | 0 | no CI | **no description** | registry `NO_DATA`; `/aduana/` page asleep (web) |
| hexelion-nexo | private | main · `14b7208f` · 11-02 | 0 | no CI | «Nexo: sensor de flota y canal de despertar de Hexelion» | not served |
| CineK | private | main · `2044ea68` · 11-02 | 0 | no CI | **no description** | not served |

**Why 13 and not 12.** The commission counted 12. `gh repo list` gives 13. Measured: the candidate the Mesa's vantage cannot see is a private one (7 of the 13 are private, and E-0 declares that private visibility depends on the token). Which one the Mesa left out is `NO_DATA: the Mesa's list is not in the mailbox`. The first measurable step is to ask the Mesa for its list of 12.

**Three repos that no longer exist.** Local clones point to `preceptor-internal`, `cinek-automatico` and `codice-emancipacion-atomica`. All three answer **404** by API (deleted, renamed or transferred). Their clones keep the only copy this node has. They are cited as inherited history, never re-measured. Value kept: `NO_DATA` until someone opens them.

## Measured debt

### 1 · Red CI windows

- **lab**: 5 red `pruebas` runs in the last 20, one of them **on main** (10-30), plus 4 on feature branches (10-30 → 11-01). Main of lab has been red at least once without a recorded fix in this reading.
- **web**: main green. The red runs are the `hitl` gate on this study's own PRs (#576, #577): «no line carries the head». That is the gate working (it waits for the HITL line with the exact head sha), not a defect. #575 already passes.
- **9 of 13 repos have no CI at all**, including `firmas` (the book of signatures) and `aduana` (the gateway). Their truth is not machine-checked.

### 2 · Stale and dirty clones on this node

**86** git checkouts live at the top of the home folder of this node, out of 156 folders. Of those, **64 point to preceptoros-web** (worktrees and clones). Measured state of the ones that matter:

| clone | branch | last commit | uncommitted files | note |
|---|---|---|---|---|
| main clone of the web | main | 11-02 | 3 | **6 commits behind** origin at the first measurement of this session (Acho plan) |
| `p0x` | `haiku/optimizaciones-20261031` | 10-30 | **130** | the monorepo, on a side branch, with 130 uncommitted files |
| `preceptoros-coder` | main | **09-28** | 14 | a web clone frozen five weeks ago, with work inside |
| `preceptor`, `preceptor-os-core` | `codex/meter-motores-p1-identidad-20261016` | 10-16 | 3 each | two clones of the app on the same old branch |
| `terminal-familia-20261102` | `claude/tf1-texto-familia` | 11-02 | 19 | the live TF train, in progress (expected) |
| `hexelion-nexo-publico` | main | **08-27** | 0 | two months behind its repo |
| `aduana` (two clones) | two different side branches | 10-25 / 10-30 | 2 / 0 | the default branch on GitHub is a third one |

The lesson of the stale clone (E-0) is measured here: a session that opens the main clone of the web without `fetch` measures a world six commits old.

### 3 · The seal cascade

- Served letter `do` (`public/sw.js`, main `dbd5c114`). Production equals main.
- **29 letters re-issued** on main after #271 (E-1, 10-23): each names two builds.
- A local branch `haiku/version-monotona-20261101` exists on this node. Its name says it addresses monotonic versions. Its contents are not read in this piece (scope).
- Pending reseals declared: AC-0 of Acho (#575) waits behind the TF train. The letters are administered by the Mesas.

### 4 · Retired pieces that keep value

- The TheGame quarantine (outside every repo): `fourier-shapes.js` 215 lines, `audio-engine-core.js` 169 (FM broken, lines 106-108), `audio-engine-recipes.js` 190, `render_seed.js` 32 (Acho plan, finding 3). Value: the 220+(hue/360)·660 Hz recipe and the history of the determinism canon.
- The three deleted repos above.
- Archive clones: `archive_PreceptorOS_20261012` (main, 09-28) and `archive_cinek_automatico_20260810`.

## Main vs texts: contradictions found

1. **Three repos claim the same homepage** (web, lab, app → preceptoros.org), but only the web is served there. The other two descriptions promise a public surface that answers 404.
2. **`aduana`'s default branch is a feature branch** (`codex/node-gateway-worker-20261016`). Anyone who clones it gets a 16-day-old proposal as «main».
3. **`p0x` main has not moved since 10-28** while the rack decrees of S5 (heartbeat, HEXELION as sovereign of the rack) would land there: `NO_DATA: no commit on master after 10-28`. Pushes to p0x are blocked by design in the rack (decree RT-3C ·6549828098, E-1).
4. **companion, aduana and CineK** have no description or «n/a». A public repo with «n/a» is a public promise of nothing.

## Limits of this piece

- Contents of repos are not audited, only their shape (heads, branches, CI, descriptions, served paths).
- Production of non-web repos is not probed beyond five paths. A surface served elsewhere (a subdomain or a Pages URL) is not seen.
- The clone census covers the top of the home folder of this node only, not the other nodes (propose-only).

## Checklist

- [x] E2-1 · 13 cards with the three columns.
- [x] E2-2 · debt: red CI, clones, seal cascade, retired value.
- [x] E2-3 · main ↔ texts contradictions.
- [x] E2-4 · corrections: 13 not 12; three deleted repos still cloned.

## Log

- 2026-11-02 · E-2 written on main `dbd5c114`. Docs-only.
