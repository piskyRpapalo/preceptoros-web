(function () {
  function el(t, c, x) {
    var n = document.createElement(t);
    if (c) n.className = c;
    if (x != null) n.textContent = x;
    return n;
  }

  var GRACIAS = { es:'Gracias', en:'Thank you', pt:'Obrigado', fr:'Merci',
                  it:'Grazie', de:'Danke', el:'Ευχαριστώ', ru:'Спасибо', ar:'شكرًا' };
  var CONS = {
    es:['Permitir análisis para mejorar el modelo',
        'Marcado: se guarda lo que escribes y lo que responde. Sin marcar: solo el modelo, la hora y el largo.'],
    en:['Allow analysis to improve the model',
        'Ticked: what you write and what it answers are stored. Unticked: only the model, the time and the length.'] };

  function consentimiento(w) {
    var campo = document.getElementById('pregunta');
    if (!campo || document.getElementById('consiento')) return;
    var caja = el('div', 'consiento-caja');
    var et = document.createElement('label');
    et.className = 'consiento-et'; et.htmlFor = 'consiento';
    var cb = document.createElement('input');
    cb.type = 'checkbox'; cb.id = 'consiento';
    cb.checked = false;
    try { cb.checked = localStorage.getItem('preceptor-consiento') === '1'; } catch (e) {  }
    var DISCO = '<svg viewBox="0 0 20 20" width="26" height="26" fill="none"'
      + ' stroke="currentColor" stroke-width="1.5" stroke-linecap="round"'
      + ' stroke-linejoin="round" aria-hidden="true">'
      + '<path d="M3.5 3.5h9l4 4v9a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1Z"/>'
      + '<path d="M6.5 3.5v5h7"/><rect x="6.5" y="12" width="7" height="4.5"/></svg>';
    var icono = document.createElement('span');
    icono.className = 'consiento-icono';
    icono.innerHTML = DISCO;
    et.appendChild(cb); et.appendChild(icono);
    et.appendChild(el('span', 'consiento-texto', w[0]));
    caja.appendChild(et);
    caja.appendChild(el('p', 'consiento-pie', w[1]));

    var lang2 = (document.documentElement.lang || 'es').slice(0, 2);
    function vestir() {
      caja.classList.toggle('dado', cb.checked);
      icono.innerHTML = cb.checked
        ? '<svg viewBox="0 0 24 24" width="26" height="26" fill="none"'
          + ' stroke="currentColor" stroke-width="2.6" stroke-linecap="round"'
          + ' stroke-linejoin="round" aria-hidden="true"><path d="M4 13l5.5 5.5L20 6"/></svg>'
        : DISCO;
    }
    function gracias() {
      var g = el('span', 'consiento-gracias', GRACIAS[lang2] || GRACIAS['en']);
      caja.appendChild(g);
      setTimeout(function () { g.classList.add('ida'); }, 2200);
      setTimeout(function () { if (g.parentNode) g.remove(); }, 2800);
    }
    cb.addEventListener('change', function () {
      try { localStorage.setItem('preceptor-consiento', cb.checked ? '1' : '0'); }
      catch (e) {  }
      vestir();
      if (cb.checked) gracias();
    });
    vestir();

    var decidido = false;
    try { decidido = localStorage.getItem('preceptor-consiento') !== null; }
    catch (e) {  }
    var rueda = decidido && document.getElementById('panel-ajustes');
    if (rueda) { caja.classList.add('consiento-en-rueda'); rueda.appendChild(caja); return; }

    cb.addEventListener('change', function () {
      var r = document.getElementById('panel-ajustes');
      if (r && caja.parentNode !== r) {
        caja.classList.add('consiento-en-rueda'); r.appendChild(caja);
      }
    });

    var atajos = document.getElementById('atajos');
    var ancla = (atajos && atajos.parentNode) ? atajos : campo.closest('.panel');
    if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(caja, ancla.nextSibling);
    else (campo.closest('.fila') || campo.parentNode).parentNode.insertBefore(caja, null);
  }

  function arrancar() {
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    consentimiento(CONS[lang] || CONS['en']);
  }
  addEventListener('load', arrancar);
  if (document.readyState === 'complete') arrancar();
})();
