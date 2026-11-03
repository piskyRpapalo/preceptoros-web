/* preceptoros.org · el microfono, y por que vuelve asi.
   Se retiro el 2026-08-26: usaba `webkitSpeechRecognition`, que manda el audio
   a Google, mientras el producto prometia que nada salia de la maquina.

   Vuelve con dos vias. LOCAL: si el navegador sabe dictar EN EL APARATO
   (`processLocally`), se hace ahi y no se pregunta: no hay trato si no sale
   nada. NUBE (pedida por el Soberano el 2026-09-05): si solo sabe hacerlo por
   la nube, el boton la ofrece y solo la usa tras aceptar el trato dicho
   entero --tu voz sale de aqui y va a Google--. Excepcion de promesa firmada
   el 2026-10-04 (`preceptor/EXCEPCIONES.md`).

   2026-10-04 · LA VOZ VERIFICADA. Lo que faltaba para cerrar la excepcion:
   1. EL SI SE REGISTRA. Ya no es un '1': es {que, alcance, ttl_s, fecha, hash},
      con el hash SHA-256 del texto del trato aceptado. Si el trato cambia, el
      si viejo no vale; si pasa el ttl, no vale. Sin registro no hay nube --y
      si este navegador no puede calcular la huella, se dice, no se abre--.
      Sigue en `sessionStorage`: al cerrar se apaga.
   2. EL KILLSWITCH VERIFICA. «Revocar voz» (boton, y Alt+Shift+V) borra el
      permiso, aborta el reconocimiento y ESPERA el evento de fin del
      navegador. «Revocado» solo se pinta desde ese evento; si no llega en el
      plazo, se declara el fallo y se dice que cerrar la pestana lo asegura.
   3. SE OYE. Un tono corto al abrir (agudo) y al cerrar (grave), generado
      aqui con Web Audio: cero peticiones. Se puede apagar.
   Y nada de lo dicho se guarda: el texto va al campo de escribir y punto. */
