"""Escribe public/sitemap.xml LEYENDO EL DISCO. Nunca a mano.

POR QUE NO SE ESCRIBE A MANO: un sitemap escrito a mano es una lista de
promesas. En el momento en que alguien renombra una pagina --como paso el
2026-09-02 con `board.html` -> `community.html`-- el fichero sigue anunciando
la vieja y el buscador se come un 404 que nadie ve, porque el sitemap no lo
mira ningun humano nunca. Aqui se DERIVA: si la pagina no esta en el disco, no
sale en el XML.

EL CRITERIO DE PAGINA ES EL MISMO DE SIEMPRE, y esa es la razon de que este
duplicado en tres sitios (test_web.py, contadores.py y aqui): las tres
preguntas son distintas --cuantas hay, cuantas caben, cuales se anuncian-- y
compartir una funcion entre un test y su sujeto es como se fabrica un gate que
se aprueba a si mismo.

LAS ALTERNATIVAS POR IDIOMA VAN DENTRO. Sin `xhtml:link`, tres traducciones son
tres paginas sueltas que compiten entre ellas. Es la misma regla que
`test_las_portadas_declaran_hreflang` exige en el <head>, dicha donde el
buscador la lee primero.
"""
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"
ORIGEN = "https://preceptoros.org"
IDIOMAS = ("es", "en", "fr")


def paginas_por_idioma():
    """Las paginas que existen en LOS TRES idiomas, por su nombre de fichero."""
    comunes = None
    for idi in IDIOMAS:
        aqui = {p.name for p in (PUBLICO / idi).glob("*.html")}
        comunes = aqui if comunes is None else (comunes & aqui)
    return sorted(comunes or [])


def sueltas():
    """HTML de contenido que NO esta traducido: viven en la raiz de public/.

    `index.html` de la raiz entra aparte, con x-default: no es contenido, es el
    selector de idioma, y es la URL que un buscador debe ofrecer a quien no
    coincide con ninguna traduccion.
    """
    return sorted(p.name for p in PUBLICO.glob("*.html")
                  if p.name != "index.html")


def url(loc, alternativas=()):
    filas = ["  <url>", "    <loc>%s</loc>" % loc]
    for hreflang, href in alternativas:
        filas.append('    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>'
                     % (hreflang, href))
    filas.append("  </url>")
    return "\n".join(filas)


def construir():
    bloques = []

    alt_raiz = [(idi, "%s/%s/" % (ORIGEN, idi)) for idi in IDIOMAS]
    alt_raiz.append(("x-default", ORIGEN + "/"))
    bloques.append(url(ORIGEN + "/", alt_raiz))

    for nombre in paginas_por_idioma():
        # La portada de idioma se anuncia como directorio (`/es/`), no como
        # `/es/index.html`: son la misma pagina y anunciar las dos es pedirle
        # al buscador que elija cual es la canonica.
        def ruta(idi):
            return "%s/%s/" % (ORIGEN, idi) if nombre == "index.html" \
                else "%s/%s/%s" % (ORIGEN, idi, nombre)
        alt = [(idi, ruta(idi)) for idi in IDIOMAS]
        if nombre == "index.html":
            alt.append(("x-default", ORIGEN + "/"))
        for idi in IDIOMAS:
            bloques.append(url(ruta(idi), alt))

    for nombre in sueltas():
        bloques.append(url("%s/%s" % (ORIGEN, nombre)))

    return ('<?xml version="1.0" encoding="UTF-8"?>\n'
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
            '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'
            + "\n".join(bloques) + "\n</urlset>\n")


def main():
    xml = construir()
    destino = PUBLICO / "sitemap.xml"
    destino.write_text(xml, encoding="utf-8")
    cuantas = xml.count("<loc>")
    print("sitemap.xml · %d URLs · %d B" % (cuantas, destino.stat().st_size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
