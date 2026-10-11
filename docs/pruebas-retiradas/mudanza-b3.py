"""Pruebas de test_web.py RETIRADAS en la mudanza, bloque 3 (lo que no es el juego cae), 2026-10-11.
FIRMO del Soberano: «recuerda eliminar lo antiguo» + mudanza firmada (condicion 2: archivadas con su fichero y causa).
Los ficheros que protegian estan archivados con su sha256 en ~/p0x/no-publicar/mudanza-20261011/cae/ (LISTA_ARCHIVADA_B3.txt).
No se ejecutan: son historia."""

# --- Estructura.test_el_codigo_de_vinculo_es_determinista · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Estructura.test_el_agora_pide_claves_que_existen · leia o exigia un fichero del hub que cayo en el bloque 3
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
        # DESDE EL 2026-09-23 LOS ROTULOS VIVEN EN `agora-<lengua>.json` › `ui`:
        # la seccion se mudo a Herramientas, que no tiene bloque `#i18n`. El
        # guardian mira ahora alli, en las ocho.
        for idi in IDIOMAS:
            d = json.loads((PUBLICO / f"agora-{idi}.json").read_text(encoding="utf-8"))
            tiene = set(d.get("ui") or {})
            with self.subTest(idioma=idi):
                self.assertFalse(pide - tiene,
                                 f"caen al respaldo en castellano: "
                                 f"{sorted(pide - tiene)}")

# --- Estructura.test_el_loratelier_compara_base_contra_adaptador · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Estructura.test_el_perfil_se_registra_en_el_agora_y_no_manda_de_mas · leia o exigia un fichero del hub que cayo en el bloque 3
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
        # DESDE EL 2026-09-23 el perfil es una pestaña de Comunidad: el ancla
        # y la carga las pone `perfil-pestana.js`, y Comunidad trae la hoja.
        pp = (PUBLICO / "assets" / "perfil-pestana.js").read_text(encoding="utf-8")
        self.assertIn("'perfil-rack'", pp, "falta el ancla")
        self.assertIn("/assets/perfil-rack.js", pp, "nadie lo carga")
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('data-carga="/assets/perfil-pestana.js"', t,
                              "Comunidad no monta el perfil")

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
            # Los rotulos viven en la familia del perfil desde el 2026-09-23.
            d = json.loads((PUBLICO / f"perfil-{idi}.json").read_text(encoding="utf-8"))["ui"]
            with self.subTest(idioma=idi):
                self.assertFalse(pedidas - set(d),
                                 f"rotulos que faltan: {pedidas - set(d)}")

        # 6 · Y LA PAGINA YA NO PROMETE QUE NO HAY EXTREMO. Lo prometia en las
        #     ocho, y con el boton puesto seria mentira en pantalla --- que es
        #     lo que esta casa persigue, no un detalle de redaccion.
        for idi in IDIOMAS:
            t = (PUBLICO / f"perfil-{idi}.json").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertNotIn("no existe todavía un extremo", t)
                self.assertNotIn("no endpoint yet", t)

