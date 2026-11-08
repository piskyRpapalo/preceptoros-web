#!/usr/bin/env python3
"""Language census. Stdlib only, no network, read-only.

MEASURES: the lang attribute of <html> in every public/**/*.html, and the
two-letter language folders under public/ that hold html.
FINDS: every language claim in the repo ("N languages" or
"<dt>Languages</dt><dd>xx, yy") and compares it with the measurement.
A claim that cannot be measured says NO_DATA with its cause. A claim tagged
[DATO] or NO_DATA on its line is PENDING, never MISMATCH. Pages without a lang
attribute are counted as undeclared and never as a language."""
import json, os, re, sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
EXTENSIONES = (".html", ".md", ".json", ".txt")
OMITIR = {".git", "node_modules", "downloads", "vendor"}
PALABRAS = {w: i for i, w in enumerate(
    "zero one two three four five six seven eight nine ten eleven twelve".split()) if i}
RE_CUENTA = re.compile(r"\b(\d+|" + "|".join(PALABRAS) + r")\s+languages\b", re.I)
RE_LISTA = re.compile(r"<dt>Languages</dt>\s*<dd>(.*?)</dd>", re.I)
RE_HTML = re.compile(r"<html\b[^>]*>", re.I)
RE_LANG = re.compile(r"\blang\s*=\s*[\"']?([A-Za-z-]+)", re.I)
RE_TAG = re.compile(r"<[^>]+>")


def leer(p):
    return p.read_text(encoding="utf-8", errors="replace")


def ficheros(raiz):
    for dp, dn, fn in os.walk(raiz):
        dn[:] = sorted(d for d in dn if d not in OMITIR)
        for f in sorted(fn):
            if f.endswith(EXTENSIONES):
                yield Path(dp) / f


def sumar(lista):
    return {"pages": len(lista), "bytes": sum(p.stat().st_size for p in lista)}


def medir(raiz):
    pub = raiz / "public"
    paginas = sorted(pub.rglob("*.html")) if pub.is_dir() else []
    por_lengua, sin_lengua = {}, []
    for p in paginas:
        m = RE_HTML.search(leer(p))
        lang = RE_LANG.search(m.group(0)) if m else None
        if lang:
            por_lengua.setdefault(lang.group(1).split("-")[0].lower(), []).append(p)
        else:
            sin_lengua.append(p)
    carpetas = {}
    if pub.is_dir():
        for d in sorted(pub.iterdir()):
            if d.is_dir() and len(d.name) == 2 and d.name.isalpha():
                hijas = sorted(d.rglob("*.html"))
                if hijas:
                    carpetas[d.name.lower()] = sumar(hijas)
    idiomas = sorted(set(por_lengua) | set(carpetas))
    return {"paginas": len(paginas), "idiomas": idiomas,
            "por_lengua": {k: sumar(v) for k, v in sorted(por_lengua.items())},
            "carpetas": carpetas, "sin_lengua": sumar(sin_lengua)}


# The front door: what a visitor or a crawler reads. Docs and odd/ keep history; --all reports them too.
FRENTE = ("README.md", "llms.txt", "public/")


def reclamos(raiz, todo=False):
    out = []
    for p in ficheros(raiz):
        rel = p.relative_to(raiz).as_posix()
        if not todo and not any(rel == f or rel.startswith(f) for f in FRENTE if f.endswith("/") or rel == f):
            continue
        for n, linea in enumerate(leer(p).splitlines(), 1):
            pend = "[DATO]" in linea or "NO_DATA" in linea
            for m in RE_CUENTA.finditer(linea):
                t = m.group(1).lower()
                out.append({"file": rel, "line": n, "kind": "count",
                            "declared": int(t) if t.isdigit() else PALABRAS[t],
                            "pending": pend})
            m = RE_LISTA.search(linea)
            if m:
                txt = RE_TAG.sub("", m.group(1)).replace("[DATO]", "").replace("NO_DATA", "")
                codes = sorted({t.strip().lower() for t in txt.split(",") if t.strip().isalpha()})
                out.append({"file": rel, "line": n, "kind": "list",
                            "declared": codes, "pending": pend})
    return out


def veredicto(c, med):
    """Returns (verdict, detail). Detail is the text inside the parentheses."""
    langs = med["idiomas"]
    medido = len(langs) if c["kind"] == "count" else langs
    dec = c["declared"]
    ok = (dec == medido) if c["kind"] == "count" else (set(dec) == set(langs))
    if c["kind"] == "list":
        dec, medido = ", ".join(dec), ", ".join(langs)
    if c["pending"]:
        return "PENDING", f"declared {dec}, measured {medido}"
    if med["paginas"] == 0:
        return "NO_DATA", "no public/**/*.html to measure"
    if not langs:
        return "NO_DATA", (f"{med['sin_lengua']['pages']} pages without html lang "
                           "attribute; no language declared")
    if ok:
        return "MATCH", ""
    return "MISMATCH", f"declared {dec}, measured {medido}"


def main(argv, raiz=RAIZ):
    med = medir(raiz)
    cl = reclamos(raiz, "--all" in argv)
    for c in cl:
        c["verdict"], c["detail"] = veredicto(c, med)
    k = sum(c["verdict"] == "MISMATCH" for c in cl)
    if "--json" in argv:
        print(json.dumps({"$id": "preceptoros:language-census/1", "measured": med,
                          "claims": cl}, ensure_ascii=False, indent=2))
    else:
        # pages/bytes by lang attribute; a folder-only language uses its folder
        partes = ", ".join(
            f"{l}:{t['pages']}/{t['bytes']}"
            for l in med["idiomas"]
            for t in [med["por_lengua"].get(l) or med["carpetas"][l]]) or "none"
        print(f"languages measured {len(med['idiomas'])} ({partes}) · claims {len(cl)} · mismatches {k}")
        for c in cl:
            d = f" ({c['detail']})" if c["detail"] else ""
            print(f"{c['file']}:{c['line']} {c['verdict']}{d}")
    return 1 if "--check" in argv and k else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
