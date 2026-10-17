(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var K = common ? require('./canon.js') : root.AtlasCanon;
  var R = common ? require('./node_reception_contract.js') : root.AtlasNodeReception;
  var V = common ? require('./node_signature_verify.js') : root.AtlasNodeSignatureVerify;
  var M = common ? require('./node_trust_manifest.js') : root.AtlasNodeTrustManifest;
  var messages = common ? require('./node_bindings_messages.js') : root.AtlasNodeBindingsMessages;
  var receipts = new WeakSet();
  function freeze(value) {
    if (value && typeof value === 'object') { Object.keys(value).forEach(function (key) { freeze(value[key]); }); Object.freeze(value); }
    return value;
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function result(verdict, code, checks, scope) {
    var bindings = verdict === 'verified' ? checks.map(function (entry) {
      var c = entry.credential;
      return { account: c.admin, node: c.nodo, credential_sha256: c.sha256, credential: c };
    }) : [];
    var value = freeze({ verdict: verdict, code: code, checks: checks, bindings: bindings, scope_sha256: scope,
      global: 'NO_DATA', complete: false, authority: false, firma: null });
    receipts.add(value); return value;
  }
  async function inspect(list, manifest) {
    try {
      if (!Array.isArray(list) || !list.length) { return result('rejected', 'empty', [], null); }
      var items = Array.from(list);
      for (var i = 0; i < items.length; i++) {
        var c = items[i];
        if (c && c.esquema === 'preceptoros.cedula-nodo/1' && !Object.prototype.hasOwnProperty.call(c, 'firma_ssh')) {
          return result('rejected', 'legacy_declaration', [], null);
        }
        if (!R.credential(c).valid) { return result('rejected', 'invalid_credential', [], null); }
      }
      items = copy(items).sort(function (a, b) {
        var x = a.nodo + ':' + a.admin + ':' + a.sha256, y = b.nodo + ':' + b.admin + ':' + b.sha256;
        return x < y ? -1 : x > y ? 1 : 0;
      });
      var captured = manifest === undefined ? M : manifest;
      captured = captured === undefined ? undefined : copy(captured);
      var nodes = new Set(), accounts = new Set(), scope = K.huella(items.map(function (c) { return c.sha256; }));
      for (var j = 0; j < items.length; j++) {
        if (nodes.has(items[j].nodo)) { return result('rejected', 'duplicate_node', [], scope); }
        if (accounts.has(items[j].admin)) { return result('rejected', 'duplicate_account', [], scope); }
        nodes.add(items[j].nodo); accounts.add(items[j].admin);
      }
      var checks = [], verdict = 'verified';
      for (var k = 0; k < items.length; k++) {
        var verification;
        try { verification = await V.verify(items[k], captured); }
        catch (error) { verification = { verdict: 'pending', code: 'crypto_error', authority: false, firma: null }; }
        checks.push({ credential: items[k], verification: verification });
        if (verification.verdict === 'rejected') { verdict = 'rejected'; }
        else if (verification.verdict !== 'verified' && verdict !== 'rejected') { verdict = 'pending'; }
      }
      return result(verdict, verdict === 'verified' ? 'verified' : verdict === 'pending' ? 'verification_pending' : 'verification_rejected', checks, scope);
    } catch (error) { return result('rejected', 'invalid_credential', [], null); }
  }
  function isVerified(value) { return receipts.has(value) && value.verdict === 'verified'; }
  function message(code, lang) {
    var texts = Object.prototype.hasOwnProperty.call(messages, lang) ? messages[lang] : messages.en;
    return Object.prototype.hasOwnProperty.call(texts, code) ? texts[code] : texts.invalid_credential;
  }
  var api = Object.freeze({ inspect: inspect, isVerified: isVerified, message: message, MESSAGES: messages });
  if (common) { module.exports = api; } else { root.AtlasNodeBindings = api; }
})(globalThis);
