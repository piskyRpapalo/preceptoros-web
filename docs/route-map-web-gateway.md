# Route map · web ↔ gateway (R-RUTAS, web half) · 2026-10-25

Status: **PROPOSAL · REQUIRES_FIRMA**. Read-only map. Every probe was an
unauthenticated `curl` with an empty or absent body; nothing was signed, sent or
stored. Measured 2026-10-25 against `origin/main` `91e4858`.

## Verdict

The gateway host answers, but **neither web transport works end to end today**:

1. **Door 1** (`POST /aduana/cedulas`) is **not bound**: 404 on GET and on POST.
2. **The live transport** (`GET /api/v1/reto` → `POST /api/v1/paquetes`) is
   bound, but its CORS allowlist names only `https://preceptoros.org`. The site is
   served (and read by the faro) on `https://www.preceptoros.org`, an origin the
   gateway rejects.
3. **Door 2** (signature verification) has empty trust anchors: the ceremony is
   pending, so nothing can verify as trusted yet.

## Probes

| Request | Origin header | Status | Relevant response |
|---|---|---|---|
| `GET /aduana/cedulas` | — | 404 | `{"detail":"Not Found"}` |
| `POST /aduana/cedulas` `{}` | — | 404 | `{"detail":"Not Found"}` |
| `OPTIONS /aduana/cedulas` (POST) | www | 400 | `Disallowed CORS origin` |
| `GET /` | — | 404 | `{"detail":"Not Found"}` |
| `GET /api/v1/reto` | www | 200 | **no** `access-control-allow-origin` |
| `GET /api/v1/reto` | apex | 200 | `access-control-allow-origin: https://preceptoros.org` |
| `GET /api/v1/paquetes` | — | 405 | `allow: POST` (route bound) |
| `OPTIONS /api/v1/paquetes` (POST, content-type) | www | 400 | `Disallowed CORS origin` |
| `OPTIONS /api/v1/paquetes` (POST, content-type) | apex | 200 | `access-control-allow-origin: https://preceptoros.org` |

Preflight responses list `GET, POST, OPTIONS` and allow credentials. Both
`https://www.preceptoros.org/` and `https://preceptoros.org/` serve the site with
200; the apex does not redirect to `www`.

Consequence by the CORS rules (inferred from the headers above, not from a
browser run, which is `NO_DATA`): a visitor on `www` cannot read the challenge
and cannot pass the preflight of the packet POST. A visitor on the apex can.

## The web pieces

| Piece | Role | State on main |
|---|---|---|
| `public/game/nodos-cedulas.js` | static catalog `atlas.cedulas_nodo/1` (two accounts, two nodes) | static; no network |
| `public/game/node_reception_contract.js` | door 1 contract: `ENDPOINT https://api.preceptoros.org/aduana/cedulas`, `POST`, byte ceiling | **declared only**: no file under `public/` calls `fetch` on it |
| `public/game/node_signature_verify.js` | door 2: verifies against `node_trust_anchor.js` | anchors `key_sha256: null`, `manifest_sha256: null` (ceremony pending) |
| `public/assets/enviar.js` | live transport: `GET /api/v1/reto`, then `POST /api/v1/paquetes` (`cache: no-store`, JSON) | used by `ui-nodos.js:161` (schema from `nodos.js` `ESQUEMA_ENVIO`) and `page-comment.js` |

So the node UI sends through `/api/v1/paquetes`, **not** through door 1. Door 1
and the live transport are different routes with different contracts
(`docs/node-reception-contract.md` vs `enviar.js`).

## Other references in the repo

`README.md:75`, `llms.txt:23` and `public/llms.txt:23` promise the host is called
only when a visitor presses send. `SECURITY.md:16` and
`docs/node-reception-contract.md:10` name door 1. `public/nexo-v1.json` documents
reto → paquetes. `arnes_sw.mjs:239` proves the service worker lets
`/api/v1/tasks` pass untouched (cross-origin). `humo_lenguas.py` targets
`/api/generate` (rack smoke test, not served). `test_web.py:90` allowlists the
host.

## Open `NO_DATA`, precisely

| Gap | Cause |
|---|---|
| Door 1 route bound? | **Measured no** (404 on GET and POST). Binding it is gateway work outside this repo. |
| CORS for `www` | **Measured rejected.** Fix is either adding `https://www.preceptoros.org` to the gateway allowlist or redirecting the apex/`www` to one canonical origin; both are outside this repo and need the Sovereign's scope. |
| Trust anchors | Empty by design until the key ceremony. |
| Receiver behind `/api/v1/paquetes` | `NO_DATA` · no signed packet was sent (an agent never signs). |
| Browser end-to-end send | `NO_DATA` · needs a human send from a real browser after the CORS fix. |

## Proposed order (for the Sovereign)

1. Decide the canonical origin (`www` or apex) and align the gateway CORS list.
2. Decide whether door 1 replaces `/api/v1/paquetes` for cédulas or stays a
   contract; until then the UI's real path is `paquetes`.
3. Key ceremony fills the anchors; only then can door 2 say "trusted".
