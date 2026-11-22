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
import fnmatch
import json
import os
import re
import subprocess
import sys
from datetime import date, datetime, timezone

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


# Owner-authored bounded GOAL authorization; existing SHA-bound gate remains.
GOAL_LINE = re.compile(
    r"^HITL-GOAL: ([a-z0-9][a-z0-9._-]{2,63}) network "
    r"([A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+) "
    r"([a-zA-Z0-9][a-zA-Z0-9_./-]{6,80}-) "
    r"(\d{4}-\d{2}-\d{2}) ([A-Za-z0-9_./*,+-]+)$"
)
GOAL_USE = re.compile(r"^USES-GOAL: ([a-z0-9][a-z0-9._-]{2,63})$")
GOAL_REVOKE = re.compile(r"^REVOKE-GOAL: ([a-z0-9][a-z0-9._-]{2,63})$")
GOAL_HEADER = "AUTORIZACION GOAL SOBERANO"
OWNER_LOGIN = "piskyRpapalo"
OWNER_ID = 284823701  # public GitHub numeric account ID
MAX_GOAL_AGE_DAYS = 14
BLOCKED_PREFIXES = (".github/", ".env", "secrets/", "private/",
                    "atlas/hitl_", "bin/paquete_firmo", "docs/hitl-fence")
BLOCKED_PARTS = ("auth", "identity", "sshsig", "signature", "signing",
                 "credentials", "secrets", "keys", "token", "owner",
                 "grant", "policy", "admin", "permission")


def _owner_comment(comment):
    user = comment.get("user") or {}
    created = comment.get("created_at")
    return (user.get("login") == OWNER_LOGIN and user.get("id") == OWNER_ID
            and bool(created) and comment.get("updated_at", created) == created)


def _goal_ref(pr_body):
    matches = [GOAL_USE.fullmatch(line.strip()) for line in (pr_body or "").splitlines()]
    matches = [m.group(1) for m in matches if m]
    return matches[0] if len(matches) == 1 else None


def _safe_goal_path(path):
    if not isinstance(path, str) or not path or path.startswith("/") or "\\" in path:
        return False
    parts = path.lower().split("/")
    if "//" in path or any(p in ("", ".", "..") for p in parts):
        return False
    if any(path.startswith(prefix) for prefix in BLOCKED_PREFIXES):
        return False
    for part in parts:
        for forbidden in BLOCKED_PARTS:
            if re.search(r"(^|[._-])" + re.escape(forbidden) + r"($|[._-])", part):
                return False
    return True


def decide_goal(comments, goal_id, pr, changed_files, hoy):
    """Pure gate: one authenticated OWNER goal covers bounded networking PRs.

    The goal line is NOT a signing key, deployment authorization or token grant.
    """
    if not goal_id:
        return False, "goal_missing_reference: expected one USES-GOAL line"
    if not isinstance(pr, dict) or not isinstance(changed_files, list):
        return False, "NO_DATA(goal_pr_or_files_unavailable)"
    if not changed_files or len(changed_files) > 100:
        return False, "goal_scope_denied: missing or oversized file list"
    repo = (pr.get("base", {}).get("repo") or {}).get("full_name")
    head_repo = (pr.get("head", {}).get("repo") or {}).get("full_name")
    branch = pr.get("head", {}).get("ref") or ""
    if (repo != "piskyRpapalo/preceptoros-web" or head_repo != repo
            or pr.get("base", {}).get("ref") != "main"):
        return False, "goal_scope_denied: wrong repository or base"
    try:
        current = date.fromisoformat(hoy)
    except (ValueError, TypeError):
        return False, "NO_DATA(goal_clock_invalid)"
    for comment in comments:
        if not _owner_comment(comment):
            continue
        if any((match := GOAL_REVOKE.fullmatch(line.strip()))
               and match.group(1) == goal_id
               for line in (comment.get("body") or "").splitlines()):
            return False, "goal_revoked: OWNER revoked goal"
    for comment in comments:
        body = comment.get("body") or ""
        if not _owner_comment(comment) or GOAL_HEADER not in body:
            continue
        for line in body.splitlines():
            match = GOAL_LINE.fullmatch(line.strip())
            if not match or match.group(1) != goal_id:
                continue
            _name, authorized_repo, prefix, expiry_str, patterns_csv = match.groups()
            try:
                start = date.fromisoformat(comment["created_at"][:10])
                expiry = date.fromisoformat(expiry_str)
            except (ValueError, TypeError):
                return False, "goal_scope_denied: invalid dates"
            if not (start <= current <= expiry
                    and 0 <= (expiry - start).days <= MAX_GOAL_AGE_DAYS
                    and authorized_repo == repo and branch.startswith(prefix)):
                return False, "goal_scope_denied: expired or wrong repo/branch"
            patterns = patterns_csv.split(",")
            if (not 1 <= len(patterns) <= 12
                    or not all(_safe_goal_path(p) for p in patterns)):
                return False, "goal_scope_denied: unsafe path allowance"
            for change in changed_files:
                path = change.get("filename")
                if (change.get("status") not in ("added", "modified")
                        or not _safe_goal_path(path)
                        or not any(fnmatch.fnmatchcase(path, p) for p in patterns)):
                    return False, "goal_scope_denied: file outside goal"
            return True, f"goal_authorized: {goal_id} until {expiry_str} (OWNER API)"
    return False, "goal_not_authorized: no unedited OWNER grant"


