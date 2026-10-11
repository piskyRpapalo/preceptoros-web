#!/usr/bin/env python3
"""Verificacion de doctrina de preceptoros.org. Biblioteca estandar, nada mas.

    python3 test_web.py

Cada prueba comprueba UNA regla del canon y falla diciendo por que. Una
comprobacion que detecta y no bloquea no es una comprobacion: aqui no hay avisos,
solo verde o rojo.
"""
import gzip
import hashlib, html, json, re, subprocess, sys, unittest
from pathlib import Path

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


# La UNICA URL externa admitida en todo el repo. mlc.ai no sirve la libreria de
# WebLLM; su distribucion oficial es esm.run. github.com aparece como ENLACE en
# la guia de instalacion, no como subrecurso: un <a href> no pide nada hasta que
# lo pulsas, y una guia que no puede enlazar al repositorio no es una guia.
CDN_ADMITIDO = "https://esm.run/@mlc-ai/web-llm"
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
#     (ideas6oct:785) y la puerta del juego, gzip_juego_b < 153.600 B, que sigue intacta en mundo.py.
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
        # .mjs entro el 2026-08-30. `arnes_sw.mjs` llevaba una hora en el
        # repo sin que NINGUNA prueba de doctrina lo mirase: ni frameworks, ni
        # urls externas, ni rutas absolutas. Un sufijo que no esta en esta
        # tupla es un punto ciego del gate, y un punto ciego no avisa de que
        # existe -- se descubre cuando ya ha pasado algo por el.
        if p.suffix.lower() in (".html", ".css", ".js", ".mjs", ".json",
                                ".jsonc", ".txt", ".py", ".md"):
            yield p, p.read_text(encoding="utf-8")


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


def _idiomas():
    return idiomas(PUBLICO)


