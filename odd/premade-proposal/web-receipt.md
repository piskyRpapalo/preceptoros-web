# Web byte receipt · 2026-11-03 19:04Z

Beelink: `curl https://preceptoros.org/game/<file> | sha256sum`, compared
with `git show origin/main:public/game/<file> | sha256sum` (97c5d644).
All four pairs equal:

- building_chat.js: `186a45368be1e691fa7d4a70e4684696a6757b00c3542d61f1e9cc9924968ff3`
- bb_radio.js: `4b75bcffb52f9a0c95184cd6af100299557ded999f528af727ec4a0ed8df523f`
- wave_rules.js: `cdc83c937df2a983f75050024f7f9bbc6a2224ee1d1816a010e8a134add459b2`
- colonia_edificios.js: `110c1683ae874cc1d87212e753425ab68870d0d79b3a091a4552888a5d3fa368`

A means these bytes were served, not that a complete user building works.
