# Node SSHSIG verification / piece 2

Sources: [reception](node-reception-contract.md),
[identity canon](canon-identity-and-signatures.md),
[approved anchoring ceremony](canon-node-trust.md),
[OpenSSH SSHSIG format](https://github.com/openssh/openssh-portable/blob/master/PROTOCOL.sshsig).

## Public API and boundary

`AtlasNodeSignatureVerify.verify(credential, manifest?)` returns a promise
of an immutable `{verdict, code, authority:false, firma:null}` object.
`verdict` is `verified`, `rejected` or `pending`. The optional manifest is
checked against the independent static pins; it cannot supply a trust root.
Without that argument the module uses the static published manifest.
No API argument can replace the anchor captured when the module loads.

The receiver first applies piece 1's field/integrity checks, then captures
UTF-8 bytes from `AtlasNodeReception.signedBody()` before its first await.
It also captures the manifest and signature. Subsequent input mutation
cannot change the bytes being verified. The received credential is never
rewritten. A successful signature proves those bytes were signed by the
anchored key; it grants no publication, delegation, freshness or plan approval.
The existing reception result and semantic table are unchanged.

## Static artifacts and human ceremony

`public/game/node_trust_manifest.js` currently exports `null`.
`public/game/node_trust_anchor.js` exports frozen fields `key_sha256:null`
and `manifest_sha256:null`. Neither contains a synthetic production key.
The separate ceremony PR will populate these artifacts with real public data
only after the Mesa's measurement and the Sovereign's explicit fingerprint
approval. These empty artifacts intentionally keep production pending.

Manifest fields, all required and no extras:

| Field | Rule |
|---|---|
| esquema | Exactly `preceptoros.trust-manifest/1` |
| clave_publica | `ssh-ed25519` plus canonical base64 SSH public-key blob; no comment |
| namespace | Exactly `preceptoros-cedula` |
| fecha | Valid Gregorian `YYYY-MM-DD`, declarative only |
| firma_ssh | SSHSIG over compact sorted UTF-8 JSON of the other four fields |

The manifest is strictly smaller than 1,024 UTF-8 bytes after compact sorted
serialization. Its signature namespace is `preceptoros-trust-manifest`.
The key pin is lowercase hex SHA-256 of the decoded SSH public-key blob
(algorithm string and 32 key bytes), matching the Worker's fingerprint
definition. It is not a hash of a key-file comment or a raw-key-only hash.
The manifest pin is lowercase hex SHA-256 of compact sorted UTF-8 JSON of
the complete manifest, including `firma_ssh`.

Verification requires both pins, exact manifest fingerprint, exact public-key
fingerprint and a valid manifest signature before checking the credential.
Changing any manifest field or its signature requires a new reviewed artifact
and human ceremony; automatic key discovery, rotation and enrollment are absent.
The signature's embedded key must equal the already anchored public key. It
is evidence to compare, never a source of authority. Trust in the static
artifact rests on the human-approved tree; replacing all trusted application
code is outside this verifier's boundary.

## SSHSIG and WebCrypto

Strict armor and canonical base64 decode into bounded SSH strings. The parser
checks magic `SSHSIG`, version 1, public-key blob, nonempty namespace, reserved
bytes, hash algorithm and nested signature. It consumes every byte and rejects
truncation, oversized lengths, malformed UTF-8 and trailing bytes. Only
`ssh-ed25519`, 32-byte public keys and 64-byte signatures are accepted.

Supported message hashes are SHA-256 and SHA-512 as specified by OpenSSH.
The Ed25519 input is the SSHSIG magic followed by SSH strings for namespace,
reserved bytes, hash algorithm and message digest. Reserved bytes are preserved
in the signed data. The credential namespace is `preceptoros-cedula`, measured
in the app's `nodo_app.py:47,79` at revision `e3025c1` and the reception contract.
No new namespace is inferred from a packet.

WebCrypto only imports public keys for verification, hashes and verifies.
The module has no network, DOM, storage, clock, private-key generation or
signing operation. All four scripts load with Arena, not at initial entry.

## Verdict causes and measured limits

Verified: `verified`. Pending: `trust_missing`, `crypto_unavailable`,
`crypto_error`. Rejected: `credential`, `manifest_shape`, `manifest_mismatch`,
`trust_mismatch`, `format`, `namespace`, `algorithm`, `signature`.
All twelve causes have text in en/es/fr/pt/it/de/ru/el/ar; English is the
explicit fallback. Machine causes are not human labels. No semantic seal is
added. A backend exception cannot establish authenticity.

Tests use clearly synthetic keys and signatures; OpenSSH independently checks
the synthetic credential and manifest. They do not use any human key. The
production ceremony is pending, real signature provenance is unmeasured,
and plan delivery/verification remains outside this piece. No trust is closed
by the fixtures. DOOGEE WebCrypto and real-reader accessibility remain NO_DATA:
the rack must measure them. A local Node WebCrypto pass is a different sensor.
