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

## The look breathes (2026-11-24 · request budget)

On 2026-11-23, from 06:26Z, the public authority answered `503 authority_unreachable` to everyone. Two crabs had stayed shared all night. Each crab made about 2.5 requests per second: a `/view` every 500 ms, plus a signed beat every 2 s. That spent the free Durable Objects quota for the day.

A `/view` keeps no crab alive; only a step or a beat does (`atlas/puros/crab_presence.js`: `seen` moves on `step`). So the page now paces its looks with `shared_crabs.js` → `pace(view, id, poll, fixed)`:

| situation | next look | one crab's requests per second (with the 2 s beat) |
|---|---|---|
| another **LIVE** crab is in view | 1 s | 1.5 |
| alone, or only STALE crabs in view | 4 s | **0.75** (was 2.5) |
| right after your own accepted step | at once | — |
| `?poll=` in the URL (tests, rehearsals) | fixed, as before | — |

- An arrival still shows within about 4 s.
- STALE (~10 s) and GONE (~30 s) are not affected, because they depend on steps and beats only.
- The law is held in `atlas/puros/shared_crabs_cases.mjs` («pace…»).

Measured on 2026-11-24 with `atlas/shared_crabs_browser.mjs` (two local Chromium crabs and the loopback authority), with no `?poll=`:
- Two LIVE crabs together: **20 `/view` in 10 s**, about 1/s each. It was 2/s each.
- One crab alone after the other left: **2 `/view` in 12 s**.
- The whole two-crab walk stayed VERDE: steps, four readings, STALE and gone.

## Three crabs on the public site (2026-11-24 13:14Z)

`atlas/public_crabs_e2e.mjs` takes the public road: it opens https://preceptoros.org/openworld/ and uses the public presence authority (no loopback). Each crab is a person's visit: Play, the consent box, then Share.

First receipt (VERDE, three Beelink Chromium processes):
- Three different crabs, and each one saw all **3 LIVE**.
- Each crab walked one hex. The other two held it at the new cell after **0.6–0.8 s**.
- One page closed. The others read it **STALE at 7.6 s**, and the authority forgot it at **27.7 s**.
- Afterwards, everyone else disconnected on purpose.

For a physical phone, add `PHONES=<serial>`: its Chrome opens the public URL the way a person would. This needs the owner's go-ahead, because the Doogee is read-only by default.
