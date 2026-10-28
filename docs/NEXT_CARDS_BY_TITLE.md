# Next cards by title · preparation after Lane F

Status: design register, re-anchored 2026-10-26. Measured refs:
WEB `cec9b309462dab703a6a59f661084c89df289d23`; APP
`7885afe88ad8a456d6af91aa08a62998818b5c9c`. Source citations were read
from these exact refs before opening the APP voice-route branch. No public
files were changed for the title-hygiene proposal.

## “prompt-to-2D creation”

**Likely lanes:** WEB creation studio plus APP local image adapter/importer;
split into separately reviewable contracts if the two-repository boundary
does not fit one PR.

**First cut:** one local prompt produces one signed, portable 2D scene. Guiding
receipt asks for two visible human survivors behind cover and one group of
four zombies. Human review counts visible figures; prompt text alone is not
proof. Existing `preceptoros.creation/1` remains unchanged because it permits
one Bubble ribbon and a statement WAV, not a raster image.

**Contract before adapter:** new versioned manifest and closed file list;
exact original-manifest Ed25519 signing; bounded decoded dimensions/pixels and
complete encoded package; safe raster decode; separate source/model digest,
prompt digest, declared parameters and generation seed only when supplied by
the engine. No external transfer or model download by default. No local model
availability or image quality was measured here: `NO_DATA` until the Sovereign
or Mesa supplies a permitted model source and measured rack inventory.

**Judges:** changed manifest/image/WAV, unknown file, bad decode, dimensions
and byte ceiling, missing engine/model, timeout, stale signature after edit,
package round-trip. A fixture proves verifier behavior, not scene quality.
Physical/render quality receipt separately records requested counts,
automated checks and human-observed counts.

## “basic paint motor”

**Lane:** WEB. Reuse the existing Bubble frame and one-ribbon contract. One pure
motor owns cursor, stroke, points, undo/redo, clear and repeat; DOM, audio and
pointer handling render that state rather than storing a second draft.

**Judges:** same logical actions produce identical frame bytes; undo/redo and
undoable clear; invalid or over-1,024-byte edit preserves last valid frame;
letterboxed/non-square viewport conversion; rejected cause persists until a
later accepted edit; edit invalidates prepared signature; mount/destroy leaves
no duplicate listeners. Directed sabotage for each claimed input channel.
Physical touch and hearing require a separate rack receipt.

## “aduana gateway final route and deployment”

**Lane/ref:** `NO_DATA`: measured local checkout is branch `codex/node-gateway-worker-20261016` at `fe9f07a8c90e78d81b89f3f6be257b7277958b61`, with no `origin/main`; current deployed source, default branch and route binding remain unpinned. Do not derive an implementation target from this checkout or deploy from this lane.

Keep the existing human-triggered export as the only sender. Receiver validates
the already-signed cédula and its issuer; it never signs. Closed bounded request
and receipt schemas, explicit trust source, hash-only minimal persistence,
idempotent duplicate behavior and cause-bearing rejection are required. Tests
must prove invalid credentials never write and a valid fixture produces the
receipt shape expected by the app exporter. Rack smoke/deployment is an
authorized human gesture. “Encolado” means only durable gateway acceptance;
it does not establish public read or alter creation LIVE.

## “local creation voice route”

**Status: CLOSED COMPLETE.** PreceptorOS#100, APP main
`7885afe88ad8a456d6af91aa08a62998818b5c9c`; receipt
`buzon#19/6377404930`.

**Lane:** APP. Wire the existing UI's explicit `/api/creaciones/voz` POST to
`voz_creacion.generar(text)` through a new, route-local exact Origin/Host gate.
No change to old write rules. Require only `{text}`, the current UTF-8 byte
bound, bounded body/response and application/json. The generator's profile,
catalog and declaration must match; its sanitized NO_DATA cause is preserved.
Generation stays local, explicit and unstored; it does not create identity,
sign, publish or send audio elsewhere.

Register `test_creacion_voz_route.py` in `bin/pruebas` in the same commit.
Inject generation for unit tests, then separately measure a real engine/model
run and physical playback. Test allow/deny origin, closed body, UTF-8 boundary,
profile mismatch, oversize output, engine-missing cause and no work on GET,
OPTIONS or page load.

## “public action title hygiene”

**Status: CLOSED COMPLETE.** web#292, WEB main
`cec9b309462dab703a6a59f661084c89df289d23`; served seal
`preceptoros-2026-17-abjb`, huella `b55facff4711f095`; receipt
`buzon#19/6377705091`.

**Lane:** WEB. Proposal already documented in the LF-4 map. No served edit
before Mesa assignment. Propose the canonical long series
`preceptoros-2026-17-<lowercase letters>`; Mesa chooses the next value accepted
by `bin/sellar.py`, and this note does not consume or assign it. After
assignment, replace the internal node name in root and served manifest titles
and the duplicate `deep_links.js` display title with a generic destination
label. Keep action IDs stable; test title parity and run the full WEB gate;
regenerate fixed-point counters and seal in the same PR.
