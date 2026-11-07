// Caravan contract (E2, PROPOSE-ONLY). Pure. Places are aliases, never account ids.
(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var ESTADOS = ['PROPOSED', 'ACTIVE', 'INTERCEPTED', 'COMPLETED', 'FLED', 'EXPIRED', 'EMULATED', 'NO_DATA'];
  var RECURSOS = ['luz', 'biomasa', 'cobre', 'flujo', 'oxigeno'];
  var CAMPOS = ['route', 'state', 'cargo', 'cycle_proposed', 'cycle_expires', 'signature'];
  var LUGAR = /^[a-z0-9_-]{1,64}$/;
  var TOPE = 1e6, CICLO = 1e9;

  var TABLA = {
    PROPOSED: { accept: 'ACTIVE', expire: 'EXPIRED', no_data: 'NO_DATA' },
    ACTIVE: { intercept: 'INTERCEPTED', expire: 'EXPIRED', no_data: 'NO_DATA' },
    INTERCEPTED: { flee: 'FLED', expire: 'EXPIRED', no_data: 'NO_DATA' }
  };

  function tiene(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function entero(v, min, max) { return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max; }

  function campos(o, lista, donde, f) {
    if (!o || typeof o !== 'object' || Array.isArray(o)) { f.push(donde + ' not object'); return false; }
    Object.keys(o).forEach(function (k) { if (lista.indexOf(k) < 0) { f.push(donde + ' extra ' + k); } });
    lista.forEach(function (k) { if (!tiene(o, k)) { f.push(donde + ' misses ' + k); } });
    return true;
  }

  // valida(c) → failures; [] when well formed.
  function valida(c) {
    var f = [];
    if (!campos(c, CAMPOS, 'caravana', f)) { return f; }
    if (campos(c.route, ['from_place', 'to_place'], 'route', f)) {
      ['from_place', 'to_place'].forEach(function (k) {
        if (typeof c.route[k] !== 'string' || !LUGAR.test(c.route[k])) { f.push('route.' + k + ' not an alias'); }
      });
      if (c.route.from_place === c.route.to_place) { f.push('route origin equals destination'); }
    }
    if (ESTADOS.indexOf(c.state) < 0) { f.push('state not in enum'); }
    if (!Array.isArray(c.cargo) || c.cargo.length < 1) { f.push('cargo empty'); }
    else {
      c.cargo.forEach(function (x, i) {
        if (!campos(x, ['resource', 'amount'], 'cargo[' + i + ']', f)) { return; }
        if (RECURSOS.indexOf(x.resource) < 0) { f.push('cargo[' + i + '].resource not engine'); }
        if (!entero(x.amount, 1, TOPE)) { f.push('cargo[' + i + '].amount not int 1..' + TOPE); }
      });
    }
    ['cycle_proposed', 'cycle_expires'].forEach(function (k) {
      if (!entero(c[k], 0, CICLO)) { f.push(k + ' not integer 0..' + CICLO); }
    });
    if (entero(c.cycle_proposed, 0, CICLO) && entero(c.cycle_expires, 0, CICLO) && c.cycle_expires < c.cycle_proposed) { f.push('cycle_expires < cycle_proposed'); }
    if (campos(c.signature, ['state'], 'signature', f) && ['REQUIRED', 'SIGNED'].indexOf(c.signature.state) < 0) { f.push('signature state invalid'); }
    if (c.state === 'COMPLETED' && !(c.signature && c.signature.state === 'SIGNED')) { f.push('signature: COMPLETED needs SIGNED'); }
    return f;
  }

  // transicion(estado, evento) → next state or NO_DATA. complete: COMPLETED only if firma SIGNED, else EMULATED.
  function transicion(estado, evento) {
    var obj = typeof evento === 'object' && evento !== null, tipo = obj ? evento.tipo : evento;
    if (tipo === 'complete') {
      if (estado !== 'ACTIVE') { return 'NO_DATA'; }
      return obj && evento.firma === 'SIGNED' ? 'COMPLETED' : 'EMULATED';
    }
    if (!tiene(TABLA, estado) || !tiene(TABLA[estado], tipo)) { return 'NO_DATA'; }
    return TABLA[estado][tipo];
  }

  // evento_publico(c) → state and route aliases only.
  function evento_publico(c) {
    var ok = valida(c).length === 0;
    return { event: 'caravan_state', state: ok ? c.state : 'NO_DATA', route: ok ? { from_place: c.route.from_place, to_place: c.route.to_place } : null };
  }

  var AtlasCaravan = { ESTADOS: ESTADOS, RECURSOS: RECURSOS, valida: valida, transicion: transicion, evento_publico: evento_publico };
  if (common) { module.exports = AtlasCaravan; }
  else { root.AtlasCaravan = AtlasCaravan; }
})(typeof globalThis === 'object' ? globalThis : this);
