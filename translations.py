#!/usr/bin/env python3
"""translations.py · saca los textos traducibles de una pagina y los vuelve a meter.

    python3 translations.py segmentos ar          los textos de una lengua, para revisarlos
    python3 translations.py segmentos ar --junto en    cada texto al lado del de otra lengua
    python3 translations.py identidad              comprueba que sacar y meter no cambia nada

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
CLAVE que la contiene (`NO_TRANSLATE_KEYS`), no su forma. La forma engaña: la primera
version trataba toda palabra suelta en minuscula como identificador y dejo
`level`, `step` o `passes` sin traducir. Por eso `is_translatable()` ya no mira
mayusculas.

Solo biblioteca estandar.
"""
import json
import re

# Latino, griego, cirilico y ARABE. El arabe falto en la primera version y
# ninguna cadena arabe contaba como texto: la revision nativa habria salido vacia.
LETTER_RE = re.compile(r"[A-Za-z\u00c0-\u00ff\u0370-\u03ff\u0400-\u04ff\u0600-\u06ff]")
# atributos con prosa
ATTRS = ("placeholder", "aria-label", "title", "alt", "data-hecho", "data-manual",
         "data-texto", "data-cargando", "data-vacio", "data-ok", "data-fallo")
META_PROSA = re.compile(r'(?:name|property)="(?:description|og:title|og:description|'
                        r'twitter:title|twitter:description|og:image:alt)"')
# claves JSON que nunca se traducen
NO_TRANSLATE_KEYS = {"esquema", "idioma", "revision", "procedencia", "pendiente", "nota", "id", "clase", "modelo",
             "tag", "url", "href", "src", "icono", "estado", "tipo", "orden", "ruta",
             "comando", "fichero", "sha256", "clave", "lang", "codigo", "@context",
             "@type", "operatingSystem", "applicationCategory", "license",
             "codeRepository", "sameAs", "image", "logo", "priceCurrency", "price"}
IDENT = re.compile(r"^[0-9_:.\-/@#?=&%+]+$|^[a-z0-9]+(?:[_:./\-][a-z0-9]+)+$")


def is_translatable(s):
    t = s.strip()
    if not t or not LETTER_RE.search(t):
        return False
    if IDENT.match(t) or t.startswith(("http://", "https://", "/", "./", "#")):
        return False
    return True


def _rewrite_json(obj, f, clave=None):
    if isinstance(obj, dict):
        return {k: (v if k in NO_TRANSLATE_KEYS else _rewrite_json(v, f, k)) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_rewrite_json(v, f, clave) for v in obj]
    if isinstance(obj, str) and is_translatable(obj):
        return f(obj)
    return obj


def _estilo_json(raw):
    """Adivina indentacion y separadores para reescribir igual."""
    m = re.match(r"\s*[\[{]\s*\n(\s+)", raw)
    if m:
        return {"indent": len(m.group(1)) if m.group(1)[0] == " " else m.group(1)}
    sep = (", ", ": ") if re.search(r'",\s"|":\s', raw[:400]) else (",", ":")
    return {"separators": sep}


def rewrite_json(raw, f):
    obj = json.loads(raw)
    nuevo = _rewrite_json(obj, f)
    est = _estilo_json(raw)
    out = json.dumps(nuevo, ensure_ascii=False, **est)
    if raw.endswith("\n") and not out.endswith("\n"):
        out += "\n"
    return out


def _texto(s, f):
    if not is_translatable(s):
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


def rewrite_html(t, f):
    out, i = [], 0
    for m in PIEZA.finditer(t):
        out.append(_texto(t[i:m.start()], f))
        p = m.group(0)
        if p.startswith("<script"):
            mm = re.match(r"(<script\b([^>]*)>)(.*?)(</script>)$", p, re.S)
            abre, attrs, cuerpo, cierra = mm.groups()
            if "application/json" in attrs or "application/ld+json" in attrs:
                cuerpo = rewrite_json(cuerpo, f)
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


def rewrite_js(t, f):
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
            if is_translatable(s) and " " in s.strip():
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


def rewrite_text(t, tipo, f):
    return {"html": rewrite_html, "json": rewrite_json, "js": rewrite_js}[tipo](t, f)


def collect_segments(t, tipo):
    vistos = []
    rewrite_text(t, tipo, lambda s: (vistos.append(s), s)[1])
    return vistos


# ---------------------------------------------------------------- CLI ------
import glob as _glob
import sys as _sys
from pathlib import Path as _Path

PUBLICO = _Path(__file__).resolve().parent / "public"
PAGINAS = ("index", "instalar", "community", "benchmark", "onboarding",
           "playground", "profile")


def language_files(lengua):
    """(ruta relativa, tipo) de todo lo traducible de una lengua."""
    out = [(f"{lengua}/{p}.html", "html") for p in PAGINAS
           if (PUBLICO / lengua / f"{p}.html").is_file()]
    out += [(_Path(f).name, "json") for f in sorted(_glob.glob(str(PUBLICO / f"*-{lengua}.json")))]
    out += [("assets/" + _Path(f).name, "js")
            for f in sorted(_glob.glob(str(PUBLICO / "assets" / f"*-{lengua}.js")))]
    return out


def languages():
    return sorted(d.name for d in PUBLICO.iterdir()
                  if d.is_dir() and len(d.name) == 2 and d.name.isalpha())


def _main(argv):
    if not argv or argv[0] not in ("segmentos", "identidad"):
        print(__doc__)
        return 2
    if argv[0] == "identidad":
        malos = 0
        for l in languages():
            for rel, tipo in language_files(l):
                t = (PUBLICO / rel).read_text(encoding="utf-8")
                if rewrite_text(t, tipo, lambda s: s) != t:
                    malos += 1
                    print("  DIFIERE", rel)
        print(f"  identidad: {'OK' if not malos else str(malos) + ' ficheros difieren'}")
        return 1 if malos else 0
    lengua = argv[1]
    otra = argv[argv.index("--junto") + 1] if "--junto" in argv else None
    import json as _json
    salida = {}
    for rel, tipo in language_files(lengua):
        mios = collect_segments((PUBLICO / rel).read_text(encoding="utf-8"), tipo)
        if otra:
            rel_o = rel.replace(f"{lengua}/", f"{otra}/", 1).replace(f"-{lengua}.", f"-{otra}.")
            f_o = PUBLICO / rel_o
            suyos = collect_segments(f_o.read_text(encoding="utf-8"), tipo) if f_o.is_file() else []
            salida[rel] = [[s, suyos[i] if i < len(suyos) else None] for i, s in enumerate(mios)]
        else:
            salida[rel] = mios
    print(_json.dumps(salida, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    raise SystemExit(_main(_sys.argv[1:]))
