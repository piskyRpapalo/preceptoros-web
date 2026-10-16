# Canon: node trust anchoring

Human decision, 2026-10-16, piece 2. Complements
[identity and signatures](canon-identity-and-signatures.md).

A manifest never establishes its own root of trust. The real manifest enters
through a separate PR. The Mesa records the expected SHA-256 fingerprint of
the public SSH key authorized for credentials in the app. The Sovereign's
explicit approval in chat of that exact fingerprint establishes the anchor.
Neither an agent, a self-signature nor the presence of a file can replace
that gesture. Silicon never produces a human signature.

The approved manifest schema is `preceptoros.trust-manifest/1`; its signing
namespace is `preceptoros-trust-manifest`. Its date is declarative and has no
freshness, expiry or game-time authority. No trust is closed by this piece.
The production manifest and anchor remain absent until their ceremony.

Signature verification is separate from publication and permission. Every
verdict has `authority:false` and `firma:null`. Missing Ed25519 support is
pending with cause, never a fabricated cryptographic rejection.
