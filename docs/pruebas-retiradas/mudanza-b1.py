"""Pruebas de test_web.py RETIRADAS en la mudanza, bloque 1 (portada = juego), 2026-10-11.
Firma: mudanza del Soberano (propuestas/mudanza-20261011), condicion 2: «pruebas retiradas archivadas con su fichero y causa».
No se ejecutan: son historia. Su causa, una por una, en config/pruebas-retiradas.json."""

# --- Estructura.test_la_portada_publica_lo_que_los_gates_miden · causa: la linea de credenciales del hub en las portadas; counters.json sigue publicado y vigilado por sus pruebas
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

# --- Estructura.test_ninguna_portada_muestra_el_idioma_de_otra · causa: vigilaba el i18n del pie del hub en las portadas; la portada nueva no tiene texto por lengua fuera del juego
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

# --- Estructura.test_el_pie_honesto_no_lleva_texto_escrito_a_mano · causa: el pie honesto del hub en las portadas; los sellos honestos viven ahora dentro del juego (LIVE/STALE/NO_DATA)
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

# --- Hub.test_thegame_se_carga_a_demanda_y_solo_pide_lo_suyo · causa: la puerta theGame del cabezal ya no existe en la portada: el juego ES la pagina y thegame.js se carga en ella
    def test_thegame_se_carga_a_demanda_y_solo_pide_lo_suyo(self):
        """theGame, la puerta del cabezal, es la UNICA entrada al juego (2026-09-26).

        El cabezal no baja nada del juego: al pulsar la puerta (o llegar con
        `#thegame`) inyecta `thegame.js`, que monta la capa y pide la hoja y los
        cinco guiones. Ningun HTML los nombra y el precache tampoco. El juego
        pide dos cosas, las dos al propio origen: su texto y sus leyes.
        """
        A = PUBLICO / "assets"
        rot = sin_comentarios((A / "cabezal-rotulos.js").read_text(encoding="utf-8"))
        self.assertIn("'/assets/thegame.js'", rot, "la puerta no carga el juego")
        self.assertIn("'#thegame'", rot)
        self.assertNotIn("camino-atlas", (A / "chat-router.js").read_text(encoding="utf-8"),
                         "la Torre vuelve a cargar el juego")
        self.assertFalse((A / "camino-atlas.js").exists(), "vuelve el cargador de la Torre")
        piezas = ("atlas-arte.js", "atlas-coord.js", "atlas-carta.js", "atlas-ondas.js", "atlas-mapa.js", "atlas-dialogo.js", "atlas-motor.js",
                  "atlas-piso.js", "atlas.css", "thegame.js", "atlas-guardado.js", "atlas-opina.js", "atlas-hud.js", "atlas-obra.js", "atlas-gesto.js", "atlas-mapa.css")
        listas = texto_del_worker()
        for q in piezas:
            with self.subTest(pieza=q):
                self.assertTrue((A / q).is_file(), f"falta {q}")
                self.assertNotIn(q, listas, f"{q} entra en el precache")
                for h in PUBLICO.rglob("*.html"):
                    self.assertNotIn(q, h.read_text(encoding="utf-8"),
                                     f"{h.name} carga {q} de salida")
        piso = sin_comentarios((A / "atlas-piso.js").read_text(encoding="utf-8"))
        self.assertEqual(re.findall(r"fetch\(([^)]*)\)", piso), ["BASE + ruta"])
        for f in ("atlas-guardado.js", "atlas-opina.js", "atlas-hud.js", "atlas-obra.js", "atlas-gesto.js", "atlas-piso.js", "atlas-arte.js", "atlas-coord.js", "atlas-carta.js", "atlas-ondas.js", "atlas-mapa.js", "atlas-dialogo.js",
                  "atlas-motor.js", "thegame.js"):
            codigo = sin_comentarios((A / f).read_text(encoding="utf-8"))
            # El espacio de nombres SVG es un nombre, no una salida.
            codigo = codigo.replace("'http://www.w3.org/2000/svg'", "")
            for salida in ("http://", "https://", "XMLHttpRequest", "sendBeacon",
                           "WebSocket", "EventSource", "importScripts", "innerHTML",
                           "localStorage"):
                with self.subTest(fichero=f, salida=salida):
                    self.assertNotIn(salida, codigo)
        for l in idiomas(PUBLICO):
            with self.subTest(lengua=l):
                self.assertTrue((PUBLICO / f"atlas-{l}.json").is_file())
        self.assertTrue((PUBLICO / "atlas-mundo.json").is_file(), "faltan las leyes del mundo")

# --- Cabezal.test_cabezal_limpio_y_sus_ids · causa: el cabezal del hub (#cabezal y sus ids) ya no esta en las portadas: la portada es cabezal-juego + panel unico
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

