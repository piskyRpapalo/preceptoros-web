(function (raiz) {
  'use strict';

  var enNode = typeof module === 'object' && module.exports;
  var V = enNode ? require('./valores.js') : raiz.AtlasValores;
  var K = enNode ? require('./canon.js') : raiz.AtlasCanon;
  var CT = enNode ? require('./combate_ticks.js') : raiz.AtlasCombateTicks;

  var SCHEMA = 'preceptoros.practice/1';
  var STANCES = Object.freeze(['shield', 'pike', 'bow']);
  var WINNER_CODES = { defensa: 0, asalto: 1, empate: 2 };
  var COOLDOWN = 3;
  var SIDE = 1;
  var UNIT = 0;
  var RECEIPT_LIMIT = 200;
  var FRAME_LIMIT = 1024;
  var CAUSE = 'SIMULATED practice: no human signature, so this is not a signed duel result';
  var ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var BASE64_SHAPE = /^[A-Za-z0-9+\/]*={0,2}$/;
  var PACKET_KEYS = 'e,f,h,o,s,v';

  function fail(cause) { return { ok: false, cause: cause }; }

  function alive(u) { return u.vida > 0; }

  function isActive(st) { return st.ronda < st.P.rondas && st.U[0].some(alive) && st.U[1].some(alive); }

  function validSeed(seed) { return typeof seed === 'string' && K.HEX64.test(seed); }

  function requireSeed(seed) {
    if (!validSeed(seed)) { throw new TypeError('practice seed must be 64 lowercase hex'); }
  }

  function teams(seed) {
    requireSeed(seed);
    return {
      def: { tc: 'tc1', semilla: K.sha(seed + ':def') },
      asa: { tc: 'tc1', semilla: K.sha(seed + ':asa') }
    };
  }

  function teamHash(seed) { return K.huella({ teams: teams(seed), version: SCHEMA, combat: V.combate, stances: stanceEffect.toString() }).slice(0, 16); }

  function utf8Length(text) {
    var n = 0;
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) { n += 1; }
      else if (c < 0x800) { n += 2; }
      else if (c >= 0xd800 && c <= 0xdbff) { n += 4; i++; }
      else { n += 3; }
    }
    return n;
  }

  function encodeBytes(bytes) {
    var out = '';
    for (var i = 0; i < bytes.length; i += 3) {
      var a = bytes[i];
      var b = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var c = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var n = (a << 16) | (b << 8) | c;
      var chars = [
        ALPHABET.charAt((n >> 18) & 63), ALPHABET.charAt((n >> 12) & 63),
        ALPHABET.charAt((n >> 6) & 63), ALPHABET.charAt(n & 63)
      ];
      if (i + 1 >= bytes.length) { chars[2] = '='; }
      if (i + 2 >= bytes.length) { chars[3] = '='; }
      out += chars.join('');
    }
    return out;
  }

  function decodeBytes(text) {
    if (typeof text !== 'string' || text.length % 4 || !BASE64_SHAPE.test(text)) { return null; }
    var bytes = [];
    for (var i = 0; i < text.length; i += 4) {
      var n = 0;
      for (var j = 0; j < 4; j++) {
        var ch = text.charAt(i + j);
        n = (n << 6) | (ch === '=' ? 0 : ALPHABET.indexOf(ch));
      }
      bytes.push((n >> 16) & 255);
      if (text.charAt(i + 2) !== '=') { bytes.push((n >> 8) & 255); }
      if (text.charAt(i + 3) !== '=') { bytes.push(n & 255); }
    }
    return encodeBytes(bytes) === text ? bytes : null;
  }

  function encodeOrder(tick, side, unit, stance) {
    return ((tick * 2 + side) * 16 + unit) * 4 + STANCES.indexOf(stance);
  }

  function decodeOrder(code) {
    var action = code % 4, slot = Math.floor(code / 4), unit = slot % 16, pair = Math.floor(slot / 16);
    return { tick: Math.floor(pair / 2), side: pair % 2, unit: unit, stance: STANCES[action] };
  }

  function encodeOrders(orders) {
    var bytes = [];
    for (var i = 0; i < orders.length; i++) {
      var code = encodeOrder(orders[i].tick, SIDE, UNIT, orders[i].stance);
      if (code > 65535) { return null; }
      bytes.push(code >> 8, code & 255);
    }
    return encodeBytes(bytes);
  }

  function decodeOrders(text) {
    var bytes = decodeBytes(text);
    if (bytes === null) { return fail('orders are not canonical base64'); }
    if (bytes.length % 2) { return fail('orders hold an odd number of bytes'); }
    var orders = [];
    for (var i = 0; i < bytes.length; i += 2) {
      var o = decodeOrder(bytes[i] * 256 + bytes[i + 1]);
      if (o.side !== SIDE || o.unit !== UNIT) { return fail('order for side ' + o.side + ' unit ' + o.unit + ': practice only accepts side 1 unit 0'); }
      if (o.tick < 1 || o.tick > V.combate.rondas) { return fail('order tick ' + o.tick + ' outside 1..' + V.combate.rondas); }
      if (!o.stance) { return fail('order with unknown stance code'); }
      orders.push({ tick: o.tick, stance: o.stance });
    }
    return { ok: true, orders: orders };
  }

  function stanceEffect(base, stance) {
    var r = { atk: base.atk, arm: base.arm, vel: base.vel };
    if (stance === 'shield') { r.arm = base.arm + 2; r.atk = Math.max(1, base.atk - 1); }
    if (stance === 'pike') { r.atk = base.atk + 2; r.vel = Math.max(1, base.vel - 1); }
    if (stance === 'bow') { r.vel = base.vel + 2; r.arm = Math.max(0, base.arm - 1); }
    return r;
  }

  function engine(seed) {
    var T = teams(seed);
    var st = CT.inicia([T.def], [T.asa], seed, V);
    var unit = st.U[SIDE][UNIT];
    var base = { atk: unit.atk, arm: unit.arm, vel: unit.vel };
    var orders = [];

    function stanceFor(round) {
      for (var i = orders.length - 1; i >= 0; i--) {
        if (orders[i].tick <= round) { return orders[i].stance; }
      }
      return null;
    }

    function trace() { return st.registro.map(function (r) { return r.slice(); }); }

    function summary() {
      var c = CT.cierra(st);
      return {
        v: [WINNER_CODES[c.gana], c.rondas, c.vida_por_mil[0], c.vida_por_mil[1]],
        h: K.huella(trace()).slice(0, 16)
      };
    }

    function step() {
      if (!isActive(st)) { return fail('practice battle has ended'); }
      var p = stanceEffect(base, stanceFor(st.ronda + 1));
      unit.atk = p.atk;
      unit.arm = p.arm;
      unit.vel = p.vel;
      CT.ronda(st);
      return { ok: true, tick: st.ronda };
    }

    function choose(stance) {
      if (!isActive(st)) { return fail('practice battle has ended: no more orders'); }
      if (STANCES.indexOf(stance) < 0) { return fail('unknown stance: use shield, pike or bow'); }
      var tick = st.ronda + 1, last = orders[orders.length - 1];
      if (last && last.tick === tick) { return fail('already ordered for tick ' + tick); }
      if (last && tick < last.tick + COOLDOWN) { return fail('cooldown: next order allowed at tick ' + (last.tick + COOLDOWN)); }
      orders.push({ tick: tick, stance: stance });
      return { ok: true, tick: tick, stance: stance, ready_at: tick + COOLDOWN };
    }

    function frame() {
      var ended = !isActive(st), last = orders[orders.length - 1];
      return {
        schema: SCHEMA,
        seed: seed,
        tick: st.ronda,
        cooldown_ticks: COOLDOWN,
        ready_at: last ? Math.max(st.ronda + 1, last.tick + COOLDOWN) : st.ronda + 1,
        stance: last ? last.stance : null,
        units: [0, 1].map(function (side) {
          var u = st.U[side][UNIT];
          return { side: side, hp: u.vida, max: u.max, seed: side ? T.asa.semilla : T.def.semilla };
        }),
        ended: ended,
        winner: ended ? CT.cierra(st).gana : null,
        stamp: 'SIMULATED',
        cause: CAUSE
      };
    }

    function receipt() {
      if (isActive(st)) { return fail('battle has not ended: no receipt yet'); }
      var s = summary(), o = encodeOrders(orders);
      if (o === null) { return fail('an order does not fit in two bytes'); }
      var packet = { s: seed, e: teamHash(seed), o: o, v: s.v, h: s.h, f: null };
      var text = JSON.stringify(packet);
      if (utf8Length(text) >= RECEIPT_LIMIT) { return fail('receipt of ' + utf8Length(text) + ' B is not under 200 B'); }
      return { ok: true, packet: packet, text: text };
    }

    function fork(at) {
      var most = Math.min(st.ronda + 1, V.combate.rondas);
      if (!Number.isSafeInteger(at) || at < 1 || at > most) { return fail('fork tick must be an integer from 1 to ' + most); }
      var kept = orders.filter(function (o) { return o.tick < at; });
      var run = replay(seed, kept, at - 1);
      return run.ok ? { ok: true, engine: run.engine } : run;
    }

    return {
      round: function () { return st.ronda; },
      frame: frame, choose: choose, step: step, trace: trace,
      receipt: receipt, fork: fork, summary: summary
    };
  }

  function replay(seed, orders, upto) {
    var e = engine(seed);
    for (var i = 0; i < orders.length; i++) {
      var o = orders[i];
      if (o.tick < e.round() + 1) { return fail('order at tick ' + o.tick + ' does not come after round ' + e.round()); }
      while (e.round() + 1 < o.tick) {
        if (!e.step().ok) { return fail('battle ended before the order at tick ' + o.tick); }
      }
      var r = e.choose(o.stance);
      if (!r.ok) { return r; }
    }
    var limit = upto === undefined ? Infinity : upto;
    while (e.round() < limit && e.step().ok) { }
    if (upto !== undefined && e.round() < upto) { return fail('replay stopped at tick ' + e.round()); }
    return { ok: true, engine: e };
  }

  function publish(e) {
    return {
      frame: e.frame,
      choose: e.choose,
      step: e.step,
      fork: function (at) {
        var r = e.fork(at);
        return r.ok ? { ok: true, session: publish(r.engine) } : r;
      },
      receipt: e.receipt,
      trace: e.trace
    };
  }

  function create(seed) {
    requireSeed(seed);
    return publish(engine(seed));
  }

  function verify(packet) {
    if (!packet || typeof packet !== 'object' || Array.isArray(packet)) { return fail('packet is not an object'); }
    if (Object.keys(packet).sort().join(',') !== PACKET_KEYS) { return fail('packet keys must be exactly e, f, h, o, s, v'); }
    if (packet.f !== null) { return fail('signature field must be null: practice is never signed'); }
    if (!validSeed(packet.s)) { return fail('seed must be 64 lowercase hex'); }
    if (typeof packet.e !== 'string' || typeof packet.o !== 'string' || typeof packet.h !== 'string') { return fail('e, o and h must be strings'); }
    if (!Array.isArray(packet.v) || packet.v.length !== 4 || !packet.v.every(Number.isSafeInteger)) { return fail('v must hold four integers'); }
    var size = utf8Length(JSON.stringify(packet));
    if (size >= RECEIPT_LIMIT) { return fail('packet of ' + size + ' B is not under 200 B'); }
    if (packet.e !== teamHash(packet.s)) { return fail('team hash differs from the seed'); }
    var decoded = decodeOrders(packet.o);
    if (!decoded.ok) { return decoded; }
    var run = replay(packet.s, decoded.orders);
    if (!run.ok) { return run; }
    var mine = run.engine.summary();
    if (JSON.stringify(mine.v) !== JSON.stringify(packet.v)) { return fail('verdict differs from replay from tick 0'); }
    if (mine.h !== packet.h) { return fail('trace hash differs from replay from tick 0'); }
    return { ok: true };
  }

  var AtlasPracticeModel = {
    SCHEMA: SCHEMA, STANCES: STANCES, COOLDOWN: COOLDOWN, RECEIPT_LIMIT: RECEIPT_LIMIT, FRAME_LIMIT: FRAME_LIMIT,
    create: create, teams: teams, verify: verify,
    base64: { encode: encodeBytes, decode: decodeBytes }
  };
  if (enNode) { module.exports = AtlasPracticeModel; }
  else { raiz.AtlasPracticeModel = AtlasPracticeModel; }
})(this);
