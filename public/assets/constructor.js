/* preceptoros.org · el Constructor de agentes (Mision 3C, F0).
   Palancas arriba, prompt crudo abajo, y el crudo MANDA. La regla del canon es
   que el texto real esta siempre a la vista y siempre se puede editar: un
   constructor que esconde lo que compila ensena a confiar, no a construir.
   En cuanto alguien toca el texto a mano, las palancas dejan de sobrescribirlo
   y se dice en pantalla. Perder el trabajo de alguien en silencio por mover un
   desplegable seria lo contrario de lo que este panel existe para ensenar. */
(function () {
  var raiz = document.getElementById('constructor');
  var bloque = document.getElementById('i18n');
  if (!raiz || !bloque) return;
  var T = JSON.parse(bloque.textContent);
  var manual = false;

  function nodo(tipo, clase, texto) {
    var n = document.createElement(tipo);
    if (clase) n.className = clase;
    if (texto !== undefined) n.textContent = texto;
    return n;
  }
  function etiqueta(texto, para) {
    var l = nodo('label', 'cuenta', texto);
    l.setAttribute('for', para);
    l.style.display = 'block';
    l.style.marginTop = '.9rem';
    return l;
  }

  /* --- las palancas ------------------------------------------------------ */
  var rol = document.createElement('select');
  rol.id = 'c-rol';
  rol.style.font = 'inherit';
  rol.style.fontFamily = 'var(--mono)';
  rol.style.width = '100%';
  rol.style.padding = '.6rem';
  rol.style.border = '2px solid var(--bronce)';
  rol.style.background = '#fff';
  T.consRoles.forEach(function (r, i) {
    var o = document.createElement('option');
    o.value = String(i); o.textContent = r.nombre;
    rol.appendChild(o);
  });

  var reglas = nodo('div');
  T.consReglas.forEach(function (r, i) {
    var l = nodo('label');
    l.style.display = 'block';
    l.style.marginTop = '.35rem';
    var c = document.createElement('input');
    c.type = 'checkbox'; c.value = String(i);
    c.style.width = 'auto'; c.style.marginRight = '.5rem';
    if (r.fija) { c.checked = true; c.disabled = true; }
    l.appendChild(c);
    l.appendChild(document.createTextNode(r.texto));
    reglas.appendChild(l);
  });

  var tono = document.createElement('input');
  tono.type = 'range'; tono.id = 'c-tono';
  tono.min = '0'; tono.max = String(T.consTonos.length - 1); tono.value = '1';
  tono.style.padding = '0';
  var tonoNombre = nodo('p', 'tenue', '');
  tonoNombre.style.fontFamily = 'var(--mono)';

  /* --- el crudo ---------------------------------------------------------- */
  var crudo = document.createElement('textarea');
  crudo.id = 'c-crudo'; crudo.rows = 9;
  crudo.style.fontFamily = 'var(--mono)';
  crudo.setAttribute('aria-label', T.consCrudo);
  var avisoManual = nodo('p', 'nodata', T.consManual);
  avisoManual.hidden = true;

  function compilar() {
    var r = T.consRoles[Number(rol.value)];
    var marcadas = [];
    reglas.querySelectorAll('input').forEach(function (c) {
      if (c.checked) marcadas.push(T.consReglas[Number(c.value)].texto);
    });
    var t = T.consTonos[Number(tono.value)];
    tonoNombre.textContent = T.consTono + ' ' + t.nombre;
    return r.papel + '\n\n' + T.consReglasCabecera + '\n' +
           marcadas.map(function (x) { return '- ' + x; }).join('\n') +
           '\n\n' + t.instruccion;
  }
  function refrescar() {
    if (manual) { tonoNombre.textContent = T.consTono + ' ' + T.consTonos[Number(tono.value)].nombre; return; }
    crudo.value = compilar();
  }
  rol.addEventListener('change', refrescar);
  tono.addEventListener('input', refrescar);
  reglas.addEventListener('change', refrescar);
  crudo.addEventListener('input', function () {
    if (!manual) { manual = true; avisoManual.hidden = false; }
  });

  /* --- sellar ------------------------------------------------------------ */
  function sellar() {
    var marcadas = [];
    reglas.querySelectorAll('input').forEach(function (c) {
      if (c.checked) marcadas.push(T.consReglas[Number(c.value)].texto);
    });
    var agente = {
      esquema: 1,
      origen: 'preceptoros.org/agente',
      fecha: new Date().toISOString().slice(0, 10),
      rol: T.consRoles[Number(rol.value)].nombre,
      reglas: marcadas,
      tono: T.consTonos[Number(tono.value)].nombre,
      // El prompt que viaja es el que se ve, editado o no. Si guardaramos el
      // compilado mientras la pantalla ensena otra cosa, el fichero mentiria.
      prompt: crudo.value,
      prompt_editado_a_mano: manual
    };
    var texto = JSON.stringify(agente, null, 2);
    var url = URL.createObjectURL(new Blob([texto], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url; a.download = 'agente.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    return agente;
  }

  var boton = nodo('button', '', T.consSellar);
  boton.type = 'button';
  var hecho = nodo('p', 'tenue', '');
  boton.addEventListener('click', function () {
    var a = sellar();
    (window.fluido || function (f) { f(); })(function () {
    hecho.textContent = T.consSellado + ' · ' + a.reglas.length + ' ' + T.consReglasN +
                        ' · ' + a.prompt.length + ' ' + T.consCaracteres;
    });
  });

  raiz.appendChild(etiqueta(T.consRol, 'c-rol'));
  raiz.appendChild(rol);
  raiz.appendChild(etiqueta(T.consReglasT, ''));
  raiz.appendChild(reglas);
  raiz.appendChild(etiqueta(T.consTonoT, 'c-tono'));
  raiz.appendChild(tono);
  raiz.appendChild(tonoNombre);
  raiz.appendChild(etiqueta(T.consCrudo, 'c-crudo'));
  raiz.appendChild(crudo);
  raiz.appendChild(avisoManual);
  var f = nodo('div', 'fila');
  f.appendChild(boton);
  raiz.appendChild(f);
  raiz.appendChild(hecho);
  refrescar();
})();
