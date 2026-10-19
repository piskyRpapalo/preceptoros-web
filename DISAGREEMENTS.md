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
| RC-07 | 2026-10-18 | seal-letter collision (6 of P02 vs 7 of the web in tabla_semantica.js:4, rack side) and byte ceiling (1,024 B passes in APP, fails in LAB/web) | single ceiling < 1,024 B across the whole house; official translation = Codex compatibility matrix | FIRMO of the Sovereign at the Mesa, 2026-10-18 (round 362); tabla_semantica.js measured on the rack side, NO_DATA on the public side (cause: file lives on the private rack) | FIRMO 2026-10-18 (r362) |

## Pending (seeds awaiting sign-off)

- RC-06 (proposed): "Multics" paper-name collision — confirmed avoided
  (arXiv:2610.17201); design conforms to Ruling #40. NO_DATA: the full
  group-slot collision sweep — cause: not yet run.
- RC-17 (proposed, 2026-10-19): piece ceiling. The MVP mission of
  2026-10-19 names 16,384 B per piece; `test_web.py` `TOPE_FICHERO` is 25 MiB
  per block (D2, 2026-10-11); RC-05 names two ceilings (web 10 KiB served,
  core 16 KiB). Measured: 0 of 207 served text files over 16,384 B (max
  `atlas-en.json` 16,365 B). Proposal: `atlas/mvp_casos.mjs` C4 guards
  16,384 B on served text; `TOPE_FICHERO` stays for blocks. The Sovereign
  decides which number is the law.
- RC-18 (proposed, 2026-10-19): three seal lists for one idea. P02: six
  (LIVE, STALE, STATIC, SIMULATED, NO_DATA, ERROR); web
  `public/game/tabla_semantica.js`: seven (no STATIC; PROPUESTA, FIRMADO
  extra); app `canales.py` at `88aedec`: six (MEDIDO, EMULADO, NO_DATA,
  PROPUESTA, REQUIERE_FIRMA, DECLARADO). The "Codex compatibility matrix"
  named by RC-07: NO_DATA, cause: not found in web (`9a72d4d`) nor app
  (`88aedec`). Draft in `docs/MVP.md` §8: data seals and governance states as
  two axes.
- RC-19 (proposed, 2026-10-19): correction beside RC-07, which is not
  edited. RC-07's receipt reads "NO_DATA on the public side (cause: file
  lives on the private rack)". Measured: `public/game/tabla_semantica.js`
  lives in public main (2,138 B), judged by `tests/tabla_semantica.test.mjs`
  (8 pass, 0 fail).
- RC-20 (proposed, 2026-10-19; receipt filed in
  `atlas/RECIBO_T_CRT_20261019.md`): the T_CRT §2/§4 depth-edge reading,
  seal-layer mapping, open/closed map margin, and 175/173 precache count have
  competing interpretations. Proposed code follows the signed §2 stops and
  keeps the complete map beneath closed panels; the Sovereign decides the
  canonical edge rules and the final precache count. Receipt: `python3
  atlas/test_atlas.py`; `node arnes_sw.mjs`; 2026-10-19, Linux x86_64,
  Python 3.14.4 / Node measured in the PR receipt.
- RC-21 (proposed, 2026-10-19): `atlas/mvp_mapa.json` W7 still says the
  Questions??? trigger is unbuilt, while merged PR #173 implements it and
  `node atlas/descent_view_casos.mjs` measures its nine language links and
  four engine stamps. Recommendation: split the row into the built trigger
  and the local-app query, whose browser/device E2E remains NO_DATA until
  exercised. Receipt: `python3 atlas/test_atlas.py` (185 tests),
  `node arnes_sw.mjs` (22/22); 2026-10-19, Linux x86_64, Python 3.14.4.
