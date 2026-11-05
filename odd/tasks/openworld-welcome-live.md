# Commission · OpenWorld Welcome live · RENDER

## Problem
The first-visit Welcome does not explain the world as commissioned and does
not place measured node status and honest visitor availability together.

## Outcome
Welcome explains in plain language owner-controlled AI nodes and visitor
interaction; it shows the live node count from the existing world feed and
NO_DATA for live visitor count because no aggregate publisher has been measured.

## Affects
The existing welcome card and world feed status event. Account creation and
world-state fetching stay with their current owners. CLAIM buzon#53 ·6655324110.

## Constraints
No extra network requests, no invented zeros, no private identifiers, no
second map or renderer. Unknown or failed feeds must say NO_DATA with cause;
STALE nodes are not counted LIVE. Preserve account consent, focus, and the
current visit flow. One piece, one draft PR. Mesa assigns the cache seal.

## Open questions
- No measured aggregate visitor count exists; how will ephemeral accounts be
  counted without becoming persistent identities?
- Which count of map walkers is authoritative? Until evidenced, NO_DATA.
- The Welcome/profile reorganization depends on the parallel terminal player;
  this piece supplies Welcome data only and preserves current controls.
