"""X2 · bin/hooks/prepare-commit-msg, tested in disposable repositories (the acceptance gate of
study#79). Nothing is installed: each repository points core.hooksPath at a temporary copy."""
import os
import pathlib
import shutil
import subprocess
import tempfile
import unittest

RAIZ = pathlib.Path(__file__).resolve().parent.parent
HOOK = RAIZ / "bin" / "hooks" / "prepare-commit-msg"
CAMPOS = ("Agent", "Model", "Run")


class TrailersHook(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="x2-")
        self.hooks = os.path.join(self.tmp, "hooks"); os.mkdir(self.hooks)
        shutil.copy(HOOK, self.hooks); os.chmod(os.path.join(self.hooks, "prepare-commit-msg"), 0o755)
        self.hook_exe = os.path.join(self.hooks, "prepare-commit-msg")  # copia ya ejecutable (la API no conserva el modo del original)
        self.repo = os.path.join(self.tmp, "repo"); os.mkdir(self.repo)
        self.git("init", "-q", "-b", "main")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def git(self, *args, env=None):
        base = ["git", "-c", "core.hooksPath=" + self.hooks, "-c", "user.name=t", "-c", "user.email=t@example.invalid",
                "-c", "commit.gpgsign=false"]
        e = dict(os.environ, GIT_EDITOR="true", **(env or {}))
        e.pop("GIT_REFLOG_ACTION", None) if not env or "GIT_REFLOG_ACTION" not in env else None
        return subprocess.run(base + list(args), cwd=self.repo, capture_output=True, text=True, env=e, check=True).stdout

    def commit(self, *mensajes, extra=()):
        pathlib.Path(self.repo, "f").write_text(str(len(os.listdir(self.repo))) + self.git("rev-parse", "--git-dir"))
        self.git("add", "f")
        args = ["commit", "-q"] + list(extra)
        for m in mensajes:
            args += ["-m", m]
        self.git(*args)
        return self.git("log", "-1", "--format=%B")

    def cuenta(self, msg):
        return {c: sum(1 for l in msg.splitlines() if l.startswith(c + ":")) for c in CAMPOS}

    def test_new_commit_gets_each_field_once_as_no_data(self):
        msg = self.commit("Add a file")
        self.assertEqual(self.cuenta(msg), {"Agent": 1, "Model": 1, "Run": 1})
        for c in CAMPOS:
            self.assertIn(c + ": NO_DATA", msg)
        self.assertNotIn("Status:", msg)

    def test_supplied_values_are_kept(self):
        msg = self.commit("Add a file", "Model: Opus 5.5\nRun: 42")
        self.assertEqual(self.cuenta(msg), {"Agent": 1, "Model": 1, "Run": 1})
        self.assertIn("Model: Opus 5.5", msg); self.assertIn("Run: 42", msg); self.assertIn("Agent: NO_DATA", msg)

    def test_idempotent(self):
        f = pathlib.Path(self.tmp, "MSG"); f.write_text("Subject\n")
        for _ in range(2):
            subprocess.run([self.hook_exe, str(f), "message"], cwd=self.repo, check=True,
                           env=dict(os.environ, GIT_DIR=os.path.join(self.repo, ".git")))
        self.assertEqual(self.cuenta(f.read_text()), {"Agent": 1, "Model": 1, "Run": 1})

    def test_amend_is_skipped(self):
        self.git("commit", "-q", "--allow-empty", "-m", "Plain", "--no-verify")
        self.git("-c", "core.hooksPath=/dev/null", "commit", "-q", "--amend", "--allow-empty", "-m", "Plain base")
        msg = self.commit("Changed", extra=("--amend",))
        self.assertEqual(self.cuenta(msg), {"Agent": 0, "Model": 0, "Run": 0})

    def test_merge_is_skipped(self):
        self.commit("Base")
        self.git("switch", "-q", "-c", "lado"); self.commit("Side")
        self.git("switch", "-q", "main"); self.commit("Main")
        self.git("merge", "-q", "--no-ff", "-m", "Merge lado", "lado")
        msg = self.git("log", "-1", "--format=%B")
        self.assertEqual(self.cuenta(msg), {"Agent": 0, "Model": 0, "Run": 0})

    def test_rebase_and_empty_messages_are_left_alone(self):
        f = pathlib.Path(self.tmp, "MSG")
        for texto, env in (("Subject\n", {"GIT_REFLOG_ACTION": "rebase (pick)"}), ("# only a comment\n\n", {})):
            f.write_text(texto)
            subprocess.run([self.hook_exe, str(f), "message"], cwd=self.repo, check=True,
                           env=dict(os.environ, GIT_DIR=os.path.join(self.repo, ".git"), **env))
            self.assertEqual(f.read_text(), texto)

    def test_sabotage_without_if_exists_the_supplied_value_would_duplicate(self):
        fuente = HOOK.read_text().replace("--if-exists doNothing", "--if-exists add")
        malo = pathlib.Path(self.hooks, "prepare-commit-msg"); malo.write_text(fuente); os.chmod(malo, 0o755)
        msg = self.commit("Add a file", "Model: Opus 5.5")
        self.assertEqual(self.cuenta(msg)["Model"], 2, "the sabotaged hook must duplicate: this guard is what prevents it")


if __name__ == "__main__":
    unittest.main()
