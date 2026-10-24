# One-shot preflight · 2026-10-26

Status: proposal-only preflight for the scheduled one-shot. Branch base:
WEB `d3ec49775b6dae686fd01692efb2c7f030c46d1f`. Measurements ran at
2026-10-24 14:27 Europe/Lisbon, the date reported by the session clock; the
filename and evaluation window follow the Mesa's commission date. No seal is
assigned: **ASIGNACIÓN PENDIENTE**.

The original annex path `docs/fusion-or-oneshot/` is not present in this
checkout. The path-O summary is traceable in
`study/proposals/ROSETTA_HARVEST2_20261023.md:52`, and the prior T1-T9
measurement record is in `RESOLUCION_FUSION_ONESHOT_MESA_20261021_PARTE1.md`
and `PARTE2.md` in the proposal archive. Therefore, exact annex wording beyond
the Mesa-supplied card is **NO_DATA**, cause: original annex file unavailable
in the current WEB tree. This report distinguishes current measurements from
that historical record.

## T1-T9 against current main

| Task | State | Current evidence and required one-shot handling |
|---|---|---|
| T1 · deployment drift | MEDIDO | `cat wrangler.jsonc; sed -n '1,25p' .github/workflows/deploy.yml; rg -n 'Workers|Pages' docs/ESTADO.md docs/canon-service-worker.md DEPLOY.md` → `wrangler.jsonc` serves `./public` as Workers Static Assets; `deploy.yml` is manual `workflow_dispatch`, main-only, production environment. `docs/ESTADO.md` now says Workers. `docs/canon-service-worker.md` retains historical Pages wording. `DEPLOY.md:3` still claims ESTADO says Pages, now stale. Measured in this preflight session. |
| T2 · route counter | MEDIDO | `python3 bin/contar_rutas.py --check-doc DEPLOY.md` → `OK · 200 shell entries, 199 unique routes, 1 duplicate`. The document's 200/199 declaration matches the current tree; run this again in the one-shot's final pass. |
| T3 · deploy runbook | OPEN | `DEPLOY.md` exists (introduced by `a2a2867`; route count updated by `196f2ea`) and documents manual deploy/rollback. Its success example still says 234 files, while `public/` currently has 244; its opening Pages claim is stale. Re-measure and update the runbook only if authorized in the one-shot scope. No deploy was run here. |
| T4 · deploy workflow | OBSOLETE | The former “workflow absent / decision pending” state was replaced by `daa39a1 Add manual deployment workflow`. Current `.github/workflows/deploy.yml` permits only manual dispatch on main, with a production environment. No workflow was invoked. |
| T5 · size ceilings | MEDIDO | `python3` public-tree census → 244 files, 1,495,908 B total, largest file 44,891 B; no file exceeds 25 MiB. `public/game/*.js` → 134 modules, largest 16,295 B, zero over 16,384 B. Three non-game public assets exceed 16,384 B; the piece ceiling is not a blanket asset-security limit. Measured in this preflight session. |
| T6 · Bubble frames | MEDIDO | `node atlas/codex_casos.mjs` → 16/16 OK; six reported frames 844, 969, 1,002, 950, 1,013, 1,019 B. `node atlas/bout_casos.mjs` → 12/12 OK; four frames 1,014, 734, 934, 798 B; complete sample package 282 B. All 10/10 samples are below 1,024 B. `node atlas/bubble_language_casos.mjs` → 18/18 OK. |
| T7 · accessibility checklist | OPEN | `node tests/creation_parity.test.mjs` → 4/4 simulator tests. `docs/creation-runbook.md:57-67` explicitly separates simulated parity from real keyboard, touch, audible playback and screen-reader evidence. Physical channels remain NO_DATA, cause: no physical interaction/perception was performed in this preflight. |
| T8 · vocabulary sweep | OPEN | Command: `grep -riE '<legacy rule>' public/ --include='*.js' --include='*.json' --include='*.html' --include='*.css'` (pattern omitted here to avoid reproducing the banned terms in a public diff). Output: 41 raw matches; the substring scan includes technical identifiers and declared policy inventories. Current `tests/context_hygiene_guardian.test.mjs` defines a narrower agent-facing-file gate, while `atlas/codex_casos.mjs` checks Bubble output. The exact annex vocabulary list is unavailable with the annex; do not call the broad result clean or change tests. Claude should record the raw matches and a rule-based triage. |
| T9 · options | OBSOLETE | The 2021 alternatives are superseded in current main: `public/creation.html` and the Bubble package/paint flow exist; WEB#294 merged the image-package contract (`e901d87c`), WEB#295 merged the paint motor (`5a3096fc`). A generation model/runtime is still NO_DATA; do not infer one from the package contract. |

