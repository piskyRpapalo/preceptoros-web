#!/usr/bin/env python3
"""Verificacion de doctrina de preceptoros.org. Biblioteca estandar, nada mas.

    python3 test_web.py

Cada prueba comprueba UNA regla del canon y falla diciendo por que. Una
comprobacion que detecta y no bloquea no es una comprobacion: aqui no hay avisos,
solo verde o rojo.
"""
import gzip
import hashlib, html, json, re, unittest
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
TOPE_FICHERO = 16 * 1024
TOPE_SPRITE = 50 * 1024
TOPE_LAMINA = 30 * 1024


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

    def test_la_portada_publica_lo_que_los_gates_miden(self):
        """La línea de credenciales contra counters.json.

        El 2026-08-30 las tres portadas anunciaban «526 pruebas en verde en la
        app». El gate del MVP daba 429. NINGUN comando producia 526: era una
        cifra publicada, en produccion y en tres idiomas, que nadie podia
        reproducir -- justo lo que honest sensors existe para impedir.

        Escribir el numero bueno a mano no lo arregla: a mano vuelve a derivar
        en cuanto alguien añada un test. Lo que lo arregla es que la cifra sea
        una MEDICION, y que este test falle el dia que deje de serlo.

        Quien MIDE es `p0x/bin/coherencia-publica.py`, que corre los dos gates
        y escribe en counters.json. Quien COMPRUEBA es este test, que solo lee
        ficheros: rapido, sin red, y sin obligar al Agora a tener el repo del
        MVP delante para poder pasar su propio gate.
        """
        datos = json.loads((PUBLICO / "counters.json").read_text(encoding="utf-8"))
        por_clave = {m["clave"]: m for m in datos["metricas"]}
        esperado = []
        for clave in ("pruebas_app", "pruebas_web"):
            m = por_clave.get(clave)
            self.assertIsNotNone(m, f"counters.json no declara {clave}. "
                                 "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")
            esperado.append(m["valor"] if m["estado"] == "MEDIDO" else None)

        portadas = [p for p in PUBLICO.rglob("index.html") if p.parent != PUBLICO]
        self.assertTrue(portadas, "no hay portadas de idioma")
        for p in portadas:
            t = p.read_text(encoding="utf-8")
            bloque = re.search(r'<p class="proof">.*?</p>', t, re.S)
            with self.subTest(fichero=str(p.relative_to(RAIZ))):
                self.assertIsNotNone(bloque, "portada sin línea de credenciales")
                cifras = [int(re.sub(r"\D", "", c))
                          for c in re.findall(r"<b>(\d[\d.\u00a0 ]*)</b>", bloque.group(0))]
                self.assertGreaterEqual(len(cifras), 2,
                                        "la línea no publica dos cifras de pruebas")
                for i, (dice, mide) in enumerate(zip(cifras[:2], esperado)):
                    if mide is None:
                        continue        # el gate salió NO_DATA: no hay con qué comparar
                    self.assertEqual(
                        dice, mide,
                        f"la portada publica {dice} y counters.json mide {mide}. "
                        "Remedio: python3 ~/p0x/bin/coherencia-publica.py --si")

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

    def test_el_onboarding_es_alcanzable_y_completo(self):
        """La puerta de entrada existe, se enlaza y tiene sus cuatro pasos.

        La estrategia pone a los agentes de la web como via de captacion, y el
        Instalador como primer contacto. Una puerta que no se enlaza desde la
        portada existe y no la encuentra nadie: es la forma silenciosa de
        apagar justo lo que va primero. Por eso el enlace se comprueba, no se
        confia.
        """
        for idioma in IDIOMAS:
            ob = PUBLICO / idioma / "onboarding.html"
            with self.subTest(idioma=idioma):
                self.assertTrue(ob.is_file(), f"falta {idioma}/onboarding.html")
                t = ob.read_text(encoding="utf-8")
                for ancla in ("ob-que", "ob-privacidad", "ob-descarga", "ob-conecta"):
                    self.assertIn(f'id="{ancla}"', t, f"falta la seccion {ancla}")
                # Los tres destinos, segun el contrato vigente (plan_v5 y la
                # firma del PARO 1): Android va HOY por Termux -- el APK esta
                # declarado futuro y no se ofrece -- y el escritorio por los
                # dos instaladores.
                self.assertIn('href="./instalar.html#android"', t,
                              "el boton de Android no lleva a la guia de Termux")
                self.assertNotIn("preceptoros.apk", t,
                                 "se esta ofreciendo un APK que no existe")
                # EL ESCRITORIO YA NO ENLAZA FICHEROS QUE NO EXISTEN
                # (2026-09-05). Este guardian exigia
                # `releases/latest/download/install.sh` y su gemelo `.ps1`, y
                # esos dos enlaces daban 404: no hay ninguna release publicada.
                # O sea que el gate estaba en verde EXIGIENDO dos puertas
                # rotas.
                #
                # Y el sitio se contradecia consigo mismo. `instalar.html`
                # enlaza la pagina de versiones --comprobada, responde-- y
                # declara al lado que esta vacia; el onboarding, que es lo
                # PRIMERO que ve quien llega, ofrecia la descarga directa. Dos
                # paginas del mismo sitio diciendo cosas distintas del mismo
                # hecho, y la que prometia iba delante.
                #
                # Ahora los dos botones de escritorio llevan a la guia, que es
                # el unico sitio que consulta el dato de verdad. Cuando haya
                # release, se cambia en un fichero y no en ocho paginas.
                self.assertNotIn("releases/latest/download/", t,
                                 "el onboarding vuelve a ofrecer una descarga "
                                 "directa que hoy da 404")
                self.assertEqual(t.count('href="./instalar.html#descargas"'), 2,
                                 "los dos botones de escritorio no llevan a la "
                                 "guia, que es quien consulta si hay version")
                # Y el ancla de descargas existe de verdad en la guia.
                self.assertIn('id="descargas"',
                              (PUBLICO / idioma / "instalar.html").read_text(encoding="utf-8"),
                              f"{idioma}: la guia no tiene ancla #descargas")
                # Y el ancla tiene que existir de verdad en la guia.
                guia = (PUBLICO / idioma / "instalar.html").read_text(encoding="utf-8")
                self.assertIn('id="android"', guia,
                              f"{idioma}: la guia no tiene ancla #android")
                # Y el aviso de que todavia no existen: un boton que promete
                # una descarga que da 404 es un sensor deshonesto.
                self.assertIn("NO_DATA", t,
                              "el onboarding no declara que los instaladores no estan publicados")
                # Desde la Puerta 6 el cabezal lo construye `hub.js`: las
                # etiquetas escritas en las tres portadas costaban ~300 B en
                # cada una y `fr/index.html` no los tiene. Se comprueba la
                # ALCANZABILIDAD --en el marcado o en un guion que la portada
                # carga-- y no la forma de escribirla.
                #
                # El precio se dice: sin javascript no hay cabezal. La portada
                # ya lo exigia antes de esto (el chat entero lo mueve JS), asi
                # que no se pierde un camino que existiera.
                portada = (PUBLICO / idioma / "index.html").read_text(encoding="utf-8")
                alcanzable = "onboarding.html" in portada
                for src in re.findall(r'<script src="[^"]*?assets/([\w.-]+\.js)"', portada):
                    f = PUBLICO / "assets" / src
                    if f.is_file() and "onboarding.html" in f.read_text(encoding="utf-8"):
                        alcanzable = True
                self.assertTrue(alcanzable,
                                f"{idioma}: el onboarding no se alcanza desde la portada")

    def test_el_codigo_de_vinculo_es_determinista(self):
        """La misma clave publica da siempre el mismo codigo, aqui y en la app.

        Se reimplementa la derivacion en Python y se contrasta con la del JS
        leyendo su alfabeto del propio fichero. Si alguien cambia el alfabeto o
        la longitud en `onboarding.js` y no aqui, este caso cae -- que es justo
        lo que hace falta: dos derivaciones distintas del mismo codigo en dos
        sitios es como se rompen los vinculos sin que nadie se entere.
        """
        js = (PUBLICO / "assets" / "onboarding.js").read_text(encoding="utf-8")
        m = re.search(r"var ALF = '([^']+)'", js)
        self.assertIsNotNone(m, "no se encuentra el alfabeto en onboarding.js")
        alf = m.group(1)
        self.assertEqual(len(alf), 32, "el alfabeto ya no es de 32 simbolos")
        for prohibido in "ILOU":
            self.assertNotIn(prohibido, alf,
                             f"'{prohibido}' se confunde al teclear en un telefono")

        # La misma cuenta que hace el navegador: SHA-256 de la clave publica,
        # un caracter por byte, doce, en tres grupos.
        pub = "3d4f" * 16                     # 32 bytes de ejemplo, en hex
        h = hashlib.sha256(bytes.fromhex(pub)).digest()
        esperado = "".join(alf[b % 32] for b in h[:12])
        esperado = f"{esperado[:4]}-{esperado[4:8]}-{esperado[8:12]}"
        self.assertRegex(esperado, r"^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$")
        # Determinista de verdad: dos veces, lo mismo.
        h2 = hashlib.sha256(bytes.fromhex(pub)).digest()
        self.assertEqual(h, h2)

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

    def test_ninguna_portada_muestra_el_idioma_de_otra(self):
        """El pie honesto vivia escrito a mano en las tres portadas Y EN
        ESPAÑOL: quien abria /en/ o /fr/ se encontraba castellano.

        Un texto visible fuera del bloque i18n no se traduce -- se olvida. Este
        caso lo impide por construccion: si el valor de una clave en un idioma
        aparece en la pagina de otro, cae.
        """
        blocks = {}
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            m = re.search(r'id="i18n"[^>]*>(.*?)</script>', t, re.S)
            self.assertIsNotNone(m, f"{idi}: falta el bloque i18n")
            blocks[idi] = (json.loads(m.group(1)), t)

        for origen, (datos, _) in blocks.items():
            for otro, (_, html) in blocks.items():
                if otro == origen:
                    continue
                for clave, valor in datos.items():
                    # Solo las cadenas largas y REALMENTE distintas: «Benchmark»
                    # es igual en los tres y no prueba nada.
                    if not isinstance(valor, str) or len(valor) < 25:
                        continue
                    if valor == blocks[otro][0].get(clave):
                        continue
                    with self.subTest(de=origen, en=otro, clave=clave):
                        self.assertNotIn(
                            valor, html,
                            f"la portada /{otro}/ muestra el texto de /{origen}/ "
                            f"en la clave `{clave}`")

    def test_el_pie_honesto_no_lleva_texto_escrito_a_mano(self):
        """El pie se rellena desde el i18n, asi que en el HTML esta vacio.

        Si alguien vuelve a escribir un <li> ahi, funcionara -- y volvera a
        estar en un solo idioma para siempre, que es como llego el anterior.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            pie = re.search(r'<footer class="honest-footer">(.*?)</footer>', t, re.S)
            with self.subTest(idioma=idi):
                self.assertIsNotNone(pie, "falta el pie honesto")
                self.assertNotIn("<li>", pie.group(1),
                                 "hay texto escrito a mano en el pie: sácalo al i18n")
                # LAS TRES FRASES SE RETIRARON el 2026-09-05. Eran una lista
                # que `pie.js` rellenaba desde el i18n, y con la placa del chat
                # transparente sobraban: ocupaban el tercio de abajo repitiendo
                # lo que la linea de pruebas ya dice con cifras. Esta linea
                # exigia `id="pie-honesto"`; ahora exige lo que de verdad hay
                # que proteger -- que el pie siga publicando su medida.
                self.assertIn('class="proof"', pie.group(1),
                              "el pie perdio la linea de pruebas")

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

    def test_el_agora_pide_claves_que_existen(self):
        """El mismo guardian que tiene el taller, para la portada de Comunidad.

        `agora-portada.js` pide sus rotulos con `T('clave', 'respaldo')`, y el
        respaldo esta escrito en castellano. Tres claves --`agPaneles`,
        `agNiveles`, `agModera`-- no existian en NINGUNA de las ocho paginas, asi
        que las ocho caian al respaldo y siete publicaban tres titulares en
        espanol en mitad de su idioma. Visto en produccion, en la pagina
        inglesa, el 2026-09-14.

        Un respaldo en castellano es peor que un hueco: no rompe nada, se ve
        razonable, y solo lo nota quien lee las dos lenguas.
        """
        js = (PUBLICO / "assets" / "agora-portada.js").read_text(encoding="utf-8")
        js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        pide = set(re.findall(r"T\('([A-Za-z]+)'", js))
        self.assertTrue(pide, "agora-portada.js no pide ninguna clave")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            bloque = re.search(r'id="i18n">(.*?)</script>', t, re.S)
            tiene = set(json.loads(bloque.group(1)))
            with self.subTest(idioma=idi):
                self.assertFalse(pide - tiene,
                                 f"caen al respaldo en castellano: "
                                 f"{sorted(pide - tiene)}")

    def test_el_loratelier_compara_base_contra_adaptador(self):
        """Un LoRA no se explica: se compara. Y la cicatriz que costo montarlo.

        La tabla dice cuantos tok/s da cada modelo, y eso NO contesta la unica
        pregunta que importa --que cambia en lo que me responde--. Dos pestañas
        sobre el mismo chat la contestan en dos turnos. Medido el 2026-09-14 con
        la misma pregunta: el base contesto que PreceptorOS «es un sistema
        operativo enfocado en aprendizaje automatico» --inventado-- y el de la
        casa que es «un adaptador que se ajusta a tus escritos, el modelo se
        guarda en tu equipo, no en un servidor».

        LA CICATRIZ, y por eso se comprueba el evento en los dos extremos:
        `comparar.js` avisa por `preceptor:localai`, que es el canal que ya
        existia. Pero `elegido` --el modelo que de verdad se manda-- vivia en
        `localai.js` y solo lo tocaba SU lista. Resultado: el evento llegaba,
        el chat cambiaba de via, y la peticion salia con `model: null`. Ollama
        devolvia error y la pagina decia «el motor termino sin emitir ni un
        caracter» en 6 ms: todo correcto y todo inutil.

        Se exige que el DUEÑO del estado escuche su propio evento. Si no, cada
        selector nuevo tiene que acordarse de tocar una variable que no es suya,
        y el que se olvide reproduce un motor aparentemente roto.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "benchmark.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('id="comparar"', t, "el LorAtelier no compara nada")
                # LA COMPARATIVA ES LO UNICO. Hasta el 2026-09-22 aqui se
                # exigia que las pestañas fueran «en el borde de arriba del
                # chat»: habia un chat suelto con su medidor ENCIMA de la
                # comparativa, y habia que bajar para encontrar lo que se venia
                # a ver. El Soberano: «lo primero y unico que debe verse son las
                # ventanas de chat de la comparativa». Ahora se exige lo
                # contrario --- que ese chat suelto NO vuelva --- y que la
                # comparativa (`duelo.js`) siga cargandose.
                self.assertNotIn('id="chat"', t,
                                 "vuelve el chat suelto encima de la comparativa")
                self.assertNotIn('id="pregunta"', t,
                                 "vuelve la caja de un chat que no es el duelo")
                self.assertIn("/assets/duelo.js", t, "sin duelo no hay comparativa")
                self.assertIn("/assets/comparar.js", t)
        cmp = (PUBLICO / "assets" / "comparar.js").read_text(encoding="utf-8")
        self.assertIn("preceptor:localai", cmp,
                      "comparar.js se invento un canal en vez de usar el que hay")
        lai = (PUBLICO / "assets" / "localai.js").read_text(encoding="utf-8")
        self.assertIn("addEventListener('preceptor:localai'", lai,
                      "el dueño de `elegido` no escucha su propio evento: quien "
                      "elija modelo desde fuera mandara `model: null`")

    def test_el_perfil_se_registra_en_el_agora_y_no_manda_de_mas(self):
        """El puente que faltaba, y el limite de lo que cruza por el.

        MEDIDO EL 2026-09-20: el rack aceptaba perfiles desde hacia semanas
        --- `POST /api/v1/profiles` responde 201 y `/api/v1/salud` dice
        `perfiles: 1` --- y la web NO LO LLAMABA NUNCA. Ni un `fetch` a esa
        ruta en todo `public/assets/`. `auth.js` ya sabia firmar exactamente el
        mensaje que el Agora pide, y esa funcion no la usaba nadie.

        Las dos mitades del puente llevaban semanas construidas y sin tocarse.
        Como cada mitad funciona sola, nada se ponia rojo --- y por eso esta
        prueba comprueba la CONEXION y no las piezas.

        Y COMPRUEBA EL LIMITE, que es la otra mitad de la funcion. Mandar el
        `userAgent` entero seria regalar la huella con la que se rastrea a la
        gente por toda la red, en la pagina que promete que lo de aqui se queda
        aqui. Que hoy no se mande no basta: tiene que seguir sin mandarse
        cuando alguien anada un campo mas.
        """
        import re as _re
        pr = PUBLICO / "assets" / "perfil-rack.js"
        self.assertTrue(pr.exists(), "no hay modulo de registro")
        js = pr.read_text(encoding="utf-8")
        # SIN LOS COMENTARIOS, Y DESDE EL PRINCIPIO. Esta bateria se cayo al
        # escribirla porque `firmarTexto` aparece en la PROSA de la cabecera
        # antes que en el codigo, y la comprobacion de orden la encontro ahi.
        # Es la misma trampa que ya tiene el mini-chat anotada --- «una prueba
        # de ausencia se dispara con la prosa que EXPLICA por que algo no
        # esta» --- y la casa la resuelve asi: un fichero que cuenta su
        # historia nombra lo que hace y lo que dejo de hacer, y eso es una
        # virtud. La prueba se adapta, no el comentario.
        # Y el `//` solo es comentario si no viene detras de `:`, o este
        # quitador se come la barra doble de `https://` y deja una cadena
        # partida que luego se mide como si fuera codigo.
        sin_com = _re.sub(r"(?<!:)//.*", "", _re.sub(r"/\*.*?\*/", "", js, flags=_re.S))

        # 1 · LA CONEXION: alguien lo carga, hay ancla, y firma con `auth.js`.
        self.assertIn("window.Identity.firmarTexto", sin_com,
                      "no usa la firma que `auth.js` ya tenia")
        self.assertIn("'|'", sin_com, "no arma `pseudonimo|clave_publica|reto`")
        self.assertIn("/profiles", sin_com, "no llama al extremo del Agora")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "profile.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('id="perfil-rack"', t, "falta el ancla")
                self.assertIn("/assets/perfil-rack.js", t, "nadie lo carga")

        # 2 · EL RETO SE PIDE JUSTO ANTES DE FIRMAR. Vive 300 s y es de un solo
        #     uso: pedirlo al cargar y guardarlo seria firmar uno caducado
        #     mientras alguien lee la pagina.
        self.assertLess(sin_com.index("/reto"), sin_com.index("firmarTexto"),
                        "firma antes de pedir el reto")

        # 3 · NO SE MANDA NADA AL CARGAR. El unico POST vive dentro de la
        #     funcion que cuelga del boton.
        cuerpo_manda = sin_com.split("function manda(")[1].split("\n  function ")[0]
        self.assertIn("method: 'POST'", cuerpo_manda)
        self.assertEqual(sin_com.count("method: 'POST'"), 1,
                         "hay mas de un POST: uno puede estar fuera del boton")

        # 4 · EL LIMITE DE LO QUE SALE. Tres valores gruesos y el motor
        #     elegido; jamas el `userAgent`, que es la huella de rastreo.
        # `navigator.userAgent` SI, `navigator.userAgentData` NO --- y la
        # diferencia es justo la contraria de lo que parece. El primero es la
        # cadena larga con la que se rastrea a la gente por toda la red; el
        # segundo es la API que se invento para no tener que darla, y devuelve
        # una plataforma gruesa («Linux», «Android»). Prohibir el prefijo
        # prohibiria la version buena: la guardia se cayo asi al escribirla.
        self.assertIsNone(_re.search(r"navigator\.userAgent(?!Data)", sin_com),
                          "manda la huella de rastreo del navegador")
        self.assertNotIn("canvas", sin_com.lower(),
                         "huella por canvas en una pagina que promete lo contrario")
        for campo in ("hardwareConcurrency", "deviceMemory"):
            self.assertIn(campo, sin_com, f"se perdio {campo}")

        # 5 · CADA ROTULO QUE PIDE EXISTE EN LAS OCHO. Una clave inventada se
        #     vuelve silencio --- la cicatriz de `envEnCola`.
        pedidas = set(_re.findall(r"T\('(pr[A-Za-z]+)'", sin_com))
        self.assertTrue(pedidas, "no pide ningun rotulo")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "profile.html").read_text(encoding="utf-8")
            m = _re.search(r'id="i18n">(.*?)</script>', t, _re.S)
            d = json.loads(m.group(1))
            with self.subTest(idioma=idi):
                self.assertFalse(pedidas - set(d),
                                 f"rotulos que faltan: {pedidas - set(d)}")

        # 6 · Y LA PAGINA YA NO PROMETE QUE NO HAY EXTREMO. Lo prometia en las
        #     ocho, y con el boton puesto seria mentira en pantalla --- que es
        #     lo que esta casa persigue, no un detalle de redaccion.
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "profile.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertNotIn("no existe todavía un extremo", t)
                self.assertNotIn("no endpoint yet", t)

    def test_el_killswitch_vive_en_la_torre(self):
        """La otra mitad de la mudanza del 2026-09-20.

        Quitar el panel de Comunidad es media ley. Sin esta, el gate quedaria
        contento con el peor resultado posible --- que el Survival Killswitch no
        se pinte en ninguna parte ---, que es exactamente como acaban las
        mudanzas a medias: nadie nota la falta hasta que alguien pregunta por el
        proyecto y no esta.

        SE COMPRUEBA LA CADENA ENTERA, no que el fichero exista. Un modulo que
        nadie carga, o que escucha un aviso que nadie lanza, pasa un test de
        existencia y no pinta nada --- y es justo el fallo que ya costo una
        tarde con `camino-papel.js`, que se cargaba en paralelo y llegaba tarde.
        """
        ks = (PUBLICO / "assets" / "camino-killswitch.js")
        self.assertTrue(ks.exists(), "el panel no tiene modulo")
        js = ks.read_text(encoding="utf-8")

        # 1 · alguien lo carga, y DESPUES de `camino.js`
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("/assets/camino-killswitch.js", router,
                      "nadie carga el panel de la Torre")
        self.assertLess(router.index("/assets/camino.js"),
                        router.index("/assets/camino-killswitch.js"),
                        "el panel se carga antes que la Torre que lo aloja")

        # 2 · hay aviso, y alguien lo escucha. Las dos puntas.
        camino = (PUBLICO / "assets" / "camino.js").read_text(encoding="utf-8")
        self.assertIn("preceptor:torre", camino, "la Torre no avisa de que pinto")
        self.assertIn("preceptor:torre", js, "el panel no escucha el aviso")
        self.assertIn("'piso-' + p", camino, "los pisos no se pueden nombrar")
        self.assertIn("piso-killswitch", js, "el panel no busca su piso")

        # 3 · LOS ROTULOS SALEN DE `caminos-<lengua>.json`, no del `#i18n` de la
        #     portada, donde el griego tiene 107 bytes libres. Se comprueba que
        #     cada clave que el modulo pide existe en las ocho lenguas: una
        #     clave inventada se vuelve silencio, que es la cicatriz de
        #     `envEnCola`.
        import re as _re
        pedidas = set(_re.findall(r"T\('(ks_[a-z_]+)'", js))
        self.assertTrue(pedidas, "el panel no pide ningun rotulo")
        for idi in IDIOMAS:
            d = json.loads((PUBLICO / f"caminos-{idi}.json").read_text(encoding="utf-8"))
            faltan = pedidas - set(d["ui"])
            with self.subTest(idioma=idi):
                self.assertFalse(faltan, f"rotulos que el panel pide y no existen: {faltan}")

        # 4 · EL TELON SE TRAE AL PULSAR. `escenario.js` pesa 16 KB y la portada
        #     no lo carga: cobrarselo a todo el mundo por una pantalla que abre
        #     una minoria es el reves de por que la Torre es perezosa.
        self.assertIn("/assets/escenario.js", js, "el panel no trae su telon")
        # Y SU HOJA. Medido en el navegador el 2026-09-20: sin `escenario.css`
        # el dialogo se pinta `position: static`, dentro del flujo y 3.000
        # pixeles mas abajo --- el gate pasaba entero porque el texto SI estaba
        # en el DOM. Un panel sin su hoja no es un panel, es texto suelto.
        self.assertIn("/assets/escenario.css", js, "el telon viene sin hoja")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "index.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertNotIn("escenario.js", t,
                                 "la portada carga el telon de balde")

    def test_la_plaza_tiene_dos_pestanas_y_el_killswitch_abre(self):
        """La forma de Comunidad, firmada el 2026-09-14.

        Dos cosas que no se miran a la vez --lo que se puede hacer y lo que se
        esta hablando-- y en una sola columna competian por la misma pantalla.

        EL KILLSWITCH YA NO ABRE LA PESTAÑA: se mudo a la Torre el 2026-09-20.
        Esta clausula decia que el panel iba el PRIMERO de proyectos, y era
        correcta mientras el proyecto vivia aqui. El Soberano lo mando a la
        Torre de la Ascension de la portada, donde ya habia un peldano
        `killswitch` --- eran dos puertas al mismo sitio en dos paginas.

        LA GARANTIA SE MUDA CON EL PANEL, NO SE BORRA. Un test que se quita
        cuando estorba deja de ser una ley; aqui pasa a exigir lo contrario ---
        que Comunidad ya NO lo pinte --- y la exigencia positiva --- que la
        Torre si --- vive en `test_el_killswitch_vive_en_la_torre`. Las dos
        juntas impiden lo unico que de verdad duele: que el panel no este en
        ninguna parte, que es como acaban las mudanzas a medias.

        Y EL MINI-CHAT NO HABLA CON UNA IA, que es la razon de que no lleve
        feedback al rack. La regla de la casa es que todo chat de IA recoge
        correccion firmada; este es de personas, asi que no hay respuesta de
        modelo que corregir. Se comprueba por ausencia --ni `fetch` ni `Bronce`--
        porque el dia que alguien meta una IA dentro, este test se cae y obliga a
        enchufar la correccion antes de publicar.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('data-pestanas', t, "la plaza no tiene pestañas")
                for panel in ('proyectos', 'foro'):
                    self.assertIn(f'data-panel="{panel}"', t)
                    self.assertIn(f'data-hoja="{panel}"', t)
                self.assertNotIn('id="killswitch"', t,
                                 "el Killswitch volvio a Comunidad: vive en la "
                                 "Torre desde el 2026-09-20")
                self.assertNotIn('/assets/killswitch.js', t,
                                 "queda el guion del panel viejo")
                self.assertIn('id="taller"', t, "la vitrina se fue con el")
                self.assertIn('id="mini-chat"', t, "la plaza se quedo sin terminal")
        mc = (PUBLICO / "assets" / "minichat.js").read_text(encoding="utf-8")
        # SIN LOS COMENTARIOS. Es la tercera vez esta semana que una prueba de
        # ausencia se dispara con la prosa que EXPLICA por que algo no esta --la
        # guardia de higiene lo hizo dos veces el mismo dia--. Un fichero que
        # cuenta su historia nombra lo que dejo de usar, y eso es una virtud de
        # esta casa, no un descuido: la prueba se adapta, no el comentario.
        codigo = re.sub(r"/\*.*?\*/", "", mc, flags=re.S)
        codigo = re.sub(r"(?m)//.*$", "", codigo)
        self.assertNotIn("fetch(", codigo, "el mini-chat sale por red")

        # LA LEY CAMBIO DOS VECES EL MISMO DIA, y las dos con motivo.
        #
        # Nacio como `assertNotIn("Bronce", mc)`: la Plaza no podia mandar nada
        # al rack porque su texto no sale de una IA. Por la mañana se revirtio
        # --«sin firma no hay dato»-- y la Plaza empezo a firmar cada linea.
        # Por la tarde el Soberano lo corrigio, y la correccion es la buena:
        # ESTO NO ES UNA FUENTE DE DATOS. Es donde la gente habla entre si.
        # Firmar una conversacion de plaza la convierte en material de
        # entrenamiento sin que nadie lo pida, y encima le exige identidad a
        # quien solo queria saludar.
        #
        # Queda escrito porque el guardian solo dice QUE se prohibe, y la
        # segunda vuelta enseña POR QUE: lo que separa a la Plaza de las
        # correcciones no es el canal, es que alli hay una respuesta de un
        # modelo que juzgar y aqui hay personas.
        self.assertNotIn("Bronce", codigo,
                         "la Plaza firma lo que la gente escribe: eso es "
                         "material de entrenamiento que nadie ha ofrecido")
        self.assertNotIn("Identity.firmar", codigo,
                         "la Plaza pide firma para saludar")
        self.assertNotIn("Identity.crear", codigo,
                         "la Plaza le exige una identidad a quien pasaba por ahi")

    def test_debajo_del_cabecero_va_la_ACCION(self):
        """La regla que el Soberano firmo el 2026-09-14, en las dos paginas.

        «Debajo del cabecero debemos ver lo mas user action.» En el Libro de
        Pruebas la accion es el probador --elegir un motor, mandarle un turno,
        ver la medida-- y la tabla es lo que queda cuando alguien ya lo hizo.
        Estaba al reves: un archivo delante de la puerta, que se lee como una
        pagina para consultar y no para usar.

        En Comunidad la accion son las tarjetas de las lineas, y eso lo vigila
        `test_la_vitrina_abre_la_pagina_y_el_NO_DATA_no`. Aqui va la otra mitad
        de la misma regla, y se comprueban por separado porque son dos paginas
        con dos motivos distintos para haberse torcido.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "benchmark.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertLess(
                    t.index('id="probador"'), t.index('id="tabla"'),
                    "la tabla abre el Libro de Pruebas por delante del "
                    "probador: el archivo antes que la puerta")

    def test_la_vitrina_abre_la_pagina_y_el_NO_DATA_no(self):
        """Orden del Soberano, 2026-09-14, mirando la pagina en produccion.

        Lo primero que se leia en Comunidad era «Modelo del periodo: NO_DATA».
        Es verdad y lleva su causa al lado --no hay ninguno firmado todavia--
        pero como puerta de entrada dice «aqui no hay nada» a quien acaba de
        llegar, y lo dice antes de que le de tiempo a ver las siete lineas de
        investigacion que si existen.

        La honestidad no cambia: el NO_DATA sigue en la pagina, con su causa,
        plegado. Lo que cambia es el orden, y el orden es una afirmacion sobre
        que es esta pagina.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                # `hilos` salio de esta lista el 2026-09-14: el tablon se
                # retiro entero y su contenedor ya no existe. Un guardian que
                # vigila un elemento borrado no protege nada y encima se cae.
                # `cerebros-banco` salio el 2026-09-22 con las tarjetas «Elige
                # cerebro», retiradas de Comunidad por orden del Soberano.
                for detras in ("agora-portada",):
                    self.assertLess(
                        t.index('id="taller"'), t.index(f'id="{detras}"'),
                        f"«{detras}» abre la pagina por delante de la vitrina")

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


class ElTaller(unittest.TestCase):
    """El guardian de la vitrina de lineas de investigacion.

    Los textos del taller viven FUERA del bloque #i18n de la pagina, en un
    `taller-<idioma>.json` por lengua. Salirse de aquel guardian sin traer otro
    seria dejar un hueco -- es el mismo trato que se le dio al Hub cuando sus
    textos se mudaron a `hub-textos.json`--, asi que este es el otro.
    """

    @classmethod
    def setUpClass(cls):
        cls.registro = json.loads(
            (PUBLICO / "loratelier.json").read_text(encoding="utf-8"))
        cls.textos = {p.stem.split("-", 1)[1]:
                      json.loads(p.read_text(encoding="utf-8"))
                      for p in PUBLICO.glob("taller-*.json")}

    def test_todas_las_lenguas_del_disco_tienen_su_taller(self):
        """Una lengua sin fichero cae entera al castellano y nadie se entera."""
        self.assertEqual(set(IDIOMAS), set(self.textos),
                         f"lenguas sin taller: {set(IDIOMAS) ^ set(self.textos)}")

    def test_las_ocho_lenguas_dicen_las_mismas_claves(self):
        base_ui = set(self.textos["es"]["ui"])
        base_bl = {b: set(v) for b, v in self.textos["es"]["bloques"].items()}
        for idioma in sorted(set(self.textos) - {"es"}):
            with self.subTest(idioma=idioma):
                t = self.textos[idioma]
                self.assertEqual(base_ui, set(t["ui"]),
                                 f"ui difiere: {base_ui ^ set(t['ui'])}")
                self.assertEqual(set(base_bl), set(t["bloques"]),
                                 "no estan los mismos bloques")
                for b, claves in base_bl.items():
                    self.assertEqual(claves, set(t["bloques"][b]),
                                     f"{b} difiere: {claves ^ set(t['bloques'][b])}")

    # Los rotulos que son MARCA y por eso viajan igual en las ocho lenguas. Se
    # enumeran uno a uno, y esa es toda la gracia: la tentacion al anadir
    # `business` era eximir el campo `nombre` entero, y eso habria abierto
    # justo el agujero que este test tapa -- «El Medidor» SI se traduce, y con
    # la excepcion por campo un dia se quedaria sin traducir sin que saltara
    # nada. Una excepcion nombrada envejece mal a la vista; una categoria
    # envejece en silencio.
    #
    # El criterio para entrar aqui no es «esta en ingles»: es que la palabra
    # sea el NOMBRE DEL PRODUCTO. `textos.py` de la app ya lo dice para el
    # lore: los nombres clave se mantienen como marca. Traducir «PreceptorOS
    # Business» a ocho lenguas es dejar de tener una marca.
    MARCAS = {("business", "nombre")}

    def test_ningun_texto_se_quedo_en_castellano(self):
        """Media lengua traducida es peor que ninguna: nadie sabe cual vale."""
        es = self.textos["es"]
        for idioma in sorted(set(self.textos) - {"es", "en"}):
            for b, campos in self.textos[idioma]["bloques"].items():
                for k, v in campos.items():
                    if (b, k) in self.MARCAS:
                        continue
                    with self.subTest(idioma=idioma, bloque=b, campo=k):
                        self.assertNotEqual(v, es["bloques"][b][k],
                                            "identico al castellano")

    def test_una_marca_dice_lo_mismo_en_las_ocho_lenguas(self):
        """El reverso de la excepcion, para que no sea una amnistia.

        Un rotulo eximido de traducirse tiene que coincidir en TODAS: si en
        seis lenguas dice «Business» y en una dice otra cosa, no es una marca,
        es una traduccion a medias que ademas nadie estaba vigilando.
        """
        for bloque, campo in self.MARCAS:
            valores = {i: t["bloques"][bloque][campo]
                       for i, t in self.textos.items()
                       if bloque in t["bloques"]}
            with self.subTest(marca=f"{bloque}.{campo}"):
                self.assertEqual(
                    len(set(valores.values())), 1,
                    f"«{bloque}.{campo}» esta declarada como marca y no dice "
                    f"lo mismo en todas: {valores}")
                self.assertEqual(
                    set(valores), set(self.textos),
                    "una marca declarada falta en alguna lengua")

    def test_cada_bloque_del_registro_tiene_texto_y_al_reves(self):
        ids = {b["id"] for b in self.registro["bloques"]}
        self.assertEqual(ids, set(self.textos["es"]["bloques"]),
                         "el registro y los textos no hablan de los mismos bloques")

    def test_el_estado_de_un_bloque_sale_del_vocabulario_cerrado(self):
        permitidos = {"en_estudio", "en_entrenamiento", "beta", "disponible",
                      "vision", "NO_DATA"}
        for b in self.registro["bloques"]:
            with self.subTest(bloque=b["id"]):
                self.assertIn(b["estado"], permitidos)

    def test_la_vitrina_vive_donde_se_puede_APORTAR(self):
        """Una sola casa para la vitrina, y es Comunidad desde el 2026-09-13.

        Estaba en `benchmark.html` --el Libro de Pruebas-- y ahi la encuentra
        quien viene a MEDIR un motor, no quien viene a arrimar el hombro. Se
        muda a `community.html`, que es la pagina cuyo trabajo es justo ese.

        Y se comprueba EN LAS DOS DIRECCIONES a proposito. Copiarla en vez de
        mudarla habria sido la salida barata, y el resultado serian dos
        renderizados del mismo registro en dos paginas: el dia que una cambie de
        criterio --que peldanos cuenta, que hueco declara-- las dos diran la
        verdad por separado. Es la averia que este repo lleva un mes pagando en
        otros sitios, y aqui se cierra antes de abrirse.
        """
        piezas = ('id="taller"', '/assets/taller.js', '/assets/taller.css')
        for idioma in IDIOMAS:
            comunidad = (PUBLICO / idioma / "community.html").read_text(encoding="utf-8")
            libro = (PUBLICO / idioma / "benchmark.html").read_text(encoding="utf-8")
            for pieza in piezas:
                with self.subTest(idioma=idioma, pieza=pieza):
                    self.assertIn(pieza, comunidad,
                                  f"{idioma}/community.html no monta la vitrina")
                    self.assertNotIn(pieza, libro,
                                     f"{idioma}/benchmark.html la sigue montando: "
                                     "dos casas para el mismo registro")

    def test_la_barra_solo_existe_donde_hay_peldano(self):
        """La barra mide una ESCALERA declarada, no un porcentaje de pares.

        Se pidio «324 pares firmados de 500» con su barra. Ese recuento no
        existe: ni por linea en `loratelier.json`, ni en ningun otro fichero del
        repo. Lo mas cercano es `agora.json`, que cuenta 3 paquetes firmados en
        TODO el sitio y no dice a que linea pertenecen. Con el denominador
        inventado, la barra seria el dibujo de una medida que nadie tomo.

        Lo que si esta declarado es el peldano: se estudia, se entrena, se
        prueba, se publica. Cuatro, en orden, escritos por quien lleva el
        registro. Este test ata la barra a esa escalera y deja FUERA `vision` y
        `NO_DATA`, que no son el peldano cero de nada -- una barra al 0 % se lee
        como un avance parado, y lo que pasa ahi es que no ha empezado.
        """
        js = (PUBLICO / "assets" / "taller.js").read_text(encoding="utf-8")
        m = re.search(r"var ESCALERA = \[(.*?)\]", js, re.S)
        self.assertIsNotNone(m, "taller.js no declara la escalera")
        escalera = re.findall(r"'([a-z_]+)'", m.group(1))
        self.assertEqual(escalera,
                         ["en_estudio", "en_entrenamiento", "beta", "disponible"],
                         "la escalera cambio de peldanos o de orden")
        for fuera in ("vision", "NO_DATA"):
            self.assertNotIn(fuera, escalera,
                             f"«{fuera}» entro en la escalera y pintaria barra")
        # Y el reverso: un estado del registro que no este en la escalera tiene
        # que caer en el hueco declarado, nunca en una barra a cero.
        self.assertIn("UI.sinBarra", js,
                      "sin el hueco declarado, un estado fuera de la escalera "
                      "no pinta nada y el silencio se lee como un cero")
        for b in self.registro["bloques"]:
            with self.subTest(bloque=b["id"]):
                self.assertTrue(b["estado"] in escalera
                                or b["estado"] in ("vision", "NO_DATA"),
                                f"estado {b['estado']} sin barra ni hueco")

    def test_cada_peldano_tiene_su_palabra_en_las_ocho_lenguas(self):
        """La cicatriz que este test cierra: `beta` no estaba en el mapa.

        El vocabulario cerrado del registro tiene cinco estados y el render solo
        traducia cuatro. `beta` caia al `|| 'estudio'` del final, asi que las dos
        lineas EN PRUEBAS --bienvenida y reclamaciones-- se publicaban con el
        sello «En estudio» en las ocho lenguas. Ni un test rojo: el mapa vivia en
        el render y nadie lo comparaba con el registro.

        Se comprueba contra el MAPA del propio render, no contra una lista
        escrita aqui: si manana entra un sexto estado, el que lo anada al
        registro tiene que anadirlo al mapa, y el que lo anada al mapa tiene que
        traducirlo ocho veces.
        """
        js = (PUBLICO / "assets" / "taller.js").read_text(encoding="utf-8")
        m = re.search(r"var mapa = \{(.*?)\};", js, re.S)
        self.assertIsNotNone(m, "taller.js no declara el mapa de sellos")
        mapa = dict(re.findall(r"(\w+):\s*'(\w+)'", m.group(1)))
        estados = {b["estado"] for b in self.registro["bloques"]}
        self.assertFalse(estados - set(mapa),
                         f"estados del registro sin palabra en el render: "
                         f"{estados - set(mapa)}")
        for estado, clave in sorted(mapa.items()):
            for idioma in sorted(self.textos):
                with self.subTest(estado=estado, idioma=idioma):
                    self.assertTrue(self.textos[idioma]["ui"].get(clave),
                                    f"«{clave}» vacia o ausente en {idioma}")

    def test_el_registro_cumple_su_contrato_formal(self):
        """El esquema de `data/` no es documentacion: valida el fichero vivo.

        Un contrato que nadie ejecuta se separa del dato sin que nadie lo note,
        y entonces las dos cosas dicen la verdad por separado.
        """
        import jsonschema
        esquema = json.loads((RAIZ / "data" / "loratelier_schema.json")
                             .read_text(encoding="utf-8"))
        fallos = list(jsonschema.Draft202012Validator(esquema)
                      .iter_errors(self.registro))
        self.assertEqual(fallos, [],
                         "; ".join("/".join(map(str, f.path)) + ": " + f.message
                                   for f in fallos[:3]))

    def test_sin_artefacto_firmado_no_hay_descarga(self):
        """La regla que hace creible el primer boton cuando llegue.

        Un bloque `disponible` sin `artefacto` y sin `hash` seria una descarga
        ofrecida sin nada que descargar ni forma de comprobarlo.
        """
        for b in self.registro["bloques"]:
            with self.subTest(bloque=b["id"]):
                if b["estado"] == "disponible":
                    self.assertTrue(b.get("artefacto"), "disponible sin artefacto")
                    self.assertTrue(b["artefacto"].get("sha256_hash"),
                                    "artefacto sin sha256")

    def test_los_recuentos_declaran_su_n(self):
        """Una media sin su n no se puede leer, y con n=0 no hay media."""
        for b in self.registro["bloques"]:
            for clave in ("medidas", "tests", "valoraciones"):
                with self.subTest(bloque=b["id"], recuento=clave):
                    self.assertIn("n", b[clave])
                    self.assertIsInstance(b[clave]["n"], int)

    def test_el_render_pide_claves_que_existen(self):
        """Los DOS ficheros del taller, desde que la ficha se mudo al escenario.

        `taller.js` pinta la vitrina, `escenario.js` la pantalla que toma una
        tarjeta al pulsarla, y `resena.js` la review firmada que va dentro. Los
        tres leen el mismo `ui`, y cada corte en dos fue por el tope de 16 KB:
        mirar solo el primero seria dejar dos tercios de los rotulos sin vigilar
        justo despues de partirlos.
        """
        base = set(self.textos["es"]["ui"])
        for fichero in ("taller.js", "escenario.js", "resena.js"):
            js = (PUBLICO / "assets" / fichero).read_text(encoding="utf-8")
            js = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
            for clave in sorted(set(re.findall(r"UI\.([A-Za-z]+)", js))):
                with self.subTest(fichero=fichero, clave=clave):
                    self.assertIn(clave, base,
                                  "el render pide una clave que no existe")

    def test_lo_que_se_PINTA_no_sale_del_registro(self):
        """Su propio contrato lo dice: «no lleva una palabra de prosa».

        Y lo incumplia: `plantilla_inicial` --las preguntas de apertura de cada
        linea, escritas en castellano-- vivia dentro de `loratelier.json`. No
        molestaba mientras no se pintaban en ningun sitio. El 2026-09-14 el
        escenario las saco a la pantalla y aparecieron en castellano en las ocho
        lenguas de golpe.

        Un fichero de hechos no tiene idioma; una frase si. Se mudaron a
        `taller-<idioma>.json` como `plantilla`, que es donde el resto del texto
        ya vivia, y esta prueba impide que vuelvan: la siguiente frase que
        alguien quiera meter en el registro se cae aqui, no en produccion y en
        siete idiomas.

        LAS TRES QUE FALTABAN entraron el mismo dia: `corpus`,
        `prueba_de_fuego` y `adaptador_estado` --el hecho mas util del registro,
        el que dice que los dos modelos fallan como producto-- tambien se leian
        en castellano en las ocho. Ya no estan aqui.

        LO QUE ESTA PRUEBA SIGUE SIN CUBRIR, y por eso se llama por lo que
        PINTA: el registro guarda ademas notas del autor --`por_que_instruct`,
        `se_apoya_en`, `regla_de_los_plazos`-- que son prosa y no las lee nadie
        en pantalla. Mientras no se pinten, no hay idioma que arreglar. El dia
        que alguna salga a la vista, se muda como se mudaron estas, y el nombre
        de este test dice exactamente donde mirar.
        """
        crudo = (PUBLICO / "loratelier.json").read_text(encoding="utf-8")
        for campo in ("plantilla_inicial", "corpus", "prueba_de_fuego",
                      "adaptador_estado"):
            with self.subTest(campo=campo):
                self.assertNotIn(campo, crudo,
                                 "vuelve a haber prosa PINTADA en el fichero "
                                 "de hechos")
        # Y el reverso: donde hay preguntas, las hay en las OCHO.
        con = {b for b, v in self.textos["es"]["bloques"].items() if "plantilla" in v}
        self.assertTrue(con, "ninguna linea tiene preguntas de apertura")
        for idioma in sorted(self.textos):
            with self.subTest(idioma=idioma):
                aqui = {b for b, v in self.textos[idioma]["bloques"].items()
                        if v.get("plantilla")}
                self.assertEqual(con, aqui,
                                 f"preguntas que faltan o sobran en {idioma}: "
                                 f"{con ^ aqui}")

    def test_la_resena_firma_el_MISMO_par_que_ya_existia(self):
        """Una review de una linea no es un esquema nuevo: es una valoracion.

        `elegir.js` ya arma ese par para juzgar una respuesta --`tipo:
        'valoracion'`, `correccion` vacia a proposito, el juicio en `motivo`, el
        pulgar en `sirve`-- y el laboratorio ya sabe leerlo: `ingesta.py` tiene
        su rama y `turnos.py` lo deja FUERA del dataset filtrando en positivo.

        Si la reseña inventara su propia forma, el rack recibiria dos versiones
        del mismo hecho y alguien tendria que traducir entre ellas. Ese traductor
        es donde un dia se pierde el consentimiento -- por eso se comprueba que
        los dos ficheros firman los mismos campos y con el mismo `tipo`.

        Se mira tambien que `correccion` salga VACIA: un texto ahi convierte la
        valoracion en un par de entrenamiento aparentemente valido, y entonces la
        cuarentena de `turnos.py` es lo unico que separa un pulgar de un LoRA.
        """
        r = (PUBLICO / "assets" / "resena.js").read_text(encoding="utf-8")
        e = (PUBLICO / "assets" / "elegir.js").read_text(encoding="utf-8")
        for campo in ("prompt:", "respuesta:", "correccion: ''", "corregido:",
                      "modelo:", "idioma:", "motivo:", "tarea:", "consent: 0",
                      "origen:", "tipo: 'valoracion'", "sirve:"):
            with self.subTest(campo=campo):
                self.assertIn(campo, r, f"la reseña no firma `{campo}`")
                self.assertIn(campo.split(":")[0] + ":", e,
                              "el par de `elegir.js` ya no tiene ese campo: "
                              "los dos tienen que moverse juntos")
        self.assertIn("window.Bronce.guardar", r,
                      "la reseña no entra en el mismo almacen que el resto")
        self.assertNotIn("fetch(", r,
                         "la reseña sale por red: el par firmado NO viaja solo")

    def test_la_tarjeta_abre_el_ESCENARIO(self):
        """Se pulsa la tarjeta y la linea toma la pantalla. Orden del Soberano.

        Tres piezas tienen que estar a la vez y ninguna sirve sola: la vitrina
        tiene que LLAMAR al escenario, la pagina tiene que CARGARLO, y el
        escenario tiene que poder pedirle un turno al rack. Si falta la tercera,
        la tarjeta abre una pantalla con un chat que no sabe hablar -- que es
        peor que no abrir nada, porque promete.
        """
        taller = (PUBLICO / "assets" / "taller.js").read_text(encoding="utf-8")
        self.assertIn("window.Escenario", taller,
                      "la tarjeta no abre el escenario")
        esc = (PUBLICO / "assets" / "escenario.js").read_text(encoding="utf-8")
        self.assertIn("window.Rack", esc,
                      "el escenario no sabe pedirle un turno al rack")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            for pieza in ("/assets/escenario.js", "/assets/escenario.css",
                          "/assets/rack.js", "/assets/state.js"):
                with self.subTest(idioma=idi, pieza=pieza):
                    self.assertIn(pieza, t, f"{idi}/community.html no carga {pieza}")

    def test_la_cura_del_hidden_sigue_DETRAS_de_lo_que_lo_rompio(self):
        """La misma cicatriz del 2026-09-01, vigilada donde de verdad vive.

        Esta prueba exigia `.linea-mas:not([hidden]){display:flex}` en
        `taller.css`. Ese selector desaparecio el 2026-09-14 --el nivel dos de
        la tarjeta ya no se despliega dentro, se abre en el escenario-- y con el
        se iba la unica comprobacion de una averia que fue de TODA la web: un
        `display:inline-block` de autor sobre los botones pisaba la regla del
        navegador que apaga los `[hidden]`, y cualquier boton oculto se veia.

        Se reapunta en vez de borrarse, y se apunta mas cerca del fallo: la cura
        es `[hidden]{display:none}` en `base.css` y **depende del orden**. Si
        alguien reordena la hoja y la deja por encima de la regla de los botones,
        vuelve a perder por especificidad de cascada y el sintoma regresa entero
        sin que nadie lo relacione con esto. Un hueco donde habia una
        comprobacion es exactamente como vuelve la misma averia.
        """
        css = (PUBLICO / "assets" / "base.css").read_text(encoding="utf-8")
        cura = css.find("[hidden]{display:none}")
        self.assertGreater(cura, -1,
                           "base.css perdio la cura: todo boton con `hidden` "
                           "vuelve a verse en la web entera")
        roto = css.find("display:inline-block")
        self.assertGreater(roto, -1, "base.css ya no declara el display de los "
                                     "botones: revisa si esta cura sigue siendo "
                                     "necesaria antes de tocar esta prueba")
        self.assertLess(roto, cura,
                        "`[hidden]{display:none}` quedo POR ENCIMA de la regla "
                        "de los botones: pierde la cascada y los ocultos "
                        "vuelven a verse")


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

    def test_solo_un_cdn_y_es_webllm(self):
        for p, t in textos():
            if p.name == "test_web.py":
                continue
            for url in re.findall(r"https?://[^\s\"'<>)]+", t):
                url = url.rstrip(".,")
                if url.startswith("http://127.0.0.1"):
                    continue                      # localhost del usuario, no un tercero
                if url.startswith(ENLACES_ADMITIDOS):
                    continue                      # enlaces, no subrecursos
                if url.startswith(ESQUEMAS_XML):
                    continue                      # identificadores, no direcciones
                with self.subTest(fichero=p.name, url=url):
                    self.assertTrue(url.startswith(CDN_ADMITIDO),
                                    f"URL externa no admitida en {p}: {url}")

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
                    self.assertEqual(ip, "127.0.0.1", f"IP incrustada en {p}: {ip}")

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

    def test_lo_que_el_modelo_devuelve_pasa_por_el_filtro(self):
        """El bloque de estado se vio DENTRO de la conversacion, en el telefono.

        `[SYSTEM STATE] ... Device: Android Steps: 1 [/SYSTEM`, cortado por la
        mitad -- la firma de un modelo recitando su prompt mientras la
        respuesta se transmite token a token. La web no lo pintaba mal: el
        bloque va en el papel del sistema y ahi es donde tiene que ir. Lo
        devolvia el modelo, y eso no se arregla desde aqui.

        Pero si se puede no enseñarlo, y para eso hay UNA puerta: todo lo que
        el modelo devuelve pasa por `sinFuga` antes de tocar el dialogo. Lo que
        este test cuida no es el filtro --que se prueba solo-- sino que no se
        abra una segunda puerta: el dia que alguien añada otra via de respuesta
        y la pinte cruda, el sintoma vuelve y nadie lo relaciona con esto.

        `di()` se queda fuera a proposito: escribe tambien lo que teclea la
        persona, y a esa no se le tacha una palabra por parecerse a una
        etiqueta.
        """
        estado = (PUBLICO / "assets" / "state.js").read_text(encoding="utf-8")
        self.assertIn("window.sinFuga = function", estado,
                      "state.js ya no expone el filtro que retira su propio "
                      "bloque de estado")
        # LA SEGUNDA PUERTA SE ABRIO el 2026-09-14, y es la que este test temia
        # por escrito: `escenario.js` pinta respuestas de modelo en el chat de
        # cada linea. Entra en la misma pasada -- si se le olvida `sinFuga`, el
        # bloque de estado vuelve a la conversacion por una via que nadie
        # relacionaria con la que ya se arreglo.
        fuentes = "\n".join(
            (PUBLICO / "assets" / f).read_text(encoding="utf-8")
            for f in ("chat.js", "escenario.js"))
        sin_notas = re.sub(r"/\*.*?\*/", "", fuentes, flags=re.S)
        sin_notas = re.sub(r"(?m)//.*$", "", sin_notas)
        # Se miran las asignaciones cuyo valor es lo que ACUMULA el motor
        # --`acc`-- o el parametro con el que se cierra el turno. No todas:
        # `di()` y `estado()` escriben lo que teclea la persona y los avisos de
        # la casa, y filtrar eso seria censurarle una palabra a quien pregunta
        # por parecerse a una etiqueta. La primera version de este test no hizo
        # esa distincion y salio roja sobre tres lineas correctas.
        crudas = [linea.strip()
                  for linea in sin_notas.splitlines()
                  if re.search(r"\.textContent\s*=\s*(acc|t)\s*;", linea)
                  and "sinFuga" not in linea]
        self.assertFalse(crudas,
                         "hay respuesta de modelo que llega al dialogo sin "
                         f"pasar por sinFuga: {crudas}")

    def test_la_esquina_no_puede_bajarse_de_la_linea_del_logo(self):
        """Tres dias de esquina, y esta es la frase que los cierra.

        «Deben estar a la misma altura que el logo, en el margen superior
        derecho SIEMPRE.» Volvio tantas veces porque cada arreglo movia un
        numero para que el caso de aquel dia cuadrara, y el caso siguiente
        --otro idioma, otra pagina, otra anchura-- volvia a romperlo. Lo que se
        exige aqui no son posiciones, que piden navegador: son las tres
        decisiones de estructura que hacen que romperlo deje de ser posible.

        1 · La primera fila es una REJILLA de dos columnas. Con `flex-wrap` la
            colocacion la decide el navegador midiendo, y en cuanto el titulo
            crece el par se cae de linea. En rejilla el par es la columna 2 de
            la fila 1, dicho y no negociado.
        2 · La talla de los dos hermanos sale de UNA variable. Estuvo repartida
            en cuatro reglas y solo coincidian por debajo de 1024: en
            escritorio salian 40 contra 36.
        3 · El hueco del busto NO lo reserva el cabezal entero. Lo hacia, y por
            eso la esquina se quedaba cien pixeles dentro del canto aun estando
            bien colocada. Lo reservan las dos piezas que si cruzan la franja
            de la cara: la frase solar y las cuatro puertas.

        Medido el 2026-09-08 tras el arreglo, en seis paginas por tres anchuras:
        9-10 px del canto derecho, 6-12 del de arriba, cero desnivel entre los
        dos, misma talla, y ninguno pisa la cara.
        """
        hojas = {h.name: h.read_text(encoding="utf-8")
                 for h in (PUBLICO / "assets").glob("*.css")}
        todo = "".join(hojas.values())
        plano = todo.replace(" ", "").replace("\n", "")

        # 1 · la rejilla, y ni un `flex-wrap` que la deshaga
        self.assertIn("grid-template-columns:1frauto", plano,
                      "la primera fila del cabezal ya no es rejilla de dos "
                      "columnas: el par puede volver a caerse de linea")
        self.assertIn("grid-column:2;grid-row:1", plano,
                      "la esquina ya no declara su celda en la fila del logo")
        for nombre, css in hojas.items():
            sin_notas = re.sub(r"/\*.*?\*/", "", css, flags=re.S).replace(" ", "")
            for regla in re.findall(r"\.cab-fila\{([^}]*)\}", sin_notas):
                with self.subTest(hoja=nombre):
                    self.assertNotIn("flex-wrap:wrap", regla,
                                     f"{nombre} devuelve el envoltorio a la "
                                     "fila del cabezal, que es lo que bajaba "
                                     "de linea al par")

        # 2 · una sola talla para los dos
        self.assertIn("--talla-par", plano, "la talla del par dejo de ser una "
                      "sola variable")
        for nombre, css in hojas.items():
            sin_notas = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
            for sel, cuerpo in re.findall(r"([^{}]*(?:lateral-boton|identity-icono)[^{}]*)\{([^}]*)\}", sin_notas):
                if "--talla-par" in cuerpo or " svg" in sel:
                    continue    # el dibujo de dentro no es el boton
                with self.subTest(hoja=nombre, regla=sel.strip()[:60]):
                    self.assertNotRegex(
                        cuerpo.replace(" ", ""), r"(?:^|;)(?:width|height):\d",
                        f"{nombre} vuelve a dar talla a mano a uno de los dos "
                        "hermanos. La talla sale de `--talla-par`, o volveran "
                        "a salir 40 contra 36 en escritorio")

        # 3 · el hueco de la cara no es del cabezal entero
        for nombre, css in hojas.items():
            sin_notas = re.sub(r"/\*.*?\*/", "", css, flags=re.S).replace(" ", "")
            for sel, cuerpo in re.findall(r"([^{}]*)\{([^}]*)\}", sin_notas):
                if not sel.strip().startswith("#cabezal"):
                    continue
                if "cab-solar" in sel or "cab-nav" in sel:
                    continue    # estas dos SI cruzan la franja de la cara
                if re.search(r"#cabezal[^,\s]*$", sel.strip().split(",")[-1]) is None:
                    continue
                with self.subTest(hoja=nombre, regla=sel.strip()[:60]):
                    self.assertNotIn("padding-right:calc(var(--esfera)", cuerpo,
                        f"{nombre} vuelve a reservar el hueco del busto en el "
                        "cabezal entero. La primera fila no cruza la franja de "
                        "la cara --medido: la cara empieza a 63 px y la fila "
                        "acaba a 52-- y esa reserva empuja la esquina cien "
                        "pixeles hacia dentro")

    def test_el_boton_de_cuenta_tiene_de_donde_sacar_su_rotulo(self):
        """El hueco de la cuenta se creaba vacio en la pagina de Instalar.

        Cicatriz del 2026-09-08. `cabezal.js` monta el hueco `#identity` en
        todas las paginas, y `auth.js` es quien pinta dentro. Pero `auth.js`
        abria leyendo el bloque i18n de la pagina y, si no lo encontraba, se
        iba entero. Las ocho `instalar.html` son las unicas sin bloque propio
        --sus textos viven en `/instalar.json`-- asi que ahi la esquina se
        quedaba con la rueda de ajustes SOLA, sin su hermano, en la pagina que
        mas gente abre primero.

        Cuesta verlo porque no hay error: el hueco existe, esta en su sitio, es
        del tamano correcto y no tiene nada dentro. La maqueta estaba bien.

        Lo que se exige es la condicion que hace falta para pintar, no la
        pintura --eso pide navegador--: toda pagina que cargue `auth.js` tiene
        que poder conseguir sus rotulos de cuenta, o de su propio bloque i18n o
        del catalogo `nav.json`, que `nav.py` genera desde la portada para que
        la palabra sea la misma en los dos sitios.
        """
        catalogo = json.loads((PUBLICO / "nav.json").read_text(encoding="utf-8"))
        textos = catalogo.get("textos", {})
        for pagina in sorted(PUBLICO.rglob("*.html")):
            html = pagina.read_text(encoding="utf-8")
            if "auth.js" not in html:
                continue
            with self.subTest(pagina=str(pagina.relative_to(PUBLICO))):
                if 'id="i18n"' in html and "idPerfil" in html:
                    continue    # bloque propio: manda ese, no se pide catalogo
                lengua = pagina.parent.name
                if lengua == "public":
                    lengua = "en"
                self.assertIn(
                    lengua, textos,
                    f"{pagina.name} no trae bloque i18n y nav.json no conoce "
                    f"la lengua «{lengua}». Remedio: python3 nav.py")
                self.assertIn(
                    "idPerfil", textos[lengua],
                    f"{pagina.name} depende del catalogo y ahi no esta "
                    "«idPerfil»: el boton de cuenta se quedaria sin pintar. "
                    "Remedio: anadir la clave a CLAVES en nav.py y regenerar")

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
            opacos = [m.start() for m in re.finditer(
                r"background:var\(--(marmol-claro|violeta)\)", css)]
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


class Foro(unittest.TestCase):
    """La pestaña Foro. ABIERTA el 2026-09-20, y con dos llaves distintas.

    ESTA CLASE HA CAMBIADO DE OBJETO DOS VECES, y las dos por una decision del
    Soberano, no por comodidad. Nacio como `class Tablon`, vigilando nueve
    hilos de EJEMPLO. El 2026-09-14 el foro se cerro y paso a vigilar lo
    contrario: que no hubiera ni un hilo, ni de ejemplo, y que la PUERTA lo
    dijera en las ocho lenguas.

    Hoy el Soberano lo abre, y con una regla que resuelve el bloqueo de
    entonces. Sus palabras:

      «simplemente los usuarios pueden poner un comentario que todos los otros
       registrados puedan ver. Foro solo se abre en nivel 2 como visual. Y
       escritura en nivel 3.»

    Lo que bloqueaba era la moderacion --- `agora.json` lo decia asi: «abrir
    escritura sin ella es abrir un buzon sin nadie que lo lea». La decision que
    faltaba no era quien vacia el buzon, era QUIEN TIENE LLAVE, y son dos:

      nivel 2 · Firmante      hay clave         -> LEE
      nivel 3 · Contribuyente hay trabajo firmado -> ESCRIBE

    ASI QUE LA PUERTA FIJA SE RETIRA Y SU LEY NO. Lo que se vigilaba --- que no
    se finja actividad --- sigue vigilado: `foVacio` dice que vacio es vacio, y
    `test_NO_QUEDA_ni_un_hilo_de_ejemplo` no se toca. Lo que se añade es que la
    puerta ya no puede ser una frase pintada a mano: tiene que derivar el nivel
    de los mismos dos hechos que el Perfil, o «nivel 3» significaria una cosa
    en una pagina y otra en la otra.
    """

    def foro(self, idioma):
        return (PUBLICO / idioma / "community.html").read_text(encoding="utf-8")

    def test_el_foro_lo_pinta_un_guion_y_no_el_marcado(self):
        """La puerta fija se va; el ancla y su guion se quedan.

        Una puerta escrita en el HTML no puede saber que nivel tiene quien
        mira, asi que solo podia decir «registrate» a todo el mundo --- incluso
        a quien ya cumple. Por eso se sustituye en vez de retocarse.
        """
        for idioma in IDIOMAS:
            t = self.foro(idioma)
            with self.subTest(idioma=idioma):
                self.assertNotIn('forum-gate', t,
                    "sigue la puerta fija, que no sabe el nivel de quien mira")
                self.assertIn('id="foro"', t, "no hay ancla del foro")
                self.assertIn('/assets/foro.js', t, "nadie pinta el foro")
                self.assertNotIn('id="hilos"', t,
                    "queda el contenedor del tablon retirado")
                self.assertNotIn('/assets/board.js', t,
                    "sigue cargandose el guion que pintaba los hilos de ejemplo")

    def test_las_dos_llaves_del_foro_y_de_donde_salen(self):
        """Leer en nivel 2, escribir en nivel 3 --- y derivado de los mismos
        dos hechos que el Perfil.

        DOS IDEAS DISTINTAS DE QUE ES UN NIVEL es como se acaba con una pagina
        que te deja escribir y otra que dice que no puedes. `profile-obra.js`
        lo deriva de dos hechos que se pueden mirar en el aparato --- hay clave
        / hay pares en el Bronce --- y aqui tiene que ser exactamente eso.
        """
        js = (PUBLICO / "assets" / "foro.js").read_text(encoding="utf-8")
        sin_com = re.sub(r"//.*", "", re.sub(r"/\*.*?\*/", "", js, flags=re.S))

        # 1 · LOS DOS HECHOS, los mismos que el Perfil.
        obra = (PUBLICO / "assets" / "profile-obra.js").read_text(encoding="utf-8")
        for hecho in ("Identity.quien()", "Bronce.leerTodo()"):
            with self.subTest(hecho=hecho):
                self.assertIn(hecho, sin_com, f"el foro no mira {hecho}")
                self.assertIn(hecho, obra, f"el Perfil ya no mira {hecho}")

        # 2 · SI EL BRONCE NO SE PUEDE LEER, NO SE ADIVINA. Dar por vacio lo
        #     que no se ha podido mirar quitaria un permiso que alguien SI
        #     tiene --- y el error cae del lado que castiga al usuario.
        self.assertIn("catch", sin_com, "el Bronce ilegible no se declara")
        self.assertIn("foSinBronce", sin_com, "no hay NO_DATA para el Bronce")

        # 3 · TEXTO DE OTROS, NUNCA COMO HTML. Es el unico sitio de la casa
        #     donde lo que escribio un desconocido llega a la pantalla.
        self.assertNotIn("innerHTML", sin_com,
                         "el foro pinta texto ajeno como HTML")

        # 4 · LO QUE SE FIRMA INCLUYE EL TEXTO. Firmar solo el reto probaria
        #     quien eres y no QUE ESCRIBES: quien interceptase la peticion
        #     podria cambiar el comentario y la firma seguiria cuadrando.
        self.assertIn("d.reto + '|' + texto", sin_com,
                      "la firma no cubre el comentario")

        # 5 · Y CADA ROTULO EXISTE EN LAS OCHO.
        pedidas = set(re.findall(r"T\('(fo[A-Za-z]+)'", sin_com))
        self.assertTrue(pedidas)
        for idioma in IDIOMAS:
            t = self.foro(idioma)
            bloque = json.loads(re.search(r'id="i18n">(.*?)</script>', t, re.S).group(1))
            with self.subTest(idioma=idioma):
                self.assertFalse(pedidas - set(bloque),
                                 f"rotulos que faltan: {pedidas - set(bloque)}")
                self.assertIn("NO_DATA", bloque["foSinExtremo"],
                              "el hueco del rack se declara, no se insinua")

    def test_NO_QUEDA_ni_un_hilo_de_ejemplo(self):
        """Ni en el marcado ni en el catalogo. Fingir actividad es la mentira
        mas vieja de internet, y media mentira retirada sigue siendo media."""
        hilos = PUBLICO / "threads.json"
        if hilos.is_file():
            d = json.loads(hilos.read_text(encoding="utf-8"))
            self.assertEqual(d.get("hilos"), [],
                "threads.json sigue trayendo hilos de ejemplo")
            self.assertEqual(d.get("hilos_reales"), 0)
        # NO se busca la palabra «ejemplo». Es la TERCERA vez hoy que una
        # prueba de ausencia se dispara con la prosa que EXPLICA la ausencia:
        # el pie dice ahora «los hilos de ejemplo se retiraron», y esa frase es
        # justo lo que se queria conseguir. Lo que se comprueba es la maquina
        # --las claves del tablon y su contenedor-- que es lo que de verdad
        # pintaria un hilo.
        MUERTAS = ("tbEjemplo", "tbReales", "tbFiltros", "tbPublicar",
                   "tbFuenteAgora", "tbFuenteLocal")
        for idioma in IDIOMAS:
            t = self.foro(idioma)
            bloque = json.loads(re.search(r'id="i18n">(.*?)</script>', t, re.S).group(1))
            for clave in MUERTAS:
                with self.subTest(idioma=idioma, clave=clave):
                    self.assertNotIn(clave, bloque,
                        f"«{clave}» es del tablon retirado y sigue declarada")


class Hub(unittest.TestCase):
    """La rejilla de companeros del Agora, su cola de firma y su rack."""

    CARAS = 8

    def setUp(self):
        self.d = json.loads((PUBLICO / "hub.json").read_text(encoding="utf-8"))
        self.js = (PUBLICO / "assets" / "hub.js").read_text(encoding="utf-8")

    def test_el_hub_no_inventa_agentes(self):
        """EL CATALOGO ESTA VACIO A PROPOSITO, y esta prueba se dio la vuelta.

        Hasta el 2026-09-20 exigia OCHO companeros, uno servido y siete
        pendientes. Se retiran enteros ese dia, y el motivo lo dio el Soberano
        sobre una captura de su telefono: «como ves en la primera imagen
        aparece El Instalador, eso fue eliminado hace 3 semanas». Y luego la
        razon de fondo: «los companeros de registro pertenecen al lab, no a la
        web ni a la app».

        LO QUE HAY QUE APRENDER DE ESTO, que no es «habia un rotulo viejo». El
        codigo no fallo: `hub.js` filtra por `real.disponible` y pintaba
        exactamente lo que este fichero declaraba. El dato era lo viejo. Tres
        semanas de una pastilla verde anunciando un companero retirado, con la
        suite entera en verde, porque la suite comprobaba que el catalogo
        fuera COHERENTE consigo mismo y nadie comprueba si un catalogo
        coherente sigue siendo cierto.

        Asi que la regla se invierte en vez de borrarse: el catalogo tiene que
        estar vacio y la retirada tiene que estar FIRMADA dentro del fichero.
        Un hueco donde habia una comprobacion es como vuelve lo mismo dentro
        de seis meses.
        """
        self.assertEqual([], self.d["agentes"],
                         "vuelven companeros al catalogo de la web: su sitio "
                         "es el laboratorio")
        r = self.d.get("retirado")
        self.assertIsInstance(r, dict, "se vacio el catalogo sin decir por que")
        for campo in ("que", "cuando", "porque", "quien_hace_ahora_su_trabajo"):
            with self.subTest(campo=campo):
                self.assertTrue(str(r.get(campo, "")).strip(),
                                f"la retirada no declara `{campo}`")

    def test_la_portada_ofrece_UN_cerebro_y_el_catalogo_sigue_entero(self):
        """La puerta no es el catalogo, y confundirlos cuesta visitantes.

        El 2026-09-08 la portada ofrecia SEIS cerebros, y cuatro eran el mismo
        Mistral 7B con cuatro nombres: `charla-web`, `charla-base`,
        `charla-multi` y `mistral-base`. No es solo exceso de oferta -- es una
        eleccion falsa: cuatro puertas al mismo sitio. Quien llega nuevo no
        elige entre seis; se va.

        Se comprueban LAS DOS mitades, porque arreglar una sola reintroduce el
        fallo por el otro lado: que la puerta ofrezca exactamente dos, y que el
        catalogo siga trayendo los seis. Borrar del catalogo lo que no se enseña
        seria mentir sobre lo que hay, que es la averia contraria y peor.

        La bandera se comprueba en `cerebros.json` y NO en `cerebros-<lang>`,
        porque ese es el fichero del que lee el render: los de idioma son la
        prosa. Se dice porque yo mismo la puse primero en la prosa y la rejilla
        salio VACIA -- una bandera en el fichero que nadie lee no filtra de
        menos, filtra de mas.

        DE DOS A UNA · 2026-09-14, orden del Soberano mirando la pagina en
        produccion. El mismo razonamiento que bajo de seis a dos, un escalon
        mas: dos puertas con su titulo encima --«The Host» y «The Talk»-- se
        leen como dos pestañas, y la portada pasa a tener dos conversaciones
        donde solo hace falta una. El que sale de la puerta no se borra: cae al
        banco de Comunidad, que filtra por `!puerta`. La segunda mitad de la
        prueba sigue intacta y ahora importa mas: borrar del catalogo lo que no
        se enseña seguiria siendo la averia peor.
        """
        reg = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
        cs = reg["cerebros"]
        puerta = [c["id"] for c in cs if c.get("puerta")]
        self.assertEqual(
            1, len(puerta),
            f"cerebros.json marca {len(puerta)} de puerta: {puerta}. La "
            "portada es UNA conversacion, no una lista ni dos pestañas.")
        self.assertGreater(
            len(cs), len(puerta),
            "el catalogo se quedo con solo los de puerta: los demas existen, "
            "estan medidos y tienen que seguir declarados")
        # Y CUAL. El que se queda es el RECOMENDADO, y eso no es una
        # preferencia: `recomendado` ya significaba «el que habla si nadie ha
        # elegido», asi que la puerta y el que contesta por defecto tienen que
        # ser el mismo. Si no, la portada ofrece uno y habla otro.
        # CUAL SEA ES UNA DECISION, Y NO SE CLAVA AQUI. Hasta el 2026-09-20
        # esta linea exigia `charla-base` por su nombre, y ese dia el Soberano
        # lo retiro: la prueba se cayo por hacer bien su trabajo sobre la
        # pregunta equivocada. Un id escrito en un test convierte cada cambio
        # de puerta en una edicion del gate, y un gate que hay que editar para
        # cada decision de producto acaba editandose sin pensar.
        #
        # El invariante SI se queda, y es el que importa: `recomendado` ya
        # significaba «el que habla si nadie ha elegido», asi que la puerta y
        # el que contesta por defecto tienen que ser EL MISMO. Si se separan,
        # la portada ofrece uno y habla otro.
        self.assertEqual(
            puerta, [c["id"] for c in cs if c.get("recomendado")],
            "la puerta y el recomendado se han separado: la portada ofreceria "
            "uno y contestaria otro")
        # Y la puerta tiene que estar MEDIDA. La que entro el 2026-09-20 salio
        # de un duelo con nota; una sin cifras seria una eleccion por intuicion
        # con cara de dato.
        p = [c for c in cs if c.get("puerta")][0]
        for campo in ("prompt", "generacion", "carga_s"):
            with self.subTest(campo=campo):
                self.assertIsInstance(p.get(campo), (int, float),
                                      f"la puerta {p['id']} no declara {campo}")

    def test_cada_cerebro_declara_su_pais_y_la_bandera_existe(self):
        """Una bandera que falta no falla: `onerror` la retira y no se ve.

        Ese es el problema. La tarjeta sale entera, nadie ve un error, y el
        dibujo desaparece sin que nadie se entere -- la misma familia que el
        `<use>` a un simbolo inexistente del Ojo. Por eso el fichero se
        comprueba en disco y no se confia al navegador.

        El pais es el del MODELO BASE, no el del adaptador: los tres `charla-*`
        llevan LoRA entrenado aqui y ondean la francesa igual, porque el modelo
        del que partimos es de Mistral. Ponerles la nuestra seria apropiarnos de
        lo que no hicimos.
        """
        reg = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
        usados = set()
        for c in reg["cerebros"]:
            with self.subTest(cerebro=c["id"]):
                self.assertIn("pais", c, f"{c['id']} no declara pais")
                bandera = PUBLICO / "assets" / "banderas" / f"{c['pais']}.svg"
                self.assertTrue(
                    bandera.is_file(),
                    f"{c['id']} ondea `{c['pais']}` y no hay {bandera.name}")
                usados.add(c["pais"])

        # El NOMBRE del pais va por lengua: un `alt` en castellano en la
        # portada rusa es exactamente lo que este repo lleva meses corrigiendo.
        for f in sorted(PUBLICO.glob("cerebros-*.json")):
            paises = json.loads(f.read_text(encoding="utf-8")).get("paises", {})
            with self.subTest(lengua=f.name):
                self.assertEqual(
                    set(), usados - set(paises),
                    f"{f.name} no nombra {sorted(usados - set(paises))}")

    def test_ninguna_lengua_cae_a_ingles_sin_que_este_declarado(self):
        """El respaldo silencioso de `comparar.js`, con nombre y con lista.

        `comparar.js` corre en las OCHO paginas de benchmark y hace esto:

            fetch('/cerebros-' + lang + '.json')  ...  .then(t => t ||
                fetch('/cerebros-en.json'))

        Medido el 2026-09-20: solo existen `cerebros-es.json` y
        `cerebros-en.json`. Las otras seis lenguas leen la ficha EN INGLES y
        nada en pantalla lo dice. La regla de la casa --ocho lenguas completas
        o no entran-- se estaba cumpliendo en la forma y no en el fondo.

        Esta prueba no exige traducir: exige DECLARAR. Una lengua puede no
        tener prosa, pero entonces tiene que estar en `prosa_pendiente` de
        `cerebros.json` con su causa. Lo que no puede es faltar y que nadie lo
        sepa --- que es lo que pasaba.

        Por que no se traduce y ya: son ~8,8 KB por lengua de texto con voz y
        lore. Medido el 2026-09-19, un 7B devolvio 21 de 21 traducciones
        estructuralmente validas y tres eran impublicables. Con lore el riesgo
        es mayor, no menor, y una ficha mal traducida en la pagina que compara
        modelos es peor que una en ingles declarada.
        """
        reg = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
        pendientes = set((reg.get("prosa_pendiente") or {}).get("idiomas", []))
        causa = (reg.get("prosa_pendiente") or {}).get("causa", "")
        con_prosa = {f.stem.split("-")[-1]
                     for f in PUBLICO.glob("cerebros-*.json")}

        # Solo las lenguas que de verdad ensenan el banco: las que tienen
        # `benchmark.html`. Exigirselo a una lengua sin esa pagina seria pedir
        # traduccion de algo que nadie ve.
        con_banco = {d.name for d in PUBLICO.iterdir()
                     if d.is_dir() and len(d.name) == 2 and d.name.isalpha()
                     and (d / "benchmark.html").is_file()}
        sin_declarar = sorted(con_banco - con_prosa - pendientes)
        self.assertEqual(
            [], sin_declarar,
            f"{sin_declarar} ensenan el banco de cerebros, no tienen "
            "`cerebros-<lang>.json` y NO estan en `prosa_pendiente`. "
            "`comparar.js` les servira ingles sin avisar. Remedio: traducir con "
            "revision nativa, o declararlas en `prosa_pendiente` con su causa.")
        if pendientes:
            self.assertGreater(
                len(causa), 80,
                "`prosa_pendiente` sin causa escrita es un hueco que se "
                "atrofia: nadie sabra que evento lo cierra")
            self.assertTrue(
                (reg.get("prosa_pendiente") or {}).get("despertar"),
                "`prosa_pendiente` necesita condicion de despertar")
        # Y las que SI tienen fichero no pueden estar en la lista de pendientes:
        # una lengua no puede estar traducida y pendiente a la vez.
        for l in sorted(pendientes & con_prosa):
            self.fail(f"«{l}» tiene cerebros-{l}.json y sigue en "
                      "`prosa_pendiente`. Retirala de la lista.")

        # DECLARARLO NO BASTA: hay que USARLO. Los dos guiones que piden
        # `cerebros-<lang>.json` tienen que leer la lista antes de pedir, o
        # seguiran comiendose un 404 en cada visita en seis lenguas --- que es
        # lo que hacian, medido en el navegador el 2026-09-20.
        #
        # Son DOS y no uno, y esto se escribe porque arregle solo `comparar.js`
        # y el 404 siguio saliendo: la portada y community cargan el otro.
        for guion in ("comparar.js", "selector-modelo.js"):
            fuente = (PUBLICO / "assets" / guion).read_text(encoding="utf-8")
            with self.subTest(guion=guion):
                self.assertIn("cerebros-", fuente,
                              "este guion ya no pide la prosa por lengua: "
                              "revisa si sigue haciendo falta vigilarlo")
                self.assertIn(
                    "prosa_pendiente", fuente,
                    f"{guion} pide `cerebros-<lang>.json` sin mirar "
                    "`prosa_pendiente`: volvera el 404 en las seis lenguas "
                    "que no la tienen")

    # Las tres familias que ESPERAN a su renderizador. No las carga nadie
    # todavia --- ni un guion, ni una pagina, ni el precache --- y por eso un
    # barrido de huerfanos se las llevaria. Existen porque la Fase 1 tradujo
    # los textos y la Fase 3 aun no ha escrito quien los pinta.
    # LAS TRES FAMILIAS YA TIENEN RENDERIZADOR, todas el 2026-09-20, y el
    # registro se queda VACIO a proposito en vez de borrarse con la prueba.
    #   caminos      · `camino.js` + `camino-papel.js` · la Torre
    #   duelos       · `duelo.js` + `duelo-firma.js`   · LoRAtelier
    #   herramientas · `herramientas.js`               · el indice de Instalar
    # Vaciarlo y dejar la prueba es lo que convierte esto en un guardian: el
    # dia que alguien traduzca una familia nueva antes de pintarla, la declara
    # aqui y la prueba la protege del barrido de huerfanos. Borrar la prueba
    # con la ultima familia habria dejado a la siguiente sin red.
    ESPERAN_RENDERIZADOR = {}

    def test_lo_traducido_y_sin_pintar_no_se_pierde(self):
        """Una familia traducida y sin pintar NO es basura, y hay que decirlo.

        Esta prueba nacio el 2026-09-20 por la manana con tres familias
        dentro: `caminos`, `duelos` y `herramientas` estaban en las ocho
        lenguas --- 45 claves --- y las referenciaba **cero** ficheros. Un
        barrido de huerfanos las habria borrado en un commit.

        No estaban sueltas por descuido: la Fase 1 tradujo los textos y la
        Fase 3 no habia escrito quien los pinta. Eso es un trabajo a medias
        DECLARADO, que es distinto de un resto olvidado --- y la diferencia
        solo existe si esta escrita en alguna parte.

        LAS TRES SE PINTARON ESE MISMO DIA, por la tarde, y el registro se
        queda vacio. La prueba NO se borra con ellas: vacio, esto es un
        guardian esperando a la siguiente. El dia que alguien traduzca una
        familia antes de escribir su renderizador, la declara aqui y queda
        protegida. Borrarla con la ultima habria dejado a la siguiente sin
        red, que es como se pierde el trabajo hecho.
        """
        for familia, motivo in sorted(self.ESPERAN_RENDERIZADOR.items()):
            ficheros = sorted(PUBLICO.glob(f"{familia}-*.json"))
            lenguas = {f.stem.split("-")[-1] for f in ficheros}
            with self.subTest(familia=familia):
                self.assertEqual(
                    set(IDIOMAS), lenguas,
                    f"{familia}: estan {sorted(lenguas)} y hacen falta las "
                    f"ocho. Si se retira una lengua se retiran todas, y con "
                    f"una razon escrita. Motivo de la familia: {motivo}")
                claves = {f: set(json.loads(f.read_text(encoding="utf-8"))
                                 .get("ui", {})) for f in ficheros}
                todas = set().union(*claves.values())
                self.assertTrue(todas, f"{familia}: ninguna clave en ninguna lengua")
                for f, k in sorted(claves.items()):
                    self.assertEqual(
                        set(), todas - k,
                        f"{f.name} no trae {sorted(todas - k)}")
                self.assertGreater(
                    len(motivo), 60,
                    f"{familia} esta protegida sin decir por que espera")

    def test_el_piso_viste_el_chat_y_no_hereda_al_Instalador(self):
        """LA TORRE ES AHORA EL COMPANERO POR DEFECTO DEL CHAT (2026-09-20).

        Los ocho companeros se fueron al laboratorio ese dia, y con ellos el
        `vestir(H.agente('instalador'))` que ponia el papel del chat. Medido en
        el navegador antes de escribir esta prueba: sin nada en su sitio, el
        cabezal decia «Modelo: ninguno» y el chat se quedaba clavado en
        «Activando modelo». Retirar un mando es retirar tambien lo que lo
        obedecia --- y esta casa ya tenia esa leccion escrita.

        Y EL CIMIENTO DEL PAPEL NO PUEDE SER `PR.papel`, que es literalmente
        «Eres Preceptor, el INSTALADOR de PreceptorOS. Tu unica funcion es que
        la persona consiga instalar el producto». El piso `whoami` --- buscarte
        a ti mismo en internet --- heredaba esa frase. El Soberano habia
        retirado al Instalador tres semanas antes: seguia vivo en la capa que
        de verdad cambia lo que el modelo contesta, que no es la pastilla de la
        pantalla. Se usa `PR.reglas`, que son las tres de la casa y vienen
        traducidas en las ocho lenguas.
        """
        papel = (PUBLICO / "assets" / "camino-papel.js").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", papel, flags=re.S)

        self.assertIn("preceptor:companero", codigo,
                      "el piso no le dice al chat que se cambie de papel")
        self.assertIn("PR.reglas", codigo,
                      "el papel del piso no se apoya en las reglas de la casa")
        self.assertNotIn("PR.papel", codigo,
                         "el piso hereda el papel del Instalador, retirado el "
                         "2026-08-30")

        # NI UNA PALABRA DE CONEXION EN EL PROMPT. Un «lo que promete:» escrito
        # en el codigo saldria en castellano en las ocho lenguas: es el fallo
        # exacto que dejo la portada inglesa diciendo «Write here to talk with
        # El Instalador». Los textos ya vienen traducidos del fichero de la
        # lengua; el codigo solo pone corchetes, que no son de ningun idioma.
        for palabra in ("promete", "significa", "hablas con", "Responde",
                        "El modelo"):
            with self.subTest(palabra=palabra):
                self.assertNotIn(f"'{palabra}", codigo,
                                 "hay prosa castellana dentro del papel que se "
                                 "manda al modelo: saldria asi en las ocho lenguas")

        # El piso 1 viste el chat al entrar, y NO a ciegas: sin cerebro puesto
        # el evento apagaria el chat en vez de cambiarlo.
        torre = (PUBLICO / "assets" / "camino.js").read_text(encoding="utf-8")
        self.assertIn("viste(PELDANOS[0]", re.sub(r"/\*.*?\*/", "", torre, flags=re.S),
                      "nadie viste el chat al arrancar: se queda sin companero")
        self.assertIn("CerebroPuesto", codigo,
                      "el piso no pregunta por el modelo a quien manda sobre el")

    def test_la_Torre_no_pide_rotulos_que_no_existen(self):
        """UNA CLAVE INVENTADA NO FALLA: CALLA. Y eso es peor.

        Medido en el telefono el 2026-09-20. El aviso de «esto no se ha
        enviado» no salia, y el codigo que lo pintaba era este:

            var t2 = (window.ENVT && window.ENVT.envEnCola) || '';
            if (t2) { caja.appendChild(...); }

        `envEnCola` no existe --- las claves de `ENVT` son ocho y ninguna se
        llama asi; me la invente ---. El `|| ''` seguido del `if` convierte una
        clave inexistente en silencio absoluto: ni excepcion, ni hueco en
        pantalla, ni nada en consola. El comentario de encima decia que el
        aviso se ponia. Un respaldo vacio es la forma educada de no avisar.

        Asi que se comprueban las dos direcciones. La paridad de i18n ya exige
        que toda clave declarada exista en las ocho lenguas; esta exige lo
        simetrico --- que toda clave que el codigo PIDE este declarada ---, que
        es el lado por el que se cuela una errata o un invento.
        """
        import re as _re
        fuentes = {n: (PUBLICO / "assets" / n).read_text(encoding="utf-8")
                   for n in ("camino.js", "camino-papel.js", "duelo.js")}
        envt = json.loads(_re.search(
            r"window\.ENVT\s*=\s*(\{.*?\});",
            (PUBLICO / "assets" / "enviar-es.js").read_text(encoding="utf-8"),
            _re.S).group(1))
        caminos = json.loads(
            (PUBLICO / "caminos-es.json").read_text(encoding="utf-8"))["ui"]
        duelos = json.loads(
            (PUBLICO / "duelos-es.json").read_text(encoding="utf-8"))["ui"]

        for nombre, texto in fuentes.items():
            codigo = _re.sub(r"/\*.*?\*/", "", texto, flags=_re.S)
            for clave in sorted(set(_re.findall(r"ENVT\.(\w+)", codigo))):
                with self.subTest(fichero=nombre, envt=clave):
                    self.assertIn(clave, envt,
                                  f"{nombre} pide `ENVT.{clave}` y no existe: "
                                  f"saldria vacio sin decir nada")
            for clave in sorted(set(_re.findall(r"ui\.(torre_\w+)", codigo))):
                with self.subTest(fichero=nombre, caminos=clave):
                    self.assertIn(clave, caminos,
                                  f"{nombre} pide `{clave}` y no esta en "
                                  f"caminos-es.json")
            for clave in sorted(set(_re.findall(r"UI\.(duelo_\w+)", codigo))):
                with self.subTest(fichero=nombre, duelos=clave):
                    self.assertIn(clave, duelos,
                                  f"{nombre} pide `{clave}` y no esta en "
                                  f"duelos-es.json")

    def test_los_ficheros_partidos_traen_lo_que_usan(self):
        """PARTIR UN FICHERO ES LLEVARSE TAMBIEN DE LO QUE COLGABA.

        Medido en produccion el 2026-09-20: al mover `montaVeredicto` a
        `duelo-firma.js` se quedo atras el ayudante `el()` que usa
        VEINTIUNA veces. La caja del veredicto pintaba «el is not defined» y
        nada mas.

        Es la misma leccion que `chat-router.js` tiene escrita desde el
        2026-09-05 --- «retirar un mando es retirar tambien lo que lo
        obedecia» --- con el signo cambiado. Y no la caza `node --check`: la
        sintaxis era correcta, la variable simplemente no existia en ese
        ambito. Solo se vio abriendo la pagina.

        Se comprueba lo minimo que se puede comprobar sin un analizador: que
        cada fichero que USA uno de los ayudantes de la casa lo DEFINA o lo
        reciba como parametro. No cubre todo --- un `var` global seguiria
        colandose --- pero cubre exactamente la forma que fallo.
        """
        import re as _re
        AYUDANTES = ("el", "esND")
        for q in sorted((PUBLICO / "assets").glob("*.js")):
            texto = q.read_text(encoding="utf-8")
            codigo = _re.sub(r"/\*.*?\*/", "", texto, flags=_re.S)
            codigo = _re.sub(r"(?m)//.*$", "", codigo)
            for ayuda in AYUDANTES:
                usa = _re.search(r"[^\w.]" + ayuda + r"\(", codigo)
                if not usa:
                    continue
                define = _re.search(
                    r"(function\s+" + ayuda + r"\s*\(|"
                    r"var\s+" + ayuda + r"\s*=|"
                    r"\b" + ayuda + r"\s*[,)])", codigo)
                with self.subTest(fichero=q.name, ayudante=ayuda):
                    self.assertIsNotNone(
                        define,
                        f"{q.name} usa `{ayuda}()` y no lo define ni lo "
                        f"recibe: se quedo atras al partir el fichero")

    def test_el_duelo_no_entresaca_rotulos_a_mano(self):
        """UNA LISTA DE CLAVES MANTENIDA A MANO SE OLVIDA. Paso el 2026-09-20.

        `duelo.js` juntaba sus dos ficheros de rotulos entresacando tres claves
        del de la Torre:

            UI = Object.assign({}, ds[0].ui, {
              torre_hechos: ..., torre_no_enviado: ... });

        Al añadir el papel positivo se me olvido añadirlo ahi. El duelo pedia
        `UI.torre_anfitrion`, le llegaba `undefined`, y la guarda `if (t && ...)`
        lo saltaba EN SILENCIO: la columna vestida contestaba «NO_DATA» en 3
        tokens, en produccion.

        Y `test_la_Torre_no_pide_rotulos_que_no_existen` NO puede cazarlo: la
        clave SI existe en el fichero de idioma. Lo que faltaba era el
        trasvase. Son dos fallos con la misma cara --- un rotulo que no llega
        --- y distinta causa, y cada uno necesita su guarda.

        Asi que se prohibe la forma que lo produce: las familias se copian
        enteras. No comparten ni una clave --- `torre_*` contra `duelo_*` ---,
        asi que no hay motivo para elegir.
        """
        import re as _re
        js = (PUBLICO / "assets" / "duelo.js").read_text(encoding="utf-8")
        codigo = _re.sub(r"/\*.*?\*/", "", js, flags=_re.S)
        m = _re.search(r"UI\s*=\s*Object\.assign\((.*?)\);", codigo, _re.S)
        self.assertIsNotNone(m, "el duelo ya no junta sus rotulos con assign")
        self.assertNotRegex(
            m.group(1), r"torre_\w+\s*:",
            "el duelo entresaca claves de la Torre a mano: la lista se olvida "
            "en cuanto alguien añade una")

        # Y el arnes se comprueba ENTERO antes de pintar: un duelo cuya columna
        # derecha no tiene papel son dos veces el modelo desnudo.
        for clave in ("torre_anfitrion", "torre_hechos"):
            with self.subTest(clave=clave):
                self.assertIn(clave, codigo,
                              f"el duelo no exige `{clave}` antes de pintar")

    def test_el_duelo_es_secuencial_y_usa_el_arnes_de_la_casa(self):
        """DOS COLUMNAS NO SON DOS TURNOS A LA VEZ, y el rack lo impone.

        `OLLAMA_NUM_PARALLEL=1` y `MAX_LOADED_MODELS=1`: la concurrencia no
        añade capacidad, solo reparte la misma y alarga la espera. Un
        `Promise.all` sobre los dos turnos pintaria dos ruedas girando y
        mentiria sobre lo que pasa al otro lado. Van en fila y cada columna
        enseña SUS segundos.

        Y EL ARNES DE LA DERECHA TIENE QUE SER EL QUE SIRVE LA CASA. Si el
        duelo escribiera su propio texto, esta pantalla compararia contra un
        arnes que el sitio no usa --- y el veredicto que firme la persona no
        valdria para nada, que es peor que no tener veredicto. Sale de
        `PR.reglas` y de `torre_hechos`, exactamente igual que en
        `camino-papel.js`.
        """
        import re as _re
        js = (PUBLICO / "assets" / "duelo.js").read_text(encoding="utf-8")
        codigo = _re.sub(r"/\*.*?\*/", "", js, flags=_re.S)

        # Los dos turnos NO pueden salir de un `Promise.all`. Se busca el
        # nombre de la funcion que pide un turno, no una forma concreta de
        # escribirlo: `turno(` dentro de un `Promise.all` es el error.
        for trozo in _re.findall(r"Promise\.all\((.{0,400}?)\)\s*[.;]", codigo,
                                 _re.S):
            with self.subTest(trozo=trozo[:60]):
                self.assertNotIn("turno(", trozo,
                                 "los dos turnos van en paralelo: el rack los "
                                 "atiende en fila y la pantalla mentiria")

        self.assertIn("PR.reglas", codigo,
                      "el duelo no usa las reglas de la casa")
        self.assertIn("torre_hechos", codigo,
                      "el duelo compara contra un arnes que no es el que sirve "
                      "el sitio")
        self.assertNotIn("PR.papel", codigo,
                         "el duelo hereda el papel del Instalador, retirado")

    def test_LoRAtelier_carga_el_duelo_en_las_ocho_lenguas(self):
        """Y con su cliente del rack delante, que esa pagina no lo tenia.

        `rack.js` solo lo cargaba la portada: Benchmark medía el motor del
        NAVEGADOR, no el del rack. El duelo necesita los dos ficheros y en ese
        orden --- `duelo.js` pide `window.Rack` al pulsar ---, y los dos en el
        shell, o una PWA instalada abre LoRAtelier sin poder explicar siquiera
        que iba a compararse.
        """
        for idioma in IDIOMAS:
            pagina = (PUBLICO / idioma / "benchmark.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idioma):
                i = pagina.find("/assets/rack.js")
                j = pagina.find("/assets/duelo.js")
                self.assertGreater(i, 0, "LoRAtelier no trae el cliente del rack")
                self.assertGreater(j, 0, "LoRAtelier no trae el duelo")
                self.assertLess(i, j, "el duelo se carga antes que su cliente")
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        for pieza in ("/assets/duelo.js", "/assets/rack.js"):
            with self.subTest(pieza=pieza):
                self.assertIn(f"'{pieza}'", listas,
                              f"{pieza} no viaja en el shell")

    def test_el_visitante_NUEVO_tambien_tiene_companero(self):
        """EL CHAT NO PUEDE DEPENDER DE QUE YA HAYAS ELEGIDO CEREBRO.

        Medido en produccion el 2026-09-20 con el `localStorage` limpio: la
        Torre monta y viste el chat ANTES de que `selector-modelo.js` termine
        de cargar `cerebros.json`, asi que `CerebroPuesto()` devolvia vacio, el
        piso 1 no vestia, y el cabezal se quedaba en «Modelo: ninguno» --- sin
        poder dar un solo turno.

        El reintento existia y escuchaba `preceptor:brain`. Pero ese evento
        solo lo dispara un CLIC en el banco de cerebros: **quien llega y no
        toca nada no lo dispara nunca**, que es el caso mayoritario.

        Y NO SE VEIA CON MI NAVEGADOR: tenia un modelo guardado de pruebas
        anteriores y el guardado tapaba el hueco. Es la tercera vez hoy que un
        estado mio de pruebas esconde un fallo que solo sufre quien entra por
        primera vez --- por eso esta prueba mira el CODIGO y no un navegador
        con historia.
        """
        import re as _re
        sel = (PUBLICO / "assets" / "selector-modelo.js").read_text(encoding="utf-8")
        cam = (PUBLICO / "assets" / "camino.js").read_text(encoding="utf-8")
        cod_sel = _re.sub(r"/\*.*?\*/", "", sel, flags=_re.S)
        cod_cam = _re.sub(r"/\*.*?\*/", "", cam, flags=_re.S)

        self.assertIn("preceptor:cerebros", cod_sel,
                      "el selector no anuncia que su registro ya esta cargado")
        self.assertIn("preceptor:cerebros", cod_cam,
                      "la Torre no escucha cuando el registro termina de "
                      "cargar: un visitante nuevo se queda sin companero")
        # Y el aviso tiene que dispararse donde SE CARGA el registro, no en el
        # clic: si solo saliera de `elegir()`, seria el mismo bug con otro
        # nombre.
        i = cod_sel.find("REG = reg")
        j = cod_sel.find("preceptor:cerebros")
        self.assertGreater(i, 0, "el selector ya no asigna REG asi")
        self.assertLess(abs(j - i), 400,
                        "el aviso no sale junto a la carga del registro")

    def test_los_dos_guiones_de_la_Torre_se_cargan_en_orden(self):
        """`camino-papel.js` ANTES que `camino.js`, y los dos en el precache.

        La Torre se partio en dos el 2026-09-20 porque `camino.js` se fue 711 B
        sobre el tope al cablear el boton que viste el chat. El orden importa:
        el segundo pide `window.TorrePapel` del primero. Y los dos tienen que
        estar en el shell, o una PWA instalada abre sin red y se queda sin
        companero --- que es justo el estado roto que se midio esa manana.
        """
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        i = router.find("'/assets/camino-papel.js'")
        j = router.find("'/assets/camino.js'")
        self.assertGreater(i, 0, "el router no trae `camino-papel.js`")
        self.assertGreater(j, 0, "el router no trae `camino.js`")
        self.assertLess(i, j, "el papel se carga DESPUES de quien lo usa")

        # Y EL ORDEN HAY QUE FORZARLO, no basta con insertarlos en orden.
        # Un `<script>` que inserta un guion nace con `async = true` --- al
        # reves que uno escrito en el HTML ---, asi que los dos bajan a la vez
        # y gana el que llegue antes. Medido en el navegador el 2026-09-20: con
        # el cache caliente salia bien; con el frio, `camino.js` arrancaba sin
        # `window.TorrePapel` y la Torre se pintaba SIN el boton de firmar, sin
        # un solo error en consola. Un fallo que depende de quien llegue antes
        # casi nunca pasa en la maquina de quien lo escribe.
        codigo = re.sub(r"/\*.*?\*/", "", router, flags=re.S)
        self.assertIn("async = false", codigo,
                      "los dos guiones de la Torre corren en paralelo: el "
                      "orden de insercion no ordena un script insertado por JS")

        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        for pieza in ("/assets/camino.js", "/assets/camino-papel.js"):
            with self.subTest(pieza=pieza):
                self.assertIn(f"'{pieza}'", listas,
                              f"{pieza} no viaja en el shell: sin red la "
                              f"portada se queda sin companero")

    def test_la_Torre_se_pinta_sin_gastar_un_byte_de_marcado(self):
        """La Torre de la Ascension va en la PORTADA y no cabe como marcado.

        La medida que lo decide: `el/index.html` tiene **107 bytes libres** bajo
        el tope de 16 KiB y `ru/index.html` 539. Una `<section>` de ancla mas un
        `<link>` de hoja no caben en las ocho portadas. Asi que `camino.js` se
        monta solo, se trae su propio estilo, y lo carga `chat-router.js`, que
        ya esta en las ocho y le sobran ~6 KB.

        Lo que esta prueba impide es la regresion facil: que alguien «arregle»
        la Torre metiendole una etiqueta en el HTML. Funcionaria en castellano y
        reventaria el tope en griego, que es como se rompen aqui las cosas.
        """
        camino = PUBLICO / "assets" / "camino.js"
        self.assertTrue(camino.is_file(), "falta camino.js: la Torre no se pinta")

        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("camino.js", router,
                      "nadie carga camino.js: la Torre no llegaria a la pagina")
        self.assertIn("especificaciones", router,
                      "chat-router carga la Torre en TODAS las paginas; solo "
                      "debe hacerlo donde hay donde montarla")

        # CERO MARCADO. Ni la etiqueta ni el ancla ni la hoja en ninguna portada.
        for idioma in IDIOMAS:
            portada = (PUBLICO / idioma / "index.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idioma):
                for prohibido in ('camino.js', 'id="torre"', 'torre.css'):
                    self.assertNotIn(
                        prohibido, portada,
                        f"{idioma}/index.html trae «{prohibido}». La Torre se "
                        "monta desde JS justo porque en griego quedan 107 bytes")

        # Y el texto tiene que existir donde el guion lo va a buscar.
        fuente = camino.read_text(encoding="utf-8")
        self.assertIn("/caminos-", fuente, "camino.js ya no lee su familia")
        for idioma in IDIOMAS:
            f = PUBLICO / f"caminos-{idioma}.json"
            with self.subTest(idioma=idioma):
                self.assertTrue(f.is_file(), f"falta {f.name}")

        # Los cinco peldanos que el guion nombra tienen que estar traducidos.
        import json as _j
        ui = _j.loads((PUBLICO / "caminos-es.json").read_text(encoding="utf-8"))["ui"]
        for peldano in ("despertar", "primeros_pasos", "exposicion",
                        "silencio", "contribuir"):
            with self.subTest(peldano=peldano):
                self.assertIn(f"'{peldano}'", fuente,
                              "camino.js no nombra este peldano")
                for campo in ("titulo", "frase", "falla", "para_quien"):
                    self.assertIn(f"camino_{peldano}_{campo}", ui,
                                  f"falta camino_{peldano}_{campo}")

        # EL BOTON DE FIRMAR NO SE PINTA, y eso es a proposito: el Agora
        # responde `escritura: cerrada`. Un boton que no lleva a ningun sitio
        # promete un camino y lo corta sin decirlo.
        self.assertIn("NO_DATA", fuente,
                      "camino.js ya no declara por que no se puede firmar")

        # LA TORRE NO SE DESBLOQUEA. Firmado por el carbono el 2026-09-20: es
        # accesible en todos los niveles y tiene que incentivar el aprendizaje,
        # no repartir permisos. Un candado se cuela facil --- basta una linea
        # que mire un contador de pasos firmados --- y una vez colado nadie lo
        # quita, porque «ya estaba asi».
        # SE MIRA EL CODIGO, NO LA PROSA. La primera version buscaba en el
        # fichero entero y se cazo a si misma: la cabecera de `camino.js`
        # explica el principio y usa la palabra «desbloqueable» para decir que
        # NO lo es. Un guardian que no distingue una regla de su explicacion
        # obliga a no escribir la explicacion, que es justo al reves.
        codigo = re.sub(r"/\*.*?\*/", "", fuente, flags=re.S)
        codigo = re.sub(r"^\s*//.*$", "", codigo, flags=re.M)
        for candado in ("locked", "bloquead", "desbloque", "requiere",
                        "completad", "prerequisito"):
            self.assertNotIn(
                candado, codigo.lower(),
                f"camino.js menciona «{candado}»: la Torre no reparte "
                "permisos. Todos los peldanos estan abiertos desde la primera "
                "visita; el numero es un ORDEN, no una llave")

        # Y el contrato se pinta: el lema dice que ningun peldano obliga al
        # siguiente, y tiene que estar en las ocho lenguas.
        self.assertIn("torre_lema", fuente,
                      "camino.js ya no pinta el lema, que es donde la Torre "
                      "dice que no obliga a nada")
        for idioma in IDIOMAS:
            d = _j.loads((PUBLICO / f"caminos-{idioma}.json")
                         .read_text(encoding="utf-8"))["ui"]
            with self.subTest(idioma=idioma, clave="torre_lema"):
                self.assertTrue(d.get("torre_lema", "").strip(),
                                "sin lema, la Torre parece una escalera con "
                                "peaje")

    def test_las_tarjetas_no_traen_logos_de_empresa(self):
        """Firmado el 2026-09-08: solo bandera, sin logo.

        Lo que habia no eran logos de empresa sino tres dibujos de linea de la
        casa --el de Mistral era una silueta de montanas-- puestos como
        marcador. Un logo PARECIDO al oficial es peor que ninguno: le dice a
        quien lo reconoce que aqui se copia de memoria, en un sitio que se
        vende por no hacer eso. Y traerlos de un CDN choca con la promesa de
        cero peticiones externas.

        El gate mira las tres capas, porque quitarlo de una sola deja el resto
        como ruina que la proxima sesion resucita sin saber por que estaba.
        """
        js = (PUBLICO / "assets" / "selector-modelo.js").read_text(encoding="utf-8")
        self.assertNotIn("cerebro-logo", js, "el render sigue pintando logo")
        css = (PUBLICO / "assets" / "nubes.css").read_text(encoding="utf-8")
        self.assertNotIn("cerebro-logo", css, "queda regla de logo en el css")
        reg = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
        for c in reg["cerebros"]:
            with self.subTest(cerebro=c["id"]):
                self.assertNotIn("logo", c, "el registro sigue declarando logo")
        self.assertFalse((PUBLICO / "assets" / "logos-models").exists(),
                         "los ficheros de logo siguen en disco")

    def test_elige_cerebro_ya_no_existe_y_el_piso_decide(self):
        """«Elige cerebro» se retiro de la portada y de Comunidad (2026-09-22).

        Sustituye a la prueba que vigilaba el filtro por `puerta` de aquellas
        tarjetas: el filtro ya no existe porque las tarjetas no existen. Lo que
        hay que vigilar ahora es lo que las sustituye --el reparto por piso--,
        y que las tarjetas no vuelvan por un parche de otra sesion.
        """
        sel = (PUBLICO / "assets" / "selector-modelo.js").read_text(encoding="utf-8")
        for pieza in ("cerebros-rejilla", "'Elige cerebro'", "cerebros-banco"):
            self.assertNotIn(pieza, sel, f"vuelve el banco de tarjetas: {pieza}")
        self.assertIn("window.CerebroDelPiso", sel,
                      "el selector ya no obedece al piso abierto")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertNotIn('id="cerebros-banco"', t)

    def test_cada_piso_tiene_quien_hable_y_existe(self):
        """El reparto firmado cubre los ocho pisos, y cada nombre existe.

        Un piso sin entrada dejaria el titulo en NO_DATA; uno con un cerebro
        que no esta en el catalogo, el chat sin modelo. Y los pisos del
        navegador tienen que bajar EL MISMO modelo que `chat.js` sabe arrancar:
        si el catalogo dice un Mini y el chat descarga otro, la ficha miente.
        """
        import re as _re
        reg = json.loads((PUBLICO / "cerebros.json").read_text(encoding="utf-8"))
        cam = (PUBLICO / "assets" / "camino.js").read_text(encoding="utf-8")
        m = _re.search(r"var PELDANOS = \[(.*?)\];", cam, _re.S)
        self.assertIsNotNone(m, "camino.js ya no declara PELDANOS")
        pisos = _re.findall(r"'(\w+)'", m.group(1))
        self.assertEqual(len(pisos), 8)
        ids = {c["id"]: c for c in reg["cerebros"]}
        rep = reg.get("pisos", {})
        for p in pisos:
            with self.subTest(piso=p):
                self.assertIn(p, rep, "piso sin quien hable")
                self.assertIn(rep[p]["cerebro"], ids, "cerebro que no existe")
                self.assertIn(rep[p]["donde"], ("rack", "navegador"))
        chat = (PUBLICO / "assets" / "chat.js").read_text(encoding="utf-8")
        webllm = reg.get("navegador", {}).get("webllm")
        self.assertTrue(webllm, "hay pisos del navegador y no se dice que modelo baja")
        self.assertIn(f"var MODELO = '{webllm}'", chat,
                      "el catalogo presenta un modelo y el chat descarga otro")
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("/assets/piso-chat.js", router,
                      "nadie carga el modulo que hace que el piso mande")

    def test_el_modelo_servido_lleva_tag_explicito(self):
        """Nada de `:latest` pelado en el modelo que da la cara al publico.

        El canon del nodo lo prohibe por escrito: un tag pelado apunta a donde
        apunte hoy, y en Ollama suelen ser variantes Thinking con razonamiento
        no desactivable. El 2026-09-01 la web servia `qwen3-coder-30b:latest`
        porque era el unico tag que habia; al restaurarse el rack aparecio
        `qwen3-coder:30b`, que es el nombre que el canon ya nombraba.

        Se comprueba el catalogo entero y no solo el servido: el dia que se
        sirva un segundo companero, el tag pelado entraria por ahi.
        """
        for a in self.d["agentes"]:
            modelo = a["real"].get("modelo")
            if not modelo:
                continue
            with self.subTest(agente=a["id"], modelo=modelo):
                self.assertIn(":", modelo, f"«{modelo}» no declara tag")
                self.assertNotIn(":latest", modelo,
                                 f"«{modelo}» lleva un tag pelado: usa el explicito")

    def test_el_papel_no_puede_inventar_enlaces(self):
        """El Instalador tiene PROHIBIDO escribir URLs, y esta medido por que.

        Sirviendo el papel contra los dos modelos que quedaban en el rack, los
        dos se sacaron un enlace de la manga: `preceptoros.com/install-linux` y
        `preceptoros.com/guia-instalacion-linux`. Dominio equivocado --el
        nuestro es .org-- y rutas que no existen. Un modelo que inventa la
        direccion a la que mandas a instalar es peor que uno que no contesta.

        La regla vive en el `papel` de los TRES idiomas, que es lo que viaja
        al modelo. Se comprueba en los tres porque una traduccion que se salta
        la prohibicion la desactiva para ese idioma entero.

        DONDE VIVE EL PAPEL, que cambio el 2026-09-04 y por eso este test
        cambio con el. Estaba en el bloque i18n de cada portada y se saco a
        `assets/prompts-<idioma>.js`: eran 2.412 B de instrucciones para un
        modelo --que nadie lee nunca en pantalla-- dentro de un fichero que
        estaba a 36 B de su techo. Se mudo el texto; la prohibicion no.

        AQUI SE ENUMERA A PROPOSITO, y es la excepcion. Casi todo en esta web
        se descubre --las lenguas del disco, los `hreflang` de la pagina, el
        hueco del contenedor-- porque enumerar es como se queda algo a medias
        en silencio. Pero esto no lee una estructura: lee una FRASE HUMANA, y
        preguntar «prohibe algo?» a un texto en una lengua que no se conoce no
        se puede hacer sin nombrar su palabra. Que la lengua nueva ponga este
        test en rojo es la funcion: obliga a mirar si la prohibicion viajo con
        la traduccion, en vez de darla por buena.
        """
        NIEGAN = r"(?i)\b(nunca|never|jamais|mai|nie|niemals|никогда|ποτέ)\b"
        for idioma in IDIOMAS:
            js = (PUBLICO / "assets" / f"prompts-{idioma}.js").read_text(encoding="utf-8")
            papel = json.loads(js[js.index("window.PR =") + 11:]
                               .rstrip().rstrip(";"))["papel"]
            with self.subTest(idioma=idioma):
                self.assertRegex(papel, NIEGAN,
                                 "el papel no prohibe nada en absoluto")
                self.assertRegex(papel, r"(?i)url",
                                 "el papel no nombra las URL, que es lo que se inventa")
                # Y el propio papel no puede llevar una URL dentro: seria
                # ensenarle justo lo que se le prohibe.
                self.assertNotRegex(papel, r"https?://",
                                    "hay una URL escrita dentro del papel")

    def test_cada_simbolo_del_hub_existe(self):
        """Un <img> a un fichero que no esta no falla: no pinta.

        Ese es el problema. La tarjeta sale sin cara, nadie ve un error y el
        fallo puede vivir meses en la pantalla de quien llega.
        """
        for a in self.d["agentes"]:
            with self.subTest(agente=a["id"]):
                # Dos imagenes por agente, y no son intercambiables: el OJO va
                # al cabezal cuando ese companero esta activo; la ESFERA es su
                # retrato en el panel Modelos.
                for ruta in (PUBLICO / "assets" / f"agente-{a['symbol']}.webp",
                             PUBLICO / "assets" / f"agente-3d-{a['icono3d']}.webp"):
                    self.assertTrue(ruta.is_file(), f"falta {ruta.name}")

    def test_el_hub_habla_todas_las_lenguas(self):
        """El guardian que este modulo NO puede usar, reimplementado aqui.

        `test_los_tres_idiomas_tienen_las_mismas_claves` mira el bloque #i18n
        de la portada y las claves `T.xxx` de sus scripts. El Hub se sale de
        ahi a proposito: meter estas claves en cada portada cuesta ~1,5 KB, y
        en ruso y en griego eso las saca del tope. Salirse de un guardian sin
        traer otro seria dejar un hueco, asi que aqui esta el otro.

        DOS COSAS CAMBIARON EL 2026-09-05, y la segunda es la que importa.
        El texto se mudo de `hub.json` a `hub-textos.json` --el catalogo es una
        cosa y su traduccion, otra-- y este test dejo de exigir TRES lenguas
        para exigir TODAS las que haya en el disco.

        Lo segundo tapa un agujero real: pt, it, de, ru y el llevaban semanas
        cayendo al castellano ENTERAS en el panel, la cola y la correccion,
        porque el respaldo era por objeto y no por clave y nadie lo vigilaba.
        Con `{es, en, fr}` escrito a mano, el test daba verde mientras cinco
        lenguas mostraban texto ajeno.
        """
        t = json.loads((PUBLICO / "hub-textos.json")
                       .read_text(encoding="utf-8"))["textos"]
        en_disco = {d.name for d in PUBLICO.iterdir()
                    if d.is_dir() and len(d.name) == 2 and (d / "index.html").exists()}
        self.assertEqual(en_disco, set(t),
                         f"lenguas sin textos del Hub: {en_disco ^ set(t)}")
        base = set(t["es"])
        self.assertTrue(base, "el bloque de textos esta vacio")
        for idioma in sorted(set(t) - {"es"}):
            with self.subTest(idioma=idioma):
                self.assertEqual(base, set(t[idioma]),
                                 f"{idioma} difiere: {base ^ set(t[idioma])}")
        # Y las que el render pide de verdad tienen que existir.
        usadas = set(re.findall(r"L\.([A-Za-z]+)", self.js))
        # Cada fichero que consume estos textos tiene que estar en esta lista,
        # o su idioma deja de estar vigilado sin que nada lo diga. `comandos.js`
        # y `corregir.js` entraron el 2026-08-31 y traen sus claves por
        # `txt('x')` y `L('x')`: dos formas mas de pedir lo mismo, y las dos se
        # miran. Un guardian que solo conoce los ficheros de ayer da verde por
        # ignorancia, que es el peor verde que hay.
        for fichero, patron in (("chat-router.js", r"T\('([A-Za-z]+)'"),
                                ("comandos.js", r"txt\('([A-Za-z]+)'"),
                                ("corregir.js", r"L\('([A-Za-z]+)'")):
            usadas |= set(re.findall(
                patron, (PUBLICO / "assets" / fichero).read_text(encoding="utf-8")))
        self.assertFalse(usadas - base, f"claves sin traducir: {sorted(usadas - base)}")

    def test_el_panel_solo_pinta_lo_que_esta_servido(self):
        """Una rejilla de companeros se ve igual sea real o inventada.

        HASTA EL 2026-09-05 ESTA PRUEBA PEDIA LO CONTRARIO: que la pagina
        pintara un rotulo «MOCK · 1/8 servido» encima de la rejilla. Tenia
        sentido mientras se mostraban los ocho: siete llevaban el estado puesto
        a mano para poder mirar la interfaz, y esa etiqueta era la UNICA
        diferencia visible entre lo real y lo fingido.

        Ahora el panel filtra por `real.disponible`, asi que no hay nada
        fingido en pantalla y no hay nada que etiquetar. La regla se hace mas
        fuerte, no mas floja: antes se permitia mostrar lo inventado siempre
        que se avisara; ahora no se muestra.

        Los siete siguen en el catalogo con su `causa_no_servido` -- un dato
        incomodo no se borra, se guarda donde se pueda leer. El dia que se
        sirva uno aparece solo.
        """
        self.assertIn("nota", self.d, "el catalogo no dice en que estado esta")
        fn = re.search(r"function pintaPanel.*?\n  \}", self.js, re.S)
        self.assertIsNotNone(fn, "no existe pintaPanel")
        cuerpo = fn.group(0)
        self.assertIn("real.disponible", cuerpo,
                      "el panel pinta companeros sin comprobar si estan servidos")
        self.assertIn(".filter(", cuerpo,
                      "el panel no filtra: pintaria tambien los inventados")
        # Y el catalogo tiene que seguir diciendo POR QUE no esta servido cada
        # uno. Es lo que convierte el filtro en una omision honesta y no en un
        # escondite: el dato sigue publicado, solo que no en la rejilla.
        for a in self.d["agentes"]:
            r = a.get("real", {})
            if not r.get("disponible"):
                with self.subTest(agente=a["id"]):
                    self.assertTrue(r.get("causa"),
                                    f"«{a['id']}» no se pinta y no dice por que")

    def test_el_rack_no_se_renderiza_en_publico(self):
        """La telemetria del rack es del Soberano, no de quien visita.

        Hasta la Puerta 6 la portada pintaba dos columnas --maqueta y medido--
        con el estado energetico del rack. Salio entera: su sitio es el Ojo,
        en loopback. Aqui se comprueba en los DOS sitios donde podria volver a
        colarse: el JSON que viaja al navegador y el codigo que pinta.

        No basta con dejar de renderizarlo: mandar el bloque y no pintarlo es
        cargar peso y exponer estado del rack por nada.
        """
        self.assertNotIn("rack", self.d,
                         "hub.json vuelve a mandar telemetria del rack al publico")
        for nombre in ("hub.js", "hub-cola.js", "chat-router.js"):
            js = (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")
            codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
            codigo = re.sub(r"(?m)//.*$", "", codigo)
            with self.subTest(fichero=nombre):
                for muerto in ("rack", "anker", "bateria_presente", "era_energetica"):
                    self.assertNotIn(muerto, codigo.lower(),
                                     f"{nombre} vuelve a pintar el rack: «{muerto}»")

    def test_ironclaw_firma_una_a_una(self):
        """Protocolo 2 del documento P0X, y no es una preferencia de estilo.

        Un lote deja pasar una alucinacion sin que nadie la lea, y la
        reputacion externa no tiene rollback. La friccion en la ultima milla
        es el mecanismo, no un descuido de la interfaz.
        """
        self.assertIn("propuestas", self.d["cola"])
        for prohibido in ("firmarTodo", "aprobarTodo", "firmar todo",
                          "aprobar todo", "selectAll", "batch"):
            with self.subTest(prohibido=prohibido):
                self.assertNotIn(prohibido.lower(), self.js.lower(),
                                 f"hub.js ofrece aprobacion por lotes: {prohibido}")
        # Un boton por pieza: el listener se cuelga DENTRO del bucle.
        cola_js = (PUBLICO / "assets" / "hub-cola.js").read_text(encoding="utf-8")
        for prohibido in ("firmarTodo", "aprobarTodo", "firmar todo",
                          "aprobar todo", "selectAll", "batch"):
            with self.subTest(prohibido=prohibido, fichero="hub-cola.js"):
                self.assertNotIn(prohibido.lower(), cola_js.lower())
        self.assertIn("props.forEach", cola_js, "la cola no itera propuesta a propuesta")
        self.assertIn("colaFirmar", cola_js, "no hay boton de firma por pieza")

    def test_hub_usa_scheduler_yield(self):
        """Devolver el hilo entre secciones, con respaldo donde no exista."""
        self.assertIn("scheduler", self.js, "no cede el hilo al navegador")
        self.assertIn("window.scheduler.yield", self.js)
        self.assertIn("setTimeout", self.js, "sin respaldo donde no hay scheduler")

    def test_respeta_saveData_y_memoria(self):
        """Quien pide ahorro de datos lo ha PEDIDO: no se le mandan 48 KB."""
        self.assertIn("saveData", self.js)
        self.assertIn("deviceMemory", self.js)
        self.assertIn("prefers-reduced-data", self.js)

    def test_los_iconos_de_companero_no_vuelven(self):
        """LAS DIECISEIS SE RETIRARON EL 2026-09-20. 156.992 B.

        Eran dos familias: las ocho esferas del panel Modelos (108.582 B) y
        los ocho ojos del cabezal (48.410 B). Las dos colgaban de los ocho
        companeros, y los companeros se fueron al laboratorio, que es de donde
        habian salido.

        LA CIFRA QUE DUELE, y es la leccion: las esferas estaban en el
        PRECACHE del worker, asi que todo visitante se descargaba y guardaba
        108 KB --- ocho veces las dos laminas de marmol, que estan puestas con
        su medida al lado como si fueran el gasto grande--- para un panel
        retirado de la pantalla quince dias antes.

        Y los ojos llevaban mas tiempo aun sin que nadie los nombrara: el
        `grep` del 2026-09-20 no encontro UNA sola referencia. Eran huerfanos
        antes de que empezara esta sesion.

        POR QUE NO LO CAZO NADIE. Habia una prueba, y era buena:
        `test_ningun_asset_precacheado_esta_muerto` exige que lo precacheado
        EXISTA. Existir no es servir para algo. Un fichero presente que no pide
        ningun codigo pasa esa prueba entera, y puede pasarla durante meses.
        La que faltaba es esta, la simetrica: que no vuelva a viajar lo que
        nadie pinta.
        """
        for familia in ("agente-3d-*.webp", "agente-ojo-*.webp"):
            with self.subTest(familia=familia):
                hay = sorted((PUBLICO / "assets").glob(familia))
                self.assertEqual([], hay,
                                 f"vuelven iconos de companero: "
                                 f"{[q.name for q in hay]}")
        # Y que nadie los reañada al precache por el camino largo: se mira el
        # PREFIJO, no el nombre completo, para que una lista generada tampoco
        # cuele.
        listas = (PUBLICO / "sw-listas.js").read_text(encoding="utf-8")
        self.assertNotIn("agente-3d-", listas,
                         "el worker vuelve a precachear esferas que no pinta nadie")


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

    def test_cabezal_limpio_y_sus_ids(self):
        """El cabezal nuevo, con los ids de los que otros ficheros dependen.

        SE RETIRO `#cabeza` el 2026-09-05, y con el el ultimo resto del cabezal
        anterior. Era una tira animada de 78 px que hacia de indicador del
        companero activo: `chat-router.js` le cambiaba el fondo al elegir. El
        trabajo lo hace `.chat-quien`, que ademas dice el NOMBRE -- un dibujo
        que cambia sin rotulo obliga a aprenderse ocho caras para saber con
        quien hablas. Esta prueba exige ahora que no vuelva: dos indicadores del
        mismo hecho terminan discrepando.

        Se comprueban IDS y no aspecto porque de los ids cuelgan otros ficheros:
        `auth.js` busca `#identity` y se calla si no esta, asi que el boton de
        entrar desapareceria sin un solo error en consola.
        """
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertIn('id="cabezal"', t, "no hay cabezal")
                self.assertIn('id="cab-nav"', t, "el cabezal no tiene navegacion")
                self.assertIn('id="identity"', t,
                              "auth.js busca #identity y se calla si falta")
                self.assertIn('id="cab-solar"', t,
                              "la frase de energia no tiene sitio en el cabezal")
                self.assertIn('id="panel-ajustes"', t, "no hay rueda de ajustes")
                self.assertNotIn('id="cabeza"', t,
                                 "vuelve la cara del cabezal viejo: seria un "
                                 "segundo indicador de companero, y discreparia "
                                 "de `.chat-quien`")
        # Se busca la LLAMADA, no la palabra: el bloque de al lado explica por
        # escrito que la cara se retiro, y una comprobacion que se cree lo que
        # dice la prosa no comprueba el codigo -- esta leyendo. Es la misma
        # cicatriz que ya tiene la prueba de la Capa 3 con `@supports`.
        self.assertNotIn("getElementById('cabeza')", router,
                         "el router vuelve a buscar la cara del cabezal viejo")
        self.assertNotIn("cabeza.style", router,
                         "el router vuelve a pintar la cara del cabezal viejo")
        # Y TAMPOCO UN SEGUNDO ROTULO DE TEXTO (2026-09-07). Aqui se exigia
        # justo lo contrario --que el router pintase `.chat-quien`-- y el
        # Soberano lo retiro con el motivo delante: «ya tenemos el titulo del
        # modelo inmediatamente debajo». La nube elegida dice el mismo nombre
        # tres milimetros mas abajo, asi que la regla que ya prohibia `#cabeza`
        # se aplica igual a un texto: dos indicadores del mismo hecho terminan
        # discrepando.
        #
        # SE BUSCA EL LITERAL ENTRECOMILLADO, no la palabra suelta: el
        # comentario del router explica por escrito por que la linea se fue, y
        # una comprobacion que lee prosa se cree lo que la prosa dice. Es la
        # misma cicatriz de dos lineas mas arriba, y ya ha mordido cuatro veces
        # en esta casa.
        self.assertNotIn("'chat-quien'", router,
                         "el router vuelve a pintar un segundo rotulo con el "
                         "nombre del companero")
        # Pero alguien TIENE que decirlo. Lo dice la nube elegida.
        hub = (PUBLICO / "assets" / "hub.js").read_text(encoding="utf-8")
        self.assertIn("'modelo-nombre'", hub,
                      "nadie declara el companero activo en la portada")

    def test_las_cuatro_puertas_y_su_orden(self):
        """La navegacion: cuatro, en su orden, y ocupando el ancho.

        El orden no es decorativo. HOME primero porque es el sitio; LoRAtelier
        SEGUNDO porque es el producto principal de esta web --el banco de
        pruebas comunitario-- y hasta hoy iba el ultimo, leyendose como una
        seccion mas; COMMUNITY despues; e INSTALAR AQUI el ultimo, que es lo que
        se hace cuando ya se ha visto lo demas.

        Y el idioma YA NO ESTA en la fila: se fue a la rueda. Era el quinto
        boton y ocupaba un quinto del ancho para algo que solo se toca una vez.
        """
        hub = guion_de_la_portada()
        orden = []
        for clave in ("T.cabHome", "T.cabBenchmark", "T.cabComunidad", "T.cabInstala"):
            self.assertIn(clave, hub, f"falta la puerta {clave}")
            orden.append(hub.index(clave))
        self.assertEqual(orden, sorted(orden),
                         "las cuatro puertas no se pintan en su orden")
        self.assertNotIn("enlace('cab-boton idioma'", hub,
                         "el idioma vuelve a la fila de navegacion")
        # LAS HOJAS SE DESCUBREN DE LA PORTADA, no se nombra una. Esta linea
        # leia `widget.css` y el 2026-09-05 la regla se mudo a `puertas.css`
        # --el fichero se paso del tope y se partio por asuntos--: el guardian
        # se puso rojo por buscar donde ya no estaba, no porque faltara nada.
        # Leyendo lo que la portada CARGA, el proximo corte no lo rompe.
        css = maqueta_de_la_portada()
        # DE DOS EN DOS, no de cuatro en fila. La fila de cuatro se partia en el
        # Doogee --tres arriba y INSTALAR AQUI descolgada-- que es una rejilla
        # rota disfrazada de maqueta. Se vio en el telefono, no emulado.
        self.assertIn("grid-template-columns:repeat(2,1fr)",
                      css.replace(" ", ""),
                      "las puertas no se apilan de dos en dos")

    def test_enlaces_identidad_publica(self):
        """GitHub y LinkedIn: uno de cada, y en el cabezal.

        Dos copias del mismo enlace divergen, y estos son la unica forma de
        comprobar quien firma esto. Salen de `hub.json`, que copia
        `Alejandria/identidad_publica.json`.
        """
        d = json.loads((PUBLICO / "hub.json").read_text(encoding="utf-8"))
        i = d.get("identidad", {})
        for clave in ("github_url", "linkedin_url"):
            self.assertIn(clave, i, f"hub.json no declara {clave}")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertEqual(0, t.count("linkedin.com"),
                                 "el enlace de LinkedIn esta escrito en el marcado")
                self.assertEqual(0, t.count("github.com"),
                                 "queda un GitHub suelto en la portada")
        hub = (PUBLICO / "assets" / "hub.js").read_text(encoding="utf-8")
        self.assertIn("github_url", hub)
        self.assertIn("linkedin_url", hub)

    def test_panel_modelos_existe_y_desliza(self):
        css = ((PUBLICO / "assets" / "widget.css").read_text(encoding="utf-8") +
               (PUBLICO / "assets" / "panel.css").read_text(encoding="utf-8"))
        plano = css.replace(" ", "").replace("\n", "")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertIn('id="panel-modelos"', t, "no hay panel Modelos")
                self.assertIn('id="hub-layout"', t, "el chat no tiene maqueta")
        self.assertIn("transform:translateX(101%)", plano,
                      "el panel no se retira deslizando")
        self.assertIn("transition:transform.35sease", plano,
                      "el deslizamiento no dura los 350 ms del contrato")
        self.assertIn("prefers-reduced-motion", css,
                      "el panel se desliza aunque se pida quietud")

    def test_la_capa_3_se_repliega_y_no_deja_hueco(self):
        """El desplegable de companeros: izquierda, y cerrado NO ocupa nada.

        ESTA PRUEBA HA CAMBIADO DE DOCTRINA DOS VECES, y las dos quedan
        escritas porque cada una explica por que la siguiente fue posible.

        PRIMERA, antes del 2026-09-03: `grid-template-columns:1fr 360px` con el
        panel en `position:static` como segunda columna de `#hub-layout`.
        Aquello se veia bien y estaba roto por debajo -- `#hub-layout` vive
        dentro de `<main>`, que va DESPUES del cabezal y ANTES del pie, y un
        hijo no puede ser mas alto que su padre. El rail empezaba bajo el
        cabezal y terminaba sobre el pie. No habia margen que lo arreglara
        porque el problema no era el margen: era el arbol.

        SEGUNDA, 2026-09-03: rail derecho `position:fixed` de borde a borde,
        con el hueco reservado una sola vez en `body`. Arreglo el corte, y
        trajo su propio precio: el rail plegado seguia ocupando 4,6rem contra
        el borde derecho de TODAS las paginas que cargaran la hoja, abierto o
        no, porque un rail plegado sigue siendo un rail.

        TERCERA Y ACTUAL, 2026-09-05, firmada por el Soberano: la web se apila
        con las mismas cinco capas que la app, y alli la Capa 3 «cerrada no
        ocupa nada --el panel va absoluto-- y abierta cae desde el canto
        izquierdo». Al no ocupar nada plegada, la reserva global sobra y se va
        con ella. Eso es lo que deja el panel central como MONO PANEL: se
        queda con todo el ancho en vez de con el ancho menos un rail.

        Lo que se exige aqui son las cuatro cosas que hacen que eso sea verdad
        y no una intencion escrita en un comentario.
        """
        # Las cuatro hojas donde vive la maqueta. `cara.css` nacio el 2026-09-05
        # al pasar `chat.css` de 10.285 B sobre un tope de 10.240: se parte
        # antes que recortar, y la costura es por asunto -- alli la cara y su
        # aritmetica, aqui la caja donde se escribe.
        # LAS HOJAS SE DESCUBREN DE LA PORTADA, no se nombran cuatro. Esta
        # linea concatenaba `widget + panel + chat + cara` y el 2026-09-05 se
        # partieron cuatro ficheros por el tope: la regla de la Capa 1 acabo en
        # `placa.css` y el gate se puso rojo por buscar donde ya no estaba, no
        # porque faltara nada. Es la tercera vez hoy con la misma forma. Leyendo
        # lo que la portada CARGA, la proxima particion no lo rompe.
        css = maqueta_de_la_portada()
        plano = css.replace(" ", "").replace("\n", "")

        # 1 · ES UN DESPLEGABLE, no una columna: cuelga del CABEZAL por su canto
        #     izquierdo. La geometria es la del MVP, que es la referencia.
        # Los DOS mandos --companeros y rueda-- comparten el mueble: dos
        # desplegables con dos aspectos serian dos muebles para el mismo gesto.
        self.assertIn("#panel-modelos,#panel-ajustes{position:absolute;left:.7rem;"
                      "top:calc(100%-.1rem)",
                      plano, "la Capa 3 no cuelga del canto izquierdo del cabezal")
        self.assertIn("transform-origin:topleft", plano,
                      "el desplegable crece desde el centro y se lee como un acordeon")
        self.assertIn(".lateral-zona{position:static", plano,
                      "la zona se ancla a si misma y pega el panel al boton")

        # 2 · CERRADO NO OCUPA NADA. Y `visibility:hidden` ademas le quita el
        #     foco: un panel a escala cero sigue siendo tabulable, y quien
        #     navega con teclado caeria dentro de algo que no ve.
        self.assertIn("#panel-modelos.cerrado,#panel-ajustes.cerrado{"
                      "transform:scaleY(0);opacity:0;visibility:hidden}",
                      plano, "la Capa 3 cerrada sigue ocupando, o sigue siendo tabulable")

        # 3 · NADIE reserva hueco para ella. Si alguien lo reintroduce, el centro
        #     deja de ser mono panel y nadie se entera: la pagina se estrecha.
        self.assertNotIn("--hueco-rail", plano,
                         "vuelve a haber reserva de rail; un desplegable plegado "
                         "no ocupa sitio, asi que no hay hueco que guardar")

        # 4 · el chat y sus atajos son UN panel, y en la capa que todo pisa. El
        #     z-index se exige aunque sea el mas bajo: sin el, `#chat` no crea
        #     contexto de apilamiento y el orden queda al azar del documento --
        #     funciona hoy y se rompe al mover un bloque de sitio.
        self.assertIn("#chat{position:relative;z-index:var(--capa-1-chat)}", plano,
                      "el mono panel no declara su capa")
        for idioma, t in self.portadas():
            with self.subTest(idioma=idioma):
                self.assertIn('id="atajos"', t, "los atajos no estan")
                caja = t[t.index('id="chat"'):t.index("</main>")]
                self.assertIn('id="atajos"', caja,
                              "los atajos viven fuera del panel del chat: una fila "
                              "propia cuesta el alto que el chat necesita con el teclado")
                # LA CAPA 3 SE QUEDO CON UN SOLO INQUILINO (2026-09-05).
                # Eran dos desplegables gemelos: Herramientas --los ocho
                # companeros-- y la rueda. Los companeros BAJARON al cuadro de
                # especificaciones, donde se ven siempre, y eso dejo al boton
                # de Herramientas sin nada que abrir: un mando que abre algo
                # que ya esta a la vista es un mando de mas. Se retiro el
                # mando, no la funcion.
                #
                # Este guardian exigia ese boton por su id. Se reescribe en vez
                # de borrarse: lo que protegia --que un desplegable diga que
                # abre y si esta abierto-- sigue haciendo falta, y ahora hay
                # exactamente uno al que exigirselo.
                self.assertIn('id="rueda"', t,
                              "no hay boton que abra la Capa 3")
                self.assertIn('aria-controls="panel-ajustes"', t,
                              "el boton no declara que panel abre")
                self.assertIn('aria-expanded', t,
                              "el boton no dice si esta abierto")
                self.assertNotIn('id="lateral-boton"', t,
                                 "vuelve a haber un mando de Herramientas; las "
                                 "nubes se ven solas en el cuadro de "
                                 "especificaciones, asi que no hay nada que abrir")

                # Y LAS NUBES SE VEN SIN PULSAR NADA. Es la otra mitad: sin
                # esto, retirar el boton habria escondido el catalogo entero.
                ficha = t[t.index('id="especificaciones"'):t.index("</main>")]
                self.assertIn('id="panel-modelos"', ficha,
                              "las nubes de companeros no estan en el cuadro de "
                              "especificaciones: un catalogo que hay que abrir "
                              "para ver no es un catalogo, es un secreto")
                self.assertNotIn('id="panel-modelos" class="cerrado"', t,
                                 "las nubes nacen plegadas y ya nadie las despliega")

        # 5 · y en PC la ventana sigue estirandose. El desplegable ya no reserva
        #     nada, pero `main` viene limitado a 46rem por `base.css` --la medida
        #     de una columna de lectura-- y sin esto el chat se queda estrecho en
        #     una pantalla ancha.
        # TODOS los bloques de PC, no el primero. Habia un `re.search` que
        # cogia uno solo, y valia mientras hubiera uno solo: el 2026-09-05
        # entro un segundo --la banda que la placa se reserva para que la cara
        # no pise la primera linea-- y como llega antes en el orden de carga,
        # el guardian se puso a buscar la maqueta de escritorio dentro de una
        # regla de dos lineas. Rojo por mirar en el sitio equivocado, otra vez.
        # Con `findall` da igual cuantos haya y en que orden lleguen.
        bloques = re.findall(r"@media \(min-width:1024px\)\{(.*?)\n\}", css, re.S)
        self.assertTrue(bloques, "no hay maqueta de PC")
        cuerpo = "".join(bloques).replace(" ", "")
        self.assertNotIn("position:static", cuerpo,
                         "en PC el panel vuelve a entrar en el flujo y lo cortan "
                         "el cabezal y el pie")
        self.assertIn("max-width:min(1400px", cuerpo,
                      "la ventana no se estira: el chat se quedaria estrecho")
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("(min-width:1024px)", router,
                      "el router no distingue PC de movil")
        self.assertIn("matchMedia", router,
                      "el umbral se lee a mano en vez de por matchMedia")

    def test_el_cabezal_no_se_corta_en_el_telefono(self):
        """La identidad tiene que poder bajar de linea, y no podia.

        `movil.css` ya mandaba `.identity{flex:1 0 100%}` para que el boton de
        entrar ocupara su propia fila en un telefono. No servia de nada:
        `widget.css` carga DESPUES y trae `#cabezal #identity{flex:0 0 auto}`,
        que con dos ids gana por especificidad (0,2,0 contra 0,1,0). El
        `flex-wrap:wrap` del cabezal estaba puesto desde el principio -- el
        cabezal no se cortaba por falta de wrap, sino porque el unico elemento
        que tenia que envolverse estaba clavado con `flex:0 0 auto` y un
        `margin-left:auto` que lo empujaba contra el borde.

        Por eso el arreglo NO es anadir wrap ni subir un `!important`: es
        devolverle a la regla de movil la especificidad que le falta, dentro
        de la media query que ya existe.
        """
        # La maqueta de movil salio de `widget.css` a `cabezal.css` el
        # 2026-09-05: aquella llego a 16.724 B de un tope de 16.384 y en este
        # arbol se parte antes que recortar. La hoja nueva se enlaza JUSTO
        # DESPUES, porque estas reglas corrigen a las de escritorio y con la
        # misma especificidad gana la que carga ultima.
        css = (PUBLICO / "assets" / "cabezal.css").read_text(encoding="utf-8")
        movil = re.search(r"@media \(max-width:1023px\)\{(.*?)\n\}", css, re.S)
        self.assertIsNotNone(movil, "no hay maqueta de movil en cabezal.css")
        # Los comentarios fuera ANTES de aplanar, y no es escrupulo: el
        # comentario de esta misma regla CITA `#cabezal #identity{flex:0 0
        # auto}` para explicar a quien gana. Sin quitarlo, el test partia por
        # la cita y medía el comentario en vez del CSS -- daba rojo con el
        # arreglo ya puesto. Es el mismo cuidado que ya toma
        # `test_el_rack_no_se_renderiza_en_publico` con el JS.
        limpio = re.sub(r"/\*.*?\*/", "", movil.group(1), flags=re.S)
        cuerpo = limpio.replace(" ", "").replace("\n", "")

        # LO QUE ESTA PRUEBA EXIGIA HASTA EL 2026-09-08, y por que cambia.
        #
        # Exigia una regla `#cabezal #identity{...}` DENTRO de la media query
        # de movil, con `flex:1 1 auto` y `margin-left:0`. Existia porque la
        # identidad era un hijo suelto de `.cab-fila` y habia que recolocarla a
        # mano en cada franja de anchura para que no se quedara clavada a la
        # derecha ni se llevara tres filas.
        #
        # Ya no es un hijo suelto: vive en `.cab-esquina` junto a la rueda, y
        # el reparto lo hace flexbox midiendo. Seguir exigiendo la regla vieja
        # seria pedir que se conserve la aritmetica que se retiro -- y ese
        # `order:3` que quedo suelto es justo lo que hizo que la rueda perdiera
        # el canto al registrarse un usuario. Lo vio el Soberano en una captura.
        #
        # ASI QUE SE EXIGE LA GARANTIA, NO SU IMPLEMENTACION VIEJA: la esquina
        # tiene que estar EN EL FLUJO. Fuera de el, una identidad que se
        # ensancha --al registrarse pasa de un icono de 36 px a una pastilla de
        # 211-- crece ENCIMA de la marca: 69 px de solape medidos, con la rueda
        # enterrada debajo. En el flujo eso no puede ocurrir, y no hay numero
        # que ajustar.
        # SE LEE LO QUE LA PORTADA CARGA, no `esquina.css` por su nombre. Esta
        # linea lo nombraba, y el 2026-09-08 la hoja llego a 16.737 B de un
        # tope de 16.384: la esquina se mudo a `esquina-cuenta.css` --se parte
        # por asunto, no se recortan comentarios-- y el gate se puso rojo por
        # buscar donde ya no estaba, no porque faltara nada. Septima vez con
        # esta forma exacta en este arbol, y la segunda hoy.
        esq = maqueta_de_la_portada()
        esq = re.sub(r"/\*.*?\*/", "", esq, flags=re.S).replace(" ", "").replace("\n", "")
        # TODAS las declaraciones, no la primera. La esquina se declara en dos
        # sitios a proposito --su caja en `esquina-cuenta.css` y su orden del
        # telefono en `cabezal.css`, que es la hoja de esa maqueta-- y una
        # busqueda de la PRIMERA cazaba `order:10` y creia que faltaba el
        # anclaje. La garantia no es «una regla dice esto»: es «ninguna la saca
        # del flujo, y alguna la pega al canto».
        reglas = re.findall(r"\.cab-esquina\{([^}]*)\}", esq)
        self.assertTrue(reglas, "no hay esquina: los dos mandos vuelven a "
                                "colocarse a mano")
        for r in reglas:
            self.assertNotIn("position:absolute", r,
                             "la esquina vuelve a estar fuera del flujo: con "
                             "sesion la identidad se ensancha y crece encima "
                             "de la marca")
        self.assertTrue(any("margin-left:auto" in r for r in reglas),
                        "la esquina no se pega al canto derecho")

        # --- Y NADIE LIMITA A LOS DOS MANDOS CON UN PORCENTAJE -------------
        # Esta es la prueba que faltaba en las SEIS veces que estos dos botones
        # han estado mal en dos dias. Siempre la misma clase de fallo y nunca
        # el mismo numero: una regla que sobrevivio a la mudanza de la pieza
        # que colocaba o limitaba.
        #
        # La sexta fue `#cabezal #identity{max-width:calc(100% - 8rem)}`. Se
        # escribio cuando la identidad colgaba de `.cab-fila`: ese `100%` era
        # el ancho de la fila. Al mudarse a `.cab-esquina` paso a ser el ancho
        # de la ESQUINA --78 px sin sesion-- y la cuenta da 78 menos 128, o sea
        # negativo, que el navegador clava en CERO. Y una caja de ancho cero no
        # desaparece: su hijo se DESBORDA. Medido a 1280: `#identity` en
        # 959..959 con su icono de 36 px pintandose encima de la rueda, que
        # empieza en 965.
        #
        # UN PORCENTAJE ES RELATIVO A UN PADRE. Cambiar de padre cambia lo que
        # la regla significa sin cambiar una letra, y eso no se ve leyendo el
        # diff. Asi que aqui se prohibe: dentro de la esquina se coloca con
        # caja, orden y anclaje -- cosas que siguen significando lo mismo se
        # mueva lo que se mueva.
        for prop in ("max-width:calc(100%", "width:calc(100%"):
            self.assertNotIn(prop, esq[esq.find("#cabezal#identity"):
                                       esq.find("#cabezal#identity") + 400]
                             if "#cabezal#identity" in esq else "",
                             "la cuenta vuelve a limitarse con un porcentaje "
                             "del padre: al mudarla, ese padre cambia y la cota "
                             "se vuelve negativa sin que nadie lo note")

        # Y NINGUN `order` SUELTO SOBRE LA IDENTIDAD en la maqueta de movil. El
        # orden dentro de la esquina lo pone el marcado --identidad y despues
        # rueda, para que la rueda tome el canto en los dos estados-- y un
        # `order` heredado de la maqueta anterior lo invierte en silencio.
        self.assertNotRegex(cuerpo, r"#cabezal#identity\{[^}]*order:",
                            "un `order` viejo sobre la identidad: la rueda "
                            "pierde la esquina en cuanto alguien se registra")

        self.assertNotIn("!important", cuerpo,
                         "el cabezal se arregla a martillazos")

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

    def test_los_comandos_publicados_existen_en_el_repo_del_producto(self):
        """La pagina promete comandos; que los ficheros esten, se comprueba.

        `instalar.html` publica `bash bin/instalar-pc`, `python3 preceptoros.py`
        y cuatro mas, y afirma que salen del repositorio «comprobados uno a uno».
        Esa frase lleva FECHA, y una afirmacion fechada es una que puede caducar:
        el dia que uno de esos guiones se renombre, la pagina seguira mandando a
        la gente a un fichero que ya no esta y nadie se enterara hasta que
        alguien lo intente.

        Se mira el repo LOCAL del producto, no GitHub. Un test que consultara la
        red ataria el gate a que haya internet; y si el repo no esta a mano, se
        salta -- la web tiene que poder probarse sola.
        """
        mvp = Path.home() / "p0x" / "preceptor"
        if not mvp.is_dir():
            self.skipTest("el repo del producto no esta a mano")
        pagina = PUBLICO / "es" / "instalar.html"
        texto = pagina.read_text(encoding="utf-8")
        citados = set(re.findall(r"<code>[^<]*?(bin/[a-z0-9-]+)", texto))
        citados |= {m for m in re.findall(r"<code>python3 ([a-z_]+\.py)", texto)}
        self.assertTrue(citados, "la pagina de instalar no cita ni un comando: "
                                 "o cambio el marcado, o dejo de explicar como "
                                 "se instala")
        for fichero in sorted(citados):
            with self.subTest(fichero=fichero):
                self.assertTrue(
                    (mvp / fichero).exists(),
                    f"instalar.html manda a `{fichero}` y no esta en el repo del "
                    "producto. O se renombro, o la pagina quedo vieja.")

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

    def test_la_correccion_firmada_no_sale_del_aparato(self):
        """El eslabon [2] se guarda, no se envia. Y se comprueba, no se promete.

        `LORATELIER_P0X.md` deja abiertas D1 --de quien es el LoRA-- y D2
        --con que se paga--, y dice que encender el boton de corregir antes de
        responderlas «seria pedir datos sin saber que se hara con ellos». La
        salida no fue no construirlo: fue construirlo sin salida de red. El par
        se firma y se queda en el aparato de quien lo escribio.

        Una promesa asi no puede vivir en un comentario. Aqui se lee el codigo
        --sin comentarios, porque el fichero NOMBRA `fetch` y `sendBeacon` para
        jurar que no los usa, y esa cita bastaria para dar un falso positivo,
        que es el mismo cuidado que ya toma el test del rack.
        """
        # LOS DOS FICHEROS, y esto se aprendio partiendo uno. El 2026-09-13
        # `corregir.js` llego a 90 B del tope y el almacen de pares se mudo a
        # `bronce.js` -- que es justo donde vive ahora TODO lo que toca los
        # datos y podria sacarlos. Este test siguio verde mirando solo el
        # fichero viejo: la guarda se habia quedado vigilando la puerta por la
        # que ya no pasa nadie. Una guarda tiene que seguir al codigo cuando el
        # codigo se muda, o deja de guardar sin dejar de pasar.
        # `enviar.js` NO entra en esta lista, y la ausencia es la regla.
        #
        # Ese fichero SI sale a la red, y a proposito: es el canal firmado por
        # el Soberano el 2026-09-13 --«si un usuario actua en la web durante una
        # hora de paquetes, debe tener una posibilidad de enviarlas»--. La
        # guarda existe para que el egreso sea DELIBERADO Y NOMBRADO, no para
        # que no exista: prohibirlo en todas partes habria dejado el trabajo de
        # la gente encerrado en su aparato para siempre.
        #
        # Lo que sigue prohibido es que salga por donde nadie lo declaro:
        # `corregir.js` guarda y `bronce.js` construye, y ninguno de los dos
        # tiene por que hablar con nadie.
        # `aprender.js` entra el 2026-09-13 por la misma razon que entro
        # `bronce.js`: construye y guarda pares firmados. Que nazca sin `fetch`
        # no es la garantia -- la garantia es que este bucle lo mire.
        for nombre in ("corregir.js", "bronce.js", "aprender.js", "elegir.js"):
            js = (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")
            codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
            codigo = re.sub(r"(?m)//.*$", "", codigo)
            for salida in ("fetch", "XMLHttpRequest", "sendBeacon", "WebSocket",
                           "EventSource", "navigator.send"):
                with self.subTest(fichero=nombre, salida=salida):
                    self.assertNotIn(salida, codigo,
                                     f"{nombre} puede sacar el par por {salida}")
        js = (PUBLICO / "assets" / "corregir.js").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        codigo = re.sub(r"(?m)//.*$", "", codigo)
        # El esquema es el de `preceptor/captura.py`, campo a campo. Dos
        # esquemas para el mismo hecho obligan a un traductor en medio, y ese
        # traductor es donde un dia se pierde el consentimiento.
        for campo in ("prompt", "respuesta", "correccion", "corregido",
                      "modelo", "idioma", "motivo", "consent"):
            with self.subTest(campo=campo):
                self.assertIn(campo, codigo, f"el par no lleva `{campo}`")
        self.assertIn("consent: 0", codigo,
                      "el consentimiento no nace en 0: un par sin firma no es "
                      "material de nadie")
        # Y se firma de verdad: la firma entera la garantiza auth.js.
        self.assertIn("Identity.firmar", codigo, "el par no se firma")

    def test_la_transferencia_respeta_el_movimiento_reducido(self):
        """Doble guarda: el navegador que no sabe, y quien no quiere."""
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("prefers-reduced-motion", router)
        fn = re.search(r"function conTransicion.*?\n  \}", router, re.S)
        self.assertIsNotNone(fn, "no hay guarda de transicion")
        self.assertIn("!document.startViewTransition", fn.group(0),
                      "se llama a startViewTransition sin comprobar que existe")
        self.assertIn("quieto.matches", fn.group(0),
                      "la transicion no mira si se pidio quietud")

    def test_motor_prioriza_languagemodel(self):
        """`window.ai` quedo atras. La forma vigente es `LanguageModel`."""
        motor = (PUBLICO / "assets" / "engine.js").read_text(encoding="utf-8")
        self.assertIn("LanguageModel.availability", motor)
        codigo = re.sub(r"/\*.*?\*/", "", motor, flags=re.S)
        codigo = re.sub(r"(?m)//.*$", "", codigo)
        self.assertNotIn("window.ai", codigo,
                         "engine.js vuelve a la forma obsoleta window.ai")


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

        # 1 · las tres piezas del Hub y su catalogo
        for pieza in ("/hub.json", "/assets/widget.css", "/assets/panel.css",
                      "/assets/hub.js",
                      "/assets/hub-cola.js", "/assets/chat-router.js"):
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
        self.assertIn("/hub.json", contenido.group(1))
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
        for p in paginas_de_contenido() + [PUBLICO / "en/index.html", PUBLICO / "fr/index.html"]:
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

    def test_los_tres_idiomas_tienen_las_mismas_claves(self):
        # Los scripts que la portada CARGA de verdad, no solo chat.js ni todos
        # los de assets. Cuando la interfaz se partio en varios ficheros para
        # respetar el tope por fichero, este test siguio mirando uno solo y las claves de
        # los demas quedaban sin comprobar. Mirarlos todos tampoco vale:
        # hitos.js lee el bloque i18n de hitos.html, que es otro.
        for idioma in IDIOMAS:
            p = PUBLICO / idioma / "index.html"
            texto = p.read_text(encoding="utf-8")
            usa = set()
            for src in re.findall(r'<script src="[^"]*?assets/([\w.-]+\.js)"', texto):
                fichero = PUBLICO / "assets" / src
                if fichero.is_file():
                    usa |= self.claves_que_usa(fichero.read_text(encoding="utf-8"))
            self.assertTrue(usa, f"{idioma}: ningun script de la portada usa claves")
            bloque = re.search(r'id="i18n"[^>]*>(.*?)</script>', texto, re.S)
            self.assertIsNotNone(bloque, f"{idioma}: falta el bloque i18n")
            datos = json.loads(bloque.group(1))
            with self.subTest(idioma=idioma, scripts=len(usa)):
                # Falla solo por lo que FALTA: una clave ausente deja una cadena
                # vacia en la interfaz. Las que sobran son texto muerto — se
                # informan, pero no tumban el build.
                faltan = usa - set(datos) - set(FUERA_DEL_BLOQUE)
                self.assertFalse(faltan, f"{idioma}: faltan claves {sorted(faltan)}")

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

    def test_el_bloque_de_estado_va_DESPUES_de_la_pregunta(self):
        """El sitio del bloque decidia si el turno se veia o salia en blanco.

        Medido el 2026-09-14 sobre cuatro modelos y dos preguntas. Con
        `[SYSTEM STATE]` pegado justo delante de la pregunta, un modelo pequeno
        lo CONTINUA: `llama3.2:1b` abria su respuesta recitandolo. Y entonces
        `sinFuga` --que corta desde `[SYSTEM` hasta el final, porque en el
        torrente la etiqueta de cierre llega tarde o no llega-- se comia la
        respuesta ENTERA. Un turno en blanco, sin error, sin causa.

        1 turno vacio de 8 antes; 0 de 8 despues. El antidoto estaba bien: lo
        que estaba mal era darle de beber el veneno al modelo en el ultimo
        sorbo.

        Esta prueba mira la FORMA del codigo y no el resultado, que no puede
        ver desde aqui. Es poco, y es lo que impide que la proxima mano que
        toque `chat.js` vuelva a juntar las dos cadenas en el orden viejo.
        """
        js = (PUBLICO / "assets" / "chat.js").read_text(encoding="utf-8")
        self.assertIn("function conEstado(texto) { return texto + estado(); }", js,
            "chat.js ya no compone el estado detras de la pregunta")
        self.assertNotIn("PR.papel || '') + (window.stateContext", js,
            "el bloque de estado volvio a pegarse al papel, delante de la "
            "pregunta: eso es lo que dejaba el turno en blanco")
        for via in ("Rack.stream", "LocalAI.stream", "Engine.stream"):
            with self.subTest(via=via):
                linea = [l for l in js.splitlines() if via in l and "window." in l]
                self.assertTrue(linea, f"no se encuentra la llamada a {via}")
                self.assertIn("conEstado(texto)", linea[0],
                    f"{via} manda el texto sin el bloque de estado detras")

    def test_un_turno_que_el_antidoto_deja_VACIO_se_cuenta(self):
        """Un párrafo en blanco es el fallo invisible que esta casa no fabrica.

        `state.js` lo dice de si mismo --«un filtro silencioso convierte un
        fallo del modelo en un fallo invisible»-- y `chat.js` lo fabricaba: si
        `sinFuga` se llevaba la respuesta entera, se pintaba la cadena vacia y
        la persona veia aparecer texto a trozos y desaparecer, sin saber que
        habia pasado. Ahora se dice, y en las ocho lenguas.
        """
        js = (PUBLICO / "assets" / "chat.js").read_text(encoding="utf-8")
        self.assertIn("T.falloRecitado", js,
            "chat.js no avisa cuando el antidoto vacia el turno")
        for pagina in sorted(PUBLICO.rglob("*.html")):
            html = pagina.read_text(encoding="utf-8")
            if '/assets/chat.js' not in html:
                continue
            bloque = re.search(r'id="i18n">(.*?)</script>', html, re.S)
            with self.subTest(pagina=str(pagina.relative_to(PUBLICO))):
                self.assertIsNotNone(bloque, "la pagina del chat no trae bloque")
                self.assertTrue(json.loads(bloque.group(1)).get("falloRecitado"),
                    "falta `falloRecitado`: el turno vaciado saldria mudo")

    # Las trece de firmar una correccion, y de donde sale cada una.
    ROTULOS_FIRMA_HUB = ("corregirBoton", "corregirQue", "corregirMotivo",
                         "corregirFirmar", "corregirNoViaja",
                         "corregirGuardado", "corregirFallo")
    ROTULOS_FIRMA_NAV = ("idEntrar", "idAviso", "idClave", "idFallo",
                         "idPerfil", "idPublica")

    def test_los_rotulos_de_FIRMAR_dicen_lo_mismo_que_su_fuente(self):
        """`corregir-<idioma>.js` es GENERADO, y esto lo demuestra.

        Nace de una averia del 2026-09-14 peor de lo que parecia: en SIETE de
        las ocho lenguas, `benchmark.html` --la pagina donde se firman las
        correcciones-- no cargaba `corregir.js`, `aprender.js` ni `elegir.js`.
        No es que el boton saliera sin texto: es que la cadena de feedback
        entera solo existia en castellano.

        Y las ocho traducciones llevaban meses escritas en `hub-textos.json` y
        `nav.json`. Lo que faltaba no era traducir: era LEER. Misma forma que
        A16 -- el dato correcto al lado, sin leer.

        Copiar ese texto a un tercer sitio sin esta prueba seria garantizar que
        divergen. Con ella, tocar la fuente y no el reflejo pone el gate rojo.
        """
        import re as _re
        hub = json.loads((PUBLICO / "hub-textos.json").read_text(encoding="utf-8"))["textos"]
        nav = json.loads((PUBLICO / "nav.json").read_text(encoding="utf-8"))["textos"]
        for idioma in IDIOMAS:
            f = PUBLICO / "assets" / f"corregir-{idioma}.js"
            with self.subTest(idioma=idioma):
                self.assertTrue(f.is_file(),
                    f"falta {f.name}: en {idioma} el boton de firmar saldria mudo")
                m = _re.search(r"window\.FIRMA\s*=\s*(\{.*?\});",
                               f.read_text(encoding="utf-8"), _re.S)
                self.assertIsNotNone(m, f"{f.name} no declara window.FIRMA")
                datos = json.loads(m.group(1))
                for clave in self.ROTULOS_FIRMA_HUB:
                    self.assertEqual(datos.get(clave), hub[idioma].get(clave),
                        f"{f.name} y hub-textos.json no dicen lo mismo en «{clave}»")
                for clave in self.ROTULOS_FIRMA_NAV:
                    self.assertEqual(datos.get(clave), nav[idioma].get(clave),
                        f"{f.name} y nav.json no dicen lo mismo en «{clave}»")
                # `exp` no se compara con nadie: este fichero ES su fuente. Lo
                # que si se exige es que este entero, porque si falta el boton
                # de exportar sale «NO_DATA» en pantalla.
                exp = datos.get("exp") or {}
                faltan = [k for k in ("b", "n", "q", "v", "e") if not exp.get(k)]
                self.assertFalse(faltan,
                    f"{f.name} no trae las palabras de la exportacion {faltan}")

    def test_la_cadena_de_FEEDBACK_esta_en_las_ocho(self):
        """Las tres piezas, o ninguna. Y no basta con que el fichero exista.

        `corregir.js` pinta «Corregir esta respuesta», `aprender.js` el
        «¿te ha servido?» y `elegir.js` arma el par que se firma. Faltando una
        sola, la pagina ofrece la mitad de un camino.
        """
        for idioma in IDIOMAS:
            html = (PUBLICO / idioma / "benchmark.html").read_text(encoding="utf-8")
            for guion in ("corregir.js", "aprender.js", "elegir.js",
                          f"corregir-{idioma}.js"):
                with self.subTest(idioma=idioma, guion=guion):
                    self.assertIn(f'/assets/{guion}"', html,
                        f"{idioma}/benchmark.html no carga {guion}: ahi la "
                        f"correccion firmada no existe")

    # Guiones que llevan su PROPIA tabla de ocho lenguas dentro, y por eso
    # tienen castellano escrito a mano con toda la razon. Se nombran uno a uno:
    # una regla («los que tengan `es:`») dejaria pasar al siguiente que se
    # invente una tabla a medias.
    TABLA_PROPIA = {
        "aprender.js": "TEXTO, las ocho lenguas del «aprender de mis reescrituras»",
        "elegir.js": "VOZ, las ocho del «¿te ha servido?»",
        "consiento.js": "las ocho del consentimiento de analisis",
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
            src = _re.sub(r"(?m)//.*$", "", src)
            # fuera los respaldos declarados: T('clave', '...')
            src = _re.sub(r"T\(\s*'[A-Za-z0-9]+'\s*,\s*'(?:\\.|[^'\\])*'",
                          "T(", src, flags=_re.S)
            src = _re.sub(r'T\(\s*"[A-Za-z0-9]+"\s*,\s*"(?:\\.|[^"\\])*"',
                          "T(", src, flags=_re.S)
            # Y la otra forma del MISMO trato, que esta casa usa igual:
            # `UI.clave || 'respaldo'`. Sigue significando que el texto sale de
            # un catalogo y que esto es lo que se ve si el catalogo no llego.
            src = _re.sub(r"\|\|\s*'(?:\\.|[^'\\])*'", "|| X", src)
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

    def test_las_claves_mudadas_estan_donde_dicen_estar(self):
        """Una clave que sale del bloque i18n no deja de existir: cambia de casa.

        `FUERA_DEL_BLOQUE` es la lista de las que se mudaron, y el test de
        arriba las perdona por eso. Perdonarlas sin mirar seria abrir un
        agujero: bastaria con anotar una clave ahi para que nadie volviera a
        comprobarla. Asi que se comprueba en su casa nueva, y en las ocho
        lenguas -- que es donde se cae este tipo de mudanza: la lengua que
        nadie mira se queda sin fichero y su panel sale en castellano sin que
        salte nada.
        """
        for clave, plantilla in FUERA_DEL_BLOQUE.items():
            for idioma in IDIOMAS:
                f = PUBLICO / plantilla.format(lengua=idioma)
                with self.subTest(clave=clave, idioma=idioma):
                    self.assertTrue(f.is_file(),
                        f"«{clave}» salio del bloque i18n de {idioma} y su "
                        f"fichero {f.name} no existe")
                    datos = json.loads(f.read_text(encoding="utf-8"))
                    # DOS CONVENCIONES, Y LAS DOS SON BUENAS. `agentes-*.json`
                    # pone sus claves en la raiz; las FAMILIAS --- caminos,
                    # duelos, herramientas y desde hoy motor --- las ponen bajo
                    # `ui`, porque la raiz lleva la procedencia y la marca de
                    # revision nativa, que es informacion SOBRE las cadenas y
                    # no una cadena mas.
                    #
                    # Mezclarlas seria peor que aceptar las dos: una clave
                    # llamada `revision` chocaria con el campo `revision`, y el
                    # choque no se veria hasta que alguien lo nombrase asi.
                    donde = datos.get("ui") if isinstance(datos.get("ui"), dict) else datos
                    self.assertIn(clave, donde,
                        f"{f.name} no trae «{clave}»")
                    self.assertTrue(donde[clave],
                        f"{f.name} trae «{clave}» vacio, que en pantalla se ve "
                        "igual que no traerlo")


class Imagenes(unittest.TestCase):

    def test_el_sprite_pesa_menos_de_50_kb(self):
        a = PUBLICO / "assets"
        total = (a / "despierta.webp").stat().st_size + (a / "habla.webp").stat().st_size
        self.assertLess(total, TOPE_SPRITE, f"el sprite pesa {total} B")

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

    def test_cada_lamina_pesa_menos_de_30_kb(self):
        for p in sorted((PUBLICO / "assets").glob("lamina-*.webp")):
            with self.subTest(lamina=p.name):
                self.assertLess(p.stat().st_size, TOPE_LAMINA, f"{p.name}: {p.stat().st_size} B")

    def test_hay_cinco_laminas(self):
        self.assertEqual(len(list((PUBLICO / "assets").glob("lamina-*.webp"))), 5)


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


class Comunidad(unittest.TestCase):
    """Los anuncios OFICIALES del Agora, que no son los hilos de EJEMPLO."""

    def setUp(self):
        self.d = json.loads((PUBLICO / "anuncios.json").read_text(encoding="utf-8"))

    def test_los_anuncios_hablan_los_tres_idiomas(self):
        """Un anuncio a medio traducir sale en blanco en dos de tres paginas.

        Y sale en blanco EN SILENCIO: `board-anuncios.js` no encuentra el
        idioma, pinta su NO_DATA y la peticion del Soberano desaparece de /en/
        y de /fr/ sin que nadie se entere, porque quien lo escribio lo miro en
        espanol.
        """
        for a in self.d["anuncios"]:
            for idi in IDIOMAS:
                with self.subTest(anuncio=a["id"], idioma=idi):
                    t = a["textos"].get(idi)
                    self.assertIsNotNone(t, f"{a['id']} no habla {idi}")
                    for campo in ("titulo", "cuerpo"):
                        self.assertTrue((t.get(campo) or "").strip(),
                                        f"{a['id']}/{idi}: {campo} vacio")

    def test_cada_anuncio_dice_lo_que_todavia_no_funciona(self):
        """La regla del sensor honesto, aplicada a pedir cosas.

        Los dos anuncios de hoy piden algo por un camino que HOY no llega: el
        Agora responde 404 en /api/v1/threads y no hay endpoint de subida. Un
        anuncio que pide sin decir eso no es un anuncio, es publicidad: la
        persona hace el trabajo y descubre sola que no habia donde entregarlo.
        """
        for a in self.d["anuncios"]:
            for idi in IDIOMAS:
                with self.subTest(anuncio=a["id"], idioma=idi):
                    pero = (a["textos"][idi].get("pero") or "").strip()
                    self.assertTrue(pero, f"{a['id']}/{idi} no declara su limite")
                    self.assertIn("NO_DATA", pero,
                                  "el limite no se marca como NO_DATA")

    def test_el_anuncio_con_enlace_lo_nombra_en_los_tres_idiomas(self):
        """Un `href` sin texto es un enlace invisible: existe y no se pulsa."""
        for a in self.d["anuncios"]:
            if not a.get("enlace"):
                continue
            for idi in IDIOMAS:
                with self.subTest(anuncio=a["id"], idioma=idi):
                    self.assertTrue((a["textos"][idi].get("enlaceTexto") or "").strip(),
                                    f"{a['id']}/{idi}: enlace sin texto")


class Perfil(unittest.TestCase):
    """La ficha: identidad, instalacion, niveles y la puerta de salida.

    LA CLASE SE REESCRIBIO EL 2026-09-13, Y DOS PRUEBAS SE FUERON CON LO QUE
    MEDIAN. La ficha pintaba ocho bustos elegibles, una biografia con editor y
    un boton de compartir, y habia una guarda por cada cosa:

      `test_cada_busto_del_catalogo_esta_en_el_disco` vigilaba `bustos.json`
        contra los ocho webp. El fichero ya no existe y la rejilla tampoco:
        un avatar que no sale del aparato no lo ve nadie mas que su dueno.

      `test_el_busto_propio_no_va_diferido` exigia `loading=eager` en la cara
        de arriba porque era el LCP de la pagina. Ya no hay ninguna imagen en
        esta ficha, asi que no hay LCP de imagen que proteger.

    Se borran y no se aflojan: una guarda que mide algo que dejo de existir no
    protege nada, y dejarla en verde con un `if not existe: return` es peor --
    parece que sigue vigilando. En su lugar entra `test_la_ficha_no_resucita_
    lo_que_se_retiro`, que es la regla dada la vuelta: lo que se decidio quitar
    no puede volver por descuido. Es la misma maniobra que ya se hizo con los
    ojos del worker, y por el mismo motivo -- un hueco donde habia una
    comprobacion es como vuelve el mismo error dentro de seis meses.
    """

    FICHAS = tuple(sorted((PUBLICO / i / "profile.html") for i in IDIOMAS))
    GUIONES = ("profile.js", "profile-obra.js")

    def test_la_ficha_no_resucita_lo_que_se_retiro(self):
        """Lo retirado tiene que seguir retirado en las OCHO lenguas.

        Las tres piezas que se fueron no fallaban -- por eso llevaban meses
        ahi. Un busto que nadie mas ve, una biografia que no viaja a ningun
        sitio y un boton que ofrece ensenar una pagina que, abierta por otro,
        sale vacia. Nada de eso da error: simplemente promete un sistema que
        no existe, que es la averia que mas caro sale en una web cuyo
        argumento entero es la honestidad.

        Aurelius entra en la misma lista y por otra razon: es OTRO proyecto
        --la app de aprendizaje, con su repo propio-- y nombrarlo en la ficha
        de esta web confunde dos cosas que el canon separa a proposito.
        """
        # `bustos.json` se borro con la rejilla. Se comprueba que no vuelva:
        # un catalogo huerfano es peso que todos descargan y nadie pinta.
        self.assertFalse((PUBLICO / "bustos.json").exists(),
                         "vuelve el catalogo de bustos, que ya no pinta nadie")
        prohibido = ("bustos.json", "perfil-avatar", "perfil-bio",
                     "perfil-compartir", "bio-vista", "mi-busto", "Aurelius",
                     "aurelius")
        for f in self.FICHAS + tuple(PUBLICO / "assets" / g
                                     for g in self.GUIONES):
            texto = f.read_text(encoding="utf-8")
            # FUERA LOS COMENTARIOS ANTES DE MIRAR, y aqui no es un detalle: el
            # encabezado de `profile.js` explica por escrito que la rejilla se
            # retiro y NOMBRA `bustos.json` para decir por que ya no se pide.
            # Leer esa frase como si fuera codigo es exactamente la trampa que
            # `sin_comentarios()` existe para evitar -- una guarda que se cree
            # lo que dice la prosa no comprueba, lee. La documentacion de por
            # que algo se fue tiene que poder nombrarlo.
            texto = re.sub(r"/\*.*?\*/", "", texto, flags=re.S)
            texto = re.sub(r"(?m)//.*$", "", texto)
            texto = re.sub(r"<!--.*?-->", "", texto, flags=re.S)
            for pieza in prohibido:
                with self.subTest(fichero=f.name, pieza=pieza):
                    self.assertNotIn(pieza, texto,
                                     f"«{pieza}» volvio a {f.name}")

    def test_cambiar_de_clave_exige_escribir_una_palabra(self):
        """La unica accion irreversible de toda la web, y por eso se vigila.

        La privada se genero no extraible: borrarla no es cerrar sesion, es
        perder para siempre la prueba de autoria de todo lo ya firmado. Un
        «¿seguro?» se acepta con el pulgar antes de leerlo, y en un telefono
        literalmente sin querer -- escribir una palabra exige haber mirado.

        Se comprueban las dos mitades: que la pagina TRAIGA la palabra en su
        idioma, y que el guion la EXIJA de verdad antes de encender el boton.
        Con solo la segunda, una lengua sin la clave dejaria una caja que no
        se puede satisfacer; con solo la primera, la palabra seria decorado.
        """
        js = (PUBLICO / "assets" / "profile-obra.js").read_text(encoding="utf-8")
        self.assertIn("Identity.olvidar", js,
                      "la ficha ya no llama a la unica pieza dueña de la clave")
        self.assertIn("hazlo.disabled = true", js,
                      "el boton de olvidar no nace apagado")
        self.assertIn("T.pfClavePalabra", js,
                      "el guion no compara contra la palabra de confirmacion")
        for f in self.FICHAS:
            texto = f.read_text(encoding="utf-8")
            bloque = re.search(r'id="i18n"[^>]*>(.*?)</script>', texto, re.S)
            with self.subTest(pagina=str(f.relative_to(PUBLICO))):
                self.assertIsNotNone(bloque, "la ficha perdio su bloque i18n")
                datos = json.loads(bloque.group(1))
                self.assertTrue((datos.get("pfClavePalabra") or "").strip(),
                                "sin palabra de confirmacion, la caja no se "
                                "puede satisfacer en esta lengua")
                self.assertIn("{palabra}", datos.get("pfClaveEscribe", ""),
                              "el rotulo no dice QUE palabra hay que escribir")

    def test_la_ficha_nunca_monta_html_que_no_escribio_ella(self):
        """El unico `innerHTML` admitido es el que VACIA (`= ''`).

        Nacio por la biografia --la escribia una persona, y una persona
        escribe `<script>`-- y esa caja ya no esta. La regla se queda igual, y
        con mas motivo: ahora lo que se pinta viene de `release.json`, de la
        clave publica y del mensaje de un error, o sea de fuera del fichero.
        Con nodos y `textContent`, un menor es un menor.

        Se comprueba estaticamente porque la alternativa es confiar en que
        nadie escriba la linea comoda algun dia.
        """
        for nombre in self.GUIONES:
            js = (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")
            for m in re.findall(r"\.innerHTML\s*=\s*([^;\n]+)", js):
                with self.subTest(fichero=nombre, asigna=m.strip()):
                    self.assertEqual("''", m.strip(),
                                     "innerHTML con algo que no sea vaciar")


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

    def test_los_campos_nuevos_van_al_final(self):
        """El orden de las claves ES parte de los bytes firmados.

        `JSON.stringify` respeta el orden de insercion y `ingesta.py`
        reconstruye los mismos bytes poniendo primero sus diez CAMPOS y despues
        los extras EN EL ORDEN EN QUE VINIERON. Un campo nuevo colado en medio
        hace que las dos canonicas dejen de coincidir, y entonces se rechaza una
        firma que es correcta -- por una coma de sitio, y sin sintoma que
        apunte al orden.
        """
        CANON = ["prompt", "respuesta", "correccion", "corregido", "modelo",
                 "idioma", "motivo", "tarea", "consent", "origen"]
        NUEVOS = ["tipo", "autoridad"]
        for nombre in ("aprender.js", "corregir.js"):
            js = (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")
            # Los comentarios de bloque se quitan ANTES de contar llaves: la
            # cabecera de `aprender.js` CITA `consent: 0` para explicar que el
            # par nace sin consentimiento, y esa cita mandaba al contador a un
            # trozo de prosa donde las llaves no cierran. Mismo cuidado que ya
            # toma la guarda de no-egreso, y por el mismo motivo.
            codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
            codigo = re.sub(r"(?m)//.*$", "", codigo)
            # SE MIRA EL OBJETO DEL PAR, NO EL FICHERO ENTERO. El primer
            # intento buscaba cada campo por todo el codigo y se creyo que
            # `aprender.js` tenia el orden cambiado: lo que habia encontrado era
            # la variable `respuesta` de otra funcion. Una guarda que mira mas
            # de lo que vigila da un rojo que no es un fallo, y un rojo que no
            # es un fallo es como se aprende a ignorar el gate.
            #
            # El objeto se localiza por `consent`, que solo aparece ahi, y se
            # recortan sus llaves contando hacia atras y hacia delante.
            ancla = codigo.index("consent:")
            hondo, ini = 0, None
            for i in range(ancla, -1, -1):
                if codigo[i] == "}":
                    hondo += 1
                elif codigo[i] == "{":
                    if hondo == 0:
                        ini = i
                        break
                    hondo -= 1
            self.assertIsNotNone(ini, f"{nombre}: no encuentro el objeto del par")
            hondo, fin = 0, len(codigo)
            for i in range(ini, len(codigo)):
                if codigo[i] == "{":
                    hondo += 1
                elif codigo[i] == "}":
                    hondo -= 1
                    if hondo == 0:
                        fin = i
                        break
            par = codigo[ini:fin]
            sitio = {}
            for campo in CANON + NUEVOS:
                m = re.search(r"(?m)^\s+" + campo + r":", par)
                if m:
                    sitio[campo] = m.start()
            with self.subTest(fichero=nombre):
                presentes = [c for c in CANON if c in sitio]
                self.assertEqual(sorted(presentes, key=sitio.get), presentes,
                                 f"{nombre} cambio el orden de los diez campos "
                                 "canonicos: eso rompe firmas correctas")
                for nuevo in NUEVOS:
                    if nuevo in sitio and "origen" in sitio:
                        self.assertGreater(
                            sitio[nuevo], sitio["origen"],
                            f"{nombre} pone `{nuevo}` antes de `origen`. Los "
                            "campos que `ingesta.py` no conoce van AL FINAL o "
                            "las dos canonicas dejan de coincidir.")

    def test_lo_capturado_se_dice_y_se_puede_apagar(self):
        """Capturar en silencio lo que alguien escribe seria lo contrario de
        esta casa. Hay rotulo, hay casilla, y la casilla apaga de verdad."""
        codigo = self._codigo()
        self.assertIn("localStorage", codigo, "no hay donde guardar el apagado")
        self.assertIn("panel-ajustes", codigo,
                      "el rotulo no se monta en la rueda de perfil: se estaria "
                      "capturando sin decirlo")
        self.assertIn("consent: 0", codigo,
                      "un par capturado no puede nacer consentido")
        self.assertIn("Identity.firmar", codigo, "el par no se firma")

    def test_habla_las_ocho_lenguas_del_sitio(self):
        """Un rotulo que solo esta en dos lenguas deja a seis sin saber que se
        les guarda. El sitio tiene ocho; el aviso tambien."""
        js = (PUBLICO / "assets" / "aprender.js").read_text(encoding="utf-8")
        bloque = re.search(r"var TEXTO = \{(.*?)\n  \};", js, re.S)
        self.assertIsNotNone(bloque, "aprender.js ya no declara TEXTO")
        tiene = set(re.findall(r"(?m)^    ([a-z]{2}): \[", bloque.group(1)))
        faltan = {"es", "en", "fr", "de", "it", "pt", "el", "ru"} - tiene
        self.assertEqual(set(), faltan,
                         "sin aviso en: " + ", ".join(sorted(faltan)))


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
     "ks_juez_una_capa"}

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
    "herr_titulo", "herr_lema", "herr_web", "herr_app", "herr_audio",
    "herr_cerrada", "herr_copia_ai", "herr_errores"}

# LA CUARTA FAMILIA, 2026-09-20. Nace por el mismo motivo que las tres de
# arriba y con la misma forma: los rotulos del motor local no caben en el
# bloque de la portada. Se firma aqui para que anadir uno sea una decision.
CLAVES_MOTOR = set(CLAVES_MOTOR_LISTA)   # una sola lista: ver FUERA_DEL_BLOQUE

FAMILIAS = {"caminos": CLAVES_CAMINOS, "duelos": CLAVES_DUELOS,
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

    def test_las_tres_familias_estan_en_las_ocho_lenguas(self):
        """Una lengua sin fichero no se ve: cae entera al respaldo y calla."""
        for nombre in FAMILIAS:
            with self.subTest(familia=nombre):
                self.assertEqual(set(IDIOMAS), set(self.fam[nombre]),
                                 f"faltan o sobran: "
                                 f"{set(IDIOMAS) ^ set(self.fam[nombre])}")

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

    def test_las_seis_lenguas_no_respondidas_lo_declaran(self):
        """Solo `es` y `en` las responde el silicio. Las otras seis salieron del
        rack y NADIE nativo las ha leido --- y eso no puede vivir solo en un
        reporte que nadie relee. La marca viaja EN el fichero.

        Se aprendio con sangre el 2026-09-19: `qwen2.5:7b` devolvio 21/21
        traducciones validas en forma --- claves exactas, nada vacio, paridad en
        verde --- y tres lenguas eran impublicables («Die Turm», «Башня Аскезы»,
        «Τόρρα» transliterando torre). El test de forma es necesario y NO
        suficiente; esta marca es lo que impide confundir uno con otro."""
        for nombre in FAMILIAS:
            for idioma in ("fr", "pt", "it", "de", "ru", "el"):
                with self.subTest(familia=nombre, idioma=idioma):
                    d = self.fam[nombre][idioma]
                    self.assertEqual("pendiente-revision-nativa",
                                     d.get("revision"), "sin marca de revision")

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


class LaColaDelRack(unittest.TestCase):
    """La cola del rack se CUENTA: puesto, estado del modelo y techo de espera.

    `agora_api` atiende de uno en uno --16,1 tok/s en total, igual con uno que
    con ocho-- y manda la cola en cabeceras `X-Cola-*` que llegan antes que el
    primer token. Estas pruebas guardan lo que se rompe solo si nadie mira.
    """

    def _js(self, nombre):
        return (PUBLICO / "assets" / nombre).read_text(encoding="utf-8")

    def test_rack_lee_las_cabeceras_y_las_reparte(self):
        """Sin esto, el servidor cuenta la cola y la pagina no se entera."""
        r = self._js("rack.js")
        self.assertIn("X-Cola-", r)
        self.assertIn("preceptor:cola", r)

    def test_un_503_se_cuenta_con_su_causa_no_con_su_codigo(self):
        """Hasta el 2026-09-22 `rack.js` tiraba el cuerpo de un 503 y el turno
        decia solo «HTTP 503», cuando el servidor explicaba «la cola esta
        llena, vuelve en un minuto». Un error sin causa es un error mudo."""
        r = self._js("rack.js")
        self.assertIn("r.json()", r)
        self.assertIn("d.causa", r)

    def test_la_cuenta_atras_no_baja_de_cero_ni_se_anuncia_cada_segundo(self):
        """Pasado el techo sin primer token no se cuenta en negativo --seria
        presumir de una precision que la cifra no tuvo--, y la cuenta atras
        va fuera de la region aria-live: leida cada segundo seria ruido."""
        c = self._js("cola.js")
        self.assertIn("Math.max(0", c)
        self.assertIn("aria-live", c)
        self.assertIn("'aria-hidden', 'true'", c)

    def test_cola_no_usa_innerHTML(self):
        """El texto viene de un .json de la casa; la costumbre es la que
        protege el dia que venga de otro sitio."""
        self.assertNotRegex(self._js("cola.js"), r"\.innerHTML\s*=")

    def test_el_aviso_de_cola_llena_sobrevive_al_fin_del_turno(self):
        """En la primera version se asignaba la fase nueva ANTES de mirar la
        anterior, y el aviso de cola llena se borraba en el mismo instante en
        que salia. La guarda tiene que leer la fase de antes."""
        c = self._js("cola.js")
        self.assertIn("var antes = fase;", c)
        self.assertLess(c.index("var antes = fase;"), c.index("fase = d.fase;"))

    def test_cola_se_carga_tarde_y_no_desde_la_portada(self):
        """El griego tiene 65 bytes libres: no cabe ni una etiqueta. La pide
        `rack.js` al primer turno, que ademas respeta «cero peticiones al
        cargar». Si alguien la cuelga de una portada, rompe las dos cosas."""
        self.assertIn("/assets/cola.js", self._js("rack.js"))
        # Se busca la ETIQUETA, no la subcadena: la portada si carga
        # `hub-cola.js`, que contiene «cola.js» y daba un falso rojo.
        for portada in PUBLICO.glob("*/index.html"):
            self.assertNotIn('src="/assets/cola.js"',
                             portada.read_text(encoding="utf-8"),
                             f"{portada} carga cola.js al abrir la pagina")

    def test_el_comentario_de_rack_no_dice_que_el_tunel_esta_pendiente(self):
        """Hasta el 2026-09-22 la cabecera de `rack.js` decia «TODO: tunel
        pendiente», con el tunel contestando desde hacia tiempo. Un comentario
        que miente sobre el estado es peor que ninguno: la siguiente sesion lo
        cree y persigue una averia que no existe."""
        self.assertNotIn("TODO: tunel", self._js("rack.js"))


if __name__ == "__main__":
    unittest.main(verbosity=2)