# --- Estructura.test_el_killswitch_vive_en_la_torre · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Estructura.test_el_juego_de_puertos_no_sale_a_ninguna_red · leia o exigia un fichero del hub que cayo en el bloque 3
    def test_el_juego_de_puertos_no_sale_a_ninguna_red(self):
        """El piso 4 juega a escanear y NO escanea. Orden del 2026-09-25.

        «Que NUNCA haga peticiones reales a redes externas ni locales desde el
        navegador». Un navegador que sondea puertos es un escaner de red con
        otro nombre, y un comentario que lo jura no es una garantia: aqui se
        lee el codigo SIN comentarios, porque el propio fichero nombra lo que
        no usa.
        """
        js = (PUBLICO / "assets" / "camino-puertos.js").read_text(encoding="utf-8")
        codigo = re.sub(r"/\*.*?\*/", "", js, flags=re.S)
        codigo = re.sub(r"(?m)^\s*//.*$", "", codigo)

        # 1 · UNA sola salida, a su propio texto en el mismo origen.
        llamadas = re.findall(r"fetch\(([^)]*)\)", codigo)
        self.assertEqual(llamadas, ["'/puertos-' + lang + '.json'"],
                         f"el juego pide algo mas que su texto: {llamadas}")
        for salida in ("XMLHttpRequest", "sendBeacon", "WebSocket", "EventSource",
                       "RTCPeerConnection", "new Image", "Worker(",
                       "importScripts", "http://", "https://", ".src"):
            with self.subTest(salida=salida):
                self.assertNotIn(salida, codigo, f"el juego puede salir por {salida}")

        # 2 · la cadena entera: alguien lo carga despues de la Torre y el
        #     modulo oye su aviso y busca su piso.
        router = (PUBLICO / "assets" / "chat-router.js").read_text(encoding="utf-8")
        self.assertIn("/assets/camino-puertos.js", router, "nadie carga el juego")
        self.assertLess(router.index("/assets/camino.js"),
                        router.index("/assets/camino-puertos.js"),
                        "el juego se carga antes que la Torre que lo aloja")
        self.assertIn("preceptor:torre", codigo, "el juego no escucha a la Torre")
        self.assertIn("piso-puertos", codigo, "el juego no busca su piso")

        # 3 · cada puerto de la maquina se explica en las nueve lenguas, y cada
        #     rotulo que se pide existe. Una clave ausente se pinta en blanco.
        puertos = set(re.findall(r"\{ p: (\d+),", codigo))
        self.assertEqual(len(puertos), 8, "la maquina no tiene sus ocho puertos")
        pedidas = set(re.findall(r"T\('([a-z_]+)'\)", codigo))
        base = json.loads((PUBLICO / "puertos-es.json").read_text(encoding="utf-8"))
        for idi in IDIOMAS:
            d = json.loads((PUBLICO / f"puertos-{idi}.json").read_text(encoding="utf-8"))
            cam = json.loads((PUBLICO / f"caminos-{idi}.json").read_text(encoding="utf-8"))
            with self.subTest(idioma=idi):
                self.assertEqual(set(d["puertos"]), puertos,
                                 "un puerto de la maquina queda sin explicar")
                self.assertFalse(pedidas - set(d["ui"]),
                                 f"rotulos pedidos y ausentes: {pedidas - set(d['ui'])}")
                self.assertEqual(set(d["ui"]), set(base["ui"]))
                for k in ("pp_abrir", "pp_sello"):
                    self.assertTrue(cam["ui"].get(k), f"caminos-{idi} sin {k}")

# --- Estructura.test_la_plaza_tiene_dos_pestanas_y_el_killswitch_abre · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Estructura.test_debajo_del_cabecero_va_la_ACCION · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Estructura.test_la_vitrina_abre_la_pagina_y_el_NO_DATA_no · leia o exigia un fichero del hub que cayo en el bloque 3
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
                # cerebro», y `agora-portada` el 2026-09-23: se mudo a
                # Herramientas por orden del Soberano. Lo que queda por vigilar
                # es que la vitrina siga abriendo la pagina y que el Agora no
                # vuelva a Comunidad por un parche.
                self.assertIn('id="taller"', t, "falta la vitrina")
                self.assertNotIn('id="agora-portada"', t,
                                 "el Agora vuelve a Comunidad: vive en Herramientas")

# === ElTaller · clase entera: protegia una pagina o un registro del hub (ElTaller) que cayo en el bloque 3
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

# --- Doctrina.test_lo_que_el_modelo_devuelve_pasa_por_el_filtro · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Doctrina.test_la_esquina_no_puede_bajarse_de_la_linea_del_logo · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Doctrina.test_el_boton_de_cuenta_tiene_de_donde_sacar_su_rotulo · leia o exigia un fichero del hub que cayo en el bloque 3
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

