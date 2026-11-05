(function (raiz) {
  'use strict';
  var K = (typeof module === 'object' && module.exports) ? require('./canon.js') : raiz.AtlasCanon;
  var BASE_HZ = 220, PENTA = [0, 2, 4, 7, 9], PASO_MS = 300;

  function nota(grado, octava) {
    var g = ((grado % 5) + 5) % 5, o = Math.max(0, Math.min(2, octava));
    return Math.round(BASE_HZ * Math.pow(2, o + PENTA[g] / 12) * 100) / 100;
  }
    function tocaNota(grado, octava) {
    if (!Number.isInteger(grado) || !Number.isInteger(octava)) { return null; }
    var f = nota(grado, octava), S = raiz.AtlasSintesis;
    if (!S || typeof S.suena !== 'function') { return null; }
    return S.suena({ tipo: 'radio', portadora: f, moduladora: Math.round(f * 2), indice: 35, dur: 0.28, gan: 0.07 });
  }
  function causaGuion(i) {
    var faltan = [];
    if (!i || typeof i !== 'object') { return 'NO_DATA: snapshot missing'; }
    if (i.esquema !== 'atlas.instantanea/1') { return 'NO_DATA: unsupported snapshot schema'; }
    function numero(obj, campo, ruta) {
      if (!obj || typeof obj[campo] !== 'number' || !Number.isFinite(obj[campo])) { faltan.push(ruta); }
    }
    numero(i, 'integridad', 'integridad');
    numero(i, 'integridad_max', 'integridad_max');
    if (typeof i.integridad_max === 'number' && i.integridad_max <= 0) { faltan.push('integridad_max (> 0)'); }
    if (typeof i.integridad === 'number' && Number.isFinite(i.integridad)
        && typeof i.integridad_max === 'number' && Number.isFinite(i.integridad_max) && i.integridad_max > 0
        && !Number.isFinite(i.integridad * 100 / i.integridad_max)) { faltan.push('integrity percentage overflow'); }
    var recursos = i.recursos;
    numero(recursos, 'cobre', 'recursos.cobre');
    numero(recursos, 'biomasa', 'recursos.biomasa');
    numero(recursos, 'luz', 'recursos.luz');
    numero(recursos, 'oxigeno', 'recursos.oxigeno');
    numero(i, 'fase', 'fase');
    numero(i, 'nivel_nucleo', 'nivel_nucleo');
    if (!i.grieta || typeof i.grieta.abierta !== 'boolean') { faltan.push('grieta.abierta'); }
    return faltan.length ? 'NO_DATA: invalid or missing ' + faltan.join(', ') : null;
  }
    function guion(i) {
    if (causaGuion(i)) { return null; }
    var r = i.recursos, pct = Math.round(i.integridad * 100 / i.integridad_max);
    var cifras = [pct, r.cobre, r.biomasa, r.luz, r.oxigeno, i.fase, i.nivel_nucleo, i.grieta && i.grieta.abierta ? 1 : 0];
    return cifras.map(function (v, k) { var n = Math.abs(Math.floor(Number(v) || 0)); return nota(n + k, Math.floor(n / 50) % 3); });
  }
    function boletin(i) {
    if (!i || i.esquema !== 'atlas.instantanea/1') { return 'Radio Atlantis. NO_DATA: no game is running yet.'; }
    var r = i.recursos || {}, d = function (v) { return v === undefined || v === null ? 'NO_DATA' : v; };
    var pct = i.integridad_max ? Math.round(i.integridad * 100 / i.integridad_max) + ' percent' : 'NO_DATA';
    return 'Radio Atlantis, cycle ' + d(i.ciclo) + '. Core integrity ' + pct + ', phase ' + d(i.fase) + ', depth ' + d(i.profundidad) + ' meters. ' +
      'Copper ' + d(r.cobre) + ', light ' + d(r.luz) + ', biomass ' + d(r.biomasa) + ', oxygen ' + d(r.oxigeno) + '. ' +
      (i.grieta ? (i.grieta.abierta ? 'The rift is open. Resource gain: base (1x); sealed rate: doubled (2x).' :
        'The rift is sealed. Resource gain: doubled (2x); open rate: base (1x).') :
        'Rift: NO_DATA. Resource gain: NO_DATA (rift state not measured).');
  }
  function huella(i) { var g = guion(i); return g ? K.sha(JSON.stringify({ g: g, b: boletin(i) })) : null; }

    function toca(i) {
    var S = raiz.AtlasSintesis, g = causaGuion(i) ? null : guion(i);
    if (!S || !g) { return null; }
    S.activa(true);
    g.forEach(function (f, k) {
      raiz.setTimeout(function () { S.suena({ tipo: 'radio', portadora: f, moduladora: Math.round(f * 2), indice: 35, dur: 0.28, gan: 0.07 }); }, k * PASO_MS);
    });
    return g;
  }
    function locutor(texto) {
    var sy = raiz.speechSynthesis;
    if (!sy || !raiz.SpeechSynthesisUtterance) { return 'NO_DATA: this browser has no speech synthesis'; }
    var locales = (sy.getVoices() || []).filter(function (v) { return v.localService && /^en/i.test(v.lang); });
    if (!locales.length) { return 'NO_DATA: no local English voice on this device; the bulletin stays as text'; }
    var u = new raiz.SpeechSynthesisUtterance(texto);
    u.voice = locales[0]; u.pitch = 0.8; u.rate = 0.88;
    sy.cancel(); sy.speak(u);
        return 'SIMULATED voice: ' + locales[0].name + ' (this device, not the rack\'s voice)';
  }

  function el(tag, clase, texto) { var n = raiz.document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = texto; } return n; }
  function monta(panel) {
    if (!panel || panel.querySelector('.radio-estado')) { return; }
    var d = el('details', 'radio-estado thegame-pliego');
    d.appendChild(el('summary', null, 'Radio Atlantis · the state, as sound'));
    var txt = el('p', 'radio-boletin'), nota1 = el('p', 'atlas-nota'), b = el('button', 'boton', 'Play the state'); b.type = 'button';
    var hi = el('button', 'boton radio-say-hi', 'Say Hi'); hi.type = 'button';
    nota1.setAttribute('aria-live', 'polite');
    function ins() { return raiz.AtlasJuego && raiz.AtlasJuego.instantanea ? raiz.AtlasJuego.instantanea() : null; }
    d.addEventListener('toggle', function () { if (d.open) { txt.textContent = boletin(ins()); } });
    b.addEventListener('click', function () {
      var i = ins(), g = toca(i);
      txt.textContent = boletin(i);
      nota1.textContent = (g ? 'Notes (Hz): ' + g.join(' · ') + '. ' : 'NO_DATA: no game yet. ') + locutor(txt.textContent) + '.';
    });
    hi.addEventListener('click', function () {
      nota1.textContent = 'Hello from Radio Atlantis. ' + locutor('Hello from Radio Atlantis. The state radio is ready.') + '.';
    });
    [txt, b, hi, nota1].forEach(function (n) { d.appendChild(n); });
    panel.appendChild(d);
  }

  var AtlasRadio = { BASE_HZ: BASE_HZ, PENTA: PENTA, nota: nota, tocaNota: tocaNota, causaGuion: causaGuion, guion: guion, boletin: boletin, huella: huella, toca: toca, locutor: locutor, monta: monta };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasRadio; }
  else { raiz.AtlasRadio = AtlasRadio; }
})(this);
