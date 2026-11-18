#!/usr/bin/env python3
"""Fail-closed import of the APP-owned reproducible public MINI ZIP.
The APP bundle is copied byte-for-byte; WEB does not patch source or impersonate APP.
No automatic publication; exact human review and Cloudflare deploy remain separate.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import zipfile
from pathlib import Path, PurePosixPath
ROOT=Path(__file__).resolve().parents[1]
PUB=ROOT/'public/app'
APP_SHA='cde2d0034d9d107ced9e16b88c095136d07ab37d'
ZIP_SHA='e9074a88b7b8e00847ea0d789241fe95d62536d3bb84963028ab85dc003d50da'
def hash256(x):return hashlib.sha256(x).hexdigest()
def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--zip',required=True,type=Path)
    a=parser.parse_args()
    blob=a.zip.read_bytes()
    if hash256(blob)!=ZIP_SHA: raise SystemExit('FAIL_CLOSED(source_zip_sha256_mismatch)')
    with zipfile.ZipFile(a.zip) as z:
        paths=z.namelist()
        if len(set(paths))!=len(paths) or len(paths)!=16:
            raise SystemExit('FAIL_CLOSED(zip_entries_changed)')
        if any(not n.startswith('app/') or PurePosixPath(n).is_absolute() or '..' in PurePosixPath(n).parts or n.endswith('/') for n in paths):
            raise SystemExit('FAIL_CLOSED(zip_path_outside_app_scope)')
        manifest=json.loads(z.read('app/package-manifest.json'))
        if (manifest.get('schema')!='preceptoros.public-mini-package/1' or
            manifest.get('source_head')!=APP_SHA or
            manifest.get('source_repository')!='piskyRpapalo/preceptoros-app' or
            manifest.get('public_entry')!='/app/' or manifest.get('no_model_download') is not True or
            manifest.get('no_rack_connection') is not True or manifest.get('mode')!='FOUR_ZONE_DETERMINISTIC_ONLY'):
            raise SystemExit('FAIL_CLOSED(package_contract_mismatch)')
        digests=manifest['files']
        if set(digests)!={PurePosixPath(n).relative_to('app').as_posix() for n in paths if n!='app/package-manifest.json'}:
            raise SystemExit('FAIL_CLOSED(package_file_manifest_mismatch)')
        for name in paths:
            content=z.read(name)
            rel=PurePosixPath(name).relative_to('app').as_posix()
            if name!='app/package-manifest.json' and hash256(content)!=digests[rel]:
                raise SystemExit('FAIL_CLOSED(package_asset_digest_mismatch:'+rel+')')
            dest=PUB/rel;dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(content)
    # ZIP is never edited; this independent release receipt is stored outside APP's bundle.
    out=ROOT/'docs/receipts/companion-mini-import-20261118.json'
    out.parent.mkdir(parents=True,exist_ok=True)
    out.write_text(json.dumps({'schema':'preceptoros.web-mini-import/1',
        'source_app_head':APP_SHA,'app_package_zip_sha256':ZIP_SHA,
        'files':len(paths),'import':'COPY_BYTES_UNCHANGED','model_required':False,
        'publication':'HITL_REQUIRED','remote_smoke':'NO_DATA(not_published)'},
        sort_keys=True,indent=2)+'\n')
    print('VERIFIED official package',len(paths),'zip_sha',ZIP_SHA,'app_head',APP_SHA)
if __name__=='__main__':main()
