# CI runs every case (W-04)

Measured on 2026-11-08: of the 73 `atlas/*_cases.mjs` files not named in `.github/workflows/gate.yml`, 14 are run by another gate (`atlas/test_atlas.py`, `tests/*.test.mjs`). **59 are run by no gate at all.** All of them exit 0 when run alone today, but an exit of 0 is not a verdict: some print JSON with `ok: false` and still exit 0.

1. For each of the 59 files, read how it reports: `node:test`, a JSON `casos`/`fallos` list, or a plain exit code.
2. Add one runner, `atlas/every_case.mjs`. It runs every unlisted `*_cases.mjs`, reads its verdict (exit code and any `fallos` or `ok: false`) and fails red with the file's name.
3. Wire the runner into gate.yml once. A sabotage case (a fake suite that says `ok: false`) must turn it red.
4. A suite that is red today gets its cause written here, then is repaired or, under the Sovereign's FIRMO, retired. It is never silently skipped.

Done when: the denominator is honest (CI runs = files present), the sabotage turns red, and the full gate is green.
