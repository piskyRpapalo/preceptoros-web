// W1 · deterministic wave-duel core. SHA-256 via WebCrypto; no random source, clock or network.
// This remains an offline core. It does not authenticate participants or establish balance (BM-D2).
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var ABANDON = 900;
  var HEX = /^[0-9a-f]{64}$/;

  function fail(cause) { throw new Error('wave_duel: ' + cause); }
  function seed(value) { return typeof value === 'string' && value.length > 0; }
  function digest(text) {
    if (!root.crypto || !root.crypto.subtle || typeof root.TextEncoder !== 'function') {
      fail('WebCrypto SHA-256 is unavailable');
    }
    return root.crypto.subtle.digest('SHA-256', new root.TextEncoder().encode(text)).then(function (bytes) {
      return Array.from(new Uint8Array(bytes), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    });
  }
  function moveFor(sideSeed, round) {
    return digest('preceptoros.wave-duel-move/1|' + sideSeed + '|' + round)
      .then(function (hex) { return parseInt(hex.slice(0, 8), 16) % 3; });
  }
  function nonceFor(side, sideSeed, round) {
    return digest('preceptoros.wave-duel-nonce/1|' + side + '|' + sideSeed + '|' + round);
  }

  // SHA-256 commitment for one disclosed side, move and nonce.
  function commit(side, move, nonce) {
    if ((side !== 'A' && side !== 'B') || !Number.isInteger(move) || move < 0 || move > 2 ||
        typeof nonce !== 'string' || !nonce) { fail('side, move and nonce are required'); }
    return digest('preceptoros.wave-duel-commit/1|' + side + '|' + move + '|' + nonce);
  }

  // duel(seedA, seedB, rounds) → promise of the deterministic replay log.
  async function duel(seedA, seedB, rounds) {
    if (!seed(seedA) || !seed(seedB)) { fail('a duel needs two seeds'); }
    if (!Number.isSafeInteger(rounds) || rounds < 0) { fail('rounds must be a non-negative safe integer'); }
    var log = [], points = { A: 0, B: 0 };
    var limit = Math.min(rounds, ABANDON);
    for (var round = 0; round < limit; round++) {
      var values = await Promise.all([
        moveFor(seedA, round), moveFor(seedB, round),
        nonceFor('A', seedA, round), nonceFor('B', seedB, round)
      ]);
      var moveA = values[0], moveB = values[1], nonceA = values[2], nonceB = values[3];
      var hashes = await Promise.all([commit('A', moveA, nonceA), commit('B', moveB, nonceB)]);
      // Reveal and check both commitments before recording the round.
      var opened = await Promise.all([commit('A', moveA, nonceA), commit('B', moveB, nonceB)]);
      if (opened[0] !== hashes[0] || opened[1] !== hashes[1]) { fail('reveal does not match the commitment in round ' + round); }
      var winner = moveA === moveB ? 'draw' : ((moveA + 1) % 3 === moveB ? 'B' : 'A');
      if (winner !== 'draw') { points[winner]++; }
      log.push({ round: round, commitA: hashes[0], commitB: hashes[1], moveA: moveA, moveB: moveB, winner: winner });
    }
    var abandoned = rounds > ABANDON;
    return {
      log: log,
      outcome: { puntos: points, abandoned: abandoned, abandonedAt: abandoned ? ABANDON : null,
        balance: 'NO_DATA: not measured (BM-D2)' }
    };
  }

  // Check deterministic moves as well as their SHA-256 commitments. This verifies bytes, not identity or authority.
  async function verify(entry, seedA, seedB) {
    if (!entry || !Array.isArray(entry.log) || !seed(seedA) || !seed(seedB)) { return false; }
    try {
      for (var i = 0; i < entry.log.length; i++) {
        var event = entry.log[i];
        if (!event || event.round !== i || !Number.isInteger(event.moveA) || !Number.isInteger(event.moveB) ||
            !HEX.test(event.commitA) || !HEX.test(event.commitB)) { return false; }
        var values = await Promise.all([
          moveFor(seedA, i), moveFor(seedB, i), nonceFor('A', seedA, i), nonceFor('B', seedB, i)
        ]);
        if (event.moveA !== values[0] || event.moveB !== values[1]) { return false; }
        var hashes = await Promise.all([commit('A', event.moveA, values[2]), commit('B', event.moveB, values[3])]);
        if (event.commitA !== hashes[0] || event.commitB !== hashes[1]) { return false; }
      }
      return true;
    } catch (_) { return false; }
  }

  var API = { ABANDON: ABANDON, commit: commit, duel: duel, verify: verify };
  if (common) { module.exports = API; }
  else { root.AtlasWaveDuel = API; }
})(typeof globalThis === 'object' ? globalThis : this);
