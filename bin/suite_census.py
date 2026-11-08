#!/usr/bin/env python3
"""suite_census · censo de suites frente al gate (.github/workflows/gate.yml).

Solo stdlib, sin red. Descubre las suites por glob, y lo que el gate ejecuta
por tres vias estaticas: (a) lineas `node ...` / `python ...` del gate (con
globs y bucles `for X in ...`), (b) literales de ruta dentro de los runners que
el gate invoca (solo si caen cerca de un spawn/exec/subprocess), (c) el
descubrimiento de discovery_runner.mjs (dirs y sufijos leidos de su codigo).
Un runner que lanza un interprete sin ruta literal ni descubrimiento es OPACO.
Uso: suite_census.py [--check]
"""
import glob, json, os, re, shlex, sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GATE = os.path.join(RAIZ, ".github", "workflows", "gate.yml")
FUERA = os.path.join(RAIZ, "data", "suites_fuera.json")
GLOBS = ["atlas/*_cases.mjs", "atlas/puros/*_cases.mjs", "tests/*_cases.mjs", "tests/*.test.mjs"]
SPAWN = re.compile(r"spawn|exec|subprocess|Popen")
INTERP = re.compile(r"process\.execPath|sys\.executable|['\"]node['\"]|shutil\.which|\bnode\b\s*,|\[node\b")
SCRIPT = re.compile(r"\.(mjs|js|cjs|py)$")
LIT = re.compile(r"""['"]([^'"\s]+\.(?:mjs|js|cjs|py))['"]""")
QUOTED = re.compile(r"""(['"])[^'"]*\.(?:mjs|js|cjs|py)[^'"]*\1""")


def rel(p):
    return os.path.relpath(p, RAIZ).replace(os.sep, "/")


def expand(pat):
    if any(c in pat for c in "*?["):
        return sorted(rel(p) for p in glob.glob(os.path.join(RAIZ, pat)) if os.path.isfile(p))
    return [pat] if os.path.isfile(os.path.join(RAIZ, pat)) else []


def universo():
    return sorted({rel(p) for g in GLOBS for p in glob.glob(os.path.join(RAIZ, g)) if os.path.isfile(p)})


def leer_gate():
    """Devuelve ({fichero: [linea_gate, ...]}, [(linea_gate, fichero)]) ya expandidos."""
    directos = {}
    loops = {}
    with open(GATE, encoding="utf8") as fh:
        filas = list(enumerate(fh, 1))
    for n, raw in filas:
        s = raw.strip()
        if not s or s.startswith("#"):
            continue
        m = re.match(r"for\s+(\w+)\s+in\s+(.*?);\s*do\b", s)
        if m:
            items = []
            for it in m.group(2).split():
                items += expand(it) or [it]
            loops[m.group(1)] = items
            continue
        try:
            toks = shlex.split(s)
        except ValueError:
            continue
        if not toks or toks[0] not in ("node", "python", "python3"):
            continue
        ficheros = []
        if toks[0] == "node":
            for t in toks[1:]:
                v = re.fullmatch(r"\$\{?(\w+)\}?", t)
                if v and v.group(1) in loops:
                    ficheros += loops[v.group(1)]
                elif SCRIPT.search(t):
                    ficheros += expand(t)
        elif "-m" in toks and "unittest" in toks:
            for mod in toks[toks.index("unittest") + 1:]:
                ficheros += expand(mod.replace(".", "/") + ".py")
        else:
            ficheros += [f for t in toks[1:] if SCRIPT.search(t) for f in expand(t)]
        for f in ficheros:
            directos.setdefault(f, []).append(n)
    return directos


def descubrimiento(texto, carpeta):
    """discovery_runner: dirs = path.join(aqui,'..',D), sufijos = endsWith('S')."""
    if "readdirSync" not in texto:
        return []
    dirs = re.findall(r"path\.join\(\s*aqui\s*,\s*'\.\.'\s*,\s*'([^']+)'\s*\)", texto)
    sufijos = re.findall(r"endsWith\('([^']+)'\)", texto)
    if not dirs or not sufijos:
        return []
    out = []
    for d in dirs:
        base = os.path.normpath(os.path.join(carpeta, "..", d))
        for nombre in os.listdir(base) if os.path.isdir(base) else []:
            if nombre.endswith(tuple(sufijos)) and os.path.isfile(os.path.join(base, nombre)):
                out.append(rel(os.path.join(base, nombre)))
    return out


def ejecutados(directos):
    """Cierre: lo que el gate ejecuta directo, mas lo que sus runners ejecutan. Tambien opacos."""
    cubre = {}      # fichero -> linea del gate que lo alcanza
    opacos = {}     # runner -> linea del gate
    cola = []
    for f, lineas in directos.items():
        cubre.setdefault(f, lineas[0])
        cola.append(f)
    while cola:
        f = cola.pop()
        ruta = os.path.join(RAIZ, f)
        if not SCRIPT.search(f) or not os.path.isfile(ruta):
            continue
        with open(ruta, encoding="utf8", errors="replace") as fh:
            lineas = fh.read().split("\n")
        hijos = []
        for i, linea in enumerate(lineas):
            if not SPAWN.search(linea):
                continue
            ventana = lineas[max(0, i - 3): i + 4]
            for w in ventana:
                for lit in LIT.findall(w):
                    for cand in (os.path.join(os.path.dirname(ruta), lit), os.path.join(RAIZ, lit)):
                        if os.path.isfile(cand):
                            hijos.append(rel(cand))
                            break
            if INTERP.search(linea) and not any(QUOTED.search(w) for w in ventana):
                if not descubrimiento("\n".join(lineas), os.path.dirname(ruta)):
                    opacos.setdefault(f, cubre[f])
        hijos += descubrimiento("\n".join(lineas), os.path.dirname(ruta))
        for h in hijos:
            if h not in cubre:
                cubre[h] = cubre[f]
                cola.append(h)
    return cubre, opacos


def cargar_fuera():
    if not os.path.isfile(FUERA):
        return {}
    with open(FUERA, encoding="utf8") as fh:
        return json.load(fh).get("suites", {})


def censo():
    uni = universo()
    directos = leer_gate()
    cubre, opacos = ejecutados(directos)
    en_gate = [s for s in uni if s in cubre]
    fuera = cargar_fuera()
    sobrantes = sorted(s for s in fuera if s in cubre or s not in uni)
    declaradas = [s for s in uni if s not in cubre and s in fuera]
    indecl = [s for s in uni if s not in cubre and s not in fuera]
    return dict(uni=uni, cubre=cubre, opacos=opacos, en_gate=en_gate, declaradas=declaradas,
                indecl=indecl, sobrantes=sobrantes, fuera=fuera)


def main(argv):
    c = censo()
    linea = ("suites %d · in gate %d · declared out %d · undeclared %d · opaque runners %d"
             % (len(c["uni"]), len(c["en_gate"]), len(c["declaradas"]), len(c["indecl"]), len(c["opacos"])))
    if "--check" in argv:
        print(linea)
        for s in c["indecl"]:
            print("UNDECLARED " + s)
        for s in c["sobrantes"]:
            print("SOBRANTE " + s + (" (ya corre en el gate)" if s in c["cubre"] else " (no existe)"))
        return 1 if c["indecl"] or c["sobrantes"] else 0
    print(linea)
    for r, n in sorted(c["opacos"].items()):
        print("OPAQUE %s gate.yml:%d" % (r, n))
    for s in c["indecl"]:
        print("UNDECLARED " + s)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
