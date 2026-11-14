#!/usr/bin/env python3
"""icons_from_emblem.py · favicon, PWA icons and social card, generated from the emblem.

    python3 bin/icons_from_emblem.py              # says what would change, touches nothing
    python3 bin/icons_from_emblem.py --escribir   # writes the files
    python3 bin/icons_from_emblem.py --comprobar  # exits 1 if what is published is not what this generates

WHY. Signature F2-8 (Sovereign, 2026-10-10) set the rule that still holds: these files are never
painted by hand, one generator makes all of them from one source, and what is published must be
exactly what the generator produces. Until 2026-11-11 the source was the wave of the site emblem.

Order of the Sovereign, 2026-11-11: the emblem is the face of the preceptor, in dots. The source
is now atlas/emblem/preceptor_face.txt, an ASCII drawing with ten levels of ink (" .:-=+*#%@").
Each character becomes one dot whose size is its level; the lit eye takes the violet of the house (the canon bust has a violet eye).
No font is used, so the result does not depend on the machine: same Pillow, same bytes.
"""
import argparse
import hashlib
import io
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
A = RAIZ / "public" / "assets"
FUENTE = RAIZ / "atlas" / "emblem" / "preceptor_face.txt"
RAMPA = " .:-=+*#%@"
FONDO = (0x1E, 0x18, 0x26)          # background_color of the manifest
TONO = (0xF2, 0xF5, 0xF7)            # the ink of the hub
OJO = (0xB5, 0x81, 0xE9)             # the lit eye: violet, the bright band of FIRMADO (hue 270) in semantic_table.js
CARA = (15, 1, 67, 39)               # columns and rows of the head alone, for the small mark


def rejilla():
    """The drawing as rows of ink levels 0..1. A character outside the ramp is an error, not a guess."""
    filas = FUENTE.read_text(encoding="ascii").split("\n")
    while filas and not filas[-1]:
        filas.pop()
    ancho = max(len(f) for f in filas)
    for f in filas:
        raros = set(f) - set(RAMPA)
        if raros:
            raise ValueError("character outside the ramp: %r" % sorted(raros))
    return [[RAMPA.index(c) / 9 for c in f.ljust(ancho)] for f in filas]


