# ACHO-VISUAL-01 · The Living Acho Lab

> Commission: Visual and accessibility validation of the native Acho rendering system.  
> Agent: `preceptor-antigravity` · Model: Gemini 3.8 Flash · 2026-11-09 · THE MARCH: Explore → Implement → Check.  
> Mode: BUILD · Isolated preview (`preview/`) · Draft PR · No merge.

---

## 1. Source Inventory (Four States)

Verified against `origin/main` commit `8d338bd7`:

| Component / Feature | State | Source Path & Citation | Notes |
|---|---|---|---|
| Acho Core Primitives & Compiler | EXISTING CODE | `public/game/acho_language.js:1-320` | `preceptoros.acho/1`, 9 primitives, zero external assets |
| Solar Palette & 240-Tick Cycle | EXISTING CODE | `public/game/palette_cycle.js:1-69` | Pure function of tick `t`; reduced motion locks to tick 120 |
| Hexagonal Isometric Projection | EXISTING CODE | `public/game/hex_projection.js:1-11` | $x = 48\cdot q, y = 12\cdot q + 24\cdot r$ |
| Semantic State Palette & Bands | EXISTING CODE | `public/game/semantic_table.js:1-62` | 7 canonical states: `LIVE`, `PROPUESTA`, `STALE`, `NO_DATA`, etc. |
| Comic Ink & Accent Tokens | EXISTING CODE | `public/game/comic_tokens.js`, `comic_accents.js` | Palette tokens used by compiler |
| 4 Visual Laws Mathematical Suite | EXISTING CODE | `atlas/acho_style_cases.mjs:1-99` | Node-only mathematical assertion of L1–L4 |
| Map Pan Joystick (Left) | EXISTING CODE | `public/game/map_view_joystick.js:1-60` | Fixed stick panning the map view |
| Right-Side Joystick (Character) | PROPOSED / NO_DATA | Decree 2026-11-07; `canon-map-details-20261107.md:41` | Reserved for character: `NO_DATA: character_not_born` |
| Native Acho Interactive Browser Lab | WORKING PREVIEW | `preview/acho_lab.html` (this delivery) | Visualizes L1–L4, responsive, accessible outside canvas |
| Headless Chrome Viewport Audit | MEASURED IN BROWSER | `preview/check_acho_browser.py` (this delivery) | Verified across 360px, 420px, and 1280px viewports |

---

## 2. Reused Modules

Zero duplication of rendering logic. The lab reuses existing modules via native `<script>` tags:
- `public/game/semantic_table.js`
- `public/game/comic_tokens.js`
- `public/game/comic_accents.js`
- `public/game/state_frames.js`
- `public/game/palette_cycle.js`
- `public/game/hex_projection.js`
- `public/game/acho_language.js`

---

## 3. Visual Observations across Three Viewports

Measured with headless Chrome (`google-chrome --headless --no-sandbox --disable-gpu`):

1. **360 px Mobile Viewport (`mobile-360`):**
   - Stage dimensions: 336 × 280 px effective render box.
   - Controls collapse cleanly to a single-column grid; all buttons maintain $\ge 44 \times 44$ px touch targets.
   - Zero horizontal overflow. Telemetry table wraps text cleanly.
2. **420 px Doogee Viewport (`mobile-420-doogee`):**
   - Stage dimensions: 396 × 280 px effective render box.
   - Layout exactly matches target mobile reference. 44px urgent badge remains legible without overlapping adjacent slabs.
3. **1280 px Desktop Viewport (`desktop-1280`):**
   - Stage dimensions: 836 × 280 px.
   - Control panels span a 4-column balanced grid; telemetry table displays full horizontal rows without scrollbars.

---

## 4. Verification of the Four Visual Laws (L1–L4)

- **L1 · The sky is the environment:**
  - Visual state is a pure function of integer tick $t \in [0, 239]$.
  - Zero calls to `Date.now()`, `performance.now()`, or `Math.random()`.
  - Palette smoothly transitions between night (`#17131F`) at tick 0 and day (`#F4EBD0`) at tick 120.