# === Foro · clase entera: protegia una pagina o un registro del hub (Foro) que cayo en el bloque 3
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

# === Hub · clase entera: protegia una pagina o un registro del hub (Hub) que cayo en el bloque 3
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

    def test_cada_cerebro_declara_su_pais_sin_bandera_raster(self):
        """El pais se declara y se NOMBRA por lengua; ya no se dibuja con una bandera.

        Enmendado el 2026-10-10 por la firma F2 del Soberano («identidad pura,
        cero imagenes»): las tres banderas SVG no las pintaba nadie (censo de la
        capa visual, plata OK) y este test era lo unico que las mantenia vivas.
        Lo que se conserva es la regla de abajo: el pais va por lengua. Historia
        del test original (por que el pais es el del modelo base):

        Una bandera que falta no falla: `onerror` la retira y no se ve.

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
                usados.add(c["pais"])
        self.assertFalse((PUBLICO / "assets" / "banderas").exists(),
                         "vuelven las banderas raster: la identidad es sin imagenes")

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
        self.assertIn("viste(INICIAL", re.sub(r"/\*.*?\*/", "", torre, flags=re.S),
                      "nadie viste el chat al arrancar: se queda sin companero")
        # El piso de entrada es el 2 (orden del Soberano, 2026-09-25), y los
        # dos modulos que lo nombran dicen el mismo.
        inicial = re.findall(r"var INICIAL = '(\w+)'", torre + (PUBLICO / "assets" / "piso-chat.js").read_text(encoding="utf-8"))
        self.assertEqual(inicial, ["primeros_pasos", "primeros_pasos"],
                         "camino.js y piso-chat.js no abren el mismo piso")
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

    def test_mi_perfil_es_una_pestaña_de_comunidad(self):
        """Addendum F.5 (2026-09-23): el perfil, dentro de Comunidad.

        Se monta al abrir la pestaña (`data-carga`), porque sus textos no caben
        en la Comunidad griega; y los enlaces de la web llevan a
        `community.html#perfil`, que `pestanas.js` LEE sin escribir nunca.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "community.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('data-panel="perfil"', t, "falta la pestaña")
                self.assertIn('data-carga="/assets/perfil-pestana.js"', t,
                              "la hoja no dice que guion la monta")
        pe = (PUBLICO / "assets" / "pestanas.js").read_text(encoding="utf-8")
        self.assertIn("data-carga", pe, "pestanas.js no carga guiones de hoja")
        self.assertIn("location.hash", pe, "no abre la pestaña que pide el enlace")
        self.assertNotIn("location.hash =", pe, "escribe el hash: rompe el boton de atras")
        for f in ("auth.js", "foro.js"):
            js = (PUBLICO / "assets" / f).read_text(encoding="utf-8")
            with self.subTest(guion=f):
                self.assertIn("community.html#perfil", js)

    def test_profile_html_es_la_puerta_a_la_pestaña(self):
        """El punto 1 adaptado (2026-09-23): la direccion se conserva.

        Conviven la firma del 2026-09-02 --«un perfil necesita URL propia»-- y
        el addendum F.5 --el perfil dentro de Comunidad--: `profile.html` sigue
        existiendo como direccion para pegar, y lleva a la pestaña. Si el
        navegador no sigue el refresco, el enlace tiene que estar a la vista.
        """
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "profile.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('http-equiv="refresh" content="0; url=./community.html#perfil"', t)
                self.assertIn('href="./community.html#perfil"', t, "sin enlace visible")
                self.assertNotIn('/assets/profile.js', t, "el perfil se monta en Comunidad, no aqui")

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
        # OCHO: ATLAS fue piso 9 un dia y salio de la Torre (2026-09-26).
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

    def test_el_nivel_mostrado_es_la_posicion_en_peldanos(self):
        """Nivel 1 = Primeros pasos, nivel 2 = Despertar (Soberano, 2026-09-25).

        El numero que ve la persona SE DERIVA del indice de `PELDANOS` --no hay
        campo de nivel--, asi que reordenar el array es la unica forma de
        cambiar un nivel, y esta guarda ata las tres cosas que tienen que decir
        lo mismo: el orden del array, el numero pintado (`i + 1`) y el piso que
        se abre al entrar (`INICIAL`, que tiene que ser el nivel 1). Un campo de
        nivel escrito a mano en otro sitio seria un segundo dueño del numero.
        """
        cam = sin_comentarios((PUBLICO / "assets" / "camino.js").read_text(encoding="utf-8"))
        m = re.search(r"var PELDANOS = \[(.*?)\];", cam, re.S)
        pisos = re.findall(r"'(\w+)'", m.group(1))
        self.assertEqual(pisos[:2], ["primeros_pasos", "despertar"])
        self.assertNotIn("atlas", pisos, "ATLAS vuelve a la Torre: vive tras theGame")
        self.assertIn("PELDANOS.forEach(function (p, i)", cam)
        self.assertIn("' ' + (i + 1) + ' · '", cam, "el nivel ya no sale del indice")
        self.assertNotRegex(cam, r"camino_\w+_nivel", "aparece un segundo dueño del nivel")
        for f in ("camino.js", "piso-chat.js"):
            t = (PUBLICO / "assets" / f).read_text(encoding="utf-8")
            with self.subTest(fichero=f):
                self.assertIn(f"var INICIAL = '{pisos[0]}'", t,
                              "el piso que abre la web no es el nivel 1")
        for l in IDIOMAS:
            ui = json.loads((PUBLICO / f"caminos-{l}.json").read_text(encoding="utf-8"))["ui"]
            with self.subTest(lengua=l):
                self.assertFalse([p for p in pisos if f"camino_{p}_titulo" not in ui],
                                 "hay un nivel sin titulo en esta lengua")

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
        NIEGAN = r"(?i)\b(nunca|never|jamais|mai|nie|niemals|никогда|ποτέ|أبدًا)\b"
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

