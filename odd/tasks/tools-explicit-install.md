# Commission · Tools explicit installation · CURE

## Problem
When the browser supplies a PWA install offer, pressing Tools invokes installation
instead of opening the Tools catalogue. Other offers become inaccessible from
that action. Package, LoRA and model availability must not be inferred from
historical metadata.

## Outcome
Tools always opens its catalogue. A separate clearly labelled action invokes
the existing PWA installation offer only when the visitor selects it. Where the
offer is absent or the PWA is already installed, the reason appears in words.
The catalogue identifies the app package and LoRA as unverified until their
real downloadable sources are established.

## Affects
The existing landing Tools panel and `PreceptorPwa` API. No new service,
credentials or automatic external request. Brain entries remain generated from
`public/brains.json`.

## Constraints
One piece, one PR; user-controlled install; 44px targets; keyboard focus and
Escape return; no new external request on load; offline support and truthful
NO_DATA for unsupported/unmeasured offers. An install prompt cannot be invented
for browsers that do not provide one. Service-worker seal assigned by Mesa.

## Open Questions
- Which current app release package, LoRA URLs and sizes are verified for
  direct download? Historical `public/release.json` carries a STALE seal;
  sandbox request to historical downloads host returned 403. This is NO_DATA,
  not proof that the host or files are universally unavailable.
- How does the install prompt behave on the physical reference devices and
  browsers? NO_DATA until measured there.

Sources: `public/assets/intro.js`, `public/assets/pwa.js`, `public/index.html`,
`public/brains.json`, `public/release.json`; Sovereign's latest Tools commission;
claim buzon#53 ·6655356201.
