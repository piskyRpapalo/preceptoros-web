#!/usr/bin/env python3
"""traducciones.py · saca los textos traducibles de una pagina y los vuelve a meter.

    python3 traducciones.py segmentos ar          los textos de una lengua, para revisarlos
    python3 traducciones.py segmentos ar --junto en    cada texto al lado del de otra lengua
    python3 traducciones.py identidad              comprueba que sacar y meter no cambia nada

POR QUE EXISTE. El arabe entro el 2026-09-23 traduciendo 794 textos SIN tocar el
marcado: se extraen los nodos de texto, los atributos con prosa (placeholder,
aria-label, title, alt, data-hecho...), el contenido de los <meta> de
descripcion y los valores de los bloques JSON; se traducen; y se reinsertan en
el mismo sitio. Con la funcion identidad, la salida es byte a byte la entrada
--eso es `identidad`, y lo vigila el gate--.

Sirve para dos cosas que vienen: la REVISION NATIVA de las lenguas marcadas
`pendiente-revision-nativa` (un revisor lee `segmentos ar --junto en`, no HTML),
y la proxima lengua.

LO QUE NO DECIDE POR SI SOLO. Que una cadena sea codigo y no prosa lo decide la
CLAVE que la contiene (`NO_CLAVES`), no su forma. La forma engaña: la primera
version trataba toda palabra suelta en minuscula como identificador y dejo
`level`, `step` o `passes` sin traducir. Por eso `traducible()` ya no mira
mayusculas.

Solo biblioteca estandar.
"""
import json
import re

# Latino, griego, cirilico y ARABE. El arabe falto en la primera version y
# ninguna cadena arabe contaba como texto: la revision nativa habria salido vacia.
LETRA = re.compile(r"[A-Za-z\u00c0-\u00ff\u0370-\u03ff\u0400-\u04ff\u0600-\u06ff]")
# atributos con prosa
ATTRS = ("placeholder", "aria-label", "title", "alt", "data-hecho", "data-manual",
         "data-texto", "data-cargando", "data-vacio", "data-ok", "data-fallo")
META_PROSA = re.compile(r'(?:name|property)="(?:description|og:title|og:description|'
                        r'twitter:title|twitter:description|og:image:alt)"')
# claves JSON que nunca se traducen
NO_CLAVES = {"esquema", "idioma", "revision", "procedencia", "pendiente", "nota", "id", "clase", "modelo",
             "tag", "url", "href", "src", "icono", "estado", "tipo", "orden", "ruta",
             "comando", "fichero", "sha256", "clave", "lang", "codigo", "@context",
             "@type", "operatingSystem", "applicationCategory", "license",
             "codeRepository", "sameAs", "image", "logo", "priceCurrency", "price"}
IDENT = re.compile(r"^[0-9_:.\-/@#?=&%+]+$|^[a-z0-9]+(?:[_:./\-][a-z0-9]+)+$")


def traducible(s):
    t = s.strip()
    if not t or not LETRA.search(t):
        return False
    if IDENT.match(t) or t.startswith(("http://", "https://", "/", "./", "#")):
        return False
    return True