# --- Cabezal.test_enlaces_identidad_publica · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Cabezal.test_los_comandos_publicados_existen_en_el_repo_del_producto · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Cabezal.test_la_correccion_firmada_no_sale_del_aparato · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Cabezal.test_la_transferencia_respeta_el_movimiento_reducido · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Cabezal.test_motor_prioriza_languagemodel · leia o exigia un fichero del hub que cayo en el bloque 3
    def test_motor_prioriza_languagemodel(self):
        """`window.ai` quedo atras. La forma vigente es `LanguageModel`."""
        motor = (PUBLICO / "assets" / "engine.js").read_text(encoding="utf-8")
        self.assertIn("LanguageModel.availability", motor)
        codigo = re.sub(r"/\*.*?\*/", "", motor, flags=re.S)
        codigo = re.sub(r"(?m)//.*$", "", codigo)
        self.assertNotIn("window.ai", codigo,
                         "engine.js vuelve a la forma obsoleta window.ai")

# --- Traducciones.test_el_bloque_de_estado_va_DESPUES_de_la_pregunta · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Traducciones.test_un_turno_que_el_antidoto_deja_VACIO_se_cuenta · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Traducciones.test_los_rotulos_de_FIRMAR_dicen_lo_mismo_que_su_fuente · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Traducciones.test_la_cadena_de_FEEDBACK_esta_en_las_ocho · leia o exigia un fichero del hub que cayo en el bloque 3
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

