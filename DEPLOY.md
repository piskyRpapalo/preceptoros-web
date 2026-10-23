# Web deployment · measured proposal

Status: proposal, draft PR only. The current `wrangler.jsonc` names `preceptoros-web` and serves `./public` as Workers static assets. `docs/ESTADO.md` still says Cloudflare Pages (including its historical redirect note); that record conflicts with the current Wrangler configuration. This PR records the drift and leaves `wrangler.jsonc` unchanged.

## Route count

Measured at main `4105e9b` from `public/sw-listas.js` and the shell expansion in `public/sw.js`:

Rutas precargadas por el shell: 193
Rutas distintas del shell: 192

The counter preserves declared shell entries, expands the nine language paths, and reports duplicate entries separately. Run `python3 bin/contar_rutas.py` to measure; the gate runs `python3 bin/contar_rutas.py --check-doc DEPLOY.md` and fails on a missing, duplicate, or stale declaration. Historical entries in append-only `PARA_LA_MESA.md` are not rewritten or treated as current documentation.

## Deploy command

A human with the authorized deployment credential runs this from the checked-out commit to publish:

```sh
npx --yes wrangler deploy --config wrangler.jsonc
python3 atlas/faro.py
```

The deployment workflow is manual-only and guarded to run on `main`. Its GitHub secret name is `CF_DEPLOY_CREDENTIAL`; Wrangler receives it through its documented authentication environment. The non-secret repository variable `CF_ACCOUNT_ID` must also be set because the config has no account identifier. Neither value belongs in this file. The workflow is not run by this draft PR.

## Successful faro result

At measured main `4105e9b` there are 234 files under `public/`. After a successful deployment of that exact tree, `faro.yml` should report:

```text
ficheros comparados: 234
LIVE iguales: 234
DRIFT distintos: 0
DRIFT ausentes: 0
ERRORES de red: 0
```

Expected process exit: `0`. These are acceptance values, not a claim about the currently served edge; the live comparison must be run after deployment.

## Rollback

Set `PREVIOUS_DEPLOYED_COMMIT` to the commit measured as currently deployed in the Cloudflare dashboard, then redeploy that tree and re-run the faro:

```sh
test -n "$PREVIOUS_DEPLOYED_COMMIT"
git worktree add --detach /tmp/preceptoros-web-rollback "$PREVIOUS_DEPLOYED_COMMIT"
cd /tmp/preceptoros-web-rollback
npx --yes wrangler deploy --config wrangler.jsonc
python3 atlas/faro.py
```

A rollback is complete only when the faro reports the file count and all files LIVE with zero drift and zero network errors. If the dashboard does not identify the deployed commit, rollback source is NO_DATA and no redeploy should be guessed.
