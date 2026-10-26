"""Escribe las DOS paginas de entrada de preceptoros.org desde una plantilla: la portada y el juego.

    python3 local_first_surface_build.py            reescribe public/index.html y public/play/index.html
    python3 local_first_surface_build.py --comprueba  sale con 1 si alguna no es la que dice la plantilla

POR QUE (decreto de recencia del Soberano + canon P1, 2026-10-25). Hasta MVP todo en INGLES, y la
entrada muestra solo lo construido en los ultimos dias. Antes habia diez portadas (la raiz y nueve
lenguas) que eran la misma pagina inglesa con el juego montado dentro, y todas cargaban las hojas
compartidas de septiembre. Ahora:
  - `/` es UNA portada inglesa: la puerta a lo reciente (el juego, los mundos, la creacion). Carga solo
    su hoja nueva (`assets/landing.css`) y la marca nueva (`assets/mark.svg`); ninguna hoja vieja.
  - `/play/` es el juego, sin tocar su maquinaria: la misma carcasa que era la portada, con sus hojas.
  - `/ar/` ... `/ru/` responden 301 a `/` desde el Worker (`worker/index.js`); sus ficheros salen de
    `public/`.
"""
import pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"
ORIGEN = "https://preceptoros.org"
DESCRIPCION = ("theGame: a game of waves that runs on your own device. No account, no cloud, "
               "no tracking. Build your undersea city, summon wave troops, conquer the reef.")


def cabeza(titulo, url, hojas, color):
    return f"""<!doctype html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{titulo}</title>
<meta name="description" content="{DESCRIPCION}">
<link rel="icon" type="image/svg+xml" href="/assets/mark.svg">
<link rel="canonical" href="{url}">
<meta property="og:title" content="PreceptorOS · theGame">
<meta property="og:description" content="{DESCRIPCION}">
<meta property="og:url" content="{url}">
<meta property="og:type" content="website">
<meta property="og:image" content="{ORIGEN}/assets/og-card.png">
<link rel="manifest" href="/manifest.webmanifest">
<meta name="theme-color" content="{color}">
""" + "".join(f'<link rel="stylesheet" href="{h}">\n' for h in hojas) + "</head>\n"


def portada():
    return cabeza("PreceptorOS", f"{ORIGEN}/", ["/assets/landing.css"], "#17131F") + """<body>
<a class="skip" href="#doors">Skip to the doors</a>
<main>
<img class="mark" src="/assets/mark.svg" alt="" width="48" height="48">
<h1>PreceptorOS</h1>
<p class="lead">A game of waves that runs on your own device. No account, no cloud, no tracking.</p>
<nav id="doors" aria-label="Doors">
<a class="door" href="/play/"><b>Play theGame</b><span>Your undersea city, the map and the reef. Sound included.</span></a>
<a class="door" href="/face/"><b>Worlds</b><span>Three node pages: Atlantis, the Risen and Neutral.</span></a>
<a class="door" href="/creation.html"><b>Creation studio</b><span>Draw a ribbon, sign it with your web identity, carry it as a file.</span></a>
</nav>
<section id="web-app" aria-labelledby="web-app-h">
<h2 id="web-app-h">The web or the app?</h2>
<div class="pair">
<p class="side" data-lado="web"><b>The web</b><span>The public door: the map and the game, right here in your browser. Nothing to install.</span></p>
<p class="side" data-lado="app"><b>The app</b><span>Your own node, on your own machine: local memory and a local AI that stay with you.</span></p>
</div>
<details class="tech"><summary>Technical details</summary><p>The web loads with zero external requests and keeps your key in this browser. Local memory and local inference are the app's own claims, stated in <a href="https://github.com/piskyRpapalo/PreceptorOS/blob/main/README.md">its README</a>.</p></details>
</section>
<p class="note">One language until the MVP: English. The old translated addresses lead here.</p>
</main>
<script src="/game/tabla_semantica.js"></script>
<script src="/game/comic_tokens.js"></script>
<script src="/game/comic_accents.js"></script>
<script src="/game/comic_atoms.js"></script>
<script src="/game/bubble_language.js"></script>
<script src="/game/bubble_letters.js"></script>
<script src="/assets/landing_doors.js"></script>
<script src="/assets/pwa.js"></script>
</body>
</html>
"""


def juego():
    hojas = ["/assets/base.css", "/assets/canon.css", "/assets/soberano.css", "/assets/consiento.css",
             "/assets/eaa-art12-local-first-surface.css"]
    return cabeza("theGame · PreceptorOS", f"{ORIGEN}/play/", hojas, "#17131F") + """<body class="portada-juego">
<a class="skip-link" href="#juego-panel">Skip to the game panel</a>
<header class="cab-juego">
<a class="cab-marca" href="/">PreceptorOS · <b>theGame</b></a>
<a class="cab-mundos" href="/face/">Worlds</a>
<a class="cab-mundos" href="/creation.html">Creation</a>
<div id="identity" class="fila identity"></div>
</header>
<main id="juego-panel" class="juego-panel" aria-label="theGame"><h1 class="cab-h1">theGame</h1>
<p class="juego-carga">theGame · loading on this device. No account, no cloud.</p>
<noscript><p class="juego-carga">theGame needs JavaScript: it runs entirely on this device.</p></noscript>
</main>
<script src="/assets/auth.js"></script>
<script src="/assets/consiento.js"></script>
<script src="/assets/enviar-en.js"></script>
<script src="/assets/enviar.js"></script>
<script src="/assets/pwa.js"></script>
<script src="/assets/page-comment.js" defer></script>
<script src="/assets/thegame.js"></script>
<script src="/assets/eaa-art12-local-first-surface.js"></script>
</body>
</html>
"""


def todas():
    yield PUBLICO / "index.html", portada()
    yield PUBLICO / "play" / "index.html", juego()


def main(argv):
    if "--comprueba" in argv:
        malas = [str(p.relative_to(RAIZ)) for p, t in todas()
                 if not p.is_file() or p.read_text(encoding="utf-8") != t]
        print("\n".join(malas) or "las 2 paginas de entrada son la plantilla")
        return 1 if malas else 0
    for p, t in todas():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(t, encoding="utf-8")
    print("2 paginas de entrada escritas")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
