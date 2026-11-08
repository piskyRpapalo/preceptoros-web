// Duel state machine (D5). Pure. Fail-closed: an illegal step closes the duel with NO_DATA, never repairs it.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var STATES = Object.freeze(['born', 'ready', 'act', 'hitstop', 'resolve', 'over']);
  var TABLE = Object.freeze({
    born: Object.freeze({ start: 'ready' }),
    ready: Object.freeze({ act: 'act' }),
    act: Object.freeze({ hit: 'hitstop', miss: 'resolve' }),
    hitstop: Object.freeze({ tick: 'hitstop', done: 'resolve' }),
    resolve: Object.freeze({ next: 'ready', end: 'over' }),
    over: Object.freeze({})
  });
  var SPREAD = 0.08, HIT = 0.85, HITSTOP_FRAMES = 4, FRAME_CAP = 2000, TOPE = 1e6;
  var ACTORS = ['a', 'b'];

  function tiene(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }

  // step(state, event) → next state, or NO_DATA. Validates before any move.
  function step(state, event) {
    if (!tiene(TABLE, state) || !tiene(TABLE[state], event)) {
      return { estado: 'NO_DATA', causa: 'duel_illegal_transition', from: state, event: event };
    }
    return TABLE[state][event];
  }

  // FNV-1a 32-bit.
  function fnv(text) {
    var h = 0x811c9dc5, i;
    for (i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function hex8(n) { return ('00000000' + n.toString(16)).slice(-8); }

  // seed = FNV-1a(place + ':' + tick).
  function seedOf(place, tick) { return fnv(String(place) + ':' + String(tick)); }

  // rng(seed) → function returning u in [0,1). xorshift32; zero state is replaced.
  function rng(seed) {
    var s = (seed >>> 0) || 0x9e3779b9;
    return function () {
      s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0;
      return s / 4294967296;
    };
  }

  // Low-variance damage: base * (1 + SPREAD * (2u - 1)), rounded, never below 1.
  function damage(base, r) {
    return Math.max(1, Math.round(base * (1 + SPREAD * (r() * 2 - 1))));
  }

  function valid(f) {
    return !!f && typeof f === 'object' && Number.isInteger(f.hp) && Number.isInteger(f.atk) &&
      f.hp >= 1 && f.hp <= TOPE && f.atk >= 1 && f.atk <= TOPE;
  }

  // fight(place, tick, a, b): a and b are { hp, atk }. Frames are [n, state, actor, dmg].
  function fight(place, tick, a, b) {
    if (!valid(a) || !valid(b)) { return { estado: 'NO_DATA', causa: 'duel_bad_fighter' }; }
    var seed = seedOf(place, tick), r = rng(seed);
    var fighters = [{ hp: a.hp, atk: a.atk }, { hp: b.hp, atk: b.atk }];
    var frames = [], st = 'born', err = null, turn = 0, winner = null;

    function move(event, actor, dmg) {
      var next = step(st, event);
      if (typeof next !== 'string') { return next; }
      if (frames.length >= FRAME_CAP) { return { estado: 'NO_DATA', causa: 'duel_frame_cap' }; }
      st = next;
      frames.push([frames.length + 1, st, actor, dmg]);
      return null;
    }

    if ((err = move('start', null, 0))) { return err; }
    while (winner === null) {
      var atk = turn % 2, def = 1 - atk, actor = ACTORS[atk], dmg = 0;
      if ((err = move('act', actor, 0))) { return err; }
      if (r() < HIT) {
        dmg = damage(fighters[atk].atk, r);
        fighters[def].hp -= dmg;
        if ((err = move('hit', actor, dmg))) { return err; }
        for (var k = 1; k < HITSTOP_FRAMES; k++) {
          if ((err = move('tick', actor, 0))) { return err; }
        }
        if ((err = move('done', actor, 0))) { return err; }
      } else if ((err = move('miss', actor, 0))) {
        return err;
      }
      if (fighters[def].hp <= 0) {
        if ((err = move('end', actor, 0))) { return err; }
        winner = actor;
      } else if ((err = move('next', actor, 0))) {
        return err;
      }
      turn++;
    }
    var receipt = {
      v: 'preceptoros.duel/1', seed: seed, frames: frames.length, winner: winner,
      hash: hex8(fnv(JSON.stringify(frames)))
    };
    return { frames: frames, winner: winner, seed: seed, receipt: receipt };
  }

  var AtlasDuel = {
    STATES: STATES, TABLE: TABLE, SPREAD: SPREAD, HIT: HIT, HITSTOP_FRAMES: HITSTOP_FRAMES,
    FRAME_CAP: FRAME_CAP, step: step, rng: rng, seedOf: seedOf, damage: damage, fight: fight
  };
  if (common) { module.exports = AtlasDuel; }
  else { root.AtlasDuel = AtlasDuel; }
})(typeof globalThis === 'object' ? globalThis : this);
