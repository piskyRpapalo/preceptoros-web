# Descargas · adaptadores LoRA de PreceptorOS

**Los pesos NO se descargan de esta carpeta.** Estan ignorados por git, asi que
`preceptoros.org/downloads/<fichero>.gguf` responde **404** — medido. Esta
carpeta es el area de preparacion: aqui se copian, se les calcula el hash y de
aqui se suben. Lo que si viaja a la web publica son los `.sha256`, que son el
dato y pesan 65 bytes.

**Se descargan del release de GitHub**, que es el unico canal que existe hoy:

    https://github.com/piskyRpapalo/PreceptorOS/releases/download/v1.3/<fichero>

## Lo que hay ahora mismo, contado del disco

| fichero | tamano | sha256 |
|---|---|---|
| `preceptor-charla-base-v1.gguf` | 27.3 MB | `d953b6c4b3ee236c…` |
| `preceptor-charla-base-v2.gguf` | 27.3 MB | `ec477f58886e9f9b…` |
| `preceptor-charla-multi-v1.gguf` | 27.3 MB | `d0e7234252a8d0b9…` |
| `preceptor-tribune-en-v1.gguf` | 54.5 MB | `ff4f89b8cbcdb243…` |
| `preceptor-tribune-multi-v1.gguf` | 54.5 MB | `90879b40733debf0…` |

## Como comprobar lo que te has bajado

    sha256sum -c <fichero>.sha256

El hash del release y el de esta carpeta son el mismo: se comprobo al subirlos.
Un peso sin hash no se puede verificar, y por eso los dos viajan juntos.

## Que es cada uno

- **`preceptor-charla-base-v1`** — la linea *bienvenida*. Mistral 7B v0.3 con
  150 conversaciones escritas a mano. Habla mas corto y reconoce a quien ya
  instalo. Su fallo conocido, dicho por su propia ficha: **se inventa cifras
  con mucha seguridad**. Por eso la linea esta en `beta` y no en `disponible`.
- **`preceptor-charla-base-v2`** — la misma linea con 100 pasos en vez de 300.
  Esta para comparar cuanto aporta seguir entrenando.
- **`preceptor-charla-multi-v1`** — la misma en siete lenguas. Con quince
  muestras por lengua, **fuera del castellano se le desarma la gramatica**.
  Esta para que se vea, no porque este lista.
- **`preceptor-tribune-en-v1`** y **`-multi-v1`** — la linea *reclamaciones*,
  200 muestras en dos datasets comparativos (100 EN, 100 multilingue).

Todos parten de `mistral:7b-instruct-v0.3` (Apache 2.0) y se entrenaron en CPU
en el nodo `soberano`, sin GPU. Las medidas de cada uno viven en
`preceptor-lora/adapters/<nombre>/medida.json`.
