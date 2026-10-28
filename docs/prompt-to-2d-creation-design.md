# Prompt-to-2D creation · design for reception

Status: DESIGN, 2026-10-24. Traveler/author: preceptor codex; engine:
GPT-6.1-Sol; persona: Luna. The Sovereign's standing commission authorizes
this proposal. It does not establish a working image engine or assign LIVE.

## User outcome

One prompt produces one 2D drawing containing the requested scene. The guiding
case uses human survivors in the role previously pictured as crab icons and
enemy groups containing two to six zombies each. This is a creation-studio
scene; changing its representation does not change combat statistics, world
rules or every existing game icon.

Example prompt: “One 2D scene: two human survivors shelter behind a low wall;
one group of four zombies approaches from the right. Keep all figures visible
in a single composition, with a clear path between the two groups.”

The author reviews the picture and its description, listens to the statement,
then explicitly signs and exports. A voice-input option may supply a transcript
only after the author confirms it. Speech recognition is optional; no missing
recognizer may silently replace the prompt or claim the words were heard.

## Proposed cut and data flow

1. Collect prompt, nonblank description and explicit scene constraints.
2. On Generate, call an installed, explicitly selected local image adapter.
3. Record engine/model digest, declared parameters and prompt digest; record
   a seed only if the engine provides one. No new model is downloaded by this
   flow. Missing engine/model returns `NO_DATA` with its concrete cause.
4. Validate output dimensions, byte size and image decoding before preview.
5. Ask the author to accept or revise the single image and description.
6. Bind accepted image bytes and the existing statement WAV to a versioned
   creation manifest; sign its exact bytes using the author's own identity.
7. Export explicitly; publication uses the existing local import/review lane
   only after its importer and reader support the new package version.

The adapter returns a receipt and a local artifact reference. Image bytes do
not enter the sub-1,024-byte control channel. No prompt, image or model state
is sent externally by default. An optional remote adapter needs its own
explicit transfer contract; none is selected in this design.

## Package boundary requiring a separate implementation

WEB `cec9b309462dab703a6a59f661084c89df289d23`,
`public/game/creation_package.js:3,50-63`, and APP
`7885afe88ad8a456d6af91aa08a62998818b5c9c`, `creacion_import.py` currently
accept `preceptoros.creation/1`: exactly one cyan Bubble ribbon
frame and one PCM16 mono statement WAV. A PNG, another primitive or multiple
objects cannot be inserted into that format. Do not weaken its validators.

Propose a distinct versioned image package. Its name is not registered yet.
The candidate has a closed file inventory `image.png` + `declaration.wav`,
positive bounded raster dimensions and decoded pixel count, per-file sizes
and SHA-256, public author name, description, voice profile and an exact
manifest string. Ed25519 signs that original string; its SHA-256 is the ID.
Unknown fields/files, decoder errors and changed bytes reject the whole
package. Private keys never travel. An image is decoded as pixels, never
executed as markup or code.

The complete base64-encoded package remains at most 25 MiB; decoded payload
limits alone are insufficient. The exact raster/pixel limits must be set in
the versioned contract before implementation and measured on the target
decoder. Existing v1 artifacts continue to verify unchanged.

## What a picture does and does not prove

The requested group counts are declared constraints. A model returning an
image does not prove those counts are visible. Keep separate receipt fields
for requested counts, automatic checks (if any) and human-observed counts.
The guiding case passes only when the reviewer can identify the two survivors
and four zombies in the single image. Occluded, merged or extra figures are
rejected/revised, not silently counted as correct.

A model digest identifies the engine; it is not a license receipt. Record
available model/asset provenance and terms separately. Missing provenance is
`NO_DATA` with its source gap. Do not claim pixel authorship merely because a
commit incorporated the image. Record the declared AI generation and human
actuators consistently with the journey receipts.

## Implementation cards after design reception

| Piece | Deliverable | Judge that must turn red |
|---|---|---|
| Versioned image contract | Closed schema, safe decoder bounds, shared fixtures | Extra file, bad pixels, altered image/WAV, envelope overflow |
| Local adapter | Explicit generation, pinned profile, cause-bearing failure | Missing model, timeout, invalid output, silent engine substitution |
| Studio review | One scene preview, editable accessible description, accept/revise | Unreviewed output cannot be signed; changed image invalidates signature |
| Import/read support | Verify exact manifest, store atomically, safe image render | Cross-version confusion, partial write, corrupted independent read |

Portable deterministic fixtures prove integration and rejection, not the
quality or factual content of model-generated pictures. The real guiding
scene requires a separate measured render receipt. No backend availability,
physical render, image-generation quality or LIVE publication is claimed by
this design. E8 V2 and its fixed voice files remain independent.

## Re-anchor verification · 2026-10-24

Measured `origin/main`: WEB `cec9b309462dab703a6a59f661084c89df289d23`,
APP `7885afe88ad8a456d6af91aa08a62998818b5c9c`. Direct reads of the pinned
WEB package confirm `public/game/creation_package.js:3-4,50-74`: v1 is exactly
a ribbon frame plus declaration WAV, with a strict sub-1,024-byte frame and a
25 MiB package ceiling. APP `creacion_import.py:19-22,86-110` independently
retains those same names and frame restrictions. The cited v1 boundary is
current; a raster generator requires a separately versioned schema and
explicit cross-lane import support. No local image engine/model was measured;
availability and output quality remain NO_DATA.

## Re-anchor verification · 2026-10-24 (ALL-IN)

Measured WEB ref `cec9b309462dab703a6a59f661084c89df289d23`. The cited
`creation_package.js` boundary and limits are unchanged from `4c2983e7`;
schema `preceptoros.creation/1` still accepts one ribbon frame and one WAV.
The served seal is `preceptoros-2026-17-abjb` (`b55facff4711f095`). No image
engine/model was measured; generation remains NO_DATA.


## Mesa re-anchor · 2026-10-26

The Mesa reconfirmed WEB `cec9b309462dab703a6a59f661084c89df289d23` and
APP `7885afe88ad8a456d6af91aa08a62998818b5c9c`. Direct code citations are
unchanged at the referenced heads. The image engine/model and output remain
NO_DATA; no generator claim is added.
