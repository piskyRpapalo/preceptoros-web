// BM-2 · the wave duel of the benchmarks (odd/tasks/benchmarks-on-map.md, ideas13oct sec. 15). Pure: integer
// arithmetic only, no random numbers, no clock reads, no network.
// Commit-reveal: each side commits to its move before the other reveals. The log is the script of the duel.
// A duel with no seed is refused. An abandonment at 900 cycles is recorded, not hidden.
//
// KNOWN GAP (declared): the commitment here uses FNV-1a, a fast fingerprint, not a cryptographic hash. It detects a
// changed move in a test, but it does not resist an adversary. The published commitment must be SHA-256 (WebCrypto,
// asynchronous): NO_DATA until that piece exists. The balance of the duel is NO_DATA too (BM-D2).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var ABANDON = 900;

  function fail(causa) { throw new Error('wave_duel: ' + causa); }

  function fnv(texto) {
    var h = 0x811c9dc5;
    for (var i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return h >>> 0;
  }

  // commit(side, move, nonce) → the fingerprint the side publishes before the reveal.
  function commit(side, move, nonce) {
    return ('00000000' + fnv(side + '|' + move + '|' + nonce).toString(16)).slice(-8);
  }

  // duel(seedA, seedB, rounds) → { log, outcome }. Each round both sides choose a move from their seed (integers),
  // commit, then reveal; the reveal must match the commit or the duel is refused.
  function duel(seedA, seedB, rounds) {
    if (typeof seedA !== 'string' || seedA === '' || typeof seedB !== 'string' || seedB === '') { fail('a duel needs two seeds'); }
    if (!Number.isInteger(rounds) || rounds < 0) { fail('rounds must be a whole number'); }
    var log = [], puntos = { A: 0, B: 0 };
    var limit = Math.min(rounds, ABANDON);
    for (var r = 0; r < limit; r++) {
      var mA = fnv(seedA + '#' + r) % 3, mB = fnv(seedB + '#' + r) % 3;   // 0 rock, 1 wave, 2 shell
      var nA = fnv('nA' + r + seedA).toString(16), nB = fnv('nB' + r + seedB).toString(16);
      var cA = commit('A', mA, nA), cB = commit('B', mB, nB);
      // reveal: each side opens its move and nonce; the commitment must match
      if (commit('A', mA, nA) !== cA || commit('B', mB, nB) !== cB) { fail('reveal does not match the commitment in round ' + r); }
      var gana = mA === mB ? 'draw' : ((mA + 1) % 3 === mB ? 'B' : 'A');
      if (gana !== 'draw') { puntos[gana]++; }
      log.push({ round: r, commitA: cA, commitB: cB, moveA: mA, moveB: mB, winner: gana });
    }
    var abandonado = rounds > ABANDON;
    return {
      log: log,
      outcome: { puntos: puntos, abandoned: abandonado, abandonedAt: abandonado ? ABANDON : null, balance: 'NO_DATA: not measured (BM-D2)' }
    };
  }

  // verify(log, seedA, seedB) → true only if every commitment in the log opens to the move recorded for its round.
  function verify(entrada, seedA, seedB) {
    return entrada.log.every(function (e) {
      var nA = fnv('nA' + e.round + seedA).toString(16), nB = fnv('nB' + e.round + seedB).toString(16);
      return commit('A', e.moveA, nA) === e.commitA && commit('B', e.moveB, nB) === e.commitB;
    });
  }

  var AtlasWaveDuel = { ABANDON: ABANDON, commit: commit, duel: duel, verify: verify };
  if (common) { module.exports = AtlasWaveDuel; }
  else { root.AtlasWaveDuel = AtlasWaveDuel; }
})(typeof globalThis === 'object' ? globalThis : this);
