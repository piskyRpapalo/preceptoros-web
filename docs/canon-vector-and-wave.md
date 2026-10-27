# Vector and wave canon

This document records the design notes formerly embedded in the served vector, harmonic and signal modules. Runtime behavior remains defined by the modules and their schemas.

## Genome constraints — `atlas/puros/genoma.js` (out of the served tree since 2026-10-27)

A genome is a bounded set of integer parameters grouped by declared domains. Unknown parameters, fractional values, out-of-range values, and forbidden authority, persistence, network, identity, or physical-engine controls are rejected. Its canonical parameter hash is independent of key order. The local system may propose changes; adoption, activation, and persistence remain human-authorized. The module is pure and performs no DOM, network, clock, or random operations.

## Measured rendering evidence — `public/game/latency_crystal.js`

The latency crystal records frame durations from the current rendering surface. Gaps above 250 ms are excluded. Each 30 cycles, after at least 60 frames, it appends a measurement containing cycle, sample count, p50/p10 frame rate, selected quality, pixel ratio, and canvas dimensions. Quality bands are p50 ≥55, ≥40, ≥25, then a monochrome fallback; the thresholds are a declared interpretation because the source corpus does not fix them. Missing evidence is NO_DATA; evidence older than 120 cycles is STALE. A measurement clock observes rendering and does not decide game state.

The pure helpers compute the median and lower-decile rate, classify freshness against a supplied cycle, and draw a compact measurement label. They do not create measurements themselves.

## Shared narrative graph — `public/game/narragrafo.js`

The graph stores short, inert text nodes with bounded tags and an eight-integer affinity vector. Node identity is content-derived. Operations are merged as a set: duplicate edges retain the greater weight, each pair contributes its highest-sequence vote per edge, and a pruning tombstone is permanent. Equal operation sets produce equal graph state independent of arrival order.

Candidate selection uses a saturated integer score from declared or signed pair preferences, then an integer lottery seeded by the session commit-reveal. Cooperative, competitive, and hybrid modes differ only in how they incorporate deviation from the pair median. The module remains in-memory and pure; persistence requires a human signature.

## Compact signal glyphs — `public/game/semiotic_glyph.js`

The glyph module adds deterministic, local visual and optional sound representations for existing signal vocabulary. Sound is reachable only after a visitor gesture; the sound payload is below 1 KiB.

## State vector — `public/game/state_vector.js`

The vector is a read-only snapshot of visible game state, including resources, the active panel and freshness, tutorial progress, structures, places, nodes, records, and the latest radio output. Color, sound, and motion are projections of the same state. Missing readings retain a cause; they are never replaced by invented zeroes. The serialized JSON target is below 1 KiB. Byte accounting is performed on the serialized UTF-8 representation. Each source read may fail independently without preventing the remaining snapshot from being produced.

## Shared semantic table — `public/game/tabla_semantica.js`

The frozen seven-signal table is the sole physical source for signal color and derived motion, scale, feedback, pulse, and silence behavior. Unknown signals have no invented color or derivative. Text labels remain available alongside color, and the module is pure. New signals require separate human authorization.

## Vector contract — `public/game/vector_contract.js`

The local validator enforces the closed `preceptoros.vector/1` schema defined by `data/atlas_vector_schema.json`.

## Harmonic rendering — `public/game/wave_render.js`

A form is rendered from its Fourier harmonics without rounding the source curve. The renderer varies stroke width with curve speed, uses additive brightness and a fading trail, supports harmonic growth, and can precompose static sprites. Quality is supplied by its caller.

The rendering pipeline includes deterministic melt persistence and derives color lightness from shield state. Impact brightness follows the same gain envelope as its sound. When synthesis data exists, its envelope drives the visual curve. The lower-quality internal buffer and grid wobble were suspended because the full-screen buffer accumulated and mis-scaled battle frames; the existing degradation path reduces points and effects. Reuse requires per-frame clearing, scaling, a single final composite, and device measurement.

All listed rendering is derived from harmonics and display time; it does not use randomness or network access.
