
(function (raiz) {
  'use strict';
  function T(k, nd) { return (raiz.AtlasJuego && raiz.AtlasJuego.texto(k)) || nd || k; }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) { n.className = cls; }
    if (text != null) { n.textContent = text; }
    return n;
  }
  function ciclo() {
    try { return raiz.AtlasVector && raiz.AtlasVector.leer().c; } catch (e) { return null; }
  }
  function edad(cicloDato) {
    var a = ciclo();
    return a === null || a < cicloDato ? null : a - cicloDato;
  }
  function selloConEdad(cicloDato, viejo) {
    var e = edad(cicloDato);
    if (e === null) { return { estado: 'STALE', texto: T('cable_edad', '{s} · Δ{n}c').replace('{s}', 'stale').replace('{n}', '?') }; }
    if (e > viejo) { return { estado: 'STALE', texto: T('cable_edad', '{s} · Δ{n}c').replace('{s}', 'stale').replace('{n}', e) }; }
    return { estado: 'LIVE', texto: T('cable_live_edad', 'live (Δ {n} cycles)').replace('{n}', e) };
  }

  function metricas() {
    var m = null;
    try { m = typeof fetch === 'function' ? null : null; } catch (e) { m = null; }

    var ley = raiz.AtlasMundo || null;
    if (!ley || !ley.nexo) { return { causa: T('cable_nd', 'no reading yet') }; }
    var n = ley.nexo, c = { conformidad: n.conformidad, stale: n.stale, tic: n.tic };
    var s = selloConEdad(c.tic || 0, 100);
    return { conformidad: c.conformidad, stale: c.stale, estado: s.estado, edad: s.texto };
  }

  function monta(zona) {
    if (!zona || document.getElementById('cable-fila')) { return; }
    var C = raiz.AtlasCableLlamar;
    if (!C) { return; }
    var fila = el('div', 'cable-fila'); fila.id = 'cable-fila';
    var entrada = el('input', 'cable-contexto'); entrada.type = 'text';
    entrada.maxLength = 512; entrada.id = 'cable-contexto';
    entrada.setAttribute('aria-label', T('cable_aria', 'Context for calling the lab (visible in the receipt)'));
    var b = el('button', 'cable-boton', T('cable_boton', 'CALL THE LAB'));
    b.type = 'button'; b.id = 'cable-boton';
    fila.appendChild(entrada); fila.appendChild(b); zona.appendChild(fila);
    function dice(texto, fuente) {
      var R = raiz.AtlasRadioChat;
      if (R && typeof R.dice === 'function') { R.dice({ quien: 'Lab', texto: texto, fuente: fuente || 'cable' }); }
    }
    function pinta(r) {
      if (r.estado === 'recibo') {
        var d = r.recibo || {};
        var huella = d.huella || d.id || T('cable_sin_huella', 'no stamp (202)');
        dice(T('cable_recibo', 'Receipt: the lab took the call. Stamp: {h}').replace('{h}', huella), 'cable');
        var m = metricas();
        if (m && !m.causa) {
          dice(T('cable_metricas', 'Conformity rate: {c} · stale rate: {s} · {e}')
            .replace('{c}', m.conformidad == null ? T('cable_nd', 'no reading yet') : String(m.conformidad))
            .replace('{s}', m.stale == null ? T('cable_nd', 'no reading yet') : String(m.stale))
            .replace('{e}', m.edad), 'cable');
        } else if (m && m.causa) { dice(m.causa, 'cable'); }
      } else {
        dice(T('cable_fallo', 'The call did not close the loop: {c}').replace('{c}', r.causa || 'the lab did not answer'), 'cable');
      }
    }
    b.addEventListener('click', function () {
      dice(T('cable_yendo', 'Calling the lab through the aduana… (the request carries your public key and the signed call; nothing else leaves)'), 'cable');
      C.llama(entrada.value, pinta);
    });
  }
  var AtlasCableChat = { monta: monta, metricas: metricas, selloConEdad: selloConEdad };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasCableChat; }
  else { raiz.AtlasCableChat = monta; raiz.AtlasCableChatMetricas = AtlasCableChat; }
})(typeof module === 'object' && module.exports ? this : (this || window));
