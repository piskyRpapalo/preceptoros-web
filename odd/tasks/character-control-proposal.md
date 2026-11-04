# Character movement control · proposal

## Explore
The 2026-10-30 order requests a permanent joystick for the visitor character
(buzon #30 comment 6523047400). The 2026-11-02 receipt retires the overlapping
pad and preserves tap-to-walk and keyboard. Both facts remain visible.

## Proposed slice
Offer a persistent, named 44 px movement control outside the map viewport,
adjacent to its lower edge. On touch, a bounded directional pad moves the
character through the existing deterministic six-neighbour movement path;
it never pans or rotates the camera. Preserve map tapping, keyboard and
screen-reader announcements. No new game authority or hidden motion.

## Checks before acceptance
Measure first-screen map area, control visibility and reach on S110; verify
six directions, release, focus, accessible name, reduced motion and camera
independence in browser tests. Capture same scene before/after; T1-T6 and
human preference remain NO_DATA until measured. One implementation per PR.

## Measurement · 2026-11-04

Implemented in the existing OpenWorld terminal: six named native buttons sit
outside the map canvas, below the attributed speech. Each target measures
44×44 px. They call the existing bounded axial walker, preserve map taps and
arrow keys, and do not control the camera. A browser judge caught the missing
pad and the old step-count expectation (red); after the implementation and
judge correction, `atlas/openworld_browser.mjs` passes on phone and desktop.
The ephemeral visit advances on accepted joystick steps; a move into water
returns `NO_DATA` with its cause and does not advance the visit. S110 hardware
reach, release behavior and human preference remain `NO_DATA` until measured.
