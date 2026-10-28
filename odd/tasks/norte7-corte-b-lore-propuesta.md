# norte7-corte-b-lore-propuesta

Date: 2026-10-28
Law: Norte 7 decree (2026-10-28) · commission «the one map», slice B · PROPOSE-ONLY: no code in this document, no file under `public/` changed

## Objective
The lore routes (the key, the beacon, the first fight, waking Atlantis) and the four seeds the Sovereign named run ON the isometric map of `/openworld/`. No parallel world, no old-map graphics survive any of them.

## Problem and why
Today the lore lives in `/play/` (the old tutorial, scheduled for deletion in slice D) and in the bubble pages `/face/atlantis.html` and `/face/zombie.html`. A new feature built next to them would be a second map. The decree names one.

## Scope
Four seeds, each with the file that already states it, the mechanic on the isometric map, and the conflict with the cut. The decisions at the end are the Sovereign's.

## Constraints
- Local-first, no server: the canon says «sin servidor» and «cero peticiones externas al cargar». Any multiplayer seed travels as signed envelopes (`atlas.sobre/1`), not as requests.
- Account-less play is a legal state: without an account the player is a crab of the sea (`docs/canon-house.md:222`), and without an account there is no owner for an island (`docs/mesa/PARA_LA_MESA.md:470`).
- No value-signing key enters this node (CLAUDE.md, «Jamás firmas valor»). A double signature on duels must use identity keys that the canon allows here; which keys those are is a decision (D4).
- Law of frames: under 1,024 bytes, one phrase per atom, sound declared from the frame's own data, reduced motion honored. ≤16,384 B per file. No `Math.random`, no `Date.now` in the seed path.

## Checklist (propose-only)
- [x] B0 · seeds located in the corpus, with file and line (table below).
- [x] B1 · the conflicts with the cut are named (`public/game/aiact-art50-state-radio.js` is in the slice-D delete set; the lema lives in the lexicon being cut).
- [ ] B2 · the Sovereign's decisions D1–D5 (below).
- [ ] B3 · code: NOT started. It waits for B2 and for slice D's manifest decision (the 36 unreferenced files).

## Verification evidence
Corpus sources (measured with `git grep`, branch `main` at `1a3f890`):

| # | Seed (Sovereign) | Where the corpus states it | What it gives |
|---|---|---|---|
| S1 | NPC buildings revealed by fog through account-less activity | `atlas/RECIBO_T_TUTORIAL_20261019.md:4` (F0 double door: `directo` → F3, `niebla` → F1; F1 pulse → fog clears); `docs/canon-house.md:222` (no account = crab of the sea); `docs/mesa/PARA_LA_MESA.md:470` (no account, no owner) | fog as the only reveal mechanic; NPC sites exist with no owner |
| S2 | Radio «Say Hi» handshake | `public/game/aiact-art50-state-radio.js:83` (button `Say Hi`); `atlas/radio_phase1_cases.mjs:36` (the case); `atlas/PLAN_THEGAME_ESTRUCTURA.md:49` (manual signalling by QR, NO_DATA until signed) | the handshake is the first sobre exchanged between two devices |
| S3 | Bubble route as Atlantis lore | `docs/one-map-history.md` §1 (`/face/atlantis.html`, `/face/zombie.html` are bubble pages); `docs/norte-7-corte-propuesta.md` §4 (`/face/atlantis.html` → Atlantis terrain inside `/openworld/`) | Atlantis is a region of the isometric map, reached by the route |
| S4 | Serverless duels: committed seed revealed, double signature | `atlas/PLAN_THEGAME_ESTRUCTURA.md:40-42` (envelopes, `seq`: two envelopes with the same `seq` and different body are a fraud proof); `:53` (asynchronous combat without server); `:74` (map seed = `sha256` of the node key) | commit–reveal of the seed, both sides sign, no server to arbitrate |

## Conflicts with the cut (must be solved in the propose, not in the delete)
1. **The lema «The Sunken Forest. Atlantis did not sink: it fell asleep. You wake it.»** lives in `public/atlas-en.json` `ui.lema`, the lexicon that slice D deletes. The line is the lore's own voice, so it must be re-homed to the isometric route's copy before the delete, or it is lost.
2. **The radio `Say Hi`** is in `public/game/aiact-art50-state-radio.js`, which is in the delete set (exclusive to theGame). S2 is therefore a rebuild on the sobre, not a move.
3. **The bubble pages** `/face/atlantis.html` and `/face/zombie.html` are in the `/face/` family, which the decree keeps as redirects into `/openworld/`. Their content is not a map; it is text and art in bubble language. Whether that art survives is decision D2.
4. **Reference photo** (·6470459304): NO_DATA, not in the rack. The side-by-side captures of slice B wait for it; they do not block the proposal.

## Standing signature
Searched the corpus: the decree 2026-10-28 names the four seeds and the single-map rule (`docs/norte-7-corte-propuesta.md` §4, §5). The Sovereign's ideas corpus was not located on this checkout (NO_DATA); the seeds above are the commission's wording, matched to the files that state them. Nothing in this proposal is a signature.

## Methodology relief
None.

## Log
- 2026-10-28 · S1–S4 checked against the corpus; S1's fog mechanic is the tutorial's F0/F1 already on `main`, not a new one.
- 2026-10-28 · The radio `Say Hi` is in a file the delete set removes: recorded as conflict 2, not as a move.

## Decisions needed (Sovereign)
- **D1 · Lema.** Where the line «The Sunken Forest…» goes: the entry screen of `/openworld/`, the Atlantis region, or the route's first step.
- **D2 · Bubble art of Atlantis and zombie.** Keep the bubble art as a region's content, or retire it with the pages (the decree says the pages redirect).
- **D3 · NPC buildings.** Shared (one world for everyone, revealed once) or per device (each fog is its own)? The first makes the duels of S4 meaningful; the second matches «account-less».
- **D4 · Double signature.** Which keys sign a duel. Identity keys only (auth, not value), stated in the canon: confirm the canon allows them on this node.
- **D5 · Order.** S2 (handshake) before S4 (duels), since S4's double signature needs the envelope S2 creates?

## Next step
Propose-only until D1–D5. The first piece once decided: the handshake sobre (S2) as a case file under `atlas/`, with its gate, before any render.