# === Comunidad · clase entera: protegia una pagina o un registro del hub (Comunidad) que cayo en el bloque 3
class Comunidad(unittest.TestCase):
    """Los anuncios OFICIALES del Agora, que no son los hilos de EJEMPLO."""

    def setUp(self):
        # Desde el 2026-09-23 los textos viven en `anuncios-<lengua>.json`, por
        # id. Se juntan aqui exactamente como los junta `board-anuncios.js`, y
        # las tres pruebas de abajo siguen mirando lo mismo que miraban.
        self.d = json.loads((PUBLICO / "anuncios.json").read_text(encoding="utf-8"))
        for a in self.d["anuncios"]:
            a["textos"] = {}
            for idi in IDIOMAS:
                f = PUBLICO / f"anuncios-{idi}.json"
                if f.is_file():
                    t = json.loads(f.read_text(encoding="utf-8"))["textos"].get(a["id"])
                    if t:
                        a["textos"][idi] = t

    def test_los_hechos_y_los_textos_no_se_mezclan(self):
        """`anuncios.json` no vuelve a llevar textos: se partio porque no cabian."""
        crudo = json.loads((PUBLICO / "anuncios.json").read_text(encoding="utf-8"))
        for a in crudo["anuncios"]:
            with self.subTest(anuncio=a["id"]):
                self.assertNotIn("textos", a)

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

# === Perfil · clase entera: protegia una pagina o un registro del hub (Perfil) que cayo en el bloque 3
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

    # La ficha dejo de ser pagina el 2026-09-23: sus textos viven en la
    # familia del perfil, y ahi se vigila que lo retirado no vuelva.
    FICHAS = tuple(sorted((PUBLICO / f"perfil-{i}.json") for i in IDIOMAS))
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
            with self.subTest(pagina=str(f.relative_to(PUBLICO))):
                datos = json.loads(f.read_text(encoding="utf-8"))["ui"]
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

# --- Reescrituras.test_los_campos_nuevos_van_al_final · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Reescrituras.test_lo_capturado_se_dice_y_se_puede_apagar · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- Reescrituras.test_habla_las_ocho_lenguas_del_sitio · leia o exigia un fichero del hub que cayo en el bloque 3
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

# --- LoQueNoSeVeConElGateVerde.test_ningun_modelo_publicado_esta_fuera_del_inventario_sellado · leia o exigia un fichero del hub que cayo en el bloque 3
    def test_ningun_modelo_publicado_esta_fuera_del_inventario_sellado(self):
        """`loratelier.json` publicaba `servido_en_el_rack: mistral-small3.2:24b`,
        que no esta instalado, y `escenario.js` usa ese campo como el modelo del
        chat (2026-09-24). Todo modelo que la web publique como servido o como
        base tiene que estar en `config/modelos-rack.json`, generado midiendo
        (`bin/modelos-rack.py --sellar`) y con su sello intacto."""
        inv = json.loads((RAIZ / "config" / "modelos-rack.json").read_text(encoding="utf-8"))
        sello = hashlib.sha256(json.dumps(sorted(inv["modelos"])).encode()).hexdigest()[:16]
        self.assertEqual(inv["sello"], sello, "config/modelos-rack.json editado a mano: "
                         "se regenera con bin/modelos-rack.py --sellar")
        lor = json.loads((PUBLICO / "loratelier.json").read_text(encoding="utf-8"))
        bloques = lor.get("adaptadores") or [v for v in lor.values() if isinstance(v, list)][0]
        for b in bloques:
            for campo, valor in (("servido_en_el_rack", (b.get("ficha") or {}).get("servido_en_el_rack")),
                                 ("modelo_base", b.get("modelo_base"))):
                if valor is None:
                    continue
                with self.subTest(bloque=b.get("id"), campo=campo):
                    self.assertIn(valor, inv["modelos"],
                        f"{b.get('id')}.{campo} = {valor} no esta instalado en el rack")

