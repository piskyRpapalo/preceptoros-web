# Web inventory: measured public surfaces

**Scope:** read-only inventory of `origin/main` at `12930a9` on 2026-10-25. This document is the only proposed change. No file under `public/` was edited; no service worker version was changed.

## Measurement record

- Machine: local Linux worktree; hostname intentionally omitted under SCRUB. Browser: Google Chrome 155.0.8059.39, headless. Date: 2026-10-25 UTC.
- `git ls-files public/`: 265 tracked paths, 30 immediate file entries. The reported count of 43 was not reproduced; the scope behind that earlier count is `NO_DATA`.
- Read-only HEAD sweep: `curl -sS -I --max-time 15` against all 265 paths mapped from `public/`. Result: 250 direct `200`, 15 redirects (`307`), zero other statuses or curl failures.
- Read-only sitemap sweep: `curl -sS -I -L --max-time 12` against each of the 15 `<loc>` URLs in `public/sitemap.xml`. All 15 end at `200`; the four `.html` URLs for creation and world pages first return `307` to extensionless paths.
- All 66 tracked `*.html` files were enumerated. Direct HEAD requests for the 51 outside `public/` returned `404`; they are repository previews, translations, or test fixtures, not apex pages.
- Stage evidence: `git log --follow --diff-filter=A` for each HTML file; GitHub commit-to-PR association lookup where available. A commit is named when the association lookup returned no PR. HTML inbound links below mean literal `<a href>` references between tracked HTML files; dynamically created links are called out separately.
- Combat reproduction: local static server (`python3 -m http.server 8766 --bind 127.0.0.1 --directory public`), fresh temporary browser profile, open `/`, choose “Check the rift,” open the arena, complete seven local practice combats, return to the map. Instrumented canvas `fillText` for literal `undefined` and `moveTo`/`lineTo` for non-finite coordinates; checked the DOM for `undefined`. Observed 2 wins and 5 losses; zero matching text or invalid line coordinates. No identity key was created. This is a local reproduction of the checked-out source, not a claim about every browser or the live browser state.

## Apex route inventory

The Worker in `worker/index.js:1-12` redirects `www` to the apex and sends all other requests to static assets. `wrangler.jsonc:1-6` maps those assets to `public/`. There are no application routes in the Worker. The sitemap currently declares these 15 page URLs:

| Apex path | HEAD result | What it shows | Incoming visible links | Stage / introduction |
|---|---:|---|---|---|
| `/` | 200 | Root landing; JavaScript replaces the initial loading sentence with the dynamic front door, or the game shell after an action. | Brand/home links from the locale roots and world pages; its header links to all locale paths and `/face/`. | Root structure commit `d4f53ca`; front door PR #272; `/face/` header door PR #323. |
| `/ar/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/de/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/el/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path addition `8694fda`; shared front door #272; header door #323. |
| `/en/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Brand link on all landing roots; language switch on all ten roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/es/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/fr/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/it/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/pt/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path structure `d4f53ca`; shared front door #272; header door #323. |
| `/ru/` | 200 | Same English game landing and controls as `/`; `lang="en"`. | Language switch on all ten landing roots. | Locale-path addition `8694fda`; shared front door #272; header door #323. |
| `/creation.html` | 307 → `/creation` (200) | Creation studio: draw a ribbon, load local voice files, sign/download a creation, or verify a creation file. Signing/listening controls start disabled until their inputs exist. | No landing-page door. Linked from the hidden Info → “Tools of this product” area on each of the three world pages. | E4 creation page PR #285; visible signing/download feedback PR #287. |
| `/face/` | 200 | Minimal Worlds index with three links and the statement that a page view does not prove a node is live. | “Worlds” header link on all ten landing roots. | R-VIVO hub PR #319; entry door PR #323. |
| `/face/atlantis.html` | 307 → `/face/atlantis` (200) | Living-map face with child-oriented zones skin, chat, tutorial, Army, Battle, Profile, and Info. | Hub link; links among the three skins in Info; Home and Creation links in Info; tutorial overlay can link to Neutral. | Face template PR #302, tutorial pass #307, R2 #314, Atlantis R3 #315. |
| `/face/basic.html` | 307 → `/face/basic` (200) | Same face/map geometry in the Neutral skin, with chat, tutorial, Army, Battle, Profile, and Info. | Hub link; links among the three skins in Info; Home and Creation links in Info; the tutorial overlay links to this page. | Face template PR #302, tutorial pass #307, R2 #314. |
| `/face/zombie.html` | 307 → `/face/zombie` (200) | Same face/map geometry in terminal skin. The page title still says “Zombie terminal”; the hub calls this choice “the Risen.” | Hub link; links among the three skins in Info; Home and Creation links in Info. | Face template PR #302, tutorial pass #307, R2 #314. |

