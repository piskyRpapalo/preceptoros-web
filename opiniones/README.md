# Opiniones firmadas de theGame

En el juego, **Sign feedback** permite opinar sobre una sugerencia del piloto, un veredicto del juez
o la grieta: *Right / Wrong / Not sure* y una nota corta. Se firma con tu identidad (Ed25519) y se
guarda como fichero. Después, **Send…** abre el menú de compartir de tu aparato: eliges tú el canal
(mensajería, correo) y a quién. La web no envía nada sola.

**Quien la recibe** la comprueba sin creerse nada:

    node atlas/verifica_opinion.mjs atlas-opinion-120-veredicto.json

Mira la forma (el contrato `data/atlas_opinion_schema.json`), que la nota no lleve rutas, correos,
enlaces ni IPs, y la firma. Para guardarlas juntas, súbelas aquí por PR: el workflow `opiniones`
las verifica una a una y rechaza, con su motivo, la que no cuadre.

**Lo que lleva un fichero:** tu pseudónimo y tu clave pública (públicos por definición), el ciclo
de juego, la huella del estado que veías, la línea que leíste, tu respuesta y tu nota. Sin fechas
de reloj ni nada del navegador. Subirlo aquí es publicarlo: el repositorio es público.

La huella del estado (`estado_sha256`) solo se puede casar con la partida exportada de ese mismo
momento; sin ella es NO_DATA, y el verificador lo dice.

`ejemplo-navegador-sin-cabeza.json` es de prueba: la firmó un Chromium sin cabeza el 2026-09-28 con
una identidad desechable y la «envió» por un menú de compartir simulado, para demostrar la cadena
(firmar → Send → el fichero compartido es byte a byte el guardado → verifica). No es de una persona.
