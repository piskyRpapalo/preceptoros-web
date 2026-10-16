(function (raiz) {
  'use strict';
  var EN_NODE = typeof module === 'object' && module.exports;
  var G = EN_NODE ? require('./gacha.js') : raiz.AtlasGacha;
  var K = EN_NODE ? require('./canon.js') : raiz.AtlasCanon;
  var TL = EN_NODE ? require('./taller.js') : raiz.AtlasTaller;
  var PASOS = ['ping', 'desintegra', 'pule', 'pinta', 'insignia'], MIN_ARISTAS = 6;

    function ondasSucias(cuenta) {
    var out = [];
    for (var i = 0; out.length < 3; i++) {
      var t = G.tirada(K.sha('atlas.eco/1:' + (cuenta || 'visitante') + ':' + i), 'tc1');
      if (t.aristas >= MIN_ARISTAS) { t.campo_origen = 'emulado'; out.push(t); }
    }
    return out;
  }
    function empieza(cuenta) { return { paso: 'ping', ondas: ondasSucias(cuenta), cadena: [], elegida: null, insignia: null }; }
  function ensayo(e, op) {
    var r = TL.recibo(TL.estado(e.cadena), op, TL.CERO);
    e.cadena.push({ recibo: r, firma: null });
    return r;
  }
    function avanza(e0, accion, dato) {
    var e = JSON.parse(JSON.stringify(e0));
    if (accion !== e.paso) { throw new Error('ahora toca: ' + e.paso); }
    if (accion === 'ping') { e.paso = 'desintegra'; }
    else if (accion === 'desintegra') { ensayo(e, { op: 'desintegra', tropa: e.ondas[dato] }); e.paso = 'pule'; }
    else if (accion === 'pule') {
      if (TL.estado(e.cadena).disueltas[e.ondas[dato.onda].semilla]) { throw new Error('esa ya es residuo'); }
      ensayo(e, { op: 'lija', semilla: e.ondas[dato.onda].semilla, stat: dato.stat }); e.elegida = dato.onda; e.paso = 'pinta';
    } else if (accion === 'pinta') {
      ensayo(e, { op: 'tinte', semilla: e.ondas[e.elegida].semilla, bandera: dato }); e.paso = 'insignia';
      var r = e.cadena[e.cadena.length - 2].recibo;
      e.insignia = { esquema: 'atlas.insignia/1', semilla: e.ondas[e.elegida].semilla, aristas: e.ondas[e.elegida].aristas, stat: r.stat, nivel: r.nivel, bandera: dato };
    }
    return e;
  }

  var AtlasPrimerEco = { PASOS: PASOS, ondasSucias: ondasSucias, empieza: empieza, avanza: avanza };
  if (EN_NODE) { module.exports = AtlasPrimerEco; return; }

    var R = {}, est = null, caja = null, V = raiz.AtlasValores, O = raiz.AtlasOnda;
  function T(k, d) { var C = raiz.AtlasCasa, J = raiz.AtlasJuego, t = (C && C.texto && C.texto(k)) || (J && J.texto(k)); return t && t !== k ? t : d; }
  function el(tag, clase, texto) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (texto != null) { n.textContent = String(texto); } return n; }
  function boton(texto, clase) { var b = el('button', clase || 'boton', texto); b.type = 'button'; return b; }
  function onda(t, lado, tono) {
    var c = el('canvas', 'atlas-onda'), d = Math.min(2, raiz.devicePixelRatio || 1);
    c.width = lado * d; c.height = lado * d; c.style.width = lado + 'px'; c.style.height = lado + 'px'; c.setAttribute('role', 'img');
    c.setAttribute('aria-label', t.aristas + ' ' + T('taller_aristas', 'edges'));
    raiz.requestAnimationFrame(function () {
      if (O && O.dibuja) { O.dibuja(c.getContext('2d'), G.espectro(t), c.width / 2, c.height / 2, c.width * 0.4, { color: tono || O.tono(t), grosor: 1.6 * d, calidad: 1 }); }
    });
    return c;
  }
  function habla(k, d) { R.texto.textContent = T(k, d); }
  function hecho(e, x) { try { est = avanza(est, e, x); pinta(); } catch (er) { habla('eco_no', String(er.message)); } }
  function pinta() {
    R.ondas.textContent = ''; R.mandos.textContent = '';
    var st = TL.estado(est.cadena);
    if (est.paso !== 'ping') {
      est.ondas.forEach(function (t, i) {
        if (st.disueltas[t.semilla]) { return; }
        var f = el('figure', 'eco-onda'), tn = st.tintes[t.semilla];
        f.appendChild(onda(t, 72, tn ? 'hsl(' + V.banderas[tn] + ' 85% 62%)' : null));
        f.appendChild(el('figcaption', null, t.aristas + ' ' + T('taller_aristas', 'edges')));
        if (est.paso === 'desintegra') { var b = boton(T('taller_desintegra', 'Dissolve · +{g} g').replace('{g}', TL.residuo(t)), 'boton-sec'); b.addEventListener('click', function () { hecho('desintegra', i); }); f.appendChild(b); }
        if (est.paso === 'pule') { var p = boton(T('eco_pule_b', 'Sand speed · −{c} g').replace('{c}', TL.coste(1)), 'boton-sec'); p.addEventListener('click', function () { hecho('pule', { onda: i, stat: 'velocidad' }); }); f.appendChild(p); }
        R.ondas.appendChild(f);
      });
    }
    R.saldo.textContent = est.paso === 'ping' ? '' : T('taller_saldo', 'Static residue: {g} g').replace('{g}', st.saldo) + ' · ' + T('eco_simulacro', 'practice: nothing here is signed or kept');
    if (est.paso === 'ping') {
      habla('eco_1', 'You launched the buoy. Now listen to the ocean: it is noisy. Send a ping: what comes back is a shape.');
      var pg = boton(T('eco_ping', 'Ping'));
      pg.addEventListener('click', function () { if (raiz.AtlasRevela) { raiz.AtlasRevela.muestra(est.ondas[0]); } hecho('ping'); });
      R.mandos.appendChild(pg);
    } else if (est.paso === 'desintegra') { habla('eco_2', 'Three echoes came back, and they are dirty: blurred, unstable. Dissolve the worst one. Its static becomes residue.'); }
    else if (est.paso === 'pule') { habla('eco_3', 'Now sand your favourite with that residue. Sanding raises one stat. It never adds edges: that would be a new summon.'); }
    else if (est.paso === 'pinta') {
      habla('eco_4', 'Last: paint it with your frequency. Pick your flag. It is yours: nobody else picks your colour.');
      Object.keys(V.banderas).forEach(function (b) {
        var x = boton(T('bandera_' + b, b), 'boton-sec'); x.style.borderColor = 'hsl(' + V.banderas[b] + ' 85% 60%)';
        x.addEventListener('click', function () { if (raiz.AtlasCasa && raiz.AtlasCasa.pon) { raiz.AtlasCasa.pon('bandera', b); } hecho('pinta', b); });
        R.mandos.appendChild(x);
      });
    } else {
      habla('eco_5', 'This is your Insignia. You learned the Workshop: dissolve, sand, paint. Now, the open sea.');
      if (caja) { caja.pon(est.insignia); }
      cierraCon(est.insignia);
    }
  }
  function cierraCon(ins) {
    R.caja.classList.add('eco-hecho');
    R.ondas.textContent = '';
    var t = G.tirada(ins.semilla, 'tc1'); t.campo_origen = 'emulado';
    var f = el('figure', 'eco-onda eco-insignia');
    f.appendChild(onda(t, 96, 'hsl(' + V.banderas[ins.bandera] + ' 85% 62%)'));
    f.appendChild(el('figcaption', null, T('eco_insignia', 'Your Insignia') + ' · ' + ins.aristas + ' ' + T('taller_aristas', 'edges') + ' · ' + ins.stat + ' ' + ins.nivel));
    R.ondas.appendChild(f);
  }
  function monta(zona) {
    var A = raiz.AtlasArmy;
    if (!zona || zona.querySelector('.eco') || !A || !A.cajaWeb) { return; }
    R.caja = el('section', 'eco');
    R.caja.appendChild(el('h5', null, T('eco_h', 'Chapter 1.5 · The First Echo')));
    var nav = el('div', 'eco-navegante'), D = raiz.AtlasDialogo;
    if (D && D.retrato) { try { var r = D.retrato({}); r.celda(0); nav.appendChild(r.nodo); } catch (x) { } }
    nav.appendChild(el('b', null, T('eco_nombre', 'The Navigator') + ' · ' + T('eco_rol', 'your Workshop AI')));
    R.caja.appendChild(nav);
    R.texto = el('p', 'eco-texto'); R.texto.setAttribute('aria-live', 'polite'); R.caja.appendChild(R.texto);
    R.ondas = el('div', 'eco-ondas'); R.caja.appendChild(R.ondas);
    R.saldo = el('p', 'atlas-nota'); R.caja.appendChild(R.saldo);
    R.mandos = el('div', 'eco-mandos'); R.caja.appendChild(R.mandos);
    zona.insertBefore(R.caja, zona.firstChild);
    caja = A.cajaWeb('atlas-eco', 'eco', 'insignia');
    var I = raiz.Identity;
    Promise.all([caja.lee(), I && I.quien && I.quien() ? I.publica().catch(function () { return null; }) : null]).then(function (x) {
      var ins = x[0];
      if (ins && ins.esquema === 'atlas.insignia/1' && V.banderas[ins.bandera] != null) { habla('eco_5', 'This is your Insignia. Now, the open sea.'); cierraCon(ins); return; }
      est = empieza(x[1]); pinta();
    });
  }
  AtlasPrimerEco.monta = monta;
  raiz.AtlasPrimerEco = AtlasPrimerEco;
})(this);
