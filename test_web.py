#!/usr/bin/env python3
"""Verificacion de doctrina de preceptoros.org. Biblioteca estandar, nada mas.

    python3 test_web.py

Cada prueba comprueba UNA regla del canon y falla diciendo por que. Una
comprobacion que detecta y no bloquea no es una comprobacion: aqui no hay avisos,
solo verde o rojo.
"""
import gzip
import hashlib, html, json, re, subprocess, sys, unittest
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from urllib.error import HTTPError
from urllib.request import urlopen

RAIZ = Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"


def sin_comentarios(texto):
    """Fuera los comentarios ANTES de mirar si una regla existe.

    Cicatriz del 2026-09-03: un bloque explicaba por escrito que el rail ya
    no usa `position:static`, y la prueba leia esa frase del comentario como
    si fuera la regla. Una comprobacion que se cree lo que dice la prosa no
    esta comprobando el codigo: esta leyendo.
    """
    return re.sub(r"/\*.*?\*/", "", texto, flags=re.S)


def maqueta_de_la_portada():
    """El CSS que la portada CARGA, en su orden y sin comentarios.

    Se DESCUBRE, no se enumera. Los guardianes de maqueta nombraban sus
    hojas a mano (`widget + panel + chat + cara`) y el 2026-09-05 cuatro
    ficheros se partieron por el tope: las reglas se mudaron a `puertas.css`
    y a `placa.css` y el gate se puso rojo por buscar donde ya no estaban, no
    porque faltara nada. Leyendo las etiquetas de la propia portada, la
    proxima particion no rompe nada -- que es la misma leccion que ya
    aprendieron las lenguas y el `hreflang`.
    """
    portada = (PUBLICO / "es" / "index.html").read_text(encoding="utf-8")
    return "".join(
        sin_comentarios((PUBLICO / h.lstrip("/")).read_text(encoding="utf-8"))
        for h in re.findall(r'<link rel="stylesheet" href="([^"]+)"', portada))

def guion_de_la_portada():
    """El JS que la portada CARGA, concatenado y en su orden.

    Gemelo de `maqueta_de_la_portada`, y nace por la misma cicatriz y en el
    mismo sitio: esta prueba leia `hub.js` por su nombre, el 2026-09-07 el
    cabezal se mudo a `cabezal.js` --hub.js iba por 14.708 B y montaba dos
    cosas que no son la misma-- y el gate se puso rojo por buscar donde ya no
    estaba, no porque faltara nada. Es la sexta vez con esta forma.

    Leyendo lo que la portada CARGA, la proxima particion no rompe nada.
    """
    portada = (PUBLICO / "es" / "index.html").read_text(encoding="utf-8")
    return "".join(
        (PUBLICO / s.lstrip("/")).read_text(encoding="utf-8")
        for s in re.findall(r'<script src="([^"]+)"', portada))


ORIGEN_PROPIO = "https://preceptoros.org"
ENLACES_ADMITIDOS = ("https://github.com/piskyRpapalo/PreceptorOS",
                     # 2026-09-24: download LINKS of the Tools media panels. A link
                     # the visitor clicks is not a subresource: nothing is fetched
                     # on load. herr-medios.js only renders them; the gate checks
                     # it never fetches them (test_los_medios_no_se_piden_al_cargar).
                     "https://huggingface.co/",
                     "https://ollama.com/library/",
                     "https://raw.githubusercontent.com/piskyRpapalo/PreceptorOS",
                     # Nuestro PROPIO origen canonico. Lo que esta regla protege
                     # es «cero peticiones externas al cargar», y las metas de
                     # Open Graph no son un subrecurso: no las pide el navegador
                     # de quien visita, las lee un raspador cuando alguien pega
                     # el enlace en un chat. Ademas, og:image y og:url EXIGEN
                     # URL absoluta por especificacion -- una relativa la
                     # ignoran Slack, LinkedIn y X. Prohibir aqui el propio
                     # dominio no protegeria a nadie: dejaria la web sin
                     # tarjeta social y sin canonica.
                     ORIGEN_PROPIO,
                     # El unico tunel publico del Agora, firmado en el ANEXO
                     # WEB. Es nuestro origen igual que preceptoros.org, solo
                     # que en otro subdominio. Se admite como ENLACE, no como
                     # subrecurso: `test_la_api_no_se_pide_al_cargar` de mas
                     # abajo comprueba que ninguna pagina la pide sola.
                     "https://api.preceptoros.org",
                     # LinkedIn del Soberano. Igual que github.com: es un
                     # ENLACE de identidad publica, no un subrecurso -- no
                     # pide nada hasta que alguien lo pulsa. Sale de
                     # Alejandria/identidad_publica.json, que es la fuente.
                     "https://www.linkedin.com/in/",
                     # El `@context` del JSON-LD. Es el caso MAS claro de esta
                     # lista y por eso entra sin amnistia: schema.org no es ni
                     # subrecurso ni enlace, es un IDENTIFICADOR de vocabulario.
                     # Nadie lo dereferencia -- ni el navegador de quien visita,
                     # ni el raspador que lee el bloque: la especificacion de
                     # JSON-LD dice que se compara como cadena. Cero peticiones,
                     # que es exactamente lo que esta regla protege.
                     "https://schema.org")

# UN ESPACIO DE NOMBRES XML NO ES UNA DIRECCION. `xmlns="http://www.sitemaps.
# org/..."` parece una URL y no lo es: es un IDENTIFICADOR. Ningun cliente lo
# pide nunca -- ni el navegador, ni el raspador, ni el buscador -- y escribirlo
# en https no solo no ayuda, es que rompe el documento: el espacio de nombres
# se compara por cadena exacta contra el que fija la especificacion, asi que
# cambiarle el esquema lo convierte en OTRO espacio de nombres.
#
# Va aparte de ENLACES_ADMITIDOS a proposito, y no dentro. Aquella tupla dice
# «a estos sitios SI se puede enlazar»; esta dice «esto ni siquiera es un
# enlace». Fundirlas haria que manana alguien creyera que se puede enlazar a
# w3.org desde una pagina.
ESQUEMAS_XML = ("http://www.sitemaps.org/schemas/",
                "http://www.w3.org/1999/xhtml",
                # El espacio de nombres SVG (2026-09-25): `createElementNS` lo
                # exige para construir el retrato de ATLAS nodo a nodo sin
                # innerHTML. Es un NOMBRE, como el de XHTML de arriba; nadie
                # lo pide por la red.
                "http://www.w3.org/2000/svg",
                # `$schema` de JSON Schema entra aqui y no en ENLACES_ADMITIDOS
                # por el mismo motivo que los otros dos: es el NOMBRE de un
                # dialecto, no una direccion que nadie va a pedir. El validador
                # lo reconoce por la cadena y no descarga nada. Entro el
                # 2026-09-06 con `data/loratelier_schema.json`.
                "https://json-schema.org/draft/")

FRAMEWORKS = r"\breact\b|vue\.js|angular|htmx|alpine\.js|jquery|svelte|tailwind"

