# Estado técnico de la web · 2026-09-08

Escrito para que una sesión nueva pueda trabajar el GitHub de los dos
proyectos sin volver a medir nada. Todas las cifras de aquí salen de contar
los ficheros, no de recordarlos.

---

## 1 · Qué es esto, en una frase

Un sitio estático de siete páginas por idioma, ocho idiomas, sin build, sin
framework y sin dependencias. Lo que hay en `public/` es exactamente lo que
recibe el navegador. Se despliega empujando a `main`.

## 2 · El terreno, contado

| | |
|---|---|
| Páginas HTML | **59** — 7 × 8 idiomas, más `index`, `hitos` y `manifiesto` en la raíz |
| Idiomas | es · en · fr · pt · it · de · ru · el |
| Hojas de estilo | 23 |
| Guiones | 47 |
| Ficheros de datos | 31 `.json` + el `webmanifest` |
| Peso que se despliega | **4,6 MB de `assets/`**, de los que 2,2 MB son `assets/caras/` |
| Peso en disco | 110 MB — los otros 105 son `public/downloads/*.gguf`, **ignorados por git** |
| Tope por fichero | **16 KiB**, vigilado por el gate |
| Pruebas | `test_web.py` **93** · `arnes_sw.mjs` **24/24** |

**El fichero que menos margen tiene es `sw.js`: 16.003 B de 16.384.** Quedan
381 B. El siguiente que se le acerca es `hub-textos.json` con 15.908. Quien
toque el worker cuenta bytes antes de escribir, y si no caben **parte por
asunto, nunca recorta un comentario**.

Los `.gguf` de `public/downloads/` pesan 105 MB y **no llegan a Cloudflare**:
`.gitignore:13` los excluye y el despliegue sale del repo. Los enlaces de
descarga apuntan a *releases* de GitHub, no a esta carpeta. Lo que sí se
versiona ahí son los `.sha256`, que son el dato.

Las siete páginas de cada idioma: `index` · `instalar` · `benchmark`
(LoRAtelier) · `community` · `onboarding` · `playground` · `profile`.

## 3 · Las reglas que el gate impone

No son estilo: son las que se rompen solas si nadie mira.

1. **Ningún fichero pasa de 16.384 B**, `.html`, `.css`, `.js` y `.json`
   incluidos. Cuando uno se pasa **se parte por asunto; jamás se recorta un
   comentario** — en este árbol los comentarios son la documentación, y
   quitarlos para salvar un número es pagar el tope con lo único que no se
   puede volver a deducir del código. Hoy se partió siete veces.
2. **Paridad de idiomas.** Toda clave que un guion lea como `T.algo` tiene que
   existir en las ocho portadas. Una lengua a medias pone el gate rojo.
3. **Contraste medido, no elegido.** Cada color de texto tiene su medida al
   lado en el comentario. La trampa que ya mordió dos veces: *un color medido
   contra un fondo no vale contra el contrario*, y los tokens giran con el
   tema mientras un hexadecimal fijo no.
4. **Cero peticiones externas al cargar.** Ni fuentes, ni analítica, ni CDN.
5. **Un hueco se llama hueco.** Donde falta un dato se dice, con su causa, en
   vez de enseñar uno viejo con cara de fresco.

### La trampa del gate, que costó seis rojos hoy
**El guardián lee los comentarios como si fueran código.** Nombrar un radio,
un `backdrop-filter` o un `text-shadow` en una frase que explica por qué *no*
se usan pone el gate en rojo. Se reformula la frase; no se toca el guardián.

## 4 · La forma de la portada, hoy

Un solo marco de bronce (`main:has(#chat)`) engloba todo el lugar de trabajo.
Dentro, de arriba abajo:

- **Cabecero.** En escritorio: marca a la izquierda, los dos mandos —cuenta y
  ajustes, gemelos, dorados y transparentes— en la esquina superior derecha.
  En teléfono son dos renglones: marca con GitHub y LinkedIn, y debajo la
  cuenta con la rueda a la derecha.
- **La declaración solar** es una nube con una pila que se carga, dibujada
  entera en un pseudo-elemento — cero etiquetas nuevas.
- **Las cuatro puertas** a tamaño mínimo.
- **La esfera**, Capa 4, anclada a la derecha y empezando por debajo de los
  mandos para no taparlos. Se enciende en neón al pensar y saca la nube
  «Activando modelo» sólo durante la espera.
- **La placa del chat**, con desvanecido del texto al llegar arriba y la línea
  de escribir pegada abajo.
- **Los atajos**, y debajo **el cuadro de especificaciones**: quién te habla y
  para qué sirve, el motor, la velocidad medida y las ocho nubes de compañero.

