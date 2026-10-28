// Chunk router (authorized 2026-10-28, without weights). The protocol is complete; the weights are not here.
// A manifest lists the chunks of a model: origin, size, and one SHA-256 per chunk. Nothing is downloaded without
// an explicit consent. Each chunk is checked against its hash before it is used. A missing or corrupt chunk, or a
// model that is not installed, is NO_DATA with its cause. No Math.random, no clock; no request leaves this origin.
(function (raiz) {
  'use strict';

  function noDato(causa) { return { ok: false, causa: 'NO_DATA · ' + causa }; }

  // planifica(manifest) → { ok: true, origin, total_bytes, chunks } | NO_DATA
  function planifica(manifiesto) {
    if (!manifiesto || typeof manifiesto !== 'object') { return noDato('no_manifest'); }
    var lista = Array.isArray(manifiesto.chunks) ? manifiesto.chunks : [];
    if (!lista.length) { return noDato('no_chunks_published'); }
    var total = 0, chunks = [];
    for (var i = 0; i < lista.length; i++) {
      var c = lista[i];
      if (!c || typeof c.name !== 'string' || !Number.isSafeInteger(c.bytes) || c.bytes <= 0 || !/^[0-9a-f]{64}$/.test(c.sha256)) {
        return noDato('bad_chunk_entry at ' + i);
      }
      total += c.bytes;
      chunks.push({ name: c.name, bytes: c.bytes, sha256: c.sha256, from: total - c.bytes, to: total });
    }
    return { ok: true, origin: 'same origin (' + (manifiesto.origin || 'this site') + ')', total_bytes: total, chunks: chunks };
  }

  function hexDe(buf) {
    return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }

  // sha256(bytes) → hex. Uses the browser or Node's Web Crypto.
  function sha256(bytes) {
    var sub = raiz.crypto && raiz.crypto.subtle;
    if (!sub) { return Promise.resolve(noDato('no_web_crypto')); }
    return sub.digest('SHA-256', bytes).then(hexDe);
  }

  // descarga(plan, { consentido, cache, fetch }) → { ok: true, chunks: Map } | NO_DATA
  // The cache is a Map of name → ArrayBuffer. Without consent nothing is fetched (zero requests).
  function descarga(plan, opciones) {
    if (!plan || !plan.ok) { return plan || noDato('no_plan'); }
    if (!opciones || opciones.consentido !== true) { return noDato('consent_required: nothing is downloaded without it'); }
    var cache = opciones.cache || new Map(), obtiene = opciones.fetch;
    var out = new Map(), pasos = plan.chunks.map(function (c) {
      var pieza = cache.get(c.name);
      var lectura = pieza ? Promise.resolve(pieza) : (obtiene ? obtiene(c.name) : Promise.resolve(null));
      return lectura.then(function (bytes) {
        if (!bytes) { return noDato('cache_chunk_missing: ' + c.name); }
        if (bytes.byteLength !== c.bytes) { return noDato('chunk_size_mismatch: ' + c.name); }
        return sha256(bytes).then(function (hex) {
          if (hex !== c.sha256) { return noDato('chunk_hash_mismatch: ' + c.name); }
          out.set(c.name, bytes);
          return null;
        });
      });
    });
    return Promise.all(pasos).then(function (fallos) {
      var primero = fallos.filter(function (f) { return f; })[0];
      return primero || { ok: true, chunks: out };
    });
  }

  // responde(pregunta, modelo) → { ok: true, texto } | NO_DATA. Without a loaded model the answer is NO_DATA, never a guess.
  function responde(pregunta, modelo) {
    if (!modelo || !modelo.ok) { return noDato('model_not_installed'); }
    if (typeof pregunta !== 'string' || !pregunta.trim()) { return noDato('empty_question'); }
    return { ok: true, texto: modelo.responde(pregunta) };
  }

  var AtlasChunkRouter = { planifica: planifica, sha256: sha256, descarga: descarga, responde: responde };
  if (typeof module === 'object' && module.exports) { module.exports = AtlasChunkRouter; }
  else { raiz.AtlasChunkRouter = AtlasChunkRouter; }
})(typeof globalThis !== 'undefined' ? globalThis : this);
