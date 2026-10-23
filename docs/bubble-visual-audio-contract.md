# LF-2 · Bubble visual/audio field contract

Measured base: web `a499044e2bc1e187c3c03e2b7356b2747dac84c5`, 2026-10-24.
This contract describes the current projections. It establishes no phase
equivalence between a rendered Bubble shape and a physically played signal.

| Field / producer | Unit and consumer | Current sound relationship |
|---|---|---|
| Harmonic `[k, ax, ay, phase]` | `gacha.js:punto`: `k*u + phase*pi/32`; 64 phase steps per turn | `core.js:vozDe` ignores phase |
| `bubble_language.js:wavePoints` | Samples `Gacha.punto`; `smoothPath` rounds coordinates to two decimals | Geometry only |
| `bubble_game.js:clash.ph` | Degrees, converted with `pi/180`; 360 per turn | Geometry only |
| `bubble_language.js` arcs `ph` | Degrees at the arc start | Geometry only |
| Troop `armonicos` in `core.js:vozDe` | Harmonic number and absolute amplitudes produce carrier/modulator frequencies and modulation depth | A lossy FM recipe, not a waveform reconstruction |
| `core.js:suena` recipe | Hz for carrier/modulators/vibrato; seconds for duration/envelope; gain for amplitude | Actual Web Audio scheduling when enabled |
| `wave_render.js:vivos` option `desafina` | Dimensionless visual distortion; alters a copied harmonic phase array | No sound call in this drawing path |
| `escena.js:figura` option `desafina` | Damage/flash-derived distortion in `afina`, plus position wobble | No sound call in this drawing path |
| Editor optional `frame.sound` | `bubble_editor.js:create` can retain caller metadata | No shared Bubble-frame audio player traced |

Source anchors: `gacha.js:109`, `bubble_language.js:61`, `bubble_game.js:100`,
`core.js:56`, `core.js:67`, `wave_render.js:188`, `escena.js:48` and `:186`,
all below `public/game/`. `comic_atoms.js` explicitly reports `sound=NO_DATA`.

For numeric conversion only, one harmonic phase step equals 5.625 degrees.
Converting units does not make the two projections equivalent: a closed
harmonic shape and the clash ribbon have different parameterizations, while
the current FM recipe discards phase entirely. Equal sound recipes can
therefore accompany different shapes. The name `desafina` currently denotes
a visual effect in these combat renderers; it is not a measured acoustic
frequency offset or beating effect. Separate game sounds may coexist.

## Boundary for future sound work

A future adapter must declare its source fields, units, phase origin, clock,
sampling interval, amplitude normalization and error behavior. It must define
whether it translates information, reconstructs a waveform, or plays a cue.
Changing color or phase cannot silently authorize or start audio. Catalog
speech from the creation flow remains a separate voice-profile contract.

The proposed adapter must carry test vectors distinguishing 16 harmonic steps
from 16 degrees, and phase-only changes from amplitude changes. Physical
phase/sound equivalence requires paired signal measurements with the same
input and time reference. Until then it is `NO_DATA`: no such paired capture
exists in this card. No oscillator behavior is changed by this documentation.

## Judge and falsification

`node --test tests/bubble_audio_contract.test.mjs` exercises the current
geometry and voice functions plus a Canvas call recorder. It checks the two
phase units, the voice recipe's loss of phase, and visual detuning without a
sound call. A call recorder is not browser rendering or audible playback.

`LF2_PHASE_SABOTAGE=1 node --test tests/bubble_audio_contract.test.mjs` mutates
only an in-memory copy of the harmonic sampler to interpret phase as degrees.
The quarter-turn test must fail. No served file or production switch changes.
The normal command must then pass. The judge joins the existing Node test
glob in this same proposal. This card resolves the terminology and records
the current boundary; it does not claim the future adapter exists.