IDIOMAS = _idiomas()


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

    Criterio fijado en el commit 1 y usado igual por contadores.py: la raiz es
    ruteo (3 KB de selector, sin contenido) y en/ y fr/ son traducciones de es/,
    no paginas nuevas. Si este criterio cambia, cambia en los dos sitios — o el
    test dara verde sobre una regla que ya no es la del proyecto.
    """
    return sorted(p for p in PUBLICO.rglob("*.html")
                  if p.parent not in TRADUCCIONES
                  and p != PUBLICO / "index.html")


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
        # Y sigue sin entrar sola la decima.
        paginas = paginas_de_contenido()
        self.assertLessEqual(len(paginas), 9,
            "mas de 9 paginas de contenido: " + ", ".join(p.name for p in paginas))

    def test_la_tarjeta_social_apunta_a_algo_que_existe(self):
        """og:image, og:url y el favicon, comprobados contra el disco.

        Una tarjeta social se rompe en silencio: la pagina sigue funcionando y
        el hueco gris solo lo ve quien pega el enlace en un chat. Por eso se
        comprueba aqui y no «cuando alguien avise».
        """
        favicon = PUBLICO / "assets" / "favicon.svg"
        self.assertTrue(favicon.is_file(), "no existe assets/favicon.svg")

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

        `contadores.py` (aqui) mide el sitio; `p0x/bin/coherencia-publica.py`
        mide los dos gates y escribe `pruebas_app` y `pruebas_web`. Aquel
        funde por clave desde siempre; este reescribia `metricas` entero, asi
        que correrlo borraba las dos cifras de pruebas y el gate se ponia en
        rojo senalando su propio remedio. Paso el 2026-09-01.

        El cerrojo `O_EXCL` de `contadores.py` no protege de esto: cubre dos
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
            self.assertIn(propia, claves, f"falta «{propia}», que mide contadores.py")

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
            "contadores", RAIZ / "contadores.py")
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
                    "Remedio: python3 contadores.py")

        fuente = (RAIZ / "contadores.py").read_text(encoding="utf-8")
        self.assertIn("conservando(previo", fuente,
                      "contadores.py vuelve a escribir `metricas` sin conservar")
        limpio = re.sub(r'""".*?"""', "", fuente, flags=re.S)
        self.assertNotIn('"metricas": medir()', limpio,
                         "contadores.py pisa el fichero entero otra vez")



    def test_r_widget_y_r_tipografia(self):
        """El anexo visual, comprobado y no confiado.

        R-WIDGET nacio de una queja real: en el Doogee, con luz de dia, el
        texto que caia directamente sobre el marmol no se leia. Y el motivo de
        fondo es que el marmol es una TEXTURA, no un color -- sobre una textura
        no se puede calcular contraste ninguno, asi que la unica regla honesta
        es que todo texto tenga su par declarado.
        """
        canon = PUBLICO / "assets" / "canon.css"
        self.assertTrue(canon.is_file(), "falta assets/canon.css")
        css = canon.read_text(encoding="utf-8")

        for token in ("--panel-bg", "--panel-fg", "--display"):
            self.assertIn(token, css, f"canon.css no declara {token}")

        # R-TIPOGRAFIA · cero fuentes externas. Las del stack viven ya en el
        # sistema de quien mira; descargar una romperia «cero peticiones
        # externas al cargar», que es una cifra publicada en la portada.
        self.assertNotIn("@import", css, "canon.css importa algo de fuera")
        self.assertNotIn("@font-face", css, "canon.css descarga una fuente")

        # El contraste se MIDE aqui, con la formula de la WCAG, no se promete.
        def _lum(h):
            c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
            c = [x / 12.92 if x <= .03928 else ((x + .055) / 1.055) ** 2.4 for x in c]
            return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]

        pares = dict(re.findall(r"--panel-(bg|fg):#([0-9A-Fa-f]{6})", css))
        self.assertEqual(sorted(pares), ["bg", "fg"],
                         "el par del panel no esta declarado en hex")
        a, b = _lum(pares["fg"]), _lum(pares["bg"])
        a, b = max(a, b), min(a, b)
        razon = (a + .05) / (b + .05)
        self.assertGreaterEqual(round(razon, 2), 4.5,
                                f"el par del panel da {razon:.2f}:1, por debajo de 4,5")

        # Y toda pagina que cargue base.css tiene que cargar tambien el canon:
        # si no, R-WIDGET rige a medias y el hueco es justo el que se veia mal.
        # Se busca el <link>, no la cadena: la raiz MENCIONA base.css en un
        # comentario que explica que a proposito NO la carga («ruteo puro,
        # para que la puerta cargue sola»), y un grep ingenuo la acusaba de
        # incumplir una regla que no le aplica.
        enlace = re.compile(r'<link[^>]+href="[^"]*assets/base\.css"')
        for p_ in PUBLICO.rglob("*.html"):
            t = p_.read_text(encoding="utf-8")
            if not enlace.search(t):
                continue
            with self.subTest(fichero=str(p_.relative_to(RAIZ))):
                self.assertIn("canon.css", t, "carga base.css pero no el canon")

    def test_las_portadas_declaran_hreflang(self):
        """Tres traducciones sin hreflang son tres paginas sueltas para un
        buscador, y compiten entre ellas en vez de ofrecerse por idioma."""
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            for otro in IDIOMAS:
                with self.subTest(idioma=idi, apunta_a=otro):
                    self.assertRegex(t, rf'hreflang="{otro}"',
                                     f"{idi} no declara hreflang de {otro}")

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
            hoja = pagina.name
            en_disco = {l for l in IDIOMAS if (PUBLICO / l / hoja).is_file()}
            declara = set(re.findall(r'hreflang="([a-z]{2})"',
                                     pagina.read_text(encoding="utf-8")))
            with self.subTest(pagina=str(pagina.relative_to(PUBLICO))):
                self.assertEqual(
                    en_disco, declara,
                    f"el disco tiene {sorted(en_disco)} y la pagina declara "
                    f"{sorted(declara)}: la rueda de idiomas ofrece lo segundo")


    def test_la_capa_soberana_va_la_ultima_y_no_pide_nada_fuera(self):
        """Soberania Violeta-Cobre, 2026-09-25. Una capa ENCIMA del tema.

        Tiene que cargarse detras de `tema.css` en cada pagina que lo carga:
        antes, `tema.css` volveria a pisar la paleta y la web saldria a medias
        segun la pagina. Y no puede traer nada de fuera: ni una fuente.
        """
        css = (PUBLICO / "assets" / "soberano.css").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        self.assertNotIn("http", codigo, "la capa visual pide algo fuera")
        self.assertNotIn("@import", codigo, "la capa visual encadena otra hoja")
        for token in ("--bg-primary:#0f0c1b", "--bg-secondary:#1a152a",
                      "--accent-violet:#7c3aed", "--accent-copper:#d97706",
                      "--text-main:#e2e8f0", "--text-muted:#94a3b8"):
            with self.subTest(token=token):
                self.assertIn(token, codigo, f"falta la paleta firmada: {token}")
        tema = '<link rel="stylesheet" href="/assets/tema.css">'
        capa = '<link rel="stylesheet" href="/assets/soberano.css">'
        for pag in sorted(PUBLICO.rglob("*.html")):
            t = pag.read_text(encoding="utf-8")
            if tema not in t:
                continue
            with self.subTest(pagina=pag.relative_to(PUBLICO).as_posix()):
                self.assertIn(capa, t, "la pagina carga el tema y no la capa")
                self.assertLess(t.index(tema), t.index(capa),
                                "la capa va antes que el tema y este la pisa")


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
            if p.stem in LICENCIAS:
                continue
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
            if p.name in ("test_web.py", "contadores.py"):
                continue    # guiones locales: resuelven su propia ruta, no la escriben
            with self.subTest(fichero=p.name):
                self.assertNotIn("/home/", t, f"ruta absoluta en {p}")
                sin_dibujos = re.sub(r"<svg.*?</svg>", "", t, flags=re.S)
                for ip in re.findall(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", sin_dibujos):
                    # 0.0.0.0 is not the address of anything: it means «every
                    # interface», and the Tower's ports floor has to teach it
                    # (cerebros.json › docente, 2026-09-24).
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

        # Un color de barra en el manifiesto y otro en la etiqueta es una
        # ventana que cambia de color al instalarse.
        for p in self.paginas_servidas():
            t = p.read_text(encoding="utf-8")
            meta = re.search(r'<meta name="theme-color" content="([^"]+)"', t)
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                self.assertIsNotNone(meta, "la pagina no declara theme-color")
                self.assertEqual(m["theme_color"].lower(), meta.group(1).lower(),
                                 "el manifiesto y la pagina discrepan del color")

    def test_un_icono_maskable_no_puede_ser_el_mismo_que_el_normal(self):
        """Medido el 2026-08-30 sobre icon-512.png y por eso existe.

        El manifiesto declaraba `purpose: maskable` sobre el MISMO fichero que
        servia de icono normal. Android recorta los maskable a un circulo del
        80% del lado: radio 205 px en un lienzo de 512. El contenido de ese
        icono llega a 255 px del centro. Es decir, la promesa «esto aguanta el
        recorte» era falsa y el glifo se cortaba en cada telefono Android.

        Un maskable necesita su PROPIO fichero, con el dibujo mas pequeno
        dentro de la zona segura. Mientras no exista, es mejor no declararlo:
        el sistema pone su propia placa y se ve peor, pero no miente.
        """
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        normales = {i["src"] for i in m["icons"]
                    if "maskable" not in i.get("purpose", "any")}
        for icono in m["icons"]:
            if "maskable" in icono.get("purpose", ""):
                with self.subTest(icono=icono["src"]):
                    self.assertNotIn(
                        icono["src"], normales,
                        f"{icono['src']} se declara maskable y ademas normal: "
                        "o tiene margen de sobra como icono, o se recorta como "
                        "maskable. No puede ser lo correcto en los dos papeles.")

    def test_los_iconos_no_engordan_sin_permiso(self):
        """Los iconos pasaron de 12 KB a 180 KB al cambiar de arte.

        Es el precio de una imagen fotorrealista y esta pagado a proposito:
        el anterior era un glifo plano de otra paleta. Pero un techo declarado
        evita que el proximo cambio meta un PNG de un mega sin que nadie lo
        mire. No se cargan al abrir la web --solo al instalar la app-- y por
        eso el techo es alto y no minusculo.
        """
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        vistos, total = set(), 0
        for icono in m["icons"]:
            if icono["src"] in vistos:
                continue
            vistos.add(icono["src"])
            total += (PUBLICO / icono["src"].lstrip("/")).stat().st_size
        self.assertLess(total, 256 * 1024,
                        f"los iconos del manifiesto suman {total} B")

    def test_manifest_es_minimo(self):
        """Lo que hace falta para instalar, y nada de adorno.

        Un manifiesto que crece con claves que ningun navegador lee es un
        fichero que nadie vuelve a auditar. Se fija la lista: si alguien anade
        una clave, tiene que anadirla tambien aqui y explicar para que.
        """
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        obligatorias = {"name", "short_name", "start_url", "display", "icons"}
        self.assertTrue(obligatorias <= set(m),
                        f"faltan claves de instalacion: {obligatorias - set(m)}")
        admitidas = obligatorias | {"id", "scope", "lang", "dir", "description",
                                    "orientation", "background_color", "theme_color"}
        sobran = set(m) - admitidas
        self.assertFalse(sobran, f"claves decorativas en el manifiesto: {sobran}")
        # Los iconos son PNG de 192 y 512: un webp de 128 px no instala en
        # Android, que pide 192 como minimo y 512 para la pantalla de arranque.
        tam = {i["sizes"] for i in m["icons"]}
        self.assertIn("192x192", tam, "sin icono de 192 no hay instalacion")
        self.assertIn("512x512", tam, "sin icono de 512 no hay pantalla de arranque")

    def test_iconos_y_tarjeta_salen_del_emblema(self):
        """Firma F2-8 del Soberano, 2026-10-10: favicon, iconos PWA y og:image siguen
        existiendo, pero CAMBIA SU ORIGEN: los genera bin/iconos_desde_emblema.py con la
        onda del emblema del sitio. Lo publicado tiene que ser exactamente lo que el
        generador produce hoy: un icono retocado a mano o un PNG pintado no pasa."""
        try:
            import PIL  # noqa: F401
        except ImportError:
            self.skipTest("NO_DATA · sin Pillow no se puede regenerar. Remedio: instalar Pillow")
        r = subprocess.run([sys.executable, str(RAIZ / "bin" / "iconos_desde_emblema.py"), "--comprobar"],
                           cwd=RAIZ, capture_output=True, text=True, timeout=120)
        self.assertEqual(r.returncode, 0, "lo publicado no es lo que genera el emblema:\n" + r.stdout)

    def test_el_maskable_cabe_de_verdad_en_su_circulo(self):
        """No que lo diga el manifiesto: que lo diga el fichero.

        El anterior se declaraba maskable y se recortaba -- contenido a 255 px
        del centro con un radio seguro de 205. Aquella comprobacion solo miraba
        que fuese un fichero distinto del icono normal, que es necesario y no
        suficiente: un fichero distinto puede estar igual de mal encuadrado.
        Esta abre el PNG y mide.
        """
        try:
            from PIL import Image
        except ImportError:
            self.skipTest("NO_DATA · sin Pillow no se puede medir el encuadre. "
                          "Remedio: instalar Pillow y repetir")
        import math
        m = json.loads((PUBLICO / "manifest.webmanifest").read_text(encoding="utf-8"))
        masc = [i for i in m["icons"] if "maskable" in i.get("purpose", "")]
        if not masc:
            self.skipTest("el manifiesto no declara ningun icono maskable")
        for icono in masc:
            im = Image.open(PUBLICO / icono["src"].lstrip("/")).convert("RGB")
            w, h = im.size
            with self.subTest(icono=icono["src"]):
                self.assertEqual(w, h, "un maskable tiene que ser cuadrado")
                fondo = im.getpixel((2, 2))
                # Android recorta a un circulo del 80% del lado: radio 40%.
                seguro = 0.40 * w
                cx, cy = w / 2, h / 2
                lejos = 0.0
                px = im.load()
                for y in range(h):
                    for x in range(w):
                        c = px[x, y]
                        if abs(c[0]-fondo[0]) + abs(c[1]-fondo[1]) + abs(c[2]-fondo[2]) > 24:
                            d = math.hypot(x - cx, y - cy)
                            if d > lejos:
                                lejos = d
                self.assertLessEqual(
                    lejos, seguro,
                    f"{icono['src']}: hay dibujo a {lejos:.0f} px del centro y "
                    f"el circulo seguro son {seguro:.0f}. Android lo recortaria.")

    def test_el_worker_no_guarda_lo_ajeno_ni_los_datos(self):
        """Las dos reglas que el worker anterior rompia.

        Cacheaba TODO con `caches.match() || fetch()`, la API incluida: una
        respuesta guardada para siempre y una pagina que no puede notarlo.
        Y guardar counters.json seria publicar cifras viejas con cara de
        frescas -- la misma averia que la portada con sus 19 pruebas.
        """
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        self.assertIn("url.origin !== self.location.origin", sw,
                      "el worker no distingue su propio origen del ajeno")
        self.assertIn(".json", sw, "el worker no deja fuera los datos")
        # Ni un host escrito a mano: la frontera es el origen, que el
        # navegador ya sabe. Una lista de dominios envejece en silencio.
        self.assertEqual([], re.findall(r"https?://[^\s\"']+", sw),
                         "el worker lleva un dominio incrustado")

    def test_el_worker_pasa_su_arnes(self):
        """Las reglas de enrutado, ejecutadas de verdad.

        Todo lo demas de esta clase lee el fichero y busca cadenas: comprueba
        que el worker DICE lo correcto, no que lo HAGA. `arnes_sw.mjs` lo
        ejecuta con un entorno falso y le pide las cuatro reglas.

        Se salta si no hay node. Preferir un NO_DATA declarado a una prueba
        que se cae en cualquier maquina sin node instalado -- el gate de este
        repositorio es de biblioteca estandar y asi sigue.
        """
        import shutil, subprocess
        node = shutil.which("node")
        if not node:
            self.skipTest("NO_DATA · no hay node: la logica del worker queda "
                          "sin ejecutar. Remedio: instalar node y repetir")
        r = subprocess.run([node, "arnes_sw.mjs"], cwd=str(RAIZ),
                           capture_output=True, text=True, timeout=120)
        self.assertEqual(0, r.returncode,
                         "el arnes del worker falla:\n" + r.stdout + r.stderr)

    def test_sw_cachea_los_nuevos_assets(self):
        """El worker tiene que conocer TODO lo que la portada necesita.

        La lista no se escribe aqui: se DERIVA del disco y de `hub.json`. Si
        manana entra una cara de agente nueva y nadie la anade al worker, este
        caso se cae solo -- que es justo lo que hace falta, porque el sintoma
        contrario es invisible: la app instalada abre, pinta el esqueleto, y
        la rejilla se queda en NO_DATA sin que nadie sepa por que.

        Y la distincion entre medida y contenido se comprueba en los dos
        sentidos: `hub.json` tiene que estar declarado como contenido, y
        `counters.json` NO puede estarlo. Cachear la cifra de los gates seria
        repetir la averia de la puerta 1 dentro del worker.
        """
        sw = texto_del_worker()

        # 1 · las piezas de la PORTADA-JUEGO (mudanza b3, 2026-10-11: el hub cayo; la portada es el juego)
        for pieza in ("/assets/thegame.js", "/assets/eaa-art12-local-first-surface.js", "/assets/auth.js",
                      "/assets/pwa.js", "/game/gdpr-art25-ephemeral-crab.js", "/assets/atlas-motor.js"):
            with self.subTest(pieza=pieza):
                self.assertIn(f"'{pieza}'", sw,
                              f"el worker no cachea {pieza}")

        # 2 · NINGUNA de las dos familias de iconos de companero viaja ya.
        #
        # Lo de los ojos venia del 2026-09-05 y ya estaba escrito aqui; las
        # esferas se van el 2026-09-20 con los companeros. Se comprueba por
        # PREFIJO y no por nombre: una lista generada con un `map` colaria por
        # debajo de una comprobacion que buscara los ocho nombres.
        #
        # La regla se invierte en vez de borrarse. Un hueco donde habia una
        # comprobacion es como vuelve el mismo desperdicio dentro de seis meses
        # -- alguien reañade la lista «por si acaso» y no falla nada.
        for prefijo in ("agente-3d-", "agente-" + "ojo-"):
            with self.subTest(prefijo=prefijo):
                self.assertNotIn(prefijo, sw,
                                 f"el worker vuelve a precachear {prefijo}* y "
                                 f"no lo pinta nadie")

        # 3 · contenido si, medida no
        contenido = re.search(r"const CONTENIDO_JSON = \[(.*?)\]", sw, re.S)
        self.assertIsNotNone(contenido, "el worker no separa contenido de medida")
        self.assertIn("...ATLAS", contenido.group(1), "los textos del juego son contenido")
        self.assertNotIn("counters.json", contenido.group(1),
                         "el worker cachearia la cifra de los gates")
        self.assertIn("/manifest.webmanifest",
                      re.search(r"const RED_PRIMERO = \[(.*?)\]", sw, re.S).group(1),
                      "el manifiesto no va a red primero")

    def test_sin_conexion_hay_algo_que_leer(self):
        """Y en los tres idiomas: quien instala desde /fr/ no merece un
        error en espanol."""
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        self.assertIn("paginaSinRed", sw, "el worker no sintetiza respaldo")
        for idioma in IDIOMAS:
            with self.subTest(idioma=idioma):
                self.assertRegex(sw, r"\b" + idioma + r"\s*:\s*\[",
                                 f"la pagina de sin conexion no habla {idioma}")


class Paginas(unittest.TestCase):

    def test_selector_de_idioma_por_path(self):
        s = (PUBLICO / "index.html").read_text(encoding="utf-8")
        for idioma in IDIOMAS:
            # Vale tanto "./es/" como "/es/": lo que importa es que el idioma
            # este en la RUTA, no la forma de escribir el enlace.
            self.assertTrue(f'href="./{idioma}/"' in s or f'href="/{idioma}/"' in s,
                            f"el selector no enlaza al idioma {idioma}")
        self.assertNotIn("chat.js", s, "el selector no debe cargar el chat")
        # La regla es que elegir mal NO te encierre. Hay dos formas validas de
        # cumplirla y el test admite las dos: o el selector no redirige solo, o
        # redirige pero deja una salida (`?cambiar`). Lo que no vale es
        # redirigir sin escape.
        redirige = "location.replace" in s or "location.href" in s
        self.assertTrue(not redirige or "cambiar" in s,
                        "el selector redirige solo y no deja salida: elegir mal encierra")

    def test_todas_las_paginas_tienen_pie_honesto(self):
        # Las portadas salieron (mudanza b1, 2026-10-11): ya no son paginas de contenido, son el juego.
        for p in paginas_de_contenido():
            if p.name == "index.html":
                continue
            with self.subTest(pagina=p.name):
                self.assertIn('class="honest-footer"', p.read_text(encoding="utf-8"))

    def test_los_enlaces_internos_existen(self):
        """Ningun enlace relativo apunta a una pagina que no esta.

        Existe por una cicatriz: las tres landings enlazaron a instalar.html y
        lore.html varios commits antes de que existieran.
        """
        for p in PUBLICO.rglob("*.html"):
            s = p.read_text(encoding="utf-8")
            for href in re.findall(r'href="([^"]+)"', s):
                if href.startswith(("http", "#", "mailto:")):
                    continue
                ruta = href.split("#")[0].split("?")[0]
                if not ruta:
                    continue
                # Un href que empieza por "/" es relativo a la RAIZ DEL SITIO,
                # que aqui es public/, no al sistema de ficheros. La primera
                # version resolvia "/es/" contra / y daba nueve falsos rotos.
                base = PUBLICO if ruta.startswith("/") else p.parent
                destino = (base / ruta.lstrip("/")).resolve()
                if destino.is_dir():
                    destino = destino / "index.html"
                with self.subTest(pagina=str(p.relative_to(PUBLICO)), href=href):
                    self.assertTrue(destino.exists(), f"enlace roto: {href} -> {destino}")


class Traducciones(unittest.TestCase):

    @staticmethod
    def claves_que_usa(js):
        # Se quitan los comentarios ANTES de mirar: si no, la propia
        # documentacion del fichero se inventa claves. Paso por aqui.
        js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        js = re.sub(r"(?m)//.*$", "", js)
        return set(re.findall(r"\bT\.([A-Za-z]+)", js))

    # Guiones que NO leen sus rotulos del bloque de la pagina. Se enumeran uno a
    # uno con su motivo, y no como categoria: una categoria --«los que tienen
    # otra fuente»-- deja entrar al siguiente sin que nadie lo mire.
    OTRA_FUENTE = {
        "cabezal-rotulos.js": "los rotulos del cabezal salen de /nav.json, que "
                              "genera nav.py desde las propias portadas",
        "pwa.js": "comparte con el cabezal los rotulos de /nav.json",
        "auth.js": "resuelve T en rotulos(), que lee el mismo catalogo",
        "hub.js": "T.agentes es un override opcional; los nombres salen de "
                  "agentes-<idioma>.json",
        "enviar.js": "sus ocho rotulos viven en enviar-<idioma>.js desde el "
                     "2026-09-14; los comprueba "
                     "test_los_rotulos_del_ENVIO_viven_en_las_ocho",
        "engine.js": "sus 19 rotulos viven en motor-<idioma>.json desde el "
                     "2026-09-20, cuando la descarga del modelo se mudo del "
                     "LorAtelier a la portada: no caben en el bloque del "
                     "griego, que deja 107 bytes libres. El bloque propio "
                     "sigue mandando --- la familia solo rellena lo que falte "
                     "---, y la paridad la comprueba LasTresFamilias",
    }

    def test_NINGUNA_pagina_cae_al_respaldo_en_castellano(self):
        """La regla entera, y contra TODOS los guiones que carga cada pagina.

        Hasta hoy esto se vigilaba pieza a pieza: el taller tenia su guardian,
        el Agora gano el suyo el 2026-09-14 despues de publicar tres titulares
        en espanol dentro de la pagina inglesa. Pieza a pieza significa que la
        siguiente pieza entra sin vigilancia, y asi entraron las dos que este
        test encontro al escribirse:

          · `rackFallo`, `rackCausa` y `rackSinAdaptador` faltaban en las OCHO
            `benchmark.html`, que tambien pide turnos al rack. Ahi no caian al
            castellano: caian a `undefined`, y la pagina decia «undefined Failed
            to fetch». Peor que un idioma equivocado, porque no significa nada.
          · `tbVacio` y `tbEscritura` existian SOLO en castellano, y son el
            hueco mas visible del Agora: lo que se lee cuando no hay ni un hilo.

        El respaldo en castellano dentro del codigo es comodo y por eso es
        peligroso: no rompe nada, se ve razonable, y solo lo nota quien lee las
        dos lenguas. Esta prueba es la unica que puede verlo por el.
        """
        clave = re.compile(r"\bT\.([A-Za-z][A-Za-z0-9]*)|T\('([A-Za-z][A-Za-z0-9]*)'")
        for pagina in sorted(PUBLICO.rglob("*.html")):
            html = pagina.read_text(encoding="utf-8")
            bloque = re.search(r'id="i18n">(.*?)</script>', html, re.S)
            if not bloque:
                continue        # sus textos viven en un JSON propio
            tiene = set(json.loads(bloque.group(1)))
            for src in re.findall(r'<script src="/assets/([^"]+)"', html):
                if src in self.OTRA_FUENTE:
                    continue
                f = PUBLICO / "assets" / src
                if not f.is_file():
                    continue
                js = re.sub(r"/\*.*?\*/", "", f.read_text(encoding="utf-8"), flags=re.S)
                js = re.sub(r"(?m)//.*$", "", js)
                pide = {a or b for a, b in clave.findall(js)}
                # `state.js` solo pinta el badge del cerebro si la pagina trae
                # `#brain`, y se retira ANTES de leer una sola clave si no esta.
                if src == "state.js" and 'id="brain"' not in html:
                    pide -= {"brainAsleep", "brainLabel", "brainLive", "brainNone"}
                with self.subTest(pagina=str(pagina.relative_to(PUBLICO)), guion=src):
                    self.assertFalse(
                        pide - tiene,
                        f"{src} pide claves que esta pagina no declara y caera "
                        f"a su respaldo: {sorted(pide - tiene)}")

    # Los ocho rotulos de la puerta hacia el rack, y su casa desde el
    # 2026-09-14. Se nombran aqui y no se deducen del fichero: si manana
    # alguien borra uno, el test tiene que echarlo de menos.
    ROTULOS_ENVIO = ("envBoton", "envEnviando", "envEncolado", "envFallo",
                     "envSinCanal", "envSinFirmaTexto", "envRemedio", "envAviso")

    def test_los_rotulos_del_ENVIO_viven_en_las_ocho(self):
        """`enviar.js` esta perdonado arriba, asi que aqui se paga el perdon.

        Y la asercion que de verdad importa no es que existan: es que **no
        sean la version inglesa**. Este fichero nace de encontrar SEIS lenguas
        --fr, pt, it, de, ru, el-- publicando «Send to the rack» dentro de tres
        paginas cada una. Nada saltaba: las claves estaban, tenian texto, y el
        texto estaba bien escrito. En el idioma equivocado.

        Es la familia de A17 --el respaldo silencioso-- con una vuelta de
        tuerca: alli el respaldo era castellano y lo veia cualquiera de la
        casa; aqui era ingles, que en una web tecnica no llama la atencion de
        nadie. Por eso el guardian no puede preguntar «hay texto?» sino
        «es OTRO texto?».
        """
        import re as _re
        cargados = {}
        for idioma in IDIOMAS:
            f = PUBLICO / "assets" / f"enviar-{idioma}.js"
            with self.subTest(idioma=idioma):
                self.assertTrue(f.is_file(),
                    f"la puerta hacia el rack no tiene rotulos en {idioma}: "
                    f"falta {f.name}")
                crudo = f.read_text(encoding="utf-8")
                m = _re.search(r"window\.ENVT\s*=\s*(\{.*?\});", crudo, _re.S)
                self.assertIsNotNone(m, f"{f.name} no declara window.ENVT")
                datos = json.loads(m.group(1))
                cargados[idioma] = datos
                faltan = [k for k in self.ROTULOS_ENVIO if not datos.get(k)]
                self.assertFalse(faltan,
                    f"{f.name} no trae {faltan}: en pantalla eso se ve igual "
                    f"que no traer el fichero")

        ingles = cargados.get("en", {})
        for idioma in IDIOMAS:
            if idioma in ("en",):
                continue
            iguales = [k for k in self.ROTULOS_ENVIO
                       if cargados[idioma].get(k) == ingles.get(k)]
            with self.subTest(idioma=idioma, contra="en"):
                self.assertFalse(iguales,
                    f"enviar-{idioma}.js repite la version INGLESA en "
                    f"{iguales}. No es un hueco --hay texto-- y por eso no lo "
                    f"ve nadie que no lea las dos lenguas.")

    # Frases que SON iguales en varias lenguas y deben serlo. Se nombran una a
    # una: una categoria («los nombres de fichero») dejaria pasar la siguiente
    # frase que se cuele por parecerse a la categoria.
    MISMA_FRASE_A_PROPOSITO = {
        ("onboarding.html", "s3pc"):
            "«Linux o macOS · install.sh» son dos sistemas operativos y un "
            "nombre de fichero. La `o` coincide en varias lenguas por "
            "casualidad, y traducir el nombre del script seria un error.",
    }

    def test_NINGUNA_pagina_repite_LA_PROSA_DE_OTRA_LENGUA(self):
        """El hueco que ni el respaldo ni las claves ausentes podian ver.

        Los dos guardianes que ya habia preguntan por la EXISTENCIA: que la
        clave este, que no falte. Ninguno pregunta si lo que hay dice algo en
        la lengua de la pagina. Y el 2026-09-14 aparecieron las dos formas del
        mismo fallo, en direcciones opuestas:

          · `envBoton` y sus siete hermanas decian «Send to the rack» en fr,
            pt, it, de, ru y el. Texto habia, y bien escrito: en ingles.
          · Las paginas PORTUGUESAS del Libro de Pruebas, la Comunidad, el
            Provador y sobre todo el Onboarding --41 claves de 41-- eran el
            castellano copiado tal cual. `pt/onboarding.html` llegaba a
            declarar `lang: "es"` dentro de su propio bloque.

        Por eso esto compara CADA lengua contra CADA otra y no contra una de
        referencia: anclarlo en el castellano habria visto el portugues y no
        el ingles; anclarlo en el ingles, al reves.

        El umbral --cuatro palabras y 25 caracteres-- deja fuera los cognados
        de verdad: «Copiar para», «Modelo natural», «motor:» son iguales en
        castellano y portugues porque asi se dice. Lo que pasa de ahi ya no
        coincide por casualidad.
        """
        import collections
        paginas = sorted({p.name for p in (PUBLICO / "es").glob("*.html")})
        for pagina in paginas:
            bloques = {}
            for idioma in IDIOMAS:
                f = PUBLICO / idioma / pagina
                if not f.is_file():
                    continue
                m = re.search(r'id="i18n">(.*?)</script>',
                              f.read_text(encoding="utf-8"), re.S)
                if m:
                    bloques[idioma] = json.loads(m.group(1))
            if len(bloques) < 2:
                continue
            claves = set().union(*[set(d) for d in bloques.values()])
            for clave in sorted(claves):
                if (pagina, clave) in self.MISMA_FRASE_A_PROPOSITO:
                    continue
                por_texto = collections.defaultdict(list)
                for idioma, datos in bloques.items():
                    v = datos.get(clave)
                    if isinstance(v, str) and len(v.split()) >= 4 and len(v) >= 25:
                        por_texto[v].append(idioma)
                repetidas = {v: ls for v, ls in por_texto.items() if len(ls) > 1}
                with self.subTest(pagina=pagina, clave=clave):
                    self.assertFalse(repetidas,
                        f"«{clave}» dice LO MISMO en "
                        f"{sorted(sum(repetidas.values(), []))}: "
                        + (list(repetidas)[0][:70] if repetidas else "")
                        + " — o falta traducir, o es una coincidencia "
                          "legitima y va nombrada en MISMA_FRASE_A_PROPOSITO")

    def test_cada_pagina_declara_SU_lengua_en_el_bloque(self):
        """`lang` dentro del bloque no es decorativo: se lo lleva el modelo.

        `pt/onboarding.html` declaraba `lang: "es"`. La pagina se veia
        portuguesa en el navegador --`<html lang="pt">` estaba bien-- y por
        dentro se presentaba como castellana. Un dato que solo se lee desde
        JavaScript no tiene sintoma visual: por eso hace falta esta prueba y
        no basta con mirar la pagina.
        """
        for idioma in IDIOMAS:
            for f in sorted((PUBLICO / idioma).glob("*.html")):
                m = re.search(r'id="i18n">(.*?)</script>',
                              f.read_text(encoding="utf-8"), re.S)
                if not m:
                    continue
                datos = json.loads(m.group(1))
                if "lang" not in datos:
                    continue
                with self.subTest(pagina=f"{idioma}/{f.name}"):
                    self.assertEqual(datos["lang"], idioma,
                        f"{idioma}/{f.name} declara lang={datos['lang']!r} "
                        f"dentro de su bloque i18n")


    # Las trece de firmar una correccion, y de donde sale cada una.
    ROTULOS_FIRMA_HUB = ("corregirBoton", "corregirQue", "corregirMotivo",
                         "corregirFirmar", "corregirNoViaja",
                         "corregirGuardado", "corregirFallo")
    ROTULOS_FIRMA_NAV = ("idEntrar", "idAviso", "idClave", "idFallo",
                         "idPerfil", "idPublica")


    # Guiones que llevan su PROPIA tabla de ocho lenguas dentro, y por eso
    # tienen castellano escrito a mano con toda la razon. Se nombran uno a uno:
    # una regla («los que tengan `es:`») dejaria pasar al siguiente que se
    # invente una tabla a medias.
    TABLA_PROPIA = {
        "aprender.js": "TEXTO, las ocho lenguas del «aprender de mis reescrituras»",
        "elegir.js": "VOZ, las ocho del «¿te ha servido?»",
        "consiento.js": "las ocho del consentimiento de analisis",
        "sello-rack.js": "TX, las nueve del sello «disponible» de las puertas al rack",
        "medidas-turno.js": "TX, the nine languages of the per-answer measurements tag",
        "page-comment.js": "TX, las nueve del «comentar esta pagina» (que se envia y que no)",
    }

    def test_NINGUN_guion_lleva_CASTELLANO_suelto(self):
        """El hueco por donde se colo el Showman, y que el otro guardian no ve.

        `test_NINGUNA_pagina_cae_al_respaldo_en_castellano` sigue el patron
        `T('clave')`: mira que la pagina declare lo que el guion pide. Una
        TABLA LITERAL no pide nada, asi que le es invisible.

        Y ahi vivian las tres frases que se leen justo debajo del chat en la
        portada. Las ocho lenguas veian «En el cerro · Tu pregunta sube al rack
        del Soberano y vuelve». No lo cazo el gate: lo cazo abrir la web
        publicada en el Doogee.

        La regla es simple: un guion que NO es de una lengua concreta no puede
        llevar una frase castellana suelta. Puede llevarla como RESPALDO
        declarado --segundo argumento de `T(...)`, que es lo que se ve si el
        fichero de la lengua no llega-- y puede llevarla dentro de su propia
        tabla de ocho, si la tiene nombrada aqui abajo.
        """
        import re as _re
        acento = _re.compile(r"[áéíóúñ¿¡ÁÉÍÓÚÑ]")
        for f in sorted((PUBLICO / "assets").glob("*.js")):
            # `corregir-el.js`, `enviar-pt.js`, `prompts-fr.js`: SON de una
            # lengua. Su trabajo es justo llevar prosa dentro.
            if _re.search(r"-(?:es|en|fr|pt|it|de|ru|el)\.js$", f.name):
                continue
            if f.name in self.TABLA_PROPIA:
                continue
            src = f.read_text(encoding="utf-8")
            src = _re.sub(r"/\*.*?\*/", "", src, flags=_re.S)
            # `//` precedido de `:` es una URL dentro de una cadena, no un
            # comentario. Hasta el 2026-09-24 se cortaba igual: la comilla de
            # 'https://...' quedaba abierta, el emparejamiento de comillas se
            # desfasaba y la prosa de detras quedaba FUERA de cadena, sin mirar.
            src = _re.sub(r"(?m)(?<!:)//.*$", "", src)
            # fuera los respaldos declarados: T('clave', '...')
            # (con sus trozos concatenados: T('k', 'uno ' + 'dos') es UN respaldo)
            src = _re.sub(r"T\(\s*'[A-Za-z0-9]+'\s*,\s*'(?:\\.|[^'\\])*'"
                          r"(?:\s*\+\s*'(?:\\.|[^'\\])*')*",
                          "T(", src, flags=_re.S)
            src = _re.sub(r'T\(\s*"[A-Za-z0-9]+"\s*,\s*"(?:\\.|[^"\\])*"',
                          "T(", src, flags=_re.S)
            # Y la otra forma del MISMO trato, que esta casa usa igual:
            # `UI.clave || 'respaldo'`. Sigue significando que el texto sale de
            # un catalogo y que esto es lo que se ve si el catalogo no llego.
            src = _re.sub(r"\|\|\s*'(?:\\.|[^'\\])*'(?:\s*\+\s*'(?:\\.|[^'\\])*')*", "|| X", src)
            src = _re.sub(r'\|\|\s*"(?:\\.|[^"\\])*"', "|| X", src)
            sueltas = []
            for m in _re.finditer(r"'((?:\\.|[^'\\])*)'|\"((?:\\.|[^\"\\])*)\"", src):
                v = m.group(1) or m.group(2) or ""
                if len(v.split()) >= 3 and acento.search(v):
                    sueltas.append(v[:70])
            with self.subTest(guion=f.name):
                self.assertFalse(sueltas,
                    f"{f.name} lleva castellano suelto y lo veran las ocho "
                    f"lenguas: {sueltas}")



class Imagenes(unittest.TestCase):

    def test_no_vuelven_los_raster_retirados(self):
        """Firma F2 del Soberano, 2026-10-10: identidad pura, cero imagenes.

        Antes aqui se pesaban el sprite (despierta + habla < 50 KiB) y las cinco
        laminas (< 30 KiB cada una). Ninguna pagina las pintaba (censo de la capa
        visual); los tests eran lo unico que las mantenia vivas. Ahora se exige
        lo contrario: que no vuelvan."""
        a = PUBLICO / "assets"
        for nombre in ("despierta.webp", "habla.webp", "preceptor-pixel.png"):
            with self.subTest(fichero=nombre):
                self.assertFalse((a / nombre).exists(), f"vuelve {nombre}")
        self.assertEqual(sorted(p.name for p in a.glob("lamina-*")), [], "vuelven las laminas")

    def test_ningun_asset_precacheado_esta_muerto(self):
        """Todo lo que `sw.js` mete en la cache lo pinta alguien.

        El service worker precachea para que la web funcione sin conexion. Un
        asset precacheado y no pintado por nadie es peso que TODOS los
        visitantes descargan y ninguno ve -- y no da la cara como sobra,
        porque el fichero existe y su linea de precache tambien.

        Se encontro asi el 2026-09-02: los ocho `agente-ojo-*.webp` (48 410 B)
        llevaban precacheados desde que se anadieron, y ni `hub.js` ni
        `chat-router.js` los usaban -- los dos pintan `agente-3d-*`. El propio
        comentario de `sw.js` decia para que eran: «la cara es el OJO que el
        cabezal le pone al Preceptor segun con quien hablas». Se diseno, se
        precacheo, y no se conecto.

        LOS NOMBRES SE COMPONEN, y la prueba tiene que saberlo. `hub.js` no
        escribe `agente-3d-coder.webp` en ninguna linea: escribe
        `'/assets/agente-3d-' + a.icono3d + '.webp'`. Buscar el nombre entero
        daria por muertos ocho ficheros bien vivos. Asi que un prefijo que
        alguien concatena cuenta como referencia a toda su familia -- que es
        exactamente lo que el navegador va a pedir.
        """
        sw = (PUBLICO / "sw.js").read_text(encoding="utf-8")
        precacheados = set(re.findall(r"/assets/([\w.-]+\.\w+)", sw))
        for prefijo in re.findall(r"'/assets/([\w-]+-)'\s*\+", sw):
            for f in (PUBLICO / "assets").glob(prefijo + "*"):
                precacheados.add(f.name)

        vivos = ""
        for f in sorted(PUBLICO.rglob("*")):
            if not f.is_file() or f.name == "sw.js":
                continue
            if f.suffix.lower() not in (".html", ".css", ".js", ".mjs", ".json"):
                continue
            vivos += f.read_text(encoding="utf-8")

        # Prefijos que algun consumidor concatena: valen por toda su familia.
        compuestos = tuple(re.findall(r"'/assets/([\w-]+-)'\s*\+", vivos))

        muertos = sorted(
            n for n in precacheados
            if (PUBLICO / "assets" / n).is_file()
            and n not in vivos
            and not any(n.startswith(c) for c in compuestos))
        self.assertFalse(
            muertos,
            "estos assets se precachean y no los pinta nadie -- peso que todos "
            "descargan y nadie ve: " + ", ".join(muertos))


class Contadores(unittest.TestCase):

    def setUp(self):
        self.datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))

    def test_toda_metrica_esta_medida_o_declara_su_causa(self):
        for m in self.datos["metricas"]:
            with self.subTest(metrica=m["clave"]):
                if m["estado"] == "MEDIDO":
                    self.assertIsNotNone(m["valor"])
                    self.assertTrue(m.get("como"), "una cifra medida lleva su metodo al lado")
                else:
                    self.assertEqual(m["estado"], "NO_DATA")
                    self.assertIsNone(m["valor"], "NO_DATA no lleva valor")
                    self.assertTrue(m.get("causa"), "NO_DATA sin causa no es NO_DATA")

    def test_ningun_cero_decorativo(self):
        """Un 0 solo vale si `como` NOMBRA la lectura de la que salio.

        La primera version de esta prueba solo miraba que `como` fuese largo, y
        una prueba de mutacion la pillo: un texto largo y vacio pasaba igual. La
        longitud no es prueba de nada. Ahora se exige vocabulario de medicion
        explicito — es una heuristica, y se dice que lo es, pero distingue "sale
        de medir con performance.getEntriesByType" de un relleno cualquiera.
        """
        medicion = re.compile(r"\bmedid[oa]\b|\bmedir\b|\blectura\b|\bmedicion\b", re.I)
        for m in self.datos["metricas"]:
            if m.get("valor") == 0:
                como = m.get("como", "")
                with self.subTest(metrica=m["clave"]):
                    self.assertTrue(como.strip(), f"{m['clave']} vale 0 y no dice de donde sale")
                    self.assertRegex(como, medicion,
                        f"{m['clave']} vale 0 y su `como` no nombra ninguna lectura: {como!r}")



class Sitemap(unittest.TestCase):

    def test_el_sitemap_no_anuncia_paginas_que_no_estan(self):
        """Un sitemap rancio manda al buscador a un 404 que no ve ningun humano.

        Es exactamente lo que habria pasado el 2026-09-02 al renombrar
        `board.html`: la lista escrita a mano habria seguido anunciandola. Por
        eso `sitemap.py` DERIVA del disco, y por eso esto lo comprueba contra
        el disco tambien.
        """
        xml = (PUBLICO / "sitemap.xml").read_text(encoding="utf-8")
        locs = re.findall(r"<loc>([^<]+)</loc>", xml)
        self.assertTrue(locs, "el sitemap no anuncia nada")
        for loc in locs:
            with self.subTest(url=loc):
                self.assertTrue(loc.startswith(ORIGEN_PROPIO),
                                "una URL del sitemap no es de este origen")
                ruta = loc[len(ORIGEN_PROPIO):].lstrip("/")
                destino = PUBLICO / ruta if ruta else PUBLICO
                if destino.is_dir():
                    destino = destino / "index.html"
                self.assertTrue(destino.exists(), f"el sitemap anuncia {loc}")

    def test_toda_pagina_de_contenido_esta_en_el_sitemap(self):
        """La averia simetrica: la pagina existe y el buscador no la ve."""
        xml = (PUBLICO / "sitemap.xml").read_text(encoding="utf-8")
        for p in paginas_de_contenido():
            rel = p.relative_to(PUBLICO).as_posix()
            esperado = ORIGEN_PROPIO + "/" + rel
            if p.name == "index.html":
                esperado = ORIGEN_PROPIO + "/" + rel[:-len("index.html")]
            with self.subTest(pagina=rel):
                self.assertIn("<loc>" + esperado + "</loc>", xml,
                              f"{rel} no esta en el sitemap")

    def test_robots_apunta_al_sitemap(self):
        r = (PUBLICO / "robots.txt").read_text(encoding="utf-8")
        self.assertIn("Sitemap: " + ORIGEN_PROPIO + "/sitemap.xml", r,
                      "robots.txt no declara el sitemap")


class Reescrituras(unittest.TestCase):
    """La segunda puerta de feedback: la que no le pide nada a nadie.

    `corregir.js` pide sentarse a escribir, y por eso llega poco --medido el
    2026-09-13: la pool de `charla-web` tenia 6 filas y 3 firmas, todas de
    prueba--. `aprender.js` recoge lo que la web ya ve pasar: alguien pregunta,
    no le sirve, y vuelve a preguntar lo mismo con otras palabras.
    """

    def _codigo(self):
        js = (PUBLICO / "assets" / "aprender.js").read_text(encoding="utf-8")
        js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        return re.sub(r"(?m)//.*$", "", js)

    def test_va_donde_va_la_otra_puerta(self):
        """Las dos puertas se cargan juntas o la nueva no existe.

        Una puerta de feedback en una sola pagina es la mitad del error que
        costo la sesion pasada: `corregir.js` vivia solo en `es/index.html` y
        el LorAtelier --la pagina cuyo motivo entero es elegir entre dos
        respuestas-- no producia ni una fila.
        """
        faltan = []
        for q in sorted(PUBLICO.rglob("*.html")):
            t = q.read_text(encoding="utf-8")
            if "assets/corregir.js" in t and "assets/aprender.js" not in t:
                faltan.append(q.relative_to(PUBLICO).as_posix())
        self.assertEqual([], faltan,
                         "estas paginas dejan escribir correcciones y no "
                         "aprenden de las reescrituras: " + ", ".join(faltan))


# Las claves FIRMADAS de cada familia (cierres C4 y C9 del brief). Se enumeran
# una a una a proposito: la gracia es que anadir una clave obligue a tocar esta
# lista y, con ella, las ocho lenguas. Una familia que crece por un lado y no
# por el otro es media traduccion, y media traduccion se ve en produccion.
CLAVES_CAMINOS = {
    f"camino_{n}_{c}"
    # LOS TRES ULTIMOS entraron el 2026-09-20 y van nombrados aqui a proposito:
    # esta lista es la firma. Anadir un peldano tiene que ser una decision, no
    # un descuido, y el gate se cae hasta que alguien lo escribe.
    #   puertos    · el entorno local: que escucha en tu propia maquina
    #   whoami     · el entorno online: que hay de ti ahi fuera
    #   killswitch · cortar, y medir cuanto se deshace de verdad
    # ATLAS fue el piso 9 del 2026-09-25 al 26 y SALIO de la Torre por orden
    # del Soberano: el juego vive tras la puerta theGame, no es un peldano.
    for n in ("despertar", "primeros_pasos", "exposicion", "silencio",
              "contribuir", "puertos", "whoami", "killswitch")
    # `papel` y `corpus` entran el 2026-09-20 y son de otra clase que los
    # cuatro de arriba, asi que se nombran con su porque.
    #   papel  · CON QUIEN cree el modelo que habla en este piso. Sin eso quien
    #            prueba no sabe contra que mide: si le repiten los pasos de
    #            instalacion no puede distinguir un modelo malo de un arnes que
    #            le dijo que hablaba con alguien que acababa de llegar.
    #   corpus · de que datos saldria el adaptador de este piso. Hoy NINGUNO lo
    #            tiene --- medido el 2026-09-20: no hay un solo `preceptor-*`
    #            que sea un afinado, son Modelfiles con system prompt sobre
    #            Mistral --- asi que el campo dice DE DONDE saldria el dato en
    #            vez de «proximamente». Un hueco con su fuente escrita se
    #            rellena; una promesa no.
    for c in ("titulo", "frase", "falla", "para_quien", "papel", "corpus")
} | {"torre_titulo", "torre_lema", "torre_nivel", "torre_paso", "torre_firmar",
     "torre_guia_no_data",
     # `torre_probar` y `torre_firmado` entran el 2026-09-20 arreglando un
     # rotulo mudo: el boton que sube la practica al chat llevaba puesto
     # `torre_paso`, que es el SUSTANTIVO «paso» --- «step», «pas», «Schritt»,
     # «ступень» ---. Un boton etiquetado con un sustantivo no dice que hace, y
     # llevaba asi en las ocho lenguas desde que existe la Torre. Se vio en el
     # navegador, no en el gate: aqui pasaba entero, porque la clave existia y
     # estaba traducida. Una traduccion correcta de la palabra equivocada es
     # justo lo que ninguna prueba de paridad puede cazar.
     "torre_probar", "torre_firmado",
     # `torre_anfitrion` entra el 2026-09-20 y es el PAPEL POSITIVO, que
     # faltaba. El arnes eran tres prohibiciones --- `PR.reglas`: nada de
     # nube, nada de datos personales, si no sabes di NO_DATA --- y ni una
     # linea de que SI hacer. Medido contra el rack ese dia: con solo las
     # prohibiciones, el modelo de la puerta contestaba «NO_DATA» a «no se
     # que es esto», teniendo los hechos del producto delante. Una lista de
     # prohibiciones no es un papel: es un bozal.
     # El texto es el mismo con el que `duelo_mini.py` midio mediana 10 sobre
     # 10 en el juez de la casa, y se copia de ahi a proposito --- un papel
     # medido en el laboratorio y otro escrito para la web serian dos, y el
     # numero solo valdria para uno.
     "torre_anfitrion",
     # `torre_no_enviado` entra el 2026-09-20 y es una promesa en pantalla, no
     # un adorno: firmar NO envia, y no decirlo es la misma mentira que el
     # boton que ponia «firmado» sin firmar nada, con el signo cambiado.
     "torre_no_enviado",
     # `torre_hechos` entra el 2026-09-20 y no es un rotulo: es lo que el
     # modelo SABE del producto cuando contesta desde un piso. Se escribe
     # porque su ausencia se midio. Los tres candidatos del duelo del mini
     # inventaron que es PreceptorOS --- «una distribucion de Linux», «una
     # plataforma para gestionar informacion» --- y no por ser pequenos: el
     # papel nunca se lo habia dicho. Un modelo al que no le das los hechos
     # rellena el hueco, y lo rellena con seguridad.
     "torre_hechos",
     # LOS SIETE `ks_*` ENTRAN EL 2026-09-20 CON LA MUDANZA DEL KILLSWITCH.
     #
     # El panel del Survival Killswitch vivia en la pestaña Proyectos de
     # `community.html`, en las ocho lenguas, y el Soberano lo mando a su
     # sitio: la Torre de la Ascension, en la portada --- donde ya habia un
     # peldano `killswitch` desde que existe la familia. Tener el proyecto en
     # una pagina y su peldano en otra eran dos puertas al mismo sitio.
     #
     # POR QUE AQUI Y NO EN EL `#i18n` DE LA PORTADA, que es donde vivian:
     # `public/el/index.html` tiene 107 bytes libres de los 16.384 y
     # `public/ru/index.html` 539. Siete claves traducidas no caben en el
     # griego ni de lejos. La familia `caminos-<lengua>.json` es donde vive el
     # resto de la Torre, no cuesta un byte de marcado, y ya la carga
     # `camino.js` --- asi que el panel lee sus rotulos de donde lee los suyos
     # el piso que lo contiene, en vez de de otro fichero.
     #
     # Las traducciones NO se escribieron: se copiaron de las ocho
     # `community.html` donde ya estaban. Es la leccion de `torre_anfitrion`,
     # que nunca llego a la interfaz porque la lista se mantenia a mano.
     "ks_sello", "ks_falla", "ks_medido",
     "ks_juez_titulo", "ks_juez_pedir", "ks_juez_sin_turnos",
     "ks_juez_una_capa",
     # EL JUEGO DE PUERTOS del piso 4 (2026-09-25): el rotulo del boton y el
     # sello, nada mas. Su prosa vive en `puertos-<lengua>.json` y se pide al
     # pulsar; aqui solo lo que se pinta antes de pedir nada.
     "pp_abrir", "pp_sello"}

CLAVES_DUELOS = {
    # `duelo_degenera` entra el 2026-09-20 y nombra una acusacion, no un
    # adorno: medido en produccion ese dia, la columna desnuda devolvio
    # «Traducir entre idiomas» unas ciento cincuenta veces seguidas. Sin
    # nombrarlo, quien ve un muro de texto repetido no sabe si la averia es
    # del sitio o del modelo. Es del modelo, y es lo que esta pantalla existe
    # para enseñar.
    "duelo_degenera",
    "duelo_titulo", "duelo_input", "duelo_enviar", "duelo_col_base",
    "duelo_col_lora", "duelo_veredicto", "duelo_guia", "duelo_reescribir",
    "duelo_firmar", "duelo_sin_prueba", "duelo_juez_no_data"}

CLAVES_HERRAMIENTAS = {
    # 2026-09-24: the audio, voice, image and vision panels (herr-medios.js),
    # asked by the Soberano; the catalog is verified by p0x/bin/verifica-medios.py.
    "herr_medios", "herr_medios_nota", "herr_g_voz", "herr_g_musica", "herr_g_imagen",
    "herr_g_vision", "herr_descargar", "herr_copiar", "herr_disponible", "herr_no_un_clic",
    "herr_verificado", "herr_licencia", "herr_lenguas", "herr_no_medido", "herr_flux_mas",
    "herr_titulo", "herr_lema", "herr_web", "herr_app", "herr_audio",
    "herr_cerrada", "herr_copia_ai", "herr_errores",
    # 2026-09-23: la causa del audio deja de ser «cero referencias» (era falsa:
    # existe TALLER_DE_MUSICA.md desde el 09-14), el Agora se muda aqui desde
    # Comunidad, y entran los modelos con su comando de instalacion.
    "herr_audio_causa", "herr_agora", "herr_modelos", "herr_modelos_nota",
    # 2026-09-23: la app a un clic, eligiendo el sistema (`descarga-app.js`).
    "herr_desc_so", "herr_desc_boton", "herr_desc_nix", "herr_desc_win",
    "herr_desc_apk", "herr_desc_ios", "herr_desc_sinprobar", "herr_desc_guia",
    "herr_modelo_casa"}

# LA CUARTA FAMILIA, 2026-09-20. Nace por el mismo motivo que las tres de
# arriba y con la misma forma: los rotulos del motor local no caben en el
# bloque de la portada. Se firma aqui para que anadir uno sea una decision.
CLAVES_MOTOR = set(CLAVES_MOTOR_LISTA)   # una sola lista: ver FUERA_DEL_BLOQUE

# LA QUINTA, 2026-09-23: que se quiere APRENDER en cada piso. Sale de
# `caminos` porque el griego paso del tope al entrar; y es otro asunto --alli
# lo que el piso ES, aqui lo que se mide en el--. El criterio del juez de cada
# piso ira a esta misma familia.
CLAVES_OBJETIVOS = ({f"camino_{n}_aprender" for n in (
    "despertar", "primeros_pasos", "exposicion", "silencio", "contribuir",
    "puertos", "whoami", "killswitch")}
    | {"torre_et_aprender", "torre_et_papel", "torre_et_corpus"}
    # El juez de dos capas (2026-09-23): rotulos, las cinco reglas de la capa
    # determinista y el papel del modelo juez. Los pinta `veredicto.js`.
    # `juez_duelo` es el contexto del juez en el LoRAtelier.
    | {"juez_duelo", 'juez_titulo', 'juez_pedir', 'juez_capa1', 'juez_capa2', 'juez_ok', 'juez_ko', 'juez_degenera', 'juez_recita', 'juez_producto', 'juez_cifras', 'juez_fuga', 'juez_contesta', 'juez_sin_turno', 'juez_papel'})

# LA SEXTA, 2026-09-23: «Mi perfil» deja de ser pagina y pasa a pestaña de
# Comunidad (addendum F.5). Sus textos salieron tal cual de las ocho
# `profile.html` (bloque #i18n + los escritos en el marcado).
CLAVES_PERFIL = {
    'idAviso', 'idClave', 'idEntrar', 'idFallo',
    'idHola', 'idPerfil', 'idPublica', 'pfCargando',
    'pfClaveAviso', 'pfClaveBoton', 'pfClaveCancela', 'pfClaveConfirma',
    'pfClaveEscribe', 'pfClaveFallo', 'pfClaveHecho', 'pfClaveLetra1',
    'pfClaveLetra2', 'pfClavePalabra', 'pfClaveSinIdentidad', 'pfClaveTitulo',
    'pfComoCrear', 'pfDerivado', 'pfGuiaFuerte', 'pfGuiaResto',
    'pfH_app', 'pfH_cla', 'pfH_niv', 'pfH_rack',
    'pfH_ver', 'pfH_yo', 'pfHuella', 'pfInstalada',
    'pfInstalarEnlace', 'pfNiv1', 'pfNiv1Que', 'pfNiv1Sube',
    'pfNiv2', 'pfNiv2Que', 'pfNiv2Sube', 'pfNiv3',
    'pfNiv3Que', 'pfNivSinBronce', 'pfNoInstalada', 'pfPie1f',
    'pfPie1r', 'pfPie2f', 'pfPie2r', 'pfPie3f',
    'pfPie3r', 'pfPieTitulo', 'pfSinClave', 'pfSinIdentidad',
    'pfVerCausa', 'pfVerClave', 'pfVerFecha', 'pfVerQue',
    'pfVerSinCampo', 'pfVerSinFichero', 'prActualizar', 'prAviso',
    'prDesde', 'prFallo', 'prMandando', 'prMaquinaNada',
    'prMaquinaNoLlega', 'prMaquinaOfrece', 'prPseudonimo', 'prRegistrado',
    'prRegistrar', 'prSinIdentidad', 'prSinRegistrar'}

class LasTraduccionesSeSacanYSeMeten(unittest.TestCase):
    """`traducciones.py` saca los textos y los reinserta sin tocar el marcado.

    Entro con el arabe (2026-09-23). Si sacar y meter con la identidad cambiara
    un solo byte, la herramienta de la revision nativa --y de la proxima
    lengua-- estaria rompiendo paginas en silencio."""

    def test_la_identidad_no_cambia_ni_un_byte(self):
        import traducciones as TR
        for l in IDIOMAS:
            for rel, tipo in TR.ficheros(l):
                t = (PUBLICO / rel).read_text(encoding="utf-8")
                with self.subTest(fichero=rel):
                    self.assertEqual(TR.rehace(t, tipo, lambda s: s), t)

    def test_ninguna_familia_lleva_un_rotulo_vacio(self):
        """El pie de Instalar salio como un triangulo SIN rotulo en ocho de nueve
        lenguas durante semanas: `pieTitulo` estaba vacio y solo el griego lo
        tenia. Una cadena vacia no es una traduccion pendiente: es un hueco que
        el gate no veia porque la clave EXISTIA."""
        def hojas(o, r=""):
            if isinstance(o, dict):
                for k, v in o.items():
                    yield from hojas(v, r + "." + k)
            elif isinstance(o, list):
                for i, v in enumerate(o):
                    yield from hojas(v, f"{r}[{i}]")
            elif isinstance(o, str):
                yield r, o
        for f in sorted(PUBLICO.glob("*-??.json")):
            for ruta, valor in hojas(json.loads(f.read_text(encoding="utf-8"))):
                with self.subTest(fichero=f.name, clave=ruta):
                    self.assertTrue(valor.strip(), "rotulo vacio")


class LoQueNoSeVeConElGateVerde(unittest.TestCase):
    """Dos averias que 161 verdes no vieron, medidas el 2026-09-24 en produccion.

    1 · ORDEN DE CARGA. En 8 de las 9 portadas `bronce.js` se cargaba DESPUES de
        `aprender.js` y `elegir.js`. Los dos miran `window.Bronce` al arrancar y,
        si no esta, se retiran sin decir nada: fuera de `es` no habia casillas de
        «aprender» ni de «valorar» en la rueda, y no se capturaba ni una
        reescritura ni una valoracion. Degradar en silencio.
    2 · FAMILIAS A MEDIAS. `cerebros-<l>.json` solo existia en `es` y `en`: las
        otras siete lenguas pintaban los atajos del chat en ingles. Un hueco que
        se conoce se DECLARA aqui; uno nuevo pone el gate en rojo, y uno que se
        cierra sin quitarlo de la lista tambien, para que la lista no mienta.
    """

    DEPENDE = {"aprender.js": "bronce.js", "elegir.js": "bronce.js"}
    HUECOS_DECLARADOS = {
        # familia: lenguas que faltan, con el motivo. Se vacia traduciendo.
        "cerebros": {"fr", "pt", "it", "de", "ru", "el", "ar"},  # pendiente de traducir
        "ledger": {"es"},                                          # es usa ledger.json base
        # theGame habla solo ingles (LENGUAS de thegame.js, 2026-09-28): opinar carga siempre `en`.
        "atlas-opina": {"es", "fr", "pt", "it", "de", "ru", "el", "ar"},
        # La Arena (2026-09-28), con el mismo criterio: el juego habla solo ingles y sus textos se
        # cargan al abrir la pestana.
        "atlas-arena": {"es", "fr", "pt", "it", "de", "ru", "el", "ar"},
        # La casa (2026-10-05), con el mismo criterio: el juego habla solo ingles.
        "atlas-casa": {"es", "fr", "pt", "it", "de", "ru", "el", "ar"},
    }

    def test_lo_que_depende_de_bronce_se_carga_despues(self):
        for idi in IDIOMAS:
            f = PUBLICO / idi / "index.html"
            if not f.exists():
                continue
            t = f.read_text(encoding="utf-8")
            for hijo, padre in self.DEPENDE.items():
                i, j = t.find("/assets/" + padre), t.find("/assets/" + hijo)
                if j < 0:
                    continue
                with self.subTest(pagina=idi, guion=hijo):
                    self.assertTrue(0 <= i < j,
                        f"{idi}/index.html carga {hijo} antes que {padre}: {hijo} "
                        f"se retira en silencio y la rueda se queda sin su casilla")

    def test_cada_familia_por_lengua_esta_completa_o_su_hueco_declarado(self):
        fam = {}
        for f in PUBLICO.glob("*-*.json"):
            m = re.fullmatch(r"(.+)-([a-z]{2})\.json", f.name)
            if m and m.group(2) in IDIOMAS:
                fam.setdefault(m.group(1), set()).add(m.group(2))
        for nombre, tiene in sorted(fam.items()):
            falta = set(IDIOMAS) - tiene
            with self.subTest(familia=nombre):
                self.assertEqual(falta, self.HUECOS_DECLARADOS.get(nombre, set()),
                    f"{nombre}-<l>.json: faltan {sorted(falta)} y el hueco declarado "
                    f"es {sorted(self.HUECOS_DECLARADOS.get(nombre, set()))}")



    def test_cada_pagina_que_captura_tiene_su_puerta_de_salida_y_su_sello(self):
        """Pedido por el Soberano el 2026-09-24: que cada sitio desde el que un
        tester deja una valoracion llegue al rack y lo diga con un sello. Hasta
        ese dia `enviar.js` --la UNICA puerta de salida-- solo estaba en la
        portada: quien firmaba un duelo en el banco o reseñaba una mision de
        Comunidad guardaba su par y no podia mandarlo sin cambiar de pagina."""
        CAPTURAN = ("elegir.js", "corregir.js", "aprender.js", "camino.js",
                    "duelo-firma.js", "resena.js")
        for f in sorted(PUBLICO.glob("*/*.html")):
            idi = f.parent.name
            if idi not in IDIOMAS:
                continue
            t = f.read_text(encoding="utf-8")
            if not any(f'/assets/{c}"' in t for c in CAPTURAN):
                continue
            for guion in ("bronce.js", f"enviar-{idi}.js", "enviar.js", "sello-rack.js"):
                with self.subTest(pagina=f"{idi}/{f.name}", guion=guion):
                    self.assertIn(f'/assets/{guion}"', t,
                        f"{idi}/{f.name} captura pares y no carga {guion}")
            with self.subTest(pagina=f"{idi}/{f.name}", orden="enviar-<l> antes que enviar"):
                self.assertLess(t.find(f"/assets/enviar-{idi}.js"), t.find("/assets/enviar.js"))





FAMILIAS = {"caminos": CLAVES_CAMINOS, "objetivos": CLAVES_OBJETIVOS,
            "perfil": CLAVES_PERFIL,
            "duelos": CLAVES_DUELOS,
            "herramientas": CLAVES_HERRAMIENTAS, "motor": CLAVES_MOTOR}


class LasTresFamilias(unittest.TestCase):
    """Torre, duelo y herramientas: un fichero por asunto y por lengua.

    POR QUE TRES FAMILIAS Y NO UN `i18n/<lengua>.json`. El plan pedia un solo
    fichero por idioma. No cabe: `hub-textos.json`, que cubre SOLO el hub, ya
    pesa 16.094 B de los 16.384 que deja el gate. Un fichero que reuniera toda
    la interfaz del sitio nace pasado de tope el primer dia.

    Y ya habia patron: `taller-<lengua>.json` hace exactamente esto desde el
    2026-09-14. Estas tres son sus hermanas, con su mismo guardian --- que es
    esta clase --- calcado del suyo.

    Lo que NO se toco, y consta: `prompts-*.js` no es interfaz sino el papel
    que se le da al modelo, y su forma `.js` es una decision MEDIDA --- el
    worker no cachea los `.json` que no nombra, asi que en `.json` el chat se
    quedaria sin papel al perder la red.
    """

    @classmethod
    def setUpClass(cls):
        cls.fam = {}
        for nombre in FAMILIAS:
            cls.fam[nombre] = {
                q.stem.split("-", 1)[1]: json.loads(q.read_text(encoding="utf-8"))
                for q in PUBLICO.glob(f"{nombre}-*.json")}


    def test_cada_familia_dice_exactamente_sus_claves_firmadas(self):
        for nombre, firmadas in FAMILIAS.items():
            for idioma, d in sorted(self.fam[nombre].items()):
                with self.subTest(familia=nombre, idioma=idioma):
                    self.assertEqual(firmadas, set(d["ui"]),
                                     f"difiere: {firmadas ^ set(d['ui'])}")
                    self.assertEqual(idioma, d["idioma"],
                                     "el fichero no se reconoce a si mismo")

    def test_ninguna_traduccion_llega_vacia(self):
        """Una cadena vacia pasa la paridad de claves y sale en blanco."""
        for nombre in FAMILIAS:
            for idioma, d in sorted(self.fam[nombre].items()):
                for clave, valor in sorted(d["ui"].items()):
                    with self.subTest(familia=nombre, idioma=idioma, clave=clave):
                        self.assertIsInstance(valor, str)
                        self.assertTrue(valor.strip(), "vacia")


    def test_cada_lengua_dice_de_donde_salio(self):
        """Quien lea esto tiene que poder separar la salida CRUDA del modelo de
        lo que el silicio corrigio a mano. Mezclarlas seria firmar como propio
        lo que no se reviso, y al reves: esconder lo que si se toco."""
        for nombre in FAMILIAS:
            for idioma, d in sorted(self.fam[nombre].items()):
                with self.subTest(familia=nombre, idioma=idioma):
                    proc = d.get("procedencia") or {}
                    self.assertTrue(proc.get("traducido_por"),
                                    "no dice que modelo la produjo")

    def test_el_ruso_y_el_griego_estan_en_su_alfabeto(self):
        """El fallo que ya esta medido en el canon: un modelo pequeno se pasa
        al ingles sin avisar y la paridad de claves lo da por bueno. Aqui se
        mira el ALFABETO, que es lo unico que distingue una traduccion de una
        copia. No juzga la calidad --- de eso va la revision nativa que
        `ESTADO.md` deja pendiente --- solo que no sea otra lengua."""
        rangos = {"ru": ("\u0400", "\u04ff"), "el": ("\u0370", "\u03ff")}
        for idioma, (bajo, alto) in rangos.items():
            for nombre in FAMILIAS:
                d = self.fam[nombre].get(idioma)
                if d is None:
                    continue
                largas = [v for v in d["ui"].values() if len(v) > 25]
                with self.subTest(familia=nombre, idioma=idioma):
                    self.assertTrue(
                        all(any(bajo <= c <= alto for c in v) for v in largas),
                        f"hay cadenas largas sin un solo caracter de su alfabeto")



class ComentarEnTodasLasPaginas(unittest.TestCase):
    """Comentar cualquier pagina, en las nueve lenguas, por el canal que YA llega al rack (Soberano,
    2026-10-05): `Enviar.paquete` -> POST /api/v1/paquetes con `preceptoros/correcciones/1`, firmado
    con la identidad del navegador. Un solo modulo compartido, ningun endpoint nuevo; dice que se envia
    y que no; consentimiento por acto; el texto viaja tal cual."""

    JS = PUBLICO / "assets" / "page-comment.js"


    def test_el_modulo_usa_la_puerta_que_ya_existe_y_no_abre_otra(self):
        self.assertTrue(self.JS.is_file(), "falta public/assets/page-comment.js")
        js = sin_comentarios(self.JS.read_text(encoding="utf-8"))
        self.assertLessEqual(self.JS.stat().st_size, 16 * 1024)
        for malo in ("fetch(", "XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource", "innerHTML", "localStorage"):
            with self.subTest(prohibido=malo):
                self.assertNotIn(malo, js, "el comentario sale por enviar.js y por nada mas")
        self.assertEqual(js.count(".paquete('preceptoros/correcciones/1'"), 1)
        self.assertIn("s.src = '/assets/enviar.js'", js)
        self.assertIn("correccion: texto", js, "el texto no viaja tal cual")
        self.assertNotIn(".trim()", js, "el texto se recorta antes de viajar")
        self.assertIn("tipo: 'comentario'", js, "un comentario entraria en el dataset de correcciones")
        self.assertIn("R.casilla.checked = false; R.estado.textContent = ''", js, "el consentimiento no es por acto")
        env = sin_comentarios((PUBLICO / "assets" / "enviar.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\((API \+ '/\w+')", env), ["API + '/reto'", "API + '/paquetes'"])

    def test_dice_que_se_envia_en_las_nueve_lenguas(self):
        js = self.JS.read_text(encoding="utf-8")
        for l in IDIOMAS:
            with self.subTest(lengua=l):
                m = re.search(r"\n    " + l + r": \[(.*?)\]", js, re.S)
                self.assertTrue(m, f"sin textos en {l}")
                self.assertEqual(len(re.findall(r"'(?:[^'\\]|\\.)*'", m.group(1))), 14, l)
                self.assertIn("{p}", m.group(1), f"{l}: no dice que pagina se envia")


class ElJuegoEnInglesEnLasNueve(unittest.TestCase):
    """theGame habla solo ingles y se presenta en las nueve lenguas de la web (Soberano,
    2026-10-04). Medido jugando en headless: el juego se abria bien en las nueve, pero el aviso
    «This game speaks English for now» caia en la pestana GAME y nadie de /es/ o /ar/ lo veia."""

    def _js(self, n):
        return sin_comentarios((PUBLICO / "assets" / n).read_text(encoding="utf-8"))

    def test_las_lenguas_del_juego_son_solo_ingles(self):
        self.assertIn("var LENGUAS = ['en']", self._js("thegame.js"))
        for n in ("atlas-opina.js",):
            self.assertIn("window.AtlasLengua.actual) || 'en'", self._js(n), n)
        self.assertIn("window.AtlasLengua.actual) || 'en'",
                      sin_comentarios((PUBLICO / "game" / "ui-arena.js").read_text(encoding="utf-8")))

    def test_el_aviso_de_solo_ingles_va_primero_en_la_pestana_de_entrada(self):
        # Desde 2026-10-04 la pestana de entrada es Map (cuatro pestanas: Map, Battle, My node, Help).
        js = self._js("thegame.js")
        primera = re.search(r"var PESTANAS = \[\s*\['(\w+)', '[^']*', '([^']*)'\]", js)
        self.assertTrue(primera, "no encuentro la primera pestana")
        self.assertTrue(primera.group(2).startswith("#atlas-juego > .no-data:first-child"),
                        "el aviso de lengua no va el primero en la pestana de entrada: cae en Help y no se ve")
        self.assertIn(f"muestra('{primera.group(1)}');\n  }}", js, "la capa no abre en la pestana del aviso")
        self.assertLess(js.index(f"['{primera.group(1)}'"), js.index("['partida'"),
                        "la entrada tiene que repartir antes que Help, o Help se lleva el aviso")
        piso = self._js("atlas-piso.js")
        self.assertIn("zona.insertBefore(el('p', 'no-data', U('lengua_nd')", piso)
        self.assertIn("{l}", json.loads((PUBLICO / "atlas-en.json").read_text(encoding="utf-8"))["ui"]["lengua_nd"])

class WebLimpia(unittest.TestCase):
    """Inventario determinista de public/ (2026-10-04). Lo dudoso NO se borra: queda congelado en
    `config/limpieza-propuesta.json` (PROPUESTA, espera firma). Lo que vigila este gate es que no
    nazca basura NUEVA: un fichero que nada nombra, un duplicado exacto o un enlace interno roto."""

    TEXTO = (".html", ".js", ".css", ".json", ".webmanifest", ".xml", ".txt", ".mjs", ".py", ".yml",
             ".md", ".jsonc", ".toml")

    @classmethod
    def setUpClass(cls):
        cls.prop = json.loads((RAIZ / "config" / "limpieza-propuesta.json").read_text(encoding="utf-8"))
        cls.ficheros = sorted(p.relative_to(PUBLICO).as_posix() for p in PUBLICO.rglob("*") if p.is_file())
        corpus = []
        for p in RAIZ.rglob("*"):
            if p.is_file() and p.suffix in cls.TEXTO and ".git" not in p.parts and "__pycache__" not in p.parts:
                corpus.append((p, p.read_text(encoding="utf-8", errors="ignore")))
        cls.corpus = corpus

    def _nombrado(self, rel):
        base = rel.rsplit("/", 1)[-1]
        plantilla = re.sub(r"-(ar|de|el|en|es|fr|it|pt|ru)\.json$", "-", base)
        yo = PUBLICO / rel
        return any((base in t or (plantilla != base and plantilla in t)) for p, t in self.corpus if p != yo)

    def test_ningun_huerfano_nuevo(self):
        huerfanos = {f for f in self.ficheros if not f.endswith("index.html") and not self._nombrado(f)}
        nuevos = sorted(huerfanos - set(self.prop["huerfanos"]))
        self.assertEqual(nuevos, [], "ficheros en public/ que nada nombra (o se usan, o van a la PROPUESTA)")

    def test_la_propuesta_no_lista_ficheros_que_ya_no_existen(self):
        self.assertEqual(sorted(set(self.prop["huerfanos"]) - set(self.ficheros)), [],
                         "la PROPUESTA nombra ficheros borrados: quitalos de la lista")

    def test_ningun_duplicado_exacto_nuevo(self):
        por_hash = {}
        for f in self.ficheros:
            por_hash.setdefault(hashlib.sha256((PUBLICO / f).read_bytes()).hexdigest(), []).append(f)
        conocidos = {tuple(sorted(g)) for g in self.prop["duplicados"]}
        nuevos = [g for g in por_hash.values() if len(g) > 1 and tuple(sorted(g)) not in conocidos]
        self.assertEqual(nuevos, [], "ficheros identicos byte a byte en public/")

    def test_ningun_enlace_interno_roto(self):
        rotos = []
        for f in self.ficheros:
            if not f.endswith((".html", ".css", ".webmanifest")):
                continue
            t = (PUBLICO / f).read_text(encoding="utf-8", errors="ignore")
            for u in re.findall(r"""(?:href|src)\s*=\s*["']([^"'#?]+)""", t) + re.findall(r"url\(\s*['\"]?([^'\")#?]+)", t):
                if re.match(r"^(https?:|//|data:|mailto:|javascript:|tel:)", u) or "{" in u or "+" in u:
                    continue
                d = (PUBLICO / u.lstrip("/")) if u.startswith("/") else ((PUBLICO / f).parent / u)
                d = d.resolve()
                if d.is_dir():
                    d = d / "index.html"
                if not d.exists():
                    rotos.append(f + " -> " + u)
        self.assertEqual(rotos, [])


