(function (raiz) {
  'use strict';

  // Pantallas F0-F3 del tutorial «De Onda a Nodo Soberano» (VT5). El modelo de vista es PURO: estado + medidas -> lo que se pinta.
  // La capa DOM solo crea nodos con textContent (nunca innerHTML) y reenvia el clic como evento de la maquina.
  // Cada boton de accion es un objetivo tactil de 44x44 px como minimo (la clase lo fija el CSS: ver TOQUE_MIN).

  var enNode = typeof module === 'object' && module.exports;
  var T = enNode ? require('./tutorial_fases.js') : raiz.AtlasTutorial;

  var TOQUE_MIN = 44;
  var TOTAL = 9;   // F0 (puerta) + 4 de F1 + 2 de F2 + 2 de F3
  var ORDEN = ['puerta', 'pulso', 'disipa', 'arena101', 'recompensa', 'campamento', 'primer_edificio', 'cartas', 'salto'];

  var TEXTO = {
    puerta: { t: 'Two doors', x: 'Go straight to a Node, or start in the Fog and follow the Wave.' },
    pulso: { t: 'The Wave', x: 'A pulse rises from the Wave. Press it to see the first ring of fog.' },
    disipa: { t: 'Clear the fog', x: 'The fog clears to the first silenced building.' },
    arena101: { t: 'Arena 101', x: 'One practice fork: a fight you can rewind, with a fixed seed.' },
    recompensa: { t: 'Reward', x: 'Three eggs with their own sound: Shield, Pike and Bow.' },
    campamento: { t: 'Camp', x: 'A camp fight in the style of Bad North.' },
    primer_edificio: { t: 'First building', x: 'Your first building gets a title and a prompt for the local mind.' },
    cartas: { t: 'Visit cards', x: 'Cards of real nodes. Signed and checked in memory; nothing is stored.' },
    salto: { t: 'Cross to Node 3', x: 'Only you can open the network. Nothing leaves the device until you cross.' }
  };

  function accion(id, etiqueta, evento, datos, causa) {
    return { id: id, etiqueta: etiqueta, evento: evento, datos: datos || {}, estado: causa ? 'bloqueada' : 'activa', causa: causa || null };
  }

  // st: estado de tutorial_fases.js · medidas: { etiqueta: string|null, causa: string } lo que la vista sabe medir.
  function vista(st, medidas) {
    medidas = medidas || {};
    var paso = st.fase === 'F0' ? 'puerta' : st.paso;
    var idx = ORDEN.indexOf(paso);
    var txt = TEXTO[paso] || { t: 'NO_DATA (step)', x: 'NO_DATA (step not in this view)' };
    var acc = [];
    if (paso === 'puerta') {
      acc = [accion('directo', 'Go straight to a Node', 'puerta', { puerta: 'directo' }), accion('niebla', 'Start in the Fog', 'puerta', { puerta: 'niebla' })];
    } else if (paso === 'disipa') {
      var dato = medidas.etiqueta ? { dato: 'medido', etiqueta: medidas.etiqueta } : { dato: 'NO_DATA', causa: medidas.causa || 'sin etiqueta medida' };
      acc = [accion('disipa', 'Clear the fog', 'disipa', dato)];
    } else if (paso === 'recompensa') {
      acc = [accion('recompensa', 'Collect 3 eggs', 'recompensa', { huevos: 3 })];
    } else if (paso === 'primer_edificio') {
      acc = [medidas.etiqueta
        ? accion('primer_edificio', 'Place first building', 'primer_edificio', { etiqueta: medidas.etiqueta })
        : accion('primer_edificio', 'Place first building', 'primer_edificio', {}, 'NO_DATA (sin etiqueta medida)')];
    } else if (paso === 'salto') {
      acc = [accion('cruza', 'Cross to Node 3', 'cruza', { humano: true })];
    } else if (paso === 'cruzado') {
      txt = { t: 'Crossed', x: 'The network is open by your hand.' };
    } else {
      acc = [accion(paso, txt.t, paso, {})];
    }
    return {
      fase: st.fase, paso: paso, titulo: txt.t, texto: txt.x,
      progreso: { hecho: paso === 'cruzado' ? TOTAL : idx < 0 ? 0 : idx + 1, total: TOTAL },
      red: !!st.red, acciones: acc, toque_min: TOQUE_MIN
    };
  }

  // Clic -> evento de la maquina. El clic es el gesto humano: solo el boton «cruza» lleva humano:true.
  function alPulsar(st, a) {
    if (!a || a.estado !== 'activa') { return { ok: false, motivo: 'accion bloqueada: ' + (a && a.causa) }; }
    if (a.evento === 'puerta') { return T.elige(st, a.datos.puerta); }
    return T.evento(st, a.evento, a.evento === 'cruza' ? { humano: true } : a.datos);
  }

  // Capa DOM fina: solo createElement, className, textContent y addEventListener.
  function monta(doc, raizEl, st, medidas, alEstado) {
    var v = vista(st, medidas);
    while (raizEl.firstChild) { raizEl.removeChild(raizEl.firstChild); }
    var h = doc.createElement('h2'); h.textContent = v.titulo; raizEl.appendChild(h);
    var p = doc.createElement('p'); p.textContent = v.texto; raizEl.appendChild(p);
    var pr = doc.createElement('p'); pr.className = 'tutorial-progreso'; pr.textContent = v.progreso.hecho + ' / ' + v.progreso.total; raizEl.appendChild(pr);
    v.acciones.forEach(function (a) {
      var b = doc.createElement('button');
      b.className = 'tutorial-accion touch44'; b.textContent = a.etiqueta; b.dataset.id = a.id;
      if (a.estado !== 'activa') { b.disabled = true; var c = doc.createElement('small'); c.textContent = a.causa; raizEl.appendChild(b); raizEl.appendChild(c); return; }
      b.addEventListener('click', function () { var r = alPulsar(st, a); if (r.ok) { alEstado(r.estado); } });
      raizEl.appendChild(b);
    });
    return v;
  }

  var AtlasUiTutorial = { TOQUE_MIN: TOQUE_MIN, TOTAL: TOTAL, ORDEN: ORDEN, TEXTO: TEXTO, vista: vista, alPulsar: alPulsar, monta: monta };
  if (enNode) { module.exports = AtlasUiTutorial; }
  else { raiz.AtlasUiTutorial = AtlasUiTutorial; }
})(this);
