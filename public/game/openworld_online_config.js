// Visitor online controls (Share, Players, Nodes): the same markup, ids and ARIA that openworld/index.html carried,
// inserted after the map canvas before crab_presence_remote.js, shared_crabs.js and online_nodes.js bind to them.
// Built on every origin (the presence config below stays production-only) so the page keeps its 8 KiB budget.
(function (doc) {
  'use strict';
  var surface = doc && doc.getElementById && doc.getElementById('surface');
  if (!surface || doc.getElementById('online-actions')) { return; }
  surface.insertAdjacentHTML('afterend', [
    '<div id="online-actions" role="group" aria-label="Online visitors and verified nodes">',
    '<button type="button" id="online-share" aria-controls="online-players" aria-describedby="online-status">Share</button>',
    '<button type="button" id="online-players-toggle" aria-expanded="false" aria-controls="online-players">Players (0)</button>',
    '<button type="button" id="online-nodes-toggle" aria-expanded="false" aria-controls="online-nodes">Nodes (0)</button>',
    '</div>',
    '<div id="online-panels">',
    '<section id="online-players" aria-labelledby="online-players-h" hidden>',
    '<h2 id="online-players-h">Visitors in this world</h2>',
    '<p id="online-status" role="status" aria-live="polite" data-state="NO_DATA" data-cause="not_signed">Looking around as a ghost crab · sign HITL to take a piece. Nothing is shared.</p>',
    '<button type="button" id="online-disconnect" hidden>Disconnect my visit</button>',
    '<ol id="online-player-list" aria-label="Visitors reported by the shared authority"><li>NO_DATA: no connected visitors verified.</li></ol>',
    '</section>',
    '<section id="online-nodes" aria-labelledby="online-nodes-h" hidden>',
    '<h2 id="online-nodes-h">LIVE nodes · verified heartbeat</h2>',
    '<p id="online-nodes-state" role="status" aria-live="polite">NO_DATA: checking the public node feed.</p>',
    '<h3>Principal buildings · persistent registry</h3>',
    '<p id="online-buildings-state" role="status" aria-live="polite">NO_DATA: checking registered buildings.</p>',
    '<ol id="online-buildings-list" aria-label="Persistent principal buildings"><li>NO_DATA: building registry not checked.</li></ol>',
    '<label for="online-node-select">Choose a real live node</label>',
    '<select id="online-node-select"><option value="">No verified live nodes</option></select>',
    '<button type="button" id="online-node-visit" disabled>Go to selected node</button>',
    '<p id="online-node-service">NO_DATA: no verified node selected.</p>',
    '</section>',
    '</div>'
  ].join('\n'));
})(typeof document !== 'undefined' ? document : null);

// Canonical public presence endpoint. Static, origin-pinned; never configurable by visitors or query strings.
// The public gateway owns deployment, policy and grants. This does not establish service availability or consent.
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
