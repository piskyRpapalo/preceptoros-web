# LANGUAGES — the verifiable matrix of the nine languages

**What this is:** the one table that says, per language, what the site serves
today. Every row is checked by `node atlas/mvp_casos.mjs` (case C8): a row
that lies about a portal, a game text or the game loader turns the gate red.
Piece P10 of the ideas18oct specification.

*(ES: la matriz verificable de las 9 lenguas; la vigila el caso C8. Si una fila
miente, el gate se pone rojo.)*

## Matrix (game text measured 2026-10-19, base `eac293d`; portals 2026-10-25)

| Code | Language | Dir | Portal `/<code>/` | Game text `public/atlas-<code>.json` | Strings | Game loader |
|---|---|---|---|---|---|---|
| `ar` | Arabic | rtl | 301 to `/` | 13,559 B | 209 | no |
| `de` | German | ltr | 301 to `/` | 11,274 B | 209 | no |
| `el` | Greek | ltr | 301 to `/` | 15,796 B | 209 | no |
| `en` | English | ltr | 301 to `/` | 16,365 B | 300 | yes |
| `es` | Spanish | ltr | 301 to `/` | 10,420 B | 209 | no |
| `fr` | French | ltr | 301 to `/` | 11,238 B | 209 | no |
| `it` | Italian | ltr | 301 to `/` | 10,749 B | 209 | no |
| `pt` | Portuguese | ltr | 301 to `/` | 10,578 B | 209 | no |
| `ru` | Russian | ltr | 301 to `/` | 15,300 B | 209 | no |

## How to read it

- **Portal:** English only until the MVP (Sovereign canon, 2026-10-25). The nine
  portals were the same English landing nine times; `worker/index.js` now answers
  each `/<code>/` with a 301 to `/`, and their folders left `public/` (history keeps
  them). The game text files below are untouched machinery.
- **Game text:** all nine files exist; eight carry 209 strings against 300 in
  English, so 91 strings per language are NO_DATA (cause: not translated).
- **Game loader:** `public/assets/thegame.js` loads only `en`
  (`var LENGUAS = ['en']`). This is a fence of the house ("loader only 'en'",
  AGENTS.md), not a bug: opening another language waits the Sovereign's sign-off.
- **Tightest file:** `atlas-en.json` is 16,365 B, 19 B under the 16,384 B piece
  ceiling of the MVP. A new English string must first move text to an
  on-demand family (`atlas-*-en.json`).

## How to measure again

```
node atlas/mvp_casos.mjs      # C8 compares this table with the tree
wc -c public/atlas-??.json
```

Bytes and string counts in this table are a dated measure, not a rule: the
case checks existence and the loader column; the byte columns are re-measured
by the command above when a language file changes.
