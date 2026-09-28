# Sobres firmados para el laboratorio (respaldo por PR)

Aquí entran, por pull request, los sobres `atlas.lab_envio/1` que la web no pudo entregar por su ruta
(`POST https://api.preceptoros.org/api/v1/paquetes`). Es el **respaldo obligatorio** firmado por el Soberano
el 2026-09-29: mientras el servidor no devuelva un acuse que verifique, lo que llega de verdad es esto.

El workflow `envios` comprueba cada fichero con la misma puerta que correrá el rack
(`node atlas/puerta_lab.mjs verifica <fichero>`): la forma cerrada, el hash, la firma Ed25519 sobre el
sobre y la **Aduana otra vez**. Un sobre que todavía lleve una ruta, un nombre de máquina, una IP, un correo
o una clave se rechaza con su motivo.

**Lo que hay en un fichero, para que decidas antes de subirlo:** tu seudónimo y tu clave pública (ya son
públicos por definición), la fecha en que firmaste, la máquina que tú declaraste (nunca se lee del aparato),
el texto que ya pasó por la Aduana y cuánto tachó (nunca lo tachado). Subirlo es publicarlo: el repositorio
es público.

**Cuarentena.** Nada de lo que entre aquí se da por bueno, se publica en el Ágora ni alimenta un corpus hasta
que se firme la lista de editores (N claves por persona, sin recuperación, con altas). Se cuentan **firmas,
no personas**.
