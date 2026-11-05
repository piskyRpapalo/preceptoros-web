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

## Candidate evidence · 2026-11-05
Tools opens the catalogue even if an install offer exists; the separate button
opens it on the next explicit action. Cards are compact summaries generated from
`brains.json`; historical size dates remain in their expanded fields. The source
link for the web guide is the model named in `models/web-node/manifest.json`;
following it is an explicit external navigation, not a request on load.
`release.json` remains historical, with its existing platform guides preserved.

Local: `python3 -m unittest atlas.test_brain_tools test_web.Puerta` 12/12;
`atlas/landing_doors_browser.mjs` GREEN (explicit mock browser offer, no prompt
on Tools, one prompt on Install, focus on heading, 0 external requests);
lexicon and route census GREEN. Physical browser install remains NO_DATA.
No seal written: dry-run suggests `ea`, which is also requested by other PRs.
