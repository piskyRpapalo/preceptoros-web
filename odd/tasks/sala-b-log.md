# sala-b-log

Date: 2026-11-02
Law: decree «the ecosystem room = panel of voices» (buzon#30 ·6588150676) and the Acho Mesa's order of the same night. Level: **ESTADO**. Companion piece: SALA-C (the register of voices, `odd/tasks/sala-voces-log.md`, its own PR). Propose-only.

## Objective

What a message of the room is, before any panel exists: an Acho frame (< 1,024 B) with seal, voice and turn, written to an append-only log that is chained by the hash of the previous message.

## Scope

`atlas/puros/room_log.js`, not served (no reseal):
- `mensaje(log, {voz, texto, sello}, voces)` builds the next frame. The turn and the chain come from the log, never from the caller.
- `asienta(log, frame, autor, voces, juez)` is the only way to grow the log: it returns a new array and leaves the old one untouched.
- `verifica(log, voces, juez)` walks the log and names the first broken turn.
- `cabeza(log)` gives the thread head; `RAIZ` is the head of an empty log.

The register (SALA-C) and the judge (`Acho.valida`) come in as arguments, so this piece does not wait for SALA-C.

## Rules (fail-closed)

- A voice never speaks for another: `autor` must equal the frame's `voz`.
- A vacant, private, unmeasured or unknown voice is refused with the register's cause.
- A voice without a benchcard speaks, but its seal is forced to `NO_DATA`.
- The turn must be the next one, `prev` must be the head, and the judge must accept the frame (size, bands, text, seal).
- The hash is the house FNV-1a 32 (`docs/acho-language.md` §5), pinned by its vectors.

## Checklist

- [x] SALA-B-1 · message = Acho frame with seal, voice, turn and `prev`.
- [x] SALA-B-2 · append-only, chained; a rewritten past breaks the next turn.
- [x] SALA-B-3 · gate `atlas/puros/room_log_cases.mjs` (7 cases, in `gate.yml`). Red first: without the chain check, case 5 fails.

## Log

- 2026-11-02 · built on main `62dd2fd5`.
