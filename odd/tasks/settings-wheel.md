# settings-wheel

Date: 2026-11-08
Law: Sovereign, chat 2026-11-08: «the "change word size" button must become a settings wheel. Send to that gear what should not be in the other panels. It must also open new building possibilities.»

## Built

- `public/game/type_scale.js`: the gamepad's «Aa» is now a gear (⚙, aria-label «Settings», id `gp-letters` kept for the guards). It restores the saved letters step on load. On the first press it loads `settings_sheet.js`.
- `public/game/settings_sheet.js` opens one sheet with three groups:
  - **Device:** letters size, audio only, pulse of this page, install the app.
  - **Notes:** report a typo, export your notebook.
  - **Build:** five town buildings that can stand on the crab's hex.
  - The device and notes actions run their real pieces through `town_actions.js`. The sheet reuses the building sheet's Acho mould (CSS `:is(#building-sheet,#settings-sheet)`).
- **Building:** `why(cell, marks, built, q, r)` is pure. It refuses water, the cabin clearing (radius 2), a hex that already has a building, and more than 12 per device, and it gives the cause in words.
  - A built building is kept in `localStorage["preceptoros.built"]` on this device only, and the sheet says so.
  - `map_chunks.js` `landmarks()` draws it like any village building, with its name pill.

## Gates

- `atlas/puros/settings_cases.mjs`: the build rules and the three groups.
- `atlas/type_scale_browser.mjs`: the gear is a 44 px Acho button; it opens the sheet; «Letters size» steps 115 → 130 → 150 → 100 %; the step is remembered.
- Doogee, real taps: the crab walked to 6, 0, where «Build a Hostel here» answered «a building already stands here». At 4, 2 the Hostel was built and drawn with its label.

## NO_DATA

- Built buildings are not shared or signed: only this device sees them. Sharing them needs a signed publisher (mission #759: app-made buildings).
- Buildings built here have no interior of their own: a tap opens the town card of their kind.
- Removing a built building (today: clear the site data).
