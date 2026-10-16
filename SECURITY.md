# Security policy · the WEB (preceptoros-web)

Status: PROPOSAL · REQUIRES SIGNATURE. This card states the security posture
of the WEB as measured. What is not measured appears as NO_DATA with its
cause, never as an assurance.

## What the WEB is

A static site: no accounts, no sessions, no cookies, no telemetry. The home
page is the game; the game runs entirely in the visitor browser and makes zero
external requests on load. Visitor state lives in the visitor browser and
leaves it only when the visitor presses send.

## The one outgoing call

POST https://api.preceptoros.org/aduana/cedulas — only after an explicit
visitor gesture. The payload is the signed reception contract
(public/game/node_reception_contract.js), at most 1,024 bytes, strict UTF-8.
The WEB verifies signatures (public/game/node_signature_verify.js) and the
verdict is always authority:false — presence declared, never verified
authority. With no Ed25519 available the result is PENDING with its cause; a
rejection is never simulated.

## Keys

Only public keys cross this boundary. The trust manifest is anchored by a human
ceremony: the manifest never verifies itself as a root, and the anchor becomes
real only when the architect signs the exact sha256 fingerprint with an
explicit FIRMO. Private keys never leave the visitor device.

## Hard limits (measured laws)

- 1,024 bytes per reception-contract payload, strict UTF-8.
- 25 MiB per synthetic block (higher only by signed exception in
  EXCEPCIONES.md). The byte-per-file ceiling was revoked on 2026-10-11; the
  yardsticks now are measured fps on the reference phone and the game door:
  gzip_juego_b below 153,600 B.
- Service worker served with a measured fingerprint and a daily vigia.
- Review of the service-worker update path: NO_DATA with cause (review
  pending; not claimed done).
- Content Security Policy: NO_DATA with cause. The reference exists in the
  Star (A1); a declared CSP does not exist yet. It will arrive as its own
  proposal with its own signature.

## Reporting

Private GitHub security advisory of this repository. Reports are read by the
architect. Honest 404s apply: if a thing is not there, the answer says so.

The silicon never signs: the carbon signs.
