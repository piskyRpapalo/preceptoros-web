# WEB · Panel return continuity receipt · 2026-11-11

**Agent:** Codex · GPT-6 · WEB test lane · **Status:** TESTED-LOCALLY / PROPOSE-ONLY. **Source:** existing first-visit and building-interior missions; existing `atlas/building_sheet_browser.mjs`. This is an expansion of an existing browser gate, **not a new panel or mission ID**.

## What was missing

The WEB browser acceptance test already verified nine native building cards, their LIVE/NO_DATA labels, 44px controls, keyboard Escape to return and reduced-motion behavior, but only at 360×740 and 420×642. It did **not** perform repeated navigation cycles or inspect the 320px floor and wide 1024px viewport. A panel may work once but lose focus or leave a hidden overlay on repeated use.

## Adaptation and measurable gain

Extend only the existing browser gate; **zero changes under `public/`** and no service-worker or API modification. At **320×568, 360×740, 420×642 and 1024×768**, execute 10 consecutive sequences:

`Node → nine-building sheet → focus on a visible building control → Escape → sheet closed → focus back on Node`.

For each cycle, verify: visible/hidden truth, `aria-expanded`, focus, nine cards, no controls under 44px on opening and no horizontal page overflow on opening or closing. Retain existing nine building option/contract checks and reduced-motion no-animation assertion.

### Observed results (isolated WEB origin/main at a404127b42b8)

| Source / check | Run 1 | Run 2 |
|---|---:|---:|
| Real Chrome navigation cycles, 4 viewports ×10 | 40/40 | 40/40 |
| Original nine-building contract checks | GREEN | GREEN |
| Deliberate `SABOTAJE=sin-hoja` | RED as intended | RED as intended |
| `python3 test_web.py` | 82 tests / 1 skipped, GREEN | 82 tests / 1 skipped, GREEN |
| `node atlas/every_case.mjs` | 63 greens, 0 reds | 63 greens, 0 reds |
| `node atlas/version_sw_gate.mjs --base origin/main` | GREEN | GREEN |

The test is included in the **existing** `.github/workflows/gate.yml`. `git diff --check` GREEN ×2. One Python gate printed a transient BrokenPipe traceback from the local HTTP test server while the suite still ended `OK`; this is a nonzero warning, **not proof the network is perfectly stable**.

**Limit:** headless browser/desktop emulation is not the user's physical phone or an assistive device; tactile, screen-reader and audio E2E stay `NO_DATA: not exercised`. These tests do not attest any Vercel deployment, the private APP's panel routing, or 3DFabrika print-ready STL/slicer integration.

## Fences and collision check

This change touches only `atlas/building_sheet_browser.mjs` plus this dated receipt. It has **no file collision** with open WEB #794 (landing) and WEB #803 (visitor chat). Reuses WEB main's existing layout and building code. It does not modify APP, the separately deployed Vercel application, CAD, printed models, station settings, running Claude sessions or existing signed mission catalogs.

**Next:** exact-head CI check; independent BEACON review; Sovereign FIRMO before merge. A green test branch is not a production deploy. New APP/Vercel path and printable model screen truth must be independently verified by its designated owner before claiming end-to-end convergence.

— Codex · GPT-6 · WEB
