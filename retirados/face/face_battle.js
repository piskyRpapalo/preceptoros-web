(function (root) {
  'use strict';
  var node = typeof module === 'object' && module.exports;
  function lib(name, file) { return root[name] || (node ? require(file) : null); }
  var T = lib('AtlasCombateTicks', '../../../public/game/combate_ticks.js');
  var G = lib('AtlasGacha', '../../../public/game/gacha.js');
  var K = lib('AtlasCanon', '../../../public/game/canon.js');
  var E = lib('AtlasEscuadron', '../../../public/game/escuadron.js');
  var V = lib('AtlasValores', '../../../public/game/valores.js');
  var forms = ['agresiva', 'defensiva', 'flanqueo'];
  var formNames = { agresiva: 'Spear', defensiva: 'Shield', flanqueo: 'Wings' };
  var patrolNames = { arrecife: 'Reef patrol', algas: 'Kelp patrol', ruinas: 'Ruins patrol', limo: 'Silt patrol', abismo: 'Abyss patrol', nucleo: 'Core patrol' };
  var field = [486, 200];

  function patrols() {
    return V.patrullas.map(function (p) {
      var s = K.sha('atlas.patrulla/1:' + p.id), ts = [];
      for (var i = 0; i < p.n; i++) { ts.push({ tc: p.tc, semilla: K.sha(s + ':patrulla:' + i) }); }
      return { id: p.id, name: patrolNames[p.id] || p.id, tc: p.tc, n: p.n, semilla: s, tropas: ts };
    });
  }
  function seedFor(p, squad) { return K.sha('preceptor.face/batalla:' + p.id + ':' + squad.map(function (x) { return x.semilla; }).join(',')); }
  function spot(side, i, n) { var k = i - (n - 1) / 2; return [Math.round(field[0] + k * 38 + (i % 2) * 6), Math.round(field[1] + (side ? 96 : -96) + (i % 2) * 18)]; }

  function create() {
    var p = null, squad = [], seed = null, draws = [[], []];
    var b = { on: false, form: 'defensiva', orders: [], st: null, last: [], result: null, receipt: null, verified: null, reveal: 0, patrol: null };

    function begin(patrol, army) {
      p = patrol; squad = (army || []).slice(0, V.combate.tropas_max);
      if (!p || !squad.length) { return null; }
      seed = seedFor(p, squad);
      draws = [p.tropas.map(function (x) { return G.tirada(x.semilla, x.tc); }), squad.map(function (x) { return G.tirada(x.semilla, x.tc); })];
      b.on = true; b.patrol = p.id; b.orders = []; b.result = null; b.receipt = null; b.verified = null; b.last = []; b.reveal = 0;
      b.st = T.inicia(p.tropas, squad, seed);
      return b;
    }
    function done() { return !!b.result; }
    function alive(l) { return b.st.U[l].filter(function (u) { return u.vida > 0; }); }
    function step() {
      if (!b.st || done()) { return false; }
      var st = b.st, n0 = st.registro.length, ok;
      b.orders.forEach(function (o) { if (o.tick === st.ronda + 1) { st.U[o.lado][o.i].vida = 0; } });
      ok = T.ronda(st);
      b.last = st.registro.slice(n0);
      if (!ok || !(st.ronda < st.P.rondas && alive(0).length && alive(1).length)) { finish(); }
      return true;
    }
    function finish() {
      b.result = T.cierra(b.st);
      var r = T.recibo(p.tropas, squad, seed, b.orders);
      b.receipt = r.ok ? r.texto : 'NO_DATA: ' + r.motivo;
      b.verified = r.ok ? T.verifica(r.recibo, p.tropas, squad) : { ok: false, motivo: r.motivo };
    }
    function withdraw(i) {
      if (!b.st || done() || b.orders.length >= 1) { return false; }
      var u = b.st.U[1][i];
      if (!u || u.vida <= 0) { return false; }
      b.orders.push({ tick: b.st.ronda + 1, lado: 1, i: i, accion: 'retira' });
      return true;
    }
    function form(f) { if (forms.indexOf(f) >= 0) { b.form = f; } }

    function troops() {
      var out = [];
      [0, 1].forEach(function (l) {
        draws[l].forEach(function (d, i) {
          var u = b.st ? b.st.U[l][i] : { vida: d.stats.vida, max: d.stats.vida };
          out.push({ lado: l, i: i, d: d, vida: u.vida, max: u.max, at: spot(l, i, draws[l].length), name: d.rareza });
        });
      });
      return out;
    }
    function life(l) { var v = 0, m = 0; troops().forEach(function (x) { if (x.lado === l) { v += x.vida; m += x.max; } }); return [v, m]; }

    function oye() { var Hk = root.PreceptorFaceHooks; return !!(Hk && Hk.sound && Hk.sound()); }
    function frame(change) {
      var atoms = [0, 1].map(function (l) {
        var list = troops().filter(function (x) { return x.lado === l && x.vida > 0; }), lf = life(l);
        return { k: l ? 'yours' : 'patrol', r: (l ? 'your squad, ' + formNames[b.form] : (patrolNames[b.patrol] || 'patrol')) + ': ' + list.length + ' alive, life ' + lf[0] + ' of ' + lf[1],
          i: list.map(function (x) { return { o: 'wave', x: x.at[0], y: x.at[1], h: [[1, 9, 9, 0]], f: l ? 'cyan' : 'vermilion.base' }; }) };
      });
      return { v: 'preceptoros.bubble/1', id: 'battle', t: b.st ? b.st.ronda : 0, atoms: atoms, bands: ['cyan', 'vermilion.base', 'ink'],
        change: [change || (b.result ? 'verdict: ' + b.result.gana : 'tick ' + (b.st ? b.st.ronda : 0))], sound: oye() ? 'seal voice' : 'NO_DATA', soundCause: oye() ? 'core.js duel voice: the hitter seal sets the pitch' : 'sound off', motion: 'tick by tick' };
    }

    // [W] O1b (2026-10-27): the fight is drawn by the ONE combat face, the wave duel, LIVE over this state. The old painter
    // (paint) is retired. A withdraw order zeroes a unit without a log event, so the scene does not animate it.
    function duel() {
      if (!b.st) { return null; }
      return { def: p.tropas, asa: squad, semilla: seed,
        combate: { get registro() { return b.st ? b.st.registro : []; }, get gana() { return b.result ? b.result.gana : null; } } };
    }

    function sonar(A) { if (A) { A.activa(true); A.suena({ tipo: 'sonar', portadora: 1320, moduladora: 660, indice: 90, dur: 0.5, gan: 0.08 }); } }

    function summary() {
      return { on: b.on, patrol: b.patrol, tick: b.st ? b.st.ronda : 0, form: b.form, orders: b.orders.slice(), result: b.result && { gana: b.result.gana, rondas: b.result.rondas, vida_por_mil: b.result.vida_por_mil },
        receipt: b.receipt, verified: b.verified, won: !!(b.result && b.result.gana === 'asalto'),
        troops: troops().map(function (x) { return { side: x.lado ? 'yours' : 'patrol', i: x.i, name: x.name, life: x.vida, max: x.max }; }) };
    }

    return { begin: begin, step: step, done: done, withdraw: withdraw, form: form, frame: frame, duel: duel, sonar: sonar, summary: summary, troops: troops, b: b };
  }

  var Battle = { create: create, patrols: patrols, seedFor: seedFor, forms: forms, formNames: formNames, field: field };
  if (node) { module.exports = Battle; } else { root.PreceptorBattle = Battle; }
})(typeof module === 'object' && module.exports ? this : window);
