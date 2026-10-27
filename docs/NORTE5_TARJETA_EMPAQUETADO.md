# NORTE 5 · (a2) the packaging card: how the app becomes a 2-click download

**Proposal, measured 2026-10-27** on `soberano`. WEB main `df0dce5`; APP `piskyRpapalo/PreceptorOS` at `d216c3d`. **Nothing
was installed or built**: installing the build tool and publishing a release are supply-chain decisions, each with its own
FIRMO (the Sovereign, 2026-10-27).

## Why the app lane is off today

`/get-the-app/` draws the launch gate (NORTE 5 a1). Its lane 2, *Install the app*, lights only when `public/release.json`
carries a **signed receipt for the visitor's system** (`release.firmada[<os>]`; `launch_gate.js` reads it). The card has
no such field today, so the lane shows `NO_DATA (no signed receipt for <os> in release.json)`.

## What already exists (measured)

| piece | where | state |
|---|---|---|
| One-file launcher (double click, opens the app in the browser on loopback) | APP `empaquetado/lanzador.py` | written; standard library only |
| Build script (PyInstaller `--onefile`, icon, `interface/`, policies, assets) | APP `empaquetado/construir_pc.sh` | written; **never run under the name `preceptoros`** |
| Last binary on disk | APP `dist/aurelius` (15,932,760 B, 2026-08-25) | old name, not published, not reproducible from today's tree |
| PyInstaller | — | **not installed** on `soberano` (`pyinstaller` not found; no module) |
| What the launcher does NOT carry | `llama-completion` (third-party executable) and the 2.3 GiB model | said by the launcher itself: without them the app asks and remembers, but does not chat |

## The card (what the Sovereign would sign)

### 1 · The tool (FIRMO 1: supply chain)
- PyInstaller from PyPI, at **one pinned version**, in an isolated `uv` venv under the build user's home. Never system-wide,
  never `sudo`. As the APP's own `INSTALL_PC.md:127` already says: `uv pip install pyinstaller`, plus the version pin.
- Its wheel's sha256 is written into the card before the build. A different hash stops the build.

### 2 · The build (measured, no FIRMO needed beyond 1)
- **Linux only**, on `soberano`, from a clean checkout at an exact APP commit: `empaquetado/construir_pc.sh`.
- Measured and written into the card:
  - bytes and sha256 of `dist/preceptoros`;
  - the APP commit it was built from;
  - that it starts and serves `interface/app.html` on loopback within N s (one measured start).
- **Windows and macOS: `NO_DATA`**, cause: no such machine in the rack. Android stays the Termux guide; there is no APK.

### 3 · The release (FIRMO 2: publishing is the Sovereign's act)
- The Sovereign publishes `v1.4` on `piskyRpapalo/PreceptorOS` with `preceptoros-linux-x86_64` plus its `.sha256` sidecar.
- Agents never publish a release, as with deploys.

### 4 · The signed receipt per system (FIRMO 3: lights the lane)
The web's `public/release.json` gains one field, written from the published release and never typed by hand:

```json
"firmada": {
  "linux": { "asset": "preceptoros-linux-x86_64", "sha256": "<64 hex, the published asset>", "bytes": 0,
             "firma": "<buzon#30 comment id of the Sovereign's FIRMO>", "fecha": "YYYY-MM-DD" }
}
```

- `launch_gate.js` lights lane 2 for Linux the moment this exists; **no web code changes**.
- The a1 judge (`tests/get_the_app.test.mjs`) already checks that the page's `firmada` equals the card's, and turns red on an
  invented receipt.
- A follow-up web piece points lane 2's button at that asset (today it points at the release page) and shows its sha256.

## Clicks, counted

| system | clicks after the card is signed | today |
|---|---|---|
| Any browser that offers it | 1 (web app) | **1, live** (measured in Chrome 2026-10-27) |
| Linux | 2 (download, then double click) | `NO_DATA` (no signed receipt) |
| Windows / macOS | — | `NO_DATA` (no machine to build and run on) |
| Android | Termux guide | `NO_DATA` (no APK) |

Agent: Claude Code · Model: claude-opus-5-5 / Run: NO_DATA
