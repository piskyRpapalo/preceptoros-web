// [W] O1 (2026-10-27) · the wave duel: the ONE combat face of the game. escena(lienzo, def, asa, combate, op) → { velocidad,
// salta, otra, para }. op.vivo: a LIVE fight whose combate.registro grows tick by tick; it ends only once combate.gana is set.
// HYBRID (Sovereign's ruling): v1.1's LAYOUT (columns, a life bar per troop, the attacker on a sine trail, a dark sea of 5 sine
// lines, Round N) with each troop's P6 squadron drawing. Jewel 1: each troop's seal sets its ring hue (AtlasSemantica) and term
// count (TERMINOS). Jewel 4: a 12-radial pulse ring per hit. q1..q8 + xorshift32 seeded from the fight. No system randomness,
// no clock with authority, no network, no raw colour.
(function (raiz) {
  'use strict';
  var G = raiz.AtlasGacha, E = raiz.AtlasEscena, O = raiz.AtlasOnda || {}, S = raiz.AtlasSemantica, CT = raiz.AtlasComicTokens;
  var EV = E.EVENTO_MS, TAU = 2 * Math.PI;
  // Terms per seal, from the jewel's TABLA_SEMANTICA (fourier-shapes.js:38-95, measured 2026-10-27). LIVE keeps the troop's
  // full spectrum; the others are capped, so an emulated, stale or empty troop reads simpler at a glance.
  var TERMINOS = Object.freeze({ LIVE: null, PROPUESTA: 4, FIRMADO: 5, ERROR: 4, NO_DATA: 1, SIMULATED: 2, STALE: 2 });
  var SELLO_TEXTO = Object.freeze({ LIVE: 'LIVE', SIMULATED: 'EMULADO', STALE: 'STALE', NO_DATA: 'NO_DATA' });

  // q1..q8 (canon-graficos-parte2 §2): semi-deterministic state; xorshift32 seeded from the fight's seed, reseeded per seal.
  function estado(semilla) {
    var s = (parseInt(String(semilla || '0').slice(0, 8), 16) >>> 0) || 0x9e3779b9, q = [0, 0, 0, 0, 1, 0, 1, 0];
    function rnd() { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }
    return { q: q, rnd: rnd, resiembra: function (n) { s = (s ^ Math.imul(n + 1, 2654435761)) >>> 0 || 1; },
      avanza: function () {
        q[0] = (q[0] + 0.001 * (0.9 + 0.2 * rnd())) % 1; q[1] = 0.5 + 0.3 * Math.sin(q[0] * TAU); q[2] = 0.005 + 0.005 * rnd();
        q[3] = (q[3] + 0.001 * (0.5 + rnd())) % TAU; q[4] = 1 + 0.2 * Math.sin(q[0] * TAU * 2); q[5] = (q[5] + 0.1) % 360;
        q[6] = 0.9 + 0.1 * rnd(); q[7] = 0.5 + 0.5 * Math.sin(q[3]);
      } };
  }
  function selloDe(u, op) { return !u.t || !u.t.armonicos || !u.t.armonicos.length ? 'NO_DATA' : !u.vida ? 'STALE' : (op.emulado === u.lado ? 'SIMULATED' : 'LIVE'); }
  function arm(u, sello) { var a = G.lod(u.t), n = TERMINOS[sello]; return n ? a.slice(0, n) : a; }
  function unidades(tropas, lado) {
    return tropas.map(function (x, i) {
      var t = G.tirada(x.semilla, x.tc);
      return { t: t, lado: lado, i: i, vida: t.stats.vida, max: t.stats.vida, vel: t.stats.velocidad, arm: t.stats.armadura,
               masa: 1 + (t.stats.inercia || 0) / 8, color: E.tono(t), brillo: E.BRILLO[t.rareza], muere: null, flash: 0,
               tiembla: null, x: 0, y: 0, hx: 0, hy: 0, vx: 0, vy: 0, r: 10 };
    });
  }

  function escena(lienzo, def, asa, combate, op) {
    op = op || {};
    var g = lienzo.getContext('2d'), U = [unidades(def, 0), unidades(asa, 1)], ev = combate.registro;
    var todos = U[0].concat(U[1]), vt = 0, ultimo = null, vel = 1, hechos = 0, raf = 0, acabado = false, vivo = true;
    var pops = [], chispas = [], ondas = [], ronda = 0, dpr = raiz.devicePixelRatio || 1, finVt = 0, dicho = '';
    var col = op.colores || {}, quieto = !!op.quieto, Q = estado(op.semilla), N = CT ? CT.NEUTRAL : {};
    var yo = op.yo == null ? 1 : op.yo, texto = col.texto || N.paper, med = O.medidor ? O.medidor() : null, cal = 1;
    var T = typeof op.texto === 'function' ? op.texto : function () { return ''; };
    // Quality (CombateLimpio, 2026-10-10, carried from the replay): the player's choice rules; 'auto' lowers only after
    // measuring fps and says so; one tap on the scene goes back to Maximum. Same fight, same result.
    lienzo.addEventListener && lienzo.addEventListener('click', function () { if (cal) { return; } var C = raiz.AtlasCalidad;
      if (C && C.pon) { C.pon('maxima'); } else { raiz.AtlasCalidad = { modo: 'maxima', nivel: 2 }; } });
    function banda(sello) { var d = S && S.de(sello); return d ? d.bandas.base : texto; }

    function mide() {
      var w = Math.max(200, lienzo.clientWidth || 320), h = Math.round(Math.min(440, Math.max(280, w * 0.75)));
      if (lienzo.width !== Math.round(w * dpr)) { lienzo.width = Math.round(w * dpr); }
      if (lienzo.height !== Math.round(h * dpr)) { lienzo.height = Math.round(h * dpr); lienzo.style.height = h + 'px'; }
      var W = lienzo.width, H = lienzo.height;
      [0, 1].forEach(function (l) {
        var n = U[l].length, paso = H / (n + 1);
        U[l].forEach(function (u, i) {
          var fila = n > 3 ? (i % 2 ? 0.07 : -0.02) : 0;
          u.hx = W * (l ? 0.2 + fila : 0.8 - fila); u.hy = paso * (i + 1) + H * 0.03;
          if (!u.x) { u.x = u.hx; u.y = u.hy; }
          u.r = Math.min(W * 0.09, paso * 0.44, 66 * dpr);
        });
      });
    }
    function impacta(e, conEfectos) {
      var a = U[e[1]][e[2]], t = U[1 - e[1]][e[3]];
      ronda = e[0];
      if (e[4] < 0) {
        if (conEfectos) { pops.push({ x: t.x, y: t.y - t.r, txt: op.fallo || 'miss', c: col.fallo || texto, v: vt }); }
        return;
      }
      t.vida = Math.max(0, t.vida - e[4]);
      if (!conEfectos) { if (!t.vida) { t.muere = -1e9; } return; }
      t.flash = 1; t.tiembla = vt;
      var dx = t.x - a.x, dy = t.y - a.y, L = Math.hypot(dx, dy) || 1, f = 9 * dpr * Math.min(3, e[4] / 4) / t.masa;
      t.vx += dx / L * f; t.vy += dy / L * f;
      var sello = selloDe(a, op); Q.resiembra(e[0]);
      ondas.push({ x: t.x, y: t.y, r: t.r, c: banda(sello), hz: (S && S.de(sello) || {}).pulso_hz || 1, v: vt, son: sonDe(t.vida ? 'golpe' : 'cae', sello) });
      pops.push({ x: t.x, y: t.y - t.r, txt: '-' + e[4], c: col.dano || a.color, v: vt });
      if (op.sonido) { op.sonido(t.vida ? 'golpe' : 'cae', a.t); }
      if (!t.vida) {
        t.muere = vt;
        for (var i = 0; i < 30; i++) {
          var p = G.punto(t.t.armonicos, i / 30 * TAU), k = t.r / E.limite(t.t.armonicos);
          chispas.push({ x: t.x + p[0] * k, y: t.y - p[1] * k, vx: p[0] * k * 0.004, vy: -p[1] * k * 0.004, c: t.color, v: vt });
        }
      }
    }
    function avanza() {
      var k = Math.min(ev.length, Math.floor(vt / EV + 0.5));
      while (hechos < k) { impacta(ev[hechos], !quieto); hechos++; }
      if (!acabado && hechos >= ev.length && (!op.vivo || combate.gana != null) && vt > ev.length * EV + 800) {
        acabado = true; finVt = vt;
        if (op.sonido) { op.sonido(combate.gana === 'asalto' ? 'gana' : 'pierde'); }
        if (op.alFin) { op.alFin(combate); }
      }
    }
    function mueve(e, fase, dt, t) {
      todos.forEach(function (u, idx) {
        var tx = u.hx + Math.sin(t * 0.0007 + idx * 1.7) * u.r * 0.35, ty = u.hy + Math.cos(t * 0.0009 + idx) * u.r * 0.25;
        if (e && e[1] === u.lado && e[2] === u.i && fase < 0.5) { var o = U[1 - e[1]][e[3]]; tx += (o.x - u.x) * 0.3; ty += (o.y - u.y) * 0.3; }
        var k = dt / 16, m = u.masa;
        u.vx = (u.vx + (tx - u.x) * 0.05 * k / m) * Math.pow(0.86, k); u.vy = (u.vy + (ty - u.y) * 0.05 * k / m) * Math.pow(0.86, k);
        u.x += u.vx * k; u.y += u.vy * k;
      });
    }
    // v1.1 (escena.js:112-122): five faint sine lines on the plain dark sea.
    function mar(W, H, t) {
      g.save(); g.strokeStyle = col.mar || texto; g.globalAlpha = col.mar ? 1 : 0.08; g.lineWidth = dpr;
      for (var j = 1; j <= 5; j++) {
        g.beginPath();
        for (var x = 0; x <= W; x += 8 * dpr) { g[x ? 'lineTo' : 'moveTo'](x, H * j / 6 + Math.sin(x / (60 * dpr) + t * 0.0007 + j) * 5 * dpr); }
        g.stroke();
      }
      g.restore();
    }
    // v1.1 (escena.js:124-129): one life bar under each troop, yours in tuya and the other side in suya.
    function barra(u) {
      var w = u.r * 1.6, x = u.x - w / 2, y = u.y + u.r + 8 * dpr, h = 4 * dpr;
      g.save(); g.globalAlpha = 0.12; g.fillStyle = texto; g.fillRect(x, y, w, h); g.restore();
      g.fillStyle = u.lado === yo ? (col.tuya || u.color) : (col.suya || u.color);
      g.fillRect(x, y, w * u.vida / u.max, h);
    }
    // v1.1 (escena.js:154-162): the attacker's sine trail toward its target.
    function rastro(a, b, fase, t) {
      var L = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / L, ny = (b.x - a.x) / L;
      g.save(); g.strokeStyle = a.color; g.globalAlpha = 0.8 * Math.sin(Math.PI * (fase - 0.3) / 0.45); g.lineWidth = 1.4 * dpr;
      g.beginPath();
      for (var q = 0; q <= 40; q++) {
        var s = q / 40, w = Math.sin(s * 18 - t * 0.02) * 6 * dpr * Math.sin(Math.PI * s);
        g[q ? 'lineTo' : 'moveTo'](a.x + (b.x - a.x) * s + nx * w, a.y + (b.y - a.y) * s + ny * w);
      }
      g.stroke(); g.restore();
    }
    // O3: the ring is the f(t) of ITS hit's sound: width and glow follow its envelope, R beats at its pitch folded to 2-6 Hz.
    // Silent hit: jewel 4 on the scene clock, R = r·(0.5+0.5·sin(2π·q0·f))·(1+0.5·morph) (visual-renderer-core.js:121-138).
    function sonDe(k, sello) {
      var Y = raiz.AtlasSintesis, r = Y && (Y.duelo ? Y.duelo(k, sello, 0) : Y.receta(k > 'd' ? 'pop' : 'eclosion', 0));
      return r && r.portadora ? r : null;
    }
    function pulso(o, d) {
      var Y = raiz.AtlasSintesis, F = (raiz.AtlasValores || {}).fluidez || {}, ms = vt - o.v, n = o.son;
      var e = n && Y ? Y.envolvente(n, ms / 1000) / n.gan : 0, fase = n && O.pulsoNota ? Q.q[0] + O.pulsoNota(n.portadora) * ms / 1000 : Q.q[0] * o.hz;
      var R = o.r * (0.5 + 0.5 * Math.sin(TAU * fase)) * (1 + 0.5 * d), ri = R * 0.7, ro = R * 1.15;
      g.strokeStyle = o.c; g.lineWidth = (1 - d) * 4 * dpr * (1 + (F.pulso_grosor_max || 0) * e);
      if (cal && e) { g.shadowColor = o.c; g.shadowBlur = (F.pulso_brillo_max || 0) * e * 40 * dpr; }
      g.beginPath(); g.arc(o.x, o.y, o.r * (0.6 + d * 1.2), 0, TAU); g.stroke(); g.shadowBlur = 0;
      if (!cal) { g.beginPath(); return; }
      g.lineWidth = Math.max(1, (1 - d) * 2 * dpr); g.beginPath();
      for (var i = 0; i < 12; i++) {
        var an = i / 12 * TAU + Q.q[3], c = Math.cos(an), s = Math.sin(an);
        g.moveTo(o.x + c * ri, o.y + s * ri); g.lineTo(o.x + c * ro, o.y + s * ro);
      }
      g.stroke();
    }
    // §6 accessibility: the screen reader reads the fight as text (round, troops alive, seals), never pixels.
    function anuncia() {
      var vivos = [0, 1].map(function (l) { return U[l].filter(function (u) { return u.vida > 0; }).length; });
      var sellos = todos.map(function (u) { return SELLO_TEXTO[selloDe(u, op)]; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
      var d = (op.ronda && ronda ? op.ronda.replace('{r}', ronda) + ' · ' : '') + 'left ' + vivos[1] + '/' + U[1].length + ' · right ' +
              vivos[0] + '/' + U[0].length + ' alive · ' + todos.map(function (u) { return arm(u, selloDe(u, op)).length; }).join('/') +
              ' harmonics · ' + sellos.join(' ');
      if (d !== dicho) { dicho = d; lienzo.setAttribute('role', 'img'); lienzo.setAttribute('aria-label', d); }
    }
    function pinta(ts, dt) {
      var W = lienzo.width, H = lienzo.height, t = quieto ? 0 : ts;
      g.clearRect(0, 0, W, H); mar(W, H, t);
      var cur = Math.floor(vt / EV), e = cur < ev.length ? ev[cur] : null, fase = (vt % EV) / EV;
      if (!quieto) { mueve(e, fase, dt, t); Q.avanza(); } else { todos.forEach(function (u) { u.x = u.hx; u.y = u.hy; }); }
      todos.forEach(function (u, idx) {
        var m = u.muere === null ? 1 : Math.max(0, 1 - (vt - u.muere) / 600);
        if (m <= 0) { return; }
        var dx = 0;
        if (!quieto && u.tiembla !== null && vt - u.tiembla < 260) { dx = Math.sin(vt * 0.12) * 4 * dpr * (1 - (vt - u.tiembla) / 260); }
        var gira = quieto ? 0 : t * 0.00045 * (1 + u.vel / 12) * (u.lado ? 1 : -1) * (acabado && u.vida ? 3 : 1), respira = quieto ? 1 : 1 + 0.035 * Math.sin(t * 0.002 + idx);
        var nota = O.pulsoNota ? O.pulsoNota((((raiz.AtlasValores || {}).sonidos || {}).pop || {}).f || 660) : 4, fo = u.flash * (1 + Math.sin(t * 0.002 * Math.PI * nota) * 0.5);
        E.figura(g, arm(u, selloDe(u, op)), u.x + dx, u.y, u.r, { color: u.color, giro: gira, alfa: m, grosor: 1.8 * dpr, brillo: cal ? u.brillo + fo * 18 * dpr : 0, t: t,
          desafina: Math.min(1, (1 - u.vida / u.max) * 0.8 + u.flash * 0.35), escala: respira * (0.4 + 0.6 * m), vidaFraccion: u.vida / u.max, arm: u.arm });
        if (cal && raiz.AtlasEscuadron) { raiz.AtlasEscuadron.pinta(g, u, { r: u.r, dpr: dpr, giro: gira, alfa: m, t: t, quieto: quieto }); }
        u.flash = Math.max(0, u.flash - 0.05);
        if (m === 1) { barra(u); }
      });
      if (!quieto && e && fase > 0.3 && fase < 0.75) { rastro(U[e[1]][e[2]], U[1 - e[1]][e[3]], fase, t); }
      ondas = ondas.filter(function (o) { return vt - o.v < 450; });
      ondas.forEach(function (o) { pulso(o, (vt - o.v) / 450); });
      chispas = chispas.filter(function (c) { return vt - c.v < 900; });
      chispas.forEach(function (c) { var d = vt - c.v; g.globalAlpha = 1 - d / 900; g.fillStyle = c.c; g.fillRect(c.x + c.vx * d, c.y + c.vy * d, 2 * dpr, 2 * dpr); });
      g.globalAlpha = 1;
      g.font = '700 ' + Math.round(15 * dpr) + 'px ui-monospace, monospace'; g.textAlign = 'center';
      pops = pops.filter(function (p) { return vt - p.v < 800; });
      pops.forEach(function (p) { var d = vt - p.v; g.globalAlpha = 1 - d / 800; g.fillStyle = p.c; g.fillText(p.txt, p.x, p.y - d * 0.04 * dpr); });
      g.globalAlpha = 1; g.fillStyle = texto;
      if (ronda && op.ronda) { g.fillText(op.ronda.replace('{r}', ronda), W / 2, 20 * dpr); }
      if (!cal) { g.font = '700 ' + Math.round(11 * dpr) + 'px ui-monospace, monospace'; g.fillText(T('rp_ahorro'), W / 2, 40 * dpr); }
      if (op.emulado != null) { g.font = '700 ' + Math.round(11 * dpr) + 'px ui-monospace, monospace'; g.fillText('COMBAT · EMULADO', W / 2, H - 8 * dpr); }
      if (acabado && op.letrero) {
        var l = op.letrero(combate), a2 = quieto ? 1 : Math.min(1, (vt - finVt) / 500);
        g.save(); g.globalAlpha = a2 * 0.72; g.fillStyle = N.ocean || texto; g.fillRect(0, H / 2 - 30 * dpr, W, 56 * dpr);
        g.globalAlpha = a2; g.fillStyle = l.color || texto;
        g.font = '700 ' + Math.round(Math.min(W / 8, 46 * dpr)) + 'px ui-monospace, monospace';
        g.fillText(l.texto, W / 2, H / 2 + 12 * dpr); g.restore();
      }
      anuncia();
    }
    function cuadro(ts) {
      if (!vivo) { return; }
      raf = raiz.requestAnimationFrame(cuadro);
      var visible = lienzo.offsetParent !== null && !raiz.document.hidden, dt = ultimo === null ? 16 : Math.min(100, ts - ultimo);
      ultimo = ts;
      if (!visible) { return; }
      mide();
      if (med) { med.cuadro(ts); }
      var m = raiz.AtlasCalidad && raiz.AtlasCalidad.modo;
      cal = m === 'luz' ? 0 : m && m !== 'auto' ? 1 : (med && !med.nivel(todos.length > 8 ? 1 : 2) ? 0 : 1);
      ev = combate.registro || ev;
      if (!acabado || !quieto) { vt += quieto ? 1e9 : dt * vel; }
      // Live (op.vivo: practice, worlds): the log grows tick by tick, so time never runs past its last event until a winner.
      if (op.vivo && combate.gana == null) { vt = Math.min(vt, ev.length * EV + EV * 0.99); }
      avanza(); pinta(ts, dt);
    }
    function reinicia() {
      todos.forEach(function (u) { u.vida = u.max; u.muere = null; u.flash = 0; u.tiembla = null; u.vx = u.vy = 0; });
      vt = 0; hechos = 0; acabado = false; pops = []; chispas = []; ondas = []; ronda = 0; Q = estado(op.semilla);
    }
    raf = raiz.requestAnimationFrame(cuadro);
    return {
      velocidad: function (v) { vel = v; },
      salta: function () {
        ev = combate.registro || ev;
        while (hechos < ev.length) { impacta(ev[hechos], false); hechos++; }
        vt = Math.max(vt, ev.length * EV + 801); pops = []; chispas = []; ondas = [];
      },
      otra: reinicia,
      para: function () { vivo = false; raiz.cancelAnimationFrame(raf); }
    };
  }

  raiz.AtlasWaveDuel = { escena: escena, TERMINOS: TERMINOS, estado: estado, selloDe: selloDe };
})(this);