### La escala de capas
`--capa-1-chat:10` · `--capa-2-cabezal:20` · `--capa-3-lateral:30` ·
`--capa-4-cara:40` · `--capa-5-lleno:50` · `--capa-telon:90`. Los mismos
números y los mismos nombres que la app, a propósito.

## 5 · Cosas que hay que saber antes de tocar nada

### 🔴 La que tumbó el sitio entero el 2026-09-08 · lee esta primero

**Cloudflare Pages redirige todo `.html` a su ruta sin extensión.**
`/es/benchmark.html` responde **307** hacia `/es/benchmark`. No es
configurable desde este repo: no hay `_redirects` ni `_headers`, es el
comportamiento por defecto de la plataforma.

Y de ahí sale la avería, que costó un día de sitio caído: `fetch` sigue el
salto, y la respuesta que vuelve trae `redirected: true`. **Un service worker
no puede contestar a una navegación con una respuesta marcada así** — el
navegador la rechaza en seco, con `ERR_FAILED`. Como el worker precacheaba las
rutas con `.html`, 49 de las 118 del shell estaban envenenadas. Sólo se
salvaban `/` y `/es/`, las únicas rutas sin extensión.

Tres cosas que hay que saber de esta clase de fallo, porque ninguna es obvia:

- **`curl` da verde con el sitio caído.** No tiene service worker. Se midió el
  dominio sano tres veces mientras no cargaba en ningún navegador.
- **Viaja en el aparato, no en la red.** Falla igual en casa y en otro wifi, en
  PC y en teléfono, porque lo roto es el caché instalado. Cambiar de red no
  cambia nada, y eso despista hacia el DNS o el dominio.
- **Un `ERR_FAILED` no es un 404.** Un 404 lo sirve el servidor; esto lo aborta
  el navegador antes. Si el sitio «no carga» pero `curl` responde 200, mira el
  worker antes que el dominio.

Se arregló en los **tres** sitios por los que entra o sale la marca —al
precachear, al refrescar por detrás y al leer del caché—; arreglar uno solo
deja el sitio roto igual. `arnes_sw.mjs` cubre ahora los tres y **está
comprobado que caza**: contra el worker viejo da 3 en rojo. Si tocas el
worker, no borres esas pruebas para que pase el gate.

- **El caché del navegador enseña código viejo.** Costó media hora hoy leyendo
  una regla que estaba en disco y no en el navegador. La única forma fiable de
  mirar un cambio es servir en **un puerto nuevo**:
  `python3 -m http.server <puerto> --directory public`.
- **El telón bloquea las capturas headless.** El tiempo virtual de Chrome no
  adelanta su retardo. Para fotografiar hay que servir una copia de `public/`
  con el bloque `.telon` quitado — es como se hicieron las cuatro imágenes de
  `docs/img/`.
- **Retirar un mando es retirar también lo que le obedecía.** Se quitó el botón
  de Herramientas y las nubes quedaron invisibles porque el código que las
  plegaba seguía corriendo.
- **`display:contents` anula el `order` del envoltorio.** Media hora buscando
  por qué la rueda no se movía de la esquina izquierda.
- **Un `top` no gana a un margen: se suman.** Los dos mandos declaraban la
  misma altura y uno caía 11,2 px más abajo, que es exactamente el
  `margin-top` que `.fila` le regalaba.
- **Con `margin-left:auto` en dos cajas, el hueco se reparte** en vez de
  cerrarse. Empuja la primera; la segunda sólo la sigue.

## 6 · Para el trabajo de GitHub

### Lo que ya está
- `docs/img/` tiene **cuatro capturas regeneradas hoy** contra la versión
  desplegada: `puerta.webp`, `chat.webp`, `install.webp`, `phone.webp`.
- Los dos README están **redactados y sin aplicar**, pendientes de firma:
  sólo en inglés, frases simples, sin nombres propios. La app se presenta como
  medidor de IA y acceso democratizado al autoconocimiento; la web, como guía
  para romper la barrera técnica y crear comunidad.

### Lo que falta
1. **Aplicar los README** una vez firmados. El actual de la web es bilingüe y
   describe una versión anterior de la página.
2. **Una quinta captura** con el teclado abierto en un teléfono real. Lo que
   hay está medido forzando `--alto-visible` en el navegador, no en metal.
3. **Descripción, topics y enlace** de los dos repositorios: hoy no hay nada
   que diga en la propia ficha de GitHub qué es cada uno.
4. **Revisión nativa de ruso y griego.** Son las dos lenguas que no puedo
   revisar, y copia de producto mal traducida en un sitio público es peor que
   no tenerla.

## 7 · La identidad, y el terreno de la cuenta de editor

Medido el 2026-09-08. Se escribe porque la cuenta de editor **no hay que
inventarla desde cero**: casi todas las piezas ya están puestas, y lo que falta
es una decisión, no un sistema.

### Lo que ya existe y funciona