# Los ficheros de licencia se excluyen POR SU NOMBRE, a proposito. Llevan dentro
# urls de apache.org y creativecommons.org, y son texto legal literal que no se
# toca ni se recorta. Ya quedaban fuera antes, pero por accidente —no tienen
# sufijo—, y una regla que se cumple por casualidad se rompe el dia que alguien
# renombre el fichero a LICENSE.txt.
LICENCIAS = {"LICENSE", "LICENSE-PROSE"}
# EL TOPE POR FICHERO · 16 KiB, firmado el 2026-09-05. Antes eran 10, puestos a
# mano. Este numero sale de una cuenta, y la cuenta se escribe aqui para que la
# proxima revision discuta con datos y no con gusto.
#
# 1 · EL TOPE DE 10 KB NUNCA FUE UN LIMITE DE RED, y eso era lo que parecia.
#     Medido sobre los 77 ficheros que esta regla vigila: se comprimen 2,43x de
#     media (458.360 B en disco -> 188.656 B con gzip -9). Un fichero de 10.240 B
#     viaja como ~4.214 B. La ventana inicial de congestion son ~14 KB --diez
#     paquetes de ~1.460-- asi que el tope viejo gastaba menos de un TERCIO de
#     lo que cabe en el primer viaje de ida y vuelta. Sobraba red por todas
#     partes; lo que faltaba era sitio para escribir.
#
# 2 · LO QUE EL TOPE SI ACOTA es cuanto se puede razonar por escrito. Medido:
#     el 43 % de un fichero de este arbol es prosa, porque aqui los comentarios
#     SON la documentacion. A 10.240 B eso deja ~5.850 B de codigo util; en
#     cuanto una pieza pide 6,5 KB, lo que se recorta es el razonamiento. Paso
#     de verdad: en la sesion del 2026-09-05 se limaron comentarios propios seis
#     veces seguidas para volver bajo el tope, que es exactamente lo que la
#     doctrina de «se parte, no se recorta» viene a impedir.
#
# 3 · EL NUMERO NUEVO. Se reparte la ventana inicial y se le da a un fichero la
#     MITAD --varios se piden en paralelo y comparten ese primer vuelo--:
#     7 KB en el cable. A 2,43x eso son 17,4 KB en disco. Se redondea a la baja
#     al binario limpio: 16 KiB. Comprobado al reves, 16.384 B viajan como
#     ~6.743 B, el 48 % de un solo viaje. La promesa de rendimiento se mantiene.
#
# 4 · ENTRA SIN AMNISTIA Y SIN DEUDA, igual que cuando la regla se extendio a
#     `.json` el 2026-08-31: el mayor fichero de hoy son 10.237 B, asi que
#     ninguno estrena el tope ya gastado. Y `sw.js` gana 6,1 KB, que a ~22 B por
#     linea de precache son sitio para ~270 ficheros mas: la razon por la que un
#     `capas.css` no cabia el 2026-09-05 deja de existir.
#
# 5 · REVOCADO EL 2026-10-11 por el Soberano (firma D2 del plan de ronda): el tope de 16 KiB por fichero
#     deja de existir. La ley nueva es 25 MiB por bloque sintetico, y solo sube por excepcion firmada en
#     EXCEPCIONES.md. La vara de rendimiento ya no es el byte: son los fps MEDIDOS en el Doogee
#     (ideas6oct:785) y la puerta del juego, gzip_juego_b < 153.600 B, que sigue intacta en world.py.
TOPE_FICHERO = 25 * 1024 * 1024


def textos():
    """Todo fichero de texto del repo, con su ruta. .git fuera."""
    for p in sorted(RAIZ.rglob("*")):
        if not p.is_file() or ".git" in p.parts or "historial" in p.parts:
            continue
        if ".pytest_cache" in p.parts or "__pycache__" in p.parts:
            continue
        if p.name in LICENCIAS:
            continue
        # .mjs entro el 2026-08-30. `sw_harness.mjs` llevaba una hora en el
        # repo sin que NINGUNA prueba de doctrina lo mirase: ni frameworks, ni
        # urls externas, ni rutas absolutas. Un sufijo que no esta en esta
        # tupla es un punto ciego del gate, y un punto ciego no avisa de que
        # existe -- se descubre cuando ya ha pasado algo por el.
        if p.suffix.lower() in (".html", ".css", ".js", ".mjs", ".json",
                                ".jsonc", ".txt", ".py", ".md"):
            yield p, p.read_text(encoding="utf-8")


# Los idiomas se DESCUBREN del disco: toda carpeta de dos letras bajo `public/`
# es una traduccion. Estaban escritos a mano en once sitios --`sitemap.py`,
# `counters.py` y nueve tuplas de `test_web.py`-- y anadir uno obligaba a
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


def _idiomas():
    return idiomas(PUBLICO)


IDIOMAS = _idiomas()
# Canon ingles hasta MVP (2026-10-25): las carpetas de lengua salieron de public/ (301 a `/`), asi
# que IDIOMAS --las PORTADAS de lengua-- queda vacio a proposito. La maquinaria que sigue viva (los
# textos de envio, la pagina sin red, las familias `atlas-<l>.json`) se mide contra las lenguas que
# esa maquinaria LLEVA en disco, no contra las portadas: si no, sus pruebas pasarian en vacio.
LENGUAS_DATOS = tuple(sorted(f.stem.split("-", 1)[1] for f in PUBLICO.glob("atlas-??.json")))


def texto_del_worker():
    """El worker ENTERO, como texto: `sw.js` mas lo que trae por importScripts.

    El 2026-09-19 las listas de que se cachea salieron a `sw-listas.js` porque
    `sw.js` se quedo a 266 B del tope. Las pruebas que buscan un asset en el
    precache tienen que mirar las DOS piezas: buscar solo en `sw.js` daria
    «no lo cachea» sobre algo que si se cachea, y es un rojo mentiroso.

    Las que comprueban LOGICA --- `paginaSinRed`, el filtro de origen --- siguen
    leyendo `sw.js` a secas, porque la logica no se movio.
    """
    partes = [(PUBLICO / "sw.js").read_text(encoding="utf-8")]
    listas = PUBLICO / "sw-listas.js"
    if listas.is_file():
        partes.append(listas.read_text(encoding="utf-8"))
    return "\n".join(partes)
TRADUCCIONES = {PUBLICO / i for i in IDIOMAS if i != FUENTE}


# CLAVES QUE YA NO VIVEN EN EL BLOQUE i18n DE LA PORTADA, y donde viven ahora.
# No es una amnistia: `test_las_claves_mudadas_estan_donde_dicen_estar` las
# comprueba en su casa nueva y en las ocho lenguas. Se mudan por sitio --el
# bloque de `el/index.html` llego a dejar 279 B libres de los 16 KB del tope--
# y siempre a un fichero POR LENGUA, para que una visita siga descargando su
# idioma y nada mas.
FUERA_DEL_BLOQUE = {"agentes": "agentes-{lengua}.json"}
# Y LOS DIECINUEVE DEL MOTOR, desde el 2026-09-20. El Soberano mando la
# descarga del modelo del LorAtelier a la PORTADA --- «eso ya no corresponde
# ahi» ---, y es donde tenia que estar: el piso 1 de la Torre promete «pon el
# aparato en modo avion y sigue hablando» y no habia forma de bajar el modelo
# que lo hace posible desde la pagina que lo promete.
#
# No caben en el bloque: medido, `public/el/index.html` deja 107 bytes libres
# de 16.384 y `ru` 539, y las traducciones pesan ~1.150 y ~1.020. Van a
# `motor-<lengua>.json`, la misma solucion que el killswitch esa manana ---
# segunda vez en el dia que el tope decide donde vive un rotulo.
# UNA SOLA LISTA. Hasta el 2026-09-22 estas claves estaban escritas DOS veces
# --aqui y en `CLAVES_MOTOR`, 4.900 lineas mas abajo--, y al añadir las de la
# cola se actualizo una y se olvido la otra: el gate cayo en rojo señalando la
# que faltaba. Dos copias de la misma verdad no son redundancia, son dos
# oportunidades de que discrepen. `CLAVES_MOTOR` se deriva de esta.
CLAVES_MOTOR_LISTA = ('arrancando', 'avisoCifra', 'avisoRed', 'bajando', 'bajarNavegador', 'causaError', 'causaSinAdaptador', 'causaSinApi', 'descargar', 'falloDescarga', 'falloNavegador', 'listoLocal', 'mirandoGpu', 'mirandoNavegador', 'navBajado', 'navListo', 'navPesa', 'navYaEsta', 'usarNavegador',
    # La cola del rack (2026-09-22): las pinta `cola.js`, que se carga tarde
    # desde `rack.js` y por eso no puede traer su bloque en la portada.
    'colaPos', 'colaEspera', 'colaCasi', 'colaFrio', 'colaSwap', 'colaLlena',
    'colaTecho', 'colaMedida',
    # La ficha del cerebro y el piso que habla (2026-09-22): los pintan
    # `ficha-cerebro.js` y `piso-chat.js`, en la ventana de descarga y encima
    # del chat. Frases de verdad, que el guardian de castellano suelto no deja
    # vivir dentro de un guion.
    'fichaNav', 'fichaRack', 'fichaTec', 'fichaBaja', 'fichaVez', 'fichaVram', 'fichaVel', 'fichaAqui', 'pisoLlevaNav', 'pisoLlevaRack', 'pisoBajaPrimero')