def estado_revision(ok, causa):
    """Review label only; never changes the fail-closed merge verdict."""
    if ok:
        return "SIGNED"
    if causa.startswith(("sin_firma:", "linea_malformada:", "sha_no_coincide:",
                         "fecha_fuera_de_rango:", "goal_not_authorized:",
                         "goal_missing_reference:")):
        return "PENDING_HUMAN_SIGNATURE"
    if causa.startswith("NO_DATA"):
        return "NO_DATA"
    return "BLOCKED"


def _resumen_pr(pr, head, causa, estado, hoy):
    """GitHub Actions review guidance. Not a signature, approval or extra gate."""
    ruta = os.environ.get("GITHUB_STEP_SUMMARY")
    if not ruta:
        return
    lineas = [
        "## HITL · review status",
        "",
        f"- **PR:** #{pr}",
        f"- **Exact head:** `{head}`",
        f"- **State:** `{estado}`",
        f"- **Evidence:** `{causa.replace(chr(96), '')[:180]}`",
        "",
    ]
    if estado == "PENDING_HUMAN_SIGNATURE":
        lineas += [
            "This is **pending human review**, not a failed code test.",
            "Technical results are reported independently by `gate` and `phase`.",
            "The required `hitl` check deliberately remains unsuccessful until an exact-head decision.",
            "",
            "After the Sovereign explicitly signs this exact commit, the Mesa may copy",
            "the following **unsigned template** into the existing buzon#30 register",
            "(with the required sign-off header and the Sovereign's actual decision):",
            "",
            f"`HITL: {head} web-pr-{pr} {hoy}`",
            "",
            "**This template is not a signature.** No AI may post it as FIRMO on its own.",
            "Or use one OWNER-signed networking GOAL in buzon#30 and USES-GOAL in the PR.",
            "That option does not require per-head signatures inside its bounded scope.",
            "Rerun this PR's own `hitl` job after the signed line is registered;",
            "do not push another commit after signing, because the SHA would change.",
        ]
    elif estado == "SIGNED":
        lineas += ["Exact-head line found; separate technical checks still apply."]
    else:
        lineas += ["No verified signature. Merge remains blocked; inspect the cause above."]
    try:
        with open(ruta, "a", encoding="utf-8") as salida:
            salida.write("\n".join(lineas) + "\n")
    except OSError:
        print("hitl: NO_DATA(summary_write_failed); the signature verdict is unchanged")


def _gh(token, *args):
    env = dict(os.environ, GH_TOKEN=token)
    r = subprocess.run(["gh", "api", *args], env=env, capture_output=True, text=True)
    if r.returncode != 0:
        raise RuntimeError("gh api fallo (" + str(r.returncode) + "): " + r.stderr.strip()[:200])
    return r.stdout


def comentarios_buzon(token, repo, issue):
    salida = _gh(token, "--paginate", f"repos/{repo}/issues/{issue}/comments", "--jq", ".[] | {body, user: {login: .user.login, id: .user.id}, created_at, updated_at}")
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
        pr_data = json.loads(_gh(token_web, f"repos/{repo}/pulls/{pr}"))
        head = pr_data["head"]["sha"]
        fecha = _gh(token_web, f"repos/{repo}/commits/{head}", "--jq", ".commit.committer.date").strip()[:10]
        comentarios = comentarios_buzon(token_buzon, buzon, issue)
        hoy = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ok, causa = decide(comentarios, head, fecha, hoy)
        if not ok:
            goal = _goal_ref(pr_data.get("body"))
            if goal:
                output = _gh(token_web, "--paginate", f"repos/{repo}/pulls/{pr}/files",
                             "--jq", ".[] | {filename, status}")
                changed = [json.loads(line) for line in output.splitlines() if line.strip()]
                ok, causa = decide_goal(comentarios, goal, pr_data, changed, hoy)
    except (RuntimeError, ValueError, KeyError, TypeError) as exc:
        print("hitl: ROJO · NO_DATA, causa: readback failed (" +
              type(exc).__name__ + ")")
        return 1
    estado = estado_revision(ok, causa)
    print(("hitl: VERDE · " if ok else "hitl: ROJO · ") + causa)
    if estado == "PENDING_HUMAN_SIGNATURE":
        print("review: PENDING_HUMAN_SIGNATURE · code tests are separate; merge stays blocked")
    _resumen_pr(pr, head, causa, estado, hoy)
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
