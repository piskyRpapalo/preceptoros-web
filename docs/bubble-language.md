# The bubble language · `preceptoros.bubble/1`

Signed by the Sovereign on 2026-10-18: *the language of preceptoros is created by Claude, and that language makes the graphics.* This page is its specification. The renderer lives in `public/game/bubble_language.js` (primitives and light) and `public/game/bubble_bestiary.js` (composite words). The first text written in it is the story of the statue (`public/assets/descent_scene.js`, retired 2026-10-19); its living example is now the Codex, `public/assets/codex_scene.js`.

## 1 · Why a language

One state, many renders. A **frame** is a *syllable* of the bubble language: a small JSON object, always under 1,024 UTF-8 bytes, that a small model can read and write and a person can audit. The renderer turns it into a comic picture by mathematics. The picture is rich because the math is rich, not because the frame is big.

- **Deterministic.** Same frame, same picture. No `Math.random`, no clock, no network. Variation comes from a seeded hash.
- **Named colour only.** Every colour is a band name: `ink`, `paper`, `ocean`, `cyan`, the signed accents `vermilion.base` and `comic yellow.base` (plus their `brillo`, `sombra`, `contorno`), and the seal bands of `tabla_semantica.js` only where they carry their literal meaning (for example `FIRMADO.base`: signed). Colour always travels with text.
- **Readable.** Each word carries a plain sentence (`r`) of what it shows. The six reader fields map one to one: elements = `atoms`, colours = `bands`, changes = `change`, sounds = `sound`/`soundCause`, text = `r`, state = `t`/`id`.
- **Family friendly by construction.** No primitive can make a spike, a tooth or a crack (section 6).

## 2 · The frame

```json
{"v":"preceptoros.bubble/1","id":"CLIFF","t":500,"cv":[412,515],"light":[-0.35,-0.94],"style":"volume",
 "atoms":[{"k":"rock","r":"a big marble rock sticks out of the cliff","i":[{"o":"blob","x":200,"y":220,"rx":118,"ry":100,"seed":"rock","vein":4,"f":"paper","s":"ink","d":0}]}],
 "bands":["cyan","ink","ocean","paper"],"change":["the logo leaves; the rock arrives"],
 "sound":"NO_DATA","soundCause":"static-first: sound planned, not served","motion":"NO_DATA"}
```

| key | meaning |
|---|---|
| `v` | always `preceptoros.bubble/1` |
| `id`, `t` | the section and where it starts on the page (scroll px) |
| `cv` | canvas size in CSS px (default `[412,515]`, 4:5) |
| `light` | unit vector pointing TO the light, canvas axes (y grows down). Under the sea the light comes from above: default `[-0.35,-0.94]` |
| `style` | `clear` (flat), `volume` (default: shadow, halftone, rim, highlight) or `etch` (hatching instead of halftone) |
| `atoms` | the words, back to front. `k` the noun, `r` the sentence, `i` the items |
| `bands`, `change`, `sound`, `soundCause`, `motion` | as the shared frame contract (`atlas/param_gate.mjs`) |

Every item has `o` (its primitive or word), `f` (fill band or `null`), `s` (stroke band), optional `lw` (ink width) and `d` (depth: `0` near, `1` middle, `2` far; default `0`). A frame may leave out `cv`, `light` and `style` when they are the defaults: that is how syllables stay small.

## 3 · Primitives

Coordinates are canvas CSS px; angles are degrees; `seed` is any short string.

