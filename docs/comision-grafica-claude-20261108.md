# La comisión gráfica de claude: Acho al máximo realismo family friendly (2026-11-08)

> Decreto del Soberano (2026-11-08): enfocarse también en lo gráfico, aprovechando Acho de la manera más potente que claude pueda, para los edificios y para los personajes que manejan los usuarios; los objetivos interactivos de los que se ha hablado en el pasado, con la potencia gráfica del máximo realismo family friendly que claude opus pueda aportar. Este documento EXPANDE misiones que ya viven en la fuente única (sección 9 y la cosecha): cada una conserva su ID. Propose-only: nada se fusiona sin FIRMO del Soberano por cabeza exacta.

## 1 · La doctrina gráfica de la casa (qué significa máximo realismo aquí)

- El realismo nace de la LUZ y del MATERIAL, no del archivo: nada se descarga; todo se calcula. La web sigue sin pedir nada afuera al cargar.
- Acho es la fuente: la forma es una función (senos, espectros, semilla), no una textura. La tipografía ya es senos (F8); el cangrejo ya es forma y paseo calculados del espectro (D11); el audio ya es ADSR y FM de tres senos con tono por color de 220 a 880 Hz y vibrato de 3 Hz. La gráfica obedece a la misma ley.
- Determinista o nada: el MISMO estado produce el MISMO cuadro (ley D4, tres proyecciones). Math.random queda prohibido; xorshift32 con semilla en el recibo.
- Family friendly es ley, no estilo: cero gore, cero terror; la pelea se lee como juego de mesa; el golpe desentona, no desangra (D11 canon).
- El cuadro se presupuesta: 30/60 fps declarados por aparato (K5c); el débil juega ENTERO con menos efectos; bajo el mínimo, NO_DATA con causa.
- Toda pieza gráfica declara los cuatro canales (K3c): Canvas, WebAudio Stereo, Vibrate y ARIA/Braille. El espectro se OYE y se LEE (K11): el lector de pantalla nombra lo que el ojo ve.

## 2 · Los patrones gráficos del oficio (renombrados por la casa)

- **EL FARO**: un solo modelo de luz para todo el mapa. El ángulo del sol sale del reloj del mundo; la paleta día y noche ya está medida y fusionada (familia I). La sombra se calcula de la geometría del hexágono; la sombra es una función del edificio, no un archivo aparte.
- **EL MOLDE**: cada tipo de edificio es UNA función de su clave de léxico (C1 canon: volumen y clave de léxico por tipo). Entrada: tipo, tier, semilla. Salida: el cuerpo del edificio con su material. El molde cabe en bytes contados (K8c: moldes de 1 KB, se guardan, se revisan, se exportan).
- **EL CUERPO**: el personaje del usuario es espectro (D11): sin huesos, sin esqueleto importado; el cuerpo es una suma de senos y el paseo es una fase. Las tropas del visitante (D5) comparten el mismo cuerpo con distinta semilla.
- **LA PUERTA**: todo objetivo interactivo es un edificio con UNA puerta (I8 canon). La puerta es el marcador del objetivo: gacha (D4), duelo (D5), mercader (J4), taller (J5), torre (K4c), ágora (K7c). Sin capacidad declarada, la puerta muestra NO_DATA con causa; jamás miente.
- **EL PULSO GRÁFICO** (heredado de la comisión anterior): el presupuesto del cuadro medido en vivo; la escalera de degradación elige cuánto efecto dibuja cada aparato; el número se muestra.
- **LA HUELLA**: el juego de cuadros se sella con hash en CI (N6): una regresión visual se vuelve roja sin ojo humano; la misma semilla produce el mismo cuadro o el test falla.

## 3 · Las misiones gráficas expandidas (la comisión y las piezas que escribe claude)

### C1 · Give volume to the buildings, con EL FARO y EL MOLDE · WEB · STE-3

La comisión (STE): da volumen al edificio. Calcula la sombra del volumen. Declara la clave de léxico del tipo. Muestra el material. La luz viene del reloj del mundo.

Las piezas que escribe claude:
1. EL MOLDE: la fábrica de edificios; una función por tipo del léxico; entrada (tipo, tier, semilla), salida el cuerpo con volumen en el grid 2.5D de ángulo axonométrico FIJO (K1c, decreto del 28-oct).
2. EL FARO: el modelo de luz único; ángulo del reloj; paleta día y noche canon; sombra suave calculada de la geometría del hexágono.
3. El material por tipo: color, aspereza y brillo computados de la clave; cero texturas descargadas; el brillo de un Lumen es una onda, no un PNG.

La vara: mismo estado produce el mismo cuadro (test determinista); el edificio entero nace de su molde con bytes contados en el recibo.
Alimenta: I8 (la puerta necesita el cuerpo), C7 (los interiores), K4c (la torre crece por sello). Estado: propuesta.

### C7 · Make the building interiors, con EL MOLDE · WEB · STE-3

La comisión (STE): audita la elevación antes de construir. Declara qué pieza ya vive y dónde. Construye el interior con el molde. El interior hereda la luz del FARO.

Las piezas que escribe claude:
1. La auditoría de elevación medida (qué pieza del interior ya vive, con fichero y línea).
2. El interior como segundo molde: mismas leyes que el cuerpo; la cámara del interior proyecta el MISMO estado (ley D4).

La vara: la auditoría con citas; el interior pasa el test determinista y declara sus cuatro canales.
Alimenta: D3 (el chat del edificio), J4 y J5. Estado: propuesta.

### I8 · Make the buildings interactive, con LA PUERTA · WEB · STE-3

La comisión (STE): pon UNA puerta por edificio. La puerta declara su capacidad. Si la capacidad existe, la puerta abre la pieza. Si no existe, la puerta muestra NO_DATA con causa. La puerta se oye, se siente y se lee.

