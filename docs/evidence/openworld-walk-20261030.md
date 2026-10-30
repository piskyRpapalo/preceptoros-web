# OpenWorld live walk capture

Capture date: 2026-10-30, 17:16 UTC. This is a measured production snapshot, not a claim about later deploys. At capture, production served service-worker version `preceptoros-2026-17-ace`; its `/openworld/` HTML and state JSON matched web main `b9046176` byte for byte. Main later advanced to `3205fc5f` after the accessible back/close merge.

## Served routes

| Request | Result | Measurement |
|---|---:|---|
| `GET /openworld/` | 200 | 16,312 bytes; SHA-256 `26a4f8e9b2ab4c49a4b87cf55e743218319309303ede217138591e910f67627f` |
| `GET /openworld/estado.json` | 200 | `preceptoros.openworld-estado/2`; `nodes: []`; SHA-256 `d1ae3d52cfbb6ab7d0740a9f49a6e356a25def36f5f5682444361ba6bfea4e8c` |
| `GET /sw.js` | 200 | version `preceptoros-2026-17-ace` |

The cabin remains present with no live colony nodes in the state. The browser made zero requests to another origin in this capture.

## Movement and tutorial

Captured at a 1000 × 800 viewport through the served `/openworld/` page:

1. Initial view: the tutorial cabin and its controls are visible.
2. `enter node`: the terminal reports `tutorial: key played`.
3. `east`: the joystick reports `NO_DATA: no colony node on that hex`.
4. `enter node` again: the tutorial identifies its next place; this public report omits that identifier under SCRUB. No cell is fabricated there.

This records the current boundary honestly: the cabin step is playable; movement toward an absent node and the Beelink step remain unavailable until state declares that node alive. The capture does not measure Android, latency, balance, or combat.

## Captures

| Frame | Description | SHA-256 |
|---|---|---|
| [01-map-live.png](openworld-walk-20261030/01-map-live.png) | Initial production map and empty node state | `660e166133724694ef96947632e03a4d69699a94bb657006f08660f0dca29f4d` |
| [02-enter-cabin.png](openworld-walk-20261030/02-enter-cabin.png) | Cabin terminal; `key played` | `cb1ed1687ef45e697c8c9095e0bf8a4de08edacab118bf4c8a0f2f1aa9bf355` |
| [03-east-empty.png](openworld-walk-20261030/03-east-empty.png) | East movement refused with `NO_DATA` | `b3c7e67164d1d56a90af6c1b579333022e2012a7b81bbf0a1b574ed8550d8f2e` |
All three retained PNGs are 1000 × 800. The map and movement path were measured against production; no state was written. The fourth capture was omitted because it exposed a physical node name.
