# Canon · Context hygiene (H7 guardian) · FIRMO'd campaign H

Migrated law: agent-facing files (llms.txt, AGENTS.md, CLAUDE.md, README.md) are the context that agents read first. The guardian `tests/context_hygiene_guardian.test.mjs` audits them with the measure-before house rule: it MEASURES and REPORTS with file:line counts; findings feed the next H pieces (the Mesa triages). This PR fixes nothing.

## MEASURE BEFORE (declared on the current tree, main f2e87b4, 2026-10-16)

### LIVE REFS: 43 cited · 39 alive · 4 dead
- `CLAUDE.md:12` -> `vigia.yml` — dead: no file named vigia.yml in this tree (possible rename or rack-side path; H piece to triage)
- `CLAUDE.md:37` -> `coherencia-publica.py` — dead: not found by basename anywhere
- `CLAUDE.md:43` -> `bin/coherencia-publica.py` — dead: bin/ exists but has no such script
- `README.md:11` -> `PRECEPTOR.md` — dead IN THIS REPO: the file lives in piskyRpapalo/PreceptorOS (cross-repo ref; the guardian resolves against this tree; the Mesa triages whether it becomes a full URL)

### LIVE COMMANDS: 0 cited in backticks — no dead commands to triage. (The guardian keeps the gate armed: any future `python3 …`/`node …` citation is checked against real entry points.)

### ZERO SECRETS: armed from PRIVATE_LITERALS env var (CI config), never from the public tree. Without the var: NO_DATA with cause, declared in the run log (same pattern as the scrub guardian in PreceptorOS).

### FORBIDDEN WORDS: 2 findings in the strict scan (red measured)
- `AGENTS.md:11` -> `depin`, `clearing` — TRIAGE: the line IS the house fence itself (the forbidden-words rule quoted verbatim). Options for the Mesa: (a) exempt the fence line in the guardian, (b) rewrite the fence without quoting the words. NOT fixed in this PR.
- `llms.txt:74,76` -> `token` — TRIAGE: the string is "~300 tokens" (LLM count, technical use, not the forbidden concept). 'token' is audited separately from the hard FORBIDDEN list for this reason; the count lives here for the Mesa to confirm or strike.
- `AGENTS.md:11` -> `oracle, notary, magic` do NOT appear in the English scan (the fence quotes them in Spanish: oraculo, notario, magia); the English guardian list catches the English forms.

## Guardian design (law made test)
- Default mode: measures, declares counts, never blocks.
- Strict mode (`H7_ESTRICTO=1`): each finding is red with file:line. Red measured today: 2 fails (dead refs 4; forbidden 2 findings), 3 passes.
- The red of this guardian is declared APART from the D1 dwindling red (82 remaining): different yardsticks, never summed or mixed.

## Source blocks (fichero:línea, per the house index)
- llms.txt:73-78 — jump index v2, "pass 1 (~300 tokens)": the token-string triage source.
- AGENTS.md:11 — the forbidden-words fence, quoted verbatim: the triage source for the exemption decision.
- CLAUDE.md:12,37,43 — dead-ref citations, migrated here with their lines for the H pieces that fix them.
- README.md:11 — PRECEPTOR.md cross-repo citation, triage: convert to full GitHub URL or move the ref.