The one-shot must append its own measurements and distinguish existing code
from physical/live evidence. Current main commits include E4 `c87d4e8b`, E7
`7692da2`, prompt package WEB#294 `b9dae52`, paint WEB#295 `9e0f170`, and this
preflight base WEB#296 `d3ec4977`.

## One-shot process register scaffold

Claude's limit: one five-hour window. Stop at the first step requiring FIRMO;
record the stop and do not route around it. One agent, one session, one PR.

| Field | Append during the one-shot |
|---|---|
| Partida | `commit=<full SHA>` · `branch=<name>` · `started_at=<ISO-8601>` · `engine=<declared model>` |
| T1-T9 step | `task=<Tn>` · `command=<exact command>` · `exit=<integer or NO_DATA>` · `elapsed=<seconds>` |
| Result | `state=<MEDIDO/OBSOLETO/OPEN>` · `output=<short exact result>` · `evidence=<file:line or receipt>` |
| Human dependency | `human_needed=<yes/no>` · `gesture=<what, or none>` · `FIRMO_needed=<yes/no>` |
| Stop point | `stopped_at=<task or end>` · `cause=<exact cause>` · `next_action=<none or authorized step>` |
| Verification boundary | `NOT VERIFIED=<claim>: cause=<why>`; include physical hardware, live hosting, external account, and screenshots only if relevant |
| Gate pass | `pass=<1/2 or 2/2>` · `command=<gate.yml sequence>` · `result=<green/red/NO_DATA>` · `failed_steps=<exact list>` |
| Closeout | `files=<paths and byte counts>` · `SCRUB=<result>` · `seal=ASIGNACIÓN PENDIENTE` · `PR=<URL or NO_DATA>` |

Append a row per attempted step, including steps not reached. Never convert a
skipped, timed-out, inaccessible or simulated check into green.

## Local full-gate passes

Source: `.github/workflows/gate.yml`, job `test_web`, which defines two passes
over one tree. The preflight ran all 45 workflow commands twice on this branch.
An initial local runner attempt used the misspelled path
`atlas/hud_readings_casos.mjs` and returned 1 twice because that file is absent.
This was a runner-command typo, not a repository test failure; those attempts
are excluded from the two gate passes. The command was corrected to the exact
workflow path before the complete runs. No test or source file was changed.

### Pass 1

Result: GREEN, 45/45 commands returned exit 0. `test_web.py`: 78 tests, one
skip; `atlas/test_atlas.py`: 189 tests, zero failures; Node test glob: 317
tests, 312 pass, five skip, zero fail; SW harness 22/22; aggregate case suite
94/94. Aggregate command-reported runtime: 56 s. Runner: Python 3.14.4, Node
v22.22.1. The runner continued each command to capture every result; the
official workflow is fail-fast on a red.

### Pass 2

Result: GREEN, 45/45 commands returned exit 0. Same complete command list and
tree as pass 1: `test_web.py` 78 tests/one skip; Atlas 189 tests/zero failures;
Node test glob 317 tests/312 pass/five skip/zero fail; SW 22/22; aggregate cases
94/94. Aggregate command-reported runtime: 54 s. Runner: Python 3.14.4, Node
v22.22.1. The five and one skips are reported, not counted as failures or
physical evidence.

## Closeout

- No served file, test, workflow, seal, deployment, credential or main branch
  was changed by this card.
- `ASIGNACIÓN PENDIENTE`; no seal was selected or invented.
- No merge, deploy, signing, or PR creation was performed by this preflight.
