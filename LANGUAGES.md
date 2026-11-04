# LANGUAGES — the dated matrix of the nine languages

**RE-CLASSIFIED · 2026-11-04 (corte D, 2026-10-28):** the game text files
(`public/atlas-<code>.json`) and the game loader
(`public/assets/thegame.js`) were retired with theGame; none of them exists
anymore. `atlas/mvp_casos.mjs` no longer checks this table — since corte D
it is the retirement guard (the retired files must stay absent and out of
the precache). The matrix below is kept as a dated measure of what the
nine portals served on 2026-10-19 (base `eac293d`). Piece P10 of the
ideas18oct specification, in its time.

*(ES: la matriz verificable de las 9 lenguas; la vigila el caso C8. Si una fila
miente, el gate se pone rojo.)*

## Matrix — dated measure kept as history (game text measured 2026-10-19, base `eac293d`; portals 2026-10-25)

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

## How it was read at the time (history)

- **Portal:** English only until the MVP (Sovereign canon, 2026-10-25). The nine
  portals were the same English landing nine times; `worker/index.js` answers
  each `/<code>/` with a 301 to `/`.
- **Game text:** all nine files existed; eight carried 209 strings against
  300 in English — 91 strings per language were NO_DATA (cause: not
  translated).
- **Game loader:** `public/assets/thegame.js` loaded only `en`
  (`var LENGUAS = ['en']`) — a fence of the house ("loader only 'en'",
  AGENTS.md), not a bug.
- **Tightest file:** `atlas-en.json` was 16,365 B, 19 B under the 16,384 B
  piece ceiling of the MVP.

## How to measure again

```
node atlas/mvp_casos.mjs      # corte-D retirement guard: the retired files must stay absent
```

The portals 301 behavior is still measurable; the game-text columns are
history: the files they point at no longer exist (corte D, 2026-10-28). The
byte columns of the matrix are the dated measure of 2026-10-19, kept as
record, not as rule.
