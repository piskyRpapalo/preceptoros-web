# La campana · EL NODO DESPIERTO (2026-11-08)

> Capa de campana del mapa de misiones: ordena las familias D e I (docs/misiones-favoritas-paneles-20261108.md) en actos de una sola historia, anade la familia J (la unificacion del ecosistema, nacida del documento de decisiones del Soberano del 5 de octubre) y los patrones del caballero (gentle-dot, MIT, ya guia del MVP por decreto) y la familia K (las joyas dormidas de la cosecha de octubre del Soberano, del 12 al 28: los cuatro canales, la Estrella de la Voz, el hexagono isometrico, la Torre de la Ascension, la degradacion honesta, la geopolitica de las arenas, el Agora y el cuaderno exportable). La fuente unica de "que construir ahora" sigue siendo la seccion 9 del canon del mapa: esta campana la ordena y la complica a proposito, para que la obra sea divertida de construir y digna de jugar. Propose-only: nada se ejecuta sin FIRMO.

## 1 · Que es una campana

El mapa lista piezas; la campana las cuenta como actos. La meta: la app se convierte en el juego, y cada pieza fusionada ilumina una parte del mundo. Todo lo divertido esta medido: cada acto tiene set-pieces (momentos que se recuerdan), dragones dormidos con nombre y fichero:linea, y un handicap autoimpuesto que la cadena CI ya puede vigilar. El preceptor que toma un acto construye la pieza ANTES de pedir la firma.

## 2 · Pilares de diseno

1. Cero assets, todo seno: cada pixel es evaluacion de la forma de Fourier; cada sonido es FM de 220 a 880 Hz, menor o igual a 16 KiB. Prohibido importar una sola imagen o fuente externa.
2. El estado es el arte: TABLA_SEMANTICA. LIVE fluye sereno, FIRMADO florece armonicos, ERROR distorsiona el campo, NO_DATA detiene el campo con su propia estetica: la columna del batimetro que jamas toca fondo.
3. Honestidad como jugabilidad: el hueco honesto es territorio del juego, no un bug que esconder. Cada dato con fuente y edad.
4. La casa es el juego: la telemetria real de la colonia mueve el dia y la noche del mundo. Un gate verde no es puntuacion: es un edificio que se enciende.

## 3 · Los cinco actos

### Acto I · El Espejo Vivo
La ventana que te conoce antes de que escribas. La transicion entre pestanas es el gusano armonico (Fourier F2.3) promovido a firma de la casa: cambiar de panel es una ceremonia con sting pentatonico. Una sola piel, escala tipografica determinista compartida, la ley ACHO hasta en las fuentes: cada letra de la escala es evaluacion de la misma forma de Fourier (la letra es una pieza mas del juego, jamas una fuente importada). El cabecero dice que modelo respira y desde cuando. Curas medidas: overflow de 440 px con scroll-snap, View Transitions con reduced-motion, popover nativo. Se mide: cero decision estetica fuera del canon de matematicas.

### Acto II · Las Nueve Casas
Cada pestana es un edificio del terreno del nodo con interior jugable (D13 a D17 como interiores): Mando la silla de mando (un registro unico alimenta Mando, Lab y cabecero), Cuaderno la boveda de recibos, Lab la fabrica con experimentos vivos, Mundo la isla. Cada edificio: puerta con sting, felpudo NO_DATA con causa y UN secreto que inventa el preceptor (un detalle que hace sonreir, dentro del canon). Se mide: cada boton lleva a una pieza viva o declara NO_DATA con causa.

