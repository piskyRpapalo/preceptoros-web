/* preceptoros.org · theGame · LA RADIO DEL ESTADO (J2 + J9, plan de ronda firmado 2026-10-11).

   LA MELODIA ES EL ESTADO. Cinco notas sin semitonos (pentatonica mayor: 0, 2, 4, 7 y 9 semitonos
   sobre 220 Hz): cualquier combinacion suena bien, asi que el estado puede sonar tal cual es. Cada nota
   sale de una cifra de la instantanea (integridad, cobre, biomasa, luz, oxigeno, fase, nucleo, grieta):
   misma partida, misma melodia, y su huella lo prueba. Suena por la MISMA sintesis FM de core.js
   (`AtlasSintesis.suena` con una receta): ni un fichero de audio, ni una red.

   EL LOCUTOR (J9) ES UN PERSONAJE: lee un boletin hecho SOLO con la instantanea (lo que lee la guia,
   GUIA_CONTRATO.md), sin inventar: un dato que falta es NO_DATA. Narra; nunca decide ni propone. Habla
   solo con voces LOCALES del sistema (`localService`); si no hay ninguna, lo dice y el boletin queda en
   texto. Grave y despacio, como la radio de los anos 40, hecho con codigo.

   EL AUDIO NUNCA ES IMPRESCINDIBLE: el boletin se lee siempre en texto, y nada suena hasta el gesto de
   la persona (el interruptor de siempre). AI Act art. 50 en el nombre: transparencia, el estado dicho
   tal cual. Sin red, sin almacen, sin azar; el reloj solo separa las notas. */
(function (raiz) {
  'use strict';
  var K = (typeof module === 'object' && module.exports) ? require('./canon.js') : raiz.AtlasCanon;
  var BASE_HZ = 220, PENTA = [0, 2, 4, 7, 9], PASO_MS = 300;

  function nota(grado, octava) {
    var g = ((grado % 5) + 5) % 5, o = Math.max(0, Math.min(2, octava));
    return Math.round(BASE_HZ * Math.pow(2, o + PENTA[g] / 12) * 100) / 100;
  }
  /* El guion sonoro de una instantanea: ocho notas, cada una de una cifra. Puro. */
  function guion(i) {
    if (!i || i.esquema !== 'atlas.instantanea/1' || !i.recursos) { return null; }
    var r = i.recursos, pct = i.integridad_max ? Math.round(i.integridad * 100 / i.integridad_max) : 0;
    var cifras = [pct, r.cobre, r.biomasa, r.luz, r.oxigeno, i.fase, i.nivel_nucleo, i.grieta && i.grieta.abierta ? 1 : 0];
    return cifras.map(function (v, k) { var n = Math.abs(Math.floor(Number(v) || 0)); return nota(n + k, Math.floor(n / 50) % 3); });
  }
  /* El boletin: solo lo que dice la instantanea. Lo que falta, NO_DATA. Puro. */
  function boletin(i) {
    if (!i || i.esquema !== 'atlas.instantanea/1') { return 'Radio Atlantis. NO_DATA: no game is running yet.'; }
    var r = i.recursos || {}, d = function (v) { return v === undefined || v === null ? 'NO_DATA' : v; };
    var pct = i.integridad_max ? Math.round(i.integridad * 100 / i.integridad_max) + ' percent' : 'NO_DATA';
    return 'Radio Atlantis, cycle ' + d(i.ciclo) + '. Core integrity ' + pct + ', phase ' + d(i.fase) + ', depth ' + d(i.profundidad) + ' meters. ' +
      'Copper ' + d(r.cobre) + ', light ' + d(r.luz) + ', biomass ' + d(r.biomasa) + ', oxygen ' + d(r.oxigeno) + '. ' +
      (i.grieta ? (i.grieta.abierta ? 'The rift is open.' : 'The rift is sealed.') : 'Rift: NO_DATA.');
  }
  function huella(i) { var g = guion(i); return g ? K.sha(JSON.stringify({ g: g, b: boletin(i) })) : null; }

  /* Tocar: el interruptor de siempre (S.activa) y una nota cada PASO_MS por la sintesis FM de core.js. */
  function toca(i) {
    var S = raiz.AtlasSintesis, g = guion(i);
    if (!S || !g) { return null; }
    S.activa(true);
    g.forEach(function (f, k) {
      raiz.setTimeout(function () { S.suena({ tipo: 'radio', portadora: f, moduladora: Math.round(f * 2), indice: 35, dur: 0.28, gan: 0.07 }); }, k * PASO_MS);
    });
    return g;
  }
  /* El locutor: solo voces locales; sin ninguna, NO_DATA con su causa y el boletin queda en texto. */
  function locutor(texto) {
    var sy = raiz.speechSynthesis;
    if (!sy || !raiz.SpeechSynthesisUtterance) { return 'NO_DATA: this browser has no speech synthesis'; }
    var locales = (sy.getVoices() || []).filter(function (v) { return v.localService && /^en/i.test(v.lang); });
    if (!locales.length) { return 'NO_DATA: no local English voice on this device; the bulletin stays as text'; }
    var u = new raiz.SpeechSynthesisUtterance(texto);
    u.voice = locales[0]; u.pitch = 0.8; u.rate = 0.88;
    sy.cancel(); sy.speak(u);
    return 'voice: ' + locales[0].name + ' (local)';
  }

  function el(tag, clase, texto) { var n = raiz.document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }
  function monta(panel) {
    if (!panel || panel.querySelector('.radio-estado')) { return; }
    var d = el('details', 'radio-estado thegame-pliego');
    d.appendChild(el('summary', null, 'Radio Atlantis · the state, as sound'));
    var txt = el('p', 'radio-boletin'), nota1 = el('p', 'atlas-nota'), b = el('button', 'boton', 'Play the state'); b.type = 'button';
    txt.setAttribute('aria-live', 'polite');
    function ins() { return raiz.AtlasJuego && raiz.AtlasJuego.instantanea ? raiz.AtlasJuego.instantanea() : null; }
    d.addEventListener('toggle', function () { if (d.open) { txt.textContent = boletin(ins()); } });
    b.addEventListener('click', function () {
      var i = ins(), g = toca(i);
      txt.textContent = boletin(i);
      nota1.textContent = (g ? 'Notes (Hz): ' + g.join(' · ') + '. ' : 'NO_DATA: no game yet. ') + locutor(txt.textContent) + '.';
    });
    [txt, b, nota1].forEach(function (n) { d.appendChild(n); });
    panel.appendChild(d);
  }

  var AtlasRadio = { BASE_HZ: BASE_HZ, PENTA: PENTA, nota: nota, guion: guion, boletin: boletin, huella: huella, toca: toca, locutor: locutor, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasRadio; }
  else { raiz.AtlasRadio = AtlasRadio; }
})(this);
