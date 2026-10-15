/* Validador local del contrato cerrado preceptoros.vector/1. Alineado con data/atlas_vector_schema.json. */
(function (raiz) {
  'use strict';
  function valida(v) {
    var keys = ['v', 'c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g', 'nd'];
    function num(x) { return typeof x === 'number' && Number.isFinite(x); }
    function ent(x) { return Number.isSafeInteger(x); }
    function txt(x) { return typeof x === 'string' && x.length > 0; }
    function tupla(x, n, f) { return Array.isArray(x) && x.length === n && x.every(f); }
    if (!v || typeof v !== 'object' || Object.keys(v).length !== keys.length || keys.some(function (k) { return !Object.prototype.hasOwnProperty.call(v, k); }) || v.v !== 'preceptoros.vector/1') { return false; }
    var nd = v.nd, nk = ['c', 'r', 'k', 'p', 't', 'e', 'l', 'n', 'z', 'q', 'g', 'recorte'];
    if (!nd || typeof nd !== 'object' || Array.isArray(nd) || Object.keys(nd).some(function (k) { return nk.indexOf(k) < 0 || !txt(nd[k]); })) { return false; }
    if (!(v.c === null || ent(v.c) && v.c >= 0 && v.c <= 1000000000) || (v.c === null && !nd.c)) { return false; }
    if (!(v.r === null || tupla(v.r, 4, function (x) { return x === null || num(x); })) || (v.r === null && !nd.r) || (Array.isArray(v.r) && v.r.some(function (x) { return x === null; }) && !nd.r)) { return false; }
    if (!(v.k === null || tupla(v.k, 5, function (x, i) { return i < 2 ? ent(x) : x === null || ent(x) && x >= 0; })) || (v.k === null && !nd.k) || (Array.isArray(v.k) && v.k.slice(2).some(function (x) { return x === null; }) && !nd.k)) { return false; }
    if (!(v.p === null || tupla(v.p, 3, function (x, i) { return i < 2 ? x === null || txt(x) : x === null || ent(x) && x >= 0; })) || (Array.isArray(v.p) && v.p.some(function (x) { return x === null; }) && !nd.p)) { return false; }
    if (!(v.t === null || tupla(v.t, 2, function (x, i) { return i === 0 ? txt(x) : ent(x) && x >= 0; }))) { return false; }
    if (!Array.isArray(v.e) || v.e.some(function (x) { return !tupla(x, 3, function (z, i) { return i === 0 || i === 1 ? txt(z) : z === null || num(z) && z >= 0; }); }) || (!v.e.length && !nd.e) || (v.e.some(function (x) { return x[1] === 'NO_DATA' || x[2] === null; }) && !nd.e)) { return false; }
    if (!Array.isArray(v.l) || v.l.some(function (x) { return !tupla(x, 3, function (z, i) { return i === 0 ? txt(z) : ent(z) && z >= 0; }); }) || (!v.l.length && !nd.l)) { return false; }
    if (!Array.isArray(v.n) || v.n.some(function (x) { return !tupla(x, 2, function (z, i) { return i === 0 ? txt(z) : typeof z === 'string' && /^\d+\/\d+$/.test(z); }); })) { return false; }
    if (!(v.z === null || ent(v.z) && v.z >= 0) || (v.z === null && !nd.z)) { return false; }
    if (!Array.isArray(v.q) || v.q.length > 3 || v.q.some(function (x) { return !tupla(x, 3, function (z, i) { return i < 2 ? txt(z) : z === null || ent(z) && z >= 0 && z <= 1000000000; }); })
        || (v.q.some(function (x) { return x[2] === null; }) && !nd.q)) { return false; }
    if (!(v.g === null || tupla(v.g, 4, function (x, i) { return i === 0 ? x === null || txt(x) : i === 1 ? txt(x) : i === 2 ? ent(x) : ent(x) && x >= 1; }))) { return false; }
    return true;
  }
  var API = { valida: valida };
  if (typeof module === 'object' && module.exports) { module.exports = API; } else { raiz.AtlasVectorContract = API; }
})(this);
