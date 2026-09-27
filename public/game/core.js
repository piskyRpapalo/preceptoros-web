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
    return {
      tipo: tipo,
      portadora: Math.round(b.f * (1 - 0.25 * c)),
      moduladora: Math.round(b.f * b.m * (1 - 0.25 * c)),
      indice: Math.round(b.indice * (1 + 2 * c)),
      dur: b.dur, gan: b.gan
    };
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

  function suena(tipo, calor) {
    var r = receta(tipo, calor);
    if (!activo || !ctx || !r) { return null; }
    var t = ctx.currentTime;
    var car = ctx.createOscillator(), mod = ctx.createOscillator();
    var prof = ctx.createGain(), sal = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine';
    car.frequency.value = r.portadora; mod.frequency.value = r.moduladora;
    prof.gain.value = r.indice;
    sal.gain.setValueAtTime(r.gan, t);
    sal.gain.exponentialRampToValueAtTime(0.0001, t + r.dur);
    mod.connect(prof); prof.connect(car.frequency);
    car.connect(sal); sal.connect(ctx.destination);
    car.start(t); mod.start(t); car.stop(t + r.dur); mod.stop(t + r.dur);
    return r;
  }

  var AtlasSintesis = { BASE: BASE, receta: receta, calorDe: calorDe, activa: activa, suena: suena };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasSintesis; }
  else { raiz.AtlasSintesis = AtlasSintesis; }
})(this);