def _json_rehace(obj, f, clave=None):
    if isinstance(obj, dict):
        return {k: (v if k in NO_CLAVES else _json_rehace(v, f, k)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_json_rehace(v, f, clave) for v in obj]
    if isinstance(obj, str) and traducible(obj):
        return f(obj)
    return obj


def _estilo_json(raw):
    """Adivina indentacion y separadores para reescribir igual."""
    m = re.match(r"\s*[\[{]\s*\n(\s+)", raw)
    if m:
        return {"indent": len(m.group(1)) if m.group(1)[0] == " " else m.group(1)}
    sep = (", ", ": ") if re.search(r'",\s"|":\s', raw[:400]) else (",", ":")
    return {"separators": sep}


def json_rehace(raw, f):
    obj = json.loads(raw)
    nuevo = _json_rehace(obj, f)
    est = _estilo_json(raw)
    out = json.dumps(nuevo, ensure_ascii=False, **est)
    if raw.endswith("\n") and not out.endswith("\n"):
        out += "\n"
    return out


def _texto(s, f):
    if not traducible(s):
        return s
    a = len(s) - len(s.lstrip())
    b = len(s.rstrip())
    return s[:a] + f(s[a:b]) + s[b:]


def _attrs(tag, f):
    def sub(m):
        return m.group(1) + _texto(m.group(2), f) + m.group(3)
    for at in ATTRS:
        tag = re.sub(r'(\s' + re.escape(at) + r'=")([^"]*)(")', sub, tag)
    if tag.startswith("<meta") and META_PROSA.search(tag):
        tag = re.sub(r'(\scontent=")([^"]*)(")', sub, tag)
    return tag


PIEZA = re.compile(r"<!--.*?-->|<script\b[^>]*>.*?</script>|<style\b[^>]*>.*?</style>|<[^>]+>",
                   re.S)


def html_rehace(t, f):
    out, i = [], 0
    for m in PIEZA.finditer(t):
        out.append(_texto(t[i:m.start()], f))
        p = m.group(0)
        if p.startswith("<script"):
            mm = re.match(r"(<script\b([^>]*)>)(.*?)(</script>)$", p, re.S)
            abre, attrs, cuerpo, cierra = mm.groups()
            if "application/json" in attrs or "application/ld+json" in attrs:
                cuerpo = json_rehace(cuerpo, f)
            p = abre + cuerpo + cierra
        elif p.startswith("<!--") or p.startswith("<style"):
            pass
        else:
            p = _attrs(p, f)
        out.append(p)
        i = m.end()
    out.append(_texto(t[i:], f))
    return "".join(out)


CADENA = re.compile(r"'((?:[^'\\\n]|\\.)*)'|\"((?:[^\"\\\n]|\\.)*)\"")


def js_rehace(t, f):
    """Solo literales de cadena; los comentarios no se tocan."""
    out, i = [], 0
    com = re.compile(r"/\*.*?\*/|//[^\n]*", re.S)
    while i < len(t):
        mc = com.search(t, i)
        ms = CADENA.search(t, i)
        if ms and (not mc or ms.start() < mc.start()):
            q = ms.group(0)[0]
            s = ms.group(1) if q == "'" else ms.group(2)
            out.append(t[i:ms.start()])
            if traducible(s) and " " in s.strip():
                s = f(s)
            out.append(q + s + q)
            i = ms.end()
        elif mc:
            out.append(t[i:mc.end()])
            i = mc.end()
        else:
            out.append(t[i:])
            break
    return "".join(out)


def rehace(t, tipo, f):
    return {"html": html_rehace, "json": json_rehace, "js": js_rehace}[tipo](t, f)


def segmentos(t, tipo):
    vistos = []
    rehace(t, tipo, lambda s: (vistos.append(s), s)[1])
    return vistos


# ---------------------------------------------------------------- CLI ------
import glob as _glob
import sys as _sys
from pathlib import Path as _Path

PUBLICO = _Path(__file__).resolve().parent / "public"
PAGINAS = ("index", "instalar", "community", "benchmark", "onboarding",
           "playground", "profile")


def ficheros(lengua):
    """(ruta relativa, tipo) de todo lo traducible de una lengua."""
    out = [(f"{lengua}/{p}.html", "html") for p in PAGINAS
           if (PUBLICO / lengua / f"{p}.html").is_file()]
    out += [(_Path(f).name, "json") for f in sorted(_glob.glob(str(PUBLICO / f"*-{lengua}.json")))]
    out += [("assets/" + _Path(f).name, "js")
            for f in sorted(_glob.glob(str(PUBLICO / "assets" / f"*-{lengua}.js")))]
    return out


def lenguas():
    return sorted(d.name for d in PUBLICO.iterdir()
                  if d.is_dir() and len(d.name) == 2 and d.name.isalpha())


def _main(argv):
    if not argv or argv[0] not in ("segmentos", "identidad"):
        print(__doc__)
        return 2
    if argv[0] == "identidad":
        malos = 0
        for l in lenguas():
            for rel, tipo in ficheros(l):
                t = (PUBLICO / rel).read_text(encoding="utf-8")
                if rehace(t, tipo, lambda s: s) != t:
                    malos += 1
                    print("  DIFIERE", rel)
        print(f"  identidad: {'OK' if not malos else str(malos) + ' ficheros difieren'}")
        return 1 if malos else 0
    lengua = argv[1]
    otra = argv[argv.index("--junto") + 1] if "--junto" in argv else None
    import json as _json
    salida = {}
    for rel, tipo in ficheros(lengua):
        mios = segmentos((PUBLICO / rel).read_text(encoding="utf-8"), tipo)
        if otra:
            rel_o = rel.replace(f"{lengua}/", f"{otra}/", 1).replace(f"-{lengua}.", f"-{otra}.")
            f_o = PUBLICO / rel_o
            suyos = segmentos(f_o.read_text(encoding="utf-8"), tipo) if f_o.is_file() else []
            salida[rel] = [[s, suyos[i] if i < len(suyos) else None] for i, s in enumerate(mios)]
        else:
            salida[rel] = mios
    print(_json.dumps(salida, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(_sys.argv[1:]))
