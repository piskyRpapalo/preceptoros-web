# WEB · OpenWorld on a phone: no stacked cards, no consent withdrawn by a stray tap · seal kc

**State: PROPOSED · HITL.** HEAD of origin: `ae3d17e4` (WEB #946, prod `kb`).

Measured (S110 at 360 px on prod `ka`/`kb`, 2026-11-21; Chromium 320–780 px on `main`, 2026-11-22):
- with Visitors open, only 20–30 % of the map stayed tappable at 320–420 px; Share/Players/Nodes covered the
  preceptor's line («Copper 0, ligh…») and the beacon bar (both pinned to the stage foot);
- the consent `label` spans the whole sentence (≥ 44 px tall) and stayed tappable while shared, so a tap meant
  for the map withdrew the visit (`consent_revoked`); `#online-panels label{display:flex}` also defeated `[hidden]`.

Change (no new component, no new renderer):
- `shared_crabs.js`: while shared, the consent row is hidden; «Disconnect my visit» withdraws (one tap, said aloud).
- `openworld_online.css`: the beacon bar sits above Share/Players/Nodes; with Visitors/Nodes open, the beacon bar and
  a docked preceptor note step aside; `label[hidden]` really hides.
- `preceptor_talk.js`: a docked note stops above whatever holds the stage foot (beacon bar or online buttons).
- `panel_x.js`: Visitors/Nodes join «one panel at a time» and «a tap on the map closes the open panel, nothing else».
- `atlas/crab_presence_authority.mjs`: opt-in `genesis: true` answers /open like production (test tool only).

Test: `atlas/openworld_overlap_browser.mjs` (in gate.yml) — 320/360/390/420/780: no overlapping cards, online controls
≥ 44 px, Tab order Share → Players → Nodes, `role=status` + `aria-live`, seal = Acho frame seal, Welcome/Help/Listen
present, LIVE survives 69–177 stray taps over the panel and a map tap (which only closes it), withdrawal said.
Sabotage `consentimiento` and `pie` → red. A tap within 24 px of a control is excluded: Chrome's touch adjustment
snaps it onto the control, on phones too — that is the control's own action, not a stray.

Not measured here: TalkBack/real screen reader (`NO_DATA(physical_screen_reader)`).