FUERA_DEL_BLOQUE.update({k: "motor-{lengua}.json" for k in CLAVES_MOTOR_LISTA})


def paginas_de_contenido():
    """Paginas de CONTENIDO unico.

    Criterio fijado en el commit 1 y usado igual por counters.py: la raiz es
    ruteo (3 KB de selector, sin contenido) y en/ y fr/ son traducciones de es/,
    no paginas nuevas. Si este criterio cambia, cambia en los dos sitios — o el
    test dara verde sobre una regla que ya no es la del proyecto.
    """
    return sorted(p for p in PUBLICO.rglob("*.html")
                  if p.parent not in TRADUCCIONES
                  and p != PUBLICO / "index.html")


# Nodo web (2026-11-01, retirados/brain/RETIRO.md): el runtime del cerebro se baja SOLO tras el consentimiento y cada
# byte va fijado por SHA-256 en public/models/web-node/manifest.json. No es primera carga ni texto de la casa: las
# guardas de primera carga y de rutas lo exentan por esa lista exacta, no por carpeta (DECRETO-TECHO-NUEVO-20261101).
def _a_demanda():
    m = PUBLICO / "models" / "web-node" / "manifest.json"
    if not m.is_file():
        return set()
    d = json.loads(m.read_text(encoding="utf-8"))
    return {(PUBLICO / e["name"].lstrip("/")).resolve() for e in d.get("runtime", []) + d.get("chunks", [])}
A_DEMANDA = _a_demanda()


class JuegoRetirado(unittest.TestCase):
    """Norte 7 D (decision D2): el juego de /play/ se retiro con su pagina. Esta guarda sustituye a las
    pruebas que leian ese juego (mismo patron que mapa_viejo_desmontado): que no vuelva a aparecer."""

    FICHEROS = ("play/index.html", "assets/thegame.js", "assets/thegame.css", "assets/atlas-motor.js",
                "game/ui-arena.js", "game/semiotic_glyph.js", "assets/soberano.css", "assets/canon.css",
                "assets/page-comment.js", "assets/eaa-art12-local-first-surface.js",
                "atlas-en.json", "atlas-arena-en.json")

    def test_ningun_fichero_retirado_existe(self):
        vivos = [f for f in self.FICHEROS if (PUBLICO / f).exists()]
        self.assertEqual(vivos, [], "vuelven ficheros del juego retirado")

    def test_el_worker_no_los_precachea(self):
        sw = texto_del_worker()
        for f in self.FICHEROS:
            with self.subTest(fichero=f):
                self.assertNotIn("'/" + f + "'", sw, f"el worker sigue precacheando /{f}")

    def test_el_enlace_de_la_portada_no_apunta_a_play(self):
        t = (PUBLICO / "index.html").read_text(encoding="utf-8")
        self.assertNotIn('href="/play/"', t, "la portada enlaza al juego retirado")