`public/creation.html` still declares `https://preceptoros.org/creation.html` as its canonical URL, although the Worker redirects that URL to `/creation`. The sitemap continues to list `.html` for creation and the three face pages. The sitemap and static paths are reachable through redirects, but their advertised URL and final URL differ.

The current Worker has no bespoke route table. Any `public/` path is an asset request; paths outside the static tree return the asset layer’s not-found response unless covered by a redirect. For example, `/game/` and `/atlas/` returned `404` in the route spot checks. The complete 265-path result is in the static-path appendix below.

## The three living screens

### 1. Root landing

`public/index.html:35-55` is only the shell: language links, a “Worlds” link, identity slot, and “theGame · loading on this device.” On arrival, `public/assets/eaa-art12-local-first-surface.js:3-12` calls `TheGame.frontDoor()`. `public/assets/thegame.js:197-203` loads `front_door_view.js` and swaps the shell content for the front door.

The locally rendered front door labels itself “THE GAME · ON THIS DEVICE,” then offers four functioning actions: guided tutorial, Check the rift, Create this device’s key, and Questions???. Questions opens a local panel; key creation is a real explicit action and was not invoked during this inventory. The art and large copy are rendered into canvases, with a measured static-art list under “What is drawn.” This is the newest-looking entry surface and is visually distinct from both the old terminal/map and the separate Worlds page.

All ten locale-root HTML files still declare English (`lang="en"`) and show the same English front door. The route selector exposes locale codes, but the served landing bodies are not localized in this checkout. Fully translated repository pages under `traducciones/` are outside `public/` and the apex returned `404` for them.

### 2. Worlds hub

`/face/` is an independent, narrow, card-style page with a light/dark theme, three world links, and a Home link. Its hub labels are Atlantis, the Risen, and Neutral. Those anchors work; measured hub markup contains no buttons and no `EMULADO` text. A browser-rendered `/face/` page also contained no `EMULADO` label. The older emulated preview rule remains in `public/face/face_world.js:74`, and the linked face runtime exposes `NO_DATA` for an empty Army and missing local key. A separate source declaration marks a memory field `EMULADO` and throughput `NO_DATA` (`public/game/nodos-cedulas.js:22-30`); the device label and measured value are omitted under SCRUB. Thus “EMULADO in the hub” is not confirmed in the current hub view; the stale preview semantics live in adjacent runtime/data.

The page title, skin names, and introduction still describe a gallery of three pages, while the root front door is a separate entry system. The face pages claim that they run locally, but a fresh local profile rendered an empty Army and explicit `NO_DATA` states for key/Army-related fields. The live page view is not evidence of a paired or measured node.

### 3. Game map

The map is not a separate sitemap route. From the root front door, “Check the rift” enters the same `/` page’s game shell. In the local Chrome run, the visible map copy read: “Goal · The Sunken Forest. Atlantis did not sink: it fell asleep. You wake it”; “Tap any piece next to your crab…”; and “No key yet: centered on [redacted node]. Create your key to have a home on the map.” The map shows location markers, fog, map controls, terminal panels, and a chat/radio area. Without local identity data, the home/key and Army state remain absent or `NO_DATA`.

