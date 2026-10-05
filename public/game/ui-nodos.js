/* preceptoros.org · theGame · HEXELION CONTRA DOOGEE, en vivo, dentro de la Arena.

   Dos cuentas de la casa, un nodo cada una (`nodos-cedulas.js`). Cada nodo lucha con lo que se
   MIDIO en su aparato; lo EMULADO se dice; lo que no se midio es NIEBLA. Los pesos son PROPUESTA
   y se dice en pantalla.

   EL LIENZO NO DECIDE. `AtlasNodos.partida` escribe el log desde la semilla; aqui solo se recorre
   `reproduce(log)` tick a tick. Con movimiento reducido se salta al final, que es el mismo estado.

   TRES PELDANOS EN LA MISMA PANTALLA. N0: se juega y se ve, y nada sale del aparato. N1: se firma
   el registro (que ata la huella del log) con la identidad que ya vive en el navegador
   (`Identity.firmar`). ENVIAR: solo con un clic de verdad, la casilla marcada y una SEGUNDA firma,
   la del consentimiento; `AtlasNodos.envio` es la puerta y `Enviar.paquete` (de `enviar.js`, que se
   pide al pulsar) la unica salida. Sin red, ni reloj, ni azar en este fichero.

   REDISENO TRAS EL DOOGEE (2026-10-04): el combate arriba y las cedulas plegadas; las dos firmas
   son dos PASOS numerados; el boton de enviar dice siempre por que esta gris (`cerrojo`), y los
   rechazos se dicen en la lengua de la pantalla (`RECHAZOS`), no con el mensaje crudo. */
