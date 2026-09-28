/* preceptoros.org · theGame · LA VOZ EXACTA de cada tropa: los mismos bytes en cada aparato.

   POR QUE EXISTE. `core.js` hace sonar la onda con OscillatorNode, y eso basta para oirla; pero
   cada navegador sintetiza a su manera, asi que dos aparatos no dan los mismos bytes. Aqui la voz
   se calcula a mano, SOLO CON ENTEROS: una tabla de seno de Bhaskara (sin `Math.sin`, que no esta
   garantizado igual en cada motor), acumuladores de fase de 32 bits, FM con la receta de `vozDe`
   mas un parcial por armonico y una envolvente en Q16. Misma tropa, mismo PCM, en la web, en la
   app y en el rack. Por eso tiene HUELLA (sha256) y se puede verificar.

   EN PARTES DE 16 KB. El PCM (16 bits, 8 kHz, 1,2 s) se empaqueta como WAV y se parte en trozos
   de 16 KiB: el mismo tope de la casa, y el tamano que viaja o se guarda sin pedir permiso a nadie.

   SIN RED Y SIN FICHEROS. Nada se descarga: los bytes salen de los armonicos, que salen de la
   semilla firmada. En la pestana se carga al pulsar Escuchar (no en la puerta del juego: el peso
   del juego es una ley del mundo) y el service worker la guarda para el modo sin red. En node
   (`module.exports`) la usan la app y el rack para escribir la misma voz. */
(function (raiz) {
  'use strict';

  var RATE = 8000, DUR = 9600, PARTE = 16384, Q = 32767;
  var H = typeof module === 'object' && module.exports ? require('./atlas-coord.js') : raiz.AtlasCoord;

  /* Seno de Bhaskara I en enteros, 1024 pasos por vuelta: 16x(N-x) / (5N^2 - 4x(N-x)), N=512. */
  var SENO = new Int16Array(1024);
  for (var i = 0; i < 1024; i++) {
    var x = i % 512, p = x * (512 - x);
    var v = Math.floor(Q * 16 * p / (5 * 262144 - 4 * p));
    SENO[i] = i < 512 ? v : -v;
  }
  function inc(f) { return Math.floor(f * 4294967296 / RATE); }

  /* La receta entera, la misma idea que `vozDe` en core.js: portadora por el primer armonico,
     moduladora por cuantos tiene, indice por su amplitud. Y ademas, un parcial por armonico. */
  function receta(t) {
    var a = (t && t.armonicos) || [], amp = 0;
    if (!a.length) { return null; }
    a.forEach(function (h) { amp += Math.abs(h[1]) + Math.abs(h[2]); });
    var fc = 160 + 45 * (Math.abs(a[0][0]) % 12), fm = Math.round(fc * (1 + a.length / 4));
    var ind = Math.min(400, 20 + amp * 6);
    return { fc: fc, fm: fm,
             /* Desviacion de fase en unidades de 2^32 por unidad de la tabla: I/(2 pi) con pi = 355/113. */
             dev: Math.floor(Math.floor(ind / fm * 1000) * 4294967296 * 113 / (1000 * 2 * 355 * Q)),
             parciales: a.slice(1, 7).map(function (h) {
               var f = fc * Math.abs(h[0] || 1);
               return { inc: f < RATE / 2 ? inc(f) : 0, amp: Math.min(24, Math.abs(h[1])) };
             }),
             caida: 65536 - 3 - (amp % 5) };
  }

  function pcm(t) {
    var r = receta(t);
    if (!r) { return null; }
    var out = new Int16Array(DUR), pc = 0, pm = 0, ic = inc(r.fc), im = inc(r.fm), env = 65536;
    var fases = r.parciales.map(function () { return 0; }), suma = 24;
    r.parciales.forEach(function (p) { suma += p.amp; });
    for (var n = 0; n < DUR; n++) {
      var mod = SENO[pm >>> 22];
      var s = SENO[((pc + mod * r.dev) >>> 0) >>> 22] * 24;
      for (var k = 0; k < r.parciales.length; k++) {
        s += SENO[fases[k] >>> 22] * r.parciales[k].amp;
        fases[k] = (fases[k] + r.parciales[k].inc) >>> 0;
      }
      var ataque = n < 80 ? n * 819 : 65536;
      s = Math.floor(Math.floor(s / suma) * Math.floor(env * Math.min(ataque, 65536) / 65536) / 65536);
      out[n] = Math.max(-Q, Math.min(Q, Math.floor(s * 3 / 4)));
      pc = (pc + ic) >>> 0; pm = (pm + im) >>> 0;
      env = Math.floor(env * r.caida / 65536);
    }
    return out;
  }

  /* WAV mono 16 bits little-endian: 44 bytes de cabecera y el PCM. */
  function wav(m) {
    var b = new Uint8Array(44 + m.length * 2), d = new DataView(b.buffer);
    function txt(o, s) { for (var i = 0; i < s.length; i++) { b[o + i] = s.charCodeAt(i); } }
    txt(0, 'RIFF'); d.setUint32(4, 36 + m.length * 2, true); txt(8, 'WAVE'); txt(12, 'fmt ');
    d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, RATE, true); d.setUint32(28, RATE * 2, true); d.setUint16(32, 2, true);
    d.setUint16(34, 16, true); txt(36, 'data'); d.setUint32(40, m.length * 2, true);
    for (var i = 0; i < m.length; i++) { d.setInt16(44 + i * 2, m[i], true); }
    return b;
  }
  function partes(b) {
    var out = [];
    for (var o = 0; o < b.length; o += PARTE) { out.push(b.subarray(o, Math.min(b.length, o + PARTE))); }
    return out;
  }
  function hex(b) {
    var s = '';
    for (var i = 0; i < b.length; i++) { s += (b[i] < 16 ? '0' : '') + b[i].toString(16); }
    return s;
  }
  /* La huella: sha256 del WAV entero (el mismo en cada aparato), y su forma corta. */
  function huella(b) {
    var h = H.sha256(hex(b));
    return { hex: h, corta: '#' + h.slice(0, 4) + '…' + h.slice(-2) };
  }
  function voz(t) {
    var m = pcm(t);
    if (!m) { return null; }
    var b = wav(m);
    return { rate: RATE, muestras: m.length, bytes: b.length, partes: partes(b).map(function (x) { return x.length; }),
             huella: huella(b), wav: b, pcm: m };
  }

  /* En la pestana: suena por el contexto de audio que ya abrio el interruptor de sonido (core.js).
     Sin contexto (sonido apagado o sin Web Audio), no suena y lo dice quien llama. */
  function oye(t, ctx) {
    var v = voz(t);
    if (!v || !ctx) { return null; }
    var buf = ctx.createBuffer(1, v.muestras, RATE), c = buf.getChannelData(0);
    for (var i = 0; i < v.muestras; i++) { c[i] = v.pcm[i] / 32768; }
    var s = ctx.createBufferSource();
    s.buffer = buf; s.connect(ctx.destination); s.start();
    return v;
  }

  var AtlasVoz = { RATE: RATE, PARTE: PARTE, receta: receta, pcm: pcm, wav: wav, partes: partes, huella: huella,
                   voz: voz, oye: oye };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasVoz; }
  else { raiz.AtlasVoz = AtlasVoz; }
})(this);