(function () {
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  var block = document.getElementById('i18n');
  var fila = document.getElementById('voice');
  var entrada = document.getElementById('pregunta');
  if (!block || !fila || !entrada) return;
  var T = JSON.parse(block.textContent);
  var CLAVE = 'voz-nube', SILENCIO = 'voz-silencio';
  var TTL_S = 1800, PLAZO_MS = 3000, ATAJO = 'Alt+Shift+V';

  function decir(texto, clase) {
    var p = fila.parentNode.querySelector('.voice-nota') || document.createElement('p');
    p.className = 'voice-nota ' + (clase || 'tenue');
    p.setAttribute('role', 'status');
    p.textContent = texto;
    if (!p.parentNode) fila.parentNode.appendChild(p);
  }

  // Icono en linea y no una imagen: cero peticiones y hereda el color.
  var MIC = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><path d="M12 17v4"/><path d="M8 21h8"/></svg>';
  var boton = document.createElement('button');
  boton.type = 'button'; boton.className = 'leve mic';
  boton.innerHTML = MIC + '<span class="rotulo">' + T.micHablar + '</span>';
  boton.setAttribute('aria-label', T.micHablar);

  if (!SR) {
    /* Ni local ni nube. El boton no se desactiva --apagado no se puede pulsar
       y nadie llega a la explicacion-- sino que declara `aria-disabled` y al
       pulsarlo cuenta por que. */
    boton.setAttribute('aria-disabled', 'true');
    boton.title = T.micSinLocal;
    fila.appendChild(boton);
    boton.addEventListener('click', function () { aviso(T.micSinLocal); });
    return;
  }
  var LOCAL = 'processLocally' in SR.prototype;

  /* --- 1 · el registro del si ---------------------------------------------
     La huella del trato se calcula al cargar y sin red (`crypto.subtle`). Hasta
     que existe, `permisoVigente()` es falso: sin huella no hay si que comparar. */
  var huella = null;
  try {
    crypto.subtle.digest('SHA-256', new TextEncoder().encode(T.micNubeTrato)).then(function (h) {
      huella = Array.prototype.map.call(new Uint8Array(h), function (b) {
        return (b < 16 ? '0' : '') + b.toString(16); }).join('');
      actualiza();
    }, function () { /* sin huella: la nube queda cerrada */ });
  } catch (e) { /* sin crypto.subtle: la nube queda cerrada, y se dira al pedirla */ }

  function permisoVigente() {
    var p = null;
    try { p = JSON.parse(sessionStorage.getItem(CLAVE) || 'null'); } catch (e) { return false; }
    if (!p || p.que !== 'voz-web' || !huella || p.hash !== huella) return false;
    var desde = Date.parse(p.fecha);
    if (isNaN(desde) || typeof p.ttl_s !== 'number') return false;
    // Caducado = sin permiso. Y se borra: un si muerto no se queda de adorno.
    if (Date.now() >= desde + p.ttl_s * 1000) { borraPermiso(); return false; }
    return true;
  }
  function registra() {
    if (!huella) return false;
    try {
      sessionStorage.setItem(CLAVE, JSON.stringify({
        que: 'voz-web', alcance: ['dictado-por-pulsacion', 'motor-del-navegador'],
        ttl_s: TTL_S, fecha: new Date().toISOString(), hash: huella }));
    } catch (e) { return false; }
    // Se relee: escrito no es lo mismo que registrado.
    return permisoVigente();
  }
  function borraPermiso() {
    try { sessionStorage.removeItem(CLAVE); return sessionStorage.getItem(CLAVE) === null; }
    catch (e) { return false; }
  }

  /* --- 3 · el aviso sonoro ------------------------------------------------
     El contexto se crea en el gesto (la pulsacion) para que el navegador lo
     deje sonar; el tono se genera aqui, no se descarga. */
  var audio = null;
  function callado() { try { return sessionStorage.getItem(SILENCIO) === '1'; } catch (e) { return false; } }
  function preparaAudio() {
    if (audio || callado()) return;
    try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) audio = new AC(); } catch (e) { audio = null; }
  }
  function pitido(abre) {
    if (!audio || callado()) return;
    try {
      if (audio.state === 'suspended') audio.resume();
      var o = audio.createOscillator(), g = audio.createGain(), t = audio.currentTime;
      o.frequency.value = abre ? 880 : 440;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.08, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
      o.connect(g); g.connect(audio.destination); o.start(t); o.stop(t + 0.16);
    } catch (e) { /* sin audio queda el aviso visual */ }
  }

  /* El aviso emergente: pegado al boton, se cierra fuera o con Escape. */
  function aviso(texto, rotuloSi, alAceptar) {
    var previo = document.querySelector('.voice-aviso');
    if (previo) { previo.remove(); return; }
    var caja = document.createElement('div');
    caja.className = 'voice-aviso';
    caja.setAttribute('role', 'status');
    var p = document.createElement('p');
    p.textContent = texto;
    caja.appendChild(p);
    var x = document.createElement('button');
    x.type = 'button'; x.className = 'voice-aviso-cerrar'; x.textContent = '×';
    x.setAttribute('aria-label', T.micCerrarAviso);
    x.addEventListener('click', function () { caja.remove(); });
    caja.appendChild(x);
    // El SI es un boton aparte: aceptar es un gesto, y tiene que costar uno.
    if (rotuloSi && alAceptar) {
      var si = document.createElement('button');
      si.type = 'button'; si.className = 'voice-aviso-si';
      si.textContent = rotuloSi;
      si.addEventListener('click', function () { caja.remove(); alAceptar(); });
      caja.appendChild(si);
    }
    fila.appendChild(caja);
    function fuera(e) {
      if (caja.contains(e.target) || fila.contains(e.target)) return;
      caja.remove(); document.removeEventListener('click', fuera);
    }
    setTimeout(function () { document.addEventListener('click', fuera); }, 0);
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape') { caja.remove(); document.removeEventListener('keydown', esc); }
    });
  }

  /* `vivo` va de `start()` al fin que el NAVEGADOR anuncia (onend/onerror), y
     solo esos dos lo apagan. `abierto` es el micro de verdad (onstart). */
  var vivo = false, abierto = false, rec = null, alFin = null;

  function reposo() {
    boton.querySelector('.rotulo').textContent = T.micHablar;
    boton.setAttribute('aria-label', T.micHablar);
    boton.classList.remove('oyendo');
  }
  function terminado(tipo) {
    vivo = false;
    if (abierto) { abierto = false; pitido(false); }
    reposo();
    var f = alFin; alFin = null;
    if (f) f(tipo);
    actualiza();
  }

  /* UN SOLO MOTOR, DOS TRATOS: `local` decide si se pide `processLocally`. */
  function arranca(local) {
    if (vivo && rec) { rec.stop(); return; }
    // LA GUARDA: sin un si registrado y vigente, la via de nube no arranca.
    if (!local && !permisoVigente()) { decir(T.micSinRegistro, 'nodata'); return; }
    var r = rec = new SR();
    r.lang = navigator.language || 'es-ES';
    r.interimResults = true;
    r.continuous = false;
    if (local) r.processLocally = true;
    var base = entrada.value;
    r.onstart = function () {
      abierto = true; pitido(true);
      boton.querySelector('.rotulo').textContent = T.micEscuchando;
      boton.setAttribute('aria-label', T.micEscuchando);
      boton.classList.add('oyendo');
      decir(local ? T.micEnAparato : T.micEnNube, local ? 'tenue' : 'nodata');
    };
    r.onresult = function (e) {
      if (r !== rec || !vivo) return;
      var t = '';
      for (var i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      entrada.value = (base ? base + ' ' : '') + t;
      entrada.dispatchEvent(new Event('input', { bubbles: true }));
    };
    r.onerror = function (e) {
      // Durante una revocacion el `aborted` es la confirmacion, no un fallo.
      if (!alFin) decir(T.micFallo + ' ' + (e.error || '?'), 'nodata');
      if (r === rec && vivo) terminado('error:' + (e.error || '?'));
    };
    r.onend = function () { if (r === rec && vivo) terminado('end'); };
    vivo = true; actualiza();
    try { r.start(); }
    catch (e) { vivo = false; actualiza(); decir(T.micFallo + ' ' + (e && e.message ? e.message : e), 'nodata'); }
  }

  /* --- 2 · el killswitch que verifica -------------------------------------
     «Revocado» se pinta SOLO desde `alFin`, que solo llaman onend/onerror. Si
     no habia nada vivo, el fin ya lo anuncio el navegador antes (`vivo` solo
     se apaga ahi). Si el fin no llega en el plazo: fallo declarado, y si llega
     tarde, se dice tambien. */
  function revoca() {
    var aviso0 = document.querySelector('.voice-aviso');
    if (aviso0) aviso0.remove();
    var sinPermiso = borraPermiso();
    function veredicto(cerrado, causa) {
      if (cerrado && sinPermiso) decir(T.micRevocado, 'tenue');
      else decir(T.micRevocarFallo + ' (' + causa + ')', 'nodata');
      actualiza();
    }
    if (!vivo) { veredicto(true, sinPermiso ? '' : 'permiso'); return; }
    var plazo = setTimeout(function () { veredicto(false, 'sin-fin-' + PLAZO_MS + 'ms'); }, PLAZO_MS);
    alFin = function (tipo) { clearTimeout(plazo); veredicto(true, tipo); };
    try { rec.abort(); }
    catch (e) { clearTimeout(plazo); veredicto(false, 'abort'); }
  }

  var revocar = document.createElement('button');
  revocar.type = 'button'; revocar.className = 'leve voice-revocar';
  revocar.textContent = T.micRevocar;
  revocar.title = T.micRevocar + ' · ' + ATAJO;
  revocar.setAttribute('aria-keyshortcuts', ATAJO);
  revocar.hidden = true;
  revocar.addEventListener('click', revoca);
  // `code` y no `key`: en macOS Alt+Shift+V escribe un simbolo, no una «V».
  document.addEventListener('keydown', function (e) {
    if (e.altKey && e.shiftKey && e.code === 'KeyV') { e.preventDefault(); revoca(); }
  });

  var sonido = document.createElement('button');
  sonido.type = 'button'; sonido.className = 'leve voice-pitido';
  sonido.textContent = T.micPitido;
  sonido.addEventListener('click', function () {
    try { if (callado()) sessionStorage.removeItem(SILENCIO); else sessionStorage.setItem(SILENCIO, '1'); }
    catch (e) { /* sin sesion: queda como estaba */ }
    actualiza();
  });

  function actualiza() {
    var v = permisoVigente();
    boton.dataset.permiso = v ? 'vigente' : 'no';
    revocar.hidden = !(vivo || v);
    sonido.setAttribute('aria-pressed', callado() ? 'false' : 'true');
    document.dispatchEvent(new CustomEvent('preceptor:voz'));
  }

  boton.title = LOCAL ? T.micHablar : T.micNubeTrato;
  boton.addEventListener('click', function () {
    preparaAudio();
    if (LOCAL || vivo || permisoVigente()) { arranca(LOCAL); return; }
    aviso(T.micNubeTrato, T.micNubeSi, function () {
      if (!registra()) { decir(T.micSinRegistro, 'nodata'); return; }
      arranca(false);
    });
  });
  fila.appendChild(boton);
  fila.appendChild(revocar);
  fila.appendChild(sonido);
  actualiza();
})();