class Estructura(unittest.TestCase):

    def test_maximo_ocho_paginas(self):
        # Amnistia firmada por el Soberano el 2026-08-29: de 5 a 7. El Agora
        # necesita board y benchmark, y el perfil publico vendra despues. El
        # limite sigue existiendo porque una web que crece sin techo deja de
        # poder leerse entera, que es lo que este numero protege.
        #
        # SEGUNDA AMNISTIA, firmada por el Soberano el 2026-09-02: de 7 a 8.
        # La octava es `profile.html`, el perfil que la anterior ya anunciaba.
        # El motivo por el que necesita URL PROPIA y no una seccion dentro de
        # `community.html` -- que era la alternativa barata, y se descarto -- es
        # que un perfil existe para ENSENARSE: se pega en una red social, y
        # una URL que abre el marketplace y hace scroll hasta un bloque no es
        # la pagina de nadie. Meterlo dentro habria ahorrado un numero y
        # roto la unica funcion del perfil.
        #
        # Lo que NO cambia: cada pagina nueva se paga con este numero, y
        # subirlo exige firma. La novena no entra sola.
        # TERCERA AMNISTIA, firmada por el Soberano el 2026-09-04: de 8 a 9.
        # La novena es `manifiesto.html`, la pantalla que recibe a quien llega
        # por primera vez. Necesita URL PROPIA por la misma razon que el
        # perfil: se enlaza desde la app y desde fuera, y una URL que abre la
        # portada y hace scroll hasta un bloque no es la pagina de nadie.
        #
        # Wave Army face commissioned in buzon #30 ·6489884378: ten content pages.
        paginas = paginas_de_contenido()
        self.assertLessEqual(len(paginas), 10,
            "more than 10 content pages: " + ", ".join(p.name for p in paginas))

    def test_la_tarjeta_social_apunta_a_algo_que_existe(self):
        """og:image, og:url y el favicon, comprobados contra el disco.

        Una tarjeta social se rompe en silencio: la pagina sigue funcionando y
        el hueco gris solo lo ve quien pega el enlace en un chat. Por eso se
        comprueba aqui y no «cuando alguien avise».
        """
        favicon = PUBLICO / "assets" / "mark.svg"
        self.assertTrue(favicon.is_file(), "no existe assets/mark.svg")

        con_tarjeta = 0
        for p in PUBLICO.rglob("*.html"):
            t = p.read_text(encoding="utf-8")
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                self.assertIn('rel="icon"', t, "pagina sin favicon")
            if "og:title" not in t:
                continue
            con_tarjeta += 1
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                img = re.search(r'og:image" content="([^"]+)"', t)
                self.assertIsNotNone(img, "og:title sin og:image")
                ruta = img.group(1)
                self.assertTrue(ruta.startswith(ORIGEN_PROPIO),
                                f"og:image debe ser absoluta y propia: {ruta}")
                local = PUBLICO / ruta[len(ORIGEN_PROPIO):].lstrip("/")
                self.assertTrue(local.is_file(),
                                f"og:image apunta a un fichero que no existe: {local.name}")
                url = re.search(r'og:url" content="([^"]+)"', t)
                self.assertIsNotNone(url, "og:title sin og:url")
                self.assertTrue(url.group(1).startswith(ORIGEN_PROPIO),
                                "og:url no apunta al origen propio")
        self.assertGreaterEqual(con_tarjeta, 4,
                                "muy pocas paginas con tarjeta social")

    def test_counters_no_se_queda_atras_de_este_mismo_gate(self):
        """La puerta trasera que dejo pasar 19 cuando el gate ya media 25.

        El test de arriba compara la PORTADA contra counters.json. Los dos
        pueden estar rancios a la vez, y entonces coinciden: verde. Fue
        exactamente lo que paso -- las tres portadas anunciaron 19 pruebas
        durante seis commits mientras el gate subia a 25, y ninguna
        comprobacion se entero, porque ninguna volvia a MEDIR.

        Esta si mide, y mide lo unico que puede medir sin salir del repo ni
        tocar la red: cuantas pruebas tiene este fichero. Si alguien añade
        una y no refresca los contadores, el gate se cae aqui mismo, en el
        commit que la añade, y no seis commits despues en produccion.

        La cifra de la app sigue viniendo del repo del MVP: eso no se puede
        remedir desde aqui, y fingir que si lo seria peor que declararlo.
        """
        import os, sys
        from unittest import TestLoader
        # Cuando quien corre el gate es el propio medidor, esta comparacion se
        # calla: seria juez y parte. La bandera la pone `coherencia-publica.py`
        # y solo mientras mide; el resto del tiempo esta prueba manda.
        if os.environ.get("P0X_MIDIENDO_CONTADORES") == "1":
            self.skipTest("lo esta midiendo coherencia-publica.py ahora mismo")
        propias = TestLoader().loadTestsFromModule(
            sys.modules[__name__]).countTestCases()

        datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
        por_clave = {m["clave"]: m for m in datos["metricas"]}
        m = por_clave.get("pruebas_web")
        self.assertIsNotNone(m, "counters.json no declara pruebas_web")
        if m["estado"] != "MEDIDO":
            self.skipTest("pruebas_web salio NO_DATA: no hay con que comparar")
        self.assertEqual(
            m["valor"], propias,
            f"counters.json dice {m['valor']} pruebas web y este fichero "
            f"tiene {propias}. La cifra esta publicada en tres portadas. "
            "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")

    def test_counters_tiene_dos_duenos_y_ninguno_pisa_al_otro(self):
        """Dos guiones escriben este fichero. Ninguno puede borrar al otro.

        `counters.py` (aqui) mide el sitio; `p0x/bin/coherencia-publica.py`
        mide los dos gates y escribe `pruebas_app` y `pruebas_web`. Aquel
        funde por clave desde siempre; este reescribia `metricas` entero, asi
        que correrlo borraba las dos cifras de pruebas y el gate se ponia en
        rojo senalando su propio remedio. Paso el 2026-09-01.

        El cerrojo `O_EXCL` de `counters.py` no protege de esto: cubre dos
        copias A LA VEZ, y esto ocurria corriendo uno DESPUES del otro. Son
        dos averias distintas y hacen falta las dos defensas.

        La regla que queda: cada guion es dueno de las claves que MIDE y
        conserva las demas. Asi el orden en que se corran deja de importar.
        """
        datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
        claves = {m["clave"] for m in datos["metricas"]}
        for ajena in ("pruebas_app", "pruebas_web"):
            self.assertIn(ajena, claves,
                          f"falta «{ajena}»: alguien reescribio metricas entero. "
                          "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")
        for propia in ("paginas", "peso_sitio"):
            self.assertIn(propia, claves, f"falta «{propia}», que mide counters.py")

        # Y SE COMPRUEBA EL VALOR, no solo que la clave exista.
        #
        # Esto vigilaba que las claves estuvieran, y con eso bastaba para el
        # accidente que lo origino --un guion pisando las metricas del otro--.
        # Pero dejaba derivar los VALORES en silencio, y derivaron: medido el
        # 2026-09-13, `paginas` publicaba 8 habiendo 9, e `idiomas` publicaba 3
        # habiendo 8. Llevaban meses mintiendo en la portada y ningun gate lo
        # vio, porque comprobar que existe una cifra no es comprobar que sea
        # verdad.
        #
        # Y LOS PESOS TAMBIEN, que llevaban fuera por una razon que no se
        # sostenia. Este bloque decia: «`peso_sitio` no: depende de que exista
        # `downloads/`, que no esta en el repo». Pero `peso_sitio` se define
        # como TODO public/ MENOS downloads/, asi que da lo MISMO en las dos
        # situaciones: aqui resta los 190 MB de adaptadores, y en un clon sin
        # `downloads/` no hay nada que restar. Comprobado el 2026-09-20: los
        # 392 ficheros que entran en la cuenta estan los 392 seguidos por git.
        #
        # Y mientras estuvo fuera, derivo: publicaba 4.919.252 habiendo
        # 5.208.207 --- un 5,9 % de mas --- desde que entraron las 24 familias
        # de i18n. Una exclusion con motivo equivocado es un agujero con
        # coartada: nadie la revisa porque parece razonada.
        #
        # `peso_descargas` SI se queda fuera, y ahora por el motivo correcto:
        # en un clon vale 0 porque `downloads/` de verdad no esta.
        # SE IMPORTA la definicion en vez de reimplementarla. La primera
        # version la copiaba aqui, y dos copias de una suma derivan sin que
        # nadie lo note: es el «dos verdades» de siempre con forma de numero.
        import importlib.util
        _esp = importlib.util.spec_from_file_location(
            "contadores", RAIZ / "counters.py")
        _cont = importlib.util.module_from_spec(_esp)
        _esp.loader.exec_module(_cont)
        _peso_sin_descargas = _cont.peso_del_sitio

        def _peso_imagenes():
            return sum(q.stat().st_size for e in ("*.webp", "*.gif", "*.png",
                                                  "*.svg")
                       for q in PUBLICO.rglob(e))

        por_clave = {m["clave"]: m for m in datos["metricas"]}
        reales = {"paginas": len(paginas_de_contenido()),
                  "idiomas": len({d.name for d in PUBLICO.iterdir()
                                  if d.is_dir() and len(d.name) == 2
                                  and d.name.isalpha()}),
                  "peso_sitio": _peso_sin_descargas(),
                  "peso_imagenes": _peso_imagenes()}
        for clave, real in reales.items():
            m = por_clave.get(clave)
            if not m or m.get("estado") != "MEDIDO":
                continue
            with self.subTest(metrica=clave):
                self.assertEqual(
                    m["valor"], real,
                    f"counters.json publica {clave}={m['valor']} y hay {real}. "
                    "Remedio: python3 counters.py")

        fuente = (RAIZ / "counters.py").read_text(encoding="utf-8")
        self.assertIn("conservando(previo", fuente,
                      "counters.py vuelve a escribir `metricas` sin conservar")
        limpio = re.sub(r'""".*?"""', "", fuente, flags=re.S)
        self.assertNotIn('"metricas": medir()', limpio,
                         "counters.py pisa el fichero entero otra vez")



    def test_toda_pagina_ofrece_LAS_LENGUAS_QUE_EXISTEN(self):
        """La rueda de idiomas sale de aqui, y por eso ofrecia tres de ocho.

        Medido en produccion el 2026-09-14: en `profile.html` la rueda daba
        Español, English y Français, y en `benchmark.html`, `instalar.html`,
        `onboarding.html` y `playground.html` **no daba ninguno**. No era un
        fallo de la rueda: `cabezal-rotulos.js` DESCUBRE las lenguas de los
        `hreflang` de la propia pagina --a proposito, para no ofrecer un salto a
        un 404-- y esas paginas declaraban tres o cero mientras el disco tenia
        ocho traducciones de cada una.

        El guardian de arriba solo miraba `index.html`. Por eso las portadas
        estaban perfectas y las seis interiores llevaban meses cojas: la prueba
        cubria la pagina donde el fallo no estaba.

        Se exige IGUALDAD, no inclusion: declarar una lengua que no esta en el
        disco es ofrecer un 404, y es tan fallo como no declarar la que si esta.
        """
        for pagina in sorted(PUBLICO.rglob("*.html")):
            if pagina.parent == PUBLICO:
                continue            # la raiz es el despertar, no una traduccion
            if pagina == PUBLICO / "face" / "index.html":
                continue            # hub de los mundos: sin traducciones, en ingles; excepcion declarada (Mesa, 2026-10-25)
            hoja = pagina.name
            en_disco = {l for l in IDIOMAS if (PUBLICO / l / hoja).is_file()}
            declara = set(re.findall(r'hreflang="([a-z]{2})"',
                                     pagina.read_text(encoding="utf-8")))
            with self.subTest(pagina=str(pagina.relative_to(PUBLICO))):
                self.assertEqual(
                    en_disco, declara,
                    f"el disco tiene {sorted(en_disco)} y la pagina declara "
                    f"{sorted(declara)}: la rueda de idiomas ofrece lo segundo")


    def test_la_prosa_del_pie_va_PLEGADA(self):
        """Una pagina limpia: el que entra evalua, el que quiere leer abre.

        El pie honesto de cada pagina interior son tres o cuatro parrafos largos
        que ocupaban la ultima pantalla entera. No sobran --dicen lo que falla,
        que es la mitad del producto-- sobra que esten ABIERTOS. Van en el mismo
        `details.pliego` en todas: un desplegable con tres aspectos distintos son
        tres componentes; con uno es una convencion.

        LA EXCEPCION SE NOMBRA UNA A UNA, y esta es `el/instalar.html`: cierra a
        **29 B** de su tope de 16.384 y el pliegue cuesta 48. No se recorta prosa
        griega para ganar 19 B; lo que desbloquea esa pagina es sacar su pie a
        `instalar.json`, donde ya viven el resto de sus textos. Queda en
        PENDIENTES. Una excepcion nombrada envejece a la vista; una categoria
        --«las que no quepan»-- envejece en silencio.
        """
        LLENAS = {"el/instalar.html"}
        for pagina in sorted(PUBLICO.rglob("*.html")):
            if pagina.name == "index.html" or pagina.parent == PUBLICO:
                continue
            t = pagina.read_text(encoding="utf-8")
            pie = re.search(r'<footer class="honest-footer">(.*?)</footer>',
                            t, re.S)
            if not pie or "<ul>" not in pie.group(1):
                continue
            rel = str(pagina.relative_to(PUBLICO))
            with self.subTest(pagina=rel):
                if rel in LLENAS:
                    self.assertGreater(
                        pagina.stat().st_size, TOPE_FICHERO - 60,
                        f"{rel} ya no esta al borde del tope: pliega su pie y "
                        "sacala de la lista de excepciones")
                    continue
                self.assertIn('<details class="pliego">', pie.group(1),
                              "prosa de pie sin plegar")

    def test_cero_html_en_la_raiz(self):
        sueltos = [p.name for p in RAIZ.glob("*.html")]
        self.assertEqual(sueltos, [], f"HTML fuera de public/: {sueltos}")

    def test_wrangler_apunta_a_public(self):
        cfg = (RAIZ / "wrangler.jsonc").read_text(encoding="utf-8")
        # Cloudflare admite "dir" y "directory"; lo que se comprueba es que
        # apunte a public/, no como se escriba la clave.
        self.assertRegex(cfg, r'"(dir|directory)"\s*:\s*"\./public"')

    def test_ningun_fichero_gasta_medio_viaje_de_red(self):
        """El tope de disco es un PROXY; esto mide la cosa de verdad.

        Al subir el tope a 16 KiB el 2026-09-05 se justifico con una cuenta:
        estos ficheros se comprimen 2,43x, asi que 16.384 B viajan como ~6.743,
        el 48 % de la ventana inicial de congestion (~14 KB, diez paquetes de
        ~1.460). Esa cuenta usa un ratio MEDIO, y un ratio medio deja de valer
        en cuanto entra un fichero que comprime mal -- datos ya comprimidos,
        cadenas base64, rutas SVG largas.

        Una regla que se cumple por casualidad se rompe el dia que alguien
        cambia lo que la hacia casual. Asi que aqui no se supone el ratio: se
        comprime cada fichero y se mide. Si algun dia uno gasta mas de medio
        viaje, esto se pone rojo y la decision vuelve a la mesa en vez de
        degradarse en silencio.

        Medio viaje y no uno entero porque en la primera carga se piden VARIOS
        en paralelo y comparten ese vuelo: un solo fichero que se lo comiera
        entero dejaria a los demas esperando un segundo viaje.
        """
        medio_viaje = 7 * 1024
        for p in sorted(PUBLICO.rglob("*")):
            if not (p.is_file() and p.suffix in (".html", ".css", ".js",
                                                 ".json", ".webmanifest")):
                continue
            if p.stem in LICENCIAS or p.resolve() in A_DEMANDA:
                continue    # A_DEMANDA: no viaja en la primera carga; solo tras el consentimiento del visitante
            comprimido = len(gzip.compress(p.read_bytes(), 9))
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                self.assertLessEqual(
                    comprimido, medio_viaje,
                    f"{p.name} viaja como {comprimido} B comprimidos y el "
                    f"reparto son {medio_viaje}. El tope de disco de "
                    f"{TOPE_FICHERO} B se fijo suponiendo 2,43x de compresion; "
                    "este comprime peor. Remedio: partirlo, o revisar el tope "
                    "con la cuenta delante.")

    def test_cada_fichero_bajo_el_tope(self):
        """El tope rige TAMBIEN los datos, y desde el 2026-08-31.

        `.json` y `.webmanifest` estaban fuera de esta tupla mientras
        `textos()` --el guardian de doctrina, quince lineas mas arriba-- si
        los miraba. El resultado era un punto ciego con la forma exacta del
        que tenia `.mjs` antes de entrar: `hub.json` podia engordar sin freno
        y nadie se enteraba, porque el fichero que crece con el catalogo es
        justo el que no estaba vigilado.

        Al entrar, medido: hub.json 7695 B, modelos.json 2777, counters.json
        2278, threads.json 2227, manifest.webmanifest 699. Ninguno rozaba el
        tope, asi que la regla entra sin amnistia y sin deuda.
        """
        for p in PUBLICO.rglob("*"):
            if p.is_file() and p.suffix in (".html", ".css", ".js",
                                            ".json", ".webmanifest"):
                with self.subTest(fichero=str(p.relative_to(RAIZ))):
                    self.assertLess(p.stat().st_size, TOPE_FICHERO,
                        f"{p.name} pesa {p.stat().st_size} B")



