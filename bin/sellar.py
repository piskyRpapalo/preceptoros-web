#!/usr/bin/env python3
"""sellar.py · sube la VERSION del worker y vuelve a sellar la huella.

    python3 bin/sellar.py            # dice que pasaria, no toca nada
    python3 bin/sellar.py --sellar   # sube VERSION y escribe la huella

POR QUE EXISTE. La regla es buena y el test la defiende: si cambia un byte
bajo `public/` y no sube `VERSION` en `sw.js`, el cambio NO llega a quien ya
visito el sitio -- y no avisa nadie. Eso ya costo un despliegue entero el
2026-09-13, diagnosticado como «un boton sin rotulo» cuando era la cache.

Lo que NO es bueno es hacer los dos pasos a mano, en orden, cada vez. Un paso
manual que hay que repetir es un paso que un dia se olvida, y el dia que se
olvide el sintoma sera otra vez «el cambio esta en el servidor y la pagina
hace lo viejo».

QUE NO SE PIERDE. La invariante que el gate defiende sigue intacta: aqui los
dos valores se escriben JUNTOS o no se escribe ninguno. Lo que este fichero
quita no es la comprobacion, es la transcripcion a mano de un sha256 -- que
es exactamente la clase de cosa que el canon de esta casa manda no hacer
(«material criptografico se copia-pega directo, nunca se transcribe»).

EN SECO POR DEFECTO. Sellar es un acto de despliegue: decide que lo que hay
en el disco es lo que va a ver la gente. Eso se pide con una palabra.
"""
from __future__ import annotations

import argparse
import hashlib
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PUBLICO = RAIZ / "public"
SELLO = RAIZ / "config" / "sw-huella.txt"


def huella():
    """sha256 (16 hex) de todo lo publicado MENOS `sw.js`.

    Mismo calculo que `test_web.py`, y a proposito: si los dos divergen, el
    sello mentiria en verde. Se ordena la lista porque el orden del sistema de
    ficheros no es estable entre maquinas.
    """
    h = hashlib.sha256()
    for q in sorted(PUBLICO.rglob("*")):
        if q.is_file() and q.name != "sw.js":
            h.update(q.relative_to(PUBLICO).as_posix().encode())
            h.update(q.read_bytes())
    return h.hexdigest()[:16]


def siguiente(v):
    """`preceptoros-2026-13-p` -> `-q`. Si no acaba en letra, PARA.

    No se inventa un formato nuevo: la version la eligio una persona y este
    script solo continua la serie que ya existe. Un sufijo que no reconoce es
    un caso que no entiende, y lo dice en vez de suponer.
    """
    m = re.match(r"^(.*-)([a-y])$", v)
    if not m:
        raise SystemExit(f"NO_DATA · no se como continuar la version {v!r}. "
                         "Se esperaba que acabara en `-<letra>`. Subela a mano.")
    return m.group(1) + chr(ord(m.group(2)) + 1)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--sellar", action="store_true",
                    help="escribe de verdad; sin esto solo informa")
    ap.add_argument("--version", help="fijar una version concreta en vez de "
                                      "continuar la serie")
    a = ap.parse_args()

    sw = PUBLICO / "sw.js"
    texto = sw.read_text(encoding="utf-8")
    m = re.search(r"const VERSION = '([^']+)'", texto)
    if not m:
        raise SystemExit("NO_DATA · `sw.js` no declara VERSION")
    vieja, real = m.group(1), huella()

    sello = dict(l.split("=", 1) for l in SELLO.read_text(encoding="utf-8")
                 .splitlines() if "=" in l and not l.startswith("#"))

    if sello.get("huella") == real and sello.get("version") == vieja:
        print(f"NADA QUE SELLAR · lo publicado no ha cambiado desde {vieja}")
        return 0

    nueva = a.version or siguiente(vieja)
    print(f"version   {vieja}  ->  {nueva}")
    print(f"huella    {sello.get('huella')}  ->  (se recalcula al escribir)")
    if not a.sellar:
        print("\nSECO · nada escrito. Repite con --sellar cuando sea el momento.")
        return 0

    sw.write_text(texto.replace(f"const VERSION = '{vieja}'",
                                f"const VERSION = '{nueva}'", 1), encoding="utf-8")
    # La huella se calcula DESPUES de escribir `sw.js` por si algun dia deja de
    # estar excluido: hoy no entra en el calculo, pero el orden correcto no
    # cuesta nada y no depende de que esa exclusion siga siendo cierta.
    final = huella()
    cabecera = [l for l in SELLO.read_text(encoding="utf-8").splitlines()
                if l.startswith("#") or not l.strip()]
    SELLO.write_text("\n".join(cabecera) + f"\nhuella={final}\nversion={nueva}\n",
                     encoding="utf-8")
    print(f"\nSELLADO · version={nueva} huella={final}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
