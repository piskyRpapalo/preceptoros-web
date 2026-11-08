#!/usr/bin/env python3
"""paquete_firmo · writes the signing package for one PR from its `gh` JSON. No network.

  gh pr view N -R <repo> --json number,title,headRefOid,mergeStateStatus,statusCheckRollup,body > pr.json
  python3 bin/paquete_firmo.py --repo web pr.json      (pr.json omitted or '-': stdin)
"""
import argparse
import json
import re
import sys

MAX = 1023  # the printed package plus its newline stays within 1024 B
GREEN = {"SUCCESS"}
WARN = {"DIRTY", "BEHIND"}
CITE = ("Visto en el Doogee", "VERDE ·")
RECORTADO = " (recortado)"


def nbytes(s):
    return len(s.encode("utf-8"))


def cut(s, n):
    """Longest prefix of s that is at most n UTF-8 bytes."""
    return s.encode("utf-8")[:max(n, 0)].decode("utf-8", "ignore")


def check_state(c):
    """(name, state) for a CheckRun or a StatusContext from statusCheckRollup."""
    if c.get("__typename") == "StatusContext" or "context" in c:
        return c.get("context") or "?", c.get("state") or "?"
    name = c.get("name") or "?"
    if c.get("status") not in (None, "", "COMPLETED"):
        return name, c["status"]
    return name, c.get("conclusion") or c.get("status") or "?"


def build(pr, repo, max_bytes=MAX):
    num, sha = pr.get("number"), pr.get("headRefOid")
    if not num or not sha:
        return None
    n, head = str(num), str(sha)[:12]
    title = re.sub(r"^HITL\s*·\s*", "", pr.get("title") or "").strip()[:200] or "(sin título)"
    checks = [check_state(c) for c in pr.get("statusCheckRollup") or []]
    ok = sum(1 for _, st in checks if st in GREEN)
    ev = [f"Evidencia: checks {ok}/{len(checks)} verdes"]
    bad = [f"{nm} ({st})" for nm, st in checks if st not in GREEN]
    if bad:
        ev.append("  no verdes: " + ", ".join(bad))
    for line in (pr.get("body") or "").splitlines():
        if any(k in line for k in CITE):
            ev.append("  cita: «" + line.strip()[:160] + "»")
            break
    state = pr.get("mergeStateStatus") or "UNKNOWN"
    action = f"preceptoros-firmar {repo} {n}" + ("" if repo == "web" else " --no-deploy")

    def render(evidence):
        lines = [f"PAQUETE DE FIRMAS · P-{repo}-{n} · cabeza {head}", f"Qué: {title}", evidence,
                 f"Estado: {state}"]
        if state in WARN:
            lines.append("⚠ no se puede fusionar así: hay que ponerlo al día primero")
        lines += [f"Acción post-FIRMO: {action}", f"Caduca si la cabeza deja de ser {head}."]
        return "\n".join(lines)

    text = render("\n".join(ev))
    if nbytes(text) > max_bytes:  # trim the evidence only; action and head are never cut
        room = max_bytes - nbytes(render("")) - nbytes(RECORTADO)
        text = render(cut("\n".join(ev), room) + RECORTADO)
    return text


def main(argv=None):
    ap = argparse.ArgumentParser(description="Signing package for one PR from its gh JSON.")
    ap.add_argument("--repo", required=True, choices=["web", "app"])
    ap.add_argument("pr_json", nargs="?", default="-")
    a = ap.parse_args(argv)
    try:
        raw = sys.stdin.read() if a.pr_json == "-" else open(a.pr_json, encoding="utf-8").read()
        pr = json.loads(raw)
    except (OSError, ValueError):
        print("NO_DATA · pr_json_invalid")
        return 1
    out = build(pr, a.repo) if isinstance(pr, dict) else None
    if out is None:
        print("NO_DATA · pr_json_incomplete")
        return 1
    print(out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