# --- LoQueNoSeVeConElGateVerde.test_los_medios_no_se_piden_al_cargar · leia o exigia un fichero del hub que cayo en el bloque 3
    def test_los_medios_no_se_piden_al_cargar(self):
        """Tools media panels (2026-09-24): herr-medios.js may only fetch our own
        /medios.json. The Hugging Face and Ollama URLs are LINKS the visitor
        clicks, admitted as such; fetching them on load would break «zero
        external requests». And every entry marked OK carries its verification
        date and, for single-file entries, the sha256 the repository declares."""
        js = (PUBLICO / "assets" / "herr-medios.js").read_text(encoding="utf-8")
        for m in re.finditer(r"fetch\(\s*([^,)]+)", js):
            with self.subTest(fetch=m.group(1)):
                self.assertEqual(m.group(1).strip(), "'/medios.json'")
        cat = json.loads((PUBLICO / "medios.json").read_text(encoding="utf-8"))
        for e in cat["medios"]:
            with self.subTest(medio=e["id"]):
                self.assertIn(e["estado"], ("OK", "NO_DATA"))
                self.assertTrue(e.get("verificado"))
                if e["estado"] == "OK" and len(e.get("ficheros") or []) == 1:
                    self.assertRegex(e["ficheros"][0]["sha256"] or "", r"^[0-9a-f]{64}$")
                if e["estado"] == "NO_DATA":
                    self.assertTrue(e.get("causa"))

# === LaAppAUnClic · clase entera: protegia una pagina o un registro del hub (LaAppAUnClic) que cayo en el bloque 3
class LaAppAUnClic(unittest.TestCase):
    """Pedido por el Soberano el 2026-09-23: la app, a un solo clic de descarga
    eligiendo el sistema. Se vigila que cada pagina de instalar cargue el guion,
    que el guion ofrezca los cinco sistemas y que el enlace de siempre siga en el
    marcado para quien no ejecute JavaScript."""

    def test_cada_instalar_carga_el_guion_de_un_clic(self):
        for idi in IDIOMAS:
            t = (PUBLICO / idi / "instalar.html").read_text(encoding="utf-8")
            with self.subTest(idioma=idi):
                self.assertIn('src="/assets/descarga-app.js"', t)
                self.assertIn("releases/latest/download/install.sh", t,
                              "sin JavaScript tiene que quedar el enlace de siempre")

    def test_el_guion_ofrece_los_cinco_sistemas_y_no_inventa_apk(self):
        js = (PUBLICO / "assets" / "descarga-app.js").read_text(encoding="utf-8")
        for so in ("windows", "macos", "linux", "android", "iphone"):
            self.assertIn(so + ":", js)
        self.assertNotIn(".apk", js, "el APK no existe: el guion no puede enlazarlo")
        self.assertIn("install.ps1", js)

# === LaColaDelRack · clase entera: protegia una pagina o un registro del hub (LaColaDelRack) que cayo en el bloque 3
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

# --- ComentarEnTodasLasPaginas.test_cada_pagina_de_las_nueve_lenguas_lleva_el_comentario · leia o exigia un fichero del hub que cayo en el bloque 3
    def test_cada_pagina_de_las_nueve_lenguas_lleva_el_comentario(self):
        paginas = sorted(p for l in IDIOMAS for p in (PUBLICO / l).glob("*.html"))
        self.assertGreaterEqual(len(paginas), 9 * 7)
        for p in paginas:
            with self.subTest(pagina=str(p.relative_to(PUBLICO))):
                self.assertIn('<script src="/assets/page-comment.js" defer></script>', p.read_text(encoding="utf-8"))

# --- Estructura.test_el_onboarding_es_alcanzable_y_completo · protegia el hub (chat webllm, onboarding, familias de JSON del hub o sus claves i18n), que cayo en el bloque 3
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

# --- Doctrina.test_solo_un_cdn_y_es_webllm · protegia el hub (chat webllm, onboarding, familias de JSON del hub o sus claves i18n), que cayo en el bloque 3
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

# --- Traducciones.test_las_claves_mudadas_estan_donde_dicen_estar · protegia el hub (chat webllm, onboarding, familias de JSON del hub o sus claves i18n), que cayo en el bloque 3
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

