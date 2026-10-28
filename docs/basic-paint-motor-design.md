# Basic paint motor · design for reception

Status: DESIGN, 2026-10-24. Author: preceptor codex; engine: GPT-6.1-Sol;
persona: Luna. This is a future manual studio mode under the Sovereign's
commission, alongside prompt-to-2D creation.

## Measured starting point

WEB base `cec9b309462dab703a6a59f661084c89df289d23` (after LF-1/LF-2):
`public/game/bubble_paint.js:create` already owns an
ordered point list, undo/redo stacks and an announced state. Coordinates are
rounded and clamped to 412 by 515. `bubble_editor.js` serializes/compiles Bubble
frames; `creation_feedback.js` projects actions into text and local voice
clips. The current mount supports pointer and arrow-key input. The app serves
a pinned creation reader; no app paint editor has been established here.

Reuse the pure state machine and the existing creation contract. The first
manual mode remains one cyan ribbon, with the explicit visible cyan stroke
from the Block-3 cure. A larger paint program is a later versioned scope.

## Proposed interaction

The user enters Manual drawing, moves a visible/focusable cursor, starts a
stroke, adds points and finishes it. Pointer, touch and keyboard adapters all
send the same logical actions to one motor. Arrow keys move the cursor without
adding a point until the stroke is active; Space starts/finishes the stroke.
These are proposed controls for the studio mode, not a silent change to the
current creation page's arrow-key behavior.

The first cut accepts one connected stroke. Starting again continues that
ribbon and says so. Disjoint strokes, layers, fill, raster brushes and erasers
require a wider frame/package contract; a renderer must not hide their loss
when exporting a v1 creation. Minimum exportable state is two valid points.

Undo and Redo operate on accepted point edits. Clear is explicit, undoable
and invalidates any prepared author signature. Undoing Clear restores the
previous draft exactly. Repeat state reports the current position, point
count, stroke state and last rejection cause without editing the drawing.

## Common motor contract

Proposed actions: move cursor, begin stroke, add point, finish stroke, undo,
redo, clear and repeat. Input coordinates are finite numbers; adapters use
one documented viewbox conversion and the motor performs the single clamp
and rounding step. A pointer transform must use the painted SVG viewport,
including any letterboxing, rather than the full container rectangle.

That last point is a concrete current risk: `bubble_paint.js:92-95` scales
against the container while its SVG has a fixed-height viewbox. The proposal
will measure non-square display bounds and device scaling before declaring
pointer/keyboard parity. Similar events alone do not prove physical touch.

Every accepted edit produces the complete frame, monotonically increasing
draft revision and a state containing action, position, point count, color
and cause. Cursor-only movement does not mutate signed artwork. Editing the
frame does; the signature invalidation is connected to the frame revision.
No second store of drawing truth is maintained by the DOM or audio queue.

The frame must remain strictly below 1,024 UTF-8 bytes. An over-budget edit
is rejected atomically and preserves the last valid frame, undo history and
prepared signature for those unchanged bytes. The rejection stays visible
and repeatable. Never thin, truncate or simplify a stroke without an explicit
reviewable user operation. Empty/one-point drafts cannot be signed.

## Four channels and lifecycle

The motor's state drives visible text, an accessible status, the local speech
queue and optional haptic feedback. Controls retain accessible names, focus
and targets at least 44 CSS pixels. An unavailable/suspended audio engine has
an explicit cause; no alternate voice is selected silently. A new state must
not erase an earlier asynchronous rejection without a later accepted action.

One mounted editor owns its listeners and pointer capture. A destroy method
removes listeners, cancels pending speech owned by this mount and releases
capture. Pointer cancellation ends the active gesture without inventing a
point. Repeated mount/destroy must not duplicate strokes or narration.

## Implementation and acceptance

| Piece | Suggested source | Acceptance |
|---|---|---|
| Motor transitions | Extend `bubble_paint.js:create` or extract a small pure module | Same logical actions produce byte-identical frames and state |
| Studio input adapter | New on-demand adapter using the existing motor | Focus, capture, viewport transforms and cancellation measured |
| Feedback projection | Extend the current declared catalog inventory in lockstep | Same action/cause in all available channels; missing clips explicit |
| Creation integration | Existing prepare/sign/export flow | Real signature, reopen, byte-tamper rejection, clear/undo behavior |

Tests must cover undo after clear, exhausted history, byte rejection without
state loss, letterboxed coordinates, stale feedback, repeat state, duplicate
mounts and signature invalidation. Each channel gets its own directed
sabotage. Simulation validates logic; physical touch, hearing and focus in a
real browser require the rack receipt and remain `NO_DATA` here.

Any new served module enters the module census and required cache lists in
the same PR. Served changes require world/counters at a fixed point, final
seal, pinned-judge refresh where applicable and the complete web gate. Cache
list changes also remeasure DEPLOY.md. Deployment remains the Sovereign's
manual step. This design changes no served code or E8 journey artifact.

## Re-anchor verification · 2026-10-24

Measured WEB `origin/main` is `cec9b309462dab703a6a59f661084c89df289d23`.
Direct read confirms `public/game/bubble_paint.js:92-95` maps pointer
coordinates against the full surface bounding box, while its SVG viewBox is
412x515 (`:118` API and render setup earlier in the file); letterboxing parity
is therefore still a design risk to test. The same source retains undo/redo
and explicit cyan stroke rendering. Physical touch, hearing and focus remain
NO_DATA absent rack measurements. New served code needs a Mesa-assigned seal
version before its seal is generated; no served code was changed here.

## Re-anchor verification · 2026-10-24 (ALL-IN)

Measured WEB ref `cec9b309462dab703a6a59f661084c89df289d23`. `bubble_paint.js`
coordinates remain at lines 92–95 and still use the full surface rectangle;
the 412×515 viewBox remains at lines 81–88. Letterboxing parity remains
unmeasured. The served seal at re-anchor time was `preceptoros-2026-17-abjb` with huella
`b55facff4711f095`.


## Implementation re-anchor · 2026-10-24 (ALL-IN)

Paint branch updates pointer mapping through the SVG screen transform or a
letterbox-aware 412×515 fallback; simulator tests cover non-square bounds and
reject bars. WEB seal assigned by the Mesa: `preceptoros-2026-17-abjc`, huella
`b1b67e01a59e992c`. Simulator parity is measured; physical touch remains NO_DATA.


## Mesa re-anchor · 2026-10-26

WEB `cec9b309462dab703a6a59f661084c89df289d23` was reconfirmed. The
412×515 viewBox and original full-container pointer conversion cited above are
unchanged in that base. The paint branch now measures simulator mapping for
letterboxed bounds; physical touch remains NO_DATA. Its Mesa-assigned seal is
`preceptoros-2026-17-abjc` with huella `b1b67e01a59e992c`.