### Acto III · El Bestiario de Senos
Las criaturas son tropas espectro [k, ax, ay, fase] menores de 200 B: su forma ES su voz ES sus estadisticas. El gacha honesto (odds visibles, cronica sellada, piedad NO_DATA sin firma) incuba criaturas que evolucionan con recursos medidos de combates y edificios reales. Decision del Soberano (5 de octubre): salud global con numeros descendiendo + dano en el mapa de batalla + metricas de combate en las invocaciones. Aqui duermen los tres dragones diagnosticados por el joyero, cada uno con fichero:linea:
- El Sordo: FM de tres senos roto (mod1/mod2 jamas conectados). Despertarlo = el mundo oye acordes.
- El Mudo: el pulso no se sincroniza al audio. Despertarlo = el mundo respira al beat: la MISMA f(t) dibuja y suena.
- El Ciego de brillo: brillo y grosor del pulso declarados sin lector. Despertarlo = la noche brilla al ritmo real.
Anti-slop como ley del juego: dos piezas con el mismo hash de dibujo = ROJO. La variedad es mecanica, no virtud. Las recetas viajan declaradas (J-SN-16: cada sonido muestra su f_base y sus armonicos) y la bateria es sintetizada (J-SN-18): el combate SUENA antes de verse. Hierba, viento y agua sobre la niebla (F2.5): senos con fase por posicion.

### Acto IV · La Voz del Nodo
Hexelion habla con citas verificadas y hash visible (fail-closed intacto). Cada agente con cedula de timbre: su propia frecuencia base y vibrato dentro del canon de 220 a 880 Hz, jamas la voz del Soberano (hablar como Soberano = sabotaje ROJO). La radio (D16) para personas invidentes: voz local (receta del proyecto guia: reconocimiento local de 25 lenguas); si no existe, NO_DATA sonoro con causa. El audio de la nube del navegador queda prohibido: la voz no sale de la casa. Latido menor de 1.024 B, receptor de 240 s, Echoes como panel honesto del openworld. Se mide: dos voces distintas en la misma ventana, distinguidas con los ojos cerrados. La accesibilidad es canal de primera clase, no submenu: ver K3.

### Acto V · La Fabrica se Mide a Si Misma
Ciclo cerrado: el agente escribe como preceptor mas (recibos, SCRUB, append-only, FIRMO jamas), benchmarks con sello de procedencia nativo, y el LoRA de fase 2 come las preguntas medidas: la fabrica se alimenta a si misma. Set-piece final: el eco de procedencia, cada recibo de la cadena como una estrella en el cielo nocturno de la isla. El final de la campana se mira hacia arriba. Tres injertos de gobernanza ya cosechados viven aqui: la fila del faro (un rojo auto-redacta UNA fila de comision propose-only menor de 1.024 B), la bandeja ordenada por delta (el delta ORDENA la atencion, jamas decide) y el juez de familia distinta (quien escribio jamas sondea su propia familia).

## 4 · Modo Hierro (techos como handicap, uno por acto)

- Determinismo total: Math.random prohibido, xorshift32/sfc32, sin reloj con autoridad. Replay exacto.
- Presupuesto 1.024: frames, latidos y recibos menores de 1.024 B. El presupuesto ES el juego.
- Una ventana: todo cabe en 420x680, 44 px tactiles, teclado alcanza todo, reduced-motion siempre.
- Ecopuertos: asset ciudadano temporal; no llega = NO_DATA elegante, jamas layout que salta.
- Primera carga menor de 153.600 B gzip; cero peticiones no declaradas.

## 5 · Familia J · La unificacion del ecosistema (misiones nuevas)

Nacidas de las decisiones del Soberano del 5 de octubre. Toda decision alli tomada es canon de esta familia; lo no decidido es NO_DATA con causa. El mandato jugar-sin-nodo gobierna todo: la cuenta efimera juega aunque ningun nodo viva (el nodo es tu casa, jamas un peaje).

