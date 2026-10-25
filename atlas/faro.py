"""El FARO: lo servido en preceptoros.org (apex, canonico) contra public/ de main.

El gate mira cada PR, el vigia mira el estado de main cada manana; el faro
mira la luz que llega de verdad al visitante. Compara byte a byte cada
fichero de public/ contra el sitio vivo. Determinista, sin LLM, solo
biblioteca estandar.

Codigos de salida: 0 = todo LIVE; 1 = deriva (falta o difiere algo): el
rojo es la alarma, no un fallo del script; 2 = NO_DATA o error de red, con
causa impresa.
"""

import hashlib
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

SITIO = "https://preceptoros.org/"  # canonico desde 2026-10-25; www 301 -> apex (worker/index.js)
RAIZ = Path(__file__).resolve().parent.parent / "public"
TIEMPO_FUERA = 15
AGENTE = "preceptoros-faro/1.0"
SONDA_BYTES = 96
SONDA_DIVERGENCIA = 160


def rutas_locales():
    return sorted(
        p.relative_to(RAIZ).as_posix() for p in RAIZ.rglob("*") if p.is_file()
    )


def traer(ruta):
    """Devuelve (estado, cuerpo, url_final). estado: 'ok', 'falta' o 'error'."""
    url = SITIO if ruta == "index.html" else SITIO + ruta
    pedido = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    try:
        with urllib.request.urlopen(pedido, timeout=TIEMPO_FUERA) as r:
            return "ok", r.read(), r.geturl()
    except urllib.error.HTTPError:
        return "falta", b"", url
    except Exception as e:
        return "error", str(e).encode("utf-8", "replace"), url


def sonda(ruta, cuerpo, local, url_final):
    """Evidencia de una ruta DISTINTA: que recibio de verdad el runner."""
    solo_newlines = cuerpo.replace(b"\r\n", b"\n") == local.replace(b"\r\n", b"\n")
    print("  SONDA " + ruta)
    print("    servido: %d B sha256:%s" % (len(cuerpo), hashlib.sha256(cuerpo).hexdigest()))
    print("    local:   %d B sha256:%s" % (len(local), hashlib.sha256(local).hexdigest()))
    print("    url_final: " + url_final)
    print("    solo_newlines_diff: " + ("SI" if solo_newlines else "NO"))
    titulo = re.search(rb"<title[^>]*>(.*?)</title>", cuerpo, re.S)
    print("    titulo_servido: " + (titulo.group(1).decode("utf-8", "replace") if titulo else "NO_DATA"))
    print("    inicio_servido: " + repr(cuerpo[:SONDA_BYTES]))
    i = 0
    lim = min(len(cuerpo), len(local))
    while i < lim and cuerpo[i] == local[i]:
        i += 1
    print("    offset_divergencia: %d" % i)
    print("    divergencia_servido: " + repr(cuerpo[i:i + SONDA_DIVERGENCIA]))


def main():
    rutas = rutas_locales()
    if not rutas:
        print("NO_DATA, causa: no hay ficheros bajo public/")
        return 2
    iguales, distintos, ausentes, errores = [], [], [], []
    for ruta in rutas:
        estado, cuerpo, url_final = traer(ruta)
        if estado == "error":
            errores.append((ruta, cuerpo.decode("utf-8", "replace")))
            continue
        local = (RAIZ / ruta).read_bytes()
        if estado == "falta":
            ausentes.append(ruta)
        elif hashlib.sha256(cuerpo).hexdigest() == hashlib.sha256(local).hexdigest():
            iguales.append(ruta)
        else:
            distintos.append((ruta, cuerpo, local, url_final))
    print("ficheros comparados: %d" % len(rutas))
    print("LIVE iguales: %d" % len(iguales))
    print("DRIFT distintos: %d" % len(distintos))
    print("DRIFT ausentes: %d" % len(ausentes))
    print("ERRORES de red: %d" % len(errores))
    for r in distintos:
        print("  DISTINTO " + r[0])
    for r in ausentes:
        print("  AUSENTE " + r)
    for r, motivo in errores:
        print("  ERROR " + r + " · " + motivo)
    for r, cuerpo, local, url_final in distintos:
        sonda(r, cuerpo, local, url_final)
    if errores:
        return 2
    return 1 if (distintos or ausentes) else 0


if __name__ == "__main__":
    sys.exit(main())
