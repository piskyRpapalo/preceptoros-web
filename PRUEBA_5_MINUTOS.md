# Five-minute visitor check · English web

Open https://preceptoros.org/en/. After a release, use a new tab or a second
visit: the service worker may serve its previous cache on the first visit.
This checklist describes the published #82–#88 baseline plus the current
panel-and-communication candidate. Candidate changes are not public until
their branch passes CI and is merged.

## Published baseline (#82–#88)

1. Open **Buildings** and choose an NPC place. If an occupancy or maintenance
   action reports a failure, it should show a short safe cause, never an
   exception, stack or internal path (#82). Do not claim an action is available
   if the page shows no signed authority.
2. Open a terminal or Radio message with a cycle age. A valid cycle shows its
   age; missing, invalid, future or reset cycle data must say `NO_DATA` with a
   cause rather than inventing freshness (#83).
3. Open the resource panel. If a reading is unavailable or invalid, it must
   clear the old value and show `NO_DATA` with a cause; it must not leave a
   stale number or show `NaN` (#84).
4. Open a side panel, then another, and open/close a game sheet. The interface
   should move between panels without stacking stale panels; reduced-motion
   preference should suppress animated transitions (#85).
5. State-vector details are internal technical data. A vector being emitted
   does not prove that an AI understood it (#86).
6. In **Base**, inspect the incubator. Progress requires a measured game cycle;
   if it is unavailable, the UI must show the cause and disable summoning (#87).
7. Open **Nodes & Events → Skills** and click **Enable audio feedback**.
   Audio is opt-in and local; use **Turn off audio feedback** to stop it (#88).

## Current W candidate: panels, channels and crab entry

1. Confirm the map remains visible behind one open side drawer; the five
   destinations are **History mode**, **Waves Army**, **Buildings**,
   **Nodes & Events**, and **How to start?**. Open one, then another: only one
   panel or game sheet should remain open. The notification light belongs to
   **History mode**.
2. In **Nodes & Events**, inspect the roster. Beelink is identified as
   `nodo.0.hexelion`; Doogee S110 is `nodo.1.doogee`. These are declared node
   cards, not proof of a live connection. An unmeasured heartbeat must read
   `NO_DATA`.
3. Open **How to start?** and choose the Doogee node as the territory for the
   crab. This choice records the local territory selection only; it does not
   connect devices or grant node access.
4. In **Nodes & Events → Skills**, tap an arrow on the crab movement pad, then
   tap empty sea. Movement should be deterministic and stop at unmeasured fog.
   Voice movement is `NO_DATA`: speech recognition is not enabled or measured.
5. Open the bottom communication panel and select **Echoes**, **Chat**, and
   **Radio**. Radio contains the measured local message log. Echoes and Chat
   must show their own `NO_DATA` cause until their sources are verified.
6. Check the center map/window at a narrow phone width and at desktop width.
   Respect the reduced-motion setting; buttons and channel tabs should be easy
   to tap.

## `NO_DATA` limits

- Physical Doogee FPS: not measured in this release check.
- Global chat: no tested repository-backed channel was found.
- Echoes as a separate feed: no measured source was found.
- Live Doogee–Beelink link or rack heartbeat: not queried; do not infer one
  from the node roster.
- AI comprehension of the state vector: not measured.
- Internal house/rack details: not exposed to the game (D67).

Report the page, control, visible text, browser/device, and whether this was a
first visit or a second visit/new tab. Do not report a local browser fixture as
a physical-device or production measurement.
