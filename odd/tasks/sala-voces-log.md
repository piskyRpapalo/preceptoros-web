# sala-voces-log

Date: 2026-11-02
Law: decree «the ecosystem room = panel of voices» (buzon#30 ·6588150676) and the Acho Mesa's order of the same night (SALA-B and SALA-C go to the Acho train; SALA-A, D and E go to TF). Propose-only; each piece is its own PR and its own HITL line on the exact head.

## Objective

The room's two pure cores, before any panel exists: **who may speak** (SALA-C, level LEY) and **what a message is** (SALA-B, level ESTADO). The panel (SALA-A) and its service on loopback (SALA-D) will only paint and serve what these two already decide.

## Scope

- SALA-C · `atlas/puros/room_voices.js`: one Acho card per voice (< 1,024 B, passes `Acho.valida`), and `regla(id)` → `{ puede, sello, causa }`.
- SALA-B · `atlas/puros/room_log.js`: each message is an Acho frame with seal, voice and turn. The log is append-only and chained by the hash of the previous message; it has a thread head and a verifier.
- Not served: nothing under `public/`, so no reseal. Never two live PRs resealing the same tree.

## Decisions taken inside the cage (declared)

1. **Device voices by role, not by machine name** (`nodo-sdr`, `nodo-git`, `nodo-movil`): the web's SCRUB forbids hostnames in what it publishes. The census (H6) will map roles to devices outside the public repo.
2. **The private voice** is `privada-1`: no name, no path, no brain. Its role is `NO_DATA` and its cause is «private by decree». The decree says nothing of it may be in the repo, and the case pins that the card has exactly four keys.
3. **The sage's seat is VACANTE**: the candidate was discarded by its benchcard (·6588111541). A vacant seat is refused, not muted.
4. **A voice without a benchcard** may speak, but every message it writes is sealed `NO_DATA` (decree D4: «nothing ascends without a batch»). No seat is in that state today.
5. **Codex's model and the Mesas' models** are `NO_DATA` in the register: not measured here.

## Checklist

- [x] SALA-C-1 · the register: 13 voices, each with a card that passes `Acho.valida` (the largest is 548 B).
- [x] SALA-C-2 · the rule: live voices speak; vacant, private, unmeasured and unknown voices are refused with their cause.
- [x] SALA-C-3 · gate `atlas/puros/room_voices_cases.mjs` (8 cases, in `gate.yml`). Red first: making the private voice speak fails case 4.
- [ ] SALA-B · the log (next PR).

## Log

- 2026-11-02 · SALA-C built on main `62dd2fd5`.