The old terminal shell and the front door therefore coexist at one URL. Navigation from the front door replaces it with the game; navigation from the game uses internal panes. The language-root routes do not create separate game experiences in the measured build.

## Combat and map integrity

### Measured rendering path

The combat experience is in the root game bundle, not a dedicated apex route:

1. `public/assets/thegame.js:121-130` loads the arena UI and then moves `.atlas-arena-mapa`, `.mapa-mandos`, and `.mapa-aviso` into the global map pane (`MAPA`).
2. `public/game/ui-arena.js:174-177,219-230` creates the arena-location canvas and mounts it through `AtlasMar.crea`. The arena canvas is therefore part of the global map screen.
3. Selecting an opponent and activating Fight calls `TheGame.ve('batalla')` (`ui-arena.js:83-92`). `juega()` creates the animated combat scene with `AtlasEscena.escena(R.lienzo, ...)` and shows a Battle pane (`ui-arena.js:118-142`). The local reproduction showed a separate in-app Battle sheet with “← Map,” but it is not a separate URL or independent application shell.
4. At combat end, the UI increments the local win/loss record (`ui-arena.js:95-110`). The map reads that record via `f.luchados` (`sea.js:56-57,132-158`) and applies it to marker color/labels and fog exposure. `fog_of_war.js:32-35` adds an explored circle for a fought place; the circle radius is 200 map units.

### Undefined-line reproduction result

Seven combats completed locally on the checkout: two wins and five losses. The test instrumented all canvas `fillText` calls for the literal `undefined`, and `moveTo`/`lineTo` calls for non-finite coordinates; both counters were zero before and after combat. The rendered DOM also contained no `undefined`. No combat-generated undefined line was reproduced, so the reported artifact is `NO_DATA` with cause: the seven-combat local practice run did not produce it.

The relevant fixed line draw is `sea.js:124-129`: for each known place in `f.lugares()`, it computes a projected destination and calls `enlace(g, cen, d.p, ...)`. `enlace()` is defined at `sea.js:88-91`. Combat does not append new `destinos`; it changes the local record and explored fog circles. The record-driven fog data path is `ui-arena.js:101-108` → `sea.js:56-57` → `fog_of_war.js:32-35`. The map’s overlay text path is `sea.js:151-158` (`rotulo` plus occupancy message). In the measured run, no undefined text or non-finite draw arguments came from any of those paths. A source-level draw call that can be blamed for the reported undefined artifact is therefore `NO_DATA`; identifying it would require a reproduction with the same unmeasured state that triggered the report.

This separates two observations: the arena-location canvas is intentionally mounted into the global map, while the actual animated fight is shown in an internal Battle sheet. The current UI is a shared single-page shell, not a separate combat route.

## “One piece” proposal for Sovereign ruling

No implementation is proposed here. A coherent future surface can be split into rulable pieces:

1. **Route and naming canon:** choose one landing, one hub, canonical world names, and the fate of the nine English locale-root duplicates and extensionless aliases. Decide whether Creation has a front-door link. `REQUIRES_FIRMA`.
2. **Visual system:** align the landing, hub, game map, and face pages on one approved typography, color, spacing, and language policy. Preserve explicit `EMULADO`/`NO_DATA` labels where data is preview-only or unmeasured. `REQUIRES_FIRMA`.
3. **Combat screen:** make Battle a distinct screen with its own navigation and lifecycle, separated from map controls and the global-map canvas. Keep the arena encounter map available only if the Sovereign explicitly approves it as a map layer. `REQUIRES_FIRMA`.
4. **Map integrity contract:** combat may update only declared, bounded battle/occupancy records. It must not append free-form or undefined map geometry. Define which state may reveal fog and which map links are fixed; then add a repeat-combat regression measure. `REQUIRES_FIRMA`.
5. **Route and asset retirement:** only after earlier decisions, align sitemap, canonical URLs, redirects, `public/`, and service-worker precache in a separately reviewed piece. No service-worker bump is implied by this inventory. `REQUIRES_FIRMA`.

