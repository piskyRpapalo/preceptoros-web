# World publisher bridge

Proposal; canon amendment in PR #499 requires human sign-off. This slice starts after JN-5; rebase if earlier pieces move because they share page and seal files. No service is deployed.

A visitor explicitly chooses Check live nodes; no publisher request is made on page load. A fixed same-origin worker service binding reads Aduana's heartbeat publisher. The browser has no device address, key, or choice of upstream. No chat is routed through this path. Invalid, missing, oversized or unavailable state fails closed; the tutorial remains. Nodes require the existing state reader's live/stale evidence and do not imply model availability. Published data is never stored by the service worker. A view expires after 60 seconds or page hide and requires another explicit check.

Tests: worker/client mocked transport and state reader; service worker harness; test_web. Real service binding, production, heartbeat, browser flow and accessibility are NO_DATA until exercised on the rack and CI. Node identity, capacity, and model answers remain separate evidence.

Exclusive new files: worker/world_state.js, public/game/world_feed.js, tests/world_publisher.test.mjs. Shared integration points: worker/index.js, wrangler.jsonc, public/game/openworld_page.js, public/openworld/index.html, public/sw.js and seal. They must be rebased and resealed after each accepted JN piece. Version ar is provisional and must be rechecked at landing.

Authorship: Codex (GPT-6.1-Terra).

## Integration receipt · 2026-10-30

Local candidate after the JN-5 branch snapshot `5e85cd8`; this is not the current main or proof of a deployed integration. The control uses the existing 44 px minimum style. After that change: `node --test tests/world_publisher.test.mjs tests/canonical_apex.test.mjs` passed (2 files); `node atlas/puros/openworld_state_casos.mjs` passed 19/19; `node arnes_sw.mjs` passed 24/24; `python3 test_web.py` passed 75 cases with one skip. The OpenWorld browser harness could not start: sandbox denied its loopback socket (`EPERM`). A source CSS minimum is not a measured device accessibility result.

Acceptance remains conditional on a candidate rebased on the current JN chain, successful independent review and CI for its exact head, the proposed canon amendment, and an operator-run live service and heartbeat check. Until then the service binding, live refresh, recovery, browser interaction, mobile usability and real node remain NO_DATA. Historical JN-5 candidate used here predates the retarget; no code from that candidate is represented as main.
