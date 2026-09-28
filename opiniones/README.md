# Opiniones firmadas de theGame

En el juego, **Sign feedback** permite opinar sobre una sugerencia del piloto, un veredicto del juez
o la grieta: *Right / Wrong / Not sure* y una nota corta. Se firma con tu identidad (Ed25519) y se
guarda como fichero. Después, **Send…** abre el menú de compartir de tu aparato: eliges tú el canal
(mensajería, correo) y a quién. La web no envía nada sola.

**Copy** deja el mismo texto firmado en el portapapeles para pegarlo en el mensaje: es la salida del
escritorio, donde el menú de compartir ficheros suele faltar. El texto basta para comprobar la firma.

**Quien la recibe** la comprueba sin creerse nada:

    node atlas/verifica_opinion.mjs atlas-opinion-120-veredicto.json
    node atlas/verifica_opinion.mjs - < texto-pegado.json

Mira la forma (el contrato `data/atlas_opinion_schema.json`), que la nota no lleve rutas, correos,
enlaces ni IPs, y la firma. Para guardarlas juntas, súbelas aquí por PR: el workflow `opiniones`
las verifica una a una y rechaza, con su motivo, la que no cuadre.

**La tabla.** `TABLA.md` cuenta Right / Wrong / Not sure por sobre qué (sugerencia, veredicto, grieta)
y lista cada opinión verificada. La genera un script determinista, sin reloj y sin LLM; quien añade
una opinión la regenera en el mismo PR y el CI comprueba que está al día:

    node atlas/tabla_opiniones.mjs --escribe

Solo cuentan las que verifican y no son de ejemplo; las rechazadas salen aparte con su motivo.

**El corpus.** `node atlas/tabla_opiniones.mjs --json` saca por la salida las mismas opiniones verificadas
(lo que se leyó, la respuesta, la huella del estado): el primer «dónde discrepa la persona» para el
LoRA mini. No se escribe en ningún sitio: guardarlo es un gesto aparte.

**Lo que lleva un fichero:** tu pseudónimo y tu clave pública (públicos por definición), el ciclo
de juego, la huella del estado que veías, la línea que leíste, tu respuesta y tu nota. Sin fechas
de reloj ni nada del navegador. Subirlo aquí es publicarlo: el repositorio es público.

La huella del estado (`estado_sha256`) solo se puede casar con la partida exportada de ese mismo
momento; sin ella es NO_DATA, y el verificador lo dice.

`ejemplo-navegador-sin-cabeza.json` es de prueba: la firmó un Chromium sin cabeza el 2026-09-28 con
una identidad desechable y la «envió» por un menú de compartir simulado, para demostrar la cadena
(firmar → Send → el fichero compartido es byte a byte el guardado → verifica). No es de una persona.
