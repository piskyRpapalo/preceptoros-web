/* preceptoros.org · theGame · LA COREOGRAFIA de un combate ya resuelto: el registro hecho movimiento.

   EL RESULTADO NO SE TOCA (Soberano, 2026-10-05: «como ver una partida de Age of Empires repetida»).
   `arena.combate` ya decidio cada golpe con enteros y una semilla. Aqui no se decide nada: se pone en
   el mapa a quien ya golpeo, a quien ya cayo y cuando. La vida de cada tropa se recalcula SOLO desde
   el registro, con la misma regla que el motor (`porMil`), y por eso el ganador que se VE es siempre
   el que el registro dice (`ganadorVisual`, comprobado en `atlas/replay_casos.mjs`).

   LO QUE SI SE INVENTA, SE SIEMBRA. Las rocas, las bases, las formaciones y los rodeos salen de un
   generador sembrado con la semilla de la partida: misma partida, misma coreografia, en cualquier
   aparato, y su `hash` lo demuestra. Nada de azar del sistema ni de reloj. La simulacion solo usa
   sumas, productos, divisiones y raices (IEEE exactas): el mismo numero en cualquier motor.

   EL GUION. Marcha desde las bases; cada golpe del registro es un tramo: el que ataca avanza, dispara,
   el proyectil vuela y el golpe empuja. Los heridos retroceden, los caidos se quedan, los vivos se
   reagrupan. Al final, el que gana toma el campo y el que pierde vuelve a su base.

   Puro: sin DOM, sin red. En el navegador, `window.AtlasCoreografia`; en node, `module.exports`. */