## HTML inventory outside `public/`

All 51 files below exist in the checkout but each direct apex request returned `404`. “Orphan” means no incoming literal HTML anchor was found; some fixtures are still opened by test harnesses. Stage IDs are first-add commits from `git log --follow`; PR numbers are included where GitHub associated the commit with one.

| HTML file | What it shows | Incoming HTML links | Introduction stage |
|---|---|---|---|
| `atlas/egg_reload_fixture.html` | Isolated egg/reload browser fixture. | Orphan; opened by the egg-reload harness. | G5b, PR #276 (`fed7f94`). |
| `atlas/isometric_floor_prueba.html` | Lab preview of the isometric floor, explicitly marked not published. | Orphan; lab/test use only. | Floor step 1, PR #33 (`9e11465`). |
| `atlas/ojo/fixtures/descenso_ok.html` | Valid descent-render fixture. | Orphan; visual harness only. | Param-gate fixture stage, PR #160 (`df1c682`). |
| `atlas/ojo/fixtures/descenso_sabotaje.html` | Deliberately sabotaged descent fixture. | Orphan; sabotage harness only. | Param-gate fixture stage, PR #160 (`df1c682`). |
| `atlas/ojo/fixtures/oido.html` | Pending audio-measurement fixture. | Orphan; audio harness only. | Audio measurement, PR #209 (`c6ea8bf`). |
| `atlas/ojo/fixtures/palabras.html` | Word-rendering fixture for face/descent/game scenes. | Orphan; word-render harness only. | Word-eye fixture (`c00b73f`); later census PR #208. |
| `atlas/ojo/fixtures/palabras_sabotaje.html` | Word-rendering sabotage fixture. | Orphan; word-render sabotage harness only. | Word-eye fixture (`c00b73f`); later census PR #208. |
| `atlas/ojo/fixtures/viewport_mismatch.html` | Narrow-screen visual-viewport regression fixture. | Orphan; viewport harness only. | Viewport proposal, PR #251 (`f23e45b`). |
| `atlas/vista.html` | Atlas game preview, not in the deployed asset tree. | Orphan. | Atlas tower floor stage, PR #4 (`0be0322`). |
| `docs/fusion-or-oneshot/zoom-evidence/index.html` | Zoom evidence comparing one camera and crab at two zoom values. | Orphan. | NORTE 5 visual evidence, PR #302 (`1811f77`). |
| `docs/rebuild/examples/atlantis.html` | Rebuild example of the face/map with Atlantis skin. | Index and the other two example pages. | Face rebuild examples, PR #302 (`63c8331`); later skin revisions are separate public-face PRs. |
| `docs/rebuild/examples/basic.html` | Rebuild example of the Neutral face/map. | Index and the other two example pages. | Face rebuild examples, PR #302 (`63c8331`). |
| `docs/rebuild/examples/index.html` | Selector for three face proposals. | Orphan; it links out to the three examples. | Face rebuild examples, PR #302 (`63c8331`). |
| `docs/rebuild/examples/tools/face.tpl.html` | Unsubstituted HTML template for a face proposal. | Orphan; build input, not a page. | One-face/three-skins template, PR #302 (`5d4b5f1`). |
| `docs/rebuild/examples/zombie.html` | Rebuild example of the terminal face/map. | Index and the other two example pages. | Face rebuild examples, PR #302 (`63c8331`). |
| `docs/terminal-ejemplo1.html` | Static terminal-layout exhibit, identified in its stage as design rather than a served game page. | Orphan. | Terminal exhibit, PR #142 (`939ab97`). |
| `traducciones/de/benchmark.html` | German benchmark ledger. | Orphan in HTML links. | German package (`56d46fd`); PR association `NO_DATA`. |
| `traducciones/de/community.html` | German community/market page. | `traducciones/de/instalar.html`. | German package (`56d46fd`); PR association `NO_DATA`. |
| `traducciones/de/index.html` | German landing with app/site status counters. | Orphan in HTML links. | Locale route commit `d4f53ca`; PR association `NO_DATA`. |
| `traducciones/de/instalar.html` | German installation guide. | `traducciones/de/onboarding.html`. | German package (`56d46fd`); PR association `NO_DATA`. |
| `traducciones/de/onboarding.html` | German onboarding guide. | Orphan in HTML links. | German package (`56d46fd`); PR association `NO_DATA`. |
| `traducciones/de/playground.html` | German privacy playground. | `traducciones/de/onboarding.html`. | German package (`56d46fd`); PR association `NO_DATA`. |
| `traducciones/de/profile.html` | German local profile page. | Orphan in HTML links. | German package (`56d46fd`); PR association `NO_DATA`. |
| `traducciones/el/benchmark.html` | Greek benchmark ledger. | Orphan in HTML links. | Agora rework (`a97389e`); PR association `NO_DATA`. |
| `traducciones/el/community.html` | Greek community/market page. | `traducciones/el/instalar.html`. | Agora rework (`a97389e`); PR association `NO_DATA`. |
| `traducciones/el/index.html` | Greek landing with app/site status counters. | Orphan in HTML links. | Locale addition (`8694fda`); PR association `NO_DATA`. |
| `traducciones/el/instalar.html` | Greek installation guide. | `traducciones/el/onboarding.html`. | Install-guide stage (`0967f62`); PR association `NO_DATA`. |
| `traducciones/el/onboarding.html` | Greek onboarding guide. | Orphan in HTML links. | Installer stage (`c90b4e7`); PR association `NO_DATA`. |
| `traducciones/el/playground.html` | Greek privacy playground. | `traducciones/el/onboarding.html`. | Privacy-playground stage (`9ac8f65`); PR association `NO_DATA`. |
| `traducciones/el/profile.html` | Greek local profile page. | Orphan in HTML links. | Community/profile stage (`d7e3ff2`); PR association `NO_DATA`. |
| `traducciones/it/benchmark.html` | Italian benchmark ledger. | Orphan in HTML links. | Italian package (`e916313`); PR association `NO_DATA`. |
| `traducciones/it/community.html` | Italian community/market page. | `traducciones/it/instalar.html`. | Italian package (`e916313`); PR association `NO_DATA`. |
| `traducciones/it/index.html` | Italian landing with app/site status counters. | Orphan in HTML links. | Locale route commit (`d4f53ca`); PR association `NO_DATA`. |
| `traducciones/it/instalar.html` | Italian installation guide. | `traducciones/it/onboarding.html`. | Italian package (`e916313`); PR association `NO_DATA`. |
| `traducciones/it/onboarding.html` | Italian onboarding guide. | Orphan in HTML links. | Italian package (`e916313`); PR association `NO_DATA`. |
| `traducciones/it/playground.html` | Italian privacy playground. | `traducciones/it/onboarding.html`. | Italian package (`e916313`); PR association `NO_DATA`. |
| `traducciones/it/profile.html` | Italian local profile page. | Orphan in HTML links. | Italian package (`e916313`); PR association `NO_DATA`. |
| `traducciones/pt/benchmark.html` | Portuguese benchmark ledger. | Orphan in HTML links. | Agora rework (`a97389e`); PR association `NO_DATA`. |
| `traducciones/pt/community.html` | Portuguese community/market page. | `traducciones/pt/instalar.html`. | Agora rework (`a97389e`); PR association `NO_DATA`. |
| `traducciones/pt/index.html` | Portuguese landing with app/site status counters. | Orphan in HTML links. | Locale route commit (`d4f53ca`); PR association `NO_DATA`. |
| `traducciones/pt/instalar.html` | Portuguese installation guide. | `traducciones/pt/onboarding.html`. | Portuguese package (`d22b882`); PR association `NO_DATA`. |
| `traducciones/pt/onboarding.html` | Portuguese onboarding guide. | Orphan in HTML links. | Installer stage (`c90b4e7`); PR association `NO_DATA`. |
| `traducciones/pt/playground.html` | Portuguese privacy playground. | `traducciones/pt/onboarding.html`. | Privacy-playground stage (`9ac8f65`); PR association `NO_DATA`. |
| `traducciones/pt/profile.html` | Portuguese local profile page. | Orphan in HTML links. | Community/profile stage (`d7e3ff2`); PR association `NO_DATA`. |
| `traducciones/ru/benchmark.html` | Russian benchmark ledger. | Orphan in HTML links. | Russian language package (`8694fda`); PR association `NO_DATA`. |
| `traducciones/ru/community.html` | Russian community/market page. | `traducciones/ru/instalar.html`. | Russian language package (`8694fda`); PR association `NO_DATA`. |
| `traducciones/ru/index.html` | Russian landing with app/site status counters. | Orphan in HTML links. | Russian language package (`8694fda`); PR association `NO_DATA`. |
| `traducciones/ru/instalar.html` | Russian installation guide. | `traducciones/ru/onboarding.html`. | Russian language package (`8694fda`); PR association `NO_DATA`. |
| `traducciones/ru/onboarding.html` | Russian onboarding guide. | Orphan in HTML links. | Russian language package (`8694fda`); PR association `NO_DATA`. |
| `traducciones/ru/playground.html` | Russian privacy playground. | `traducciones/ru/onboarding.html`. | Russian language package (`8694fda`); PR association `NO_DATA`. |
| `traducciones/ru/profile.html` | Russian local profile page. | Orphan in HTML links. | Russian language package (`8694fda`); PR association `NO_DATA`. |

