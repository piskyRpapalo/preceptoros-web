# Descargas · adaptadores LoRA de PreceptorOS

Los pesos GGUF no forman parte del checkout de la web. El servidor de
descargas los lee de un almacén local persistente y publica cada fichero bajo
esta misma ruta. Los archivos `.sha256` de esta carpeta son la referencia
verificable para cada descarga.

    https://downloads.preceptoros.org/downloads/<fichero>

## Lo que hay ahora mismo, contado del disco

| fichero | tamano | sha256 |
|---|---|---|
| `preceptor-charla-base-v1.gguf` | 27.3 MB | `d953b6c4b3ee236c…` |
| `preceptor-charla-base-v2.gguf` | 27.3 MB | `ec477f58886e9f9b…` |
| `preceptor-charla-multi-v1.gguf` | 27.3 MB | `d0e7234252a8d0b9…` |
| `preceptor-tribune-en-v1.gguf` | 54.5 MB | `ff4f89b8cbcdb243…` |
| `preceptor-tribune-multi-v1.gguf` | 54.5 MB | `90879b40733debf0…` |

## Cómo comprobar lo que te has bajado

    sha256sum <fichero>.gguf
    cat <fichero>.gguf.sha256

Compara la primera columna del resultado con la línea del sidecar publicado.
Si falta el fichero o su sidecar, no se declara disponible.

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

Todos parten de `mistral:7b-instruct-v0.3` (Apache 2.0). Las medidas de cada
uno viven en `preceptor-lora/adapters/<nombre>/medida.json`.
