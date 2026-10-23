# E2 receipt · 2026-10-23

Base: `b720db791f101dbfa583029ce8f454aaa492497e`. Scope: deterministic ribbon
state, shared pointer/keyboard coordinates, undo/redo, rejection preservation and
queued local feedback.

| Command | Result |
|---|---|
| `node --test tests/creation_feedback.test.mjs` | VERDE: six directed cases |
| Physical touch/audio check | `NO_DATA`, cause: no attached touch device or accessible audio server |
| `node arnes_sw.mjs` | VERDE: 22/22 |
| `python3 test_web.py` | 78 tests; 76 passed, 1 skipped, 1 `NO_DATA` error: sandbox denies loopback socket bind |

The guard checks reachable UI dimensions, coordinates, frame bytes, state
announcements, serialized voice playback, undo/redo, edge and oversize rejection.
Rejected points do not replace the last valid drawing. A queue prevents voice
overlap; audio suspension produces a visible cause. The E3 catalog is consumed
when available. Without that catalog, playback explicitly reports unavailable.

Mouse/touch events in a browser and real physical touch remain separate measures.
Creation-failure audio is structurally tested but not physically heard.
Branch seal: `preceptoros-2026-17-abix`, huella `4dfce96e10e79d4d`.
