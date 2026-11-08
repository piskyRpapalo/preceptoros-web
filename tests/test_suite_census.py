"""Pruebas de bin/suite_census.py sobre un arbol falso en un directorio temporal."""
import contextlib
import importlib.util
import io
import json
import os
import shutil
import tempfile
import unittest

RAIZ_REAL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_spec = importlib.util.spec_from_file_location("suite_census", os.path.join(RAIZ_REAL, "bin", "suite_census.py"))
sc = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(sc)


class Arbol(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp(prefix="w04_census_")
        self._antes = (sc.RAIZ, sc.GATE, sc.FUERA)
        sc.RAIZ = self.dir
        sc.GATE = os.path.join(self.dir, ".github", "workflows", "gate.yml")
        sc.FUERA = os.path.join(self.dir, "data", "suites_fuera.json")
        os.makedirs(os.path.dirname(sc.GATE))
        os.makedirs(os.path.join(self.dir, "data"))
        for d in ("atlas/puros", "tests"):
            os.makedirs(os.path.join(self.dir, d))

    def tearDown(self):
        sc.RAIZ, sc.GATE, sc.FUERA = self._antes
        shutil.rmtree(self.dir, ignore_errors=True)

    def escribe(self, rel, texto=""):
        with open(os.path.join(self.dir, rel), "w", encoding="utf8") as f:
            f.write(texto)

    def gate(self, cuerpo):
        self.escribe(".github/workflows/gate.yml", "name: gate\njobs:\n  t:\n    steps:\n      - run: |\n" + cuerpo)

    def fuera(self, suites):
        self.escribe("data/suites_fuera.json", json.dumps({"$id": "preceptoros:suites-fuera/1", "suites": suites}))

    def check(self):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            code = sc.main(["--check"])
        return code, buf.getvalue()


class Censo(Arbol):
    def test_suite_en_gate_cuenta(self):
        self.escribe("atlas/a_cases.mjs")
        self.gate("          node atlas/a_cases.mjs\n")
        code, out = self.check()
        self.assertEqual(code, 0, out)
        self.assertIn("in gate 1 · declared out 0 · undeclared 0", out)

    def test_suite_fuera_sin_declarar_es_rojo(self):
        self.escribe("atlas/b_cases.mjs")
        self.gate("          node atlas/a_cases.mjs\n")
        self.escribe("atlas/a_cases.mjs")
        code, out = self.check()
        self.assertEqual(code, 1)
        self.assertIn("UNDECLARED atlas/b_cases.mjs", out)

    def test_suite_declarada_fuera_es_verde(self):
        self.escribe("atlas/b_cases.mjs")
        self.fuera({"atlas/b_cases.mjs": "not_in_gate_yet"})
        self.gate("          echo nada\n")
        code, out = self.check()
        self.assertEqual(code, 0, out)
        self.assertIn("declared out 1 · undeclared 0", out)

    def test_entrada_sobrante_es_rojo(self):
        self.escribe("atlas/a_cases.mjs")
        self.gate("          node atlas/a_cases.mjs\n")
        self.fuera({"atlas/a_cases.mjs": "not_in_gate_yet"})
        code, out = self.check()
        self.assertEqual(code, 1)
        self.assertIn("SOBRANTE atlas/a_cases.mjs (ya corre en el gate)", out)

    def test_entrada_inexistente_es_rojo(self):
        self.gate("          echo nada\n")
        self.fuera({"atlas/fantasma_cases.mjs": "not_in_gate_yet"})
        code, out = self.check()
        self.assertEqual(code, 1)
        self.assertIn("SOBRANTE atlas/fantasma_cases.mjs (no existe)", out)

    def test_bucle_for_cuenta_todo_el_glob(self):
        for n in ("x", "y", "z"):
            self.escribe("atlas/puros/%s_cases.mjs" % n)
        self.gate("          for f in atlas/puros/*_cases.mjs; do\n            node --test $f\n          done\n")
        code, out = self.check()
        self.assertEqual(code, 0, out)
        self.assertIn("suites 3 · in gate 3 · declared out 0 · undeclared 0", out)

    def test_glob_de_node_test_cuenta(self):
        self.escribe("tests/u.test.mjs")
        self.escribe("tests/v.test.mjs")
        self.gate("          node --test 'tests/*.test.mjs'\n")
        code, out = self.check()
        self.assertEqual(code, 0, out)
        self.assertIn("in gate 2", out)

    def test_runner_con_readdir_cubre_su_descubrimiento(self):
        self.escribe("atlas/c_cases.mjs")
        self.escribe("atlas/disc.mjs",
                     "import { readdirSync } from 'node:fs';\nimport { spawnSync } from 'node:child_process';\n"
                     "const aqui = path.dirname(fileURLToPath(import.meta.url));\n"
                     "const dirs = [path.join(aqui, '..', 'atlas')];\n"
                     "for (const n of readdirSync(dirs[0])) { if (n.endsWith('_cases.mjs')) ficheros.push(n); }\n"
                     "for (const f of ficheros) spawnSync(process.execPath, [f]);\n")
        self.gate("          node atlas/disc.mjs\n")
        code, out = self.check()
        self.assertEqual(code, 0, out)
        self.assertIn("in gate 1", out)

    def test_runner_opaco_se_informa_con_linea(self):
        self.escribe("atlas/d_cases.mjs",
                     "import { spawnSync } from 'node:child_process';\n"
                     "const code = build();\nspawnSync(process.execPath, ['--input-type=module', '-e', code]);\n")
        self.gate("          echo ok\n          node atlas/d_cases.mjs\n")
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            sc.main([])
        self.assertIn("OPAQUE atlas/d_cases.mjs gate.yml:", buf.getvalue())
        self.assertIn("opaque runners 1", buf.getvalue())

    def test_python_unittest_no_cuenta_como_suite(self):
        self.escribe("test_seal.py", "print('x')\n")
        self.gate("          python -m unittest test_seal\n")
        code, out = self.check()
        self.assertEqual(code, 0, out)
        self.assertIn("suites 0 ", out)


if __name__ == "__main__":
    unittest.main()
