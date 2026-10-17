# Summons canon

This document preserves the design notes formerly embedded in the served brood, reveal, access, wave-card, and sung-card modules. Runtime behavior remains defined by the modules and their signed or measured inputs.

## Brood calibration — `public/game/cria.js`

A calibration package is declarative, integer-bounded data. It defines rarity weights, incubation cycles, affix counts and exclusions, stat budgets, and harmonic terms, amplitudes, phases, and symmetry. Hard gates reject authority-taking actions, wall-clock timing, undeclared odds, paid rolls, remote content, and engine costs. The package is validated but does not calibrate or adopt anything. `desdeValores` provides the current game baseline; troop validation checks rarity, affixes, stat bands, harmonic terms, amplitude, phase, and symmetry. Odds are represented exactly in basis points. Legacy troops without explicit edges use the package's rarity symmetry.

## Access and measured wave card — `public/game/summon-access.js`, `public/game/summon-wave-card.js`

Access reuses the live summon controls and the Army's existing rules. The compact wave card presents measured data at the top of the inherited reveal.

## Reveal scene — `public/game/summon_reveal.js`

A revealed wave grows harmonic by harmonic and settles into its complete form; rarity is expressed through harmonic richness. Sparks converge deterministically from the troop seed. The sonar ping and first tone use the same local synthesis path when sound is enabled. The result already comes from the signed seed; the reveal is presentation only.

Reduced motion shows the final still shape with the same text. The reveal waits while a battle panel is open, then resumes without a wall clock. Closing by gesture, Escape, or its control restores focus. Its anticipation and settle effects derive from frame hashes and whole game cycles rather than random values or browser timestamps.

## Sung identity card — `public/game/tarjeta_cantada.js`

The card derives local sound from the shape and semantic signal, without audio files or network access. A term identifier supplies a deterministic base frequency; where hue exists, it also contributes to the base. The seven measured semantic signals map to fixed pitch classes. The melody is deterministic for the same term and signal. Sound plays only after an explicit user gesture and when audio is enabled; absent measurement remains silent with a cause.
