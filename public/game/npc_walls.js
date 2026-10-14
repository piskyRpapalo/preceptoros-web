/* Q6 · Signed local NPC occupation controls for the honest place inspector. */
(function (root) {
  'use strict';
  var live = null;
  function cycle() {
    var j = root.AtlasJuego, s = j && j.instantanea ? j.instantanea() : null;
    return s && Number.isSafeInteger(s.ciclo) ? s.ciclo : null;
  }
  function text(tag, value) { var e = root.document.createElement(tag); e.textContent = value; return e; }
  function button(label, fn) {
    var b = text('button', label); b.type = 'button'; b.className = 'boton-sec'; b.style.minHeight = '44px';
    b.addEventListener('click', fn); return b;
  }
  function informa(z, r) { z.textContent = r && (r.causa || (r.ok ? 'Saved with your account signature.' : 'NO_DATA (action not saved)')); }
  function monta(panel, f) {
    if (!f || !f.npcId || !live || !root.document) { return; }
    var d = root.document, box = d.createElement('section'), status = text('p', 'Loading signed local occupation…');
    box.className = 'npc-wall-controls'; box.appendChild(status);
    function render() {
      var c = cycle(), pub = live.pub(), s = live.api.estado(f.npcId, c, pub);
      box.textContent = '';
      box.appendChild(text('h4', 'Local practice occupation'));
      box.appendChild(text('p', s.fase === 'NO_DATA' || s.fase === 'niebla' ? 'NO_DATA (' + s.causa + ')' :
        s.fase === 'aviso' ? 'Upkeep due · fog returns in ' + s.ciclos_niebla + ' game cycles.' :
        'Sustained · upkeep every ' + live.api.CICLOS + ' game cycles.'));
      var msg = live.api.mural(f.npcId, c, pub);
      if (msg) { box.appendChild(text('blockquote', msg)); }
      if (s.fase === 'niebla' || s.fase === 'NO_DATA') {
        box.appendChild(button('Sign local occupation', function () { live.api.captura(f.npcId, cycle()).then(function (r) { informa(status, r); render(); }); }));
      } else {
        if (s.fase === 'aviso') { box.appendChild(button('Maintain for ' + live.api.CICLOS + ' cycles', function () { live.api.sostener(f.npcId, cycle(), pub).then(function (r) { informa(status, r); render(); }); })); }
        if (!msg) {
          var input = d.createElement('textarea'); input.maxLength = 161; input.setAttribute('aria-label', 'Building wall message (160 characters maximum)'); box.appendChild(input);
          box.appendChild(button('Write message', function () { live.api.escribe(f.npcId, input.value, cycle(), pub).then(function (r) { informa(status, r); render(); }); }));
        }
      }
      box.appendChild(status);
    }
    panel.appendChild(box); render();
  }
  function inicia(lugares, getPub) {
    if (live || !root.AtlasArmy || !root.AtlasNpcOccupancy) { return; }
    var I = root.Identity, ids = lugares.filter(function (l) { return l.npc; }).map(function (l) { return l.id; });
    var api = root.AtlasNpcOccupancy.crea({ ids: ids, almacen: root.AtlasArmy.cajaWeb('atlas-conquista', 'conquista', 'occupancy'),
      publica: function () { return I && I.publica ? I.publica() : null; },
      firma: function (body) { return I && I.firmar ? I.firmar(body) : Promise.reject(new Error('account signature unavailable')); },
      verifica: root.AtlasArmy.verificaWeb });
    live = { api: api, pub: getPub || function () { return null; }, ready: false };
    return api.cargar().then(function () { live.ready = true; root.document.dispatchEvent(new CustomEvent('atlas:territory')); });
  }
  function captura(id, ciclo) { return live && live.ready ? live.api.captura(id, ciclo) : Promise.resolve({ ok: false, causa: 'NO_DATA (signed occupation registry is loading)' }); }
  function estado(id, ciclo, pub) { return live && live.ready ? live.api.estado(id, ciclo, pub) : { fase: 'NO_DATA', causa: 'signed occupation registry is loading' }; }
  function mural(id, ciclo, pub) { return live && live.ready ? live.api.mural(id, ciclo, pub) : null; }
  root.AtlasNpcWalls = { inicia: inicia, captura: captura, estado: estado, mural: mural, monta: monta };
})(this);
