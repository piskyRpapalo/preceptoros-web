# First signed creation · operator runbook

This runbook covers one locally voiced, author-signed Bubble drawing hosted by
the rack app. It does not publish a node credential and it does not treat an
`encolado` credential receipt as evidence that the creation is live.

## Before the journey

1. Install the reviewed PreceptorOS app version and its fixed creation-view
   resources on the rack. The app uses its existing loopback listener; this
   procedure opens no listener or tunnel.
2. Confirm that the rack browser can open the local app and play audio. Confirm
   the local voice engine is available. If the voice engine is missing, record
   `NO_DATA` with the returned cause and stop the real-user measurement.
3. The public creation page is served by Workers Static Assets. Wrangler's
   current default `auto-trailing-slash` means a file such as `creation.html`
   has the canonical extensionless route `/creation`. Use that route in
   browser checks. The operator performs any public deployment manually using
   the existing authorized procedure; this runbook and its tests do not deploy.

## Create and sign

1. In the rack app, open **Settings → Creation voice**. Enter the statement the
   author wants to attach, then explicitly select **Generate voice downloads**.
   Listen to the generated statement and download the voice catalog, statement
   descriptor, and WAV. Keep the generated files together; the descriptor binds
   the WAV to the one reported voice profile.
2. Open the public creation page at `/creation`. Create or unlock the web
   identity in that browser. Use the arrow keys with audio guidance to draw the
   ribbon; pointer and touch may be used for comparison. Load the three local
   voice files, listen to the statement, and sign the drawing and statement.
3. Download the signed JSON creation package. The browser signs the exact
   manifest bytes with Ed25519. The WAV carries the author's statement; it is
   not voice-biometric authentication. A changed drawing, statement, profile,
   or audio requires signing again.

## Import, publish, and read independently

1. In the rack app, open **Ajustes → Publicar una creación firmada**. Choose the
   downloaded JSON file. File selection alone does not upload it. Press
   **Verify and import** to send it to the loopback app endpoint.
2. The app verifies the closed package, per-file SHA-256 values, and Ed25519
   signature before its atomic local write. Save the returned relative URL.
3. Open that URL in a separate browser context on the rack, without relying on
   the author's web storage. Record the HTTP status and the app/service version
   actually served. Confirm that the drawing is rendered, its signature is
   verified again, and the WAV plays. Compare the manifest ID and frame/audio
   hashes with the downloaded package. Repeat after an app restart.
4. Keep author identity and host-node charter separate. The node charter's
   existing human-triggered export still exports only the charter; a receipt
   that says `encolado` is not a creation URL and does not establish LIVE.

## Evidence matrix

| Channel or check | Automated evidence | Physical evidence required for the journey |
|---|---|---|
| Visual drawing and rendered view | frame and status parity in `creation_parity.test.mjs` | rack-browser screenshot or equivalent sanitized render record |
| Keyboard | synthetic arrow sequence matches the pointer frame | real keyboard operation without consulting a screenshot |
| Touch | synthetic pointer events match the frame | measured touch device; emulation alone is not a physical touch result |
| Audible orientation and statement | catalog clip sequence and statement descriptor checks | record successful playback through the rack's actual audio output |
| Signature and transport | Ed25519 and hash checks over exact bytes | independent rack browser reads the same ID and hashes after restart |

The parity judge uses a fake DOM and simulated input. It is not a real browser,
physical touch, or audible-playback measurement. Until the rack journey is run,
those device results are `NO_DATA` with the concrete missing device or output
cause. This evidence covers the creation journey only; it does not certify
accessibility across the entire site or app.

## Local judges

```sh
node --test tests/creation_parity.test.mjs
node --test tests/creation_flow.test.mjs
python3 test_web.py
node arnes_sw.mjs
```

Run the existing web gates without changing their thresholds. If a local
sandbox cannot bind loopback, record that error as `NO_DATA`; run the blocked
socket check in the rack or another authorized environment. A simulated pass
does not replace it.
