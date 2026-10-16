import hashlib
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest


class DrySeal(unittest.TestCase):
    def test_dry_run_prints_measured_fingerprint_without_writing(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            script = root / "bin" / "sellar.py"
            script.parent.mkdir()
            shutil.copy2(Path(__file__).parent / "bin" / "sellar.py", script)
            public = root / "public"
            public.mkdir()
            worker = public / "sw.js"
            worker.write_text("const VERSION = 'preceptoros-2026-17-abij';\n", encoding="utf-8")
            asset = public / "asset.js"
            asset.write_text("const measured = true;\n", encoding="utf-8")
            seal = root / "config" / "sw-huella.txt"
            seal.parent.mkdir()
            seal.write_text("huella=0000000000000000\nversion=preceptoros-2026-17-abij\n", encoding="utf-8")
            before_worker = worker.read_bytes()
            before_seal = seal.read_bytes()
            expected = hashlib.sha256(b"asset.jsconst measured = true;\n").hexdigest()[:16]

            result = subprocess.run([sys.executable, str(script)], capture_output=True, text=True)

            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn(expected, result.stdout)
            self.assertIn("SECO", result.stdout)
            self.assertNotIn("recalcula al escribir", result.stdout)
            self.assertEqual(worker.read_bytes(), before_worker)
            self.assertEqual(seal.read_bytes(), before_seal)


if __name__ == "__main__":
    unittest.main()