class Doctrina(unittest.TestCase):

    def test_la_guia_clona_donde_el_instalador_instala(self):
        """La web decia `~/aurelius`; `install.sh` usa `~/preceptoros`.

        No es una preferencia de nombre: son dos sitios distintos. Quien siga
        la guia manual acaba con el arbol en una carpeta que ningun otro
        documento del producto vuelve a mencionar, y el dia que pida ayuda
        nadie sabra donde mirar. `plan_v5.md` ya lo llevaba escrito como deuda
        firmada --«renombrar empaquetado/guias aurelius->preceptoros»-- y esta
        es la mitad que le tocaba a la web.

        Lo que NO se toca es `dist/aurelius`: ese es el nombre REAL del
        binario que hay hoy en `dist/`, comprobado. Renombrarlo en la guia
        seria cambiar una deuda de nomenclatura por una mentira sobre un
        fichero, que es peor.
        """
        # `.txt` tambien: los `encargo-*.txt` son el texto que la persona COPIA
        # y pega en su IA. Un comando equivocado ahi viaja mas lejos que uno en
        # la pagina, porque sale del sitio y acaba en otra conversacion.
        for p, t in textos():
            if p.suffix not in (".html", ".txt"):
                continue
            with self.subTest(pagina=str(p.relative_to(RAIZ))):
                self.assertNotIn("~/aurelius", t,
                                 "la guia clona en ~/aurelius y el instalador "
                                 "usa ~/preceptoros")

    def test_cero_frameworks(self):
        for p, t in textos():
            if p.name == "test_web.py":
                continue    # este fichero NOMBRA los frameworks para prohibirlos
            with self.subTest(fichero=p.name):
                self.assertIsNone(re.search(FRAMEWORKS, t, re.I),
                                  f"framework mencionado en {p}")


    def test_cero_rutas_absolutas_ni_ips(self):
        """Lo que protege: que una IP de la tailnet no acabe en la web publica.

        LOS DIBUJOS NO SON DIRECCIONES. El `d=` de un <path> es una ristra de
        coordenadas, y una ristra de coordenadas contiene grupos de cuatro
        numeros separados por puntos por pura aritmetica: el sprite SVG del
        cabezal trajo `2.8.41.09` y `1.25.2.75`, que no son IPs de nada. Se
        recortan los <svg> ANTES de mirar en vez de aflojar el patron -- fuera
        del dibujo la regla sigue siendo la de siempre, y una IP de verdad
        jamas viaja dentro de un `<path>`. Comprobado el 2026-09-01: sin los
        <svg> no queda ni una sola coincidencia en las tres portadas.
        """
        for p, t in textos():
            if p.name in ("test_web.py", "counters.py"):
                continue    # guiones locales: resuelven su propia ruta, no la escriben
            if p.resolve() in A_DEMANDA:
                continue    # runtime vendorizado fijado por sha: «/home/web_user» es el FS virtual de emscripten
            with self.subTest(fichero=p.name):
                self.assertNotIn("/home/", t, f"ruta absoluta en {p}")
                sin_dibujos = re.sub(r"<svg.*?</svg>", "", t, flags=re.S)
                for ip in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", sin_dibujos):
                    # 0.0.0.0 is not the address of anything: it means «every
                    # interface», and the Tower's ports floor has to teach it
                    # (brains.json › docente, 2026-09-24).
                    self.assertIn(ip, ("127.0.0.1", "0.0.0.0"), f"IP incrustada en {p}: {ip}")

    def test_una_pagina_no_mezcla_rutas_absolutas_y_relativas(self):
        """Dos estilos de ruta en el mismo `<head>` es una averia latente.

        Encontrado el 2026-09-08 mirando por que se caen los enlaces en Chrome:
        `es/instalar.html` traia `../assets/base.css` en la linea 9 y
        `/assets/canon.css` en la 12. Las dos funcionan servidas desde la raiz
        del dominio, asi que nada fallaba y nadie lo vio -- y ese es justo el
        problema: el dia que el sitio se sirva bajo una subruta o se abra como
        fichero, una mitad de la hoja de estilos cargara y la otra no. Media
        pagina rota se diagnostica peor que una pagina rota entera.

        Lo que se exige NO es un estilo concreto --esa decision es del Soberano
        y esta apuntada como deuda 39-- sino que una misma pagina no use los
        dos. La coherencia se puede exigir hoy; la eleccion, no.
        """
        for pagina in sorted(PUBLICO.rglob("*.html")):
            html = pagina.read_text(encoding="utf-8")
            absolutas = re.findall(r'(?:href|src)="(/assets/[^"]+)"', html)
            relativas = re.findall(r'(?:href|src)="(\.\.?/assets/[^"]+)"', html)
            with self.subTest(pagina=str(pagina.relative_to(PUBLICO))):
                self.assertFalse(
                    absolutas and relativas,
                    f"{pagina.name} mezcla {len(absolutas)} rutas absolutas "
                    f"con {len(relativas)} relativas hacia assets/: "
                    f"{relativas[:2]}")

    def test_el_head_entero_no_mezcla_los_dos_estilos(self):
        """El de arriba solo mira `assets/`. La regla es del `<head>` entero.

        Se separa en dos pruebas a proposito y no se amplia la de arriba:
        aquella nacio de una averia concreta --las hojas de estilo-- y su
        mensaje de fallo nombra `assets/`, que es lo que hay que mirar cuando
        salta. Esta cubre la regla tal cual esta enunciada, que es mas ancha:
        NINGUNA referencia del `<head>` mezcla estilos, sea del catalogo de
        estilos, del manifiesto, de un icono o de lo que se anada manana.

        Solo el `<head>`, y no el cuerpo, porque ahi la mezcla es distinta y
        legitima: las 48 relativas que hoy viven en el cuerpo son de
        directorio propio (`./instalar.html`) y sobreviven a una subruta mejor
        que una absoluta. Exigir un estilo unico en el cuerpo seria decidir la
        deuda 39 por la puerta de atras.
        """
        externa = re.compile(r"^(https?:|mailto:|data:|#|//)")
        ref = re.compile(r'(?:href|src)="([^"]+)"')
        for pagina in sorted(PUBLICO.rglob("*.html")):
            html = pagina.read_text(encoding="utf-8")
            corte = html.find("</head>")
            cabeza = html[:corte] if corte != -1 else html
            refs = [r for r in ref.findall(cabeza) if not externa.match(r)]
            absolutas = [r for r in refs if r.startswith("/")]
            relativas = [r for r in refs if not r.startswith("/")]
            with self.subTest(pagina=str(pagina.relative_to(PUBLICO))):
                self.assertFalse(
                    absolutas and relativas,
                    f"el <head> de {pagina.name} mezcla {len(absolutas)} "
                    f"absolutas con {len(relativas)} relativas: "
                    f"{relativas[:3]}")


    def test_ninguna_hoja_esta_rota_por_dentro(self):
        """Una hoja que el navegador no sabe leer pasaba este gate en verde.

        Cicatriz del 2026-09-08, y de las caras. Al retirar un bloque muerto de
        `puertas.css` con una reescritura automatica, el corte se llevo por
        delante la APERTURA de un comentario --el `/*`, no el `*/`-- y dejo
        cinco lineas de prosa sueltas en mitad del fichero. El navegador hizo
        lo que manda su norma: leyo esa prosa como un selector larguisimo, y se
        trago con ella la regla que venia detras, que era justo la que encendia
        en oro la puerta de la pagina actual. Ni un error en consola.

        El resto del gate no podia verlo. Miraba bytes, miraba palabras y
        miraba canon, pero nadie preguntaba si el fichero seguia siendo CSS. Y
        el sintoma tampoco ayudaba: la puerta se veia, con su violeta y su
        letra blanca, solo que no era la que se habia escrito.

        Se comprueba lo minimo que distingue una hoja legible de un desastre
        silencioso: comentarios que abren y cierran, llaves cuadradas fuera de
        ellos, y ni un acento invertido en el codigo --que en esta casa solo
        aparece citando nombres dentro de la prosa, asi que uno suelto es
        siempre la firma de un comentario partido.
        """
        for hoja in sorted((PUBLICO / "assets").glob("*.css")):
            with self.subTest(hoja=hoja.name):
                css = hoja.read_text(encoding="utf-8")
                fuera, i = [], 0
                while True:
                    a = css.find("/*", i)
                    if a < 0:
                        fuera.append(css[i:])
                        break
                    b = css.find("*/", a + 2)
                    self.assertGreater(b, 0, f"{hoja.name}: comentario sin cerrar")
                    fuera.append(css[i:a])
                    i = b + 2
                codigo = "".join(fuera)
                self.assertEqual(codigo.count("{"), codigo.count("}"),
                                 f"{hoja.name}: llaves descuadradas")
                self.assertNotIn("`", codigo,
                                 f"{hoja.name}: acento invertido fuera de comentario")

    def test_el_cristal_degrada_y_se_puede_apagar(self):
        """Canon v3.0 «Liquid Glass», firmado el 2026-08-29.

        Este test SUSTITUYE al que prohibia degradados, sombras, blur y radios.
        Se reescribio, no se borro: el canon cambio y el gate tiene que vigilar
        el canon vigente, o deja de ser un gate. Lo que ahora se exige no es
        austeridad sino que el cristal no deje a nadie fuera.
        """
        for hoja in sorted((PUBLICO / "assets").glob("*.css")):
            with self.subTest(hoja=hoja.name):
                self._cristal(hoja.read_text(encoding="utf-8"))

    def _cristal(self, css):
        """Antes esto miraba SOLO base.css.

        Era el mismo punto ciego que tenia `.mjs` en `textos()`: el dia que el
        cristal se reparte en otra hoja --y `widget.css` lo hizo-- la regla
        seguia verde sin haber mirado el fichero nuevo. Ahora recorre todas.
        """
        # 1 · El desenfoque va tras `@supports`, y con respaldo opaco delante.
        #     Sin esto, en un navegador sin backdrop-filter el panel se queda
        #     translucido sobre el fondo animado y el texto no se lee.
        if "backdrop-filter" in css:
            # Se busca la AT-RULE, no la palabra: la primera vez que aparecia
            # «@supports» era dentro de un comentario que explicaba la regla, y
            # el test media contra el comentario en vez de contra el codigo.
            self.assertIn("@supports (backdrop-filter", css,
                          "backdrop-filter sin @supports: sin respaldo no se lee")
            i = css.index("@supports (backdrop-filter")
            # EL RESPALDO OPACO ES EL DE CADA HOJA, no siempre el marmol. Esta
            # linea exigia `--marmol-claro` literal, y valia mientras el unico
            # cristal era el de los paneles de marmol. La rueda es violeta: su
            # respaldo honesto es `--violeta`, y con el token clavado el gate
            # pedia pintar de marmol un panel que no lo es. Lo que la regla
            # protege es que HAYA un fondo solido antes del cristal, no de que
            # color -- eso lo decide la pieza.
            # `--bg-secondary` (#1a152a, opaco) entra el 2026-09-25 con el piso
            # ATLAS: es el fondo solido de la capa soberana.
            opacos = [m.start() for m in re.finditer(
                r"background:var\(--(marmol-claro|violeta|bg-secondary)\)", css)]
            self.assertTrue(any(o < i for o in opacos),
                            "el respaldo opaco tiene que declararse ANTES del cristal")

        # 2 · Los radios salen del token, no a ojo. Un radio suelto es como
        #     empieza una interfaz con seis esquinas distintas.
        for r in re.findall(r"border-radius\s*:\s*([^;}]+)", css):
            # `0` vale siempre: es la ausencia de radio, y con `border-image` el
            # radio lo ignora el navegador de todas formas. Cualquier otro valor
            # tiene que salir del token, o acabamos con seis esquinas distintas.
            # `inherit` vale: hereda el token del panel, que es justo lo que
            # tiene que hacer el anillo enmascarado para seguir sus esquinas.
            #
            # `50%` y `999px` valen tambien, y no es aflojar la regla: un
            # circulo y una pildora no son ESQUINAS. Lo que la regla protege es
            # que no haya seis redondeos distintos en los rectangulos; un punto
            # de estado redondo o un boton en forma de pildora son otra figura,
            # no una sexta esquina. Se descubrio al ampliar este test a todas
            # las hojas: `onboarding.css` llevaba 999px desde antes y nadie lo
            # habia mirado nunca, porque solo se leia base.css.
            self.assertTrue(
                r.strip() in ("0", "inherit", "50%", "999px") or "--radius" in r,
                f"border-radius fuera del token: {r.strip()}")

        # 3 · Quien pide menos movimiento lo recibe. Solo se exige a la hoja
        #     que declara el ambiente: pedirselo a todas obligaria a repetir
        #     la regla en hojas que no animan nada.
        if "#ambient" in css:
            reducido = css[css.index("prefers-reduced-motion"):] if "prefers-reduced-motion" in css else ""
            self.assertTrue(reducido, "el canon no respeta prefers-reduced-motion")
            self.assertIn("#ambient{display:none}", reducido.replace(" ", ""),
                          "con movimiento reducido el ambiente sigue pintando")
            # 4 · El lienzo no se come un solo clic.
            self.assertIn("pointer-events:none", css.replace(" ", ""),
                          "#ambient sin pointer-events:none intercepta la interfaz")
        # Toda hoja que anime algo tiene que saber pararse.
        if "@keyframes" in css:
            self.assertIn("prefers-reduced-motion", css,
                          "la hoja anima y no atiende a quien pide quietud")

        # El halo (text-shadow) sigue permitido SOLO en cifras vivas.
        for linea in css.splitlines():
            if "text-shadow" in linea:
                self.assertIn("cifras vivas", linea,
                              "text-shadow fuera de .cifra: " + linea.strip())