1. **`wave`** `{x, y, sc, rot, h:[[k, ax, ay, ph], …]}` — the house shape: a closed curve `P(u) = AtlasGacha.punto(h, u)`, `u` in `[0, 2π)`, 96 samples, scaled by `sc`, rotated, moved to `(x, y)`. Creatures, troops and emblems are waves. A five-lobed star is `[[1,R,R,0],[-4,0.3R,0.3R,0]]`; curls are a high harmonic of small amplitude.
2. **`blob`** `{x, y, rx, ry, rot, seed, rough}` — a smooth organic body: the wave `[1, rx, ry, 0]` plus harmonics `k = 2…5` whose amplitudes and phases come from the seed, bounded so that `Σ k·a_k ≤ 0.45·min(rx, ry)` (the outline never folds into a point). `rough` in `[0,1]` (default `0.25`) scales the extra harmonics. Rocks, stones, domes, coral heads.
3. **`ribbon`** `{pts:[[x,y],…], closed}` — a smooth curve through points (Catmull-Rom turned into cubic Béziers, tension 1/6). Kelp, arms, seams, veins, sight lines, the rift.
4. **`arcs`** `{x, y, r:[r0, r1], n, arc, ph}` — `n` arc strokes between radii `r0` and `r1`, each `arc` degrees long, spread evenly starting at angle `ph`. Wobble rings, «boing» marks, eye rings.
5. **`field`** `{kind, …}` — points placed by a rule:
   - `halftone` `{x:[x0,x1], y:[y0,y1], r:"5|3|1.5|0", step, a}`: dots on a grid turned `a` degrees (default 45, step 12), the radius falling in flat steps from top to bottom. Light in the water.
   - `bubbles` `{x, y, n, h, seed, r:[rmin,rmax]}`: a column of bubbles; each is a circle (fill `ocean`, stroke `cyan`) with a paper highlight arc at ten o'clock.
   - `snow` `{n, seed}`: marine snow, tiny paper dots of radius 1 to 1.5.
   - `phyllo` `{x, y, n, c, r}`: the golden angle, point `i` at angle `i·137.508°` and distance `c·√i`, radius shrinking with `i`. Coral polyps and anemones.
   - `school` `{x:[x0,x1], y:[y0,y1], n, seed}`: small far fish, line only.
