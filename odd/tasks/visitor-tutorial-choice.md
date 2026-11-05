# Commission · Visitor tutorial choice · VOICE

## Problem
The Welcome handler starts an ephemeral visit and automatically claims the
100-copper beacon. The Sovereign's current commission instead asks the visitor
to choose Tutorial, Free walk or Skip when the visit starts and forbids awarding
unplayed rewards. The existing route tracks played and skipped separately.

## Outcome
An explicit accessible choice follows visit creation. Selecting Tutorial starts
the existing route; Free walk and Skip leave unearned rewards untouched. The
existing account, resources and route data remain the owners of their state.

## Affects
Welcome, visitor controls and existing tutorial skip/free-walk hooks, plus the
browser checks and cache cascade. Claim buzon#53 ·6661701310.

## Constraints
One visit key and one map; no extra service or implicit beacon claim. Never
mark skipped steps played or create synthetic rewards. Preserve keyboard focus,
44px controls, no external requests on load and caused NO_DATA where relevant.
One piece per PR, no deploy. Preserve existing leave and return semantics.

## Open questions
- The complete six-step tutorial is not a single implemented route today; this
  piece offers a choice and preserves existing components, not a false claim of
  completion. Its assembly is a separate piece.
- Integration must rebase after #670 controls retirement, #671 player and #672
  profile as their affected modules overlap.
