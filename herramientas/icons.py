#!/usr/bin/env python3
"""Genera los seis iconos de la web desde el busto del icono.

EL ARTE ES `busto-icono.png`, recortado del icono anterior y con el blanco
pasado a transparente. Se escala con NEAREST y no con LANCZOS: es pixel art,
y LANCZOS le promedia los bordes hasta dejarlo turbio -- la misma leccion que
ya costo las tiras de la cara.

POR QUE EXISTE. Los iconos estaban compuestos a mano y se veia: en el maskable
el busto ocupaba un tercio del lienzo y el rotulo flotaba en el centro, asi que
el lanzador de Android --que recorta el maskable-- enseñaba una cara diminuta
perdida en blanco. Y los dos juegos estaban CRUZADOS: `icon-app-512.png` decia
«web». Un guion que los rehace evita las dos cosas: la composicion deja de
depender de la mano y el rotulo sale del nombre del fichero.

LA CARA ES EL ICONO. Ocupa casi todo el alto y deja un respiro, porque una app
que llena el lienzo de borde a borde se ve apretada al lado de las demas.

EL ROTULO ES UNA PEGATINA. Va abajo a la izquierda y se sale del lienzo por su
parte inferior --alrededor de un sexto de su alto-- para que parezca pegado
encima y no dibujado dentro. En el maskable NO se sale: ahi el lanzador recorta,
y lo que se salga desaparece.
"""
import pathlib
from PIL import Image, ImageDraw, ImageFont

AQUI = pathlib.Path(__file__).resolve().parent.parent / "public" / "assets"
CARA = AQUI / "caras" / "busto-icono.png"
FUENTE = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

FONDO = (10, 8, 18)          # el negro de la casa, no un negro puro
PILDORA = (38, 23, 137)      # --indigo fijo: el mismo de la nube de la portada
TINTA = (242, 208, 138)      # --oro. Sobre indigo mide 9,04:1

def compon(rotulo, lado, maskable):
    im = Image.new("RGBA", (lado, lado), FONDO + (255,))
    cara = Image.open(CARA).convert("RGBA")

    # El maskable se recorta a un circulo, y el gate lo comprueba de verdad. Un
    # cuadrado centrado solo cabe en un circulo del 80 % si su lado no pasa del
    # 56 %; la cara tiene esquinas transparentes, asi que el 62 % entra. La cifra
    # sale de la geometria, no del gusto.
    alto = int(lado * (0.62 if maskable else 0.88))
    esc = alto / cara.height
    cara = cara.resize((max(1, int(cara.width * esc)), alto), Image.NEAREST)
    im.alpha_composite(cara, ((lado - cara.width) // 2, (lado - alto) // 2))

    # La pegatina.
    d = ImageDraw.Draw(im)
    cuerpo = max(11, int(lado * 0.115))
    f = ImageFont.truetype(FUENTE, cuerpo)
    izq, arr, der, aba = d.textbbox((0, 0), rotulo, font=f)
    tw, th = der - izq, aba - arr
    pad_x, pad_y = int(cuerpo * 0.55), int(cuerpo * 0.34)
    pw, ph = tw + pad_x * 2, th + pad_y * 2

    if maskable:
        # DENTRO DEL CIRCULO, y la posicion se calcula en vez de tantearla: la
        # esquina mas lejana de la pildora tiene que caber en el radio seguro
        # (40 % del lado). Centrada en x, se despeja cuanto puede bajar. Se
        # tanteo primero a ojo y el gate la caza dos veces: la geometria es mas
        # barata que el tanteo.
        import math
        x = (lado - pw) // 2
        radio = 0.40 * lado - lado * 0.015
        dy = math.sqrt(max(0.0, radio ** 2 - (pw / 2) ** 2))
        y = int(lado / 2 + dy) - ph
    else:
        # Pegada abajo a la izquierda y saliendose por abajo un sexto de su
        # alto: asi parece puesta encima y no dibujada dentro.
        x = int(lado * 0.07)
        y = lado - ph + int(ph * 0.17)
    r = ph // 2
    d.rounded_rectangle([x, y, x + pw, y + ph], radius=r, fill=PILDORA + (255,),
                        outline=TINTA + (255,), width=max(2, lado // 190))
    d.text((x + pad_x - izq, y + pad_y - arr), rotulo, font=f, fill=TINTA + (255,))
    # PALETA DE 256 COLORES, y no es tacañeria: el gate pone techo a lo que
    # suman los iconos del manifiesto --256 KB-- porque un PNG de un mega se
    # cuela sin que nadie lo mire. A 24 bits estos sumaban 477 KB. La cara es
    # marmol y violeta: en paleta no pierde nada visible y baja a un tercio.
    return im.convert("RGB").quantize(colors=256, method=Image.MAXCOVERAGE)

def main():
    for clave, rotulo in (("app", "app"), ("pwa", "web")):
        for lado in (192, 512):
            compon(rotulo, lado, False).save(AQUI / f"icon-{clave}-{lado}.png", optimize=True)
        compon(rotulo, 512, True).save(AQUI / f"icon-{clave}-512-maskable.png", optimize=True)
    print("seis iconos regenerados desde", CARA.name)

if __name__ == "__main__":
    main()
