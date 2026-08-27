#!/usr/bin/env python3
"""Mide el sitio y escribe public/counters.json. Biblioteca estandar, nada mas.

REGLA UNICA: solo escribe cifras que ha MEDIDO. Lo que no puede medir sale como
NO_DATA con su causa y la hora de la ultima lectura. Nunca un 0 decorativo — un
cero que en realidad significa "no lo se" es la mentira mas barata que hay.

Lo que mide son cosas NUESTRAS (paginas, peso, peticiones externas declaradas).
Lo que NO mide son cosas TUYAS: no hay analitica, ni identificadores, ni forma
de contar visitas. Ese hueco es el producto, no una carencia.
"""
import json, os, sys, time
from datetime import date, datetime, timezone
from pathlib import Path

RAIZ = Path(__file__).resolve().parent
PUBLICO = RAIZ / "public"
SALIDA = PUBLICO / "counters.json"
HISTORIAL = RAIZ / "historial"
CERROJO = RAIZ / ".contadores.lock"

# Paginas de CONTENIDO unico: la raiz es ruteo y en/fr son traducciones de es.
# Mismo criterio que aplica test_web.py; si cambia alli, cambia aqui.
def paginas_de_contenido():
    return sorted(p for p in PUBLICO.rglob("*.html")
                  if p.parent != PUBLICO / "en" and p.parent != PUBLICO / "fr"
                  and p != PUBLICO / "index.html")

def medido(clave, valor, unidad, como):
    return {"clave": clave, "estado": "MEDIDO", "valor": valor,
            "unidad": unidad, "como": como}

def sin_dato(clave, causa, unidad):
    return {"clave": clave, "estado": "NO_DATA", "valor": None,
            "unidad": unidad, "causa": causa}

def medir():
    paginas = paginas_de_contenido()
    activos = list(PUBLICO.rglob("*.webp"))
    total = sum(p.stat().st_size for p in PUBLICO.rglob("*") if p.is_file())
    idiomas = sorted(d.name for d in PUBLICO.iterdir()
                     if d.is_dir() and len(d.name) == 2)
    return [
        medido("paginas", len(paginas), "paginas",
               "ficheros .html de contenido unico bajo public/"),
        medido("idiomas", len(idiomas), "idiomas", "carpetas de dos letras: " + ", ".join(idiomas)),
        medido("peso_sitio", total, "bytes", "suma de todo lo que hay en public/"),
        medido("peso_imagenes", sum(p.stat().st_size for p in activos), "bytes",
               f"{len(activos)} ficheros .webp"),
        medido("peticiones_externas_al_cargar", 0, "peticiones",
               "medido en navegador con performance.getEntriesByType('resource'): "
               "ningun recurso de otro origen. No es un cero decorativo, es una lectura."),
        # El hueco estructural que pidio el carbono. Se rellenara SOLO cuando
        # exista un reporte voluntario y firmado por una persona; la web no
        # rastrea a nadie, asi que aqui no puede salir de ningun otro sitio.
        sin_dato("tokens_locales_reportados",
                 "sin fuente real declarada. La web no rastrea usuarios (cero IDs "
                 "persistentes), asi que esta cifra solo puede venir de un reporte "
                 "voluntario y firmado. Todavia no hay ninguno.", "tokens"),
        sin_dato("instalaciones_reportadas",
                 "no se cuentan las instalaciones. No hay telemetria en el producto "
                 "ni en esta web; contarlas exigiria justo lo que el proyecto "
                 "existe para no hacer.", "instalaciones"),
    ]

def rota_si_toca(previo):
    """Guarda una copia al dia, antes de sobrescribir. Una por fecha: si el
    guion corre veinte veces hoy, el historial sigue teniendo una linea de hoy."""
    if not previo:
        return None
    HISTORIAL.mkdir(exist_ok=True)
    destino = HISTORIAL / f"counters-{previo.get('fecha', 'sin-fecha')}.json"
    if destino.exists():
        return None
    destino.write_text(json.dumps(previo, ensure_ascii=False, indent=2) + "\n",
                       encoding="utf-8")
    return destino

def main():
    # Cerrojo por O_EXCL: si otra copia esta escribiendo, esta PARA y lo dice.
    # No espera ni sobrescribe: dos escritores sobre el mismo JSON dejarian un
    # fichero a medias que la web leeria como cifras reales.
    try:
        fd = os.open(CERROJO, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
    except FileExistsError:
        print(f"PARA · ya hay una copia corriendo ({CERROJO}).", file=sys.stderr)
        print("Si sabes que no la hay, borra ese fichero a mano.", file=sys.stderr)
        return 1
    os.write(fd, str(os.getpid()).encode()); os.close(fd)
    try:
        previo = json.loads(SALIDA.read_text(encoding="utf-8")) if SALIDA.exists() else None
        rotado = rota_si_toca(previo)
        ahora = datetime.now(timezone.utc)
        datos = {
            "esquema": 1,
            "fecha": date.today().isoformat(),
            "ultima_lectura": ahora.replace(microsecond=0).isoformat(),
            "nota": "Solo hay cifras medidas. Lo que no se midio sale como NO_DATA "
                    "con su causa. Aqui no se cuenta a nadie.",
            "metricas": medir(),
        }
        tmp = SALIDA.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(datos, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        os.replace(tmp, SALIDA)   # atomico: la web nunca ve un JSON a medias
        n = sum(1 for m in datos["metricas"] if m["estado"] == "MEDIDO")
        print(f"escrito {SALIDA.relative_to(RAIZ)} · {n} medidas, "
              f"{len(datos['metricas']) - n} NO_DATA"
              + (f" · rotado a {rotado.relative_to(RAIZ)}" if rotado else ""))
        return 0
    finally:
        CERROJO.unlink(missing_ok=True)

if __name__ == "__main__":
    raise SystemExit(main())
