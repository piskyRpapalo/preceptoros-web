(function (root) {
  'use strict';
  var encode = new TextEncoder();
  function hex(buffer) { return Array.from(new Uint8Array(buffer), function (v) { return v.toString(16).padStart(2, '0'); }).join(''); }
  async function digest(text) { return hex(await root.crypto.subtle.digest('SHA-256', encode.encode(text))); }
  // lite() → ed25519_lite.js, loaded only when this browser's WebCrypto rejects Ed25519 (Android WebView 113 in the APP).
  function lite() {
    if (root.AtlasEd25519) { return Promise.resolve(root.AtlasEd25519); }
    return new Promise(function (ok, no) { var s = root.document.createElement('script'); s.src = '/game/ed25519_lite.js'; s.onload = function () { ok(root.AtlasEd25519); }; s.onerror = no; root.document.head.appendChild(s); });
  }
  // signer(subtle) → { pub, sign(msg), verify(sig, msg), how }: native Ed25519 first; the same bytes from ed25519_lite otherwise.
  async function signer(S) {
    try {
      var k = await S.generateKey('Ed25519', false, ['sign', 'verify']);
      return { pub: await S.exportKey('raw', k.publicKey), how: 'webcrypto', sign: function (m) { return S.sign('Ed25519', k.privateKey, m); }, verify: function (g, m) { return S.verify('Ed25519', k.publicKey, g, m); } };
    } catch (e) {
      if (!e || e.name !== 'NotSupportedError') { throw e; }
      var L = await lite(), p = await L.keypair(S);
      return { pub: p.publicKey, how: 'lite', sign: p.sign, verify: function (g, m) { return L.verify(S, p.publicKey, new Uint8Array(g), m); } };
    }
  }
  async function create(consent) {
    if (consent !== true) { throw new Error('Explicit visit consent is required'); }
    if (!root.crypto || !root.crypto.subtle) { throw new Error('NO_DATA: secure browser cryptography is unavailable'); }
    var keys = await signer(root.crypto.subtle);
    var publicKey = hex(keys.pub);
    var seed = await digest('preceptoros.visit/1|' + publicKey), active = true;
    function alive() { if (!active || !keys) { throw new Error('This visit has ended'); } }
    function end() { active = false; keys = null; }
    if (root.addEventListener) { root.addEventListener('pagehide', end, { once: true }); }
    return Object.freeze({
      info: function () { alive(); return Object.freeze({ phase: 'ephemeral', crypto: keys.how, publicKey: publicKey, seed: seed, name: 'Visitor-' + seed.slice(0, 8) }); },
      proveVisit: async function (consent) {
        alive();
        if (consent !== true) { throw new Error('Explicit visit consent is required'); }
        var challenge = encode.encode('preceptoros.local-visit/1|' + publicKey + '|' + hex(root.crypto.getRandomValues(new Uint8Array(16))));
        var signature = await keys.sign(challenge);
        alive();
        if (!await keys.verify(signature, challenge)) { throw new Error('Visit proof failed'); }
        alive();
        return publicKey;
      },
      sign: async function (record, consent) {
        alive();
        if (consent !== true) { throw new Error('Explicit signing consent is required'); }
        if (!record || typeof record !== 'object' || Array.isArray(record)) { throw new Error('Invalid visit record'); }
        var fields = record.esquema === 'atlas.adopcion/1' ? ['esquema', 'tropa', 'pseudonimo', 'clave_publica'] :
          record.esquema === 'atlas.invocacion/2' ? ['esquema', 'tc', 'seq', 'prev', 'clave_publica'] :
          record.esquema === 'atlas.paso/1' ? ['esquema', 'dir', 'seq', 'prev', 'clave_publica'] : // one walked hex, for a shared-presence authority
          record.esquema === 'atlas.presente/1' ? ['esquema', 'seq', 'prev', 'clave_publica'] : // «still here», on the same chain
          record.esquema === 'atlas.coop/1' ? ['esquema', 'accion', 'con', 'seq', 'prev', 'clave_publica'] : // asks another crab to light the beacon together
          record.esquema === 'atlas.coop_si/1' ? ['esquema', 'peticion', 'seq', 'prev', 'clave_publica'] : null; // says yes to that ask
        if (!fields || Object.keys(record).sort().join('|') !== fields.sort().join('|') || record.clave_publica !== publicKey) { throw new Error('Visit record scope rejected'); }
        var text = JSON.stringify(record);
        if (encode.encode(text).length >= 1024) { throw new Error('Visit record exceeds its frame budget'); }
        if (record.esquema === 'atlas.invocacion/2' && (!/^tc[1-4]$/.test(record.tc) || !Number.isSafeInteger(record.seq) || record.seq < 1 || !(record.prev === 'genesis' || /^[a-f0-9]{64}$/.test(record.prev)))) { throw new Error('Invalid invocation'); }
        if (/^atlas\.coop(_si)?\/1$/.test(record.esquema) && (!Number.isSafeInteger(record.seq) || record.seq < 1 || !(record.prev === 'genesis' || /^[a-f0-9]{64}$/.test(record.prev)) ||
          (record.esquema === 'atlas.coop/1' ? record.accion !== 'faro' || !/^crab-[0-9a-f]{8}$/.test(record.con) : !/^ask-[0-9a-f]{8}$/.test(record.peticion)))) { throw new Error('Invalid cooperation'); }
        if (record.esquema === 'atlas.presente/1' && (!Number.isSafeInteger(record.seq) || record.seq < 1 || !(record.prev === 'genesis' || /^[a-f0-9]{64}$/.test(record.prev)))) { throw new Error('Invalid beat'); }
        if (record.esquema === 'atlas.paso/1' && (!/^(east|west|north-east|north-west|south-east|south-west)$/.test(record.dir) || !Number.isSafeInteger(record.seq) || record.seq < 1 || !(record.prev === 'genesis' || /^[a-f0-9]{64}$/.test(record.prev)))) { throw new Error('Invalid step'); }
        if (record.esquema === 'atlas.adopcion/1' && (!record.tropa || record.tropa.esquema !== 'atlas.tropa/1' || record.pseudonimo !== 'Visitor-' + seed.slice(0, 8))) { throw new Error('Invalid adoption'); }
        var signature = await keys.sign(encode.encode(text));
        alive();
        return 'ed25519:' + hex(signature);
      },
      transition: function () { alive(); return { state: 'NO_DATA', cause: 'A signed phase receipt and verified visitor transition endpoint are required' }; },
      end: end
    });
  }
  root.AtlasVisitorAccount = Object.freeze({ create: create, digest: digest });
})(typeof globalThis === 'object' ? globalThis : this);
