// /aduana/ (North N2, 2026-10-26): mounts the node-card checker and writes the registry state from the contract.
// Observant: the send button stays asleep while the registry is not LIVE; nothing leaves this page.
(function (raiz) {
  'use strict';
  function monta() {
    var D = raiz.document, F = raiz.AtlasNodeFileReceiver, R = raiz.AtlasNodeReception, caja = D.getElementById('comprueba');
    if (!F || !R || !caja) { return; }
    var reg = R.REGISTRO, celda = D.getElementById('estado-registro'), envio = D.getElementById('estado-envio');
    if (celda) { celda.textContent = reg.estado === 'LIVE' ? 'Live' : 'NO_DATA'; celda.title = reg.causa + ' · measured ' + reg.medido; }
    if (envio && reg.estado !== 'LIVE') { envio.textContent = 'Asleep'; }
    F.mount(caja);
    // The only network capability of this page: handed to dispatch when (and only when) the registry is LIVE. Today it
    // is NO_DATA, so this is never reached and nothing leaves the page.
    raiz.AtlasAduana = { envia: function (paquete) { return F.dispatch(paquete, reg.estado === 'LIVE' ? { transport: raiz.fetch.bind(raiz) } : {}); },
      catalogo: catalogo };
    // North N3: the public catalogue. Asleep like the send: the button stays disabled and nothing is requested at load.
    var boton = D.getElementById('catalogo-carga');
    if (boton && reg.estado === 'LIVE') { boton.disabled = false; boton.addEventListener('click', function (e) { if (e.isTrusted) { catalogo(raiz.fetch.bind(raiz)); } }); }
  }
  function catalogo(transporte) {
    var D = raiz.document, C = raiz.AtlasNodeCatalogue, R = raiz.AtlasNodeReception, nota = D.getElementById('catalogo-estado'), tabla = D.getElementById('catalogo');
    if (!C || !R || !transporte) { return Promise.resolve({ ok: false, code: R ? R.REGISTRO.causa : 'not_loaded' }); }
    return Promise.resolve().then(function () { return transporte(R.ENDPOINT, { method: 'GET' }); }).then(function (res) { return res.json(); }).then(function (c) {
      var l = C.lee(c);
      if (!l.ok) { nota.textContent = 'NO_DATA · the registry answered with a list this page cannot trust (' + l.code + ').'; tabla.hidden = true; return l; }
      C.pinta(tabla.tBodies[0], l.filas, D); tabla.hidden = false; nota.textContent = l.filas.length + ' node cards. Pending means not verified.';
      return l;
    }, function () { nota.textContent = 'NO_DATA · the registry did not answer.'; return { ok: false, code: 'registry_unreachable' }; });
  }
  if (raiz.document.readyState === 'loading') { raiz.document.addEventListener('DOMContentLoaded', monta); } else { monta(); }
})(this);
