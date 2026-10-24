# Rack Android preview · three themes

Measured base: WEB `8c4eeed840757a02bf5b6cc85b67f40fdbced78a`. The single launcher displays the three self-contained examples together. Across the examples, only frame palette bands vary: geometry, coordinates, chat panel, joystick, transitions and placeholder copy stay identical. It loads only Bubble sources from this checkout; there is no LAN listener or public deployment.

## One-command open

From the root of this worktree, in a terminal with exactly one rack Android connected over USB, run:

```sh
adb reverse tcp:18765 tcp:18765
python3 -m http.server 18765 --bind 127.0.0.1 --directory .
```

Keep that terminal running. In a second terminal, open the one-page launcher on the rack Android:

```sh
adb shell am start -a android.intent.action.VIEW -d 'http://127.0.0.1:18765/docs/rebuild/examples/index.html'
```

Expected: a `Starting: Intent` result; the page shows Basic, Atlantis and Zombie side by side (stacked on a narrow screen). On a cold load the local server should return HTTP 200 for `index.html`, all three theme pages and each `public/game/` script; cached script responses may be HTTP 304. One launcher opens all examples; visual review by the Sovereign is still required and is NOT VERIFIED by the HTTP receipt.

Measured here: `adb reverse` returned port 18765; the Android browser opened the launcher and requested all three pages (HTTP 200), the encoded palette script (200), and cached Bubble scripts (304). `adb shell toybox wget` is unavailable on this Android image (NO_DATA, cause: the command is not present); browser navigation and server access log were used instead. First probe found port 8765 already occupied, so the measured free port is 18765.

Stop the server with Ctrl-C, then remove the temporary forwarding:

```sh
adb reverse --remove tcp:18765
```

If more than one Android device is connected, or `adb reverse` fails, stop and report NO_DATA with the exact cause; do not guess a device selector. The preview is local-only.

## App pieces usable today

- `interface/dashboard.html` + `interface/dashboard.js` (APP `7885afe88ad8a456d6af91aa08a62998818b5c9c`) → existing app dashboard/navigation; it is not yet the measured shared chat-plus-joystick face.
- `interface/creation_voice.js` + `voz_creacion.py` + `/api/creaciones/voz` → local author-voice generation/download path (PreceptorOS#100, receipt buzon#19/6377404930); usable as an optional voice asset, not as the unified chatbot response path.
- WEB `tools/creation_image_package.js` → validates/packages image bytes, but has no generator/model/UI (NO_DATA, cause recorded in `docs/prompt-to-2d-package.md`). WEB `bubble_paint.js` → Bubble paint interaction is in the web game, not mounted in the app dashboard (NO_DATA for app integration, cause: no app route/caller found in measured APP tree).

## Claude's exact gates

Run from WEB worktree root:

```sh
node docs/rebuild/examples/validate.mjs
node atlas/bubble_language_casos.mjs
node atlas/bubble_bestiary_casos.mjs
node atlas/bubble_paint_casos.mjs
```

Expected: three frames below 1,024 UTF-8 bytes, valid Bubble compilation, identical normalized geometry across palettes, all three pages below 16,384 bytes, local resources only; then each atlas case command returns `ok: true`. `test_web.py` is not required because this card changes no file under `public/`. If any source is later copied into `public/`, run `python3 test_web.py` and the full applicable gate, and apply the seal/re-pin rules in the same PR. The Sovereign must confirm visual review on the rack Android; a successful compile or HTTP response is not that review.

## Eyes on the face (added by the painter, 2026-10-24)

The three skins are now generated: edit `face.js`, `face.css`, `skins.json` or `tools/face.tpl.html`, then run `node docs/rebuild/examples/tools/build.mjs` (web) and `node docs/rebuild/examples/tools/build.mjs <app>/interface/face app` (app). The validator fails on any drift.

- Local browser, no download: `node docs/rebuild/examples/tools/shoot.mjs http://127.0.0.1:18765/docs/rebuild/examples/zombie.html out.png 412 walk`. It prints any non-loopback request (must be `[]`) and the face state.
- Rack Android, measured from the PC: `adb forward tcp:9333 localabstract:chrome_devtools_remote`, then `node docs/rebuild/examples/tools/android.mjs <url> [png] [js]`. It navigates the open loopback tab, reports `innerWidth`/`scrollWidth` and the elements that overflow, and can run a probe. Full-page captures on Android tile; use `adb exec-out screencap -p` for what the screen really shows.
- Real touch: `adb shell input swipe <x> <y> <x+180> <y> 300` on the joystick centre (CSS px × dpr plus the browser bar offset).
- App: `PRECEPTOROS_PWA_PUERTO=18766 python3 bin/preceptoros-pwa --db <scratch>/empty.db`, `adb reverse tcp:18766 tcp:18766`, open `http://127.0.0.1:18766/`. Use a scratch database: the default is the person's memory.
