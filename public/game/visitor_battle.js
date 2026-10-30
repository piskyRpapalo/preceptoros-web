(function (root) {
  'use strict';
  var RULES = 'historical-ticks/1', V = root.AtlasValores, K = root.AtlasCanon, T = root.AtlasCombateTicks;
  function places() {
    var names = ['Reef', 'Kelp', 'Ruins', 'Silt', 'Abyss', 'Core'];
    return V.patrullas.map(function (p, i) {
      var seed = K.sha('atlas.patrulla/1:' + p.id), troops = [];
      for (var j = 0; j < p.n; j++) { troops.push({ tc: p.tc, semilla: K.sha(seed + ':patrulla:' + j) }); }
      var spot = root.AtlasNiebla.sitioLugar({ npc: true, orden: i, tc: p.tc }, K.sha, null);
      return { id: p.id, name: names[i] || 'Patrol', troops: troops, coordinate: [spot.x, spot.y] };
    });
  }
  async function seal(round, events) {
    var a = JSON.stringify(events.filter(function (e) { return e[1] === 0; }));
    var b = JSON.stringify(events.filter(function (e) { return e[1] === 1; }));
    return Promise.all([root.AtlasWaveRules.commit('A', round % 3, a), root.AtlasWaveRules.commit('B', round % 3, b)]);
  }
  async function run(placeId, troops, visitSeed) {
    if (!/^[a-f0-9]{64}$/.test(visitSeed || '')) { throw new Error('Visit seed is required'); }
    var place = places().find(function (p) { return p.id === placeId; });
    if (!place || !Array.isArray(troops) || !troops.length || troops.length > V.combate.tropas_max) { throw new Error('A known place and one to ten adopted troops are required'); }
    var squad = troops.map(function (t) {
      if (!t || !/^tc[1-4]$/.test(t.tc) || !/^[a-f0-9]{64}$/.test(t.semilla || '')) { throw new Error('Invalid troop'); }
      return { tc: t.tc, semilla: t.semilla };
    });
    var seed = await root.AtlasVisitorAccount.digest('preceptoros.visitor-battle/1|' + place.id + '|' + visitSeed + '|' + JSON.stringify(squad));
    var combat = T.combate(place.troops, squad, seed), frames = [];
    for (var round = 1; round <= combat.rondas; round++) {
      var events = combat.registro.filter(function (e) { return e[0] === round; });
      // Split large rounds into bounded segments; never truncate reveal evidence.
      for (var offset = 0; offset < events.length; offset += 4) {
        var segment = events.slice(offset, offset + 4), commits = await seal(round, segment);
        var sentence = place.name + ' practice · round ' + round + ' · balance NO_DATA: not measured';
        var frame = { v: 'preceptoros.bubble/1', id: 'visitor-round', t: round, atoms: [{ k: 'round', r: sentence, i: [] }], bands: ['cyan', 'ink'], change: [sentence], sound: 'NO_DATA', soundCause: 'practice sound is off', motion: 'step' };
        var entry = { rules: RULES, place: place.id, coordinate: place.coordinate, round: round, part: offset / 4, commits: commits, reveal: segment, frame: frame };
        if (new TextEncoder().encode(JSON.stringify(entry)).length >= 1024) { throw new Error('Round frame exceeds its channel budget'); }
        frames.push(entry);
      }
    }
    return { rules: RULES, place: place.id, seed: seed, defenders: place.troops, attackers: squad, combat: combat, frames: frames, balance: 'NO_DATA: historical provisional rules; fairness not measured' };
  }
  async function verify(result, visitSeed) {
    try {
      if (!result || result.rules !== RULES) { return false; }
      var canonical = await run(result.place, result.attackers, visitSeed);
      return JSON.stringify(result) === JSON.stringify(canonical);
    } catch (_) { return false; }
  }
  root.AtlasVisitorBattle = Object.freeze({ places: places, run: run, verify: verify });
})(globalThis);
