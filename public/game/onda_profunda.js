/* preceptoros.org · theGame · PIEZA (b) FIRMADA (PR #106, Ola 0) · PROFUNDIDAD DE ONDAS
   SOBRE LA LEY DEL SUELO. ideas13oct:306: «"3D" SIMULADO sobre la ley del suelo
   isométrica». Nada de parallax, nada de sombras (prohibido,
   isometric_floor_projection.js:8-9): la profundidad legítima es el EJE que ya
   existe — orden de pintor estricto por (col+fila) — más ESCALA VIVA (la
   huella manda; F304: «el tamaño habla»).
   QUÉ HACE. Expone `AtlasOndaProfunda.planifica(lugares, sitio)`: para cada
   lugar del mapa devuelve su ANCLA (centro de su huella, IsometricFloor.ancla)
   y su PROFUNDIDAD (IsometricFloor.profundidad), para que el mar encole las
   ondas de combate como encola lugares y cangrejos: de atrás hacia delante.
   La onda delante tapa a la de atrás porque el ORDEN lo dice, no porque un
   truco lo finja. La proyección JAMÁS toca la decisión (gate maestro F305).
   ESCALA VIVA: el radio de la onda se modula por su profundidad relativa al
   plano (diferencia contra el centro visible), una función pura del orden:
   misma semilla e input = misma onda en calidad 0 y 2.
   Puro, sin DOM propio, sin assets, sin red, sin reloj: solo reutiliza la
   ley firmada el 2026-10-12. */
(function (raiz) {
  'use strict';
  var F = (typeof module === 'object' && module.exports) ? require('./isometric_floor_projection.js') : raiz.IsometricFloor;
  if (!F) { throw new Error('NO_DATA · la ley del suelo no está cargada: la pieza (b) no puede fingir profundidad sin ella'); }

  /* El plan de una onda: ancla del rombo (o del centro de su huella), profundidad
     del pintor y el radio con escala viva. Todo función pura del lugar. */
  function planifica(lugar, sitio, vista) {
    if (!lugar || !sitio) { return null; }
    var s = sitio(lugar), n = Math.max(1, lugar.huella || 1);
    var ancla = F.ancla(s.x, s.y, n, 1);
    var prof = F.profundidad({ col: s.x, fila: s.y, huella: n });
    /* ESCALA VIVA sin perspectiva: el radio crece LINEALMENTE con la profundidad
       relativa al plano (0 en el centro visible), clamp para no romper la retícula.
       Es una función del eje (col+fila), no de un punto de fuga: cero faked 3D. */
    var rel = vista && Number.isFinite(vista.centro) ? prof - vista.centro : 0;
    var escala = Math.max(0.75, Math.min(1.35, 1 + rel * 0.012));
    return { col: s.x, fila: s.y, huella: n, ancla: ancla, profundidad: prof,
             radio: (lugar.radio || 18) * escala, escala: escala };
  }

  /* Encola una onda en la cola del pintor del mar, con su ficha. Igual que `pon`
     de mar.js pero con la profundidad de la ley (huella incluida). */
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
