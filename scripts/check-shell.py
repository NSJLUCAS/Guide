#!/usr/bin/env python3
"""ShellCheck installer/build scripts, actual updater fixtures and workflow shells.

Requires PyYAML 6.0.3. Does not execute workflows or the VPS runner.
"""
from pathlib import Path
import subprocess
import sys

import yaml

ROOT = Path(__file__).resolve().parents[1]


def check(shellcheck):
    files = [ROOT / 'install-guide.sh', *sorted((ROOT / 'scripts').glob('*.sh')),
             *sorted((ROOT / 'guide/scripts').glob('*.sh'))]
    subprocess.run([shellcheck, '-S', 'warning', *map(str, files)], check=True)
    for path in sorted((ROOT / '.github/workflows').glob('*.yml')):
        workflow = yaml.safe_load(path.read_text(encoding='utf-8'))
        for job_name, job in workflow['jobs'].items():
            for step in job['steps']:
                if 'run' in step:
                    print(f"ShellCheck: {path.name}/{job_name}/{step.get('name', 'run')}", flush=True)
                    subprocess.run([shellcheck, '-S', 'warning', '-s', 'bash', '-'],
                                   input=step['run'].encode('utf-8'), check=True)
    # Generate precisely the wrappers used by the updater suite, without
    # executing its service/installer doubles or any VPS commands.
    sys.path.insert(0, str(ROOT / 'tests/updater'))
    from test_updater import UpdaterTest
    fixture = UpdaterTest()
    try:
        fixture.setUp()
        subprocess.run([shellcheck, '-S', 'warning', *map(str, sorted(fixture.mockbin.iterdir()))], check=True)
    finally:
        fixture.doCleanups()
    print('ShellCheck: all installer/build, workflow and updater fixture shells passed')


if __name__ == '__main__':
    check(sys.argv[1] if len(sys.argv) > 1 else 'shellcheck')
