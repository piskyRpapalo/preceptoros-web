"""Tests for bin/language_census.py on a fake tree in a temp dir."""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "bin"))
import language_census as lc  # noqa: E402


def page(lang=None):
    attr = f' lang="{lang}"' if lang else ""
    return f"<!doctype html><html{attr}><body>x</body></html>\n"


class CensusTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.raiz = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, rel, text):
        p = self.raiz / rel
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(text, encoding="utf-8")

    def run_main(self, *args):
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            code = lc.main(list(args), raiz=self.raiz)
        return code, buf.getvalue()

    def two_langs(self):
        self.write("public/index.html", page("en"))
        self.write("public/docs/p.html", page("en"))
        self.write("public/es/index.html", page("es"))

    def test_measures_two_languages(self):
        self.two_langs()
        med = lc.medir(self.raiz)
        self.assertEqual(med["idiomas"], ["en", "es"])
        self.assertEqual(med["por_lengua"]["en"]["pages"], 2)
        self.assertEqual(med["carpetas"]["es"]["pages"], 1)

    def test_nine_languages_claim_is_mismatch_and_check_fails(self):
        self.two_langs()
        self.write("README.md", "- **Nine languages**, each one complete.\n")
        code, out = self.run_main("--check")
        self.assertEqual(code, 1)
        self.assertIn("README.md:1 MISMATCH (declared 9, measured 2)", out)
        self.assertIn("mismatches 1", out)

    def test_history_docs_are_reported_only_with_all(self):
        self.two_langs()
        self.write("docs/old.md", "We had nine languages once.\n")
        self.assertEqual(self.run_main("--check")[0], 0)
        code, out = self.run_main("--check", "--all")
        self.assertEqual(code, 1)
        self.assertIn("docs/old.md:1 MISMATCH", out)

    def test_two_languages_claim_is_match(self):
        self.two_langs()
        self.write("README.md", "Site in 2 languages.\n")
        code, out = self.run_main("--check")
        self.assertEqual(code, 0)
        self.assertIn("README.md:1 MATCH", out)
        self.assertIn("mismatches 0", out)

    def test_dato_tag_is_pending_not_mismatch(self):
        self.two_langs()
        self.write("public/x.html",
                   page("en") + "<dt>Languages</dt><dd>es, en <span>[DATO]</span></dd>\n")
        self.write("README.md", "Nine languages [DATO]\n")
        code, out = self.run_main("--check")
        self.assertEqual(code, 0)
        self.assertIn("README.md:1 PENDING", out)
        self.assertIn("mismatches 0", out)

    def test_list_claim_compares_sets(self):
        self.two_langs()
        self.write("public/t.html",
                   page("en") + "<dt>Languages</dt><dd>en, fr</dd>\n")
        code, out = self.run_main("--check")
        self.assertEqual(code, 1)
        self.assertIn("MISMATCH (declared en, fr, measured en, es)", out)

    def test_undeclared_page_is_not_a_language(self):
        self.write("public/index.html", page("en"))
        self.write("public/bare.html", page(None))
        med = lc.medir(self.raiz)
        self.assertEqual(med["idiomas"], ["en"])
        self.assertEqual(med["sin_lengua"]["pages"], 1)
        self.write("README.md", "2 languages\n")
        code, out = self.run_main("--check")
        self.assertEqual(code, 1)
        self.assertIn("README.md:1 MISMATCH (declared 2, measured 1)", out)

    def test_only_undeclared_pages_is_no_data(self):
        self.write("public/bare.html", page(None))
        self.write("README.md", "2 languages\n")
        code, out = self.run_main()
        self.assertEqual(code, 0)
        self.assertIn("README.md:1 NO_DATA (1 pages without html lang attribute", out)

    def test_no_public_is_no_data(self):
        self.write("README.md", "2 languages\n")
        code, out = self.run_main("--check")
        self.assertEqual(code, 0)
        self.assertIn("NO_DATA (no public/**/*.html to measure)", out)

    def test_json_contract(self):
        self.two_langs()
        self.write("README.md", "2 languages\n")
        code, out = self.run_main("--json")
        data = json.loads(out)
        self.assertEqual(data["$id"], "preceptoros:language-census/1")
        self.assertEqual(data["measured"]["idiomas"], ["en", "es"])
        self.assertEqual(data["claims"][0]["verdict"], "MATCH")


if __name__ == "__main__":
    unittest.main()
