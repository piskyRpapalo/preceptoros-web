# WEB-ANDROID-DOWNLOAD-01 · signed package distribution

Date: 2026-11-12. Status: implemented in proposal branch; not deployed.

## Problem and origin
The public release card already declares Android android-v1.0.1 TWA APK,
but the launch gate disables the Android APP lane, and the OpenWorld visitor
panel still claims no APK. The public site and GitHub Release both returned
HTTP 200 and 1,340,742 bytes. Downloaded APK SHA-256 matched release.json.

## Adaptation
- Existing release card is the only Android source; embedded gate uses same-origin URL, version, SHA-256 and bytes.
- Android offers one-click DOWNLOAD, not false one-click installation. User must open and approve installation.
- Update Android app downloads the same signed APK; Android's package manager verifies its signing certificate.
- Browser PWA installation remains a separate lane. This APK is a Trusted Web Activity, not an offline AI runner.
- Version published and NO_DATA cause are readable and machine-readable. Installed native version is unobservable from a website.
- No network request added, no tracking, identifiers, prompts, or device data, no backend writes.

## Verification
- node --test tests/get_the_app.test.mjs: 7/7 including negative APK tests.
- python3 test_web.py: 82 cases, one skipped, local success on rack-main.
- SW version and config/sw-huella.txt aligned; counters.py refreshed site size.
- Public APK byte-count and SHA-256 match release card.

## Limits and next piece
- NO_DATA(DOGGEE_install_update): selected phone not connected through ADB at measurement time.
- NO_DATA(native_offline_model): the existing APK is a TWA.
- NO_DATA(installed_version_telemetry): web pages cannot inspect native packages.
- NO_DATA(private_opt_in_telemetry_contract): not signed or deployed; no silent tracking.
- Claude should inspect current GitHub HEAD and CI, then measure Android package ID,
  versionCode, signing identity, update outcome and rollback on the connected DOGGEE.
  Never commit private serials. For offline mode, prefer a deterministic local MCP
  fallback with accessible visual/audio/machine-readable parity; native model is
  separate until measured. Live crabs use existing OpenWorld world-state, not a second map.
