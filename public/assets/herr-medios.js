/* preceptoros.org · TOOLS: audio, voice, image and vision models, one link each, verified.
 *
 * ASKED BY THE SOBERANO (2026-09-24): put the audio, voice and image models in
 * Tools so people download them straight from the web, in one link, grouped in
 * expandable panels like the Tower and the community missions, with the green
 * «available» seal only when we verified the download works.
 *
 * WHAT IS VERIFIED, AND BY WHOM. `p0x/bin/verifica-medios.py` checks every file
 * (public repository, not gated, HEAD 200 after redirects, the size the
 * repository declares) and writes `/medios.json` with the date. This file only
 * READS that catalog from our own origin: it never contacts Hugging Face or
 * Ollama on load — the site promises zero external requests, and a download
 * link is only followed when the visitor clicks it.
 *
 * THE SEAL. Green «Available · verified <date>» only if the entry passed AND the
 * check is at most 30 days old. A stale check is not a check: after 30 days the
 * seal turns grey until the script runs again. An entry that failed shows why.
 */
(function () {
  'use strict';
  if (window.HerrMedios) return;
  window.HerrMedios = true;
  var DIAS = 30;
  var GRUPOS = ['voz', 'musica', 'imagen', 'vision'];

  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }
  function tam(b) {
    if (!b) return 'NO_DATA';
    return b >= 1e9 ? (b / 1e9).toFixed(1) + ' GB' : Math.round(b / 1e6) + ' MB';
  }
  function reciente(fecha) {
    var t = Date.parse(fecha);
    return isFinite(t) && (Date.now() - t) / 864e5 <= DIAS;
  }
  function estilo() {
    var e = document.createElement('style');
    e.textContent =
      '#herr-medios .medio{margin:.6rem 0;padding:.6rem .7rem;border:1px solid rgba(255,255,255,.12);border-radius:10px}' +
      '#herr-medios .medio-cab{display:flex;flex-wrap:wrap;align-items:center;gap:.4rem}' +
      '#herr-medios .medio-nombre{font-weight:700}' +
      '#herr-medios .medio-datos{margin:.3rem 0;font-size:.8rem;opacity:.85}' +
      '#herr-medios .medio-acciones{display:flex;flex-wrap:wrap;gap:.4rem;align-items:center}' +
      '#herr-medios .herr-cmd{display:inline-block;padding:.15rem .4rem;font-size:.78rem;overflow-wrap:anywhere}' +
      '#herr-medios .sello-rack{display:inline-flex;align-items:center;gap:.35em;font-size:.72rem;font-weight:700;' +
        'padding:.18em .6em;border-radius:999px}' +
      '#herr-medios .sello-rack::before{content:"";width:.55em;height:.55em;border-radius:50%;background:currentColor}' +
      '#herr-medios .sello-rack.si{background:#1e7b34;color:#fff}' +
      '#herr-medios .sello-rack.no{background:#5b5b63;color:#fff}';
    document.head.appendChild(e);
  }

  function tarjeta(m, ui) {
    var c = el('div', 'medio');
    var cab = el('div', 'medio-cab');
    cab.appendChild(el('span', 'medio-nombre', m.nombre));
    var ok = m.estado === 'OK' && reciente(m.verificado);
    var s = el('span', 'sello-rack ' + (ok ? 'si' : 'no'),
      ok ? (ui.herr_disponible || 'Available') + ' · ' + (ui.herr_verificado || 'verified') + ' ' + m.verificado
         : (ui.herr_no_un_clic || 'Not one click'));
    s.setAttribute('role', 'status');
    cab.appendChild(s);
    c.appendChild(cab);
    var datos = [(ui.herr_licencia || 'license') + ': ' + m.licencia, tam(m.bytes)];
    if (m.lenguas) datos.push(m.lenguas + ' ' + (ui.herr_lenguas || 'languages'));
    c.appendChild(el('p', 'medio-datos', datos.join(' · ')));
    if (m.nota && ui[m.nota]) c.appendChild(el('p', 'no-data', ui[m.nota]));
    var acc = el('div', 'medio-acciones');
    if (ok && m.url) {
      var a = el('a', 'boton', ui.herr_descargar || 'Download');
      a.href = m.url;
      a.rel = 'noopener';
      if (m.ficheros && m.ficheros.length === 1) a.setAttribute('download', '');
      acc.appendChild(a);
    }
    if (m.comando) {
      var code = el('code', 'herr-cmd', m.comando);
      acc.appendChild(code);
      var b = el('button', 'leve', ui.herr_copiar || 'Copy command');
      b.type = 'button';
      b.addEventListener('click', function () {
        if (navigator.clipboard) navigator.clipboard.writeText(m.comando).catch(function () {});
      });
      acc.appendChild(b);
    }
    c.appendChild(acc);
    if (m.ficheros && m.ficheros.length === 1 && m.ficheros[0].sha256) {
      c.appendChild(el('p', 'tenue', 'sha256 ' + m.ficheros[0].sha256));
    }
    return c;
  }

  window.HerrMediosPinta = function (ui, antes) {
    if (!ui.herr_medios || document.getElementById('herr-medios')) return;
    fetch('/medios.json', { cache: 'no-store' }).then(function (r) { return r.ok ? r.json() : null; })
      .then(function (cat) {
        if (!cat || !cat.medios) return;
        estilo();
        var sec = el('section', 'panel');
        sec.id = 'herr-medios';
        sec.appendChild(el('h2', null, ui.herr_medios));
        if (ui.herr_medios_nota) sec.appendChild(el('p', 'herr-lema', ui.herr_medios_nota));
        GRUPOS.forEach(function (g) {
          var suyos = cat.medios.filter(function (m) { return m.grupo === g; });
          if (!suyos.length) return;
          var pl = el('details', 'pliego');
          pl.appendChild(el('summary', null, (ui['herr_g_' + g] || g) + ' (' + suyos.length + ')'));
          suyos.forEach(function (m) { pl.appendChild(tarjeta(m, ui)); });
          sec.appendChild(pl);
        });
        antes.parentNode.insertBefore(sec, antes.nextSibling);
      }).catch(function () { /* no catalog, no panels: the rest of Tools stands */ });
  };
})();
