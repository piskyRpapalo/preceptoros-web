# Text projection contract proposal

**State:** proposal only; no serving behavior is added by this document.

## Measured starting point

Two case-insensitive searches of `public/` on `21ae1e831fb16ecc89540afb509c5c34891025c9` returned no matches for the requested Spanish term.

`public/game/lexical_projector.js:34-47` already projects scene id, scene label, sound, motion, atom count, optional cycle, state, and text fields under `preceptoros.lexical-projection/1`.

`public/game/lexical_projector.js:49-54` measures the UTF-8 JSON body and returns `NO_DATA` when it reaches 1,024 bytes.

`public/game/en301_tutorial_model.js:274-278, 283-293` already exposes parallel audible and mirror text for tutorial state.

## Proposed contract shape

The proposed text view is a deterministic, read-only rendering of one valid lexical projection, with no independent state or authority.

Its candidate fields are `v`, `source_sha256`, `scene`, `cycle`, `state`, `motion`, `sound`, `items`, and `cause`; absent values remain explicit `NO_DATA` with a cause.

Each item line would preserve the source order and include only measured identifiers, labels, and coordinates present in the projection.

The serialized UTF-8 text body must be strictly below 1,024 bytes; overflow returns `NO_DATA` for the whole view rather than truncating fields.

The same body would be available to visual accessibility, speech, and text-only readers so all three consume one state projection.

## Proposed falsifiable gate

For a fixed set of valid and incomplete projections, two fresh runs must produce byte-identical text and source hashes.

Sabotages must reject a changed source hash, missing cycle when the caller declares it required, an unsupported field, and a body at or above 1,024 bytes.

The gate must show that no projection input is mutated and that an incomplete input never becomes a complete sentence with fabricated values.

No claim is made yet about reader comprehension, audible parity, or whether all game scenes have sufficient labels; those measurements are `NO_DATA` pending an approved corpus and reader rubric.

## Decisions requested

1. Approve or replace the candidate field list and the rule that overflow rejects the whole view.
2. Define whether cycle is mandatory for every scene or only for cycle-driven scenes.
3. Approve the display name before any public identifier or UI string is introduced.
4. Provide an approved corpus and rubric before any comprehension claim is measured.