6. **`wall`** `{x:[x0,x1], y:[y0,y1], side, tilt, seed, lip, per, vein}` — the cliff: the region between a smooth edge at `x0` and the canvas side (`x1` is the reader's note of how far the wall reaches; the renderer fills to the side). Edge `x(y) = x0 + (y − y0)·tan(tilt) + Σ_{j=1..3} (6/j)·sin(2πj(y − y0)/H + φ_j)`, phases from the seed. `lip:"round"` rounds the top corner (radius 24). `per > 0` adds a round ledge every `per` px. `vein` marble veins inside.
7. **`text`** `{x, y, tx, sz, w, rot, sh:[dx, dy, band]}` — letters in the system font (rotation through a group).
8. **`keep`** `{k}` — repeat earlier words without rewriting them: `k` is a section id (all its words) or `SECTION:word|word` (only the words of that section whose `k` is listed, in their order). Resolved through the earlier sections, recursively. It is how a later syllable leans on words already grounded; it also keeps frames small.

**Defaults** (leave them out and the syllable stays small): `halftone` covers the whole canvas with `r` `5|3|1.5|0`, step 12, angle 45; `bubbles` `n` 3, `h` 200, `r` `[4,10]`; `wall` `side` `right`, `lip` `round`; `blob` `rough` 0.25; `bust` `r` 64, eyes `shut`, mouth `closed`; `pile` `n` 7, `r` `[18,30]`; `boing` `n` 2, `arc` 50; `crab` `rr` 40, `dir` 1, eyes `open`; `troop` `r` 12. The `reef` word paints its own water before its corals.

Composite **words** (`bust`, `crab`, `star`, `snail`, `octo`, `fish`, `troop`, `city`, `reef`, `pile`, `rift`, `seam`, `slab`, `boing`, `wob`) are registered with `AtlasBubble.define(name, fn)` and expand into primitives. Their parameters are listed in `bubble_bestiary.js`.

## 4 · Light and volume (`style: "volume"`)

Applied to every closed, filled primitive with depth `d ≤ 1`, in this order:

1. **Cast shadow.** The same outline, offset by `round(−light · 5.6)` px, filled with the shadow band: `cyan` over dark (`ocean`, `ink`), `ink` over light. Hard: no blur.
2. **Fill**, then **halftone core shadow.** A dome normal over the shape's bounding ellipse `(cx, cy, Rx, Ry)`: for a grid point `q` (45°, step 6) inside the outline, `nx = (qx − cx)/Rx`, `ny = (qy − cy)/Ry`, `nz = √max(0, 1 − nx² − ny²)`, `lum = max(0, n · L3)` with `L3 = normalize(lx, ly, 0.9)`. Where `lum < 0.62`, a dot of radius `2.4·((0.62 − lum)/0.62)^0.8` in `ink`. No dot within 3 px of the outline, never inside a text box.
3. **Rim light.** Where the outward normal of the outline faces away from the light (`n · light < −0.35`), a `cyan` stroke 2.5 px inside the outline, width 2: the light that bounces in the water.
4. **Highlight.** On bodies that are not `paper`, where `n · light > 0.55`, a crescent stroke 4 px inside the outline in the body's `brillo` band (or `paper` for `cyan` bodies), width 3. A base band declared in the frame covers the four tones of its family (`base`, `brillo`, `sombra`, `contorno`): the light may use them on that body and nowhere else.
5. **Outline.** `ink`, width by depth: `d0` 3.5, `d1` 3.0. Far bodies (`d2`) are line only, in `cyan`, width 2.5, no fill and no shading: atmospheric depth.

`style: "etch"` draws hatching instead of halftone (parallel lines at 45°, 5 px apart where `lum < 0.62`, 3.5 px where `lum < 0.35`). `style: "clear"` keeps the cast shadow and the outline only.

## 5 · Determinism

- `hash32(s)`: FNV-1a, 32 bits, over the UTF-16 code units of `s`.
- `rng(key)`: mulberry32 seeded with `hash32(key)`; returns numbers in `[0, 1)`.
- The key of a seeded item is its `seed` alone when it has one, so the same rock, cliff or rockfall comes out identical in every section that names it (continuity). Without a `seed`, the key is `frame.id + ":" + atomIndex`.
- `compile(frame)` is a pure function: same JSON in, same item list out (deep-equal), so the same pixels on the same platform.

## 6 · Family friendly by construction

- `blob`, `wall` and `ribbon` are smooth by definition. `wave` is the house formula as it is (a troop may be spiky in the game); the words of the intro call it with low, tame harmonics, and that is where family friendliness lives for waves.
- There is no teeth, blood or fire primitive. Eyes are circles and arcs; mouths are `closed`, `o`, `smile` or `happy`.
- **The rift (la Grieta) is canon, and it is never a jagged line.** It is negative space: two smooth edges that open with water between them (`seam`, `rift`), plus the tremor that moves them. A shell or a wall that "cracks" is two edges coming apart, never a tooth. (Correction of 2026-10-18: an earlier line here forbade any crack, against the canon of the rift; the Mesa's settlement, approved: the rift is the space between two planes.)
- Motion is a function of the scroll, never of a clock: a bounce squashes at most 1.12 × 0.88 and recovers; nothing breaks. See §6b.

## 6b · The pulse (polish pass, 2026-10-18)

A syllable does not change: it is the pose at rest, and it still passes `checkFrame` on its own. The scene adds one more table beside it, `MOTION[section][atom]`, that bends the language's own parameters by `p`, the share of the section already read (`0 ≤ p < 1`, cut into 24 steps by the view):

| op | what it bends | example |
|---|---|---|
| `dx`, `dy` | position, linear in `p` | bubbles rise, fish swim, climbers climb |
| `bob [a, n]`, `shake [a, n]` | position, `a·sin(2πnp)` | octopus floats, the face trembles |
| `ph`, `a`, `rot` | harmonic phase, halftone angle, rotation | tiny waves change shape, the light shimmers, rings turn |
| `grow`, `gap`, `w` | radii, the rift's gap and width | the rift opens |
| `breathe n` | `sq` within ±2 % | the sleeping face breathes |
| `bounce [a, n]` | `x + a·\|sin(πnp)\|`, `sq` up to 1.12 × 0.88 at contact | the head bounces off the wall |
| `contact n` | the atom is drawn only near a contact | «boing» marks |

The `neck` primitive joins two `[x, y]` anchors with a pure 25-point curve. Its signed width is `k·4p(1−p)`, so the centerline is exact at both anchors and returns to the straight segment at `p=0` and `p=1`; the widest bend is at `p=0.5`. Invalid anchors, width, side or progress produce `NO_DATA` in compilation. It uses no smooth-min, so the join adds no radius to either anchor.

Three rules keep it honest. **Same `p`, same picture:** the table is data and the ops are pure, so the eye that checks the page (same scroll after a reload and coming from below) keeps passing. **Reduced motion is the static-first lot:** with `prefers-reduced-motion` the view asks for no `p` and paints the syllable as it is. **Two layers:** everything before the first moving atom is the background, compiled once per section and kept as a bitmap; only the moving atoms are compiled per step (`fondo(id)` + `frente(id, p)` paint exactly `items(id, p)`, pinned by a case).

## 6c · The game's words and letters (V7 and V9, 2026-10-18)

- **`letters`** (`bubble_letters.js`): the house letters, 72 vector glyphs (A-Z, Ñ, a-z, ñ, 0-9, `. , ! ? - · : %`) on an 8 × 12 grid, 1.6 KB of data. Three passes: hard shadow, `comic yellow.base` contour, `paper` fill. Round caps make them bubbles. What is not in the family is named by `missing()` and skipped.
- **`troop`** `{as | arm, x, y, r, f, rot}`: a troop is its real spectrum (the gacha's harmonics) drawn as a `wave` scaled to radius `r`. `as` names a spectrum registered with `cast(name, arm)`: the syllable says *which* troop, the registry holds the numbers (same idea as `keep`).
- **`meter`** `{x, y, w, v, max, f}`: life, armor or speed as a row of dots, filled in proportion. Life is never a hidden number.
- **`odds`** `{x, y, w, chances, bands}`: honest luck. 100 dots, one per 1 % (largest remainder), plus a legend with the exact figures.
- **`clash`** `{a, b, n, amp, k, ph}`: where two waves meet, `n` lines and a row of dots ripple between them.
- **Pulse op `morph`**: `{o: 'troop', from: 'egg', as: 'unico'}` mixes the two spectra with `AtlasGacha.mezcla` by `p`: the egg becomes the wave as you read. Without `p` (reduced motion) the wave is shown as it is. `fill` and `drain` scale a meter's `v` by `p`.

The Codex (`codex_scene.js`) is the game's basic structure told in this language: PRECEPTOR, REFUGE, SUMMON, ARMY, BATTLE, RIFT, built from real draws of four fixed seeds at `tc3` and the game's own `odds('tc3')`.

## 7 · Reading it (AI fluency)

A reader that cannot see answers four questions from the frame alone: *which section?* (`id`, `t`), *what changed?* (`change`), *what sounds?* (`sound`, `soundCause`), *what can I do here?* (the words whose `r` names a door or a button). The frame is the lesson: a small model that reads it well reads the house.

## 8 · API

**What it reuses.** The colour vocabulary is not new: band names resolve to `comic_tokens.js` (W1: `ink`, `paper`, `ocean`, `cyan`), to `comic_accents.js` (the two signed accents) and to `tabla_semantica.js` (the seal bands). The wave is the house formula, `AtlasGacha.punto` in `gacha.js`. The language adds geometry and light, never a colour.


`AtlasBubble = { compile(frame) → items, define(name, fn), words(), hash32(s), rng(key), wavePoints(h, n), smoothPath(pts, closed) }`. The items are the painter list of `public/game/comic_atoms.js` (`rect`, `circle`, `ellipse`, `path`, `text`, `group`), with literal colours resolved from the band names by `comic_tokens.js`, `comic_accents.js` and `tabla_semantica.js`.
