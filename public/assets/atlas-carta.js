/* preceptoros.org · theGame · LA CARTA: el mundo abierto, sin pintar nada.

   PURO. Ni DOM, ni red, ni reloj, ni azar, ni almacen: el mismo estado da el mismo mundo, la
   misma niebla y las mismas ondas, en la pestana, en node y en el rack. Por eso la vista
   (`atlas-mapa.js`) puede cambiar entera sin mover un dato, y un agente puede razonar sobre el
   mundo sin haber visto el lienzo.

   UN MUNDO PARA TODOS. Corte vertical del Bosque Sumergido: el eje x da la vuelta (256
   unidades, sin bordes), el eje y es la profundidad (0 superficie, 100 abismo), y las cuatro
   bandas del motor son franjas de esa profundidad. El relieve sale de una semilla FIJA: todas
   las personas bucean el mismo fondo. Lo que cambia es TU NODO, que se ancla al fondo en un
   punto derivado de tu clave publica, y TU NIEBLA, que es una funcion de tu partida.

   LA LEY DE LA NIEBLA (una sola, aqui; nadie la guarda: se recalcula de la instantanea):
     - el poblado (los cinco sectores) alumbra un radio que crece con la fase;
     - la profundidad visible llega a la banda que la fase permite, o a la tuya si bajaste mas;
     - tu nodo alumbra su vecindad;
     - desde la fase 3, el cable de tu nodo al Nucleo se entrevé; desde la 4, se ve;
     - la grieta abierta brilla a traves de la niebla.
   0 = nunca visto, 1 = entrevisto, 2 = a la vista. Sube con la fase y nunca baja con ella.

   LOS NODOS AJENOS son NO_DATA: la web no llama a ningun servidor, asi que no sabe de nadie. */