# --- Cabezal.test_las_cinco_puertas_y_su_orden · causa: las cinco puertas de navegacion del hub; en la portada solo hay juego y selector de lengua
    def test_las_cinco_puertas_y_su_orden(self):
        """La navegacion: cinco, en su orden, y ocupando el ancho.

        CINCO DESDE EL 2026-09-25, firmado por el Soberano: theGame entra la
        ultima y abre el juego en una capa (`#thegame`), no una pagina: desde el
        2026-09-26 el juego solo vive ahi, fuera de la Torre.
        Es impar, asi que en la rejilla de dos del telefono ocupa su fila.

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
        for clave in ("T.cabHome", "T.cabBenchmark", "T.cabComunidad", "T.cabInstala",
                      "T.cabGame"):
            self.assertIn(clave, hub, f"falta la puerta {clave}")
            orden.append(hub.index(clave))
        self.assertEqual(orden, sorted(orden),
                         "las cinco puertas no se pintan en su orden")
        self.assertIn("'#thegame'", hub, "theGame no abre el juego")
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
        self.assertIn("#cab-nav.cab-boton.thegame{grid-column:1/-1",
                      css.replace(" ", ""),
                      "la quinta puerta queda sola a media fila en el telefono")

# --- Cabezal.test_panel_modelos_existe_y_desliza · causa: #panel-modelos era el selector de companeros del hub; la portada ya no lo lleva
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

# --- Cabezal.test_la_capa_3_se_repliega_y_no_deja_hueco · causa: el desplegable de companeros (capa 3) es del hub; la portada ya no lo lleva
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

# --- Cabezal.test_el_cabezal_no_se_corta_en_el_telefono · causa: protegia la esquina de mandos del cabezal del hub (widget.css); el cabezal nuevo es una fila flexible
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

# --- Traducciones.test_los_tres_idiomas_tienen_las_mismas_claves · causa: el bloque i18n de las portadas era del hub; el juego trae sus textos en atlas-<l>.json, que tiene sus propias pruebas
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

# --- ElJuegoEnInglesEnLasNueve.test_las_nueve_portadas_llevan_la_puerta · causa: la puerta (cabezal-rotulos.js) se sustituye por el panel del juego; la reemplaza Portada.test_las_diez_son_la_plantilla
    def test_las_nueve_portadas_llevan_la_puerta(self):
        for l in ("ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"):
            p = (PUBLICO / l / "index.html").read_text(encoding="utf-8")
            self.assertIn("/assets/cabezal-rotulos.js", p, f"/{l}/ no lleva la puerta del juego")

# --- ElJuegoEnInglesEnLasNueve.test_la_portada_es_el_juego_y_lo_de_antes_va_en_about · causa: C1 por capa sobre el hub; ahora la portada ES el juego sin hub debajo; la reemplaza la clase Portada
    def test_la_portada_es_el_juego_y_lo_de_antes_va_en_about(self):
        """C1 (plan firmado 2026-10-05: «la web es SOLO el juego»). Las nueve portadas abren el juego
        solas, en tu casa; `#about` es la salida a lo de antes y no reabre. La navegacion pone theGame
        primero y pliega las cuatro puertas de antes en un «About» discreto, sin borrar ninguna pagina."""
        rot = sin_comentarios((PUBLICO / "assets" / "cabezal-rotulos.js").read_text(encoding="utf-8"))
        self.assertIn(r"var PORTADA = /^\/(ar|de|el|en|es|fr|it|pt|ru)\/(index\.html)?$/;", rot)
        self.assertIn("else if (!location.hash && PORTADA.test(location.pathname)) { juego(null, 'casa'); }", rot,
                      "la portada no abre el juego")
        self.assertIn("el('details', 'cab-about')", rot, "lo de antes no se pliega en About")
        self.assertIn("nav.insertBefore(juegoP, nav.firstChild)", rot, "theGame no va primero")
        capa = sin_comentarios((PUBLICO / "assets" / "thegame.js").read_text(encoding="utf-8"))
        self.assertIn("ab.href = '#about'; ab.addEventListener('click', cierra);", capa, "el juego no lleva su About")
        for l in ("ar", "de", "el", "en", "es", "fr", "it", "pt", "ru"):
            for hoja in ("index.html", "benchmark.html", "community.html", "instalar.html"):
                with self.subTest(lengua=l, hoja=hoja):
                    self.assertTrue((PUBLICO / l / hoja).is_file(), f"/{l}/{hoja} se borro: About pliega, no borra")


# --- test_atlas.CabezalCajas (y su arnes atlas/cabezal_cajas.mjs, movido a docs/pruebas-retiradas/) · causa: media en Chrome las cajas del cabezal del HUB (busto, puertas, sesion de tester); la portada ya no lo lleva
class CabezalCajas(unittest.TestCase):
    """El cabezal medido en un navegador de verdad (Soberano, 2026-10-05: «thegame es solo 1 boton»; el
    busto se montaba encima de los botones y del panel; la fila se cortaba). `cabezal_cajas.mjs` mide
    las cajas por CDP con y sin sesion de tester, a 412, 1024 y 1280 px. Sin Chrome: NO_DATA, que se
    dice como salto y no como verde."""

    def test_el_busto_no_pisa_nada_y_hay_una_sola_puerta_de_juego(self):
        r = subprocess.run(["node", str(RAIZ / "cabezal_cajas.mjs")], capture_output=True, text=True, timeout=240)
        if r.returncode == 3:
            self.skipTest("NO_DATA · sin Chrome para medir las cajas del cabezal")
        casos = json.loads(r.stdout)
        self.assertGreaterEqual(len(casos), 12, r.stderr)
        for c in casos:
            with self.subTest(caso=c["caso"]):
                self.assertTrue(c["ok"], c["detalle"])
