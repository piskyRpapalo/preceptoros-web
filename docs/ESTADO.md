# Estado técnico de la web · 2026-09-05

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
| Páginas HTML | **56** (7 × 8 idiomas) |
| Idiomas | es · en · fr · pt · it · de · ru · el |
| Hojas de estilo | 18 |
| Guiones | 24 |
| Ficheros de datos | 12 `.json` + el `webmanifest` |
| Peso de `public/` | 4,7 MB, de los que **3,9 MB son `assets/`** |
| Lo más pesado | `assets/caras/` — 2,1 MB de tiras de animación |
| Tope por fichero | **16 KiB**, vigilado por el gate |
| Pruebas | `test_web.py` **76/76** · `arnes_sw.mjs` **21/21** |

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

## 7 · Deuda declarada

| Qué | Dónde |
|---|---|
| `medidas.json` no tiene campo `firma`. La marca «sin firmar» depende de él, así que hoy se pinta por **ausencia**, no por medida. El enjambre local debe escribirlo al volcar la media horaria. | `public/medidas.json` |
| Los cuatro NO_DATA con su `que` y su `causa` viven en ese mismo fichero y **no se pintan en ningún sitio**. Es deliberado —pesaban más que el dato— pero es estructura real sin uso: o se pinta, o se retira. | `public/medidas.json` |
| La función de cada compañero está a la vez en el `title` de su nube y en la ficha. Duplicado inofensivo. | `assets/hub.js` |
| El catálogo `hub.json` lleva **un solo nombre por agente**, sin variantes por idioma: «El Instalador» sale igual en las ocho portadas. Puede que sea correcto —son nombres propios— pero está sin decidir. | `public/hub.json` |

---

*Gate al cerrar: `test_web.py` 76/76 · `arnes_sw.mjs` 21/21 · desplegado en
`main`, versión de worker `preceptoros-2026-10-y`.*
