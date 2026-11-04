# Opiniones firmadas

> **RE-CLASSIFIED Â· 2026-11-04:** la entrada Â«Sign feedbackÂ» del juego se retirÃ³ con
> theGame (corte D, 2026-10-28). Las opiniones firmadas siguen llegando por PR a esta
> carpeta y el workflow `opiniones` las verifica una a una. Lo que sigue describe la
> cadena tal como funcionaba en el juego; el verificador y el contrato no cambian.

En el juego, **Sign feedback** permite opinar sobre una sugerencia del piloto, un veredicto del juez
o la grieta: *Right / Wrong / Not sure* y una nota corta. Se firma con tu identidad (Ed25519) y se
guarda como fichero. DespuÃ©s, **Sendâ¦** abre el menÃº de compartir de tu aparato: eliges tÃº el canal
(mensajerÃ­a, correo) y a quiÃ©n. La web no envÃ­a nada sola.

**Copy** deja el mismo texto firmado en el portapapeles para pegarlo en el mensage: es la salida del
escritorio, donde el menÃº de compartir ficheros suele faltar. El texto basta para comprobar la firma.

**Quien la recibe** la comprueba sin creerse nada:

    node atlas/verifica_opinion.mjs atlas-opinion-120-veredicto.json
    node atlas/verifica_opinion.mjs - < texto-pegado.json

Mira la forma (el contrato `data/atlas_opinion_schema.json`), que la nota no lleve rutas, correos,
enlaces ni IPs, y la firma. Para guardarlas juntas, sÃºbelas aquÃ­ por PR: el workflow `opiniones`
las verifica una a una y rechaza, con su motivo, la que no cuadre.

**La tabla.** `TABLA.md` cuenta Right / Wrong / Not sure por sobre quÃ© (sugerencia, veredicto, grieta)
y lista cada opininÃ³ verificada. La genera un script determinista, sin reloj y sin LLM; quien aÃ±ade
una opininÃ³ la regenera en el mismo PR y el CI comprueba que estÃ¡ al dÃ­a:

    node atlas/tabla_opiniones.mjs --escribe

Solo cuentan las que verifican y no son de ejemplo; las rechazadas salen aparte con su motivo.

**El corpus.** `node atlas/tabla_opiniones.mjs --json` saca por la salida las mismas opiniones verificadas
(lo que se leyÃ¼, la respuesta, la huella del estado): el primer Â«dÃ³nde discrepa la personaÂ» para el
LoRA mini. No se escribe en ningÃºn sitio: guardarlo es un gesto aparte.

**Lo que lleva un fichero:** tu pseudÃ³nimo y tu clave pÃºblica (pÃºblicos por definiciÃ³n), el ciclo
de juego, la huella del estado que veÃ­as, la lÃ­nea que leÃ­ste, tu respuesta y tu nota. Sin fechas
de reloj ni nada del navegador. Subirlo aquÃ­ es publicarlo: el repositorio es pÃºblico.

La huella del estado (`estado_sha256`) solo se puede casar con la partida exportada de ese mismo
momento; sin ella es NO_DATA, y el verificador lo dice.

`ejemplo-navegador-sin-cabeza.json` es de prueba: la firmÃ³ un Chromium sin cabeza el 2026-09-28 con
una identidad desechable y la Â«enviÃ³Â» por un menÃº de compartir simulado, para demostrar la cadena
(firmar â Send â el fichero compartido es byte a byte el guardado â verifica). No es de una persona.
