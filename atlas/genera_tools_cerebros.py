"""Tools · pinta los cerebros de chat desde public/cerebros.json dentro de public/index.html.

Decreto 1 (Soberano, 2026-10-28): todos los modelos, con todos sus campos, cada dato MEDIDO o NO_DATA.
- Un campo que el fichero trae con valor se pinta con su valor.
- Un campo a null o ausente se pinta NO_DATA con su causa. Nunca un cero ni un valor inventado.
- Los campos medidos por el nodo (prompt, generacion, carga_s, bytes) llevan MEDIDO y su fecha de medida.
Determinista: misma entrada, misma salida. Sin peticiones, sin enlaces externos.

Uso: python3 atlas/genera_tools_cerebros.py          (reescribe el bloque entre los marcadores)
     python3 atlas/genera_tools_cerebros.py --check  (sale con 1 si el bloque no coincide)
"""
import html
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CEREBROS = RAIZ / "public" / "cerebros.json"
INDEX = RAIZ / "public" / "index.html"
INICIO = "<!-- cerebros:inicio -->"
FIN = "<!-- cerebros:fin -->"

# Campos medidos por el nodo (contrato de cerebros.json: prompt_eval_count/duration y eval_count/duration).
MEDIDOS = {"prompt", "generacion", "carga_s", "bytes"}
FECHA_MEDIDA = "2026-09-07"        # cerebros.json: "medido"
FECHA_TAMANO = "2026-09-23"        # cerebros.json: bytes_nota (medido en /api/tags)

ETIQUETAS = [
    ("recomendado", "Recommended"),
    ("puerta", "On the portal"),
    ("prompt", "Prompt speed (tok/s)"),
    ("generacion", "Generation speed (tok/s)"),
    ("carga_s", "Load time (s)"),
    ("bytes", "Size on disk (GiB)"),
    ("lenguas", "Languages"),
    ("atajos", "Shortcuts"),
    ("pais", "Origin"),
    ("firmado", "Signed"),
]


def valor_de(modelo, campo):
    """Devuelve (texto, marca). marca es MEDIDO, DATO o NO_DATA con causa."""
    if campo not in modelo or modelo[campo] is None:
        return ("NO_DATA", "campo ausente en cerebros.json" if campo not in modelo else "null en cerebros.json")
    v = modelo[campo]
    if campo == "bytes":
        return (f"{v / 2**30:.2f}", "MEDIDO " + FECHA_TAMANO)
    if campo in MEDIDOS:
        return (f"{v}", "MEDIDO " + FECHA_MEDIDA)
    if isinstance(v, bool):
        return ("yes" if v else "no", "DATO")
    if isinstance(v, list):
        return (", ".join(str(x) for x in v), "DATO")
    return (str(v), "DATO")


def bloque(d):
    partes = [INICIO, '<div class="cerebros">']
    partes.append(
        f'<p class="note">Chat brains the web can ask the rack for. Speeds, load time and size are measured on the node '
        f'(context {d.get("contexto", "NO_DATA")}, backend {html.escape(str(d.get("backend", "NO_DATA")))}, '
        f'{d.get("muestras", "NO_DATA")} sample). Source: public/cerebros.json.</p>'
    )
    for c in d["cerebros"]:
        mid = html.escape(c.get("id", "NO_DATA"))
        modelo = html.escape(c.get("modelo", "NO_DATA"))
        partes.append(f'<article class="cerebro" id="cerebro-{mid}">')
        partes.append(f"<h4>{mid} · <code>{modelo}</code></h4>")
        partes.append("<dl>")
        for campo, etiqueta in ETIQUETAS:
            texto, marca = valor_de(c, campo)
            partes.append(
                f"<dt>{html.escape(etiqueta)}</dt><dd>{html.escape(texto)} "
                f'<span class="muted">[{html.escape(marca)}]</span></dd>'
            )
        partes.append("</dl>")
        partes.append(f"<pre><code>ollama pull {modelo}</code></pre>")
        partes.append("</article>")
    partes.append("</div>")
    partes.append(FIN)
    return "\n".join(partes)


def aplica(texto_index, nuevo):
    patron = re.compile(re.escape(INICIO) + r".*?" + re.escape(FIN), re.S)
    if len(patron.findall(texto_index)) != 1:
        raise SystemExit("NO_DATA · index.html debe tener exactamente un bloque de cerebros entre marcadores")
    return patron.sub(lambda _m: nuevo, texto_index)


def main(argv):
    d = json.loads(CEREBROS.read_text(encoding="utf-8"))
    actual = INDEX.read_text(encoding="utf-8")
    nuevo = aplica(actual, bloque(d))
    if "--check" in argv:
        if nuevo != actual:
            print("RED · el bloque de cerebros de index.html no coincide con cerebros.json")
            return 1
        print("VERDE · bloque de cerebros al dia")
        return 0
    INDEX.write_text(nuevo, encoding="utf-8")
    print("escrito: bloque de cerebros en public/index.html")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
