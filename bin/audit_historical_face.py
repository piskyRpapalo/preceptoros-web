#!/usr/bin/env python3
"""Run the historical face validator in a disposable, non-served tree."""
import os
from pathlib import Path
import subprocess
import sys
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
HISTORY = '4589267c4ade8b9588bbf1fa5d782ddb407f5fe1'


def git(*args):
    return subprocess.check_output(['git', '-C', str(ROOT), *args])


def main():
    if len(sys.argv) != 2 or not (Path(sys.argv[1]) / 'interface/face').is_dir():
        print('NO_DATA: supply an app checkout containing interface/face', file=sys.stderr)
        return 2
    with tempfile.TemporaryDirectory(prefix='acho-audit-') as temporary:
        path = Path(temporary)
        archive = path / 'current.tar'
        archive.write_bytes(git('archive', 'HEAD'))
        with tarfile.open(archive) as stream:
            stream.extractall(path=path, filter='data')
        names = git('ls-tree', '-r', '--name-only', HISTORY, '--',
                    'public/game', 'public/assets').decode().splitlines()
        restored = 0
        for name in names:
            target = path / name
            if name.endswith('.js') and not target.exists():
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(git('show', HISTORY + ':' + name))
                restored += 1
        print(f'Historical JS restored only in temporary audit: {restored}', flush=True)
        env = os.environ.copy()
        env['APP_DIR'] = str(Path(sys.argv[1]).resolve())
        return subprocess.run(['node', 'docs/rebuild/examples/validate.mjs'],
                              cwd=path, env=env, check=False).returncode


if __name__ == '__main__':
    sys.exit(main())
