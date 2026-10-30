# visual-orders-inventory

Date: 2026-10-31
Law: buzon#30 decree ·6523148687 (ALL IN: keep the rails; the web is the main charge; the apps may now be touched; inventory every visual order, newest first; every visual is a bubble frame under 1,024 bytes with its own sentence and a declared sound; terminal parity between beelink and doggee). It also folds decrees ·6523047400, ·6522713617, ·6522236505, ·6522287730, ·6522243791, ·6522187525, ·6521940119, ·6521381629, ·6521324145.

## Objective

One list of every visual order the Sovereign has given, from newest to oldest, with its status and the piece that carries it. Conflicts between orders are settled by the newer one. No order is built from this document alone; each row points to the piece that builds it.

## Problem and why

Orders for the visual layer are spread over buzon#30 comments, ODD documents and sessions. Without one list, an older order can be built after a newer one reverses it, or an order can be lost. This document is that list.

## Scope

In scope: visual orders found in buzon#30 (search over visual keywords, 60 hits, read in full for the decrees that set the law) and in `odd/tasks/`.

Out of scope: orders for the local AI and the orchestrator map (codex lane, ·6523112021 and ·6523147320), the mesh (codex lane), and the lore corpus (codex lane, ·6522950235). They are listed as "other lane" and not built here.

## Constraints

- Newer order wins. Order of work: newest first.
- Each visual is a bubble frame under 1,024 UTF-8 bytes, with one sentence per atom and a declared sound (NO_DATA with cause when there is none).
- Terminal parity: a terminal open on beelink and on doggee shows the same visual.
- Web first. The apps may be modified now; no app change is part of this document.
- Doctrine: status labels LIVE, STALE, STATIC, SIMULATED, NO_DATA, ERROR per datum.
- Legal: no name of the 3D reference and no crew design posterior to 2026-09-16.

## Checklist

Status: DONE (built and merged or measured), BUILT (built, awaiting FIRMO), PENDING (ordered, not built), OTHER (other lane), NO_DATA (cannot be measured here, cause given).

- [x] V01 · ·6523148687 · ALL IN decree: the rails stay; inventory folded here; web first. Status: DONE (this document).
- [ ] V02 · ·6523148687 · terminal parity between beelink and doggee. Status: PENDING. Cause: the apps are not yet measured here; the web terminal exists (basic, atlantis, zombie pages).
- [ ] V03 · ·6523148687 · every visual a bubble frame under 1,024 bytes with sentence and sound. Status: PARTIAL. Frames of IC4, IC5, IC6, IC7-S3 and IC7-S4 are checked by their gates; the web terminal pages and the apps are not measured here (NO_DATA with cause).
- [ ] V04 · ·6523047400 · colour anchor: on entering a node, the page adopts its colours. Status: PENDING. Folds into IC7-S5 (D8).
- [ ] V05 · ·6523047400 · permanent joystick to move the user's ephemeral character. Status: PENDING. Folds into IC7-S10 (D9), after S6.
- [ ] V06 · ·6523047400 · Android: the chat sits below the map window. Status: PENDING. Folds into IC7-S11 (D10).
- [ ] V07 · ·6522713617 · measure the mathematical deployment on web, app beelink and app doggee; frames under 1 KB, size, sentence and seal, or NO_DATA with cause. Status: PARTIAL. Web frames: measured inside each piece's gate. App surfaces: NO_DATA (not measured here).
- [ ] V08 · ·6522287730 · terminal and heartbeat plan, measured before code. Status: PENDING for the terminal. Heartbeat: NO_DATA (decision D7: the page reads only `estado.json`).
- [ ] V09 · ·6522236505 · the terminal is the user's: its colour follows the node, and the user can change it in their own app, local-first, with no account and no network. Status: PENDING. Folds into IC7-S5. Web storage is per visitor (IndexedDB) and is NO_DATA as a persistent preference until decided.
- [x] V10 · ·6522243791 · addenda: terminals are the user's, the map is the colony of bots, IC7 composes IC1 to IC5 plus terminals plus liveness. Status: DONE for the colony and bots (IC6, IC7-S2, IC7-S3, IC7-S4). Terminals: see V09.
- [ ] V11 · ·6522187525 · aesthetics as in the tutorial: Doggee zombie, Beelink atlantis, cabin basic. Status: PARTIAL. Doggee zombie built in IC7-S4 (`look`, D11). The Beelink atlantis look is not set in the fixture yet (PENDING, small).
- [x] V12 · ·6521940119 · where the showcase goes: everything on the live web; real nodes shown with their own look; method ODD. Status: DONE (applied to the plan and to IC7).
- [ ] V13 · ·6521381629 and ·6521324145 · drawings of each world on the global map, in the style of the Wave Army. Status: PENDING. The three world pages exist (basic, atlantis, zombie) with their terrain frames; the composition into the door is not built.
- [x] V14 · ·6521787011 · re-anchor: everything by ODD, no new measurement. Status: DONE (applied).
- [x] V15 · ·6520207151 · IC6 merged: the colony lives on /openworld/. Status: DONE.
- [ ] V16 · ·6513536247 and ·6512483624 · T1: all tools inside the Tools button. Status: PENDING. Its queue slot was after IC6, which is now merged; the branch is not yet opened.
- [ ] V17 · ·6513536475 and ·6512256287 · U1: deterministic chat inside the buildings, measured facts only, NO_DATA with cause otherwise. Status: PENDING. The lift-map exists (·6512536751); the browser lexicon projector needs its fix first.
- [ ] V18 · ·6513537985 · lore of the buildings: candidate sources listed; codex found the canon (ideas13oct v2.0.1, nine objects). Status: NO_DATA until the final decree on the canonical source. Doggee and OneXStation are not lore sources.
- [x] V19 · ·6512256324 · lift-readiness audit for D1, J1, U1. Status: DONE (codex, ·6512536248, ·6512536500, ·6512536751).

## Verification evidence

- Search: buzon#30 comments matching `visual|pantalla|dibujo|cara|bot|colon|terminal|joystick|color|chat|herramient|tools|contact sheet|screen|A11Y`, 60 hits, sorted by date (newest first). Full bodies read for ·6523148687, ·6523047400, ·6522713617, ·6522236505, ·6522287730, ·6523112021.
- Built pieces that close rows: IC6 (merged, main `3b93e68`), IC7-S2 (merged, `53c6006`), IC7-S3 (merged, `fbd030e`, live as `abkv`), IC7-S4 (built, `a901618`, awaiting its own FIRMO).
- NO_DATA: app terminals (beelink, doggee) not measured here; heartbeat producer (none in the repo, D7); lore canonical source (decree pending).

## Standing signature

This is a text-only document. Its merge is covered by the standing ODD FIRMO for documents. No code and no seal change. The firm of S4 is separate and not needed here.

## Methodology relief

None. The order rule (newest first, newer wins) is applied as written.

## Log

- 2026-10-31 · Decree ·6523148687 read. Inventory built newest first, status per row, fold per piece.
- 2026-10-31 · Priority rule applied: newest order first. The newest visual order is ·6523148687 (terminal parity, apps), then ·6523047400 (anchor, joystick, Android). T1 (V16) is older and waits behind them.
- 2026-10-31 · Note: the queue placed T1 after IC6; IC6 is merged. The newer decrees take precedence, so T1 does not jump the line.

## Next step

V04 to V09 · the terminal and its colour anchor (IC7-S5, D8 and D9 of the terminal), preceded by the measured plan of the terminal and its parity across beelink and doggee, as ·6522236505 and ·6523148687 require.
