"""Escribe las 10 portadas de preceptoros.org desde UNA plantilla: la portada ES el juego.

    python3 local_first_surface_build.py            reescribe public/index.html y public/<lengua>/index.html
    python3 local_first_surface_build.py --comprueba  sale con 1 si alguna portada no es la que dice la plantilla

POR QUE (mudanza firmada 2026-10-11, bloque 1; plan por capas 2026-10-05, C1). La portada era el hub
(33 guiones, chat, cara, torre) con el juego encima en una capa. Ahora es cabezal + UN panel, y el
juego se monta dentro. Una sola plantilla para las diez: no pueden divergir. Solo carga lo que el
juego necesita, MEDIDO (propuestas/mudanza-20261011/pide.js): Identity (auth.js), el canal (enviar,
consiento, page-comment), la PWA (pwa.js) y el juego (thegame.js); y tres hojas: base, canon (R-WIDGET: contraste legible a pleno sol en el Doogee) y soberano.
El bloque hreflang conserva sus marcas: `hreflang.py` lo sigue reescribiendo desde el disco.
"""
import pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"
ORIGEN = "https://preceptoros.org"
LENGUAS = ["ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"]
RTL = {"ar"}
NOMBRE = {"ar": "العربية", "de": "Deutsch", "el": "Ελληνικά", "en": "English", "es": "Español",
          "fr": "Français", "it": "Italiano", "pt": "Português", "ru": "Русский"}
DESCRIPCION = ("theGame: a game of waves that runs on your own device. No account, no cloud, "
               "no tracking. Build your undersea city, summon wave troops, conquer the reef.")


def hreflang():
    filas = [f'<link rel="alternate" hreflang="{l}" href="{ORIGEN}/{l}/">' for l in LENGUAS]
    filas.append(f'<link rel="alternate" hreflang="x-default" href="{ORIGEN}/">')
    return "<!-- hreflang -->\n" + "\n".join(filas) + "\n<!-- hreflang -->"


def portada(l, raiz=False):
    url = f"{ORIGEN}/" if raiz else f"{ORIGEN}/{l}/"
    lenguas = "".join(f'<a href="/{x}/" hreflang="{x}" lang="{x}"' + (' aria-current="page"' if x == l and not raiz else "")
                      + f">{x.upper()}</a>" for x in LENGUAS)
    return f"""<!doctype html>
<html lang="{l}" dir="{'rtl' if l in RTL else 'ltr'}" data-tema="oscuro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PreceptorOS · theGame</title>
<meta name="description" content="{DESCRIPCION}">
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg">
<link rel="canonical" href="{url}">
<meta property="og:title" content="PreceptorOS · theGame">
<meta property="og:description" content="{DESCRIPCION}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:image" content="{ORIGEN}/assets/preceptor-og.png">
{hreflang()}
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="#17131F">
<link rel="stylesheet" href="/assets/base.css">
<link rel="stylesheet" href="/assets/canon.css">
<link rel="stylesheet" href="/assets/soberano.css">
<link rel="stylesheet" href="/assets/consiento.css">
<link rel="stylesheet" href="/assets/eaa-art12-local-first-surface.css">
</head>
<body class="portada-juego">
<header class="cab-juego">
<a class="cab-marca" href="/{l}/">PreceptorOS · <b>theGame</b></a>
<nav class="cab-lenguas" aria-label="Language · {NOMBRE[l]}">{lenguas}</nav>
</header>
<main id="juego-panel" class="juego-panel" aria-label="theGame">
<p class="juego-carga">theGame · loading on this device. No account, no cloud.</p>
<noscript><p class="juego-carga">theGame needs JavaScript: it runs entirely on this device.</p></noscript>
</main>
<script src="/assets/auth.js"></script>
<script src="/assets/consiento.js"></script>
<script src="/assets/enviar-{l}.js"></script>
<script src="/assets/enviar.js"></script>
<script src="/assets/pwa.js"></script>
<script src="/assets/page-comment.js" defer></script>
<script src="/assets/thegame.js"></script>
<script src="/assets/eaa-art12-local-first-surface.js"></script>
</body>
</html>
"""


def todas():
    yield PUBLICO / "index.html", portada("en", raiz=True)
    for l in LENGUAS:
        yield PUBLICO / l / "index.html", portada(l)


def main(argv):
    if "--comprueba" in argv:
        malas = [str(p.relative_to(RAIZ)) for p, t in todas() if p.read_text(encoding="utf-8") != t]
        print("\n".join(malas) or "las 10 portadas son la plantilla")
        return 1 if malas else 0
    for p, t in todas():
        p.write_text(t, encoding="utf-8")
    print("10 portadas escritas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
