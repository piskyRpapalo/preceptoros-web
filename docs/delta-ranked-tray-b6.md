# B6 · delta-ranked-tray: retrospective mission distance

**State:** PROPOSED implementation on a draft branch. Not a live alarm.
**Authority:** read-only, propose-only. Never sign, merge, reorder, or block a build.
**Canonical source:** section 9 of docs/canon-map-details-20261107.md.
**Existing ranking:** docs/tablero-nodata-20261108.md counts missing evidence and prerequisites. Distance does **not** replace difficulty.

## Problem and example

A mission can be discovered late but belong conceptually between two earlier missions. A GitHub issue number stays stable; a conceptual position is separate. If 779, 780, 781 and 782 were built before mission 778.5 was introduced, the new mission has distance D=4. It may still be valid to build 783 first. The tray makes the gap visible, not authoritative.

The two input chains remain separate:
1. Ideas are reviewed, classified and admitted into the **single** canonical mission map.
2. Delivered work carries exact GitHub commit evidence.

This feature computes a read-only view of those chains. It is **not** a second mission store.

## Pure contract

Core: atlas/puros/delta_ranked_tray.js. Tests: atlas/delta_ranked_tray_cases.mjs.
The existing atlas/every_case.mjs discovers this test file during gate CI.

Input is a normalized view, not a fixture presented as live evidence:

- schema = preceptoros.delta-ranked-tray/1
- catalog_sha = 40-character Git commit digest of the catalogue snapshot
- events in **causal** order (never inferred from wall-clock time)
- introduced: kind, immutable id, decimal position (example 778.5), source GitHub issue/PR URL, contracts list or null
- built: kind, existing mission id, exact build sha, GitHub PR URL

Positions use exact decimal fractions. A position is **not** a GitHub issue number. A repeated id, colliding position, missing source, invalid digest or build without introduction returns NO_DATA with cause. This first contract permits one delivered build per mission; additional deliveries require a separately reviewed extension.

For each unresolved mission, count later-position builds:

- D = builds already delivered **before** its introduction.
- A = builds delivered **after** its introduction.
- I = count of later delivered missions sharing explicitly declared affected contracts; if any relevant contracts are unknown, I = NO_DATA, with a known minimum for inspection.

No arbitrary severity score. No hidden priority update. A resolved mission leaves the open-alert view. The first three later ids are only a short trace, not the full evidence chain.

## Evidence boundaries

CALCULATED means deterministic arithmetic over declared inputs. It does not mean GitHub provenance has been independently authenticated. The output states DECLARED_NOT_VERIFIED. Contracts are declared relationships; a model's semantic guess does not become a measured dependency. The final adapter must verify its sources and preserve NO_DATA with cause.

Today the module is tested using **synthetic** events. A normalizer that reads the canonical mission map and GitHub merge receipts is **not implemented**. Consequently the live alarm and real retrospective count are NO_DATA: source_adapter_not_built.

## Next bounded piece

Read-only GitHub input adapter with exact source references; a red test for unverified sources, and a non-blocking Actions summary when the data exists. Do not add a separate registry or write to the canonical map from CI. Only after that adapter is measured should Lab display the same alarm.

Agent: Codex
Model: GPT-6
Run: NO_DATA (live GitHub adapter)
