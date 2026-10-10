/* preceptoros.org · theGame v1.5 · SINTESIS: el sonido sale de ondas, no de
   ficheros.

   CERO MP3. Cada sonido son dos OscillatorNode de tipo seno: una portadora y
   una moduladora que le cambia la frecuencia (sintesis FM). La receta de cada
   sonido es una funcion PURA (`receta`) que se prueba en node; el navegador
   solo la toca.

   APAGADO POR DEFECTO y solo tras un gesto de la persona: un juego que suena
   sin pedirlo es un juego que se cierra, y el navegador ademas lo bloquea.

   EL CALOR MODULA EL SONIDO. La directiva habla de `nodeTemperature`, la
   temperatura del silicio; un navegador no la puede leer y eso es NO_DATA.
   Lo que si hay, medido por el motor, es la PRESION del Nucleo:
   calor = 1 - integridad / integridad_max. Cuanto mas sufre el Nucleo, mas
   aspero suena (indice FM mayor y portadora mas grave). Se dice lo que es. */
(function (raiz) {
  'use strict';

  /* Frecuencias en Hz, duraciones en segundos. `indice` es la profundidad de
     la modulacion en Hz. Enteros y fracciones fijas: misma entrada, misma
     receta. */
  var V = (typeof module === 'object' && module.exports) ? require('./valores.js') : raiz.AtlasValores;
  var BASE = V.sonidos;

  function receta(tipo, calor) {
    var b = BASE[tipo];
    if (!b) { return null; }
    var c = Math.max(0, Math.min(1, Number(calor) || 0));
    var r = {
      tipo: tipo,
      portadora: Math.round(b.f * (1 - 0.25 * c)),
      moduladora: Math.round(b.f * b.m * (1 - 0.25 * c)),
      indice: Math.round(b.indice * (1 + 2 * c)),
      dur: b.dur, gan: b.gan
    }, I = V.sintesis;
    /* M17-bis 3: en modo 'fm3_adsr' la receta lleva su envolvente y una SEGUNDA moduladora. */
    if (I && I.modo === 'fm3_adsr') {
      r.adsr = I.adsr.slice();
      r.moduladora2 = Math.round(r.portadora * I.m2);
      r.indice2 = Math.round(r.indice * I.indice2);
    }
    /* M17-bis 4: la urgencia sale del SELLO del evento, no de un capricho del sonido. */
    var u = I && I.sello && I.urgencia ? (I.urgencia[I.sello[tipo]] || 0) : 0;
    if (u > 0) { r.vibrato = { hz: I.vibrato_hz, prof: Math.round(r.portadora * I.vibrato_prof * u) }; }
    return r;
  }

  /* LA ENVOLVENTE, pura: la ganancia del sonido en el segundo t. La usa `suena` para programar el
     volumen y la usa el pulso del golpe (wave_render) para dibujarse: una curva, dos sentidos.
     Sin adsr es la rampa de siempre (gan -> 0,0001 en dur); con adsr, ataque-caida-sostenido-relajacion. */
  function envolvente(r, t) {
    if (!r || t < 0 || t >= r.dur) { return 0; }
    if (!r.adsr) { return r.gan * Math.pow(0.0001 / r.gan, t / r.dur); }
    var a = r.adsr[0], d = r.adsr[1], s = r.adsr[2], rel = r.adsr[3], fin = r.dur - rel;
    if (t < a) { return r.gan * t / a; }
    if (t < a + d) { return r.gan * (1 - (1 - s) * (t - a) / d); }
    if (t < fin) { return r.gan * s; }
    return r.gan * s * (1 - (t - fin) / rel);
  }

  /* El calor que si se puede medir: la presion del Nucleo en la instantanea. */
  function calorDe(ins) {
    if (!ins || !ins.integridad_max) { return 0; }
    return 1 - ins.integridad / ins.integridad_max;
  }

  var ctx = null, activo = false;
  function activa(si) {
    activo = !!si;
    if (activo && !ctx) {
      var C = raiz.AudioContext || raiz.webkitAudioContext;
      if (!C) { activo = false; return false; }
      ctx = new C();
    }
    if (ctx && ctx.state === 'suspended') { ctx.resume(); }
    return activo;
  }

  /* LA VOZ DE UNA ONDA (2026-09-28): cada tropa suena distinta y siempre igual. La receta sale de
     sus armonicos, que ya salen de la semilla firmada: sin azar, dos ondas se distinguen de oido y
     la misma onda suena igual en cada carga. Portadora por el primer armonico, moduladora por
     cuantos tiene, profundidad por su amplitud. Corto y bajo: identidad, no musica. */
  function vozDe(t) {
    var a = (t && t.armonicos) || [], amp = 0;
    if (!a.length) { return null; }
    a.forEach(function (h) { amp += Math.abs(h[1]) + Math.abs(h[2]); });
    var f = 160 + 45 * (Math.abs(a[0][0]) % 12);
    return { tipo: 'onda', portadora: f, moduladora: Math.round(f * (1 + a.length / 4)),
             indice: Math.min(400, 20 + amp * 6), dur: 0.5, gan: 0.07 };
  }
  function suena(tipo, calor) {
    var r = typeof tipo === 'object' ? tipo : receta(tipo, calor);
    if (!activo || !ctx || !r) { return null; }
    var t = ctx.currentTime;
    var car = ctx.createOscillator(), mod = ctx.createOscillator();
    var prof = ctx.createGain(), sal = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine';
    car.frequency.value = r.portadora; mod.frequency.value = r.moduladora;
    prof.gain.value = r.indice;
    if (r.adsr) {
      var A = r.adsr, fin = t + r.dur - A[3];
      sal.gain.setValueAtTime(0, t);
      sal.gain.linearRampToValueAtTime(r.gan, t + A[0]);
      sal.gain.linearRampToValueAtTime(r.gan * A[2], t + A[0] + A[1]);
      sal.gain.setValueAtTime(r.gan * A[2], fin);
      sal.gain.linearRampToValueAtTime(0, t + r.dur);
    } else {
      sal.gain.setValueAtTime(r.gan, t);
      sal.gain.exponentialRampToValueAtTime(0.0001, t + r.dur);
    }
    mod.connect(prof); prof.connect(car.frequency);
    if (r.moduladora2) {
      /* La segunda moduladora, CONECTADA (la joya del mockup creaba dos y no conectaba ninguna). */
      var mod2 = ctx.createOscillator(), prof2 = ctx.createGain();
      mod2.type = 'sine'; mod2.frequency.value = r.moduladora2; prof2.gain.value = r.indice2;
      mod2.connect(prof2); prof2.connect(car.frequency);
      mod2.start(t); mod2.stop(t + r.dur);
    }
    if (r.vibrato) {
      var lfo = ctx.createOscillator(), vib = ctx.createGain();
      lfo.type = 'sine'; lfo.frequency.value = r.vibrato.hz; vib.gain.value = r.vibrato.prof;
      lfo.connect(vib); vib.connect(car.frequency);
      lfo.start(t); lfo.stop(t + r.dur);
    }
    car.connect(sal); sal.connect(ctx.destination);
    car.start(t); mod.start(t); car.stop(t + r.dur); mod.stop(t + r.dur);
    return r;
  }

  /* El contexto abierto por el interruptor, para la voz exacta (`atlas-voz.js`); apagado, null. */
  function contexto() { return activo ? ctx : null; }
  var AtlasSintesis = { BASE: BASE, receta: receta, envolvente: envolvente, calorDe: calorDe, activa: activa, suena: suena, vozDe: vozDe,
                        contexto: contexto };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSintesis; }
  else { raiz.AtlasSintesis = AtlasSintesis; }
})(this);
