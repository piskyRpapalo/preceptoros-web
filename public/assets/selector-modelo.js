/* preceptoros.org · elegir con que cerebro hablas, sin recargar.
 *
 * ENVUELVE, NO REESCRIBE. `chat.js` pide el turno con `Rack.stream(modelo,...)`
 * y coge ese `modelo` del compañero. Aquí no se toca ni `chat.js` ni el router:
 * se envuelve `Rack.stream` y se le sustituye el primer argumento cuando hay
 * elección guardada. Es la regla de la casa --`chat-router.js` la fijó-- y
 * además es lo único que aplica el cambio EN EL TURNO SIGUIENTE sin recargar.
 *
 * NO TRAE NI UNA CLAVE i18n NUEVA. La única palabra es «Modelo», y ocho
 * traducciones de una palabra caben aquí mejor que en ocho bloques i18n --las
 * portadas griega y rusa están a menos de un kilobyte del tope--.
 *
 * LOS NOMBRES SON LOS DEL RACK, sin maquillar. Quien abra esto está probando
 * cerebros, y un rótulo bonito encima de un identificador solo añade un sitio
 * donde equivocarse. */
(function () {
  var LLAVE = 'preceptor-modelo';
  var PALABRA = { es:'Modelo', en:'Model', pt:'Modelo', fr:'Modèle', it:'Modello',
                  de:'Modell', el:'Μοντέλο', ru:'Модель' };
  /* Comprobados con un POST real contra el túnel el 2026-09-07. El 403 que se
     ve a veces es limitación de ritmo, no del modelo: se repite y pasa. */
  var MODELOS = [
    ['', '— el del compañero —'],
    ['preceptor-charla-web:v1', 'charla-web:v1 · hechos, sin adaptador'],
    ['preceptor-charla-base:v1', 'charla-base:v1 · LoRA 300 pasos'],
    ['preceptor-charla-multi:v1', 'charla-multi:v1 · LoRA 7 lenguas'],
    ['preceptor-v7:latest', 'preceptor-v7 · el anterior'],
    ['qwen3-coder:30b', 'qwen3-coder:30b · 30B, sin system'],
    ['mistral:7b-instruct-v0.3-q4_K_M', 'mistral 7B · base pura']
  ];

  function guardado() {
    try { return localStorage.getItem(LLAVE) || ''; } catch (e) { return ''; }
  }

  /* La sustitución vive aquí y no en el `change`: así vale también para el
     valor que ya estaba guardado de una visita anterior. */
  function envolver() {
    if (!window.Rack || window.Rack.__envuelto) return;
    var original = window.Rack.stream;
    window.Rack.stream = function (modelo, prompt, alTrozo) {
      return original.call(window.Rack, guardado() || modelo, prompt, alTrozo);
    };
    window.Rack.__envuelto = true;
  }

  function pintar() {
    var panel = document.getElementById('panel-ajustes');
    if (!panel || document.getElementById('sel-modelo')) return;
    var lang = (document.documentElement.lang || 'es').slice(0, 2);
    var fila = document.createElement('p');
    fila.className = 'ajuste-fila';
    var et = document.createElement('label');
    et.htmlFor = 'sel-modelo';
    et.textContent = (PALABRA[lang] || PALABRA.es) + ' ';
    var sel = document.createElement('select');
    sel.id = 'sel-modelo';
    sel.className = 'leve';
    MODELOS.forEach(function (m) {
      var o = document.createElement('option');
      o.value = m[0]; o.textContent = m[1];
      sel.appendChild(o);
    });
    sel.value = guardado();
    sel.addEventListener('change', function () {
      try { localStorage.setItem(LLAVE, sel.value); } catch (e) { /* privado */ }
      document.dispatchEvent(new CustomEvent('preceptor:brain', {
        detail: { name: sel.value || '—', live: false } }));
    });
    fila.appendChild(et); fila.appendChild(sel);
    panel.appendChild(fila);
  }

  envolver();
  // `Rack` puede cargar después que esto; se vuelve a intentar una vez.
  addEventListener('load', function () { envolver(); pintar(); });
  if (document.readyState !== 'loading') pintar();
  else addEventListener('DOMContentLoaded', pintar);
})();
