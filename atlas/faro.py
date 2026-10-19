"""El FARO: lo servido en www.preceptoros.org contra public/ de main.

El gate mira cada PR, el vigia mira el estado de main cada manana; el faro
mira la luz que llega de verdad al visitante. Compara byte a byte cada
fichero de public/ contra el sitio vivo. Determinista, sin LLM, solo
biblioteca estandar.

Codigos de salida: 0 = todo LIVE; 1 = deriva (falta o difiere algo): el
rojo es la alarma, no un fallo del script; 2 = NO_DATA o error de red, con
causa impresa.
"""

import hashlib
import sys
import urllib.error
import urllib.request
from pathlib import Path

SITIO = "https://www.preceptoros.org/"
RAIZ = Path(__file__).resolve().parent.parent / "public"
TIEMPO_FUERA = 15
AGENTE = "preceptoros-faro/1.0"


def rutas_locales():
    return sorted(
        p.relative_to(RAIZ).as_posix() for p in RAIZ.rglob("*") if p.is_file()
    )


def traer(ruta):
    """Devuelve (estado, cuerpo). estado: 'ok', 'falta' o 'error'."""
    url = SITIO if ruta == "index.html" else SITIO + ruta
    pedido = urllib.request.Request(url, headers={"User-Agent": AGENTE})
    try:
        with urllib.request.urlopen(pedido, timeout=TIEMPO_FUERA) as r:
            return "ok", r.read()
    except urllib.error.HTTPError:
        return "falta", b""
    except Exception as e:
        return "error", str(e).encode("utf-8", "replace")


def main():
    rutas = rutas_locales()
    if not rutas:
        print("NO_DATA, causa: no hay ficheros bajo public/")
        return 2
    iguales, distintos, ausentes, errores = [], [], [], []
    for ruta in rutas:
        estado, cuerpo = traer(ruta)
        if estado == "error":
            errores.append((ruta, cuerpo.decode("utf-8", "replace")))
            continue
        local = (RAIZ / ruta).read_bytes()
        if estado == "falta":
            ausentes.append(ruta)
        elif hashlib.sha256(cuerpo).hexdigest() == hashlib.sha256(local).hexdigest():
            iguales.append(ruta)
        else:
            distintos.append(ruta)
    print("ficheros comparados: %d" % len(rutas))
    print("LIVE iguales: %d" % len(iguales))
    print("DRIFT distintos: %d" % len(distintos))
    print("DRIFT ausentes: %d" % len(ausentes))
    print("ERRORES de red: %d" % len(errores))
    for r in distintos:
        print("  DISTINTO " + r)
    for r in ausentes:
        print("  AUSENTE " + r)
    for r, motivo in errores:
        print("  ERROR " + r + " · " + motivo)
    if errores:
        return 2
    return 1 if (distintos or ausentes) else 0


if __name__ == "__main__":
    sys.exit(main())