(function (raiz) {
  'use strict';

  var W = 1000, H = 600, PASO = 50, MUESTRA = 100, MARCHA = 3000, FIN = 3600;

  /* El generador: mulberry32 sembrado con los primeros 32 bits de la semilla (hex). */
  function prng(hex) {
    if (!/^[0-9a-f]{16,}$/.test(hex || '')) { throw new Error('semilla: hex'); }
    var a = parseInt(hex.slice(0, 8), 16) | 0;
    return function () {
      a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function r1(x) { return Math.round(x); }
  function fnv(ints, base) {
    var h = base >>> 0;
    for (var i = 0; i < ints.length; i++) { h = Math.imul(h ^ (ints[i] & 0xffff), 16777619) >>> 0; h = Math.imul(h ^ (ints[i] >>> 16 & 0xffff), 16777619) >>> 0; }
    return ('0000000' + h.toString(16)).slice(-8);
  }

  /* El mapa: dos bases y unas rocas en la franja de en medio, todo sembrado. */
  function terreno(g) {
    var rocas = [], n = 4 + Math.floor(g() * 4);
    while (rocas.length < n) {
      var r = { x: 300 + g() * 400, y: 70 + g() * 460, r: 28 + g() * 42 };
      if (rocas.every(function (o) { var dx = o.x - r.x, dy = o.y - r.y; return Math.sqrt(dx * dx + dy * dy) > o.r + r.r + 40; })) { rocas.push(r); }
    }
    return { w: W, h: H, rocas: rocas, bases: [{ x: 915, y: 200 + g() * 200 }, { x: 85, y: 200 + g() * 200 }] };
  }

  /* LAS FORMACIONES del jugador (Soberano, 2026-10-05: «preajustes de estrategia y formacion que
     cambian la COREOGRAFIA… NO cambian el resultado del motor»). Solo mueven a SU bando en pantalla:
     cuanto se separa del frente, cuanto se lanza al atacar y si abre las alas. */
  var FORMAS = {
    agresiva: { sep: 45, lanza: 0.5, alas: 0, abre: 1 },
    defensiva: { sep: 125, lanza: 0.2, alas: 0, abre: 0.8 },
    flanqueo: { sep: 70, lanza: 0.35, alas: 90, abre: 1.6 }
  };
  var NORMAL = { sep: 75, lanza: 0.35, alas: 0, abre: 1 };

  /* `tropas`: [[{max, vel}...] defensa, [...] asalto]. `registro`: el de `arena.combate`.
     `pre` (opcional): { lado, formacion } -- la formacion elegida para el bando `lado`. */
  function coreografia(registro, tropas, semilla, gana, pre) {
    var forma = function (l) { return pre && pre.lado === l && FORMAS[pre.formacion] || NORMAL; };
    var g = prng(semilla), mapa = terreno(g), n = registro.length;
    var EV = Math.max(260, Math.min(700, Math.floor(42000 / Math.max(1, n))));
    var fin = MARCHA + n * EV, total = fin + FIN;
    var U = [0, 1].map(function (l) {
      return tropas[l].map(function (t, i) {
        var b = mapa.bases[l];
        return { lado: l, i: i, max: t.max, vida: t.max, vel: t.vel, x: b.x + (g() - 0.5) * 60, y: b.y + (g() - 0.5) * 120,
                 vx: 0, vy: 0, cae: null, masa: 1 + (t.inercia || 0) / 8, deriva: (g() - 0.5) * 40 };
      });
    });
    var todos = U[0].concat(U[1]), tiros = [], momentos = [{ t: 0, tipo: 'marcha' }], frames = [];
    /* Los tramos: cuando sale el tiro y cuando llega. */
    var tramos = registro.map(function (e, k) {
      var t0 = MARCHA + k * EV;
      return { e: e, t0: t0, sale: t0 + EV * 0.25, llega: t0 + EV * 0.6, hecho: false, salio: false };
    });
    function fraccion(l) {
      var v = 0, m = 0;
      U[l].forEach(function (u) { v += u.vida; m += u.max; });
      return m ? v / m : 0;
    }
    function frente() { return 500 + (fraccion(1) - fraccion(0)) * 240; }
    function objetivo(u, t, fx) {
      var vivos = U[u.lado].filter(function (x) { return !x.cae; }), j = vivos.indexOf(u), m = vivos.length;
      var lado = u.lado ? -1 : 1, fila = m > 4 ? (j % 2) * 40 : 0, F = forma(u.lado), off = (j - (m - 1) / 2);
      var tx = fx + lado * (F.sep + fila) - lado * (F.alas * Math.abs(off) / Math.max(1, m / 2));
      var ty = 300 + off * (m > 4 ? 42 : 70) * F.abre + u.deriva;
      if (t < MARCHA) { var p = t / MARCHA; tx = mapa.bases[u.lado].x * (1 - p) + tx * p; }
      if (u.vida < u.max * 0.35) { tx += lado * 90; }
      if (t >= fin) {
        var gl = gana === 'empate' ? -1 : gana === 'asalto' ? 1 : 0;
        if (u.lado === gl) { tx = fx - lado * 120; }
        else if (gl >= 0) { tx = mapa.bases[u.lado].x; ty = mapa.bases[u.lado].y + u.deriva * 2; }
      }
      return [tx, ty];
    }
    function paso(t) {
      var fx = frente(), act = null;
      tramos.forEach(function (s) { if (t >= s.t0 && t < s.t0 + EV * 0.5) { act = s; } });
      todos.forEach(function (u) {
        if (u.cae) { u.vx = 0; u.vy = 0; return; }
        var o = objetivo(u, t, fx), tx = o[0], ty = o[1];
        if (act && act.e[1] === u.lado && act.e[2] === u.i) {
          var b = U[1 - u.lado][act.e[3]], ln = forma(u.lado).lanza; tx += (b.x - u.x) * ln; ty += (b.y - u.y) * ln;
        }
        var dx = tx - u.x, dy = ty - u.y, d = Math.sqrt(dx * dx + dy * dy) || 1, vmax = (40 + u.vel * 7) * PASO / 1000 * (t >= fin ? 1.8 : 1);
        var ax = dx / d * Math.min(vmax, d) * 0.25, ay = dy / d * Math.min(vmax, d) * 0.25;
        mapa.rocas.forEach(function (r) {
          var rx = u.x - r.x, ry = u.y - r.y, rd = Math.sqrt(rx * rx + ry * ry) || 1, borde = r.r + 22;
          if (rd < borde + 30) { var k = (borde + 30 - rd) / 30; ax += rx / rd * k * 1.6 - ry / rd * k * 0.8 * (u.lado ? 1 : -1); ay += ry / rd * k * 1.6 + rx / rd * k * 0.8 * (u.lado ? 1 : -1); }
        });
        todos.forEach(function (v) {
          if (v === u || v.cae) { return; }
          var sx = u.x - v.x, sy = u.y - v.y, sd = Math.sqrt(sx * sx + sy * sy) || 1;
          if (sd < 30) { ax += sx / sd * (30 - sd) * 0.08; ay += sy / sd * (30 - sd) * 0.08; }
        });
        u.vx = (u.vx + ax / u.masa) * 0.8; u.vy = (u.vy + ay / u.masa) * 0.8;
        var sp = Math.sqrt(u.vx * u.vx + u.vy * u.vy);
        if (sp > vmax) { u.vx = u.vx / sp * vmax; u.vy = u.vy / sp * vmax; }
        u.x = Math.max(20, Math.min(W - 20, u.x + u.vx)); u.y = Math.max(20, Math.min(H - 20, u.y + u.vy));
      });
      tramos.forEach(function (s) {
        var a = U[s.e[1]][s.e[2]], b = U[1 - s.e[1]][s.e[3]];
        if (!s.salio && t >= s.sale) {
          s.salio = true;
          var fallo = s.e[4] < 0, ox = fallo ? (g() - 0.5) * 70 : 0, oy = fallo ? (g() - 0.5) * 70 : 0;
          tiros.push({ t0: s.sale, t1: s.llega, lado: s.e[1], de: s.e[2], a: s.e[3], dano: s.e[4],
                       x0: r1(a.x), y0: r1(a.y), x1: r1(b.x + ox), y1: r1(b.y + oy) });
        }
        if (!s.hecho && t >= s.llega) {
          s.hecho = true;
          if (s.e[4] < 0) { return; }
          if (!momentos.some(function (m) { return m.tipo === 'choque'; })) { momentos.push({ t: s.llega, tipo: 'choque' }); }
          b.vida = Math.max(0, b.vida - s.e[4]);
          var kx = b.x - a.x, ky = b.y - a.y, kd = Math.sqrt(kx * kx + ky * ky) || 1, f = Math.min(9, 2 + s.e[4] / 3) / b.masa;
          b.vx += kx / kd * f; b.vy += ky / kd * f;
          if (!b.vida && !b.cae) { b.cae = s.llega; momentos.push({ t: s.llega, tipo: 'cae', lado: b.lado, i: b.i }); }
        }
      });
    }
    for (var t = 0; t <= total; t += PASO) {
      paso(t);
      if (t % MUESTRA === 0) {
        var f = [];
        todos.forEach(function (u) { f.push(r1(u.x), r1(u.y), u.vida); });
        frames.push(f);
      }
    }
    momentos.push({ t: fin, tipo: 'fin' });
    var plano = [];
    frames.forEach(function (f) { plano.push.apply(plano, f); });
    tiros.forEach(function (s) { plano.push(s.t0, s.t1, s.x0, s.y0, s.x1, s.y1, s.dano + 1); });
    return { esquema: 'atlas.coreografia/1', semilla: semilla, formacion: pre && pre.formacion || null, mapa: mapa, total: total, fin: fin, ev: EV, muestra: MUESTRA,
             n: [U[0].length, U[1].length], max: todos.map(function (u) { return u.max; }), vel: todos.map(function (u) { return u.vel; }),
             frames: frames, tiros: tiros, momentos: momentos,
             hash: fnv(plano, 2166136261) + fnv(plano, 33554467) };
  }

  /* Lo que se VE al final: vivos y vida por bando, con la regla del motor (porMil). */
  function ganadorVisual(c) {
    var f = c.frames[c.frames.length - 1], vivos = [0, 0], v = [0, 0], m = [0, 0];
    c.max.forEach(function (mx, k) {
      var l = k < c.n[0] ? 0 : 1, vida = f[k * 3 + 2];
      if (vida > 0) { vivos[l]++; }
      v[l] += vida; m[l] += mx;
    });
    var pd = Math.floor(v[0] * 1000 / m[0]), pa = Math.floor(v[1] * 1000 / m[1]);
    return vivos[0] && !vivos[1] ? 'defensa' : vivos[1] && !vivos[0] ? 'asalto' : pd > pa ? 'defensa' : pa > pd ? 'asalto' : 'empate';
  }
  /* El centro de cada bando (vivos) en un fotograma: para comprobar quien toma el campo. */
  function centro(c, k) {
    var f = c.frames[k], s = [[0, 0], [0, 0]];
    c.max.forEach(function (mx, j) {
      var l = j < c.n[0] ? 0 : 1;
      if (f[j * 3 + 2] > 0) { s[l][0] += f[j * 3]; s[l][1]++; }
    });
    return s.map(function (x) { return x[1] ? x[0] / x[1] : null; });
  }

  var AtlasCoreografia = { FORMAS: Object.keys(FORMAS), coreografia: coreografia, ganadorVisual: ganadorVisual, centro: centro, prng: prng, MUNDO: { w: W, h: H } };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCoreografia; }
  else { raiz.AtlasCoreografia = AtlasCoreografia; }
})(this);