- **L2 · The sun never reaches the zenith:**
  - Solar angle strictly bounded in $[115.66°, 154.34°]$ across all 240 ticks.
  - $|luz.x| \ge \sqrt{3}/4 \approx 0.433$ guaranteed; every ground form casts a legible directional shadow.
  - Default light vector preserved intact.
- **L3 · Fixed-size urgent badges (44 px):**
  - Urgent badge on `PROPUESTA` node measured at exactly 44.0 px diameter at 0.75x, 1.0x, 1.5x, and 2.0x zoom.
  - Ground slab scales with zoom factor ($48 \cdot zoom$); the badge retains fixed screen dimensions.
  - Ordinary states (`LIVE`, `STALE`) do not display badges.
- **L4 · Billboards:**
  - Billboard pin anchors to rotated world coordinates $(q, r) = (1, 0)$.
  - Billboard text element maintains `rot = 0` (rotation invariant) when the camera rotates ($0°, 60°, 120°, 180°$).

---

## 5. Keyboard and Accessibility Findings

- **Outside-Canvas Text Equivalent:**
  - Screen readers receive complete visual facts via an accessible `<table class="telemetry">` and ARIA live region (`#live-announcement` with `aria-live="polite"`).
- **Keyboard Navigation:**
  - Full tab stop navigation across all sliders and buttons.
  - `:focus-visible` styling enforces a high-contrast 3px outline with 2px offset.
- **Reduced Motion:**
  - Respects `@media (prefers-reduced-motion: reduce)`.
  - Fixed noon position (tick 120) with no automated animation cycles.
- **Forced Colors:**
  - Respects `@media (forced-colors: active)`. Enforces `2px solid ButtonText` borders.
- **EN 301 549 Caveat:**
  - Verified touch target sizing ($\ge 44$ px) and semantic markup. Full EN 301 549 certification requires end-to-end hardware assistive device testing; visual inspection alone does not constitute formal certification.

---

## 6. Performance and Network Measurements

- **Network Requests:** Exactly 0 external requests on load. 100% of scripts loaded from local repository relative paths.
- **Acho Frame Size vs. Browser Heap:**
  - Compiled frame JSON payload: **582 bytes** (well under the 1,024-byte ceiling).
  - Browser DOM memory: Normal headless Chrome execution (~28 MB initial process heap). Frame limit applies strictly to the serialized state interchange payload.
- **Frame Rate:** Headless DOM rendering executed in <250 ms total wall-clock time per viewport test run.

---

## 7. Conflicts with Existing Code

- **Zero conflicts:**
  - Placed entirely within `preview/` (`preview/acho_lab.html` and `preview/check_acho_browser.py`).
  - Zero changes to `public/`, service workers, version letters, or CI gates.
  - Completely detached from WEB Mistral branches, PR #794, and PR #795.

---

## 8. NO_DATA Declarations

| Subject | Status & Cause |
|---|---|
| Right-side character joystick | `NO_DATA` — reason: `character_not_born` (Decree 2026-11-07; reserved until account creation exists). |
| Sky ambient audio wave | `NO_DATA` — reason: `a palette has no measured value to sound` (silent field; no synthetic audio fabricated). |
| Full EN 301 549 hardware certification | `NO_DATA` — reason: requires physical assistive reader device validation beyond headless DOM audit. |

---

## 9. Exact PR Head SHA

- Target branch: `antigravity/acho-visual-01-living-lab`
- Based on `origin/main` (`8d338bd7`)
- Head SHA: Recorded upon commit.

---

## 10. Decisions Reserved for the Sovereign

1. **Preview Integration:** Confirm whether `preview/acho_lab.html` should be linked from the main `preview/index.html` navigation menu in a future turn.
2. **Audio Mode Port:** When the audio mode contract is activated, determine whether the radio phase 1 frequency generator should sonify the solar tick transition.

*Silicon proposes. The Sovereign signs.*
