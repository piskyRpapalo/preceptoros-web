# Node reception contract / piece 1

Translation of the existing [identity canon](canon-identity-and-signatures.md),
[house canon](canon-house.md) and [world laws](canon-laws-of-the-world.md).
The receiver checks form and integrity. The human signs. No admission result
grants authority or publishes a node; SSH verification belongs to piece 2.

## Route and envelope

`POST https://api.preceptoros.org/api/v1/cedulas`, JSON request `{cedula}`.
This is the definitive contract route; live deployment remains NO_DATA.
Agora `/api/v1/*` and its challenge protocol are unchanged.

The Worker response contains `paquete`; the pure `packet()` function receives
that field, not the complete HTTP response:

| Envelope field | Required value |
|---|---|
| esquema | `preceptoros/cedula-nodo/1` |
| pares | Array containing exactly one credential |
| firma | `null`: silicon creates no signature |

Unknown envelope fields fail closed. `read(raw)` measures the original UTF-8
input before parsing; `packet(object)` also bounds its compact serialization.
Every packet is strictly smaller than 1,024 B. No truncation or silent pruning.
The Worker transport ceiling is larger; this web contract is deliberately
bounded for the smallest reader. A larger credential is rejected with cause.

## Credential fields

| Field | Validation |
|---|---|
| esquema | Exactly `preceptoros.cedula-nodo/1` |
| nodo | `nodo.` + 1–6 digits + `.` + 1–31 lowercase letters/digits/hyphens, first alphanumeric; no surrounding whitespace |
| admin | 64 lowercase hexadecimal characters |
| dispositivos | Array with unique keys, at most 128 entries, also limited by packet bytes |
| dispositivos[].clave | 64 lowercase hexadecimal characters |
| dispositivos[].estado | `solicitado`, `linkeado`, `revocado` |
| dispositivos[].tipo | Optional; only the measured `agente` extension |
| dispositivos[].ambito | Required for that extension: unique, nonempty subset of the four inherited capabilities |
| dispositivos[].caduca | Required for that extension: inherited UTC string grammar; never used as game age |
| plan_sha256 | 64 lowercase hexadecimal characters; matching the signed plan waits for piece 2 |
| firma_ssh | Required SSH signature armor; shape only, not cryptographic proof |
| sha256 | 64 lowercase hexadecimal characters; must match the body hash |
| firma | Optional, only `null`; distinct from `firma_ssh` |
| autenticidad | Optional; exactly `SIGNED` or `NO_DATA` |

Unknown credential/device fields are rejected, never stripped. No apparatus
measurements, public account mapping or freshness evidence are invented.
Delegation fields are preserved without exercising or extending their scope.

## Integrity and authenticity

Body hash: inherited `AtlasCanon.huella`, sorted keys and ASCII-escaped JSON,
excluding only `sha256`. Signed bytes: sorted compact JSON encoded as UTF-8,
excluding `sha256`, `firma_ssh`, `firma`, `autenticidad`, as in the app.
The original object is never modified or re-labelled.

`SIGNED` declares signature presence, not successful verification. A missing
declaration or exact `NO_DATA` preserves uncertainty. `OK`, `VERIFIED` and free
prose are rejected on the new wire path. Every structurally accepted result
is `estado:NO_DATA`, `autenticidad:NO_DATA`, cause `pending`, `firma:null`,
`authority:false`. A structural/integrity rejection uses `ERROR` with cause.
No claimed label, HTTP receipt or hash can promote authority.
SSH namespaces are `preceptoros-cedula` for the credential and
`preceptoros-plan-nodo` for the plan. The actual signed plan and trusted
public key are not supplied by this envelope. Their delivery remains open;
`plan_sha256` is a reference, not evidence of successful plan verification.
Piece 2 must return its verification separately, never rewrite the original.

The existing game catalog retains its unsigned declaration compatibility.
Its signed-header check shares `declaration()`; apparatus validation remains
the game's separate requirement. Receiving a raw credential does not start
a game or supply its missing measurements. Registration is piece 3.

## Surface and open evidence

Six causes have text in nine languages in the pure module; unknown language
falls back to English. No raw absence label is human-facing. No DOM, storage,
network, clock, sound or signing effects run when loading or validating.
The module loads with Arena; the initial English dictionary is unchanged.
The seven semantic seals stay frozen. `STATIC` has no derived color.

SSH authenticity, trusted key, plan verification, cycle/freshness evidence,
voice binding, live D1 registration and public publication remain NO_DATA
with their respective missing evidence. Closing any requires a separately
proposed, measured and signed step. The app currently drops the returned
package after validating its shape; its retention/delivery remains an open
dependency for the later receiver, not a decision to discard public evidence.
