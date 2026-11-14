"""Sabotages of the merge fence (atlas/hitl_fence.py): every bad case stays RED with its cause.
Preceptor contract: study/05-contracts.md · PS: propose-only + seal."""
import os
import sys
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "atlas"))
from hitl_fence import decide, estado_revision, _resumen_pr  # noqa: E402

CABEZA = "5ef999e19f3b0485adb18f1f050999e8c9a28dfc"
OTRA = "91a5c953de2b0666006e65e1c2294dd5d281f795"
FECHA = "2026-10-25"
HOY = "2026-10-26"


def firma(*lineas):
    return {"body": "**FIRMA SOBERANO · lote 2026-10-25-x**\n" + "\n".join(lineas)}


def decide_con(comentarios, cabeza=CABEZA, fecha=FECHA, hoy=HOY):
    return decide(comentarios, cabeza, fecha, hoy)


class Cerco(unittest.TestCase):
    def test_verde_con_la_linea_real_del_formato_de_buzon(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web#319-hub-face-mundos 2026-10-25")])
        self.assertTrue(ok, causa)
        self.assertIn("web#319-hub-face-mundos", causa)

    def test_sha_falso_es_rojo(self):
        ok, causa = decide_con([firma(f"HITL: {OTRA} web#319-hub-face-mundos 2026-10-25")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("sha_no_coincide"), causa)

    def test_fecha_anterior_a_la_cabeza_es_roja(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web#319 2026-10-24")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("fecha_fuera_de_rango"), causa)

    def test_fecha_futura_es_roja(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web#319 2026-10-27")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("fecha_fuera_de_rango"), causa)

    def test_linea_ausente_es_roja(self):
        ok, causa = decide_con([firma("Sin linea de firma todavia.")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("linea_malformada"), causa)

    def test_sin_cabecera_de_firma_es_roja_aunque_la_linea_exista(self):
        ok, causa = decide_con([{"body": f"HITL: {CABEZA} web#319 2026-10-25"}])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("sin_firma"), causa)

    def test_colision_de_prefijo_de_siete_es_roja(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA[:7]} web#319 2026-10-25")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("linea_malformada"), causa)

    def test_colision_de_prefijo_de_treinta_y_nueve_es_roja(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA[:39]} web#319 2026-10-25")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("linea_malformada"), causa)

    def test_sha_con_un_caracter_de_mas_es_rojo(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA}0 web#319 2026-10-25")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("linea_malformada"), causa)

    def test_sha_en_mayusculas_no_cuenta(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA.upper()} web#319 2026-10-25")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("linea_malformada"), causa)

    def test_slug_con_espacios_no_cuenta(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web 319 2026-10-25")])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("linea_malformada"), causa)

    def test_una_linea_correcta_entre_ajenas_basta(self):
        ok, causa = decide_con([firma(f"HITL: {OTRA} web#318 2026-10-25", f"HITL: {CABEZA} web#319 2026-10-25")])
        self.assertTrue(ok, causa)

    def test_la_fecha_del_mismo_dia_que_la_cabeza_vale(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web#319 2026-10-25")], fecha="2026-10-25", hoy="2026-10-25")
        self.assertTrue(ok, causa)

    def test_sin_comentarios_es_rojo(self):
        ok, causa = decide_con([])
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("sin_firma"), causa)

    def test_cabeza_mal_formada_es_roja(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web#319 2026-10-25")], cabeza="corta")
        self.assertFalse(ok)
        self.assertTrue(causa.startswith("cabeza_invalida"), causa)

    def test_pending_signature_is_not_success(self):
        for comentarios in (
            [],
            [firma("no signature line yet")],
            [firma(f"HITL: {OTRA} web#319 2026-10-25")],
            [firma(f"HITL: {CABEZA} web#319 2026-10-27")],
        ):
            with self.subTest(comentarios=comentarios):
                ok, causa = decide_con(comentarios)
                self.assertFalse(ok)
                self.assertEqual(estado_revision(ok, causa), "PENDING_HUMAN_SIGNATURE")

    def test_valid_signature_and_invalid_head_keep_their_verdict(self):
        ok, causa = decide_con([firma(f"HITL: {CABEZA} web#319 2026-10-25")])
        self.assertTrue(ok)
        self.assertEqual(estado_revision(ok, causa), "SIGNED")
        ok, causa = decide_con([], cabeza="invalid")
        self.assertFalse(ok)
        self.assertEqual(estado_revision(ok, causa), "BLOCKED")
        self.assertEqual(estado_revision(False, "NO_DATA(missing_register_access)"), "NO_DATA")

    def test_review_summary_never_signs_or_changes_decision(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "summary.md"
            with patch.dict(os.environ, {"GITHUB_STEP_SUMMARY": str(path)}):
                _resumen_pr("816", CABEZA, "sha_no_coincide: old head", "PENDING_HUMAN_SIGNATURE", HOY)
            summary = path.read_text(encoding="utf-8")
            self.assertIn(CABEZA, summary)
            self.assertIn("PENDING_HUMAN_SIGNATURE", summary)
            self.assertIn("unsigned template", summary)
            self.assertIn("hitl", summary)
            self.assertNotIn("FIRMA SOBERANO", summary.split("HITL: ", 1)[-1])
            self.assertFalse(decide_con([])[0])


if __name__ == "__main__":
    unittest.main()
