# The merge fence (R-CERCO-MERGE) · how it works and how to activate it

Status: **PROPOSAL · REQUIRES_FIRMA**. The workflow and its tests are in this branch.
Activating the required status check is a **Sovereign action** (repository rulesets). The
Mesa serves the commands; nothing here runs them.

## Why

On 2026-10-25 two green pull requests were merged from the GitHub interface without the
Sovereign's signed HITL line in the register. The protocol says no merge without that line.
Discipline alone did not hold, so the rule moves into the merge itself.

## How it works

1. A pull request opens or changes. The workflow `hitl` (`.github/workflows/hitl.yml`) runs
   `atlas/hitl_cerco.py`.
2. The script reads the head SHA of the PR and the commit date of that head.
3. It reads the comments of the register issue (buzon#30) through `BUZON_TOKEN`.
4. **Green** only if a comment containing `FIRMA SOBERANO` has a line, exactly:

       HITL: <40 lowercase hex = the PR head SHA> <pieza-slug> <AAAA-MM-DD>

   and the date is not before the head commit date and not after today.
5. **Red** otherwise, with the measured cause printed in the check:

| Cause printed | Meaning |
|---|---|
| `sin_firma` | no comment says `FIRMA SOBERANO` |
| `linea_malformada` | a firma exists but no `HITL:` line has the exact format (short or long SHA, uppercase, bad slug) |
| `sha_no_coincide` | a valid line exists, but none carries the head SHA |
| `fecha_fuera_de_rango` | the line for this head is dated before the head commit or after today |
| `NO_DATA` | `BUZON_TOKEN` is absent or the register cannot be read; nothing is assumed |

The check is named `hitl`. If the workflow never ran, the check does not exist yet.

## What it proves, and what it does not

- **Proves:** a signed line for this exact commit exists in the register, written after the
  commit was made, and in the exact format. A prefix, a stale SHA or a missing line cannot pass.
- **Does not prove the person.** The Mesa writes the line in the register from what the
  Sovereign said in the chat. The fence checks the register, not a cryptographic signature.
  The human gesture is the Sovereign's own sentence in the chat; the fence makes sure
  nothing merges without it.
- A new push changes the head SHA, so every earlier line stops matching. That is intended:
  a new head needs a new line.

## Tests

`tests/test_hitl_cerco.py` (15 cases) runs in the CI gate. Sabotage cases must stay red:
fake SHA, wrong date (before and after the window), absent line, prefix collision (7, 39 and
41 characters), uppercase SHA, bad slug, a signature header with no `HITL:` line, and an empty
register. Mutating the SHA check or the date check turns the suite red.

## Activation (Sovereign actions)

Per repository, after the first run of the `hitl` check (so GitHub knows the name):

1. Add the secret `BUZON_TOKEN` (a token that can read and comment on the register) to the
   repository. Its value is never written to a file or a log.
2. Create a branch ruleset on `main` that requires the status check `hitl`. Example
   (placeholders in angle brackets; not run):

       gh api -X POST repos/<OWNER>/<REPO>/rulesets --input ruleset.json

   with `ruleset.json` containing `"target": "branch"`, `"enforcement": "active"`,
   `"conditions": {"ref_name": {"include": ["refs/heads/main"], "exclude": []}}`, and a rule
   `{"type": "required_status_checks", "parameters": {"required_status_checks":
   [{"context": "hitl"}], "strict_required_status_checks_policy": true}}`.
3. Check it on a test pull request before relying on it: a PR without a line must stay red
   and unmergeable.

## Portability

The script reads its repository, register issue and PR from environment variables. For
another repository, set `PR_REPO`, `BUZON_REPO` and `BUZON_ISSUE`, copy the workflow, and
keep the job name `hitl`. The decision function is pure and does not depend on the repository.
