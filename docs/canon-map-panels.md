# Map panels canon

This document preserves the design notes formerly carried by the served scene and map-panel modules. Runtime behavior remains defined by those modules and their measured inputs.

## Wave status panel — `public/game/army-wave-panel.js`

One user gesture reads one wave. Displayed figures come from the existing Army and Workshop receipt chain.

## Combat scene — `public/game/escena.js`

A combat character is represented by its harmonic wave and carries its squadron. Damage is shown by deterministic detuning of that character's harmonic phases and amplitudes; the exact remaining value is also exposed in the DOM. Projectile color represents speed, while spring weight represents inertia. The background uses four-tone ordered dithering without image assets. Combatants use a simplified, legible shape during battle.

The resolved combat is supplied by the arena; the scene supplies display time only. The front advances toward the side losing life. Reduced motion leaves a still frame and a DOM record. Noise is hash-derived, not random.

The dithering helper distributes error to six neighbors at one eighth each, discarding the remainder. Detuning is stable per harmonic so a wound remains recognizable without flicker. Projectile speed maps from 3 (slow, blue) to 13 (fast, copper). Projectiles follow a Lissajous curve from the first two harmonics, carry a fading trail, and apply an impulse divided by the receiving mass. Springs return each troop according to its own weight.

## Place records and color — `public/game/place_telemetry.js`

A place's color is derived only from this device's combat record; no new state or persistence is introduced. The record contains wins and losses only, so remaining life is never inferred. Hue is the win share in thousandths; saturation is activity, capped at ten combats; lightness uses the leader's armor over a declared cap of 20. A place with no combat record is translucent NO_DATA. The calculations are pure, integer-based, local, and clock-independent.

The inspector exposes the same place color. Missing combat history remains visually neutral rather than being fabricated.

## Place cards and local building preview — `public/game/reef_place_cards.js`, `public/game/shell_schematics.js`

Reading a place card does not execute its action; execution needs a separate user gesture. Card data comes from the existing measurement layer. Building manifests can be imported into a local preview.
