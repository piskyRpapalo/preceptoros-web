(function (raiz) {
  'use strict';
  var F = (typeof module === 'object' && module.exports) ? require('./isometric_floor_projection.js') : raiz.IsometricFloor;
  if (!F) { throw new Error('NO_DATA · la ley del suelo no está cargada: la pieza (b) no puede fingir profundidad sin ella'); }

    function planifica(lugar, sitio, vista) {
    if (!lugar || !sitio) { return null; }
    var s = sitio(lugar), n = Math.max(1, lugar.huella || 1);
    var ancla = F.ancla(s.x, s.y, n, 1);
    var prof = F.profundidad({ col: s.x, fila: s.y, huella: n });
        var rel = vista && Number.isFinite(vista.centro) ? prof - vista.centro : 0;
    var escala = Math.max(0.75, Math.min(1.35, 1 + rel * 0.012));
    return { col: s.x, fila: s.y, huella: n, ancla: ancla, profundidad: prof,
             radio: (lugar.radio || 18) * escala, escala: escala };
  }

    function encola(cola, plan, pinta, ficha) {
    if (!plan || typeof pinta !== 'function') { return false; }
    cola.push({ col: plan.col, fila: plan.fila, huella: plan.huella,
                profundidad: plan.profundidad, f: function () { return pinta(plan); }, ficha: ficha || null });
    return true;
  }

  var AtlasOndaProfunda = { planifica: planifica, encola: encola };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasOndaProfunda; }
  else { raiz.AtlasOndaProfunda = AtlasOndaProfunda; }
})(typeof module === 'object' && module.exports ? this : (this || window));
