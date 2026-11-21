# The map inside the Android APP (APK bundled origin)

**State: PROPOSED · HITL.** Security-header change: needs the Sovereign's FIRMO at the exact head. Not merged, not deployed.
Follows `odd/tasks/app-frames-openworld.md` (loopback origins, FIRMO 2026-11-08), which did not cover the APK.

## What was measured (2026-11-21, Claude Code, ONLINE3)
- Physical DOOGEE S110, signed `org.preceptoros.app` v7, Open World tab: the frame shows
  `net::ERR_BLOCKED_BY_RESPONSE` (ADB `uiautomator dump`). The APK serves its pages from
  `https://preceptoros.mvp.local` (`mvp-android/.../MainActivity.java:36-37`, WebViewAssetLoader), which
  `frame-ancestors` (`worker/security_headers.js`) does not list.
- Chromium 1228 (Playwright), real APP `interface/app.html` routed under `https://preceptoros.mvp.local` with `/api/*`
  unanswered (as on the APK), WEB `public/` of `origin/main` c58d1868 with the worker's policy:
  - current policy: `Framing 'https://preceptoros.org/' violates ... frame-ancestors` (refused);
  - proposed policy: map loads in the frame; after «Skip tutorial», Share + consent → crab `LIVE` at
    the real `https://api.preceptoros.org` Aduana. Two rounds, two distinct crab ids.
- This is desktop Chromium with the APK origin, **not** the physical Android WebView. Device proof: `NO_DATA(not_deployed)`.

## Change (one origin, plus its test)
- `worker/security_headers.js`: append `https://preceptoros.mvp.local` to `frame-ancestors`. Never a wildcard.
- `tests/security_headers.test.mjs`: exact list; any other origin or `*` fails (sabotage measured: extra origin → fail 1, `*` → fail 1).

## Risk (honest)
- `preceptoros.mvp.local` is not a public DNS name; no public CA can issue a TLS certificate for it, so an ordinary
  browser cannot present that origin with a valid certificate. A device that already runs a hostile app with a custom
  WebView could claim the origin — that app can already draw anything on that device. The map holds no credentials;
  a frame cannot read the visitor's storage.
- Alternative without a header change: an APK change that opens the map in the system browser (Codex/mvp-android, needs a new signed APK).

## Done when
After FIRMO, merge and the Sovereign's deploy, the Open World tab on S110 and Tank3 shows the live map, and three
visitors (S110, Tank3, Beelink 8742) share crabs that each other client observes moving, twice.
