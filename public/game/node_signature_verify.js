(function (root) {
  'use strict';
  var common = typeof module === 'object' && module.exports;
  var K = common ? require('./canon.js') : root.AtlasCanon;
  var R = common ? require('./node_reception_contract.js') : root.AtlasNodeReception;
  var anchor = common ? require('./node_trust_anchor.js') : root.AtlasNodeTrustAnchor;
  var publishedManifest = common ? require('./node_trust_manifest.js') : root.AtlasNodeTrustManifest;
  var messages = common ? require('./node_signature_messages.js') : root.AtlasNodeSignatureMessages;
  var keyPin = anchor && anchor.key_sha256, manifestPin = anchor && anchor.manifest_sha256;
  var subtle = root.crypto && root.crypto.subtle, encoder = new TextEncoder();
  var NS = 'preceptoros-cedula', MANIFEST_NS = 'preceptoros-trust-manifest';
  var HEX = /^[0-9a-f]{64}$/;

  function reject(code) { throw Object.assign(new Error(code), { rejection: code }); }
  function result(verdict, code) { return Object.freeze({ verdict: verdict, code: code, authority: false, firma: null }); }
  function text(value) { return encoder.encode(value); }
  function canonical(value) { return JSON.stringify(K.ordena(value)); }
  function equal(a, b) { return a.length === b.length && a.every(function (v, i) { return v === b[i]; }); }
  function concat(parts) {
    var size = parts.reduce(function (n, part) { return n + part.length; }, 0), out = new Uint8Array(size), offset = 0;
    parts.forEach(function (part) { out.set(part, offset); offset += part.length; });
    return out;
  }
  function field(value) {
    var out = new Uint8Array(value.length + 4);
    new DataView(out.buffer).setUint32(0, value.length); out.set(value, 4); return out;
  }
  function reader(bytes) {
    var offset = 0;
    return {
      take: function (n) { if (!Number.isSafeInteger(n) || n < 0 || n > bytes.length - offset) { reject('format'); }
        var value = bytes.slice(offset, offset + n); offset += n; return value; },
      number: function () { var value = this.take(4); return new DataView(value.buffer).getUint32(0); },
      field: function () { return this.take(this.number()); },
      done: function () { if (offset !== bytes.length) { reject('format'); } }
    };
  }
  function decode(value) {
    try { return new TextDecoder('utf-8', { fatal: true }).decode(value); }
    catch (error) { reject('format'); }
  }
  function base64(value) {
    if (!value || value.length % 4 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) { reject('format'); }
    var raw = atob(value), bytes = Uint8Array.from(raw, function (ch) { return ch.charCodeAt(0); });
    if (btoa(raw) !== value) { reject('format'); } return bytes;
  }
  function publicBlob(blob) {
    var r = reader(blob);
    if (decode(r.field()) !== 'ssh-ed25519') { reject('algorithm'); }
    var raw = r.field(); r.done(); if (raw.length !== 32) { reject('format'); }
    return { blob: blob, raw: raw };
  }
  function publicLine(line) {
    if (typeof line !== 'string' || !/^ssh-ed25519 [A-Za-z0-9+/=]+$/.test(line)) { reject('manifest_shape'); }
    return publicBlob(base64(line.slice(12)));
  }
  function parse(armor) {
    if (typeof armor !== 'string' || armor.length > 16384 || !/^-----BEGIN SSH SIGNATURE-----\r?\n[A-Za-z0-9+/=\r\n]+\r?\n-----END SSH SIGNATURE-----\r?\n?$/.test(armor)) { reject('format'); }
    var lines = armor.replace(/\r/g, '').split('\n');
    if (lines[lines.length - 1] === '') { lines.pop(); }
    var r = reader(base64(lines.slice(1, -1).join('')));
    if (!equal(r.take(6), text('SSHSIG')) || r.number() !== 1) { reject('format'); }
    var key = publicBlob(r.field()), namespace = decode(r.field()), reserved = r.field(), hash = decode(r.field()), sig = reader(r.field());
    r.done(); if (!namespace) { reject('namespace'); }
    if (hash !== 'sha256' && hash !== 'sha512') { reject('algorithm'); }
    if (decode(sig.field()) !== 'ssh-ed25519') { reject('algorithm'); }
    var bytes = sig.field(); sig.done(); if (bytes.length !== 64) { reject('format'); }
    return { key: key, namespace: namespace, reserved: reserved, hash: hash, bytes: bytes };
  }
  async function hash(bytes) {
    return Array.from(new Uint8Array(await subtle.digest('SHA-256', bytes)), function (v) { return v.toString(16).padStart(2, '0'); }).join('');
  }
  async function check(message, armor, expected, namespace) {
    var sig = parse(armor);
    if (sig.namespace !== namespace) { reject('namespace'); }
    if (!equal(sig.key.blob, expected.blob)) { reject('trust_mismatch'); }
    var h = new Uint8Array(await subtle.digest(sig.hash === 'sha512' ? 'SHA-512' : 'SHA-256', message));
    var data = concat([text('SSHSIG'), field(text(namespace)), field(sig.reserved), field(text(sig.hash)), field(h)]);
    var key = await subtle.importKey('raw', expected.raw, { name: 'Ed25519' }, false, ['verify']);
    if (!await subtle.verify({ name: 'Ed25519' }, key, sig.bytes, data)) { reject('signature'); }
  }
  function dateShape(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) { return false; }
    var y = Number(value.slice(0, 4)), m = Number(value.slice(5, 7)), d = Number(value.slice(8));
    var days = [31, y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return y > 0 && m >= 1 && m <= 12 && d >= 1 && d <= days[m - 1];
  }
  function manifestBody(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value) ||
        Object.keys(value).sort().join(',') !== 'clave_publica,esquema,fecha,firma_ssh,namespace' ||
        value.esquema !== 'preceptoros.trust-manifest/1' || value.namespace !== NS ||
        !dateShape(value.fecha) || typeof value.firma_ssh !== 'string') { reject('manifest_shape'); }
    var raw = canonical(value); if (text(raw).length >= 1024) { reject('manifest_shape'); }
    return { raw: raw, body: canonical({ esquema: value.esquema, clave_publica: value.clave_publica, namespace: value.namespace, fecha: value.fecha }),
      key: publicLine(value.clave_publica), armor: value.firma_ssh };
  }
  async function verify(value, manifest) {
    try {
      if (manifest === undefined) { manifest = publishedManifest; }
      if (!R.credential(value).valid) { return result('rejected', 'credential'); }
      var message = text(R.signedBody(value)), armor = value.firma_ssh;
      if (manifest === null || manifest === undefined) { return result('pending', 'trust_missing'); }
      var m = manifestBody(manifest);
      if (typeof keyPin !== 'string' || keyPin.length !== 64 || !HEX.test(keyPin) ||
          typeof manifestPin !== 'string' || manifestPin.length !== 64 || !HEX.test(manifestPin)) { return result('pending', 'trust_missing'); }
      if (!subtle || typeof subtle.digest !== 'function' || typeof subtle.importKey !== 'function' || typeof subtle.verify !== 'function') { return result('pending', 'crypto_unavailable'); }
      if (await hash(text(m.raw)) !== manifestPin) { reject('manifest_mismatch'); }
      if (await hash(m.key.blob) !== keyPin) { reject('trust_mismatch'); }
      await check(text(m.body), m.armor, m.key, MANIFEST_NS);
      await check(message, armor, m.key, NS);
      return result('verified', 'verified');
    } catch (error) {
      if (error && error.rejection) { return result('rejected', error.rejection); }
      if (error && error.name === 'NotSupportedError') { return result('pending', 'crypto_unavailable'); }
      return result('pending', 'crypto_error');
    }
  }
  function message(code, lang) {
    var t = Object.prototype.hasOwnProperty.call(messages, lang) ? messages[lang] : messages.en;
    return Object.prototype.hasOwnProperty.call(t, code) ? t[code] : t.format;
  }
  var api = Object.freeze({ verify: verify, message: message, MESSAGES: messages });
  if (common) { module.exports = api; } else { root.AtlasNodeSignatureVerify = api; }
})(globalThis);
