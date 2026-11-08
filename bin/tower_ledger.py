#!/usr/bin/env python3
"""K4c · the ascension tower ledger. Every distinct seal of public/sw.js on main is one floor.

  python3 bin/tower_ledger.py            measure from git history (first-parent, full clone) and write the ledger
  python3 bin/tower_ledger.py --check    check the committed ledger alone (works in a shallow CI clone)

The tower grows only with real seals: the ledger is measured, never edited by hand, and the check refuses a ledger
whose days are not in order, whose counts do not add up, or whose top floor is newer than the seal being served.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "game" / "tower_floors.json"
SW = ROOT / "public" / "sw.js"
VERSION = re.compile(r"preceptoros-(\d{4})-(\d{2})-([a-z]+)")
SCHEMA = "preceptoros:tower-floors/1"


def key(version):
    """Order of seals: year, week, then the letters as a base-26 counter (a < z < aa < fp)."""
    m = VERSION.fullmatch(version)
    if not m:
        raise ValueError("not a seal version: %r" % version)
    n = 0
    for ch in m.group(3):
        n = n * 26 + (ord(ch) - 96)
    return (int(m.group(1)), int(m.group(2)), len(m.group(3)), n)


def measure():
    log = subprocess.run(["git", "log", "--first-parent", "--reverse", "--format=C %cs", "-p", "--", "public/sw.js"],
                         cwd=ROOT, check=True, capture_output=True, text=True).stdout
    seen, days, first, last, day = set(), {}, None, None, None
    for line in log.splitlines():
        if line.startswith("C "):
            day = line[2:].strip()
        elif line.startswith("+const VERSION = "):
            m = VERSION.search(line)
            if m and m.group(0) not in seen:
                seen.add(m.group(0))
                days[day] = days.get(day, 0) + 1
                first = first or m.group(0)
                last = m.group(0)
    return {"$id": SCHEMA, "source": "distinct seals of public/sw.js on main (git log --first-parent)",
            "floors": len(seen), "first": first, "top": last, "days": [[d, n] for d, n in sorted(days.items())]}


def check(doc, served):
    fails = []
    if doc.get("$id") != SCHEMA:
        fails.append("schema")
    days = doc.get("days") or []
    if [d for d, _ in days] != sorted(d for d, _ in days) or len({d for d, _ in days}) != len(days):
        fails.append("days_not_in_order")
    if any(not isinstance(n, int) or n < 1 for _, n in days):
        fails.append("day_count_not_positive")
    if sum(n for _, n in days) != doc.get("floors"):
        fails.append("floors_do_not_add_up")
    try:
        if key(doc["top"]) > key(served):
            fails.append("top_newer_than_served_seal")
        if key(doc["first"]) > key(doc["top"]):
            fails.append("first_after_top")
    except (KeyError, ValueError):
        fails.append("versions_unreadable")
    return fails


def served_version():
    m = VERSION.search(SW.read_text(encoding="utf-8").splitlines()[0])
    return m.group(0)


def main(argv):
    if "--check" in argv:
        fails = check(json.loads(OUT.read_text(encoding="utf-8")), served_version())
        print("ROJO · " + ", ".join(fails) if fails else "VERDE · tower ledger consistent")
        return 1 if fails else 0
    doc = measure()
    OUT.write_text(json.dumps(doc, ensure_ascii=True, separators=(",", ":")) + "\n", encoding="utf-8")
    print("tower: %d floors · %s → %s · %d days" % (doc["floors"], doc["first"], doc["top"], len(doc["days"])))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