class Identidad(unittest.TestCase):

    # Ed25519 firma en 64 bytes. En hexadecimal son 128 caracteres, y es la
    # longitud del algoritmo, no una eleccion de este proyecto.
    FIRMA_HEX = 128

    def test_la_firma_va_entera(self):
        """`firmar()` devolvia `ed25519:` + 16 caracteres + puntos suspensivos.

        Calculaba los 64 bytes y tiraba 48. El problema no es que sea corta:
        es que con 16 nibbles no se puede VERIFICAR nada, ni en esta pagina ni
        en el Agora, y aun asi se leia como una garantia. Un adorno con nombre
        de firma es peor que no firmar, porque nadie vuelve a mirarlo.

        Si hace falta acortarla para ensenarla, se acorta AL PINTAR. Ahi el
        recorte no destruye nada; aqui destruia la firma entera.
        """
        t = (PUBLICO / "assets" / "auth.js").read_text(encoding="utf-8")
        firma = re.search(r"firmar:\s*function.*?\n    \}", t, re.S)
        self.assertIsNotNone(firma, "auth.js ya no expone firmar()")
        cuerpo = firma.group(0)
        self.assertNotIn(".slice(", cuerpo,
                         "firmar() vuelve a recortar la firma")
        self.assertNotIn("\u2026", cuerpo,
                         "firmar() devuelve puntos suspensivos dentro de la firma")
        self.assertIn("'ed25519:' + h", cuerpo,
                      "firmar() no devuelve el hexadecimal completo")
        self.assertIn(str(self.FIRMA_HEX), t,
                      f"auth.js no declara los {self.FIRMA_HEX} caracteres que "
                      "debe medir una firma Ed25519")
        self.assertRegex(t, r"FIRMA_HEX\s*=\s*" + str(self.FIRMA_HEX),
                         "la longitud de firma no esta fijada en una constante")

    def test_la_api_no_se_pide_al_cargar(self):
        """El tunel esta admitido como enlace, no como subrecurso.

        «Cero peticiones externas al cargar» es la promesa de la portada. Que
        api.preceptoros.org este permitida en el codigo no puede convertirse
        en que una pagina la pida sola: eso lo decide quien visita, pulsando.
        """
        for p in sorted(PUBLICO.rglob("*.html")):
            t = p.read_text(encoding="utf-8")
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                for etiqueta in re.findall(r"<(?:script|link|img|iframe)[^>]*>", t):
                    self.assertNotIn("api.preceptoros.org", etiqueta,
                                     f"subrecurso externo al cargar: {etiqueta}")



