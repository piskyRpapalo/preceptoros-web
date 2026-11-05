# Commission · Acho second modulator · VOICE

## Problem
Acho frame audio declares the game's voice recipe including a second FM
modulator for high harmonic degrees. `acho_sonify.js` computes that part but
`play` ignores it. The audible graph therefore does not realize that recipe.

## Outcome
Playback uses both declared modulators when present, with the same scheduled
start and end as the carrier; a single-modulator recipe stays unchanged.

## Affects
The existing on-demand Acho audio player and its focused tests, plus the
service-worker seal if required by the current served-asset contract.

## Constraints
Use the same `core.js` recipe and AudioContext passed by the caller. No new
mapping, network request, automatic playback, or second map; preserve NO_DATA
and reduced-motion independence. No claim of physical-device audio without
measurement. One draft PR, review and human signature before merge.

## Open questions
- Device audio quality and latency are NO_DATA until measured on actual hardware.
- The Mesa must assign the next available service-worker seal: web#661 is in
  flight and may consume the next identifier.

Sources: `odd/tasks/audio-a11y-acho.md` AA1 and AA8;
`public/game/core.js` `vozDe` and `suena`; `public/game/acho_sonify.js`
`recipe` and `play`; `atlas/acho_sonify_cases.mjs` drift and playback cases.
CLAIM buzon#53 ·6652373792. No assumptions about rack radio transmission.