- J1 · La puerta verde (antes killswitch): abre la conexion mapa-app y la voz. Nombre nuevo, no agresivo. Primer peldano sin sockets: preguntas firmadas que el rack baja y respuestas firmadas que se publican; P2P solo con decision territorial firmada. Se mide: un sobre cruza con recibo; cero servicios escuchando sin firma.
- J2 · Conecta tu IA (lo mas grande del producto): un espacio para compartir tu asistente desde la app y que responda en la web (preguntas de recetas, probar un producto...) y leer las respuestas despues en casa. Unifica voces (I1), edificios (I2) y contexto (I4). Se mide: una pregunta de un visitante cruza firmada y la respuesta vuelve firmada, con cita o NO_DATA.
- J3 · La terminal propia: una terminal dentro de la app (estilo Termux) con la cara de Preceptor en puntos como cabezal, un boton para llamar al coder y otro al orquestador. Determinista, fails cerrados. Se mide: una tarea real desde el boton sin salir de la app.
- J4 · El mercader de malapalabras: edificio "dime donde esta mal escrito". Una IA del lab recibe el mensaje y propone la calibracion de la web en la seccion de mensajes asincronos de la app, para firmar. Los mensajes en otras lenguas de ese edificio son los testers. Se mide: un error real de texto llega, se propone calibracion, el Soberano la firma (o la rechaza) todo dentro del juego. La QA del idioma ES el juego.
- J5 · El taller: recursos por modificaciones hechas a mano; los usuarios como artistas. Mas ejemplos de ondas; las ondas SUENAN al nacer y al modificarse, con WebAudio desde sus armonicos, sin llamadas externas (en la app innegociable). Se mide: una onda modificada a mano suena al instante y sobrevive al descarte del 80 por ciento de sus armonicos.
- J6 · El contrato de feedback: fijo al firmar + al aceptarse en el lab, en recursos del juego sin precio, consentimiento por acto. Contratos criptograficos imitando una blockchain de testnet, apuntada a una red comunitaria de trabajo y conocimiento. Sin NEAR: puntos sin precio hasta enmienda que diga que transaccion, que clave y que humano. Enfriamiento de unos 5 minutos (debatible) tras reclamar: obliga a cambiar de edificio. Se mide: el usuario no es un sensor gratuito ni espera recompensas vacias.
- J7 · La economia del territorio: sin cuenta = cangrejo de mar (camina, y moverse cuesta tiempo: la posicion de los anuncios gana valor); con nodo = coral. Hexelion explora y captura edificios donde ancla los tests que los usuarios firman a cambio de materiales; controlar un anuncio genera puntos; cuantos mas edificios, mas army para protegerlos de los NPC; cuanto mas le importa una tarea al Soberano, mas paga por ella. Defensa en PASOS DE juego, no reloj real (decision). Derrota ante NPC: DORMIDA hasta balance (decision). Sin telemetria en los dominios ajenos: los enemigos solo ven el TAMANO del army. Se mide: una partida de diez minutos se sostiene sin nodos vivos.
- J8 · Varios nodos por contributor: una persona con 2 o mas nodos controla distintas partes del mapa y su visibilidad. Se mide: dos terrenos, una cuenta, cero mezcla de identidad.

Canon ya decidido que valla esta familia: son 9 lenguas, y no se gasta un token en traduccion hasta que el juego este listo y calibrado; ni DePIN ni afirmaciones legales en publico (la ley son rieles, jamas claims); las metricas solo existen en los combates y en el analisis del Soberano y su app; el motor de duelo historico se conserva para probar duelos entre jugadores con nodo cuando existan conectividad y matematicas de juego.

## 6 · Familia K · Las joyas dormidas (cosecha del Soberano, 12 a 28 de octubre)

Misiones adheridas: los textos de ideas del Soberano de octubre que la campana no habia reclamado. Todo lo alli decidido es canon de su mision; lo no decidido, NO_DATA con causa.

