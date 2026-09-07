#!/usr/bin/env python3
"""Genera `public/nav.json` leyendo el bloque i18n de las ocho portadas.

POR QUE EXISTE, Y POR QUE NO EXISTIA. `nav.json` lleva desde el 2026-09-05
diciendo de si mismo `"estado": "DERIVADO"` y `"NO se escriben aqui a mano: se
sacan del bloque i18n de cada portada con nav.py"`. Ese fichero no estaba en el
repo. O sea: un catalogo que declaraba tener un generador y se mantenia a mano,
que es la peor de las dos opciones -- a mano se puede desviar de su fuente, y
encima nadie lo revisa porque el fichero jura que se genera.

Se escribe el generador en vez de corregir la nota, y por el motivo que la nota
daba: los rotulos del cabezal interior tienen que ser LITERALMENTE la misma
palabra que los de la portada. Con dos sitios y ninguna maquina en medio, la
respuesta a «por que aqui pone INICIO y alli Portada» es siempre la misma: se
cambio uno.

Uso:
    python3 nav.py         reescribe public/nav.json
    python3 nav.py --ver   dice que cambiaria, sin tocar nada
"""
import json
import re
import sys
from pathlib import Path

PUBLICO = Path(__file__).resolve().parent / "public"

# La izquierda es la clave en `nav.json`; la derecha, la del bloque i18n de la
# portada. Se declara el par y no se deduce del nombre: son dos vocabularios de
# dos epocas y adivinar uno desde el otro es como se cuelan los huecos.
CLAVES = {
    "home": "cabHome",
    "benchmark": "cabBenchmark",
    "comunidad": "cabComunidad",
    "instala": "cabInstala",
    "idioma": "cabIdioma",
    "solar": "cabSolar",
    "ajustes": "ajustes",
}
# `casa` es el nombre accesible del icono de inicio y NO tiene par en la
# portada: alli la casa es la palabra «INICIO» y aqui es un dibujo, asi que su
# rotulo solo vive para el lector de pantalla. Se conserva lo que ya hubiera.
SOLO_AQUI = ("casa",)


def lenguas():
    """Una lengua es un directorio de dos letras con `index.html` dentro.

    Se descubre del disco, no de una lista: es la misma regla que ya usan
    `hreflang.py` y el selector de la rueda, y la que hizo que el portugues
    dejara de quedarse fuera en silencio.
    """
    for d in sorted(PUBLICO.iterdir()):
        if d.is_dir() and len(d.name) == 2 and (d / "index.html").is_file():
            yield d.name


def i18n(lang):
    t = (PUBLICO / lang / "index.html").read_text(encoding="utf-8")
    m = re.search(r'<script type="application/json" id="i18n">(.*?)</script>', t, re.S)
    if not m:
        raise SystemExit(f"{lang}: la portada no tiene bloque i18n")
    return json.loads(m.group(1))


def construir(viejo):
    textos = {}
    huecos = []
    antes = viejo.get("textos", {})
    for lang in lenguas():
        d = i18n(lang)
        fila = {}
        for destino, origen in CLAVES.items():
            v = d.get(origen)
            if v is None:
                huecos.append(f"{lang}.{origen}")
                continue
            fila[destino] = v
        for k in SOLO_AQUI:
            v = antes.get(lang, {}).get(k)
            if v is not None:
                fila[k] = v
            else:
                huecos.append(f"{lang}.{k} (solo vive aqui: se escribe a mano)")
        textos[lang] = fila
    return textos, huecos


def main():
    ver = "--ver" in sys.argv
    destino = PUBLICO / "nav.json"
    viejo = json.loads(destino.read_text(encoding="utf-8"))
    textos, huecos = construir(viejo)

    nuevo = dict(viejo)
    nuevo["nota"] = (
        "Los rotulos del cabezal, para las paginas que no llevan bloque i18n "
        "propio -- `instalar.html` es la que obliga: sus textos viven en "
        "`/instalar.json`. NO se escriben aqui a mano: los saca `nav.py` del "
        "bloque i18n de cada portada, para que la palabra sea LITERALMENTE la "
        "misma arriba y abajo. Antes cada pagina llevaba su propia lista y con "
        "otros nombres --«Portada» donde el cabezal decia «INICIO»--, y ocho "
        "lenguas por seis paginas son 48 sitios donde acordarse."
    )
    nuevo["generado_por"] = "nav.py"
    nuevo["textos"] = textos

    if huecos:
        print("HUECOS:", ", ".join(huecos))
    if ver:
        igual = json.dumps(viejo, ensure_ascii=False, sort_keys=True) == \
                json.dumps(nuevo, ensure_ascii=False, sort_keys=True)
        print("sin cambios" if igual else "nav.json cambiaria")
        return
    destino.write_text(json.dumps(nuevo, ensure_ascii=False, indent=1) + "\n",
                       encoding="utf-8")
    print(f"nav.json · {len(textos)} lenguas · {destino.stat().st_size} B")


if __name__ == "__main__":
    main()
