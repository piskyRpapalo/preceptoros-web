/* preceptoros.org · el Perfil, mitad OBRA. Lo que has hecho, no lo que dices.
 *
 * La otra mitad --quien eres, el busto, compartir-- esta en `profile.js`, que
 * ademas es quien abre la base y expone `window.Perfil`. Aqui solo se lee y se
 * escribe a traves de el.
 *
 * LAS TRES SECCIONES NO SON IGUALES, Y SE NOTA:
 *
 *   BIOGRAFIA · la escribes tu. Se guarda EN TU APARATO y se firma con tu
 *     clave. No viaja: no hay a donde. Se dice al guardar, no en letra
 *     pequena, porque quien escribe media pagina merece saber donde acaba.
 *
 *   MEDIDAS · salen de `ledger.jsonl`, filtradas por tu pseudonimo. Hoy la
 *     cabecera de ese fichero declara `lineas_firmadas: 0` y estado EJEMPLO:
 *     lo honesto no es pintar un cero pelado --que se lee como «mediste cero
 *     veces»-- sino decir que TODAVIA NO HA LLEGADO NINGUNA linea firmada de
 *     nadie. Son dos cosas distintas y la diferencia es el proyecto entero.
 *
 *   CONTRIBUCIONES · NO_DATA con causa. El Agora no publica endpoint de
 *     contribuciones (`/api/v1/threads` responde 404, medido el 2026-08-30).
 *     Un contador a cero aqui seria un sensor que miente: parece medido.
 *
 * LA VISTA PREVIA SE CONSTRUYE CON NODOS, NUNCA CON innerHTML. El texto lo
 * escribe una persona, y una persona puede escribir `<script>`. Con
 * `textContent` por nodo eso es literalmente lo que se ve: un menor, una ese.
 */
