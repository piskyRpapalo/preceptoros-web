# Design · the final /aduana route and receiver (piece 1-B) · 2026-10-25

Status: **PROPOSAL · REQUIRES_FIRMA**. Design only. Nothing is implemented, deployed or
pushed. The gateway worker lives in a separate private repository; this document does not
change it. One decision is the Sovereign's: the route name (section 2).

## 1. What is measured

| Fact | Evidence |
|---|---|
| The public host answers 404 on `/health` and on `/aduana/cedulas`, with body `{"detail":"Not Found"}` (framework-style, not the worker's own shape). | `curl` 2026-10-25 |
| The worker's own 404 is `{"estado":"bloqueado","codigo":"ruta_ausente"}`. | worker source |
| So the service behind the public host is **not** this worker, or the worker is not deployed. Deployment is `NO_DATA`: the worker README says deployment is not part of its change. | README, route probe |
| The worker source routes `POST /aduana/cedulas` and marks it `PROVISIONAL: WEB piece 1 fixes the final route`. | worker `src/index.js` |
| The worker README and its tests use `POST /api/v1/cedulas`. | README, `test/worker.test.js:41` |
| The worker's own test suite: **0 of 3 pass**. Each test expects 503 or 422 and gets 404, because it posts to the README path the code does not serve. | `npm test` |
| The worker sends **no CORS headers** and handles no `OPTIONS`. A browser on the site cannot POST to it, and cannot read its errors. | worker source (0 `access-control` matches) |
| The web contract names `https://api.preceptoros.org/aduana/cedulas` (`public/game/node_reception_contract.js`). | web repo |
| The live node UI sends through `POST /api/v1/paquetes`, which admits only the apex origin. | `public/assets/enviar.js`, route map |
| The web receiver `public/game/node_file_receiver.js` parses a local file. No code in the web repo receives a cédula response from the gateway. | web repo |
| Trust anchors are empty (`public/game/node_trust_anchor.js`); door 2 cannot say "trusted". | web repo |

## 2. Decision for the Sovereign: one route name

Three names exist: `/aduana/cedulas` (web contract and worker code), `/api/v1/cedulas`
(worker README and tests), `/api/v1/paquetes` (the live transport). They must become one.

- **Option A · `/api/v1/cedulas` (recommended).** It matches the `/api/v1` family the live
  transport already uses, and the worker's README and tests were already written to it.
  Cost: change the web contract `ENDPOINT` in one web piece, and change the worker's route
  line and its `PROVISIONAL` comment.
- **Option B · keep `/aduana/cedulas`.** Cost: change the worker README and the 3 test
  requests, and keep a path outside `/api/v1` for a single endpoint.

Recommendation: **A**. One path, one family, the tests already agree with it.

## 3. CORS, required for the browser

Browser POST from the site needs a preflight answer and headers on every response, errors
included. Proposed contract:

- `OPTIONS` on the route → `204`, with `Access-Control-Allow-Origin: https://preceptoros.org`
  (the apex only, the canonical origin), `Access-Control-Allow-Methods: POST, OPTIONS`,
  `Access-Control-Allow-Headers: Content-Type`, `Access-Control-Max-Age: 600`, `Vary: Origin`.
- Any other origin → no `Access-Control-Allow-Origin` header; the request still fails
  closed. No credentials; no wildcard.
- Every JSON response, including `fail(...)`, carries the same origin header, so the page
  can read `codigo` on a refusal.

## 4. Receiver contract (what the web reads back)

The worker answers `202 {estado:"encolado", recibidos:1, paquete:{esquema:"preceptoros/cedula-nodo/1", pares:[cedula], firma:null}}`.

- The web must treat `encolado` as received, not as trusted. The package is unsigned by design.
- Door 2 (`node_signature_verify.js`) verifies with the anchors. Until the key ceremony fills
  `node_trust_anchor.js`, the result is `NO_DATA` with cause "anchors empty", not `ok`.
- The web receiver for `preceptoros/cedula-nodo/1` is **not built**. It is a separate web
  piece after the route is fixed.

## 5. Gaps, stated as gaps

| Gap | State |
|---|---|
| Route name | `REQUIERE_FIRMA` (section 2) |
| Worker deployed at the public host | `NO_DATA` · cause: the probe finds a different service; the worker README says deployment is not part of its change |
| D1 database id | `REQUIERE_FIRMA` · the worker config holds a placeholder |
| Worker test suite | 0/3 · route mismatch (section 1) |
| CORS | absent in the worker |
| Trust anchors | empty · key ceremony pending |
| Browser end-to-end send | `NO_DATA` · needs a deployed route, CORS and a human send |

## 6. Gates before any implementation

1. Sovereign decides the route name (section 2).
2. Worker: route + CORS + the 3 tests green (`npm test`), and a local D1 harness (README:
   "D1 live integration is NO_DATA until a local D1 harness exists").
3. Web: `ENDPOINT` in `node_reception_contract.js` changes in the same PR as the test that
   pins it (`tests/node_reception_contract.test.mjs`).
4. A separate Sovereign FIRMO for deployment. Nothing deploys from this document.

## 7. Re-measurement · 2026-10-30

The deployment findings above are the historical baseline from 2026-10-25 and no
longer describe the current service. The Mesa reports the Worker deployment and D1
binding live. A fresh read-only probe measured `/health` as
`{"estado":"vivo","version":"preceptoros.aduana/2"}` and `GET /api/v1/latidos` as
HTTP 200. Its state was `NO_DATA` with cause `identidades_canonicas_no_configuradas`,
with zero published nodes and buildings. The service is therefore deployed, while no
canonical heartbeat identity is yet published. This probe does not establish that
`schema.sql` has been imported or that a sender credential, timer, or first heartbeat
is active. See `odd/tasks/heartbeat-state-writer.md` for the proposed web integration.
