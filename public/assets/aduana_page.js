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
    raiz.AtlasAduana = { envia: function (paquete) { return F.dispatch(paquete, reg.estado === 'LIVE' ? { transport: raiz.fetch.bind(raiz) } : {}); } };
  }
  if (raiz.document.readyState === 'loading') { raiz.document.addEventListener('DOMContentLoaded', monta); } else { monta(); }
})(this);
