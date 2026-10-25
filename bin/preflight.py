#!/usr/bin/env python3
"""preflight.py · the CI battery, run locally the way CI runs it, before a push.

    python3 bin/preflight.py            runs every gate step, n=2 like CI
    python3 bin/preflight.py --rapido   the same steps, one pass instead of two
    python3 bin/preflight.py --lista    prints the steps it would run, runs nothing

WHY (X6, Mesa queue 2026-10-26). Two reds reached CI that a local run would have caught:
`atlas/phase_gate.mjs` was not in the local battery (measured: sin_undefined.mjs 16,431 B), and a
local `version_sw_gate` GREEN was empty because it ran before the commit: the gate reads commits,
not the working tree. So this script:
  - refuses a dirty tree: commit first, then the gates (they measure HEAD, not your files);
  - reads the steps FROM the workflows (.github/workflows/gate.yml and phase.yml), so it cannot
    drift from CI: a step added there runs here with no edit;
  - measures the frozen-map rule against the PR range, as CI's merge ref does
    (`version_sw_gate.mjs --base origin/main`), instead of HEAD^1 alone.
What it skips, and says so: dependency installs and the receipt-only summary step.
Stdlib only. Exit 0 only if every step is green.
"""
import os
import pathlib
import re
import subprocess
import sys
import tempfile

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FLUJOS = ("gate.yml", "phase.yml")
SALTA = ("pip install", "GITHUB_STEP_SUMMARY")


def pasos(flujo):
    """(name, script) for every `run: |` block, plus one-line `run:` steps, in file order."""
    lineas = (RAIZ / ".github" / "workflows" / flujo).read_text(encoding="utf-8").split("\n")
    salida, nombre, i = [], None, 0
    while i < len(lineas):
        l = lineas[i]
        m = re.match(r"^\s*- name:\s*(.+)$", l)
        if m:
            nombre = m.group(1).strip()
        m = re.match(r"^(\s*)(?:- )?run:\s*(.*)$", l)
        if m:
            sangria, resto = len(m.group(1)), m.group(2).strip()
            if resto == "|":
                cuerpo, i = [], i + 1
                while i < len(lineas) and (not lineas[i].strip() or len(lineas[i]) - len(lineas[i].lstrip()) > sangria):
                    cuerpo.append(lineas[i])
                    i += 1
                base = min((len(c) - len(c.lstrip()) for c in cuerpo if c.strip()), default=0)
                salida.append((f"{flujo} · {nombre or 'run'}", "\n".join(c[base:] for c in cuerpo).strip()))
                nombre = None
                continue
            salida.append((f"{flujo} · {nombre or resto}", resto))
            nombre = None
        i += 1
    return salida


def plan(rapido):
    todos = []
    for flujo in FLUJOS:
        for nombre, script in pasos(flujo):
            if any(s in script for s in SALTA):
                continue
            # The PR range, as CI's merge ref sees it; not HEAD^1, which is only the last commit.
            script = re.sub(r"node atlas/version_sw_gate\.mjs(?!\s+--base)", "node atlas/version_sw_gate.mjs --base origin/main", script)
            if rapido:
                script = re.sub(r"for (\w+) in 1 2; do", r"for \1 in 1; do", script)
            todos.append((nombre, script))
    return todos


def main(argv):
    rapido, lista = "--rapido" in argv, "--lista" in argv
    todos = plan(rapido)
    if lista:
        for nombre, script in todos:
            print(f"== {nombre}\n{script}\n")
        return 0
    sucio = subprocess.run(["git", "status", "--porcelain"], cwd=RAIZ, capture_output=True, text=True).stdout.strip()
    if sucio:
        print("PREFLIGHT RED · the tree has uncommitted changes. Commit first: the gates measure commits, not files.")
        print(sucio)
        return 1
    rojo = []
    with tempfile.TemporaryDirectory(prefix="preflight-") as tmp:
        entorno = dict(os.environ, RUNNER_TEMP=tmp)
        for nombre, script in todos:
            print(f"== {nombre}", flush=True)
            r = subprocess.run(["bash", "-euo", "pipefail", "-c", script], cwd=RAIZ, env=entorno)
            print(f"   {'GREEN' if r.returncode == 0 else 'RED (exit %d)' % r.returncode}", flush=True)
            if r.returncode:
                rojo.append(nombre)
    print("PREFLIGHT " + ("GREEN · %d steps" % len(todos) if not rojo else "RED · " + "; ".join(rojo)))
    return 1 if rojo else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
