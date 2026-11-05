# OpenWorld surface · RENDER

## Problem
On the supplied mobile screenshots, the map is confined to a narrow column and
the chat and controls form a long list. The visitor cannot see the map and the
conversation as the main surfaces at the same time.

## Outcome
Keep and improve the introduction with the live map behind it. Entering OpenWorld
reveals a panel over that same map, with a prominent chat and secondary functions
inside discoverable controls. Present the available functions for the Sovereign
to inspect and choose; unavailable capabilities state NO_DATA with a cause.

The Sovereign's clarification: the introduction retains the OpenWorld and Tools
doors. The OpenWorld map shows the hexagonal floor without the current drawn
figures and buildings; the new terminal remains. Retiring those visual layers
must also reconcile hit targets and spoken descriptions so invisible objects are
not presented as visible. Preserve historical code as source until the new
surface and its accessible alternatives have been measured.

The Sovereign authorized this direction. Current implementation evidence:
`colonia_pagina.draw` paints the floor, then colony layers and live marks;
`nodeAt` and the page's click handler use the same scene to target nodes. The
visual retirement must therefore change rendering and interaction together,
with a regression for invisible targets and an accessible way to inspect state.

## Affects
The landing and OpenWorld surfaces, mobile and desktop navigation, the map,
chat, tutorial, movement, radio, army, and other functions found in the ideas
and jewel inventories. Reference: buzon #57, comment 6639600275, and the
Sovereign's mobile screenshots and direction of 2026-11-04.

## Constraints
One map and one state: do not create a second renderer or a competing map.
Preserve accessible text, keyboard and touch controls, reduced motion, and
explicit NO_DATA. Keep existing functionality available for review. Do not
claim live nodes, voice, or device behavior without evidence. Preserve gestures
and the existing service-worker cascade for any served change.

## Open questions
- Which existing functions and historical jewels are already implemented,
  proposed, retired, or unmeasured? Cite each before adding a duplicate.
- What viewport sizes and screen-reader paths demonstrate the surface works?
- Which alternatives does the Sovereign choose after seeing the complete set?

## Evidence and progress
- [x] Screenshots supplied by the Sovereign show the current mobile experience.
- [x] Read current OpenWorld markup and CSS and the existing LA FORMA commission.
- [ ] Inventory ideas, jewels, existing controls and their measured states.
- [x] Build a reviewable surface on the single map and preserve browser-accessible paths.
- [x] Measure browser, cache/version and repository gates. Physical-device and screen-reader hardware measurements remain NO_DATA.
- [ ] Obtain the Sovereign's selection before treating the design as final.

### Current implementation evidence · 2026-11-05

- The landing iframe loads `/openworld/?landing=1`; entering OpenWorld reveals that
  same document and canvas, then starts the live-node read. Browser Back restores
  the intro. The intro remains an accessible foreground card over the map.
- OpenWorld keeps the chat and composer visible, puts seven category controls
  below the map, places the joystick on the map's right edge, and exposes map
  place actions as visible buttons. No second renderer or canvas is created.
- Chromium checks cover 390×844 phone layout, first paint, two-click entry,
  movement, all seven panels, keyboard/forced-colors, and the service-worker
  shell. Browser checks now use the visible Map place control; layout asserts
  the joystick stays at the map's right edge and all seven controls sit between
  canvas and chat. On 2026-11-05: `NODE_OPTIONS='--test-reporter=tap'
  python3 -m unittest test_web atlas.test_atlas` passed 126 / 1 skipped;
  service-worker harness 24/24; OpenWorld terminal, map-wide, invocation,
  ephemeral-visit and accessibility browser checks green.
- Live node state remains `NO_DATA` where the publisher returns 404. Physical
  device, screen-reader, and production cache behavior have not been measured.