# --- LoQueNoSeVeConElGateVerde.test_cada_pagina_con_modelo_ensena_las_medidas_del_turno · protegia el hub (chat webllm, onboarding, familias de JSON del hub o sus claves i18n), que cayo en el bloque 3
    def test_cada_pagina_con_modelo_ensena_las_medidas_del_turno(self):
        """Asked by the Soberano on 2026-09-24: wherever a model answers, show
        the physics of that answer. Every page that loads `rack.js` or
        `engine.js` must load `medidas-turno.js`, and both emitters must
        dispatch `preceptor:medida`."""
        for q in ("rack.js", "engine.js"):
            with self.subTest(emisor=q):
                self.assertIn("preceptor:medida", (PUBLICO / "assets" / q).read_text(encoding="utf-8"))
        for f in sorted(PUBLICO.glob("*/*.html")):
            t = f.read_text(encoding="utf-8")
            if '/assets/rack.js"' in t or '/assets/engine.js"' in t:
                with self.subTest(pagina=f"{f.parent.name}/{f.name}"):
                    self.assertIn('/assets/medidas-turno.js"', t)

# --- LasTresFamilias.test_las_tres_familias_estan_en_las_ocho_lenguas · protegia el hub (chat webllm, onboarding, familias de JSON del hub o sus claves i18n), que cayo en el bloque 3
    def test_las_tres_familias_estan_en_las_ocho_lenguas(self):
        """Una lengua sin fichero no se ve: cae entera al respaldo y calla."""
        for nombre in FAMILIAS:
            with self.subTest(familia=nombre):
                self.assertEqual(set(IDIOMAS), set(self.fam[nombre]),
                                 f"faltan o sobran: "
                                 f"{set(IDIOMAS) ^ set(self.fam[nombre])}")

# --- LasTresFamilias.test_las_seis_lenguas_no_respondidas_lo_declaran · protegia el hub (chat webllm, onboarding, familias de JSON del hub o sus claves i18n), que cayo en el bloque 3
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

# --- atlas/test_atlas.RedisenoDoogee.test_un_solo_boton_de_juego_y_la_ruta_a_la_arena_sigue_valiendo · causa: protegia el boton de juego del CABEZAL DEL HUB (cabezal-rotulos.js), que cayo; la portada ya es el juego
    def test_un_solo_boton_de_juego_y_la_ruta_a_la_arena_sigue_valiendo(self):
        """Hallazgo 2: «entrar y jugar» costaba dos toques de mas. `#thegame/arena` abre la Arena;
        `#thegame` sigue abriendo el juego como siempre."""
        cab = self._js("cabezal-rotulos.js", "assets")
        rx = re.search(r"var RUTA = /(.+?)/;", cab)
        self.assertTrue(rx, "falta la ruta del juego")
        ruta = re.compile(rx.group(1).replace("\\/", "/"))
        self.assertTrue(ruta.match("#thegame"), "#thegame ya no abre el juego")
        self.assertEqual(ruta.match("#thegame/arena").group(1), "arena")
        self.assertFalse(ruta.match("#thegamex"))
        # 2026-10-05, el Soberano: «thegame es solo 1 boton». La Arena vive DENTRO (pestana Battle);
        # `#thegame/arena` sigue valiendo como ruta, pero el cabezal lleva UNA sola puerta de juego.
        puertas = re.findall(r"\['cab-boton thegame[^']*', [^\]]*\]", cab)
        self.assertEqual(len(puertas), 1, f"vuelven a ser dos botones de juego: {puertas}")
        self.assertIn("'#thegame'", puertas[0])
        self.assertNotIn("'#thegame/arena'", cab, "la Arena vuelve al cabezal como boton propio")
        tg = self._js("thegame.js", "assets")
        self.assertIn("function abre(desde, pes)", tg)
        self.assertIn("if (pes && PANEL[pes]) { muestra(pes); }", tg)
        self.assertIn("RUTA", tg, "cerrar no reconoce la ruta nueva")
