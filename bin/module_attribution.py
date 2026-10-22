#!/usr/bin/env python3
import argparse
import html.parser
import json
import re
from pathlib import Path

IMPORT_RE = re.compile(r"(?:\bimport\s*(?:[^'\"]*?\sfrom\s*)?|\bexport\s+[^'\"]*?\sfrom\s*)['\"]([^'\"]+)['\"]|\bimport\s*\(\s*['\"]([^'\"]+)['\"]\s*\)")
JS_PATH_RE = re.compile(r"['\"]((?:/|\.\.?/)[^'\"]+\.js)['\"]")
MODULE_ROOT = "public/game"


class HtmlEntries(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.entries = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == "script" and values.get("src"):
            self.entries.append(values["src"])
        if tag == "link" and values.get("rel") == "modulepreload" and values.get("href"):
            self.entries.append(values["href"])


def _local_path(root, owner, specifier):
    if not specifier.startswith(("./", "../", "/")):
        return None
    candidate = (root / "public" / specifier.lstrip("/")) if specifier.startswith("/") else owner.parent / specifier
    candidate = candidate.resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None


def _references(root, source):
    try:
        text = source.read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        return []
    if source.suffix.lower() == ".html":
        parser = HtmlEntries()
        parser.feed(text)
        return [item for item in parser.entries if item.startswith(("./", "../", "/"))]
    if source.suffix.lower() == ".js":
        values = [match.group(1) or match.group(2) for match in IMPORT_RE.finditer(text)]
        values.extend(match.group(1) for match in JS_PATH_RE.finditer(text))
        return list(dict.fromkeys(values))
    return []


def _reachable(root, entry):
    seen = set()
    pending = [entry]
    while pending:
        current = pending.pop()
        if current in seen:
            continue
        seen.add(current)
        for specifier in _references(root, current):
            resolved = _local_path(root, current, specifier)
            if resolved is not None and resolved not in seen:
                pending.append(resolved)
    return seen


def census(root):
    root = Path(root).resolve()
    public = root / "public"
    modules = sorted((root / MODULE_ROOT).glob("*.js"))
    routes = sorted((public).glob("**/*.html"))
    route_modules = {}
    for route in routes:
        reachable = _reachable(root, route)
        route_modules[route.relative_to(root).as_posix()] = reachable
    rows = []
    for module in modules:
        path = module.relative_to(root).as_posix()
        candidates = [route for route, reached in route_modules.items() if module in reached]
        rows.append({"module": path, "bytes": module.stat().st_size,
                     "candidate_routes": candidates, "status": "NO_DATA",
                     "cause": "static reachability does not prove runtime execution or visible contribution"})
    return {"schema": "web.module-route-census/1", "modules": len(rows),
            "routes": len(route_modules), "rows": rows}


def main(argv=None):
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args(argv)
    result = census(args.root)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
