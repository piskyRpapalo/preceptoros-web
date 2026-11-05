# Families · 2/2

2026-11-03 · local rack (device identifier withheld) · `git ls-tree` / `git grep` on web 97c5d644 and app
7e40181. A = source slice served, B = rack/integration not measured.

| Family | Anchor or NO_DATA | A/B | Empty template must say |
|---|---|---|---|
| Path | NO_DATA: family-to-building mapping not verified | B | NO_DATA: path not connected |
| Radio | web `public/game/bb_radio.js` | A slice / B service | NO_DATA: user radio not declared |
| Proposed working label “Wavescraft” | web `public/game/wave_rules.js` | A slice / B user service | NO_DATA: user wave service not connected |
| Colony | web `public/game/colony_buildings.js` | A render / B user nodes | NO_DATA: user node not declared |

“Wavescraft” is not canonical vocabulary; Babel and human review are pending.
Colony is the container/render surface per the current North, not a newly
minted building family. No runtime claims follow from file existence.
