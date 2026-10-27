# Web deployment contract · measured 2026-10-26

Status: proposal for review. Deployment remains a human action. This document records the current repository contract and the Mesa's measured credential/deploy sequence; it does not claim a deployment was run by this card.

## Source and authority

`wrangler.jsonc` names the Worker `preceptoros-web` and serves `./public` as static assets. `.github/workflows/deploy.yml` is `manual-worker-deploy`: `workflow_dispatch`, guarded to `refs/heads/main`, with the `production` environment. The Mesa measured that environment as requiring a reviewer; the approval policy is hosted in GitHub and is not represented in this checkout. The Sovereign triggers the workflow and supplies the human approval. Agents do not deploy.

Route-count receipt for this source tree (`origin/main` a061e9a + `mistral/w-o1b-switch-20261027`: the wave duel is the one combat face; `battle_replay.js`, `bout_scene.js` and `battle_choreography.js` leave the shell, `wave_duel_scene.js` joins it):

Rutas precargadas por el shell: 223
Rutas distintas del shell: 222

The workflow runs exactly:

```sh
npx --yes wrangler deploy --config wrangler.jsonc
```

It maps GitHub secret `CF_DEPLOY_CREDENTIAL` to Wrangler's `CLOUDFLARE_API_TOKEN`, and repository variable `CF_ACCOUNT_ID` to `CLOUDFLARE_ACCOUNT_ID`. These are names only; values must never be copied to a document, log, command transcript, or PR.

## Credential setup measurement

Mesa's 2026-10-26 receipt for the first green deployment records this sequence: empty secret/variable values → invalid credential value → valid credential → successful manual deployment, workflow run `40100263650`. This is a historical setup trace, not an instruction to expose or repeat any credential value. If deployment authentication fails, stop at the workflow result and have the Sovereign correct the protected setting; do not probe or print secrets.

## Post-deploy measurement

1. The Sovereign dispatches `manual-worker-deploy` from `main` and approves the `production` environment.
2. If measured HTML drift remains after the deploy, the Sovereign purges the affected zone cache using the authorized Cloudflare control. The exact purge command/endpoint is **NO_DATA**, cause: no purge procedure is versioned in this repository; do not infer a zone identifier or API call.
3. After any required purge, the Sovereign dispatches the `faro` workflow (`workflow_dispatch`). It runs `python atlas/faro.py`, comparing served files byte-for-byte with `public/` from main. A green reading is exit 0 with all files equal and zero distinct, absent, or network-error entries. A push-to-main also triggers this workflow; that trigger is not a replacement for the post-deploy reading.

The Mesa's earlier measured deployment baseline was 244 public files, but the expected count must be read from the exact main being deployed. Do not copy an old count into a new receipt.

## FARO diagnostic ladder (measured 2026-10-25)

A red faro reading does not by itself mean the deployment failed or the cache is stale. Measured incident: five consecutive red readings on the same 11 HTML routes while every non-HTML asset was byte-identical to main, and the deployment had been byte-identical to main the whole time. The ladder, in order:

1. **Read the instrument first.** `atlas/faro.py` pins the exact origin it judges (`SITIO`). Every manual probe must use the same hostname, or it measures a different vantage.
2. **Run the faro locally** from a residential connection (`python3 atlas/faro.py` in a fresh clone of `main`). Green local + red remote means the served difference depends on the client, not on the deployment.
3. **Read the sonda fields** in the faro log (`servido:`/`local:` bytes and sha256, `url_final`, `titulo_servido`, `offset_divergencia`, `divergencia_servido`). Redirects to clean URLs (`/index.html` → `/`) are expected worker behavior. A constant byte delta present on every HTML route is an injected block, not stale cache.
4. **Inspect the zone panel** (Analytics → Web Analytics, Security → Bots) for functions that modify HTML per client. Zone functions can inject a fixed snippet into HTML for clients outside their configured exclusions — a Web Analytics rule excluding EU visitors made every EU probe read clean while the non-EU CI runner received the injected bytes. A zone purge does not remove this class of difference; disabling the zone function does, and a whole-zone purge clears copies already cached at the edge.
5. **Purge the whole zone** when purging: the edge caches HTML for both the apex and the `www` hostnames, even when the origin sends `max-age=0`.

Measured facts from this incident: the faro from a residential EU connection was green 244/244 while the non-EU CI runner measured +367 bytes on every HTML route, with identical titles, generation, and clean redirect targets. Deployment and cache were healthy; the red reading was an artifact of the judge's vantage.

Measured culprit (sonda v2 reading, 2026-10-25): the Cloudflare **Web Analytics beacon** (`static.cloudflareinsights.com/beacon.min.js`), auto-injected near the end of every HTML document — a constant +367-byte block at end-of-document offsets, identical on all 11 routes. The zone setting was "Enable, excluding visitor data in the EU", so EU visitors received exact main bytes while the non-EU CI runner received the beacon — the vantage asymmetry behind every red remote reading. The fix lives in the zone panel (Web Analytics → Manage site → Automatic Setup → Disable), not in this repository; the site contract declares zero external requests on load, and the injection violated it for affected clients. Case closure (2026-10-25): after Disable plus a whole-zone purge, the faro read green 244/244, DRIFT 0, ERRORES 0 (run `40142159933`).

## Rollback boundary

The checked-in deploy workflow has no rollback input, artifact selector, or rollback job; `wrangler.jsonc` declares only the Worker name, compatibility date, and static asset directory. Therefore this repository does **not** establish a rollback procedure. Prior-version selection and platform rollback behavior are **NO_DATA**, cause: not configured or evidenced by these files. Do not invent a rollback command or redeploy an unmeasured tree. The Sovereign must obtain a separately measured and authorized rollback procedure before treating rollback as available.

## Receipt

Record the source commit, workflow run ID, human approver, result, public-file counts and FARO output. Record only the names of protected settings, never their values. If a step cannot be measured, record `NO_DATA` with its cause. `encolado` is not evidence that a deployment is live.
