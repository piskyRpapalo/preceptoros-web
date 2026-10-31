# visitor-browser-flake

Date: 2026-10-31
Law: Mesa web comission «EU-1 · PIEZA 2 · CURA DEL FLAKE» (2026-10-31): diagnose the real cause of contention, cure the root, declare any isolation or reordering. Sleeping the test is not a cure. One piece, one PR, FIRMA per exact head. EU-1 piece 1 (single visit pass) is a separate branch.

## Objective

The test «Chromium visit signature verifies independently through OpenSSL» (`tests/visitor_account.test.mjs`) passes every time, and when it fails the reason is printed.

## Problem and why

Earlier this session the test failed in 1 of about 6 combined runs (`node --test` with four visitor test files). The failure was `Command failed: node atlas/visitor_account_browser.mjs`. The browser check printed its own failure list (`fallos`) on stdout, and `execFile` hides stdout behind the generic message, so the cause was not visible.

Two failure modes were seen in the browser check, in a parallel burst of 4 × 4 runs (4 of 16 failed):

- `NO_DATA: Chrome assigned no CDP port; startup timeout` (Chrome did not write its debugging port within 10 s).
- `page lifecycle invalidates visit` followed by `TypeError: Cannot read properties of undefined (reading 'includes')` (the page evaluation returned no value).

## Scope

In scope: the test reports the browser check's own failures; the measurement of the flake; the declared cause.

Out of scope: lengthening the 10 s wait or retrying (sleeping the test is not a cure); changing the browser check's logic; the launcher `atlas/chrome_launch.mjs`.

## Measurements (this session, 2026-10-31)

| run | condition | result |
|---|---|---|
| 4 parallel × 4 rounds | during the disk-quota episode (EDQUOT on the temporary directory) | 4 of 16 failed (both modes above) |
| 4 parallel × 4 rounds, instrumented copy | after the quota was cleared | 0 of 16 |
| 4 parallel × 6 rounds, instrumented copy | after the quota was cleared | 0 of 40 |
| 8 parallel × 3 rounds, instrumented copy | after the quota was cleared | 0 of 24 |
| single run, cold start | after the quota was cleared | pass, 0.72 s |
| `node --test` on the four visitor files, three rounds | after the quota was cleared | 0 failures |

Total since the quota was cleared: 80 browser runs, 0 failures. The instrumented copy logged no raw evaluation error (no `EVAL-RAW` line) in those runs.

## Declared cause

Not proven in code. The evidence points to the environment: both failure modes happened only while the temporary directory was refusing writes (EDQUOT). Chrome needs that directory for its profile and its debugging-port file, and a refused write would look exactly like «no CDP port» and an empty evaluation. This is a hypothesis, not a measurement of the write refusal itself.

Shared fixtures checked and found not to be the cause: the static server and the Chrome debugging port are both on port 0 (per run); the Chrome profile is a fresh `mkdtemp` per run; the OpenSSL check uses its own folder per run.

## Cure in this piece

Visibility, which is a defect fixed here. The test now prints the browser check's own failure list in its assertion message. Verified by sabotage: with Chrome replaced by a binary that exits, the test reports `NO_DATA: Chrome assigned no CDP port; Chrome exit=1`.

Not cured here: the environmental trigger (disk quota on the temporary directory). The operator fix is `CLAUDE_CODE_TMPDIR` pointing at a disk with space; the session must be restarted to take it.

## Checklist (one piece = one PR)

- [x] VF-1 · the test surfaces the browser check's failure list (`tests/visitor_account.test.mjs`).
- [x] VF-2 · sabotage: Chrome replaced by a binary that exits; the test fails with the cause in its message.
- [x] VF-3 · real runs: `node --test` on the account test, three runs, all pass; 80 browser runs measured without failure (table above).
- [ ] VF-4 · the operator sets `CLAUDE_CODE_TMPDIR` to a disk with space before the next visit test in a loaded session (not a code change).

## Verification evidence

- `tests/visitor_account.test.mjs` on this branch: sabotage fails with `browser check failed: {"fallos":["Error: NO_DATA: Chrome assigned no CDP port; Chrome exit=1 signal=null"]}`; three real runs pass.
- Measurements in the table above, taken with an instrumented copy in a scratch folder (not committed).

## Standing signature

Required: FIRMA of this head before merge (the Mesa serves it under the open decree). No public text naming any internal reference.

## Methodology relief

None.

## Log

- 2026-10-31 · Reproduction under four and eight parallel runs; both failure modes captured while the temporary directory was refusing writes. Then 80 runs with no failure after the quota cleared.
- 2026-10-31 · Test fixed to show the browser check's failures. Cause declared as the environment, not proven in code.

## Next step

FIRMA of this head. The operator sets `CLAUDE_CODE_TMPDIR` (VF-4). Then piece 1 (single visit pass), whose inventory is in `odd/tasks/usuario-efimero-pasada.md` on its own branch.
