"""Alarma del faro: una lectura roja se escribe en buzon#30, donde la Mesa la lee.

Solo lee la salida que el faro ya imprime (conteos, DISTINTO, AUSENTE, ERROR). No
recalcula nada: el faro decide, esto solo lo lleva al tablero de la Mesa.

Uso (lo llama .github/workflows/faro.yml solo si el faro sale distinto de 0):
    python3 atlas/faro_alarma.py --texto faro.txt --rc 1 --run <url de la ejecucion>

Sin GH_TOKEN no envia nada y lo dice: NO_DATA con su causa. El rojo del faro
sigue siendo el rojo del paso; esto no lo tapa ni lo cambia.
"""
import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

DESTINO = "piskyRpapalo/buzon"
ISSUE = "30"
TOPE = 3500  # bytes; la alarma es un aviso, no el informe completo


def cuerpo(texto, rc, run):
    lineas = texto.splitlines()
    cabecera = [l for l in lineas if l.startswith(("ficheros comparados", "LIVE iguales", "DRIFT ", "ERRORES de red"))]
    detalle = [l.strip() for l in lineas if l.startswith(("  DISTINTO ", "  AUSENTE ", "  ERROR "))]
    causa = "NO_DATA · el faro no llego a comparar" if rc == 2 and not detalle else (
        "deriva: lo servido difiere de public/ de main" if rc == 1 else "error de red o de medida")
    partes = [
        "ALARMA DEL FARO · lectura roja · " + causa,
        "",
        f"Ejecucion: {run}",
        f"Codigo de salida: {rc}",
        "",
        "```",
        *cabecera,
        *detalle,
        "```",
        "",
        "Propuesto desde el faro. Sin decision humana no hay accion; la lectura es del faro, no de este aviso.",
    ]
    texto_out = "\n".join(partes)
    while len(texto_out.encode("utf-8")) > TOPE and len(partes) > 8:
        partes.pop(-3)
        texto_out = "\n".join(partes) + "\n[truncado: el resto esta en la ejecucion]"
    return texto_out


def main(argv=None):
    p = argparse.ArgumentParser()
    p.add_argument("--texto", required=True)
    p.add_argument("--rc", type=int, required=True)
    p.add_argument("--run", required=True)
    a = p.parse_args(argv)
    body = cuerpo(Path(a.texto).read_text(encoding="utf-8", errors="replace"), a.rc, a.run)
    if not os.environ.get("GH_TOKEN"):
        print("ALARMA NO ENVIADA · causa: falta el secreto BUZON_TOKEN en este repositorio (NO_DATA)")
        return 0
    with tempfile.NamedTemporaryFile("w", suffix=".md", delete=False, encoding="utf-8") as f:
        f.write(body)
        ruta = f.name
    r = subprocess.run(["gh", "issue", "comment", ISSUE, "-R", DESTINO, "--body-file", ruta],
                       capture_output=True, text=True)
    os.unlink(ruta)
    if r.returncode != 0:
        print("ALARMA NO ENVIADA · gh salio con " + str(r.returncode) + ": " + r.stderr.strip()[:300])
        return 0
    print("ALARMA ENVIADA · " + r.stdout.strip())
    return 0


if __name__ == "__main__":
    sys.exit(main())
