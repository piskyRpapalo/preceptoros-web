# Report · the red window of test_web on main a1fb19a2 · 2026-11-02

Measured by the Mesa (diagnostic probes on PR #570, never to be merged):

1. The gate step "Gates completos n=2" failed at ~70 s on push to main a1fb19a2 (09:38Z), on this PR's merge ref (09:43Z) and on PR #556's rebased head (09:43Z).
2. The same step ran green over the same region in the probes of 10:06Z and 10:33Z (probe report branch: mesa/diagnostico-n2-20261102-report). The red window matches the runner-pool migration notice (ubuntu-latest to Ubuntu 26, active since 2026-10-19), not deterministic content of this branch.
3. The pure battery of this head is green locally: test_web 75/75 (3 skipped), arnes_sw 24/24, lexicon gates, unittests.
4. Left for the director: atlas/openworld_browser.mjs failed pass 2 in the 10:06Z probe — flaky over the #561 openworld content; watch it on the next runs.

Docs-only receipt. Reason this branch moves to a new head: FIRMA nueva por sha exacto.
