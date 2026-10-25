# Design · node-held signing root and the signing ceremony · 2026-10-25

Status: **PROPOSAL · REQUIRES_FIRMA**. Design only. No key is generated, no key is
read, nothing is pushed or signed. Every step below that touches a key is a ceremony
step that a human performs in person.

Canon this extends: [node trust anchoring](canon-node-trust.md) (a manifest never
establishes its own root; the Sovereign's explicit chat approval of an exact
fingerprint establishes the anchor; silicon never produces a human signature) and
[node signature verification](node-signature-verification.md) (verdicts carry
`authority:false` and `firma:null`).

## 0. Rulings this design implements (buzon#30, 2026-10-25)

1. **One issuer root.** The same Sovereign key signs the trust manifest and the
   cédulas. This matches the current verifier, which checks both against one
   `PRECEPTOROS_SOVEREIGN_PUBLIC_KEY`.
2. **Amendment.** The issuer key is generated and held **on the rack node**. This
   amends the earlier clause that the rack never holds the signing key. Preserved:
   the node's automatic declaration keeps `firma:null`; the issuer key is never wired
   into any automatic path; signing happens **only** through an explicit ceremony
   command, with the Sovereign physically present and consenting.
3. **Accepted risks, with his informed signature.** The declarer and the signer share
   one machine. The node is exposed to the server. Backup and recovery are mandatory:
   if the node dies, the root dies.
4. **Honesty rule (unchanged).** Pending stays pending until an anchor is pinned.

## 1. Custody on the rack node

| Item | Rule |
|---|---|
| Generation | Once, inside the ceremony, with `ssh-keygen -t ed25519` into a directory that only the ceremony account can read. The generation command never runs from a unit, cron, script or the declarer. |
| Private key at rest | Passphrase-protected (the OpenSSH key format encrypts it). File mode `0600`, owner = the ceremony account. Lives outside any repository and outside any synced or indexed folder. |
| Disk | Full-disk encryption on the node is a requirement. **NO_DATA** until measured on the node. |
| Passphrase | Known only to the Sovereign. Never written to a file, an environment variable, shell history, a log, an agent memory or a chat. Entered interactively on a terminal during the ceremony, never piped. |
| Public key | Public material. It may be published as the anchor only after the pin gesture (section 5). |
| Copies | The private key exists in exactly two places: the node (encrypted) and the encrypted backup (section 4). Nowhere else. |

## 2. Separation: the declarer and the ceremony are different programs

The declarer is the automatic path that reports the node's state. It must be
**provably** unable to sign. "Provably" means each of these is checkable, not assumed:

- **Different account.** The declarer runs as an unprivileged account that has no read
  permission on the key directory. Check: `namei -l` on the key path, and a test run
  as the declarer account that tries to open the key and fails.
- **Different entry point.** The ceremony command is a separate script with its own name,
  not imported by the declarer, not referenced by any unit, timer, cron line or hook.
  Check: a repository search for the script name returns only the ceremony directory
  and its own tests.
- **No unit without a signature.** Creating a systemd unit or a cron line is a separate
  signed step (repository rule). The ceremony script gets no unit.
- **Declarer output is fixed.** The declarer emits `firma:null` and has no code path that
  calls the signer. Check: the declarer's tests assert that no signing function is
  reachable from its entry point.
- **Process audit at ceremony time.** While the ceremony runs, the Sovereign checks that
  no other process has the key open (`lsof` on the key path must show only the
  ceremony process). Any other holder aborts the ceremony.

The ceremony command is interactive. It shows the exact bytes to be signed, the
namespace, and the expected fingerprint, and it asks for the Sovereign's explicit
confirmation before the passphrase prompt. There is no non-interactive flag.

## 3. Signing in the ceremony

1. The Mesa records the expected fingerprint in the batch register before the ceremony.
2. The Sovereign opens the ceremony terminal on the node, present, and types his
   consent in the terminal. Consent in chat alone is not enough.
3. The command prints the artifact hash, the namespace (`preceptoros-cedula`,
   `preceptoros-plan-nodo` or `preceptoros-trust-manifest`), and the fingerprint.
4. The Sovereign enters the passphrase on the terminal. The signature is written to
   a file the declarer cannot write to.
5. The command verifies the signature with the public key before it exits. If the
   verification fails, nothing is released.
6. The result is recorded in the evidence store (outside the publishable tree) with
   the artifact hash, the fingerprint and the time.

Automatic declarations are never signed by this path. A cédula the declarer produces
goes out with `firma:null`; the signed cédula exists only after step 4.

## 4. Backup and recovery (mandatory)

- **Before the first signature**, an encrypted backup of the private key must exist,
  made in the ceremony, on two separate offline media in two places. The backup
  passphrase is the Sovereign's alone and is distinct from the node passphrase.
- **Restore drill**: restore the backup into an empty directory on a clean machine,
  verify that the fingerprint matches and that a test signature verifies. Until the
  drill is measured, recovery is **NO_DATA**, cause: no drill has run.
- **If the node dies** the root survives only through the backup. The design does not
  rely on the node surviving.
- **Backup media are never connected to the node except during a backup or restore
  ceremony.**

## 5. Rotation and revocation

- **Rotation** is a new root generated in a ceremony, with its own pin gesture. During
  an overlap window the trust manifest lists both fingerprints; cédulas signed under the
  old root stay verifiable against the old pin, and no new signature is made with it.
- **Revocation**: the Sovereign signs a revocation in a ceremony. A revoked fingerprint
  verifies nothing issued after the revocation time. The revocation time is declarative
  and has no game-time authority, as the trust canon states.
- **The old root is destroyed** only after its last cédula is accounted for, and that
  destruction is itself a ceremony step with a receipt.

## 6. Valid and abort conditions for a ceremony

A ceremony is **valid** only when all of these hold:

1. The Sovereign is physically present, and his consent is typed on the ceremony
   terminal.
2. The artifact hash, namespace and fingerprint shown match the Mesa's batch register.
3. Only the ceremony process holds the key file open.
4. A verified backup exists (section 4).
5. The passphrase was typed on the terminal, not piped and not stored.
6. The signature verifies against the public key before release.

A ceremony **aborts** if any of these happens, and nothing is released:

- consent is missing or given only in chat;
- the fingerprint or artifact hash differs from the register;
- any other process holds the key;
- the key file mode or owner is wrong;
- the passphrase prompt is bypassed or the input is not a terminal;
- no verified backup exists;
- the clock is unreliable, or the verification fails;
- the declarer or any automatic path is found to reference the key or the signer.

On abort the attempt is recorded with its cause. An aborted ceremony never leaves a
partial signature behind.

## 7. What stays pending

- Trust anchors in the repository stay **empty** until the pin gesture (section 5)
  is performed and recorded. The anchor is the public key only.
- Cédulas are **pendiente** with their cause until a pinned anchor verifies them. A
  cédula is never presented as trusted on the strength of this document, a file, or a
  signature that cannot be checked against a pinned key.
- The aduana receiver verifies with the public key only. It never holds the private key.
- Every number this design relies on that is not measured on the node is `NO_DATA`
  with its cause: full-disk encryption, the restore drill, the process audit.

## 8. Open items for the Sovereign

1. Which account the ceremony runs as, and which account the declarer runs as.
2. Where the two offline backup media are kept, and who holds each.
3. Whether the expected fingerprint is recorded in the batch register or in a
   separate signed file.
4. The date for the first restore drill, before any signature is made.
