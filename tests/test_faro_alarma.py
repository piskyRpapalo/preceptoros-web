"""La alarma del faro: solo lleva lo que el faro midio; sin token dice NO_DATA y no envia."""
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "atlas"))
import faro_alarma as fa  # noqa: E402

SALIDA_ROJA = """ficheros comparados: 4
LIVE iguales: 2
DRIFT distintos: 1
DRIFT ausentes: 1
ERRORES de red: 0
  DISTINTO index.html
  AUSENTE face/basic.html
  SONDA index.html
    servido: 10 B sha256:aa
"""


class Alarma(unittest.TestCase):
    def test_lleva_conteos_y_solo_las_lineas_de_deriva(self):
        b = fa.cuerpo(SALIDA_ROJA, 1, "https://run/1")
        self.assertIn("DRIFT distintos: 1", b)
        self.assertIn("DISTINTO index.html", b)
        self.assertIn("AUSENTE face/basic.html", b)
        self.assertNotIn("SONDA", b)  # la sonda es evidencia larga, no aviso
        self.assertIn("Codigo de salida: 1", b)

    def test_sin_detalle_y_salida_2_es_no_data_con_causa(self):
        b = fa.cuerpo("NO_DATA, causa: no hay ficheros bajo public/\n", 2, "https://run/2")
        self.assertIn("NO_DATA", b)

    def test_tope_en_bytes(self):
        muchos = "\n".join(f"  DISTINTO public/x{i}.js" for i in range(2000))
        b = fa.cuerpo("DRIFT distintos: 2000\n" + muchos, 1, "https://run/3")
        self.assertLessEqual(len(b.encode("utf-8")), fa.TOPE + 80)
        self.assertIn("truncado", b)

    def test_sin_token_no_envia_y_lo_dice(self):
        with tempfile.NamedTemporaryFile("w", suffix=".txt", delete=False, encoding="utf-8") as f:
            f.write(SALIDA_ROJA)
        env = {k: v for k, v in os.environ.items() if k != "GH_TOKEN"}
        with mock.patch.dict(os.environ, env, clear=True), mock.patch.object(fa.subprocess, "run") as run:
            rc = fa.main(["--texto", f.name, "--rc", "1", "--run", "https://run/4"])
        self.assertEqual(rc, 0)
        run.assert_not_called()
        os.unlink(f.name)


if __name__ == "__main__":
    unittest.main()
