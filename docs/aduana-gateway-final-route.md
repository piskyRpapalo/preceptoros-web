# Aduana gateway final route · measured boundary and implementation contract

Status: design with implementation blocked on target identification. WEB base:
`cec9b309462dab703a6a59f661084c89df289d23`. This document does not assert
that a gateway route is deployed or available.

## Evidence at the creation seal

The E8-final receipt `buzon#19/6376680966` records two HTTP 502 responses from
the node credential export and a 404 from the queried provisional receiver.
The export was rejected; it was not queued. The signed node credential was
verified locally by the app's verifier. This evidence is separate from the
creation package and its LIVE seal.

The only inspected Aduana checkout was on
`codex/node-gateway-worker-20261016` at `fe9f07a8c90e78d81b89f3f6be257b7277958b61`.
Its `origin` URL is `https://github.com/piskyRpapalo/aduana.git`; the local
remote-tracking ref for that branch points to the same object, while no
`origin/main` ref exists. This establishes only the local tracking state. The
current upstream target, default branch, deployed source revision and route
binding are `NO_DATA`: no healthy pinned checkout or direct deployment
measurement is available. This checkout is not an implementation base.

## Proposed receiver contract

Keep the existing credential export as an explicit user action. A receiver
must validate the already-signed node credential and its declared issuer; it
must never create, replace or re-sign the credential. Before implementation,
record the canonical request/response schema, route, target repository and
revision, deployment binding, trust source, and payload ceiling from measured
source and the authorized operator.

The receiver should reject malformed, altered, wrong-issuer, oversized and
unknown-field requests before persistence, with bounded cause-bearing errors.
A valid request stores only the minimum durable credential receipt needed for
idempotence and returns the exact receipt shape accepted by the existing app
exporter. Repeating the same credential must return a measured idempotent
result. A receipt may say `encolado` only after durable acceptance; it never
proves public node read or changes the creation's LIVE state.

## Acceptance measurements after target identification

- A valid signed fixture passes the gateway verifier and the app exporter
  accepts the exact response schema.
- Altered signature, wrong issuer, malformed data, unknown fields and size
  overflow reject without persistence.
- Repeated identical submission has the documented idempotent response.
- Page load, service start and credential creation send nothing; only the
  explicit user action sends the request.
- Rack evidence records HTTP status, sanitized response, request/receipt
  hashes and target revision. Restart confirms durable receipt semantics.
- The operator performs any deployment manually after FIRMO. No deployment,
  binding change or public route is authorized by this proposal.

Until source, target and binding are measured, all route implementation and
post-deployment health checks remain `NO_DATA` with that cause.
