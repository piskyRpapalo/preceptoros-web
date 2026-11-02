#!/usr/bin/env python3
"""Guarda del deploy · corre ANTES de cada `wrangler deploy` (build.command de wrangler.jsonc).

Por qué existe (incidente medido, 2026-11-02 ~22:40Z, buzon#30 ·6590360027): un `wrangler deploy` lanzado
desde un clon cuyo nombre decía «main» pero estaba en `mistral/interior-army-20261020`, 1.108 commits detrás
de main. El `git pull` falló y el deploy siguió: producción volvió a la letra `abjg` (20-oct) y `/openworld/`
dio 404. Wrangler no pregunta de qué rama sale lo que sube; esta guarda sí.

Ley: en local solo se despliega `main`, idéntico a `origin/main` recién traído, sin cambios en lo que se sirve
(`public/`, `worker/`, `wrangler.jsonc`). En GitHub Actions manda la regla del workflow (`refs/heads/main`).
Salida declarada para un rollback a propósito: PRECEPTOROS_DEPLOY_EXCEPCION="<motivo>" (se imprime, no se calla).
Sin dependencias; fail-closed: ante la duda, no se despliega.
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
    print(("guarda_deploy · VERDE · " if ok else "guarda_deploy · ROJO · deploy cancelado · ") + motivo,
          file=sys.stderr)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
