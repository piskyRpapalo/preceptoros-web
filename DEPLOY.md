# Web deployment contract · measured 2026-10-26

Status: proposal for review. Deployment remains a human action. This document records the current repository contract and the Mesa's measured credential/deploy sequence; it does not claim a deployment was run by this card.

## Source and authority

`wrangler.jsonc` names the Worker `preceptoros-web` and serves `./public` as static assets. `.github/workflows/deploy.yml` is `manual-worker-deploy`: `workflow_dispatch`, guarded to `refs/heads/main`, with the `production` environment. The Mesa measured that environment as requiring a reviewer; the approval policy is hosted in GitHub and is not represented in this checkout. The Sovereign triggers the workflow and supplies the human approval. Agents do not deploy.

Route-count receipt for this source tree (`origin/main` 8c4eeed):

Rutas precargadas por el shell: 218
Rutas distintas del shell: 217

The workflow runs exactly:

```sh
npx --yes wrangler deploy --config wrangler.jsonc
```

It maps GitHub secret `CF_DEPLOY_CREDENTIAL` to Wrangler's `CLOUDFLARE_API_TOKEN`, and repository variable `CF_ACCOUNT_ID` to `CLOUDFLARE_ACCOUNT_ID`. These are names only; values must never be copied to a document, log, command transcript, or PR.

## Credential setup measurement

Mesa's 2026-10-26 receipt for the first green deployment records this sequence: empty secret/variable values → invalid credential value → valid token → successful manual deployment, workflow run `40100263650`. This is a historical setup trace, not an instruction to expose or repeat any credential value. If deployment authentication fails, stop at the workflow result and have the Sovereign correct the protected setting; do not probe or print secrets.

## Post-deploy measurement

1. The Sovereign dispatches `manual-worker-deploy` from `main` and approves the `production` environment.
2. If measured HTML drift remains after the deploy, the Sovereign purges the affected zone cache using the authorized Cloudflare control. The exact purge command/endpoint is **NO_DATA**, cause: no purge procedure is versioned in this repository; do not infer a zone identifier or API call.
3. After any required purge, the Sovereign dispatches the `faro` workflow (`workflow_dispatch`). It runs `python atlas/faro.py`, comparing served files byte-for-byte with `public/` from main. A green reading is exit 0 with all files equal and zero distinct, absent, or network-error entries. A push-to-main also triggers this workflow; that trigger is not a replacement for the post-deploy reading.

The Mesa's earlier measured deployment baseline was 244 public files, but the expected count must be read from the exact main being deployed. Do not copy an old count into a new receipt.

## Rollback boundary

The checked-in deploy workflow has no rollback input, artifact selector, or rollback job; `wrangler.jsonc` declares only the Worker name, compatibility date, and static asset directory. Therefore this repository does **not** establish a rollback procedure. Prior-version selection and platform rollback behavior are **NO_DATA**, cause: not configured or evidenced by these files. Do not invent a rollback command or redeploy an unmeasured tree. The Sovereign must obtain a separately measured and authorized rollback procedure before treating rollback as available.

## Receipt

Record the source commit, workflow run ID, human approver, result, public-file counts and FARO output. Record only the names of protected settings, never their values. If a step cannot be measured, record `NO_DATA` with its cause. `encolado` is not evidence that a deployment is live.
