"""Reescribe el bloque `hreflang` de TODAS las portadas LEYENDO EL DISCO.

POR QUE EXISTE. El bloque se escribia a mano, y el portugues lo demostro: la
lengua entro entera --paginas, prompts, sitemap, selector-- y en el <head> de
las otras tres portadas siguio sin existir. Un `hreflang` que falta no rompe
nada visible; simplemente el buscador trata cuatro traducciones como cuatro
paginas sueltas que compiten entre ellas. Nadie lo ve hasta que se mira el
posicionamiento meses despues.

Es el mismo criterio que `sitemap.py`: si la lengua esta en el disco, sale; si
no esta, no sale. Y el mismo que el selector de la rueda, que lee estas mismas
etiquetas en el navegador -- asi que arreglar aqui arregla alli, y una lengua
nueva aparece sola en los dos sitios.

CADA PORTADA SE DECLARA TAMBIEN A SI MISMA, y no es redundancia: un conjunto
`hreflang` sin la etiqueta autorreferente es un conjunto que el buscador
descarta entero, porque no puede comprobar que las paginas se reconozcan unas a
otras. Ademas es lo que permite al selector de la rueda marcar en cual estas.
`test_las_portadas_declaran_hreflang` ya lo exigia; se escribio aqui sin ella y
el gate lo cazó en el acto.

QUE NO HACE: no toca la canonica de cada pagina. Eso es de la pagina.

    python3 hreflang.py          -> reescribe y dice que cambio
    python3 hreflang.py --ver    -> solo dice que cambiaria
"""
import pathlib, re, sys

RAIZ = pathlib.Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"
ORIGEN = "https://preceptoros.org"
MARCA = "<!-- hreflang -->"


def idiomas():
    """Una lengua es un directorio de dos letras con portada dentro."""
    return sorted(d.name for d in PUBLICO.iterdir()
                  if d.is_dir() and len(d.name) == 2 and (d / "index.html").exists())


def bloque(_propio, lenguas):
    lineas = [f'<link rel="alternate" hreflang="{i}" href="{ORIGEN}/{i}/">'
              for i in lenguas]
    lineas.append(f'<link rel="alternate" hreflang="x-default" href="{ORIGEN}/">')
    return MARCA + "\n" + "\n".join(lineas) + "\n" + MARCA


def main():
    ver = "--ver" in sys.argv
    lenguas = idiomas()
    cambios = 0
    for i in lenguas:
        p = PUBLICO / i / "index.html"
        s = p.read_text(encoding="utf-8")
        nuevo = bloque(i, lenguas)
        if MARCA in s:
            s2 = re.sub(re.escape(MARCA) + r".*?" + re.escape(MARCA), nuevo, s, flags=re.S)
        else:
            # Primera vez: se sustituyen las etiquetas sueltas que ya hubiera.
            s2 = re.sub(r'(?:\s*<link rel="alternate" hreflang="[^"]+"[^>]*>)+', "\n" + nuevo, s, count=1)
            if MARCA not in s2:   # no habia ninguna: entra antes de la canonica
                s2 = s.replace('<link rel="canonical"', nuevo + '\n<link rel="canonical"', 1)
        if s2 != s:
            cambios += 1
            print(f"  {i}/index.html")
            if not ver:
                p.write_text(s2, encoding="utf-8")
    print(f"{len(lenguas)} lenguas: {', '.join(lenguas)} · {cambios} portada(s) "
          + ("cambiarian" if ver else "reescritas"))


if __name__ == "__main__":
    main()
