(function (root) {
  'use strict';
  function crea() {
    var ultimo = null;
    return {
      cambiaCiclo: function (c) { if (!Number.isSafeInteger(c) || c === ultimo) { return false; } ultimo = c; return true; },
      explorados: function (r, estado) {
        var salida = {};
        Object.keys(r || {}).forEach(function (k) {
          var id = k.indexOf('npc:') === 0 ? k.slice(4) : null, e = id && estado ? estado(id) : null;
          if (r[k].g + r[k].p && (!e || (e.fase !== 'niebla' && e.fase !== 'NO_DATA'))) { salida[k] = true; }
        });
        return salida;
      },
      mensaje: function (g, lugar, f, pinta, p, radio, dpr) {
        var m = lugar.npc && f.mural ? f.mural(lugar.id) : null;
        if (m) { pinta(g, m.slice(0, 48), p[0], p[1] + radio + 48 * dpr); }
      },
      ficha: function (l, nombre, estado, tropa) {
        return { que: nombre, estado: estado, tropa: tropa, npcId: l.npc ? l.id : null,
          defenses: l.npc && l.defensa ? l.defensa.tropas.length + ' declared units · defense pack ' + (l.defensa.pack_sha || 'NO_DATA (defense pack missing)') : null };
      }
    };
  }
  root.AtlasNpcTerritoryMap = { crea: crea };
})(this);
