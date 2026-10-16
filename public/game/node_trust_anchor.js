(function (root) {
  'use strict';
  var anchor = Object.freeze({ key_sha256: null, manifest_sha256: null });
  if (typeof module === 'object' && module.exports) { module.exports = anchor; }
  else { root.AtlasNodeTrustAnchor = anchor; }
})(globalThis);
