# frame-seal-contract

Date: 2026-10-31
Law: buzon#30 ·6523552961 (the Sovereign: «FIRMO TODO. PUSHEA.»; item 2: the optional top-level `seal` field of the frame, with the amendment of `docs/bubble-language.md`, is authorised as its own piece with a contract FIRMO). It answers the second hole of ·6523297468: no frame carried a seal, and the spec has no field for it.

## Objective

Every bubble frame may carry a top-level `seal`, one of the six doctrine labels (LIVE, STALE, STATIC, SIMULATED, NO_DATA, ERROR). A reader then knows the seal from the frame alone, not only from its sentence. Colony frames (bots and buildings) carry the seal of their node.

## Problem and why

The frame's reader fields are `atoms`, `bands`, `change`, `sound`, `soundCause`, `text` (`r`), `state` (`t`, `id`). None says the seal of the data shown. Until now the seal lived only in the sentence `r`, which a machine reader must parse. A seal field makes the doctrine readable without parsing.

## Scope

In scope:
1. Amendment of `docs/bubble-language.md`: one row for `seal`, optional, with its six values, and the rule that an absent `seal` means the frame declares none (the reader reads NO_DATA).
2. `atlas/param_gate.mjs` `checkFrame`: a present `seal` must be one of the six strings; anything else is a cause of refusal.
3. Colony frames: `public/game/colonia_edificios.js` (building) and `public/game/colonia_pagina.js` (bot) set top-level `seal` from the node's seal, or `NO_DATA`. Source copies under `atlas/puros/` stay identical (parity test).
4. Gates for the contract and the colony.

Out of scope: a seal on terrain and sky frames (no node data; they keep the absent field, declared); a seal drawn on screen (the sentence already says it); any change to the painter.

## Constraints

- Frames stay under 1,024 UTF-8 bytes; the field adds about 20 bytes.
- No `#` or colour literals; the seal is a word, not a colour.
- Same pixels: the door's bitmap does not change with the field (it is not drawn). Checked by the visual gate.
- Parity: served copy equals its `atlas/puros/` source.

## Checklist

- [x] SEAL-1 · amendment of `docs/bubble-language.md` (the optional `seal` row and its rule).
- [x] SEAL-2 · `checkFrame` refuses a `seal` outside the six doctrine labels; an absent `seal` is accepted.
- [x] SEAL-3 · colony frames carry top-level `seal` (bot and building).
- [x] SEAL-4 · gates: contract cases (accept, refuse, absent), colony frame carries the node's seal or NO_DATA, parity, visual gate unchanged.
- [x] SEAL-5 · VERSION bump and seal chain in the same commit; contact sheet of the door with the fixture.

## Verification evidence

- SEAL-1: `docs/bubble-language.md` table row for `seal` (optional, six labels, absent = NO_DATA).
- SEAL-2: `atlas/param_gate.mjs` `SELLOS` and the check in `checkFrame`; `atlas/frame_seal_casos.mjs` 10 cases (six labels pass, absent passes, `PROBABLE`/`#17131f`/`live` refused).
- SEAL-3: `atlas/puros/colonia_edificios.js` (`seal: seal || 'NO_DATA'`) and `public/game/colonia_pagina.js` (`seal: node.seal || 'NO_DATA'`); served copy identical (`cmp`).
- SEAL-4: colony frames pass `checkFrame`; seal equals the node's; no seal gives NO_DATA. Gates: frame_seal 12/12 twice; colonia_pagina_gate 10 passes; IC4 and IC5 gates green; param_gate CLI ok.
- SEAL-5: VERSION abkx -> aby, huella f14efc93b36909f6; test_web OK; test_atlas OK; arnes 24/24; version_sw_gate green; lexicon VERDE; SCRUB 0. Contact sheet: `atlas/frame-seal-sheet.png`. The door's look does not change (the seal is not painted).

## Standing signature

Needed: FIRMO of contract (the Sovereign's «FIRMO TODO» of ·6523552961 covers the amendment as its own piece). Search done: `docs/bubble-language.md` (frame table, lines 25–31), `atlas/param_gate.mjs` (`checkFrame`, the six reader fields), buzon#30 ·6523297468 and ·6523552961.

## Methodology relief

None.

## Log

- 2026-10-31 · Route declared before cooking (SEAL-1 to SEAL-5).

- 2026-10-31 · Stacked on `haiku/ic7-frases-sello-20261031` (6fbdaf9): the holes branch is not yet merged, and the seal piece needs the sentence parameter it adds.

## Next step

V04 to V09 (terminal and colour anchor, IC7-S5), after this piece is merged.
