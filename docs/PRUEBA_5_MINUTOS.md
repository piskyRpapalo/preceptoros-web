# Five-minute visitor check · English web

**Re-measured 2026-10-27** against `main` a061e9a in local headless Chrome (a static server of `public/`, external
requests blocked). That is a local measurement: it is not a production or physical-device check. Each step below says
what was measured; anything not re-measured says `NO_DATA` with its cause.

Open **https://preceptoros.org/**. The old translated addresses (`/en/`, `/es/`, …) are a 301 from the Worker to `/`;
they are not pages any more. After a release, use a new tab or a second visit: the service worker may serve its previous
cache on the first visit.

## 1 · The landing (`/`)

1. Three doors drawn as speech bubbles: **Play theGame** (`/play/`), **Worlds** (`/face/`), **Creation studio**
   (`/creation.html`). Each is a real link; with JavaScript off they are plain text links.
2. Under them, **The web or the app?**: two bubbles facing each other, then **Get the app · install guide**.
   **Technical details** is folded.
3. The page makes no external request.

## 2 · Play theGame (`/play/`)

The game opens with a descent; it can be skipped. Measured: 0 exceptions and 0 external requests on load.

1. The menu has five destinations, measured: **History mode**, **Waves Army**, **Buildings**, **Nodes & Events**,
   **How to start?**. Open one, then another: only one panel or sheet stays open, and the map stays behind it. The
   notification light belongs to **History mode**.
2. **Buildings** lists the places on the map (Reef Patrol, Kelp Wardens, Ruins Sentinels, Silt Leviathans, Abyss
   Heralds, Guardian of the Core) with **⚔ Fight**. If an action fails, it shows a short safe cause, never an exception,
   stack or internal path. No action may be claimed without a signed authority on the page.
3. **History mode** holds your crab's state and **Summon a wave** (the incubator lives here now; there is no separate
   *Base* tab any more). Summoning needs a measured game cycle; without one, the cause is shown and summoning stays off.
   Odds are on the buttons before you press them.
4. **Waves Army** opens the WavesCraft sheet: it signs the summoning, and the egg incubates in game cycles.
5. **Nodes & Events** holds **Skills**, the crab's terminal of actions and **Enable audio feedback**. Audio is opt-in
   and local; **Turn off audio feedback** appears after enabling it. Swim and Reach announce their level after a
   completed action; without events they read `NO_DATA` with its cause.
6. **How to start?** shows where you play: **Open sea · local** or a node card (`nodo.0.hexelion`, `nodo.1.doogee`).
   A node card is declared, not verified (it says *unsigned card*); choosing one records a local choice only and gives
   no advantage.
7. The tutorial (from **How to start?**) has 15 steps: reach, swim, the **9 places** (Shell, Claws, Legs, Eyes on your
   house; Buoy, Observatory, Tombstones, Latency crystal, Coral on the reef), then fight, summon, dissolve and radio.
   Each place counts as visited when you open it.
8. Check the map at a narrow phone width and at desktop width. Respect the reduced-motion setting; buttons should be
   easy to tap.

## 3 · The other pages

1. **Worlds** (`/face/`): three node pages (Atlantis, the Risen, Neutral). A fight fills the screen on its own stage,
   and every panel closes with **×** back to the map.
2. **Get the app** (`/get-the-app/`): downloads and their sha256 fingerprints come from the release card
   (`release.json`). "Five minutes" for an install is `NO_DATA`: nobody has timed a clean install.
3. **Create a node** (`/aduana/`): it registers nothing yet. It shows each step's measured state (signature and
   registry `NO_DATA`, sending asleep) and lets you check a node card on this device. The public catalogue is asleep too.

## `NO_DATA` limits

- **Echoes and Chat:** the old guide listed them as channels; they are **not in the page today** (measured). Not to be
  reported as missing features of this release.
- **HEXELION Star:** its module is loaded (measured); tapping the star and reading its crystal cards was **not
  re-measured** in this pass, because the star is drawn on the map canvas and needs a real tap.
- Physical Doogee FPS: not measured in this check.
- Global chat: no tested repository-backed channel.
- Live Doogee–Beelink link or rack heartbeat: not queried; do not infer one from the node cards.
- AI comprehension of the state vector: not measured.
- The node registry (`/aduana/`) is not deployed: sending and the catalogue stay asleep.

Report the page, control, visible text, browser/device, and whether this was a first visit or a second visit/new tab.
Do not report a local browser fixture as a physical-device or production measurement.
