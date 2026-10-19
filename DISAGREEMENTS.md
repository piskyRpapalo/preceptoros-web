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
- RC-08 (proposed, pending Sovereign decision): `AtlasTelemetry` labels
  `JSON.stringify(a).length` as `bytes` (`public/assets/descent_view.js:77-80`),
  although JavaScript string length counts UTF-16 code units. `monta(..., otra)`
  accepts a caller-supplied scene (`:108`), so the metric's contract matters
  beyond the current bundled ASCII scene. Exact yardstick on Linux x86_64,
  Node v22.22.1, 2026-10-19:

  ```sh
  node -e 'const fs=require("fs"); const text=fs.readFileSync("public/assets/descent_scene.js","utf8"); const nonAscii=[...new Set([...text].filter(c=>c.charCodeAt(0)>127))]; const sample=JSON.stringify({r:"é"}); console.log("scene_non_ascii_codepoints="+nonAscii.length); console.log("sample_js_length="+sample.length); console.log("sample_utf8_bytes="+Buffer.byteLength(sample,"utf8"));'
  ```

  Receipt: bundled scene has 0 non-ASCII code points; synthetic `é` sample
  measures 9 JavaScript code units vs 10 UTF-8 bytes. No default-scene byte
  mismatch was measured. Proposed decision: define `bytes` as UTF-8 bytes or
  rename the field to `code_units`; do not silently change the telemetry.