- **Identidad soberana** (`assets/auth.js`, 13.265 B). Par de claves **Ed25519**
  generado en el navegador con `generateKey(..., false, ...)` — el `false` es
  lo importante: la clave privada es **no extraíble**. Vive como `CryptoKey` en
  IndexedDB (`preceptoros` / `identity` / `me`), firma cuando se le pide, y no
  la puede leer ni esta página ni ninguna otra.
- **La pública sí se exporta**, en crudo y a hexadecimal. De ella sale el
  *apodo* que se enseña. Esa cadena es lo que puede ir en una lista.
- **Firma real**: `ed25519:<128 hex>` con autor y algoritmo. Ya devuelve el
  objeto entero.
- **Hay backend propio y está vivo**: `https://api.preceptoros.org`. Hoy
  responde:

      GET /api/v1/threads
      {"estado":"OK","hilos_reales":0,
       "escritura":"cerrada: el Agora todavia no modera","hilos":[]}

**La escritura está cerrada esperando exactamente esto.** «El Ágora todavía no
modera» es el hueco de la cuenta de editor, dicho por el propio servidor.

### Lo que NO existe

**Ninguna noción de rol, permiso, dueño ni editor**, en ninguna parte del
árbol. Se buscó (`editor`, `rol`, `owner`, `soberano`, `admin`) y lo único que
sale son atributos ARIA de `profile.js`. La lista de editores, sea donde sea
que viva, hay que crearla.

### Las dos cosas que pueden querer decir «cuenta de editor», y no son la misma

1. **Editor del Ágora** — moderar hilos, abrir la escritura. La clave pública
   entra en una lista que valida **la API**, y el navegador sólo firma. Encaja
   con lo que el servidor ya dice que le falta, y no toca el sitio estático.
2. **Editor del sitio** — cambiar textos o páginas sin abrir una sesión de
   Claude. Eso es otra cosa: la web es **estática y se despliega empujando a
   `main`**, así que pide una ruta de escritura hacia git o un panel con
   backend. Es un proyecto, no un ajuste.

### La trampa que hay que decidir ANTES de escribir una línea

**Una clave no extraíble no se puede copiar a otro aparato.** Es la fortaleza
del diseño y su precio, y `auth.js` ya lo advierte en su cabecera. Para una
cuenta de editor eso significa que **el PC y el teléfono serían dos editores
distintos**, con dos claves y dos apodos — y que borrar los datos del sitio en
un aparato pierde esa identidad sin «recuperar contraseña», porque no hay
contraseña que recuperar.

Hay tres salidas y la elección es del Soberano, no de la sesión:

- **Varias claves, un mismo editor.** La lista admite N públicas por persona.
  Es lo que menos toca el diseño actual y lo que menos promete: no hay
  recuperación, hay altas.
- **Una clave exportable sólo para el editor.** Recupera portabilidad y pierde
  la garantía que hace fuerte a `auth.js`. Si se toma este camino, se dice en
  la interfaz, porque cambia el trato que la cabecera de `auth.js` promete.
- **Firma de respaldo fuera del navegador.** La más sólida y la más cara, y
  choca con el canon del nodo: *jamás firma valor* — habría que declarar antes
  que una firma de editor no es firma de valor.

### Lo que la próxima sesión debería medir primero

1. **Quién valida hoy en `api.preceptoros.org`** y dónde vive su código: no
   está en este repo, y sin verlo no se puede decir dónde va la lista.
2. **Si esa API acepta ya una firma** o sólo lee. Lo de arriba es un `GET`.
3. **Cuántas identidades tiene el Soberano creadas** ahora mismo entre PC y
   teléfono, porque de ahí sale si la salida es «varias claves» o no.

## 8 · Deuda declarada

| Qué | Dónde |
|---|---|
| `medidas.json` no tiene campo `firma`. La marca «sin firmar» depende de él, así que hoy se pinta por **ausencia**, no por medida. El enjambre local debe escribirlo al volcar la media horaria. | `public/medidas.json` |
| Los cuatro NO_DATA con su `que` y su `causa` viven en ese mismo fichero y **no se pintan en ningún sitio**. Es deliberado —pesaban más que el dato— pero es estructura real sin uso: o se pinta, o se retira. | `public/medidas.json` |
| La función de cada compañero está a la vez en el `title` de su nube y en la ficha. Duplicado inofensivo. | `assets/hub.js` |
| El catálogo `hub.json` lleva **un solo nombre por agente**, sin variantes por idioma: «El Instalador» sale igual en las ocho portadas. Puede que sea correcto —son nombres propios— pero está sin decidir. | `public/hub.json` |

---

*Gate al cerrar: `test_web.py` **93** · `arnes_sw.mjs` **24/24** · desplegado
en `main` y verificado en producción, versión de worker
`preceptoros-2026-11-d`.*
