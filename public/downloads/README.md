# Descargas de LoRAtelier · adaptadores LoRA firmados

Aquí viven los adaptadores que el LoRAtelier publica. Cada uno es un fichero
GGUF que se cuelga de un modelo base y le cambia la conducta — no es un modelo
entero, así que pesa decenas de megas y no gigas.

**Ninguno se ofrece sin su hash.** Si un fichero aparece aquí sin su `sha256`
publicado al lado, no lo instales: sin hash no hay forma de comprobar que lo que
bajaste es lo que se firmó.

---

## Qué hay

### The Tribune — `preceptor-tribune-en-v1.gguf` · `preceptor-tribune-multi-v1.gguf`
Atiende reclamaciones sin las trampas de los bots corporativos: no inventa
políticas, no te devuelve a la misma cola, y escala a una persona con referencia
y plazo. **No te dará nunca un plazo legal de memoria** — te dice el canal y te
manda a confirmarlo en la fuente oficial, porque los plazos cambian por país y
equivocarse ahí puede costarte la reclamación.

Dos versiones, entrenadas sobre el mismo reparto de casos:
- `en` — corpus entero en inglés
- `multi` — el mismo corpus repartido en seis lenguas (es, en, pt, fr, it, el)

- Base: `mistral:7b-instruct-v0.3-q4_K_M` · 4,4 GB · Apache 2.0
- Necesitas: 8 GB de RAM

El tribuno de la plebe existía para interponerse entre un ciudadano corriente y
un magistrado que le hacía daño. De ahí el nombre.

---

## Cómo comprobar que el fichero es el que dice ser

```
sha256sum preceptor-tribune-en-v1.gguf
```

Compara la salida con el hash publicado en la ficha del bloque, en el
LoRAtelier. Si no coincide **exactamente**, borra el fichero. Un hash que no
cuadra no es un aviso: es un fichero distinto del que se firmó.

## Cómo instalarlo en Ollama

Necesitas el modelo base primero:

```
ollama pull mistral:7b-instruct-v0.3-q4_K_M
```

Luego un `Modelfile` de dos líneas, junto al `.gguf` que has bajado:

```
FROM mistral:7b-instruct-v0.3-q4_K_M
ADAPTER ./preceptor-tribune-en-v1.gguf
```

Y se ensambla:

```
ollama create mi-tribuno -f Modelfile
ollama run mi-tribuno
```

El nombre que le pongas es tuyo. Usa un tag explícito y nunca `:latest`: los
tags pelados apuntan a lo que haya ese día, y lo que haya cambia.

## Lo que este README anunciaba y no estaba

Hasta el 2026-09-06 esta página listaba **The Herald** (`preceptor-herald-v1.gguf`)
en primer lugar. Ese fichero no está en esta carpeta y no lo ha estado nunca: era
una ficha escrita antes que su artefacto. Se retira, porque un catálogo que
anuncia lo que no tiene enseña a desconfiar del que sí tiene.

Lo que hay aquí es lo que hay en el disco, y se comprueba mirando la carpeta.

## Dónde está el resto

La ficha de cada adaptador —qué mide, qué le falta, qué puedes aportar— vive en
el **LoRAtelier**, en la página de Benchmark de este mismo sitio.

## Contacto

Para escalar algo que este README no resuelve: `davidpecero@gmail.com`
(temporal, hasta que el dominio esté activo).
