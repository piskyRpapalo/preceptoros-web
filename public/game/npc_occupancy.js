/* Q6 · NPC occupancy: signed local owner, one wall message, upkeep and fog by game cycle. */
(function (root) {
  'use strict';
  var MOD = typeof module === 'object' && module.exports;
  var V = MOD ? require('./valores.js') : root.AtlasValores;
  var CICLOS = V && V.combate ? V.combate.abandono_ciclos : null;
  var REGISTRO = 'atlas.local-occupancy.registry/1', SOBRE = 'atlas.local-occupancy/1';
  var HEX = /^[0-9a-f]{64}$/;
  var CAUSA_LOCAL = 'NO_DATA (signed occupancy could not be saved locally)';

  function saneaMensaje(valor) {
    if (typeof valor !== 'string') { return { ok: false, causa: 'message is not text' }; }
    var texto = valor.trim(), largo = Array.from(texto).length;
    if (!largo) { return { ok: false, causa: 'message is empty' }; }
    if (largo > 160) { return { ok: false, causa: 'message exceeds 160 characters' }; }
    if (/[\u0000-\u001f\u007f<>]/.test(texto) || /https?:|www\.|\b[^\s@]+@[^\s@]+\b|\b\d{1,3}(\.\d{1,3}){3}\b|\/[/a-z]/i.test(texto)) {
      return { ok: false, causa: 'message contains markup, a route or contact data' };
    }
    return { ok: true, texto: texto };
  }
  function entero(n) { return Number.isSafeInteger(n) && n >= 0 && n <= 1000000000; }
  function validaSobre(e, ids) {
    var b = e && e.cuerpo, campos = ['captured_cycle', 'id', 'maintained_cycle', 'message', 'owner_pub', 'schema', 'sequence'];
    if (!e || Object.keys(e).sort().join() !== 'cuerpo,firma' || typeof e.firma !== 'string' || !/^ed25519:[0-9a-f]{128}$/.test(e.firma)) { return 'receipt shape'; }
    if (!b || Object.keys(b).sort().join() !== campos.sort().join() || b.schema !== SOBRE) { return 'body shape'; }
    if (ids.indexOf(b.id) < 0 || !HEX.test(b.owner_pub || '') || !entero(b.captured_cycle) ||
        !entero(b.maintained_cycle) || b.maintained_cycle < b.captured_cycle || !Number.isSafeInteger(b.sequence) || b.sequence < 1) { return 'receipt fields'; }
    if (typeof b.message !== 'string' || (b.message && !saneaMensaje(b.message).ok)) { return 'message form'; }
    return '';
  }
  function estadoBody(b, ciclo, pub, limite) {
    if (!b) { return { fase: 'niebla', causa: 'no signed local occupation' }; }
    if (!entero(ciclo)) { return { fase: 'NO_DATA', causa: 'current game cycle not measured' }; }
    if (pub !== b.owner_pub) { return { fase: 'niebla', causa: 'this account does not hold the signed occupation' }; }
    var edad = ciclo - b.maintained_cycle;
    if (edad < 0) { return { fase: 'NO_DATA', causa: 'receipt cycle is ahead of the game' }; }
    if (edad <= limite) { return { fase: 'sostenido', ciclos_aviso: limite - edad, ciclos_niebla: 2 * limite - edad, mensaje: b.message }; }
    if (edad < 2 * limite) { return { fase: 'aviso', vida: Math.floor((2 * limite - edad) * 1000 / limite), ciclos_niebla: 2 * limite - edad, mensaje: b.message }; }
    return { fase: 'niebla', causa: 'upkeep expired after ' + edad + ' cycles' };
  }
  function crea(op) {
    op = op || {};
    var ids = Array.isArray(op.ids) ? op.ids.slice() : [], limite = op.ciclos || CICLOS;
    var almacen = op.almacen, publica = op.publica, firma = op.firma, verifica = op.verifica;
    var cuerpos = {}, cargada = false;
    function avisa() {
      if (!MOD && root.document) { root.document.dispatchEvent(new CustomEvent('atlas:territory')); }
    }
    function publicaRegistro() {
      var arr = Object.keys(cuerpos).sort().map(function (id) { return cuerpos[id]; });
      return almacen.pon({ esquema: REGISTRO, registros: arr }).then(function () { avisa(); return true; });
    }
    function cicloValido(c) { return entero(c); }
    function quien() { return Promise.resolve().then(function () { return publica ? publica() : null; }); }
    function sella(body) {
      if (!firma || !verifica) { return Promise.reject(new Error('NO_DATA (signing or verification is not available)')); }
      return Promise.resolve().then(function () { return firma(body); }).then(function (r) {
        var sig = r && r.firma;
        if (!/^ed25519:[0-9a-f]{128}$/.test(sig || '')) { throw new Error('NO_DATA (complete Ed25519 signature unavailable)'); }
        var e = { cuerpo: body, firma: sig };
        var error = validaSobre(e, ids);
        if (error) { throw new Error('NO_DATA (signed receipt rejected: ' + error + ')'); }
        return Promise.resolve(verifica(JSON.stringify(body), sig.slice(8), body.owner_pub)).then(function (ok) {
          if (!ok) { throw new Error('NO_DATA (signature did not verify)'); }
          return e;
        });
      });
    }
    function modifica(id, ciclo, pub, edit) {
      if (ids.indexOf(id) < 0) { return Promise.resolve({ ok: false, causa: 'NO_DATA (unknown NPC site)' }); }
      if (!cicloValido(ciclo)) { return Promise.resolve({ ok: false, causa: 'NO_DATA (game cycle not measured)' }); }
      if (!HEX.test(pub || '')) { return Promise.resolve({ ok: false, causa: 'NO_DATA (account key not available)' }); }
      var previo = cuerpos[id] && cuerpos[id].cuerpo;
      if (!previo || previo.owner_pub !== pub) { return Promise.resolve({ ok: false, causa: 'NO_DATA (this account has no signed local occupation)' }); }
      var s = estadoBody(previo, ciclo, pub, limite);
      if (s.fase === 'niebla') { return Promise.resolve({ ok: false, causa: 'NO_DATA (' + s.causa + ')' }); }
      var nuevo = Object.assign({}, previo, { sequence: previo.sequence + 1 });
      edit(nuevo);
      return sella(nuevo).then(function (e) { cuerpos[id] = e; return publicaRegistro().then(function () { return { ok: true, cuerpo: nuevo }; }); })
        .catch(function () { return { ok: false, causa: CAUSA_LOCAL }; });
    }
    function api() {
      return {
        cargar: function () {
          if (!almacen || !almacen.lee) { return Promise.resolve({ ok: false, causa: 'NO_DATA (local occupancy reader unavailable)' }); }
          return Promise.resolve().then(function () { return almacen.lee(); }).then(function (v) {
            cuerpos = {};
            if (v && v.esquema === REGISTRO && Array.isArray(v.registros)) {
              return v.registros.reduce(function (p, e) {
                return p.then(function () {
                  var mal = validaSobre(e, ids), b = e && e.cuerpo;
                  if (mal || cuerpos[b.id]) { return; }
                  return Promise.resolve(verifica(JSON.stringify(b), e.firma.slice(8), b.owner_pub)).then(function (ok) { if (ok) { cuerpos[b.id] = e; } });
                });
              }, Promise.resolve()).then(function () { cargada = true; avisa(); return { ok: true, count: Object.keys(cuerpos).length }; });
            }
            cargada = true; avisa(); return { ok: true, count: 0 };
          }).catch(function () { cargada = true; return { ok: false, causa: 'NO_DATA (local occupancy could not be loaded)' }; });
        },
        captura: function (id, ciclo) {
          if (ids.indexOf(id) < 0) { return Promise.resolve({ ok: false, causa: 'NO_DATA (unknown NPC site)' }); }
          if (!cicloValido(ciclo)) { return Promise.resolve({ ok: false, causa: 'NO_DATA (game cycle not measured)' }); }
          return quien().then(function (pub) {
            if (!HEX.test(pub || '')) { return { ok: false, causa: 'NO_DATA (account key required to hold a site)' }; }
            var previo = cuerpos[id] && cuerpos[id].cuerpo;
            if (previo && previo.owner_pub !== pub && ciclo - previo.maintained_cycle < 2 * limite) {
              return { ok: false, causa: 'NO_DATA (another signed local occupation is still in its upkeep window)' };
            }
            if (previo && previo.owner_pub === pub && estadoBody(previo, ciclo, pub, limite).fase !== 'niebla') {
              return { ok: true, ya: true, cuerpo: previo };
            }
            var body = { schema: SOBRE, id: id, owner_pub: pub, captured_cycle: ciclo, maintained_cycle: ciclo, sequence: previo ? previo.sequence + 1 : 1, message: '' };
            return sella(body).then(function (e) { cuerpos[id] = e; return publicaRegistro().then(function () { return { ok: true, cuerpo: body }; }); },
              function () { return { ok: false, causa: CAUSA_LOCAL }; });
          }).catch(function () { return { ok: false, causa: 'NO_DATA (local account, signature, or storage unavailable)' }; });
        },
        escribe: function (id, valor, ciclo, pub) {
          var m = saneaMensaje(valor);
          if (!m.ok) { return Promise.resolve({ ok: false, causa: 'NO_DATA (' + m.causa + ')' }); }
          var actual = cuerpos[id] && cuerpos[id].cuerpo;
          if (actual && actual.owner_pub === pub && actual.message) { return Promise.resolve({ ok: false, causa: 'NO_DATA (one wall message per account and building is already set)' }); }
          return modifica(id, ciclo, pub, function (b) { b.message = m.texto; });
        },
        sostener: function (id, ciclo, pub) { return modifica(id, ciclo, pub, function (b) { b.maintained_cycle = ciclo; }); },
        CICLOS: limite,
        estado: function (id, ciclo, pub) { return estadoBody(cuerpos[id] && cuerpos[id].cuerpo, ciclo, pub, limite); },
        mural: function (id, ciclo, pub) { var s = estadoBody(cuerpos[id] && cuerpos[id].cuerpo, ciclo, pub, limite); return s.fase === 'sostenido' || s.fase === 'aviso' ? (s.mensaje || null) : null; },
        recibo: function (id) { return cuerpos[id] || null; },
        cargada: function () { return cargada; }
      };
    }
    var result = api(); result.saneaMensaje = saneaMensaje;
    return result;
  }

  var C = { CICLOS: CICLOS, saneaMensaje: saneaMensaje, validaSobre: validaSobre, crea: crea };
  if (MOD) { module.exports = C; } else { root.AtlasNpcOccupancy = C; }
})(this);
