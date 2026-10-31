// Replay controls of the practice battle (EU-3). Pure state: no DOM, no clock, no random numbers, no network.
// The replay's speed and pause only change how fast the scene reveals the recorded events. They never change the
// record: visitor_battle.verify recomputes the battle from the seed and must pass at any speed.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var SPEEDS = [1, 2, 4];

  // start() → the state at the beginning: playing at ×1.
  function start() { return { speed: 1, paused: false }; }

  // setSpeed(state, speed) → a new state. Only ×1, ×2 and ×4 are accepted; any other value keeps the state.
  function setSpeed(state, speed) {
    if (SPEEDS.indexOf(speed) < 0) { return state; }
    return { speed: speed, paused: state.paused };
  }

  // pause(state) and play(state): the speed is kept while paused, so resuming goes back to the same speed.
  function pause(state) { return { speed: state.speed, paused: true }; }
  function play(state) { return { speed: state.speed, paused: false }; }

  // rate(state) → the value given to the scene's velocidad(): 0 freezes the event time, otherwise the speed.
  function rate(state) { return state.paused ? 0 : state.speed; }

  // label(state) → what the screen says, in English. A paused replay says so.
  function label(state) { return state.paused ? 'PAUSED · ×' + state.speed : 'PLAYING · ×' + state.speed; }

  var AtlasBattleReplayControls = { SPEEDS: SPEEDS, start: start, setSpeed: setSpeed, pause: pause, play: play, rate: rate, label: label };
  if (common) { module.exports = AtlasBattleReplayControls; }
  else { root.AtlasBattleReplayControls = AtlasBattleReplayControls; }
})(typeof globalThis === 'object' ? globalThis : this);
