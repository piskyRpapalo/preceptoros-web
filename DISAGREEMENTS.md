# DISAGREEMENTS — the collision register (append-only)

**What this is:** the append-only register of name collisions and disagreements,
each with an immutable ID of the **RC-\*** series, its verdict, and its receipt.
The old series RV3-\* (from the ideas18oct specification) was renamed by the
Sovereign's sign-off of 2026-10-18 because it collided with RV3-01 of the rack;
RV3-\* remains a historical alias, never rewritten.

*(ES: el registro append-only de colisiones, serie RC-\*. La serie vieja RV3-\*
queda alias hist\u00f3rico por colisi\u00f3n con el rack; FIRMO 2026-10-18.)*

## Law (append-only, rename-winner)

- Every entry carries an immutable ID `RC-NN` — never reused, never edited;
  a correction lands as a new entry that cites the old one.
- When two names collide, the official English name wins; the old Spanish
  name becomes a historical alias, absorbed.
- Each entry carries: date, subject, verdict, receipt (command, yardstick,
  machine, date), and the Sovereign's sign-off when one exists.
- The silicon proposes entries; only the Sovereign's sign-off closes them.

## Register

| ID | Date | Subject | Verdict | Receipt | Sign-off |
|---|---|---|---|---|---|
| RC-01 | 2026-10-18 | RV3-\* (ideas18oct spec) vs RV3-01 (rack) | series renamed to RC-\*; RV3-\* historical alias | study/10-collisions.md \u00b7 census measured 2026-10-18 \u00b7 FIRMO 2026-10-18 | FIRMO 2026-10-18 |
| RC-02 | 2026-10-18 | seal (sello) \u2014 EN wins | seal \u2194 sello, 61 \u2194 242, alias absorbed | grep count over project files, 2026-10-18 (study PR #1) | FIRMO 2026-10-18 |
| RC-03 | 2026-10-18 | signature (firma, crypto) vs sign-off (firma) | signature = crypto proof; sign-off = the Sovereign's decision; never interchangeable | study/10-collisions.md second wave, measured 2026-10-18 | FIRMO 2026-10-18 |
| RC-04 | 2026-10-18 | NO_DATA (sin_dato) | NO_DATA official, 2,337 \u2194 6, most absorbed term; always with cause | study/10-collisions.md, measured 2026-10-18 | FIRMO 2026-10-18 |
| RC-05 | 2026-10-18 | ceiling 288 \u2194 techo 156 | ceiling wins; two living ceilings (web 10 KiB served, core 16 KiB) | study/10-collisions.md, measured 2026-10-18 | FIRMO 2026-10-18 |

## Pending (seeds awaiting sign-off)

- RC-06 (proposed): "Multics" paper-name collision — confirmed avoided
  (arXiv:2610.17201); design conforms to Ruling #40. NO_DATA: the full
  group-slot collision sweep — cause: not yet run.
