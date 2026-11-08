#!/usr/bin/env python3
"""W-06 · seal registry. Consumed seals are measured from git; reserved seals are declared, never deleted.

  python3 bin/seal_registry.py measure            read public/sw.js history (first-parent), set consumed_top, mark consumed
  python3 bin/seal_registry.py --check            VERDE / ROJO on data/seal_registry.json; AVISO if the served seal is reserved
  python3 bin/seal_registry.py next               print the next free seal of the served year-week
  python3 bin/seal_registry.py reserve V BY CAUSE declare a reservation (refuses consumed, reserved, empty fields)
"""
import importlib.util
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REG = ROOT / "data" / "seal_registry.json"
SW = ROOT / "public" / "sw.js"
SCHEMA = "preceptoros:seal-registry/1"
SEAL = re.compile(r"preceptoros-(\d{4})-(\d{2})-([a-z]+)")

_spec = importlib.util.spec_from_file_location("tower_ledger", ROOT / "bin" / "tower_ledger.py")
_tl = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_tl)
key = _tl.key


def served(sw=SW):
    m = SEAL.search(sw.read_text(encoding="utf-8").splitlines()[0])
    if not m:
        raise ValueError("sw.js line 1 carries no seal")
    return m.group(0)


def load(reg=REG):
    return json.loads(Path(reg).read_text(encoding="utf-8"))


def save(doc, reg=REG):
    Path(reg).write_text(json.dumps(doc, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")


def letters(n):
    """Bijective base-26 with a=1 ... z=26, aa=27: the inverse of key()'s counter."""
    s = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(97 + r) + s
    return s


def history(root=ROOT):
    """Seals of public/sw.js on main in order, or None when there is no history (shallow or no commits)."""
    try:
        shallow = subprocess.run(["git", "-C", str(root), "rev-parse", "--is-shallow-repository"],
                                 capture_output=True, text=True).stdout.strip()
        if shallow != "false":
            return None
        log = subprocess.run(["git", "-C", str(root), "log", "--first-parent", "--reverse", "-p", "--format=",
                              "--", "public/sw.js"], capture_output=True, text=True, check=True).stdout
    except (OSError, subprocess.CalledProcessError):
        return None
    seen = []
    for line in log.splitlines():
        if line.startswith("+const VERSION = "):
            m = SEAL.search(line)
            if m and m.group(0) not in seen:
                seen.append(m.group(0))
    return seen or None


def measure(root=ROOT, reg=REG):
    seen = history(root)
    if seen is None:
        return "NO_DATA shallow_history"
    doc = load(reg)
    top = max(seen, key=key)
    old = doc.get("consumed_top")
    doc["consumed_top"] = max([top] + ([old] if old else []), key=key)
    for r in doc["reserved"]:
        if r["version"] in seen:
            r["consumed"] = True
    save(doc, reg)
    return "MEASURED consumed_top=%s seals=%d consumed_reservations=%d" % (
        doc["consumed_top"], len(seen), sum(1 for r in doc["reserved"] if r.get("consumed")))


def check(doc, served_v):
    fails, warns = [], []
    if doc.get("$id") != SCHEMA:
        fails.append("schema")
    res = doc.get("reserved", [])
    try:
        ks = [key(r["version"]) for r in res]
    except (KeyError, ValueError, TypeError):
        fails.append("versions_unreadable")
        ks = None
    if ks is not None:
        if ks != sorted(ks):
            fails.append("reserved_not_in_order")
        vs = [r["version"] for r in res]
        if len(set(vs)) != len(vs):
            fails.append("reserved_duplicate")
    warns += ["served version is reserved by %s" % r.get("by") for r in res if r.get("version") == served_v]
    return fails, warns


def next_free(doc, served_v):
    s = key(served_v)
    floor = max([v for v in [doc.get("consumed_top"), served_v] if v] + [r["version"] for r in doc["reserved"]], key=key)
    if key(floor)[:2] > s[:2]:
        raise ValueError("floor %s is in a later week than served %s" % (floor, served_v))
    taken = {r["version"] for r in doc["reserved"]}
    n = 1
    while True:
        cand = "preceptoros-%04d-%02d-%s" % (s[0], s[1], letters(n))
        if key(cand) > key(floor) and cand not in taken:
            return cand
        n += 1


def reserve(version, by, cause, root=ROOT, reg=REG):
    key(version)
    if not by.strip() or not cause.strip():
        raise ValueError("by and cause are required")
    doc = load(reg)
    if any(r["version"] == version for r in doc["reserved"]):
        raise ValueError("%s is already reserved" % version)
    seen = history(root)
    if seen is not None:
        if version in seen:
            raise ValueError("%s is already consumed" % version)
    elif doc.get("consumed_top") and key(version) <= key(doc["consumed_top"]):
        raise ValueError("no history to verify %s; it is not above consumed_top" % version)
    doc["reserved"].append({"version": version, "by": by, "cause": cause})
    doc["reserved"].sort(key=lambda r: key(r["version"]))
    save(doc, reg)
    return "RESERVED %s by %s" % (version, by)


def main(argv):
    try:
        if argv == ["measure"]:
            print(measure())
        elif argv == ["--check"]:
            fails, warns = check(load(), served())
            for w in warns:
                print("AVISO · " + w)
            print("ROJO · " + ", ".join(fails) if fails else "VERDE · seal registry consistent")
            return 1 if fails else 0
        elif argv == ["next"]:
            print(next_free(load(), served()))
        elif len(argv) == 4 and argv[0] == "reserve":
            print(reserve(argv[1], argv[2], argv[3]))
        else:
            print(__doc__)
            return 2
    except ValueError as e:
        print("ROJO · " + str(e))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