The translated file paths are not linked from the apex locale roots: those roots show the English game landing. The translation pages’ few within-folder links do not make them reachable from the public site; all 35 returned `404` in the direct sweep.

## Public static path appendix

Each line is one tracked file under `public/`, expressed as its apex URL path and first HEAD status. `307` paths redirect to the canonical path shown in the table above; all other 250 paths returned `200`. This appendix records asset routes as well as HTML routes; it does not imply that every asset is a navigation screen.

```text
307 /ar/index.html -> /ar/
200 /assets/atlas-arte.js
200 /assets/atlas-carta.js
200 /assets/atlas-coord.js
200 /assets/atlas-dialogo.js
200 /assets/atlas-gesto.js
200 /assets/atlas-guardado.js
200 /assets/atlas-hud.js
200 /assets/atlas-mapa.css
200 /assets/atlas-mapa.js
200 /assets/atlas-motor.js
200 /assets/atlas-obra.js
200 /assets/atlas-ondas.js
200 /assets/atlas-opina.js
200 /assets/atlas-partida.js
200 /assets/atlas-piloto-capa.js
200 /assets/atlas-piloto.js
200 /assets/atlas-piso.js
200 /assets/atlas-voz.js
200 /assets/atlas.css
200 /assets/auth.js
200 /assets/base.css
200 /assets/bout_scene.js
200 /assets/canon.css
200 /assets/codex_scene.js
200 /assets/consiento.css
200 /assets/consiento.js
200 /assets/descent.css
200 /assets/descent_view.js
200 /assets/eaa-art12-local-first-surface.css
200 /assets/eaa-art12-local-first-surface.js
200 /assets/en301_practice.css
200 /assets/en301_tutorial.css
200 /assets/enviar-ar.js
200 /assets/enviar-de.js
200 /assets/enviar-el.js
200 /assets/enviar-en.js
200 /assets/enviar-es.js
200 /assets/enviar-fr.js
200 /assets/enviar-it.js
200 /assets/enviar-pt.js
200 /assets/enviar-ru.js
200 /assets/enviar.js
200 /assets/favicon.svg
200 /assets/front_door.css
200 /assets/front_door_view.js
200 /assets/icon-pwa-192.png
200 /assets/icon-pwa-512-maskable.png
200 /assets/icon-pwa-512.png
200 /assets/page-comment.css
200 /assets/page-comment.js
200 /assets/preceptor-og.png
200 /assets/pwa.js
200 /assets/radio_message_log.js
200 /assets/soberano.css
200 /assets/terminal_menu_shell.css
200 /assets/terminal_menu_shell.js
200 /assets/terminal_window_frame.js
200 /assets/thegame.css
200 /assets/thegame.js
200 /assets/tubo.css
200 /assets/worm_transition.js
200 /atlas-ar.json
200 /atlas-arena-en.json
200 /atlas-casa-en.json
200 /atlas-de.json
200 /atlas-el.json
200 /atlas-en.json
200 /atlas-es.json
200 /atlas-fr.json
200 /atlas-it.json
200 /atlas-mundo.json
200 /atlas-opina-en.json
200 /atlas-pt.json
200 /atlas-record.json
200 /atlas-ru.json
200 /cerebros.json
200 /counters.json
307 /creation.html -> /creation
307 /de/index.html -> /de/
200 /dictionary-en.json
200 /dictionary.json
200 /downloads/README.md
200 /downloads/entorno-estudio-v1.tar.gz
200 /downloads/entorno-estudio-v1.tar.gz.sha256
200 /downloads/preceptor-charla-base-v1.gguf.sha256
200 /downloads/preceptor-charla-base-v2.gguf.sha256
200 /downloads/preceptor-charla-multi-v1.gguf.sha256
200 /downloads/preceptor-tribune-en-v1.gguf.sha256
200 /downloads/preceptor-tribune-multi-v1.gguf.sha256
307 /el/index.html -> /el/
307 /en/index.html -> /en/
307 /es/index.html -> /es/
307 /face/atlantis.html -> /face/atlantis
307 /face/basic.html -> /face/basic
200 /face/face.css
200 /face/face.js
200 /face/face_army.js
200 /face/face_battle.js
200 /face/face_canon.css
200 /face/face_eggs.js
200 /face/face_fight.js
200 /face/face_hero.js
200 /face/face_hud.js
200 /face/face_paint.js
200 /face/face_panel.js
200 /face/face_tutorial.js
200 /face/face_views.css
200 /face/face_workshop.js
200 /face/face_world.js
200 /face/face_world_terrain.js
307 /face/index.html -> /face/
307 /face/zombie.html -> /face/zombie
307 /fr/index.html -> /fr/
200 /game/aiact-art50-crab-terminal.js
200 /game/aiact-art50-state-radio.js
200 /game/arena.js
200 /game/army-wave-panel.js
200 /game/audio_feedback_manager.js
200 /game/battle_choreography.js
200 /game/battle_replay.js
200 /game/bubble_bestiary.js
200 /game/bubble_editor.js
200 /game/bubble_game.js
200 /game/bubble_icons.js
200 /game/bubble_language.js
200 /game/bubble_letters.js
200 /game/bubble_light.js
200 /game/bubble_paint.js
200 /game/bubble_world.js
200 /game/buildings_toon.js
200 /game/cable_llamar.js
200 /game/cable_terminal.js
200 /game/canon.js
200 /game/casa-lateral.js
200 /game/casa-medidas.js
200 /game/casa-personaliza.js
200 /game/combate_ticks.js
200 /game/comic_accents.js
200 /game/comic_atoms.js
200 /game/comic_tokens.js
200 /game/core.js
200 /game/crab_free_move.js
200 /game/crab_render_hd.js
200 /game/crab_state_screen.js
200 /game/creation_feedback.js
200 /game/creation_flow.js
200 /game/creation_package.js
200 /game/cria.js
200 /game/cuenta.js
200 /game/db.js
200 /game/deep_links.js
200 /game/deploy_building.js
200 /game/descent_sound.js
200 /game/duelo.js
200 /game/en301_practice_arena.js
200 /game/en301_practice_model.js
200 /game/en301_tutorial.js
200 /game/en301_tutorial_audio.js
200 /game/en301_tutorial_building.js
200 /game/en301_tutorial_copy.js
200 /game/en301_tutorial_model.js
200 /game/escena.js
200 /game/escuadron.js
200 /game/estrella_captura.js
200 /game/etiqueta.js
200 /game/fog_of_war.js
200 /game/front_door.js
200 /game/gacha.js
200 /game/gdpr-art25-ephemeral-crab.js
200 /game/gdpr-art7-entry-choice.js
200 /game/genesis_tutorial.js
200 /game/genoma.js
200 /game/hexelion_bench.js
200 /game/hexelion_dictionary.js
200 /game/hitl_firma.js
200 /game/home.css
200 /game/home_buildings.js
200 /game/isometric_floor_projection.js
200 /game/juez.js
200 /game/killswitch_dot.js
200 /game/latency_crystal.js
200 /game/launch_gate.js
200 /game/lexical_projector.js
200 /game/local_app_bridge.js
200 /game/map_bubble_figures.js
200 /game/map_nodes_layer.js
200 /game/map_pointer_input.js
200 /game/map_zoom.js
200 /game/mercado.js
200 /game/narragrafo.js
200 /game/node_bindings.js
200 /game/node_bindings_messages.js
200 /game/node_file_receiver.js
200 /game/node_preview.js
200 /game/node_projection.js
200 /game/node_reception_contract.js
200 /game/node_signature_messages.js
200 /game/node_signature_verify.js
200 /game/node_trust_anchor.js
200 /game/node_trust_manifest.js
200 /game/nodos-cedulas.js
200 /game/nodos-pesos.js
200 /game/nodos.js
200 /game/npc_occupancy.js
200 /game/npc_territory_map.js
200 /game/npc_walls.js
200 /game/onda_profunda.js
200 /game/piece_inspector.js
200 /game/place_reading.js
200 /game/primer_eco.js
200 /game/rating.js
200 /game/reef_building_lifecycle.js
200 /game/reef_buildings_layer.js
200 /game/reef_buildings_paint.js
200 /game/reef_corals.js
200 /game/reef_place_cards.js
200 /game/sea-anchors.js
200 /game/sea-crabs.js
200 /game/sea-floor.js
200 /game/sea.js
200 /game/sea_rift.js
200 /game/semiotic_glyph.js
200 /game/shell_schematics.js
200 /game/silueta.js
200 /game/sobres.js
200 /game/state_vector.js
200 /game/summon-access.js
200 /game/summon-wave-card.js
200 /game/summon_reveal.js
200 /game/tabla_semantica.js
200 /game/taller.js
200 /game/tarjeta_cantada.js
200 /game/tutorial-fases.css
200 /game/tutorial_fases.js
200 /game/ui-arena-comun.js
200 /game/ui-arena.js
200 /game/ui-duelo.js
200 /game/ui-ficha.js
200 /game/ui-invoca.js
200 /game/ui-nodos.js
200 /game/ui-rack.js
200 /game/ui-taller.js
200 /game/ui-tutorial-fases.js
200 /game/ui.js
200 /game/valores.js
200 /game/vector_contract.js
200 /game/wave_render.js
200 /game/world_camera.js
200 /game/world_creator.js
200 /game/z_cutoff.js
307 /index.html -> /
307 /it/index.html -> /it/
200 /lexical_state_schema.json
200 /llms.txt
200 /manifest.webmanifest
200 /mcp-manifest.json
200 /nexo-v1.json
307 /pt/index.html -> /pt/
200 /release.json
200 /robots.txt
307 /ru/index.html -> /ru/
200 /sitemap.xml
200 /sw-listas.js
200 /sw.js
```