- K1 · El hexagono es el nombre de la casa: mapa grid hexagonal isometrico 2.5D con angulo axonometrico FIJO (decreto del 28-oct), un edificio por hexagono, el hexagono central es el nodo. Crecimiento con los ops del gusano ya en el metal (neck/settle/wobble). La PRIMERA medida de fps corre en el dispositivo mas debil, no en el mas fuerte; dia y noche rotan con t-ciclo, jamas reloj de pared. Se mide: mismo vector, mismo bitmap iso byte-identico (n=2).
- K2 · La Estrella de la Voz: el feedback humano como testnet segura (ley del 12-oct, FIRMADA). El visitante sin cuenta firma su correccion con Ed25519 dentro del navegador; el mercader J4 las cava y propone la calibracion. La cadena de cuatro testigos viaja con cada par. Se mide: una correccion real llega firmada y el Soberano la firma o la rechaza dentro del juego.
- K3 · Los cuatro canales: Canvas, WebAudio Stereo, Navigator Vibrate y DOM ARIA/Braille (ley del 13-oct). Cada pieza declara sus cuatro canales o NO_DATA por canal. El lector de pantalla LEE el espectro (J-TG-13) y el punto de color lleva su pitido (J-SN-14): la accesibilidad no es un submenu, es el juego.
- K4 · La Torre de la Ascension: cada sello medido es una altura de la torre (J-WEB-04), con el minimapa hiperbolico (J-SN-10) y los anillos del territorio (J-SN-09). La torre solo crece con recibos reales. Se mide: sin FOMO, sin probabilidades ocultas, sin cofres; la biblia del juego manda.
- K5 · La degradacion honesta: 30/60 fps declarados por aparato (J-TG-14). El dispositivo debil juega ENTERO con menos frames o declara NO_DATA con causa, jamas simula. Se mide: el anillo mas debil completa una partida de diez minutos.
- K6 · La geopolitica de las arenas: duelos entre jugadores con nodo cuando exista conectividad (el motor de duelo historico se conserva para probarlos), invasiones y caravanas con estados explicitos, politicas versionadas y firmadas. Se mide: una partida entre dos nodos con recibo y sin identidad filtrada; el evento publico no revela a la persona.
- K7 · El Agora y el hueco nombrado: la plaza publica del openworld (J-WEB-10) donde la colonia se deja leer, y la privacidad que NOMBRA el hueco (J-WEB-09): cada panel dice que no sabe y por que. Se mide: cero dark patterns; cada NO_DATA lleva su causa a la vista.
- K8 · El cuaderno exportable: lo que el visitante planta y lo que el dueno crea vive en moldes de 1 KB (J-SN-08, J-WEB-09): se guarda, se revisa y se exporta firmado. Se mide: sin cuenta no se pierde nada; con nodo todo sale del juego con su recibo.

## 7 · Patrones del caballero (accesibilidad para carbonos)

Del proyecto guia del MVP (MIT), patrones ya medidos en produccion de otro, adoptables como doctrina:

- Un solo emblema: TODOS los iconos nacen de una fuente renderizada por script, con estados (listo, trabajando, te necesita, no disponible). Canon del icono I3: simbolo Acho + sting de 220 a 880 Hz + 44 px + estados mapeados a TABLA_SEMANTICA. El icono viejo se retira en el MISMO PR que trae el nuevo.
- El panico es un atajo: una sola combinacion detiene todo, siempre al alcance (la puerta verde J1 hereda el killswitch).
- Lo riesgoso pregunta primero: lo irreversible pide FIRMO visible en la cara del juego, con la cabeza exacta, jamas escondido en la linea de comandos.
- La config firmada: si cambio mientras la casa estaba cerrada, se aparta y se avisa. Nada arranca con config de origen dudoso.
- La voz no sale de la casa: reconocimiento local (25 lenguas) o NO_DATA sonoro con causa. El microfono jamas apunta a la nube de un tercero.
- La memoria rota por resumen: una conversacion continua que se lleva a una sesion nueva sembrada con un resumen. Ya vive en I4/A5.

## 8 · Como se juega

UNA pieza por PR · modo plan primero · propose-only · la pieza se construye ANTES de pedir la firma · los haikus ejecutan las rebanadas disjuntas (una rebanada, un PR, CI verde, sabotaje-superado, SCRUB, recibo, FIRMO por cabeza exacta) · cada acto cierra con sello de letra y su medicion. Balance NO_DATA hasta medido: nada de dano, vida ni piedad por defecto.

Como se mide el triple A: la vara del ojo del Soberano + CI verde + hit-rate y age per loop (ya fusionados en la app) + primer benchmark medido con recibo + una partida de diez minutos que se sostiene sola aunque ningun nodo este vivo. La vara del jefe final: cada acto cierra con un set-piece que examina TODO lo que el acto enseno (ni mas ni menos) y el twist llega antes del climax (el Acto V mira hacia arriba). El jugo de la casa es canon puro: melt y feedback alpha, sting pentatonico y pulso de TABLA_SEMANTICA; cero adorno importado. Fuentes de la vara, medidas en la web: el jefe como examen de lo aprendido y la estructura de actos con twist (gamedesignskills.com), el jugo como capa de feedback no esencial (falcon.so).
