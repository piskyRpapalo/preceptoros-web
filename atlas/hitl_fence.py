"""The merge fence (R-CERCO-MERGE): a PR is green only if the Sovereign signed its exact head.

Preceptor contract: study/05-contracts.md (closed forms; reference is not signature — a pointer
at a sign-off is never the sign-off). PS: propose-only + seal; this fence is the seal's gate.

The sign-off lives in buzon#30. The Mesa copies the Sovereign's line into a comment that starts
with «FIRMA SOBERANO» and carries one exact line:

    HITL: <40 lowercase hex SHA> <pieza-slug> <YYYY-MM-DD>

Green only if that line carries the PR head's EXACT SHA, a date no earlier than the head
commit's date and no later than today, and a valid slug. Everything else is red with its
measured cause. Without BUZON_TOKEN it is red: NO_DATA, never assumed.

Honest about the limit: the fence checks the register, not the person. Whoever writes the
line in buzon#30 is the Mesa, copying what the Sovereign said in chat. The human guarantee
is that Sovereign phrase; the fence only makes merging without it impossible.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone

CABECERA = "FIRMA SOBERANO"
LINEA = re.compile(r"^HITL: ([0-9a-f]{40}) ([A-Za-z0-9#._-]+) (\d{4}-\d{2}-\d{2})$")
SHA = re.compile(r"^[0-9a-f]{40}$")


def decide(comments, head_sha, head_fecha, hoy):
    """Pure decision. comments: [{'body': str}]; head_fecha, hoy: 'AAAA-MM-DD'."""
    if not SHA.match(head_sha or ""):
        return False, "cabeza_invalida: el SHA de la PR no tiene 40 hex en minusculas"
    firmados = [c.get("body") or "" for c in comments if CABECERA in (c.get("body") or "")]
    if not firmados:
        return False, "sin_firma: ningun comentario FIRMA SOBERANO en buzon#30"
    lineas = [l.strip() for b in firmados for l in b.splitlines() if l.strip().startswith("HITL:")]
    validas = []
    for l in lineas:
        m = LINEA.match(l)
        if m:
            validas.append(m.groups())
    if not validas:
        return False, "linea_malformada: hay firma pero ninguna linea HITL tiene el formato exacto"
    para_cabeza = [v for v in validas if v[0] == head_sha]
    if not para_cabeza:
        return False, f"sha_no_coincide: ninguna linea lleva la cabeza {head_sha[:12]}"
    dentro = [v for v in para_cabeza if head_fecha <= v[2] <= hoy]
    if not dentro:
        fechas = ", ".join(sorted({v[2] for v in para_cabeza}))
        return False, f"fecha_fuera_de_rango: la linea dice {fechas}; debe estar entre {head_fecha} y {hoy}"
    return True, f"verde: {dentro[0][1]} firmado {dentro[0][2]} sobre {head_sha[:12]}"


def _gh(token, *args):
    env = dict(os.environ, GH_TOKEN=token)
    r = subprocess.run(["gh", "api", *args], env=env, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("gh api fallo (" + str(r.returncode) + "): " + r.stderr.strip()[:200])
    return r.stdout


def comentarios_buzon(token, repo, issue):
    salida = _gh(token, "--paginate", f"repos/{repo}/issues/{issue}/comments", "--jq", ".[] | {body}")
    return [json.loads(l) for l in salida.splitlines() if l.strip()]


def main():
    pr = os.environ["PR_NUMERO"]
    repo = os.environ["PR_REPO"]
    buzon = os.environ.get("BUZON_REPO", "piskyRpapalo/buzon")
    issue = os.environ.get("BUZON_ISSUE", "30")
    token_web = os.environ.get("GITHUB_TOKEN", "")
    token_buzon = os.environ.get("BUZON_TOKEN", "")
    if not token_buzon:
        print("hitl: ROJO · NO_DATA, causa: falta el secreto BUZON_TOKEN; no se asume ninguna firma")
        return 1
    try:
        head = _gh(token_web, f"repos/{repo}/pulls/{pr}", "--jq", ".head.sha").strip()
        fecha = _gh(token_web, f"repos/{repo}/commits/{head}", "--jq", ".commit.committer.date").strip()[:10]
        comentarios = comentarios_buzon(token_buzon, buzon, issue)
    except RuntimeError as e:
        print("hitl: ROJO · NO_DATA, causa: " + str(e))
        return 1
    hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    ok, causa = decide(comentarios, head, fecha, hoy)
    print(("hitl: VERDE · " if ok else "hitl: ROJO · ") + causa)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
