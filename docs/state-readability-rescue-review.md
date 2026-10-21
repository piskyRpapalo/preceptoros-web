# State readability rescue review

Status: proposal for review; no experiment files or runtime behavior are changed.

## Measured comparison

- Current main: `7e045b770eeff4aca333670165627bfc0cdae123`, dated 2026-10-21.
- Rescue reference: `ade52444bf1c0f92987b2f8e15d4e59de4ad3855`, dated 2026-10-16.
- The rescue reference adds nine `atlas/state_readability_*.mjs` files (1,208 lines total).
- Current main has three files under `atlas/legibilidad/`: `escena_w2_blanco.md`, `escena_w2_fotogramas.json`, and `fotogramas.mjs`; it has no `atlas/state_readability_*.mjs` files.
- The probe imports `atlas/evidence/state-readability-20261015/source-baseline.json`. That path is absent from current main and present on the rescue reference. The dated evidence directory contains additional model-output and score files that are also absent from current main.
- The rescue branch differs from current main by 443 paths overall. It is a historical snapshot, not a clean candidate branch for direct integration.

## What the nine files cover

The candidate set contains a probe and fixtures, named and geometry projections with case files, and prompt/representation experiments. The current three-file folder is a W2 frame-and-rubric reader. The repository evidence does not establish that the current reader replaces all candidate checks, nor that the candidate experiments remain valid against today's source.

## Proposal

Do not merge the nine files as-is. First rebase the experiment conceptually, not the old branch: identify which assertions are still missing from current `atlas/legibilidad/fotogramas.mjs`, port only those checks into the current harness, and regenerate any evidence against the current source under an explicitly approved measurement. Keep historical response and score artifacts out of the active gate unless their provenance and current comparability are revalidated.

## Open measurements

- Current-main execution of the rescue probe: NO_DATA; its required source-baseline artifact is absent.
- Whether all nine modules are obsolete: NO_DATA; feature equivalence has not been tested.
- Whether any historical model scores transfer to the current source: NO_DATA; source and fixture hashes differ or are unavailable on current main.
