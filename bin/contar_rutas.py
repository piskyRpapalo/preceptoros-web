#!/usr/bin/env python3
"""Count the service-worker shell route entries from its declared lists."""

import argparse
import ast
import collections
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
LISTS = ROOT / "public" / "sw-listas.js"
WORKER = ROOT / "public" / "sw.js"


class RouteSourceError(Exception):
    pass


def array_literal(source, name):
    match = re.search(r"\bconst\s+" + re.escape(name) + r"\s*=\s*\[", source)
    if not match:
        raise RouteSourceError("missing array: " + name)
    start = match.end() - 1
    depth = 0
    quote = None
    escaped = False
    index = start
    while index < len(source):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
        elif char in ("'", '"', "`"):
            quote = char
        elif source[index:index + 2] == "//":
            end = source.find("\n", index)
            index = len(source) if end < 0 else end
        elif source[index:index + 2] == "/*":
            end = source.find("*/", index + 2)
            if end < 0:
                raise RouteSourceError("unclosed comment in " + name)
            index = end + 1
        elif char == "[":
            depth += 1
        elif char == "]":
            depth -= 1
            if depth == 0:
                try:
                    result = ast.literal_eval(source[start:index + 1])
                except (SyntaxError, ValueError) as error:
                    raise RouteSourceError("non-literal array: " + name) from error
                if not isinstance(result, list) or any(not isinstance(item, str) for item in result):
                    raise RouteSourceError("expected string array: " + name)
                return result, index + 1
        index += 1
    raise RouteSourceError("unclosed array: " + name)


def require_pattern(source, pattern, label):
    if not re.search(pattern, source, re.S):
        raise RouteSourceError("unsupported route expression: " + label)


def measure():
    try:
        source = LISTS.read_text(encoding="utf-8")
        worker = WORKER.read_text(encoding="utf-8")
    except OSError as error:
        raise RouteSourceError("cannot read route source: " + str(error)) from error

    languages, _ = array_literal(source, "IDIOMAS")
    pages, _ = array_literal(source, "PAGINAS")
    game, _ = array_literal(source, "JUEGO")
    cover, cover_end = array_literal(source, "PORTADA")
    require_pattern(
        source[cover_end:],
        r"^\s*\.concat\(IDIOMAS\.map\(function\s*\(l\)\s*\{\s*return\s*"
        r"['\"]\/assets\/enviar-['\"]\s*\+\s*l\s*\+\s*['\"]\.js['\"]\s*;\s*\}\)\);",
        "PORTADA locale expansion",
    )
    require_pattern(source, r"\bconst\s+HUB\s*=\s*\[\.\.\.PORTADA,\s*\.\.\.JUEGO\s*\]", "HUB")
    require_pattern(
        worker,
        r"function\s+rutasDelShell\s*\(\)\s*\{\s*const\s+r\s*=\s*\[\s*['\"]\/['\"]\s*,\s*"
        r"['\"]\/manifest\.webmanifest['\"]\s*\]\s*\.concat\(HUB\);\s*"
        r"for\s*\(const\s+l\s+of\s+IDIOMAS\)\s*for\s*\(const\s+p\s+of\s+PAGINAS\)\s*"
        r"r\.push\(['\"]\/['\"]\s*\+\s*l\s*\+\s*['\"]\/['\"]\s*\+\s*p\);\s*return\s+r;",
        "service-worker shell expansion",
    )

    entries = ["/", "/manifest.webmanifest"]
    entries.extend(cover)
    entries.extend("/assets/enviar-" + language + ".js" for language in languages)
    entries.extend(game)
    entries.extend("/" + language + "/" + page for language in languages for page in pages)
    counts = collections.Counter(entries)
    return {
        "shell_entries": len(entries),
        "shell_unique": len(counts),
        "shell_duplicates": len(entries) - len(counts),
    }


def check_document(path, measured):
    try:
        document = path.read_text(encoding="utf-8")
    except OSError as error:
        raise RouteSourceError("cannot read declared document: " + str(error)) from error
    expected = {
        "shell_entries": measured["shell_entries"],
        "shell_unique": measured["shell_unique"],
    }
    patterns = {
        "shell_entries": r"(?im)^Rutas precargadas por el shell:\s*(\d+)\s*$",
        "shell_unique": r"(?im)^Rutas distintas del shell:\s*(\d+)\s*$",
    }
    for key, pattern in patterns.items():
        values = re.findall(pattern, document)
        if len(values) != 1:
            raise RouteSourceError("document must declare exactly one " + key)
        if int(values[0]) != expected[key]:
            raise RouteSourceError(
                "document drift for " + key + ": declared " + values[0]
                + ", measured " + str(expected[key])
            )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check-doc", type=Path)
    args = parser.parse_args()
    try:
        measured = measure()
        if args.check_doc:
            check_document(args.check_doc, measured)
            print("OK · %d shell entries, %d unique routes, %d duplicate" % (
                measured["shell_entries"], measured["shell_unique"], measured["shell_duplicates"]
            ))
        else:
            print("shell_entries=%d shell_unique=%d shell_duplicates=%d" % (
                measured["shell_entries"], measured["shell_unique"], measured["shell_duplicates"]
            ))
        return 0
    except RouteSourceError as error:
        print("NO_DATA · " + str(error), file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
