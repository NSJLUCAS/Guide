#!/usr/bin/env python3
"""Verify the exact four publish assets, both checksum sources and the archive.

Use the same strict archive parser as the installed updater, without executing
its entry point. All unpacking is private temporary staging.
"""
import argparse
from pathlib import Path
import subprocess
import tempfile
import types

ROOT = Path(__file__).resolve().parents[1]


def installer_module():
    source = (ROOT / 'install-guide.sh').read_text(encoding='utf-8')
    body = source.split("<<'GUIDE_PYTHON'\n", 1)[1].rsplit('\nGUIDE_PYTHON', 1)[0]
    module = types.ModuleType('guide_release_installer')
    exec(compile(body, 'install-guide.sh', 'exec'), module.__dict__)
    return module


def verify(directory, version=None):
    module = installer_module()
    expected = {module.ASSET, module.ASSET + '.sha256', 'install-guide.sh', 'sha256sums.txt'}
    module.require({p.name for p in directory.iterdir()} == expected, 'Unexpected publish asset list')
    for name in expected:
        path = directory / name
        module.safe_path(path, True)
    sums = module.manifest(directory / 'sha256sums.txt', {module.ASSET, 'install-guide.sh'})
    standalone = module.manifest(directory / (module.ASSET + '.sha256'), {module.ASSET})
    module.require(sums[module.ASSET] == standalone[module.ASSET], 'Checksum sources disagree')
    for name, value in sums.items():
        module.require(module.digest(directory / name) == value, 'Checksum mismatch: ' + name)
    module.require((directory / 'install-guide.sh').read_bytes() == (ROOT / 'install-guide.sh').read_bytes(),
                   'Installer asset differs from reviewed source')
    with tempfile.TemporaryDirectory(prefix='guide-release-verify-') as temp:
        binary = module.unpack(directory / module.ASSET, Path(temp) / 'package')
        if version:
            result = subprocess.run([str(binary), '--version'], capture_output=True, text=True, timeout=10)
            module.require(result.returncode == 0 and result.stdout == 'guide-hub ' + version + '\n',
                           'Release binary version mismatch')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('directory', type=Path)
    parser.add_argument('--version')
    args = parser.parse_args()
    verify(args.directory.absolute(), args.version)
    print('Release assets, SHA-256 and archive verified')
