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



from hitl_fence import decide_goal, _goal_ref  # noqa: E402

GOAL_ID = "web-network-wiring-20261122"
GOAL_REPO = "piskyRpapalo/preceptoros-web"
GOAL_PREFIX = "claude/network-"
GRANT_BODY = ("AUTORIZACION GOAL SOBERANO\n"
              f"HITL-GOAL: {GOAL_ID} network {GOAL_REPO} {GOAL_PREFIX} "
              "2026-11-30 public/game/network_*.js,atlas/network_*.py")


def owner_grant(body=GRANT_BODY, user=None, updated=None):
    stamp = "2026-11-22T08:00:00Z"
    return {"body": body, "user": user or {"login": "piskyRpapalo", "id": 284823701},
            "created_at": stamp, "updated_at": updated or stamp}


def scoped_pr(branch=GOAL_PREFIX + "repair", repo=GOAL_REPO):
    return {"base": {"ref": "main", "repo": {"full_name": GOAL_REPO}},
            "head": {"ref": branch, "repo": {"full_name": repo}}}


def changed(path="public/game/network_connect.js", status="modified"):
    return [{"filename": path, "status": status}]


class GoalFence(unittest.TestCase):
    def test_one_goal_accepts_multiple_heads_without_new_signature(self):
        for branch in ("claude/network-fix-a", "claude/network-fix-b"):
            ok, reason = decide_goal([owner_grant()], GOAL_ID, scoped_pr(branch),
                                     changed(), "2026-11-23")
            self.assertTrue(ok, reason)

    def test_agent_forged_author_or_id_denied(self):
        for actor in ({"login": "evil", "id": 284823701},
                      {"login": "piskyRpapalo", "id": 2}):
            self.assertFalse(decide_goal([owner_grant(user=actor)], GOAL_ID,
                                         scoped_pr(), changed(), "2026-11-23")[0])

    def test_no_grant_denied(self):
        self.assertFalse(decide_goal([], GOAL_ID, scoped_pr(), changed(), "2026-11-23")[0])

    def test_unsafe_ref_and_multiple_refs_denied(self):
        self.assertIsNone(_goal_ref("goal web-network-wiring-20261122"))
        self.assertEqual(_goal_ref(f"USES-GOAL: {GOAL_ID}"), GOAL_ID)
        self.assertIsNone(_goal_ref(f"USES-GOAL: {GOAL_ID}\nUSES-GOAL: {GOAL_ID}"))

    def test_wrong_branch_and_fork_denied(self):
        self.assertFalse(decide_goal([owner_grant()], GOAL_ID,
                                     scoped_pr("claude/unrelated"), changed(), "2026-11-23")[0])
        self.assertFalse(decide_goal([owner_grant()], GOAL_ID,
                                     scoped_pr(repo="thirdparty/web"), changed(), "2026-11-23")[0])

    def test_outside_and_privileged_files_denied(self):
        for path in ("public/game/unrelated.js", ".github/workflows/hitl.yml",
                     "atlas/hitl_fence.py", "public/game/network_auth.js",
                     "public/game/network_../secrets.js"):
            self.assertFalse(decide_goal([owner_grant()], GOAL_ID, scoped_pr(),
                                         changed(path), "2026-11-23")[0], path)

    def test_removals_and_renames_denied(self):
        for status in ("removed", "renamed"):
            self.assertFalse(decide_goal([owner_grant()], GOAL_ID, scoped_pr(),
                                         changed(status=status), "2026-11-23")[0])

    def test_owner_can_revoke_once(self):
        revoke = owner_grant(f"REVOKE-GOAL: {GOAL_ID}")
        self.assertFalse(decide_goal([owner_grant(), revoke], GOAL_ID,
                                     scoped_pr(), changed(), "2026-11-23")[0])

    def test_expired_and_long_grants_denied(self):
        self.assertFalse(decide_goal([owner_grant()], GOAL_ID, scoped_pr(),
                                     changed(), "2026-12-01")[0])
        extended = GRANT_BODY.replace("2026-11-30", "2027-01-01")
        self.assertFalse(decide_goal([owner_grant(extended)], GOAL_ID,
                                     scoped_pr(), changed(), "2026-11-23")[0])

    def test_edited_owner_grant_denied(self):
        self.assertFalse(decide_goal([owner_grant(updated="2026-11-23T00:00:00Z")],
                                     GOAL_ID, scoped_pr(), changed(), "2026-11-23")[0])

    def test_empty_file_list_denied(self):
        self.assertFalse(decide_goal([owner_grant()], GOAL_ID, scoped_pr(),
                                     [], "2026-11-23")[0])

    def test_old_sha_gate_survives(self):
        self.assertTrue(decide_con([firma(f"HITL: {CABEZA} web#319 2026-10-25")])[0])


if __name__ == "__main__":
    unittest.main()
