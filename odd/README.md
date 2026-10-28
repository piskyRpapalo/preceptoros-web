# odd/ — Organic Driven Development

Adopted by FIRMO 2026-10-28; see `CONTRIBUTING.md` for the house rules.
The law lives in `study` → `02-legislation.md` (Amendment · ODD routing ·
2026-10-28). This file is that law's operating manual in this repo.

## Lifecycle

A feature document is born when substantial authorized work starts and moves
to `odd/done/` — same name, plus a `Status: landed` line — when the feature
lands. Everything else stays as it was. `odd/tasks/` holds only live work.

## Naming and language

- One feature, one document, one name: `odd/tasks/<feature-name>.md`.
  No date in the file name; the date lives inside the document.
  `odd/done/` keeps the name the document was born with.
- English, like every public artifact of the house (decree 2026-10-28).
  Documents already landed keep their original language as history.

## Canonical template

```
# <feature-name>

Date: <YYYY-MM-DD>
Law: <the commission this work answers, with its receipt if any>

## Objective
## Problem and why
## Scope
## Constraints
## Checklist
## Verification evidence
## Standing signature
## Methodology relief
## Log
## Next step
```

- Checklist with stable IDs (`T1`, `T2`… or a feature prefix), one box per unit.
- Verification evidence: measured values with their source; what is not
  measured is `NO_DATA` with cause.
- Standing signature: the search that was done for a signature the work
  needed, and its result. "None needed, cause: …" is a valid entry.
- Methodology relief (optional, decree 2026-10-28): any proposal to amend a
  standing law that made this work harder, delivered with the work.
- Log: choices and chain decisions. Next step: exactly one.

## Commits and gates

- Work-unit commits: reviewable slices of about 400 authored lines
  (advisory, never a cap or a forced split). A high-risk unit gets its own
  commit.
- Work never halts for a signature: search the corpus for the standing
  signature, record the modification, continue.
- Delivery gates are never skipped: checks that can go red, the receipt,
  and `FIRMO` on the exact head.