Las piezas que escribe claude:
1. LA PUERTA: el marcador del objetivo; estados de la puerta en tabla declarativa (cerrada, abierta, sin capacidad), al estilo del CORO; transiciones fail-closed.
2. Los canales de la puerta: resalte en Canvas al acercarse; tono del canon de audio al abrir (FM de tres senos, tono por color); vibración corta en el teléfono; etiqueta ARIA que nombra el edificio y su objetivo.
3. El registro de puertas: cada edificio del mapa declara su puerta o su NO_DATA con causa; el juez cita o calla.

La vara: cada edificio con puerta abre SU pieza y ninguna otra; el visitante sin cuenta también llega a la puerta (D12: el tutorial del territorio vive).
Alimenta: D4, D5, J4, J5, K4c, K7c: TODOS los objetivos interactivos hablados entran por aquí. Estado: propuesta (decreto).

### D2 · Add the second joystick, con EL CUERPO · WEB · STE-3

La comisión (STE): el personaje nace con el joystick (decreto). El joystick mueve el cuerpo del espectro. Coordenada y sonido. 44 píxeles. El teclado alcanza todo.

Las piezas que escribe claude:
1. EL CUERPO del visitante: forma desde el espectro (D11 canon); el paseo es fase: la pierna es seno, la pinza es seno; sin huesos importados; semilla del visitante en su clave.
2. El joystick del personaje: 44 px táctiles (F7 canon); el sonido del paso sale del canon de audio; el rumble del paso es la frecuencia del cuerpo.
3. El test del paseo: misma semilla, mismo paseo, cuadro a cuadro (la huella del frame).

La vara: el test del paseo en verde; el personaje entero dibujado desde el espectro con cero assets.
Alimenta: D5 (las tropas comparten cuerpo), D12, el modo audio (D10). Estado: decreto; el personaje NO_DATA.

### D11 · Keep the crab honest, con EL CUERPO · WEB · STE-2

La comisión (STE): mantén la forma calculada. Cada golpe desafina una onda; el golpe se lee, no se sangra. El paseo es fase. La física es xorshift32.

Las piezas que escribe claude:
1. El afinador del golpe: el hitstop se mide en cuadros (el patrón del DUELO DE VARIANZA BAJA de la comisión anterior); family friendly por construcción: la reacción es desintonía, jamás daño visual.
2. El test del cangrejo honesto: misma semilla, mismo paseo; el espectro del cuerpo coincide con su lectura de audio (K11: el lector de pantalla nombra lo que el ojo ve).

La vara: el test del cangrejo en verde; cero Math.random en el cuerpo y en el paseo.
Alimenta: D2, D5, la campaña (el cangrejo es el visitante sin cuenta). Estado: medido; el cuerpo del espectro se refuerza.

### K3c · Los cuatro canales de cada pieza gráfica · WEB · STE-3

La comisión (STE): declara los cuatro canales en cada pieza que dibuja. Canvas muestra. WebAudio suena. Vibrate avisa. ARIA nombra. Si un canal falta, declara NO_DATA con causa.

Las piezas que escribe claude:
1. La declaración de canales por pieza: una fila por pieza en el registro del mapa; el juez la lee.
2. El sonido de lo gráfico: cada evento visual tiene su tono del canon (220 a 880 Hz por color, vibrato 3 Hz); el agua es onda; el brillo es onda.
3. La prueba del niño y el lector (K11): un niño y un lector de pantalla eligen el mismo valor.

La vara: cero pieza gráfica sin sus cuatro canales declarados; la prueba del niño y el lector pasa.
Alimenta: K11, D10 (el modo audio), toda la familia D. Estado: ley 13-oct (campaña, fusionada).

### N4 · Project the first frame, con LA HUELLA · WEB · STE-4

La comisión (STE): dibuja la primera silueta de Acho. Cabe en 1.024 B con su CAUSA_RESIDENTE. La misma silueta en la app y en la web. Sella la silueta.

Las piezas que escribe claude:
1. La silueta del primer cuadro: la primera cosa que el visitante ve; toda en Acho; bytes contados.
2. LA HUELLA: el test del hash del juego de cuadros en CI (N6); la regresión visual se vuelve roja.

La vara: la silueta pasa 1.024 B con causa; el hash del cuadro idéntico en app y web.
Alimenta: N6, N13 (el cielo de procedencia: cada recibo una estrella). Estado: propuesta (tablero, fusionado).

## 4 · La escalera gráfica (el orden que desbloquea)

1. C1 primero: sin cuerpo no hay puerta; el molde y el FARO alimentan todo.
2. I8 con C1 vivo: la puerta abre los objetivos (gacha, duelo, mercader, taller, torre, ágora).
3. D2 y D11 en paralelo: el personaje y su paseo.
4. K3c en cada pieza desde el primer día; no se añade al final.
5. C7 cuando la puerta exista: el interior es el premio de la puerta.
6. N4 y N6 sellan: la silueta y la huella cierran el ciclo.

## 5 · Los límites que no se negocian en gráfica

- Cero descargas al cargar; cero texturas archivadas: si pesa como archivo, no es Acho.
- El cuadro se presupuesta (K5c): 60/30 declarados; el efecto cae antes que el juego.
- Toda pieza gráfica pasa el test determinista: misma semilla, mismo cuadro, o rojo.
- Recibo <1.024 B con bytes del molde, cuadros y presupuesto; SCRUB; relevo en buzon#54 al cerrar; y antes de pararse, la siguiente misión del índice ya elegida (el bucle).

Agent: preceptor-orquestador-github · Model: GLM (Vibe) · Run: NO_DATA
