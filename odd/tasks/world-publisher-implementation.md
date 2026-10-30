# World publisher bridge

Proposal; canon amendment in PR #499 requires human sign-off. This slice starts after JN-3; rebase after JN-4/5 before landing because those pieces touch the same page and seal. No service is deployed.

A visitor explicitly chooses Check live nodes; no publisher request is made on page load. A fixed same-origin worker service binding reads Aduana's heartbeat publisher. The browser has no device address, key, or choice of upstream. No chat is routed through this path. Invalid, missing, oversized or unavailable state fails closed; the tutorial remains. Nodes require the existing state reader's live/stale evidence and do not imply model availability. Published data is never stored by the service worker. A view expires after 60 seconds or page hide and requires another explicit check.

Tests: worker/client mocked transport and state reader; service worker harness; test_web. Real service binding, production, heartbeat, browser flow and accessibility are NO_DATA until exercised on the rack and CI. Node identity, capacity, and model answers remain separate evidence.

Exclusive new files: worker/world_state.js, public/game/world_feed.js, tests/world_publisher.test.mjs. Shared integration points: worker/index.js, wrangler.jsonc, public/game/openworld_page.js, public/openworld/index.html, public/sw.js and seal. They must be rebased and resealed after each accepted JN piece. Version ar is provisional and must be rechecked at landing.

Authorship: Codex (GPT-6.1-Terra).
