# World publisher redirect compatibility

Cloudflare Workers does not implement `redirect: "error"` on Request: constructing it throws TypeError before the service binding runs. The world publisher caught the exception as `world_publisher_unavailable`. Use `manual` so a redirect remains a 3xx response; the existing non-OK guard rejects it without following. The binding stays fixed and the failure remains closed.

Reference: https://developers.cloudflare.com/workers/runtime-apis/request/ (Request redirect modes).

Local regression: `workerd test tests/world_worker_workerd.capnp` with compatibility dates 2026-08-27 and 2026-10-16 and a synthetic service binding. The prior source reproduced 503 with `world_publisher_unavailable`; the corrected source returned 200. `node --test tests/world_publisher.test.mjs tests/canonical_apex.test.mjs` verifies the guard and rejects a synthetic 302. Production delivery and a real heartbeat remain NO_DATA until separately checked; no deployment is included.

Authorship: Codex (GPT-6.1-Terra).
