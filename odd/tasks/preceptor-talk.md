# preceptor-talk

Date: 2026-11-08
Law: Sovereign, chat 2026-11-08: «when the user opens the web a small header over the buttons, a dialogue box; deterministic and interactive; the preceptor speaking; so we do not hide the beautiful map when users arrive». Also: names over the buildings, small and in Acho; steps are walked by the crab, not pressed.

## Objective

The visitor meets the game through its centre, the crab, guided by a small preceptor box over the gamepad. The map stays in view: at least half the window (gamepad guard).

## Built

- `public/game/preceptor_talk.js`: a small tree of lines (`LINES`), each with its own answers.
  - `next(at, event)` and `choose(at, i)` are pure: the same line and event always give the same next line, with no clock and no chance.
  - Events: the crab walked, a building opened (`building:enter`), the visit started.
  - The line is spoken by `aria-live`; the answers are 44 px buttons.
  - Nothing is stored or sent.
- `public/game/map_chunks.js` `names()`: the buildings within 6 hexes of the crab carry their name in a small Acho pill (paper, ink rim, rounded letters at 11 CSS px). The farther ones stay unnamed, so the map reads as it is walked.
- `public/game/visitor_play.js`: the «Wait one turn» button, a piece built ahead of time, is gone. Every hex the crab walks dispatches `visitor:advance` (this was already wired in `openworld_page.js` `stepped`), and the House shows the hint «Walk your crab: every hex is one step.» The browser guards walk by that same event.

## Gates

- `atlas/puros/preceptor_talk_cases.mjs`: every answer leads to a real line; lines fit the small box (≤ 60 characters); events move only where they mean something; «Later» is respected.
- `atlas/gamepad_browser.mjs`: four pieces (status line, map, preceptor, gamepad); the map still takes at least half the window at 360 and 420 px.

## NO_DATA

- A spoken voice for the preceptor (text only today).
- Lines written by a live model: today they are a fixed, signed tree.
- The box's own Acho figure.

## Next

Summons and duels anchored on the map around the crab, with a zoom into its hex (a still cut with reduced motion).
