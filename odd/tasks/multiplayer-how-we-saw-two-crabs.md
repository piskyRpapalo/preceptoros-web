# Multiplayer · how we saw more than one crab on the web (2026-11-14)

The Sovereign asked (2026-11-14) to keep this in one marked place: «el multijugador es el futuro inmediato».
Status: **EXPERIMENT on loopback / USB only**. The public site has no presence authority, so it shows one crab.

## What made two crabs appear on one map
1. **A TEST authority** decides every cell: `atlas/crab_presence_authority.mjs` (`authority()`), started with the real
   baked floor (`realFloor()`). The browser never decides where another crab is.
2. **The page joins it only on loopback, by port**: `/openworld/?presence=<port>` (pure check `authority(location)` in
   `public/game/shared_crabs.js`; any other host is refused). One consent button, then:
   - each hex walked is signed (`atlas.paso/1`) and sent; a still crab signs «still here» (`atlas.presente/1`);
   - the page reads the authority's view around its crab and draws the other crabs with the same crab body
     (`crab_body.js`); a silent crab turns pale and its label says STALE, then it is gone.
   - each change is ONE event with four readings (`crab_presence_acho.js`): live line, notes, `acho:event`, picture.
3. **Two clients**:
   - two Chromium processes on the Beelink: `node atlas/shared_crabs_browser.mjs`
   - two physical phones (S110 + TANK 3) by adb: `PHONES="<serialA>,<serialB>" node atlas/shared_crabs_browser.mjs`
     (page on 8811 and authority on 8812, carried to each phone with `adb reverse`; the harness reads the tabs through
     each phone's DevTools socket). `CAPTURA=<folder>` keeps a picture of each client.
4. **Proved by the harness**: A walks → authority accepts → B holds A at the authority's cell AND draws it; B answers
   and A sees it; still crab stays LIVE by its beat; closed page → STALE → gone. Sabotages `SABOTAJE=sin-latido` and
   `SABOTAJE=bajo-niebla` turn it red. Measured 34–139 ms on loopback/USB, 3 runs (Mesa #34; WEB #821/#823).
5. **Cooperation on top** (WEB #828 `coop_beacon.js`): A asks to light the beacon, B says yes, one lighting.

## What is NOT there yet (the road to real multiplayer)
- An authority reachable from the internet (today: loopback only, by design; exposing it is a human decision).
- Durable identities (today: ephemeral visit keys made in each browser).
- Measurement over mobile data / two homes: NO_DATA.
- Rate limits, abuse handling and privacy review for a public presence service.

Related: `odd/tasks/crab-alive.md`, `atlas/coop_beacon_browser.mjs`, memory `handoff-2026-11-14-round5`.
