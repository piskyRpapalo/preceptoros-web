// Canonical public presence endpoint. Static, origin-pinned; never configurable by visitors or query strings.
// Aduana owns deployment, policy and grants. This does not establish service availability or consent.
(function (root) {
  'use strict';
  if (!root || !root.location || root.location.origin !== 'https://preceptoros.org') { return; }
  var cfg = {
    authority: 'https://api.preceptoros.org',
    origins: Object.freeze(['https://preceptoros.org']),
    ttl_ticks: 120,
    max_visits: 16
  };
  Object.freeze(cfg);
  root.REMOTE_PRESENCE_CONFIG = cfg;
})(typeof window !== 'undefined' ? window : globalThis);
