#!/usr/bin/env python3
"""The deploy guard · runs BEFORE every `wrangler deploy` (build.command of wrangler.jsonc).

Preceptor contract: study/05-contracts.md (policy vs engine: the engine is fail-closed; you change a policy,
not eight brains). PS: propose-only + seal; the guard is the deploy's fail-closed gate.

Why it exists (measured incident, 2026-11-02 ~22:40Z, buzon#30 ·6590360027): a `wrangler deploy` was launched
from a clone whose name said «main» but lived in `mistral/interior-army-20261020`, 1.108 commits behind
main. The `git pull` failed and the deploy went ahead: production fell back to the `abjg` letter (Oct 20)
and `/openworld/` answered 404. Wrangler never asks which branch what it uploads comes from; this guard does.

Law: locally, deploy only `main`, identical to a freshly fetched `origin/main`, with no changes in what is
served (`public/`, `worker/`, `wrangler.jsonc`). In GitHub Actions the workflow's rule decides
(`refs/heads/main`). Declared exit for a deliberate rollback: PRECEPTOROS_DEPLOY_EXCEPTION="<reason>"
(it is printed, never whispered). No dependencies; fail-closed: in doubt, no deploy.
"""
import os
import subprocess
import sys

SERVIDO = ("public", "worker", "wrangler.jsonc")


def juzga(entorno, rama, head, origen, sucios):
    """Juez puro. Devuelve (ok, motivo). No toca git ni la red."""
    excepcion = (entorno.get("PRECEPTOROS_DEPLOY_EXCEPCION") or "").strip()
    if excepcion:
        return True, "EXCEPCIÓN DECLARADA: " + excepcion
    if entorno.get("GITHUB_ACTIONS") == "true":
        if entorno.get("GITHUB_REF") == "refs/heads/main":
            return True, "CI en refs/heads/main"
        return False, "CI fuera de main: " + str(entorno.get("GITHUB_REF"))
    if rama != "main":
        return False, "la rama es «%s», no main" % (rama or "HEAD suelto")
    if not head or not origen:
        return False, "no se pudo leer HEAD u origin/main (sin red no hay deploy)"
    if head != origen:
        return False, "HEAD %s ≠ origin/main %s: haz git pull --ff-only" % (head[:8], origen[:8])
    if sucios:
        return False, "cambios sin commitear en lo servido: " + ", ".join(sucios[:5])
    return True, "main = origin/main %s, servido limpio" % head[:8]


def git(*args):
    r = subprocess.run(["git", *args], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else ""


def main():
    entorno = dict(os.environ)
    rama = head = origen = ""
    sucios = []
    if entorno.get("GITHUB_ACTIONS") != "true" and not (entorno.get("PRECEPTOROS_DEPLOY_EXCEPCION") or "").strip():
        rama = git("branch", "--show-current")
        subprocess.run(["git", "fetch", "-q", "origin", "main"], capture_output=True)
        head = git("rev-parse", "HEAD")
        origen = git("rev-parse", "origin/main")
        sucios = [l[3:] for l in git("status", "--porcelain", "--", *SERVIDO).splitlines() if l.strip()]
    ok, motivo = juzga(entorno, rama, head, origen, sucios)
    print(("deploy_guard · VERDE · " if ok else "deploy_guard · ROJO · deploy cancelado · ") + motivo,
          file=sys.stderr)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