class Cabezal(unittest.TestCase):
    """El cabezal fijo, el chat protagonista y el panel Modelos.

    Sustituye a los casos del `<dialog>` de la Puerta 4. El chat dejo de ser
    un modal: ahora es lo primero que se ve y el panel se le echa encima. El
    gate tiene que vigilar el canon VIGENTE o deja de ser un gate -- mismo
    criterio con el que se reescribio el caso del cristal.
    """

    def portadas(self):
        for idioma in IDIOMAS:
            yield idioma, (PUBLICO / idioma / "index.html").read_text(encoding="utf-8")


    def test_la_version_del_service_worker_sigue_a_lo_publicado(self):
        """Desplegar no es publicar. Medido en produccion, no deducido.

        El 2026-09-13 se subieron `bronce.js`, `movimiento.css` y un
        `corregir.js` nuevo. Los tres llegaron: `curl` los traia del servidor
        con sus bytes exactos. Y la pagina seguia ejecutando los VIEJOS --la
        correccion se guardaba pero la puerta de exportacion no aparecia--
        porque `sw.js` servia el shell desde `shell-preceptoros-2026-11-d`,
        cacheado dias antes y con su `VERSION` sin tocar.

        Al Doogee le pasaba lo mismo y se habia diagnosticado como «un boton de
        navegacion sin rotulo». No era CSS. Era esto, y desde el navegador se
        ve identico a un fallo de estilos: por eso hace falta un test y no
        buenos ojos.

        La consecuencia es la peor de su especie: el cambio llega a quien entra
        por primera vez y NO llega a quien ya conocia el sitio --o sea, a los
        testers--. Y no avisa nadie.

        Aqui se ata una cosa a la otra: la huella de todo lo publicado y la
        version de cache que le corresponde. Si cambia un byte y la version no,
        rojo. La huella vive en `config/`, fuera de `public/`, porque en
        ejecucion no la usa nadie y `sw.js` esta a 64 B de su tope de red.
        """
        conf = RAIZ / "config" / "sw-huella.txt"
        self.assertTrue(conf.is_file(), "falta config/sw-huella.txt")
        d = dict(l.split("=", 1) for l in conf.read_text(encoding="utf-8")
                 .splitlines() if "=" in l and not l.startswith("#"))

        h = hashlib.sha256()
        for q in sorted(PUBLICO.rglob("*")):
            if q.is_file() and q.name != "sw.js":
                h.update(q.relative_to(PUBLICO).as_posix().encode())
                h.update(q.read_bytes())
        real = h.hexdigest()[:16]

        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        m = re.search(r"const VERSION = '([^']+)'", sw)
        self.assertIsNotNone(m, "sw.js no declara VERSION")
        version = m.group(1)

        self.assertEqual(d.get("version"), version,
            f"`sw.js` dice VERSION={version} y `config/sw-huella.txt` anota "
            f"{d.get('version')}. Se apunta la que se despliega.")
        self.assertEqual(d.get("huella"), real,
            "lo publicado cambio y la cache del service worker no. Quien ya "
            "visito el sitio NO recibiria este cambio. Remedio, en este orden: "
            "sube `VERSION` en public/sw.js, y escribe en "
            f"config/sw-huella.txt  huella={real}")

    def test_todo_panel_publicado_dice_lo_que_falla(self):
        """Una ficha que solo cuenta virtudes es publicidad, no una medida.

        `paneles.json` sale del mismo esquema que los estudios internos, y el
        validador del rack ya exige `que_falla`. Esta prueba lo exige EN LO
        PUBLICADO, que es otra cosa: el fichero puede llegar aqui de una version
        vieja del generador, editado a mano, o con un idioma anadido despues sin
        pasar por el validador.

        Y se exige por IDIOMA. Traducir una ficha y perder el defecto por el
        camino deja al lector de esa lengua con la mitad honesta quitada -- que
        es peor que no traducirla, porque no se nota.

        Tambien se comprueba la medida: una cifra de tok/s sin su carga base no
        es reproducible, y esta casa no publica cifras irreproducibles.
        """
        fichero = PUBLICO / "paneles.json"
        if not fichero.is_file():
            self.skipTest("no hay paneles publicados todavia")
        d = json.loads(fichero.read_text(encoding="utf-8"))
        paneles = d.get("paneles") or []
        self.assertTrue(paneles, "paneles.json existe y esta vacio: o sobra el "
                                 "fichero, o falta el contenido")
        # LOS TEXTOS SE MUDARON a `paneles-<idioma>.json` el 2026-09-14, y el
        # corte destapo lo que este test no podia ver: exigia `que_falla` en
        # cada idioma PRESENTE, y dos de los tres paneles solo tenian
        # castellano. Cumplian --su unico idioma decia que falla-- mientras seis
        # y siete lenguas leian la ficha entera en espanol. Ahora se exige
        # contra la lista de IDIOMAS, no contra lo que haya: una traduccion que
        # no esta no puede pasar por estar completa.
        textos = {}
        for idi in IDIOMAS:
            f = PUBLICO / f"paneles-{idi}.json"
            with self.subTest(idioma=idi):
                self.assertTrue(f.is_file(),
                                f"falta paneles-{idi}.json: esa lengua lee las "
                                "fichas en castellano")
            if f.is_file():
                textos[idi] = json.loads(f.read_text(encoding="utf-8")).get("paneles") or {}
        for p in paneles:
            pid = p.get("id", "?")
            for idi in sorted(textos):
                t = textos[idi].get(pid)
                with self.subTest(panel=pid, idioma=idi):
                    self.assertTrue(t, f"el panel `{pid}` no tiene texto en «{idi}»")
                    self.assertTrue(
                        (t or {}).get("que_falla"),
                        f"el panel `{pid}` en «{idi}» no dice que falla. Una "
                        "ficha que solo cuenta virtudes es publicidad.")
            med = (p.get("modelo") or {}).get("medida") or {}
            if med.get("tok_s") is not None:
                with self.subTest(panel=pid, campo="carga_base"):
                    self.assertIsNotNone(
                        med.get("carga_base"),
                        f"el panel `{pid}` publica {med['tok_s']} tok/s sin la "
                        "carga base de la maquina: no es reproducible.")


    def test_ninguna_pagina_ofrece_un_enlace_y_lo_desmiente(self):
        """No se puede poner un boton y decir al lado que no funciona.

        Medido el 2026-09-13 en produccion: `instalar.html` ofrecia
        `releases/latest/download/install.sh` --que devuelve 200 con 4.529 B-- y
        justo debajo decia «hasta que se publique la primera version dan 404».
        La release v1.3 llevaba publicada desde el 2026-08-31 con trece ficheros.

        Es el peor fallo posible en la pagina cuyo trabajo es que la gente
        instale: no una promesa incumplida, sino una cosa ENTREGADA y negada. A
        quien llega se le esta diciendo que no se moleste. Y aun asi alguien
        habia descargado `install.sh` dos veces, o sea que la nota no disuadio a
        todos -- pero no se sabe a cuantos si.

        La comprobacion es de COHERENCIA INTERNA y por eso no necesita red: si
        una pagina enlaza a un sitio y ademas afirma que ese sitio da 404, una de
        las dos cosas sobra. Un test que consultara GitHub ataria el gate a que
        haya internet, y un gate que depende de la red no es un gate.
        """
        for idioma in IDIOMAS:
            pagina = PUBLICO / idioma / "instalar.html"
            if not pagina.is_file():
                continue
            texto = pagina.read_text(encoding="utf-8")
            ofrece = "releases/latest/download/" in texto
            if not ofrece:
                continue
            # Se mira la PROSA, no los enlaces: un `href` puede contener el
            # numero por casualidad y no esta afirmando nada.
            prosa = re.sub(r"<[^>]+>", " ", texto)
            with self.subTest(idioma=idioma):
                self.assertNotIn(
                    "404", prosa,
                    f"{idioma}/instalar.html enlaza a GitHub Releases y ademas "
                    "dice 404 en su texto. O el enlace sobra, o la frase miente.")


