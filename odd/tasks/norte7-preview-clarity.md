# NORTE 7 fixture clarity

PROPUESTA · REQUIERE_FIRMA. Baseline `bdd4005` (2026-10-28), fixture only. The preview's HITL question mark and lane initial occupy the same coordinates (`preview/plantilla.html`, `cuerpo`); at 1200 × 1000 the capture shows them colliding. The wait list filters the frame before mapping indices back to lanes, so a later waiting lane can be attributed to an earlier lane. Both defects obscure the actual fixture state.

Slice: display the HITL state symbol inside its body instead of superimposing the initial, with the lane and state retained in the accessible label and legend. Preserve lane indices when calculating waits. This is a visual fixture proposal, not production wiring. The Sovereign approved the hexagon and requested label legibility in web #387 comment 6480922688 and the subsequent fog commission. The exact symbol appearance remains subject to eyes and signature. Full nameplate legibility, screen-space hit-testing and fleet performance are NO_DATA: not measured in this slice.

Check: generate the preview from the real fixtures; compare before/after screenshots; exercise frames and ensure the displayed wait list matches the original lane indices. No autonomous motion or new network requests. Log: the existing preview is Spanish; full vocabulary migration is a separate slice, not silently claimed here.

## Receipt · 2026-10-28

MEDIDO: Chrome headless, 1200 × 1000, local generated fixture: [before](../../docs/norte7-preview-clarity/before.png) and [after](../../docs/norte7-preview-clarity/after.png). At this viewport the HITL symbol no longer overlaps a second glyph. This is not a claim of readability at every zoom or device. `node preview/check_clarity.mjs`: 300 frames checked. Against baseline `preview/index.html` the same check failed (two text marks in one body); regenerated output passes. Browser DOM check also exercised the 300 button steps. The new check is deterministic and reads the generated fixture.

Sabotage: restoring the old wait-list expression alone makes the same judge fail; restoring the old generated preview makes the mark check fail. Regeneration restores green in each case. The screenshot files are viewport captures, not physical display measurements.
