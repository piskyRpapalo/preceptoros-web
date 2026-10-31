# battle-replay-controls

Date: 2026-10-31
Law: Mesa web comission «EU-3 · controles de repetición de la batalla» (2026-10-31): pause, speed ×2 and ×4, the verification of the record must pass at any speed, and the single visit pass (#516) must not break. Plan `usuario-efimero.md` (EU-0) lists the gap (G-c) this closes. Order note: the code was written before this plan; the plan is in the same PR and is declared as such. From here on, plan first.

## Objective

The practice battle's replay can be paused and run at ×1, ×2 or ×4. The pause is visible and says so. Speed only changes how fast the recorded events are shown; the recorded battle does not change.

## Problem and why

The battle in the visit (`visitor_battle_ui.js`) opens the wave scene and runs it at ×1 with no control. The scene already has `velocidad(v)` (it multiplies the event time) and `para()` (it ends the animation for good). It has no pause, so a player cannot stop to read a round.

## Scope

In scope:

1. A pure state module (`battle_replay_controls.js`): playing or paused, and the speed ×1, ×2 or ×4. Any other speed is refused. The rate sent to the scene is 0 while paused.
2. Controls in the battle dialog: Pause or Play, and ×1 ×2 ×4 with the current one pressed. A status line says «PAUSED · ×n» or «PLAYING · ×n».
3. A browser check: the rates the scene receives follow the controls, the record is unchanged by the controls, and the visit goes on after the dialog closes.

Out of scope: any change to `wave_duel_scene.js` (16,200 B of its 16,384 B ceiling; the pause is done through its existing `velocidad`); any change to the battle rules or to `verify`; the chat (its own seal).

## Constraints

- Speed never changes the result. `visitor_battle.verify` recomputes the battle from the seed and does not read the controls.
- A pause is honest: the event time and the round counter stop. The rings keep their idle turn (the scene's own motion, driven by the frame clock, not by the battle); this is declared, not hidden.
- Controls are real buttons, at least 44 px.
- No clock, no random number and no network in the control state.

## Checklist (one piece = one PR)

- [x] EU-3.1 · pure state with cases and sabotage (`atlas/puros/battle_replay_controls_casos.mjs`, 9/9).
- [x] EU-3.2 · controls in the battle dialog (`public/game/visitor_battle_ui.js`), loaded before it in the door.
- [x] EU-3.3 · browser check (`atlas/battle_replay_controls_browser.mjs`): rates `[0,0,0,4,2,0,2]`, record unchanged, visit goes on. Sabotage (rate ignores pause) turns it red.
- [ ] EU-3.4 · seal chain and judges, then the receipt.

## Verification evidence

- Pure cases 9/9. Browser check passes three times in a row. The existing battle check (`visitor_battle_browser.mjs`) and the single visit pass (`usuario_efimero_pasada_browser.mjs`) still pass.
- Sabotage: `rate` ignoring the pause gives rates `[1,2,4,4,2,2,2]` and the check goes red.

## Standing signature

Required: FIRMA of the head before merge. Chat seal (`aw`) is not used here.

## Methodology relief

None.

## Log

- 2026-10-31 · Code written first (controls, browser check); this plan written in the same PR. Declared, not hidden.

## Next step

Seal chain with version `preceptoros-2026-17-ax` (the Mesa's free letter after `av`), then FIRMA.