def ojo(g):
    """The lit eye: the brightest 5x3 window in the upper right quarter of the face."""
    mejor, donde = -1.0, (0, 0)
    for y in range(len(g) // 5, len(g) // 2):
        for x in range(len(g[0]) // 2, len(g[0]) * 3 // 4):
            s = sum(g[y + j][x + i] for j in range(3) for i in range(5))
            if s > mejor:
                mejor, donde = s, (x + 2, y + 1)
    return donde


def lienzo(g, ancho, alto, frac, recorte=None):
    """Draws at 4x and reduces. A character cell is twice as tall as wide, as in a terminal."""
    from PIL import Image, ImageDraw
    ex, ey = ojo(g)
    if recorte:
        x0, y0, x1, y1 = recorte
        g = [f[x0:x1] for f in g[y0:y1]]
        ex, ey = ex - x0, ey - y0
    cols, filas, s = len(g[0]), len(g), 4
    cw = min(ancho * frac / cols, alto * frac / (filas * 2))
    ch = cw * 2
    ox, oy = (ancho - cols * cw) / 2, (alto - filas * ch) / 2
    im = Image.new("RGB", (ancho * s, alto * s), FONDO)
    d = ImageDraw.Draw(im)
    for y, fila in enumerate(g):
        for x, v in enumerate(fila):
            if not v:
                continue
            cerca = ((x - ex) ** 2 + ((y - ey) * 2) ** 2) ** 0.5 <= 3.2
            r = cw * 0.5 * (0.35 + 0.75 * v) * s
            cx, cy = (ox + (x + 0.5) * cw) * s, (oy + (y + 0.5) * ch) * s
            d.ellipse([cx - r, cy - r * 1.6, cx + r, cy + r * 1.6], fill=OJO if cerca else TONO)
    return im.resize((ancho, alto), Image.LANCZOS)


def paleta():
    """Sixteen fixed colours: twelve steps from background to ink, four from background to the eye."""
    from PIL import Image
    def paso(a, b, t):
        return [round(a[i] + (b[i] - a[i]) * t) for i in range(3)]
    colores = [paso(FONDO, TONO, i / 11) for i in range(12)] + [paso(FONDO, OJO, i / 4) for i in range(1, 5)]
    pal = Image.new("P", (1, 1))
    pal.putpalette(sum(colores, []) + colores[0] * (256 - len(colores)))
    return pal


def png(g, ancho, alto, frac):
    from PIL import Image
    b = io.BytesIO()
    # A fixed palette without dither keeps the eye violet and makes the file a fifth of its true-colour size.
    lienzo(g, ancho, alto, frac).quantize(palette=paleta(), dither=Image.Dither.NONE).save(b, "PNG", optimize=True)
    return b.getvalue()


def nivel_de(c, niveles=4, alza=0.6):
    """Ink level 0..niveles of a pixel. alza < 1 lifts dark ink; 0.6 was the 28-grid's lift (2026-11-11)."""
    v = max(0.0, (max(c) - 0x26) / (255 - 0x26))
    return round(v ** alza * niveles)


# The small mark, one drawing per scale (2026-11-13, UI-COHERENCE-01). The old single 28-cell grid with four
# lifted levels lit the whole crop evenly: at 16 px each cell was half a pixel and the head read as a block.
# Error against the same head drawn in true tone by lienzo() at the target size (mean |difference|, 0..255):
# old 22.7 at 16 px and 31.7 at 32 px; 16 grid 6.0 at 16 px; 32 grid 5.8 at 32 px. One SVG carries both
# grids; its own CSS shows the 16 grid when the image is drawn 24 px wide or less (the browser tab), and the
# 32 grid otherwise (the 48 px header mark, large tabs). A renderer without CSS media support shows the 32 grid.
ESCALAS = ((16, 8, 1.0, "p"), (32, 8, 0.85, "g"))


def rejilla_svg(g, n, niveles, alza):
    """One <path> per tone: runs of equal ink in a row become «Mx yhwv1h-wz». Fewer bytes than one rect per run."""
    from PIL import Image
    im = lienzo(g, n * 8, n * 8, 1.0, CARA).resize((n, n), Image.LANCZOS)
    px, tonos = im.load(), {}
    for y in range(n):
        x = 0
        while x < n:
            c = px[x, y]
            clave = (c[2] - c[1] > 40, nivel_de(c, niveles, alza))
            x1 = x + 1
            while x1 < n and (px[x1, y][2] - px[x1, y][1] > 40, nivel_de(px[x1, y], niveles, alza)) == clave:
                x1 += 1
            if clave[1] > 0:
                tonos.setdefault(clave, []).append("M%d %dh%dv1h-%dz" % (x, y, x1 - x, x1 - x))
            x = x1
    return ['<path fill="%s" fill-opacity="%s" d="%s"/>' % ("#b581e9" if violeta else "#f2f5f7",
            ("%.3f" % (nivel / niveles)).rstrip("0").rstrip("."), "".join(d))
            for (violeta, nivel), d in sorted(tonos.items())]


def svg(g):
    """The small mark: the head alone, a 16 grid for the tab and a 32 grid for everything larger."""
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="PreceptorOS">',
           "<title>PreceptorOS</title>",
           "<!-- Generated by bin/icons_from_emblem.py from atlas/emblem/preceptor_face.txt. Not edited by hand. -->",
           "<style>.p{display:none}@media (max-width:24px){.p{display:inline}.g{display:none}}</style>",
           '<rect width="32" height="32" rx="7" fill="#1e1826"/>']
    for n, niveles, alza, clase in ESCALAS:
        # Each grid fills the whole tile, so one cell is exactly one pixel at 16 px (16 grid) and 32 px (32 grid).
        out.append('<g class="%s"%s>' % (clase, "" if n == 32 else ' transform="scale(%g)"' % (32 / n)))
        out.extend(rejilla_svg(g, n, niveles, alza))
        out.append("</g>")
    return "\n".join(out) + "\n</svg>\n"


def ficheros():
    g = rejilla()
    return {
        "mark.svg": svg(g).encode("utf-8"),
        "icon-192.png": png(g, 192, 192, 0.86),
        "icon-512.png": png(g, 512, 512, 0.86),
        # maskable: Android crops to a circle of radius 0.40 * side; the drawing stays inside it.
        "icon-512-maskable.png": png(g, 512, 512, 0.62),
        "og-card.png": png(g, 1200, 630, 0.90),
    }


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("--escribir", action="store_true")
    ap.add_argument("--comprobar", action="store_true")
    a = ap.parse_args(argv)
    distintos = []
    for nombre, datos in ficheros().items():
        ruta = A / nombre
        igual = ruta.is_file() and ruta.read_bytes() == datos
        if not igual:
            distintos.append(nombre)
        print("%-28s %7d B  %s  %s" % (nombre, len(datos), hashlib.sha256(datos).hexdigest()[:12],
                                      "IGUAL" if igual else "CAMBIA"))
        if a.escribir and not igual:
            ruta.write_bytes(datos)
    if a.comprobar:
        return 1 if distintos else 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