class Portada(unittest.TestCase):
    """LA PORTADA ES EL JUEGO (mudanza firmada 2026-10-11, bloque 1; plan por capas C1; canon de UI,
    ideas6oct:1711): cabezal arriba y UN SOLO panel debajo con el juego dentro. Sustituye a las pruebas
    del hub retiradas (config/pruebas-retiradas.json)."""

    PERMITIDOS = {"/assets/auth.js", "/assets/consiento.js", "/assets/enviar.js", "/assets/pwa.js",
                  "/assets/page-comment.js", "/assets/thegame.js", "/assets/eaa-art12-local-first-surface.js"}

    def portadas(self):
        yield "raiz", (PUBLICO / "index.html").read_text(encoding="utf-8")
        for l in ("ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"):
            yield l, (PUBLICO / l / "index.html").read_text(encoding="utf-8")

    def test_las_diez_son_la_plantilla(self):
        r = subprocess.run([sys.executable, str(RAIZ / "local_first_surface_build.py"), "--comprueba"], capture_output=True, text=True)
        self.assertEqual(r.returncode, 0, "una portada no es la plantilla (python3 local_first_surface_build.py): " + r.stdout)

    def test_un_solo_panel_y_nada_del_hub(self):
        for l, t in self.portadas():
            with self.subTest(portada=l):
                self.assertEqual(t.count("<main"), 1)
                self.assertIn('<main id="juego-panel"', t)
                self.assertEqual(t.count("<header"), 1)
                for hub in ('id="cabezal"', 'id="i18n"', "chat", "honest-footer", "panel-modelos", "cabezal-rotulos"):
                    self.assertNotIn(hub, t, f"{l}: la portada trae HTML del hub ({hub})")

    def test_solo_carga_lo_que_el_juego_necesita(self):
        """Medido (propuestas/mudanza-20261011/pide.js): Identity, el canal, la PWA y el juego."""
        for l, t in self.portadas():
            with self.subTest(portada=l):
                guiones = set(re.findall(r'<script src="([^"]+)"', t))
                sobran = {g for g in guiones - self.PERMITIDOS if not re.fullmatch(r"/assets/enviar-[a-z]{2}\.js", g)}
                self.assertEqual(sobran, set(), f"{l} carga lo que el juego no pide")
                self.assertIn("/assets/thegame.js", guiones)

    def test_la_pagina_se_reordena_no_carga(self):
        """J10: cambiar de pestana va en startViewTransition, con el cambio de siempre como reserva y SIN
        animacion con movimiento reducido; el contenido final lo pone muestraYa, el mismo de antes."""
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("d.startViewTransition && !rm", tg)
        self.assertIn("else { muestraYa(id, foco); }", tg)
        self.assertIn("prefers-reduced-motion: reduce", tg[tg.index("function muestra(id"):tg.index("function muestraYa")])
        css = (PUBLICO / "assets" / "eaa-art12-local-first-surface.css").read_text(encoding="utf-8")
        self.assertIn("@media (prefers-reduced-motion:reduce){::view-transition-old(root),::view-transition-new(root){animation:none}}", css)
        for red in ("fetch(", "XMLHttpRequest"):
            self.assertNotIn(red, tg[tg.index("function muestra(id"):tg.index("function muestraYa")])

    def test_el_juego_se_monta_en_el_panel_no_encima(self):
        tg = (PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8")
        self.assertIn("var P = document.getElementById('juego-panel');", tg)
        self.assertIn("(P || document.body).appendChild(capa);", tg)
        self.assertIn("if (capa.showModal && !capa.open)", tg)
        self.assertIn("window.TheGame.abre(null", (PUBLICO / "assets" / "eaa-art12-local-first-surface.js").read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
