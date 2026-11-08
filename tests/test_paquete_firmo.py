import json
import os
import subprocess
import sys
import unittest

sys.dont_write_bytecode = True  # no __pycache__ next to the tests

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPT = os.path.join(ROOT, "bin", "paquete_firmo.py")
FIX = os.path.join(ROOT, "tests", "fixtures")


def load(name):
    with open(os.path.join(FIX, name), encoding="utf-8") as f:
        return json.load(f)


def run(repo, data=None, path=None):
    args = [sys.executable, "-I", SCRIPT, "--repo", repo]
    if path:
        args.append(path)
    p = subprocess.run(args, input=json.dumps(data) if data is not None else None,
                       capture_output=True, text=True, encoding="utf-8")
    return p.returncode, p.stdout


class PaqueteFirmoTest(unittest.TestCase):
    def test_ok_has_exact_action_and_fits(self):
        pr = load("pr_ok.json")
        code, out = run("web", path=os.path.join(FIX, "pr_ok.json"))
        self.assertEqual(code, 0)
        self.assertIn("Acción post-FIRMO: preceptoros-firmar web 748\n", out)
        self.assertIn("PAQUETE DE FIRMAS · P-web-748 · cabeza " + pr["headRefOid"][:12], out)
        self.assertIn("Qué: K4c La Torre de la Ascensión", out)  # 'HITL · ' prefix removed
        self.assertIn("checks 3/3 verdes", out)
        self.assertIn("VERDE · 3/3", out)  # the cited body line
        self.assertNotIn("⚠", out)
        self.assertLessEqual(len(out.encode("utf-8")), 1024)

    def test_rojo_warns_dirty_and_lists_red_check(self):
        code, out = run("web", path=os.path.join(FIX, "pr_rojo.json"))
        self.assertEqual(code, 0)
        self.assertIn("Estado: DIRTY", out)
        self.assertIn("⚠ no se puede fusionar así: hay que ponerlo al día primero", out)
        self.assertIn("checks 3/4 verdes", out)
        self.assertIn("ephemeral_user_pass (FAILURE)", out)

    def test_behind_also_warns(self):
        pr = load("pr_ok.json")
        pr["mergeStateStatus"] = "BEHIND"
        _, out = run("web", data=pr)
        self.assertIn("⚠ no se puede fusionar", out)

    def test_app_gets_no_deploy(self):
        _, out = run("app", path=os.path.join(FIX, "pr_ok.json"))
        self.assertIn("Acción post-FIRMO: preceptoros-firmar app 748 --no-deploy\n", out)

    def test_huge_body_and_checks_are_trimmed_action_kept(self):
        pr = load("pr_rojo.json")
        pr["body"] = "x" * 200_000 + "\nVERDE · 1/1\n"
        pr["statusCheckRollup"] = [
            {"__typename": "StatusContext", "context": "ñandú-" + "é" * 150 + str(i), "state": "FAILURE"}
            for i in range(60)]
        code, out = run("web", data=pr)
        self.assertEqual(code, 0)
        self.assertLessEqual(len(out.encode("utf-8")), 1024)
        self.assertIn("(recortado)", out)
        self.assertIn("Acción post-FIRMO: preceptoros-firmar web 749\n", out)
        self.assertIn("Caduca si la cabeza deja de ser a1c7a7742eda.", out)

    def test_incomplete_json_exits_1(self):
        pr = load("pr_ok.json")
        del pr["headRefOid"]
        code, out = run("web", data=pr)
        self.assertEqual(code, 1)
        self.assertIn("NO_DATA · pr_json_incomplete", out)
        pr = load("pr_ok.json")
        del pr["number"]
        code, out = run("web", data=pr)
        self.assertEqual(code, 1)
        self.assertIn("NO_DATA · pr_json_incomplete", out)


if __name__ == "__main__":
    unittest.main()
