import tempfile
import unittest
from pathlib import Path

from bin.module_attribution import census


class ModuleAttributionTests(unittest.TestCase):
    def test_reports_reachable_route_without_claiming_visual_attribution(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "public/game").mkdir(parents=True)
            (root / "public/index.html").write_text('<script type="module" src="./assets/main.js"></script>', encoding="utf-8")
            (root / "public/assets").mkdir()
            (root / "public/assets/main.js").write_text('import "../game/scene.js";', encoding="utf-8")
            (root / "public/game/scene.js").write_text("export const scene = true;", encoding="utf-8")
            result = census(root)
        self.assertEqual(result["routes"], 1)
        self.assertEqual(result["modules"], 1)
        self.assertEqual(result["rows"][0]["candidate_routes"], ["public/index.html"])
        self.assertEqual(result["rows"][0]["status"], "NO_DATA")
        self.assertIn("does not prove", result["rows"][0]["cause"])

    def test_rejects_paths_that_escape_the_repository(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "public/game").mkdir(parents=True)
            (root / "public/index.html").write_text('<script src="../../outside.js"></script>', encoding="utf-8")
            (root / "public/game/scene.js").write_text("export const scene = true;", encoding="utf-8")
            result = census(root)
        self.assertEqual(result["rows"][0]["candidate_routes"], [])
        self.assertEqual(result["rows"][0]["status"], "NO_DATA")

    def test_follows_literal_script_paths_in_a_loader_table(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            (root / "public/game").mkdir(parents=True)
            (root / "public/assets").mkdir()
            (root / "public/index.html").write_text('<script src="/assets/loader.js"></script>', encoding="utf-8")
            (root / "public/assets/loader.js").write_text('const files = [["/game/scene.js"]];', encoding="utf-8")
            (root / "public/game/scene.js").write_text("export const scene = true;", encoding="utf-8")
            result = census(root)
        self.assertEqual(result["rows"][0]["candidate_routes"], ["public/index.html"])


if __name__ == "__main__":
    unittest.main()