(function () {
  var block = document.getElementById('i18n');
  if (!block || !window.Perfil) return;
  var T = JSON.parse(block.textContent);
  var zonaBio = document.getElementById('perfil-bio');
  var zonaMed = document.getElementById('perfil-medidas');
  var zonaCon = document.getElementById('perfil-contribuciones');
  var TOPE = 2000;

  function p(texto, clase) {
    var n = document.createElement('p');
    if (clase) n.className = clase;
    n.textContent = texto;
    return n;
  }

  /* --- biografia: escribir y estructurar ------------------------------ */
  /* Tres marcas y ni una mas. Un editor con veinte botones se aprende una vez
     y se olvida; con tres, la estructura que sale es comparable entre perfiles
     -- que es lo que hace que una lista de perfiles se pueda leer entera. */
  function estructura(texto) {
    var frag = document.createDocumentFragment();
    var lista = null;
    (texto || '').split('\n').forEach(function (linea) {
      var l = linea.trim();
      if (!l) { lista = null; return; }
      if (l.slice(0, 2) === '##') {
        lista = null;
        var h = document.createElement('h3');
        h.textContent = l.slice(2).trim();
        frag.appendChild(h);
        return;
      }
      if (l.slice(0, 2) === '- ') {
        if (!lista) { lista = document.createElement('ul'); frag.appendChild(lista); }
        var li = document.createElement('li');
        li.textContent = l.slice(2);
        lista.appendChild(li);
        return;
      }
      lista = null;
      frag.appendChild(p(l));
    });
    return frag;
  }

  function pintaBio(guardada) {
    if (!zonaBio) return;
    zonaBio.innerHTML = '';
    var area = document.createElement('textarea');
    area.id = 'bio-texto'; area.rows = 8; area.maxLength = TOPE;
    area.value = (guardada && guardada.texto) || '';
    area.setAttribute('aria-label', T.pfBioEtiqueta);

    var barra = document.createElement('div');
    barra.className = 'fila'; barra.setAttribute('role', 'toolbar');
    barra.setAttribute('aria-label', T.pfBioBarra);
    [['## ', T.pfBioTitulo], ['- ', T.pfBioPunto]].forEach(function (m) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'leve'; b.textContent = m[1];
      b.addEventListener('click', function () {
        // Se inserta al PRINCIPIO DE LA LINEA donde esta el cursor. Meter la
        // marca donde cayo el cursor producia `una fra## se`, que no es
        // estructura: es texto roto con cara de marca.
        var i = area.selectionStart;
        var ini = area.value.lastIndexOf('\n', i - 1) + 1;
        area.value = area.value.slice(0, ini) + m[0] + area.value.slice(ini);
        area.focus();
        area.selectionStart = area.selectionEnd = i + m[0].length;
        refresca();
      });
      barra.appendChild(b);
    });

    var cuenta = p('', 'tenue');
    var vista = document.createElement('div');
    vista.className = 'bio-vista';
    var aviso = p('', 'tenue');

    function refresca() {
      cuenta.textContent = area.value.length + ' / ' + TOPE;
      vista.innerHTML = '';
      vista.appendChild(estructura(area.value));
    }
    area.addEventListener('input', refresca);

    var guardar = document.createElement('button');
    guardar.type = 'button'; guardar.className = 'boton';
    guardar.textContent = T.pfBioGuardar;
    guardar.addEventListener('click', function () {
      var bio = { texto: area.value, cuando: new Date().toISOString() };
      window.Perfil.guardar('bio', bio);
      if (!(window.Identity && window.Identity.quien())) {
        aviso.className = 'nodata';
        aviso.textContent = T.pfBioGuardadaSinFirma;
        return;
      }
      window.Identity.firmar(bio).then(function (f) {
        aviso.className = 'nodata';
        aviso.textContent = T.pfBioGuardada + ' ' + f.firma.slice(0, 24) + '…';
      }).catch(function (e) {
        aviso.className = 'nodata';
        aviso.textContent = T.pfBioSinFirma + ' ' + (e && e.message ? e.message : e);
      });
    });

    var h = document.createElement('h3'); h.textContent = T.pfBioVista;
    var pie = document.createElement('div'); pie.className = 'fila';
    pie.appendChild(guardar);
    [barra, area, cuenta, pie, aviso, h, vista].forEach(function (n) {
      zonaBio.appendChild(n);
    });
    refresca();
  }

  /* --- medidas firmadas ------------------------------------------------ */
  function pintaMedidas(cabecera, mias) {
    if (!zonaMed) return;
    zonaMed.innerHTML = '';
    var quien = window.Identity && window.Identity.quien();
    if (!quien) { zonaMed.appendChild(p(T.pfMedSinIdentidad, 'tenue')); return; }
    if (cabecera && cabecera.estado === 'EJEMPLO') {
      // El aviso va ANTES del numero: leido despues, el cero ya se entendio
      // como «este usuario no ha medido nada».
      zonaMed.appendChild(p(T.pfMedEjemplo + ' ' +
                            (cabecera.lineas_firmadas || 0) + '.', 'nodata'));
    }
    zonaMed.appendChild(p(T.pfMedTuyas + ' ' + mias.length));
    var ol = document.createElement('ol');
    mias.forEach(function (m) {
      var li = document.createElement('li');
      li.textContent = m.modelo + ' · ' + m.toks + ' tok/s · ' + m.hardware;
      ol.appendChild(li);
    });
    if (mias.length) zonaMed.appendChild(ol);
  }

  function cargarMedidas() {
    if (!zonaMed) return;
    fetch('/assets/ledger.jsonl', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (txt) {
      var cabecera = null, medidas = [];
      txt.split('\n').forEach(function (l) {
        l = l.trim();
        if (!l || l.charAt(0) === '#') return;
        var d;
        try { d = JSON.parse(l); } catch (e) { return; }
        if (d.tipo === 'cabecera') { cabecera = d; } else { medidas.push(d); }
      });
      var quien = window.Identity && window.Identity.quien();
      var mias = medidas.filter(function (m) { return m.evaluador === quien; });
      pintaMedidas(cabecera, mias);
    }).catch(function (e) {
      zonaMed.appendChild(p(T.pfMedSinDatos + ' ' + (e && e.message ? e.message : e),
                            'nodata'));
    });
  }

  /* --- contribuciones: NO_DATA, con causa y remedio -------------------- */
  if (zonaCon) {
    zonaCon.appendChild(p(T.pfConNoData, 'nodata'));
    zonaCon.appendChild(p(T.pfConRemedio, 'tenue'));
  }

  window.Perfil.leer('bio').then(function (b) { pintaBio(b); });
  document.addEventListener('preceptor:identity', cargarMedidas);
  cargarMedidas();
})();
