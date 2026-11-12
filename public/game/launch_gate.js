(function (raiz) {
  'use strict';

  // Compuerta post-intro (VT6): tres carriles, cada uno con su boton o su NO_DATA con causa. PURO: ni DOM, ni red, ni reloj.
  // UI en ingles (NORTE 5 a1, 2026-10-27): las causas se leen en pantalla en /get-the-app/.
  // An install link needs no visitor signature. Unmeasured model figures remain NO_DATA.

  var enNode = typeof module === 'object' && module.exports;
  var TOQUE_MIN = 44;
  var MAX_CLICS = 2;
  var ORIGEN = 'preceptoros.org';

  // Instalador por entorno (radiogroup preseleccionado segun el OS).
  var INSTALADOR = { android: 'release:android', ios: 'NO_DATA', linux: 'bin/instalar-pc', windows: 'bin/instalar-pc', mac: 'bin/instalar-pc' };

  function nd(c) { return 'NO_DATA (' + c + ')'; }
  function boton(etiqueta, activo, causa) { return { etiqueta: etiqueta, activo: activo, causa: causa || null, tamano: TOQUE_MIN }; }

  // d: { os, pwa: { instalable, peso_b }, release: { firmada: { <os>: bool } }, cerebros: [{ id, size_gb, sha256, maquina, fecha }], carga: [url] }
  function vista(d) {
    var os = INSTALADOR[d.os] ? d.os : 'linux';
    var pwa = d.pwa || {};
    var carril1 = {
      id: 'pwa', clics: 1,
      boton: pwa.instalable ? boton('Install the web app', true) : boton('Install the web app', false, nd('this browser has not offered to install it')),
      peso: typeof pwa.peso_b === 'number' ? pwa.peso_b + ' B' : nd('size not measured')
    };
    var installer = os !== 'android' && os !== 'ios';
    // A published Android APK is a signed web-shell (TWA), not a local model.
    // Only offer the direct download when its same-origin URL and digest are declared in release.json.
    var android = d.android || {}, apk = os === 'android' &&
      /^\/get-the-app\/[A-Za-z0-9._-]+\.apk$/.test(android.url || '') &&
      /^[0-9a-f]{64}$/.test(android.sha256 || '') &&
      Number.isSafeInteger(android.bytes) && android.bytes > 0;
    var carril2 = {
      id: 'app', preseleccionado: INSTALADOR[os], clics: apk ? 1 : 2,
      sha256: apk ? android.sha256 : undefined,
      boton: apk ? boton('Download Android app', true) :
        installer ? boton('Install the app', true) :
        boton('Install the app', false, nd('verified native installer not available for ' + os))
    };
    var carril3 = (d.cerebros || []).map(function (c) {
      var medido = !!(c.sha256 && typeof c.size_gb === 'number');
      var conCausa = c.maquina && c.fecha;
      var cifra = typeof c.size_gb !== 'number' ? nd('size not measured')
        : conCausa ? c.size_gb + ' GB · ' + c.maquina + ' · ' + c.fecha
        : nd('figure without machine and date');
      return {
        id: c.id, clics: 2, cifra: cifra, gb_medido: typeof c.size_gb === 'number', sha256: c.sha256 || null,
        boton: medido ? boton('Download ' + c.id, true) : boton('Download ' + c.id, false, nd('sha256 or size not measured'))
      };
    });
    if (!carril3.length) { carril3 = [{ id: 'cerebros', clics: 0, cifra: null, gb_medido: false, sha256: null, boton: boton('Models', false, nd('no model in brains.json')) }]; }
    return {
      saltar: { etiqueta: 'Skip to the Map', primero: true, enfocable: true },
      carriles: [carril1, carril2].concat(carril3),
      peticiones_en_carga: (d.carga || []).filter(function (u) { return !u.startsWith('/') && u.indexOf(ORIGEN) < 0; })
    };
  }

  // Violaciones de la vista: lista vacia = la compuerta cumple.
  function valida(v) {
    var fallos = [];
    v.carriles.forEach(function (c) {
      var quien = c.id || 'carril';
      if (c.clics > MAX_CLICS) { fallos.push(quien + ': ' + c.clics + ' clics, maximo ' + MAX_CLICS); }
      if (c.boton && c.boton.tamano < TOQUE_MIN) { fallos.push(quien + ': boton de ' + c.boton.tamano + ' px, minimo ' + TOQUE_MIN); }
      if (c.boton && c.boton.activo && c.sha256 === null) { fallos.push(quien + ': modelo sin sha256 con boton activo'); }
      if (c.gb_medido && !/GB/.test(c.cifra || '')) { fallos.push(quien + ': el tamano GB esta medido y no se muestra'); }
      if (c.cifra && /GB/.test(c.cifra) && !/ · .* · /.test(c.cifra)) { fallos.push(quien + ': cifra sin maquina ni fecha'); }
    });
    if (!v.saltar || !v.saltar.primero) { fallos.push('Saltar al Mapa no es el primer elemento enfocable'); }
    if (v.peticiones_en_carga.length) { fallos.push('peticion externa en carga: ' + v.peticiones_en_carga.join(',')); }
    return fallos;
  }

  var AtlasLaunchGate = { TOQUE_MIN: TOQUE_MIN, MAX_CLICS: MAX_CLICS, INSTALADOR: INSTALADOR, vista: vista, valida: valida };
  if (enNode) { module.exports = AtlasLaunchGate; }
  else { raiz.AtlasLaunchGate = AtlasLaunchGate; }
})(this);