(function (raiz) {
  'use strict';

  var H = typeof module === 'object' && module.exports ? require('./atlas-coord.js') : raiz.AtlasCoord;

  var ANCHO = 256, HONDO = 100, SEMILLA = 1987, CELDA = 4;
  var COLS = ANCHO / CELDA, FILAS = HONDO / CELDA;
  /* Las cuatro bandas del motor, como franjas [desde, hasta) de profundidad. */
  var BANDAS = [['0-50', 0, 22], ['50-150', 22, 48], ['150-300', 48, 76], ['300+', 76, HONDO]];
  var SECTORES = { forja: 66, grieta: 102, nucleo: 128, aguja: 154, ojo: 184 };
  var ALCANCE = [48, 76, HONDO, HONDO, HONDO];

  /* Un entero a [0,1) con dos entradas: el azar sin azar. */
  function h32(a, b) {
    var t = Math.imul(a ^ 0x9E3779B9, 0x85EBCA6B) ^ Math.imul((b | 0) + 0x632BE5AB, 0xC2B2AE35);
    t ^= t >>> 15; t = Math.imul(t, 0x2C1B3C6D); t ^= t >>> 12; t = Math.imul(t, 0x297A2D39);
    return ((t ^ (t >>> 15)) >>> 0) / 4294967296;
  }
  function vuelta(x) { return ((x % ANCHO) + ANCHO) % ANCHO; }
  /* Distancia horizontal con signo por el camino corto: el mundo da la vuelta. */
  function dx(a, b) { var d = vuelta(b - a); return d > ANCHO / 2 ? d - ANCHO : d; }

  /* Ruido de valor periodico: cierra sobre si mismo en ANCHO, sin costura. */
  function ruido(x, per, s) {
    var i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    var a = h32(s, ((i % per) + per) % per), b = h32(s, (((i + 1) % per) + per) % per);
    return a + (b - a) * u;
  }
  function relieve(x) {
    var v = 0, amp = 1, tot = 0;
    for (var o = 0; o < 4; o++) {
      var per = 6 << o;
      v += amp * ruido(vuelta(x) / ANCHO * per, per, SEMILLA + o);
      tot += amp; amp *= 0.5;
    }
    return v / tot;
  }
  /* La profundidad del fondo en x: una plataforma rugosa a media agua, dos arrecifes que suben
     a la luz (Forja y Ojo) y la fosa del Nucleo. El agua ocupa el lienzo; la roca, lo justo. */
  function campana(x, c, w) { var d = dx(c, x) / w; return Math.exp(-d * d); }
  function suelo(x) {
    return Math.max(8, Math.min(HONDO - 4, 34 + 26 * relieve(x) + 56 * campana(x, SECTORES.nucleo, 22)
      - 26 * campana(x, SECTORES.forja, 12) - 26 * campana(x, SECTORES.ojo, 12)));
  }
  function banda(y) {
    for (var i = 0; i < BANDAS.length; i++) { if (y < BANDAS[i][2]) { return i; } }
    return BANDAS.length - 1;
  }

  /* TU NODO, de tu clave publica (hex). Cae fuera del poblado, en el anillo exterior, para
     que llegar a el sea explorar. Sin clave, null: la vista lo dice, no lo inventa. */
  function nodo(pub) {
    if (typeof pub !== 'string' || !/^[0-9a-f]{16,}$/i.test(pub)) { return null; }
    var h = parseInt(pub.slice(0, 8), 16) >>> 0, desde = SECTORES.ojo + 28;
    var largo = ANCHO - (desde - SECTORES.forja) - 28;
    var x = vuelta(desde + h % largo);
    return { id: pub.slice(0, 8).toLowerCase(), pub: pub.toLowerCase(), x: x, y: suelo(x),
             /* Solarpunk sin saturar: del oro al verde azulado, nunca un neon. */
             tono: 42 + (parseInt(pub.slice(8, 10), 16) % 140),
             semilla: parseInt(pub.slice(10, 18), 16) >>> 0 };
  }

  function niebla(ins, nd) {
    var f = Math.min(5, Math.max(1, (ins && ins.fase) || 1));
    var b = -1;
    for (var i = 0; ins && i < BANDAS.length; i++) { if (BANDAS[i][0] === ins.profundidad) { b = i; } }
    var R = 22 + 16 * f, L = Math.max(ALCANCE[f - 1], b >= 0 ? BANDAS[b][2] : 0);
    var abierta = !!(ins && ins.grieta && ins.grieta.abierta);
    var arco = nd ? dx(nd.x, SECTORES.nucleo) : 0, m = new Uint8Array(COLS * FILAS);
    for (var r = 0; r < FILAS; r++) {
      for (var c = 0; c < COLS; c++) {
        var x = c * CELDA + CELDA / 2, y = r * CELDA + CELDA / 2, v = 0;
        var d = Math.abs(dx(SECTORES.nucleo, x));
        if (d <= R && y <= L) { v = 2; } else if (d <= R + 20 && y <= L + 14) { v = 1; }
        if (nd) {
          var dn = Math.hypot(dx(nd.x, x), y - nd.y);
          if (dn <= 12) { v = 2; } else if (dn <= 20 && v < 1) { v = 1; }
          var u = dx(nd.x, x) / (arco || 1);
          if (f >= 3 && u >= 0 && u <= 1 && Math.abs(y - suelo(x)) <= 7) { v = Math.max(v, f >= 4 ? 2 : 1); }
        }
        if (abierta && Math.hypot(dx(SECTORES.grieta, x), y - suelo(SECTORES.grieta)) <= 10) { v = 2; }
        m[r * COLS + c] = v;
      }
    }
    return m;
  }
  /* La niebla de una posicion del mundo (para la vista y para un agente). */
  function vista(m, x, y) {
    var c = Math.floor(vuelta(x) / CELDA), r = Math.min(FILAS - 1, Math.max(0, Math.floor(y / CELDA)));
    return m[r * COLS + c];
  }

  /* LAS ONDAS: cada tropa es una voz; cada voz, una helice de dos hebras. Los armonicos de la
     tropa ([frecuencia, ampX, ampY, fase/64], de la semilla firmada) fijan su forma entera: dos
     tropas no se trenzan igual, y la misma tropa se trenza igual en cualquier pantalla. Sin
     tropas, suena tu nodo con su semilla. Todo en unidades del mundo; el tiempo lo pone la vista. */
  function helices(nd, tropas) {
    var voces = [];
    (tropas || []).slice(0, 6).forEach(function (t, k) {
      var a = (t && t.armonicos) || [];
      if (!a.length) { return; }
      voces.push({ terminos: a.slice(0, 7).map(function (h) {
        return { k: Math.abs(h[0]) || 1, amp: (h[1] + h[2]) / 48, fase: (h[3] || 0) / 64 * 6.2832 };
      }), vel: 0.4 + 0.15 * (a.length % 5) + 0.05 * k, giro: 0.6 + (a[1] ? a[1][3] % 7 : k) * 0.12,
          tono: [35, 140, 275, 190][(a.length + k) % 4] });
    });
    if (!voces.length && nd) {
      for (var k = 0; k < 3; k++) {
        var s = nd.semilla + k * 7919, ts = [];
        for (var j = 0; j < 4; j++) {
          ts.push({ k: 1 + j * (1 + Math.floor(h32(s, j) * 3)), amp: 1 / (j + 1),
                    fase: h32(s, j + 9) * 6.2832 });
        }
        voces.push({ terminos: ts, vel: 0.3 + h32(s, 20) * 0.6, giro: 0.5 + h32(s, 21), tono: nd.tono });
      }
    }
    return voces;
  }
  /* La altura (de -1 a 1, aprox.) de una voz en u (0..1 a lo largo de la base) y tiempo t (s).
     Tres hebras por voz, a un tercio de vuelta: una helice triple, no un espejo. */
  function onda(v, u, t, hebra) {
    var y = 0, n = 0;
    v.terminos.forEach(function (h) {
      y += h.amp * Math.sin(6.2832 * h.k * u - t * v.vel * h.k + h.fase + hebra * 2.0944);
      n += h.amp;
    });
    return (y / (n || 1)) * (0.6 + 0.4 * Math.cos(t * v.giro * 0.5 + u * 3.1416));
  }

  /* LAS RAICES de tu nodo: bajan por la roca y ramifican con su semilla. Por ellas sube lo que
     el nodo farmea. Segmentos [x0, y0, x1, y1, generacion], de la base hacia abajo. */
  function raices(nd) {
    var out = [], pila = [];
    if (!nd) { return out; }
    for (var k = 0; k < 3; k++) { pila.push([nd.x, nd.y + 1, 1.57 + (k - 1) * 0.55, 9, 0]); }
    while (pila.length && out.length < 60) {
      var r = pila.shift(), i = out.length, a = r[2] + (h32(nd.semilla, i) - 0.5) * 0.9;
      var x = r[0] + Math.cos(a) * r[3], y = Math.min(HONDO - 1, r[1] + Math.sin(a) * r[3]);
      out.push([r[0], r[1], x, y, r[4]]);
      if (r[4] < 4 && y < HONDO - 3) {
        pila.push([x, y, a - 0.35, r[3] * 0.78, r[4] + 1]);
        if (h32(nd.semilla, i + 500) > 0.4) { pila.push([x, y, a + 0.4, r[3] * 0.7, r[4] + 1]); }
      }
    }
    return out;
  }

  /* La coordenada criptografica vive en `atlas-coord.js` (se partio el 2026-09-28: con SHA-256
     dentro, esta pieza pasaba de 16 KiB; el hash es otro asunto y otro dueno puede reusarlo). */
  function coord(pub, sector, x, y) { return H.coord(pub, SEMILLA, sector, x, y); }
  function sectorDe(x) {
    var mejor = 'abierto', d = 12;
    Object.keys(SECTORES).forEach(function (k) {
      var e = Math.abs(dx(SECTORES[k], x));
      if (e < d) { d = e; mejor = k; }
    });
    return mejor;
  }

  /* EXPLORACION REAL. Lo que la partida VIO, no lo que la fase de hoy permite: la union de la
     niebla de cada estado por el que paso, resumido en visitas "fase|banda|grieta" (a lo sumo
     5 x 4 x 2 = 40). Sale de reproducir la partida (`AtlasPartida.reproduce` con `cada`), asi
     que no se guarda aparte ni puede contradecir a la partida. */
  function visita(ins) {
    return ins ? [ins.fase || 1, ins.profundidad, ins.grieta && ins.grieta.abierta ? 1 : 0].join('|') : null;
  }
  function exploracion(visitas, nd) {
    var m = new Uint8Array(COLS * FILAS);
    (visitas || []).forEach(function (v) {
      var p = String(v).split('|'), n = niebla({ fase: +p[0], profundidad: p[1], grieta: { abierta: p[2] === '1' } }, nd);
      for (var i = 0; i < m.length; i++) { if (n[i] > m[i]) { m[i] = n[i]; } }
    });
    return m;
  }
  /* PELIGRO de una celda: 2 junto a la grieta abierta; 1 en 300 m+ sin Ingenieria 60 (el motor
     no deja bajar); 0 en lo demas. Solo lo que el motor sabe. */
  function peligro(ins, x, y) {
    if (ins && ins.grieta && ins.grieta.abierta &&
        Math.hypot(dx(SECTORES.grieta, x), y - suelo(SECTORES.grieta)) <= 10) { return 2; }
    var ing = ins && ins.niveles ? ins.niveles.ingenieria : 0;
    return banda(y) === 3 && ing < 60 ? 1 : 0;
  }
  function celda(c, r, ins, nd, exp) {
    var x = c * CELDA + CELDA / 2, y = r * CELDA + CELDA / 2, i = r * COLS + c;
    return { c: c, r: r, x: x, y: y, niebla: niebla(ins, nd)[i], explorado: exp ? exp[i] > 0 : null,
             campamento: !!nd && Math.floor(nd.x / CELDA) === c && Math.floor(nd.y / CELDA) === r,
             peligro: peligro(ins, x, y), coord: nd ? coord(nd.pub, sectorDe(x), x, y).corta : null };
  }

  /* EDIFICIOS Y UNIDADES: primero el dato, despues el dibujo. Cada edificio dice su estado y su
     accion LEGAL segun el motor (o null con causa); el mapa solo la ofrece, la persona la pulsa. */
  var BAJA = { forja: 'arrecife', grieta: 'ruinas', aguja: 'bosque', nucleo: 'nucleo' };
  function estructuras(ins, nd) {
    var out = [], ing = ins && ins.niveles ? ins.niveles.ingenieria : 0, g = (ins && ins.grieta) || {};
    Object.keys(SECTORES).forEach(function (k) {
      var x = SECTORES[k], acc = null, causa = null;
      /* Sin instantanea no se sabe nada: ni si la grieta esta abierta ni que nivel hay. NO_DATA. */
      if (!ins) { causa = 'sin instantanea'; }
      else if (k === 'grieta') { if (g.abierta) { acc = { accion: 'reparar' }; } else { causa = 'sellada'; } }
      else if (k === 'ojo') { causa = 'observatorio: sin accion en el motor'; }
      else if (k === 'nucleo' && ing < 60) { causa = 'ingenieria ' + ing + ' < 60'; }
      else if (ins && BANDAS[['arrecife', 'ruinas', 'bosque', 'nucleo'].indexOf(BAJA[k])][0] === ins.profundidad) {
        causa = 'ya estas aqui';
      } else { acc = { accion: 'bajar_a', banda: BAJA[k] }; }
      out.push({ id: k, tipo: k === 'nucleo' || k === 'forja' || k === 'aguja' || k === 'ojo' ? 'grande' : 'grieta',
                 x: x, y: Math.round(suelo(x)), accion: acc, causa: acc ? null : causa,
                 estado: k === 'nucleo' && ins ? { integridad: ins.integridad, integridad_max: ins.integridad_max,
                   nivel: ins.nivel_nucleo, fase: ins.fase } : k === 'grieta' ? { abierta: !!g.abierta, cierre: g.cierre } : null });
    });
    if (nd) {
      out.push({ id: 'base', tipo: 'campamento', x: nd.x, y: Math.round(nd.y), coord: coord(nd.pub, 'base', nd.x, nd.y).corta,
                 accion: ins && ins.pendiente_ciclos > 0 ? { accion: 'recoger' } : null,
                 causa: ins && ins.pendiente_ciclos > 0 ? null : 'nada que recoger',
                 estado: ins ? { flujo: ins.recursos.flujo, biomasa: ins.recursos.biomasa } : null });
    }
    return out;
  }
  function unidades(tropas) {
    return (tropas || []).map(function (t) {
      return { tc: t.tc, rareza: t.rareza, semilla: String(t.semilla || '').slice(0, 8), en: 'base' };
    });
  }
  /* VECINDAD POR XOR (estilo Kademlia): los bits en comun del prefijo de dos ids. Es la regla de
     por que veras a unos vecinos y no a otros, el dia que exista un canal firmado y opt-in. Hoy
     no hay de quien: NO_DATA. */
  function vecindad(a, b) {
    for (var i = 0; i < Math.min(a.length, b.length); i++) {
      var x = parseInt(a[i], 16) ^ parseInt(b[i], 16);
      if (x) { return i * 4 + Math.clz32(x) - 28; }
    }
    return Math.min(a.length, b.length) * 4;
  }

  /* LO QUE LEE UN AGENTE. El mundo, tu nodo y tu niebla en un JSON cerrado, y como se juega:
     la instantanea que lee (`atlas.instantanea/1`) y las acciones que acepta el motor. */
  function estado(ins, nd, tropas, visitas) {
    var m = niebla(ins, nd), n = [0, 0, 0], ex = visitas ? exploracion(visitas, nd) : null;
    for (var i = 0; i < m.length; i++) { n[m[i]]++; }
    var sec = {};
    Object.keys(SECTORES).forEach(function (k) {
      var x = SECTORES[k], y = Math.round(suelo(x));
      sec[k] = { x: x, y: y, banda: BANDAS[banda(y)][0], niebla: vista(m, x, y) };
    });
    return {
      esquema: 'atlas.carta/1', semilla_mundo: SEMILLA, ancho: ANCHO, hondo: HONDO,
      bandas: BANDAS.map(function (b) { return { etiqueta: b[0], desde: b[1], hasta: b[2] }; }),
      sectores: sec,
      nodo: nd ? { id: nd.id, coord: coord(nd.pub, 'base', nd.x, nd.y).corta, x: nd.x, y: Math.round(nd.y),
                   voces: helices(nd, tropas).length }
        : { valor: null, causa: 'sin identidad en este dispositivo' },
      nodos_ajenos: { valor: null, causa: 'la web no llama a ningun servidor' },
      niebla: { oculta: n[0], entrevista: n[1], vista: n[2], celda: CELDA,
                filas: Array.apply(null, Array(FILAS)).map(function (_, r) {
                  return Array.prototype.join.call(m.subarray(r * COLS, (r + 1) * COLS), ''); }) },
      explorado: ex ? { celdas: ex.reduce(function (s, v) { return s + (v > 0); }, 0), visitas: visitas.length }
        : { valor: null, causa: 'sin partida que reproducir' },
      estructuras: estructuras(ins, nd), unidades: unidades(tropas),
      juego: { lee: 'atlas.instantanea/1', acciones: ['esperar', 'recoger', 'reparar', 'aplazar',
               'bajar_a', 'invocar'], esquema_accion: 'atlas.accion/1',
               juez: 'contrafactual, 300 ciclos, nucleo > fase > integridad_min > xp' },
      instantanea: ins || null
    };
  }

  var AtlasCarta = { ANCHO: ANCHO, HONDO: HONDO, CELDA: CELDA, COLS: COLS, FILAS: FILAS,
    SEMILLA: SEMILLA, BANDAS: BANDAS, SECTORES: SECTORES, h32: h32, vuelta: vuelta, dx: dx,
    suelo: suelo, banda: banda, nodo: nodo, niebla: niebla, vista: vista, helices: helices,
    onda: onda, raices: raices, estado: estado, coord: coord, sectorDe: sectorDe,
    visita: visita, exploracion: exploracion, peligro: peligro, celda: celda, estructuras: estructuras,
    unidades: unidades, vecindad: vecindad };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCarta; }
  else { raiz.AtlasCarta = AtlasCarta; }
})(this);
