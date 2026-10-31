(function (root) {
  'use strict';
  var encode = new TextEncoder();
  function hex(buffer) { return Array.from(new Uint8Array(buffer), function (v) { return v.toString(16).padStart(2, '0'); }).join(''); }
  async function digest(text) { return hex(await root.crypto.subtle.digest('SHA-256', encode.encode(text))); }
  async function create(consent) {
    if (consent !== true) { throw new Error('Explicit visit consent is required'); }
    if (!root.crypto || !root.crypto.subtle) { throw new Error('NO_DATA: secure browser cryptography is unavailable'); }
    var keys = await root.crypto.subtle.generateKey('Ed25519', false, ['sign', 'verify']);
    var publicKey = hex(await root.crypto.subtle.exportKey('raw', keys.publicKey));
    var seed = await digest('preceptoros.visit/1|' + publicKey), active = true;
    function alive() { if (!active || !keys) { throw new Error('This visit has ended'); } }
    function end() { active = false; keys = null; }
    if (root.addEventListener) { root.addEventListener('pagehide', end, { once: true }); }
    return Object.freeze({
      info: function () { alive(); return Object.freeze({ phase: 'ephemeral', publicKey: publicKey, seed: seed, name: 'Visitor-' + seed.slice(0, 8) }); },
      sign: async function (record, consent) {
        alive();
        if (consent !== true) { throw new Error('Explicit signing consent is required'); }
        if (!record || typeof record !== 'object' || Array.isArray(record)) { throw new Error('Invalid visit record'); }
        var fields = record.esquema === 'atlas.adopcion/1' ? ['esquema', 'tropa', 'pseudonimo', 'clave_publica'] :
          record.esquema === 'atlas.invocacion/2' ? ['esquema', 'tc', 'seq', 'prev', 'clave_publica'] : null;
        if (!fields || Object.keys(record).sort().join('|') !== fields.sort().join('|') || record.clave_publica !== publicKey) { throw new Error('Visit record scope rejected'); }
        var text = JSON.stringify(record);
        if (encode.encode(text).length >= 1024) { throw new Error('Visit record exceeds its frame budget'); }
        if (record.esquema === 'atlas.invocacion/2' && (!/^tc[1-4]$/.test(record.tc) || !Number.isSafeInteger(record.seq) || record.seq < 1 || !(record.prev === 'genesis' || /^[a-f0-9]{64}$/.test(record.prev)))) { throw new Error('Invalid invocation'); }
        if (record.esquema === 'atlas.adopcion/1' && (!record.tropa || record.tropa.esquema !== 'atlas.tropa/1' || record.pseudonimo !== 'Visitor-' + seed.slice(0, 8))) { throw new Error('Invalid adoption'); }
        var signature = await root.crypto.subtle.sign('Ed25519', keys.privateKey, encode.encode(text));
        alive();
        return 'ed25519:' + hex(signature);
      },
      transition: function () { alive(); return { state: 'NO_DATA', cause: 'A signed phase receipt and verified visitor transition endpoint are required' }; },
      end: end
    });
  }
  root.AtlasVisitorAccount = Object.freeze({ create: create, digest: digest });
})(typeof globalThis === 'object' ? globalThis : this);
