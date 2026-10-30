# heartbeat-state-writer

Date: 2026-10-30
Status: **PLAN · PROPOSE-ONLY · REQUIRES_FIRMO + canon amendment before served code.**
Law: D7 heartbeat decree `buzon#30 ·6524731435`; one-map decrees `·6524386655`,
`·6524440790`, `·6524501049`; NORTE `·6525335471`; one state, many renders (A9).

## Objective

Make measured D1 heartbeats appear on the one web map as `preceptoros.openworld-estado/2`.
The existing Aduana Worker is the only publisher. The web reads its published state;
it does not write D1, copy D1 into a build-time snapshot, or keep a second node store.
The page shows only public labels `1`–`4`; internal sender pseudonyms and credentials
never become public labels or page content.

## Measured baseline

- Aduana PR #9 implements D7: `POST /api/v1/latidos`, append-only D1 evidence, and
  `GET /api/v1/latidos` as the sole publisher. Its response is schema v2, uses the
  300-second LIVE→STALE threshold, and includes a coverage state and cause.
- Aduana PR #10 adds the F1 one-shot sender; a 240-second timer is proposed in its
  runbook. The deployed sender, schema import, credential, and timer are operator
  actions, not claims this plan can verify.
- Live probe on 2026-10-30: `https://api.preceptoros.org/health` returned
  `{"estado":"vivo","version":"preceptoros.aduana/2"}`. The Mesa reports deployment
  record `ce05d18a` and a live D1 binding.
- Live `GET /api/v1/latidos` returned HTTP 200, schema v2, coverage
  `NO_DATA · identidades_canonicas_no_configuradas`, zero nodes, and zero buildings.
  Therefore no node is currently publishable and no first heartbeat is visible.
- Web `public/openworld/index.html` currently reads the same-origin static
  `/openworld/estado.json`; `public/game/openworld_state.js` validates v2. It does not
  yet read Aduana. The canon still says rack heartbeat is `NO_DATA` because the page
  does not read it at load (`docs/canon-node-evidence-and-account.md`).

## Route proposal · D1 → Aduana → web

1. The approved F1 sender posts one bounded heartbeat to Aduana. The sender key stays
   in its local credential store; neither key nor hash enters the page.
2. Aduana validates the configured sender and cell, appends the receipt to D1, and
   remains the only service that projects the latest row into state v2. No web build
   reads D1 credentials or publishes a parallel snapshot.
3. The web reader requests the existing
   `https://api.preceptoros.org/api/v1/latidos` endpoint with `GET`, `cache: no-store`,
   `credentials: omit`, and redirects refused. Its existing CORS contract admits the
   canonical web origin. The response body is the map's state JSON; the term
   `estado.json` names this contract, not a periodically frozen artifact.
4. Feed the validated response to the existing state validator and colony renderer.
   Keep the tutorial cabin as tutorial scenery; do not promote it into a machine row.
   With no valid node, retain the cabin and show the publisher's exact `NO_DATA` cause.
   A fetch, CORS, schema, or size failure must not preserve an old `LIVE` claim.
5. Refresh while the page is open so Aduana can change a node from `LIVE` to `STALE`
   after 300 seconds. The server timestamp and seal decide freshness; browser wall time
   never decides game state. On refresh failure, show `NO_DATA` with cause.

## Public identity and geometry

The Worker currently keys its sender by a canonical F1 pseudonym and publishes that
identifier as `id`. The public map is ordered to show only `1`–`4`. Before serving any
node, the signed/operator configuration must therefore provide a unique public slot
(`1`–`4`) and its unique axial cell for each admitted canonical sender. The public
projection emits the slot as `id`, never the internal pseudonym. No ordering or
host-to-slot mapping is inferred. Until this mapping exists, coverage remains `NO_DATA`
and the web draws no machine node. This is configuration data, not a reason to delay
the generic terminal or local device chat.

A published node has no building unless a later measured record supplies one. `STALE`
may remain visible with its seal, but it does not establish that the app is responding
now; actions requiring a live device must remain unavailable on stale rows.

## Canon amendment requested

Propose an append-only amendment to `docs/canon-node-evidence-and-account.md` and the
active node-state canon: the authenticated D7 publisher is the source of live/stale
node presence; the web reads only that publisher's v2 state; no separate heartbeat
store or build-time file is authoritative. A `LIVE` row requires a valid measured
heartbeat within 300 seconds, a configured canonical identity, and a public slot.
After expiry the publisher returns `STALE`; missing configuration, no first row, or
unavailable publisher returns `NO_DATA` with its cause. Existing node-card evidence
and user/browser identity remain separate from heartbeat liveness.

This is a proposal. Do not edit the active canon or serve the reader until the
Sovereign signs this amendment and the exact implementation PR.

## Implementation ladder · one piece per PR

- [ ] HSW-1 · FIRMO and canon amendment as above; update current deployment facts in
  docs without exposing D1 identifiers, local paths, sender aliases, or credentials.
- [ ] HSW-2 · Aduana public projection maps each canonical sender to one approved
  numeric public slot and cell; rejects duplicate slots/cells and any fifth identity.
  Keep sender identity private. Add sabotage cases for duplicate, missing, and
  out-of-range mappings. This is a separate Aduana PR.
- [ ] HSW-3 · Web source adapter reads the existing GET response and preserves its
  `NO_DATA` cause. Test network refusal, CORS denial, redirects, invalid schema, bad
  dates, `LIVE` without date, duplicate IDs/cells, unknown slot, and >1,024 UTF-8 bytes.
- [ ] HSW-4 · Mobile + desktop browser checks: cabin remains available; nodes appear
  only for valid `LIVE`/`STALE`; only `LIVE` enables device actions; exact public labels
  are `1`–`4`; no internal aliases or credentials appear; no unrelated origin is read.
- [ ] HSW-5 · Production verification after operator actions: one measured sender receipt
  appears through Aduana and on `/openworld/`; record state, cause, request count and
  seal. Until this happens the production result is `NO_DATA`.

## Gates and boundaries

- Each code/document correction is its own PR; every served-code PR needs exact-head
  FIRMO and its assigned web seal. Never choose a seal letter or merge.
- Keep the whole response under 1,024 UTF-8 bytes, including coverage metadata. Aduana
  currently bounds the `colonia` member; the full-envelope limit needs an executable
  sabotage case before claiming the contract.
- No secret, internal sender pseudonym, host name, device path, D1 identifier, or key
  appears in public content. No network request is made to a device; only the fixed
  Aduana GET is used after the canon amendment.
- Existing physical slot mapping and first heartbeat: `NO_DATA` until measured. No
  buildings, apps, or live devices are inferred from the heartbeat route being healthy.
- B1–B5 remain follow-on pieces. Aduana deployment enables a route; it does not complete
  the benchmark record, lab feed, wave combat, or per-device run.

## Log

- 2026-10-30 · Live status re-measured: health v2 is live; map GET is HTTP 200 but
  reports `identidades_canonicas_no_configuradas`, zero nodes/buildings. The previous
  “not deployed” claim is superseded; first D1-backed public node remains NO_DATA.

## Required decision

FIRMO the canon amendment and then each implementation PR independently. Until then,
this document is the proposal and the deployed API's current empty projection remains
the honest map source.
