#!/usr/bin/env python3
"""iconos_desde_emblema.py · favicon, iconos PWA y tarjeta social, generados desde el emblema.

    python3 bin/iconos_desde_emblema.py              # dice que cambiaria, no toca nada
    python3 bin/iconos_desde_emblema.py --escribir   # escribe los ficheros
    python3 bin/iconos_desde_emblema.py --comprobar  # sale 1 si lo publicado no es lo que genera

POR QUE (firma F2-8 del Soberano, 2026-10-10). La identidad es «ondas sobre fondo oscuro,
ninguna imagen». Un navegador sigue necesitando favicon, iconos para instalar y una tarjeta
para los chats: siguen existiendo, pero CAMBIA SU ORIGEN. Ya no son arte pintado: son la onda
del emblema del sitio (la tropa de sha256('atlas.emblema/1:preceptoros.org') en tc3), la misma
que dibuja el retrato del guia en atlas-dialogo.js. Una fuente, todas las caras.

El espectro se pide al motor (public/game/gacha.js), no se copia: si el motor cambia, el icono
cambia con el. Determinista: misma version de Pillow, mismos bytes.
"""
import argparse
import hashlib
import io
import math
import pathlib
import subprocess
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
A = RAIZ / "public" / "assets"
SEMILLA = "atlas.emblema/1:preceptoros.org"
FONDO = (0x17, 0x13, 0x1F)          # theme_color del manifiesto
TONO = (172, 191, 204)               # hsl(205 30% 74%): TONOS[3], el caracter del emblema


def espectro():
    js = ("const c=require('crypto'),G=require('./public/game/gacha.js');"
          "const s=c.createHash('sha256').update(%r).digest('hex');"
          "process.stdout.write(JSON.stringify(G.tirada(s,'tc3').armonicos))" % SEMILLA)
    r = subprocess.run(["node", "-e", js], cwd=RAIZ, capture_output=True, text=True, check=True)
    import json
    return json.loads(r.stdout)


def puntos(arm, n=240):
    out = []
    for i in range(n + 1):
        u = i / n * 2 * math.pi
        x = y = 0.0
        for k, ax, ay, f in arm:
            g = k * u + f * math.pi / 32
            x += ax * math.cos(g)
            y += ay * math.sin(g)
        out.append((x, y))
    return out


def radio(pts):
    return max(math.hypot(x, y) for x, y in pts)


def svg(arm):
    p = puntos(arm, 120)
    e = 13.0 / radio(p)
    d = "M" + " L".join("%.2f %.2f" % (16 + x * e, 16 + y * e) for x, y in p) + "Z"
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" role="img" aria-label="PreceptorOS">\n'
            "<title>PreceptorOS</title>\n"
            "<!-- Generado por bin/iconos_desde_emblema.py: la onda del emblema del sitio. No se edita a mano. -->\n"
            '<rect width="32" height="32" rx="7" fill="#17131f"/>\n'
            '<path d="%s" fill="none" stroke="#acbfcc" stroke-width="1.6" stroke-linejoin="round"/>\n'
            "</svg>\n" % d)


def png(arm, ancho, alto, frac, grosor):
    """Dibuja a 4x y reduce: borde suave sin depender del antialias de la libreria."""
    from PIL import Image, ImageDraw
    s = 4
    im = Image.new("RGB", (ancho * s, alto * s), FONDO)
    g = ImageDraw.Draw(im)
    p = puntos(arm)
    e = frac * min(ancho, alto) * s / radio(p)
    cx, cy = ancho * s / 2, alto * s / 2
    g.line([(cx + x * e, cy + y * e) for x, y in p], fill=TONO, width=max(1, int(grosor * s)), joint="curve")
    im = im.resize((ancho, alto), Image.LANCZOS)
    b = io.BytesIO()
    im.save(b, "PNG", optimize=True)
    return b.getvalue()


def ficheros():
    arm = espectro()
    return {
        "favicon.svg": svg(arm).encode("utf-8"),
        "icon-pwa-192.png": png(arm, 192, 192, 0.40, 6),
        "icon-pwa-512.png": png(arm, 512, 512, 0.40, 14),
        # maskable: Android recorta a un circulo de radio 0,40*lado; el dibujo va a 0,30 (con su trazo).
        "icon-pwa-512-maskable.png": png(arm, 512, 512, 0.30, 12),
        "preceptor-og.png": png(arm, 1200, 630, 0.40, 10),
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
