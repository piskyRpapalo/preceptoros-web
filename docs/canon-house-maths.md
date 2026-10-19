# Canon · House maths: how every preceptor uses it (2026-10-19)

The house maths is the AI-fluency idiom of `docs/MVP.md` §1 made into judges:
**every value wears a seal · every ceiling is a number with a judge · every state fits the channel (< 1,024 B)**.
This page says how to USE the pieces that enforce it. Each one has a judge in CI; run it before you push.

## 1 · Language cards (VT8) — `atlas/ficha_lenguaje.mjs`

The card is the maths of a piece without its skin. Two pieces with different skins and the same card are the same measurable object.

```js
import * as F from './atlas/ficha_lenguaje.mjs';
const dic = JSON.parse(readFileSync('public/dictionary.json'));
const a = F.ficha('VT3', dic, { mundo: 'atlantis-rift', sello: 'MEDIDO' });   // 308-320 B
F.valida(a, dic);            // null, or a cause: forma: | vara: | techo: | piel: | sello: | vocablo: | correspondencia:
F.quitaPiel(skinned);        // drops visual_skin, silhouette_hex, lore… keeps the maths
F.compara(a, b);             // two worlds, same piece → IGUAL | DISTINTA | NO_DATA (with the missing world's cause)
```

Rules: the measures come from `public/dictionary.json`, never typed by hand · a world that has not served its datum is `NO_DATA` with cause and its value is never copied · schema: `data/atlas_ficha_schema.json`. Judge: `node atlas/ficha_casos.mjs` (1 valid + 6 violations).

## 2 · Maths census — `atlas/matematica_casos.mjs` + `atlas/matematica_censo.json`

Walks every served graphic piece (`public/game`, `public/assets`) and the nine `atlas-<lang>.json` texts: M1 piece ceiling · M2 a CI judge names it · M3 canonical seals only · M4 no banned word · M5 cards valid · M6 send texts with the same keys in 9 languages · M7 ledger.

**When it goes red on your change:** add a judge (preferred), or declare the exception in the ledger **with its cause**. A ledger entry that no longer matches the tree is also red: remove it in the same commit that fixes it. A line that *is* the ban list (a deny regex) goes in `vocablo_ley`, not as a pending item.

## 3 · Sweep of old graphics (VT9) — `atlas/barrido_casos.mjs` + `atlas/barrido_vocabulario.json`

Every visual speaks the house vocabulary: the bands of `comic_tokens.js`, `comic_accents.js` and `tabla_semantica.js`. A raw colour (`#hex`, `rgb()`, `hsl()`) anywhere else is a legacy graphic. Measured 2026-10-19: **39 pieces, 317 raw colours**. The count per piece **only goes down**:

- a new piece with a raw colour → red · a piece that gains one → red;
- you swept a piece → **lower its number in the ledger in the same commit** (or the judge says the ledger is stale).
- A sweep lot lists in its receipt each piece retired or rewritten and what replaced it. Protected images (PWA icons, OG) stay out (D4).

## 4 · The world creator and its echoes (VT7 + VT9) — `public/game/world_creator.js`

`AtlasWorldCreator.ask(q)` answers only from the local lore (22 passages: `study/09-lore.md@876a713` + "the world creator", DECLARADO). Each event: `{v, seal, origin, cause, passage, text, sound}`, < 1,024 B, never carries the question; `MEDIDO` = quoted from the measured corpus, `NO_DATA` = cause. The frontier keeps paths, addresses and links on the device.
`echo(e)` / `echoes()` / `onEcho(f)`: the same event appears in the radio **Echoes** channel (`radio_message_log.js`): one state, two registers, same seal. RAM only, 20 at most. Judges: `node questions/ventana_casos.mjs`, `node atlas/ecos_casos.mjs`.

To grow the lore: add a passage with `source` and `seal`; it must not match the ban list and its answer must stay under the channel ceiling (the judge fails closed otherwise). Other languages answer `NO_DATA` with cause until their corpus exists.

## 5 · Lessons that must not be lost

- **A judge CI does not run is decoration.** On 2026-10-19, 13 cases in `atlas/` ran nowhere; one (`phase_T3_cases`) had gone red unseen. Every new judge enters `gate.yml` in the same commit.
- **A ban without a judge on what the visitor SEES is a belief.** The rarity label "Magic" was shown in nine languages; the census reads the served texts, not only the code.
- **Measure the channel before choosing a longer word.** The Codex BATTLE syllable went from 1,022 to 1,029 B with "Uncommon"; the channel judge caught it.
- **The channel ceiling is for packets and state; UI text files obey the piece ceiling.**
- **Precache routes must not contain `chat`** (`arnes_sw.mjs`: the old hub is banned from the shell); the chat module is `world_creator.js` for that reason.
- **Seal in fixed-point order** (`node arnes_sw.mjs` → `contadores.py` → `sellar.py --version` → `atlas/mundo.py` → `arnes_piloto.mjs` → `contadores.py` → `sellar.py --version`). Two lots sealed from the same main ask the same letter: whoever merges last re-seals. A simulated hash differs from the real one only by the clocks in `counters.json` and `atlas-mundo.json`; check that before trusting it.
- **Read the handoff against `gh pr list --state merged`.** A plan or handoff ages; the remote does not.