(function () {
  'use strict';

  var N = window.AtlasNodos, C = window.AtlasNodosCedulas, P = window.AtlasNodosPesos;
  var T = function (k) { return k; }, R = {}, actual = null, firmado = null, paso = null;

  function el(tag, clase, texto) {
    var x = document.createElement(tag);
    if (clase) { x.className = clase; }
    if (texto != null) { x.textContent = String(texto); }
    return x;
  }
  function boton(texto, clase) { var b = el('button', clase || 'boton', texto); b.type = 'button'; return b; }
  function rellena(p, v) { return String(p).replace(/\{(\w+)\}/g, function (m, k) { return k in v ? v[k] : m; }); }
  function quieto() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function css(v, x) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim() || x; }
  function nombre(i) { return C.cuentas[i].cuenta.replace('casa-', ''); }

  /* --- la ficha de un nodo ---------------------------------------------------------------------- */
  function ficha(i) {
    var c = C.nodos.filter(function (n) { return n.nodo === C.cuentas[i].nodo; })[0], r = N.rasgos(c, P);
    var f = el('div', 'panel atlas-nodo-ficha');
    f.appendChild(el('h6', null, rellena(T('nodos_cuenta'), { q: nombre(i), n: c.nodo })));
    f.appendChild(el('p', 'atlas-nota', c.aparato.dispositivo));
    N.EJES.forEach(function (e) {
      var m = c.aparato.medidas[e], cl = m.estado === 'MEDIDO' ? 'atlas-medido' : m.estado === 'EMULADO' ? 'atlas-casa' : 'no-data';
      var v = m.valor === null ? 'NO_DATA' : e === 'gen_cps' ? (m.valor / 100) + ' tok/s' : Math.floor(m.valor / 1024) + ' GiB';
      var p = el('p', cl, T('nodos_' + e) + ': ' + (m.valor === null ? T('nodos_est_NO_DATA') + ' · ' + m.causa : v + ' · ' + T('nodos_est_' + m.estado)));
      p.title = m.fuente ? m.fuente + ' · ' + m.fecha : m.base ? m.base + ' · ' + m.causa : m.causa;
      f.appendChild(p);
    });
    f.appendChild(el('p', 'atlas-casa', rellena(T('nodos_rasgos'), { v: r.vida, a: r.ataque, r: r.armadura, s: r.velocidad, e: r.esquiva_pm })));
    if (r.niebla.length) {
      f.appendChild(el('p', 'no-data', rellena(T('nodos_niebla'), { e: r.niebla.map(function (x) { return T('nodos_' + x); }).join(', ') })));
    }
    return f;
  }

  /* --- el lienzo: dos ondas, sus barras y el golpe del tick ------------------------------------- */
  function onda(ctx, cx, cy, rad, hex, vida, viva) {
    ctx.beginPath();
    for (var s = 0; s <= 96; s++) {
      var t = s * Math.PI * 2 / 96, x = 0, y = 0;
      for (var k = 1; k <= 4; k++) {
        var a = (parseInt(hex.charAt(k * 2), 16) + 2) / (k * 18), fa = parseInt(hex.charAt(k * 2 + 1), 16) / 3;
        x += a * Math.cos(k * t + fa); y += a * Math.sin((k % 2 ? k : -k) * t + fa);
      }
      var px = cx + x * rad * (0.5 + vida / 2000), py = cy + y * rad * (0.5 + vida / 2000);
      if (s) { ctx.lineTo(px, py); } else { ctx.moveTo(px, py); }
    }
    ctx.strokeStyle = viva; ctx.lineWidth = 2; ctx.stroke();
  }
  function pinta(e) {
    var cv = R.lienzo, d = window.devicePixelRatio || 1, w = cv.clientWidth || 320, h = Math.round(w * 0.45);
    cv.width = Math.round(w * d); cv.height = Math.round(h * d);
    var ctx = cv.getContext('2d'), tinta = css('--texto', '#ddd'), acento = css('--acento', '#a78bfa'), malo = css('--rojo', '#e5484d');
    ctx.setTransform(d, 0, 0, d, 0, 0); ctx.clearRect(0, 0, w, h);
    [0, 1].forEach(function (i) {
      var cx = w * (i ? 0.75 : 0.25), cy = h * 0.45, golpe = e && e.t === 'golpe' && e.de !== i, fallo = e && e.t === 'esquiva' && e.de !== i;
      onda(ctx, cx, cy, h * 0.32, C.nodos[i].sha256, e ? e.pm[i] : 1000, golpe ? malo : fallo ? acento : tinta);
      ctx.fillStyle = tinta; ctx.globalAlpha = 0.25; ctx.fillRect(cx - w * 0.18, h * 0.86, w * 0.36, 6);
      ctx.globalAlpha = 1; ctx.fillStyle = golpe ? malo : acento;
      ctx.fillRect(cx - w * 0.18, h * 0.86, w * 0.36 * (e ? e.pm[i] : 1000) / 1000, 6);
      ctx.fillStyle = tinta; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(nombre(i) + (e ? ' · ' + e.vida[i] : ''), cx, h * 0.98);
    });
  }

  /* --- la pelea: recorrer el log, nada mas ------------------------------------------------------ */
  function cuenta(e) {
    if (e.t === 'golpe') { return rellena(T('nodos_log_golpe'), { q: nombre(e.de), d: e.dano }); }
    if (e.t === 'esquiva') { return rellena(T('nodos_log_esquiva'), { q: nombre(e.de) }); }
    return e.t === 'fin' ? (e.gana < 0 ? T('nodos_empate') : rellena(T('nodos_gana'), { q: nombre(e.gana) })) : T('nodos_inicio');
  }
  function final(estados) {
    var u = estados[estados.length - 1];
    clearTimeout(paso); paso = null; pinta(u);
    R.res.textContent = cuenta(u) + ' · ' + rellena(T('nodos_tick'), { t: u.tick });
    R.n0.hidden = false; R.pasos.hidden = false; R.salta.hidden = true; R.consiento.checked = false; cerrojo();
  }
  function lucha() {
    var n = parseInt(R.n.value, 10);
    if (!(n >= 0 && n <= 999999)) { n = 0; R.n.value = '0'; }
    clearTimeout(paso); firmado = null; R.pasos.hidden = true; R.recibo.textContent = ''; R.firmaNota.textContent = '';
    R.paso1.classList.remove('hecho'); R.crudo.hidden = true;
    actual = N.partida(C, P, C.cuentas[0].cuenta, C.cuentas[1].cuenta, n);
    var estados = N.reproduce(actual.log), r = actual.registro, i = 0, tick = 0;
    R.semilla.textContent = 'seed ' + r.semilla + ' · log sha256 ' + r.log_sha + ' · ' + r.pesos + ' · cedulas ' + r.cedulas_sha;
    R.log.textContent = estados.map(function (e) { return rellena(T('nodos_tick'), { t: e.tick }) + ' · ' + cuenta(e); }).join('\n');
    R.escena.hidden = false; R.salta.hidden = false; R.n0.hidden = true;
    if (quieto()) { final(estados); return; }
    (function avanza() {
      while (i < estados.length - 1 && estados[i + 1].tick <= tick) { i += 1; }
      pinta(estados[i]); R.res.textContent = cuenta(estados[i]);
      if (i >= estados.length - 1) { final(estados); return; }
      tick += 1; paso = setTimeout(avanza, 45);
    })();
    R.salta.onclick = function () { final(estados); };
  }

  /* EL BOTON GRIS DICE POR QUE (hallazgo 1). Solo aqui se toca `R.enviar.disabled`. */
  function cerrojo(cual) {
    var listo = !!firmado && R.consiento.checked && !cual;
    R.consiento.disabled = !firmado || !!cual;
    R.enviar.disabled = !listo;
    R.porque.textContent = cual ? T(cual) : !firmado ? T('nodos_porque_firma') : listo ? T('nodos_listo') : T('nodos_porque');
    R.porque.className = listo ? 'atlas-porque listo' : 'atlas-porque';
  }
  /* Las causas de `AtlasNodos.envio` van en castellano (el contrato no se toca): aqui, su texto. */
  var RECHAZOS = {
    'sin gesto no sale nada': 'nodos_rech_gesto',
    'sin la firma de la partida': 'nodos_rech_firma',
    'sin consent 1 firmado': 'nodos_rech_consent',
    'sin clave publica': 'nodos_rech_clave'
  };
  function ingles(e) {
    var m = e && e.message, h = e && e.estado;
    if (m && RECHAZOS[m]) { return T(RECHAZOS[m]); }
    if (h === 404 || h === 405) { return rellena(T('nodos_rech_canal'), { h: h }); }
    if (h) { return rellena(T('nodos_rech_http'), { h: h }); }
    return e instanceof TypeError ? T('nodos_rech_red') : T('nodos_rech_otro');
  }

  /* --- N1 y el envio ---------------------------------------------------------------------------- */
  function firma() {
    var I = window.Identity;
    if (!I || !I.quien || !I.quien()) {
      R.firmaNota.textContent = T('nodos_sin_id');
      if (I && I.crear && !R.crear.parentNode) { R.firmaNota.appendChild(R.crear); }
      return;
    }
    var reg = actual.registro;
    I.firmar(reg).then(function (f) {
      return I.publica().then(function (pub) {
        if (actual.registro !== reg) { return; }
        firmado = { firma: f.firma, autor: f.autor, publica: pub };
        R.firmaNota.textContent = rellena(T('nodos_firmado'), { q: f.autor }) + ' ' + f.firma.slice(0, 24) + '…';
        R.paso1.classList.add('hecho'); R.consiento.checked = false; cerrojo();
      });
    }, function (e) { R.firmaNota.textContent = rellena(T('nodos_fallo'), { c: e && e.message }); });
  }
  function puerta() {
    if (window.Enviar && window.Enviar.paquete) { return Promise.resolve(window.Enviar); }
    return new Promise(function (ok, mal) {
      var s = document.createElement('script');
      s.src = '/assets/enviar.js';
      s.onload = function () { if (window.Enviar && window.Enviar.paquete) { ok(window.Enviar); } else { mal(new Error('enviar.js')); } };
      s.onerror = function () { mal(new Error('enviar.js')); };
      document.head.appendChild(s);
    });
  }
  function envia(ev) {
    var o = { gesto: ev.isTrusted === true }, reg = actual && actual.registro;
    if (!firmado || !reg || !R.consiento.checked) { return; }
    cerrojo('nodos_enviando'); R.recibo.className = 'atlas-nota'; R.recibo.textContent = ''; R.crudo.hidden = true;
    var cs = N.consentimiento(reg);
    window.Identity.firmar(cs).then(function (fc) {
      o.partida = reg; o.firma = firmado.firma; o.consentimiento = cs; o.firma_consent = fc.firma; o.publica = firmado.publica;
      var pares = N.envio(o);
      return puerta().then(function () { return window.Enviar.paquete(N.ESQUEMA_ENVIO, pares); });
    }).then(function (d) {
      R.recibo.className = 'atlas-medido'; cerrojo('nodos_enviado');
      R.recibo.textContent = rellena(T('nodos_recibo'), { e: (d && d.estado) || 'NO_DATA', f: (d && d.fichero) || 'NO_DATA' });
    }, function (e) {
      var causa = e && e.datos && e.datos.detail && e.datos.detail.causa;
      R.recibo.className = 'no-data';
      R.recibo.textContent = rellena(T('nodos_fallo'), { c: ingles(e) });
      R.crudo.lastChild.textContent = (e && e.message) + (causa ? ' · ' + causa : ''); R.crudo.hidden = false;
      cerrojo();
    });
  }

  /* --- montar ----------------------------------------------------------------------------------- */
  function monta(cont, textos) {
    if (!cont || cont.firstChild || !N || !C || !P) { return; }
    T = textos || T;
    var s = el('section', 'atlas-nodos');
    s.appendChild(el('h5', null, T('nodos_h')));
    s.appendChild(el('p', 'atlas-nota', T('nodos_nota')));
    var e = N.validaCedulas(C) || N.validaPesos(P);
    if (e) { s.appendChild(el('p', 'no-data', 'NO_DATA · ' + e)); cont.appendChild(s); return; }
    /* Las cedulas, PLEGADAS y debajo del combate (hallazgo 3). */
    R.cedulas = el('details', 'atlas-nodos-cedulas');
    R.cedulas.appendChild(el('summary', null, T('nodos_cedulas_h')));
    R.cedulas.appendChild(el('p', 'atlas-casa', rellena(T('nodos_pesos'), { v: P.version })));
    var fila = el('div', 'atlas-nodos-fichas');
    fila.appendChild(ficha(0)); fila.appendChild(ficha(1)); R.cedulas.appendChild(fila);
    var m = el('div', 'atlas-arena-mandos'), et = el('label', null, T('nodos_combate_n') + ' ');
    R.n = el('input'); R.n.type = 'number'; R.n.min = '0'; R.n.max = '999999'; R.n.value = '0'; R.n.inputMode = 'numeric';
    et.appendChild(R.n); m.appendChild(et);
    var b = boton(T('nodos_luchar')); b.addEventListener('click', lucha); m.appendChild(b);
    R.salta = boton(T('nodos_saltar'), 'boton-sec'); R.salta.hidden = true; m.appendChild(R.salta);
    s.appendChild(m);
    R.escena = el('div', 'atlas-arena-escena'); R.escena.hidden = true;
    R.lienzo = el('canvas', 'atlas-arena-lienzo');
    R.lienzo.setAttribute('role', 'img'); R.lienzo.setAttribute('aria-label', T('nodos_aria'));
    R.escena.appendChild(R.lienzo);
    R.res = el('p', 'atlas-arena-res'); R.res.setAttribute('role', 'status'); R.escena.appendChild(R.res);
    R.n0 = el('p', 'atlas-nota', T('nodos_n0')); R.n0.hidden = true; R.escena.appendChild(R.n0);
    /* DOS FIRMAS, DOS PASOS (hallazgo 4): la de la partida y la del consentimiento. */
    R.pasos = el('ol', 'atlas-pasos'); R.pasos.hidden = true;
    R.paso1 = el('li', 'atlas-paso atlas-paso-1');
    R.paso1.appendChild(el('h6', null, T('nodos_paso1_h'))); R.paso1.appendChild(el('p', 'atlas-nota', T('nodos_paso1_p')));
    R.firma = boton(T('nodos_firmar'), 'boton-sec'); R.firma.addEventListener('click', firma);
    R.paso1.appendChild(R.firma);
    R.firmaNota = el('p', 'atlas-nota atlas-huella'); R.firmaNota.setAttribute('role', 'status'); R.paso1.appendChild(R.firmaNota);
    R.crear = boton(T('nodos_crear_id'), 'boton-sec');
    R.crear.addEventListener('click', function () { window.Identity.crear().then(firma, function () {}); });
    R.envio = el('li', 'atlas-paso atlas-paso-2');
    R.envio.appendChild(el('h6', null, T('nodos_paso2_h'))); R.envio.appendChild(el('p', 'atlas-nota', T('nodos_paso2_p')));
    var lab = el('label', 'consiento-et'); R.consiento = el('input'); R.consiento.type = 'checkbox'; R.consiento.checked = false;
    lab.appendChild(R.consiento); lab.appendChild(document.createTextNode(' ' + T('nodos_consent')));
    R.envio.appendChild(lab);
    R.enviar = boton(T('nodos_enviar')); R.envio.appendChild(R.enviar);
    R.porque = el('p', 'atlas-porque'); R.porque.id = 'atlas-nodos-porque'; R.porque.setAttribute('aria-live', 'polite');
    R.enviar.setAttribute('aria-describedby', R.porque.id); R.envio.appendChild(R.porque);
    R.consiento.addEventListener('change', function () { cerrojo(); });
    R.enviar.addEventListener('click', envia);
    R.recibo = el('p', 'atlas-nota'); R.recibo.setAttribute('role', 'status'); R.envio.appendChild(R.recibo);
    R.crudo = el('details', 'thegame-tecnico'); R.crudo.hidden = true;
    R.crudo.appendChild(el('summary', null, T('nodos_crudo'))); R.crudo.appendChild(el('p', 'atlas-medido'));
    R.envio.appendChild(R.crudo);
    R.pasos.appendChild(R.paso1); R.pasos.appendChild(R.envio); R.escena.appendChild(R.pasos);
    cerrojo();
    var tec = el('details', 'thegame-tecnico'); tec.appendChild(el('summary', null, T('tecnico')));
    R.semilla = el('p', 'atlas-medido'); tec.appendChild(R.semilla);
    R.log = el('pre', 'atlas-arena-log'); tec.appendChild(R.log);
    R.escena.appendChild(tec);
    s.appendChild(R.escena);
    s.appendChild(R.cedulas);
    cont.appendChild(s);
  }

  window.AtlasNodosUI = { monta: monta };
})();
