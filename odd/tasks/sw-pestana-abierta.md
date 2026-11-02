# sw-pestana-abierta

Date: 2026-11-02
Level: **PRODUCCIÓN**. Law: the Sovereign's order «touch what nobody talks about» (2-nov night). Status: **PLAN · REQUIRES_SIGNATURE** (the change touches `public/`, so it reseals and waits for its letter).

## What nobody was looking at

Every new seal letter is measured on **production** (`atlas/actions.py`), never on the **phone that already has the site open**.

Measured on the test phone (Chrome 156, read-only plus one reload, 2026-11-02):

| moment | the phone's service-worker cache | production serves |
|---|---|---|
| 19:5x UTC (E-3) | `shell-preceptoros-2026-17-dl` | `do` |
| 21:53 UTC, the tab still open | `shell-preceptoros-2026-17-dl`, no worker `waiting` or `installing` | **`dq`**: five letters later |
| 21:53:59, nine seconds after one reload | `shell-preceptoros-2026-17-dq` | `dq` |

**Cause, read in the code:** `public/assets/pwa.js:7-8` calls `register('/sw.js')` and then `update()`, **only when the page loads**. `sw.js` already does `skipWaiting()` and `clients.claim()`, so the update path works, as the reload proves. But a tab that stays open, like the map on a phone, never asks again. It kept an old build for hours, with no sign on screen. The house law «do not break in silence» also covers staying old in silence.

## Proposal (one piece, one letter)

1. `pwa.js`: call `registration.update()` again when the page becomes visible (`visibilitychange`) and on a counted interval, never faster than the browser's own limit. No clock with authority: the check only asks; the bytes decide.
2. On `controllerchange`, say it on screen and in the live region, as text: «A new version is ready · Reload». It never reloads by itself in the middle of a game or a signature.
3. A case that pins both hooks, and a phone reading after merge: the letter of the open tab equals production within one visibility change.

## First measurable step

Done above: the open tab lagged 5 letters, and one reload closed the gap in under 9 s. Next reading: after the piece merges, open a tab, merge any later letter, switch the tab away and back, and read its cache name.

## Log

- 2026-11-02 · measured on the test phone; plan on main.