class PWA(unittest.TestCase):
    """El ANEXO WEB pide PWA nativo. Habia manifiesto y worker, y ni uno solo
    de los dos llegaba al navegador de nadie."""

    def paginas_servidas(self):
        """Las 19: las de contenido, sus traducciones y el selector."""
        return sorted(PUBLICO.rglob("*.html"))

    def test_el_service_worker_esta_enchufado(self):
        """Un worker que nadie registra es un fichero, no un PWA.

        El 2026-08-30 `sw.js` llevaba semanas en public/ y NINGUNA pagina lo
        registraba; el manifiesto se enlazaba solo desde el selector de
        idioma, que es la unica pagina que nadie deja abierta. El sitio
        pasaba por PWA en el repositorio y no lo era en ningun telefono.
        """
        pwa = (PUBLICO / "assets" / "pwa.js").read_text(encoding="utf-8")
        self.assertIn("serviceWorker.register('/sw.js')", pwa,
                      "pwa.js no registra el worker")
        for p in self.paginas_servidas():
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                t = p.read_text(encoding="utf-8")
                self.assertIn('rel="manifest"', t,
                              "sin <link rel=manifest> no se puede instalar")
                if p != PUBLICO / "index.html":
                    # El selector es ruteo puro y carga sin javascript a
                    # proposito; el worker lo registra cualquiera de las
                    # otras diecinueve en cuanto se entra en un idioma.
                    self.assertIn("/assets/pwa.js", t,
                                  "la pagina no registra el service worker")

    def test_un_solo_manifiesto(self):
        """Habia `manifest.json` y `manifest.webmanifest` identicos byte a
        byte, y solo uno enlazado. Dos ficheros que dicen lo mismo son dos
        ficheros que dejaran de decirlo."""
        hallados = sorted(x.name for x in PUBLICO.glob("manifest*"))
        self.assertEqual(["manifest.webmanifest"], hallados,
                         f"hay mas de un manifiesto: {hallados}")

    def test_el_manifiesto_dice_lo_que_la_pagina_pinta(self):
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        for clave in ("name", "short_name", "start_url", "scope", "display", "icons"):
            self.assertIn(clave, m, f"el manifiesto no declara {clave}")
        self.assertEqual("standalone", m["display"])

        # Los iconos existen en disco. Un manifiesto que apunta a un PNG que
        # no esta hace que la instalacion falle sin decir por que.
        for icono in m["icons"]:
            ruta = PUBLICO / icono["src"].lstrip("/")
            with self.subTest(icono=icono["src"]):
                self.assertTrue(ruta.exists(), f"{icono['src']} no existe")

