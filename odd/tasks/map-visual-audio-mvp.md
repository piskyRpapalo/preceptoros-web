# map-visual-audio-mvp

Date: 2026-10-31
Law: the Mesa's approval of this proposal (buzon#30, 2026-10-30: «APRUEBO TU PROPUESTA: declara el PLANO declare-only ... Propose-only: nada se cocina antes de plano + FIRMO»); decree ·6524501049 (the whole truth reaches the single map); decree ·6524386655 and addendo ·6524440790 (one map, the web is the only reality, the app only connects); ideas13oct sections 2 (the map is the node; each cell shows its rules before entering; the grid runs locally with the rack off), 16 (chat sonoro: the state lives in the chat as text; voice out is local TTS, NO_DATA without a local voice), 18 (the contract: frames under 1 KB with colour, coordinates, sound and time), 20 (audio mode: eyes-free; the voice input is an honest declared risk).

## Objective

The single map at preceptoros.org shows and speaks its state: a visual MVP (the colony, the panel that frames it, the rules of each cell) and an audio MVP (sound per frame, the state as spoken text, the chat as the log). Everything comes from the state the system declares, with its seal and its time. Nothing is invented.

## Problem and why

- The map draws the colony (IC6 to IC7) but its panel has no declared frame: the `#map` section is a flexible box that scrolls on a phone and is a fixed row on desktop. The examples commit `5174cd4` asked for one fixed window without scroll. No decision is recorded.
- The sound today is one button ("Listen to the cabin") that plays the cabin's waves. The rest of the frames declare `sound: NO_DATA`. The state is not spoken.
- The chat is a log with a "not live" line. Section 16 says the chat is the complete state log, readable by a screen reader and by a local voice.

## Scope

In scope:

1. **Panel mask**: one decided frame for the map window (fixed, or scrolling below a stated width), with the cell rules visible before entering a cell (section 2).
2. **Sound per frame**: each frame declares its sound (`ok` with waves, or `NO_DATA` with cause). The frame law already requires it.
3. **State as text**: each visible change is one sentence in the chat log (the frase list, IC7-S3 to S5, already in main), with its seal and its time.
4. **Local voice**: speech of the log through the device's own TTS. No network. Without a local voice the page says NO_DATA with cause.
5. **Gates and captures**: a pure contract for the mask and the voice; a visual gate in two identical runs; captures on doggee against production before and after deploy.

Out of scope: voice input (the microphone). It is a declared risk (section 20), needs its own FIRMO, and it is not built here. Any change to `estado.json` (the producer is its own piece). The apps (Codex's lane).

## Decisions to take (open, with the Sovereign's call)

- **MV-D1 · the mask**: fixed window with no scroll on every width (the examples' instruction), or fixed on desktop and scrolling only below 360 px (the terminal piece, merged in #423). Recommendation: keep the scroll below 360 px and say so on the page.
- **MV-D2 · the voice**: speech on request only (a button), never on load; the reader chooses the frame. Recommendation: on request.
- **MV-D3 · the sound of the cabin**: keep the cabin's waves as the base sound of the tutorial, as today.

## Checklist (one piece = one PR, FIRMO per piece)

- [ ] MV-1 · the decided mask, as a pure contract (widths, scroll rule) and its CSS class; gate: width matrix at 360, 412, 900 and 1200 px.
- [ ] MV-2 · sound per frame in the colony frames: `ok` only when the frame carries waves; `NO_DATA` with cause otherwise. Gate: sabotage (a frame that claims a sound with no waves is refused).
- [ ] MV-3 · the chat as the state log: one sentence per visible change, seal and time in the sentence, refreshed each tick. Gate: n=2 identical runs.
- [ ] MV-4 · local voice on request through the device TTS; NO_DATA with cause when no voice exists. Gate: the page makes no network request while speaking (measured in the browser).
- [ ] MV-5 · captures on doggee against `preceptoros.org`: before deploy (declared as draft) and after deploy (definitive), on the same seal.

## Constraints

- Frames under 1,024 UTF-8 bytes, one sentence per atom, a declared sound (`NO_DATA` with cause when none), a time (`t`) and coordinates where they exist (section 18).
- No network on load; no random numbers, no clock in the render path.
- Accessibility: buttons at least 44 px, keyboard reaches everything, colour plus text (ideas13oct sec. 16 and 20).
- The door stays under 16 KiB; the logic lives in `public/game/` modules.
- Lexicon: English in public text.

## Verification evidence

Measured in main (`256f1a4`): the map panel is `#map` with `overflow` set by the terminal piece; the sound module is `bubble_sonify.js` and its use in the door's "Listen" button; the frase list is rendered per tick (IC7-S3 to S5). Not measured here: the device voices on doggee (NO_DATA until the capture runs).

## Standing signature

Required: FIRMO of this plan, then FIRMO per piece. The mask decision (MV-D1) and the voice policy (MV-D2) need the Sovereign's call before MV-1 and MV-4. Search done: `odd/tasks/examples-to-live-map.md`, `odd/tasks/game-pieces.md`, ideas13oct secs. 2, 16, 18 and 20, the door and its sound code on main.

## Methodology relief

None.

## Log

- 2026-10-31 · Plan declared (declare-only). No code written.

## Next step

The Sovereign's call on MV-D1 and MV-D2, then FIRMO of the plan, then MV-1.
