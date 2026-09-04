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
# Los idiomas se DESCUBREN del disco: toda carpeta de dos letras bajo `public/`
# es una traduccion. Estaban escritos a mano en once sitios --`sitemap.py`,
# `contadores.py` y nueve tuplas de `test_web.py`-- y anadir uno obligaba a
# tocarlos todos: bastaba olvidar una para dejar un idioma sin comprobar, que
# es exactamente donde vive un hueco que nadie ve. Firmado 2026-09-04, al
# entrar el portugues.
#
# El castellano es la FUENTE --se escribe ahi primero-- y los demas son
# traducciones suyas. Esa asimetria es la que decide que cuenta como pagina
# nueva y que no.
FUENTE = "es"


def idiomas(publico):
    return tuple(sorted(d.name for d in publico.iterdir()
                        if d.is_dir() and len(d.name) == 2 and d.name.isalpha()))


IDIOMAS = idiomas(PUBLICO)


def paginas_por_idioma():
    """Que paginas tiene CADA idioma, por su nombre de fichero.

    Antes esto devolvia la INTERSECCION: solo las paginas que existian en todos
    los idiomas a la vez. Con tres traducciones completas daba igual, pero al
    entrar la cuarta se convertia en una trampa -- una carpeta con cuatro
    paginas habria borrado del sitemap las otras tres para TODOS los idiomas,
    incluidos los que si las tienen. Un idioma a medio traducir no debe poder
    esconder paginas que existen.

    Ahora cada idioma declara lo suyo, y los `hreflang` de cada pagina apuntan
    solo a los idiomas que de verdad la tienen. Es lo que hace que se pueda
    traducir por partes: la carpeta nueva empieza con la portada y crece, sin
    que nadie pierda nada mientras tanto.
    """
    return {idi: sorted(p.name for p in (PUBLICO / idi).glob("*.html"))
            for idi in IDIOMAS}


def idiomas_de(nombre, mapa):
    """Los idiomas que tienen esa pagina. El orden es el de IDIOMAS."""
    return [idi for idi in IDIOMAS if nombre in mapa[idi]]


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

    mapa = paginas_por_idioma()
    todas = sorted({n for ns in mapa.values() for n in ns})
    for nombre in todas:
        # La portada de idioma se anuncia como directorio (`/es/`), no como
        # `/es/index.html`: son la misma pagina y anunciar las dos es pedirle
        # al buscador que elija cual es la canonica.
        def ruta(idi):
            return "%s/%s/" % (ORIGEN, idi) if nombre == "index.html" \
                else "%s/%s/%s" % (ORIGEN, idi, nombre)
        # Solo los idiomas que TIENEN esta pagina. Anunciar un `hreflang` a una
        # traduccion que no existe manda al buscador a un 404 en el idioma de
        # quien lo pida, que es peor que no ofrecerselo.
        suyos = idiomas_de(nombre, mapa)
        alt = [(idi, ruta(idi)) for idi in suyos]
        if nombre == "index.html":
            alt.append(("x-default", ORIGEN + "/"))
        for idi in suyos:
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
