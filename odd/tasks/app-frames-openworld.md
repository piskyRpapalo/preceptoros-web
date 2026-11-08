# The map inside the app (PreceptorOS mini window)

**State: proposal. It loosens a security header, so it waits for the Sovereign's explicit FIRMO.**

## What happens
- The app's OpenWorld zone (`interface/app.html`, `#openworld-frame`) frames `https://preceptoros.org/openworld/`.
- Since R-17 (`worker/security_headers.js:18`), every HTML response carries `frame-ancestors 'self'`. Only the web itself may frame it.
- The app is served from `http://127.0.0.1:8742`, so the browser refuses the frame. On 2026-11-08, both the mini window and the Doogee showed the browser's broken-page icon in that zone.

## Proposed change (one line, plus its test)
- `worker/security_headers.js`: `"frame-ancestors 'self' http://127.0.0.1:8742 http://localhost:8742"`. These are only the app's own loopback origins, never `*`.
- `tests/security_headers.test.mjs`: assert the exact list, and assert that no wildcard is present.

## Risk (honest)
- Any local process that serves pages on port 8742 could frame the map. The map holds no credentials; the visitor's state lives in that origin's localStorage, and a frame cannot read it. A clickjacking attack would have to be run locally, on the Sovereign's own machine.
- The alternative, with no header change, is for the app to open the map in its own window (the existing `openworld-fallback` link) instead of a frame.

## Done when
On the mini window and on the Doogee, the OpenWorld zone shows the live map, and the security-headers test is green.
