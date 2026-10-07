#!/usr/bin/env python3
"""Opt-in isolated VPS integration test. NEVER run on a production Guide host.

Uses real systemd/SQLite/Guide and fixed GitHub URL PATH fixtures. Leaves the
test service enabled for a manually approved reboot test; does not auto-clean.
"""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import socket
import sqlite3
import subprocess
import sys
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[2]
STANDARD = [Path(p) for p in ['/opt/guide', '/var/lib/guide', '/etc/systemd/system/guide.service',
                             '/usr/local/sbin/guide-update']]
LAUNCHER = r'''
#include <stdio.h>
#include <string.h>
#include <unistd.h>
int main(int argc, char **argv) {
    if (argc > 1 && strcmp(argv[1], "--version") == 0) {
#ifdef LEGACY
        return 1;
#else
        puts("guide-hub " VERSION); return 0;
#endif
    }
    if (argc > 1 && strcmp(argv[1], "--help") == 0) {
        puts("guide-hub " VERSION); return 0;
    }
#ifdef FAIL_START
    const char *db = NULL;
    for (int i=1; i+1<argc; i++) if (!strcmp(argv[i], "--db")) db = argv[i+1];
    if (db && argc > 1) {
        execl(PYTHON, PYTHON, "-c",
              "import sqlite3,sys; c=sqlite3.connect(sys.argv[1]); c.execute('PRAGMA user_version=14'); "
              "c.execute(\"INSERT OR REPLACE INTO setting VALUES ('fixture_failed_migration','yes')\"); c.commit(); sys.exit(42)",
              db, (char *)NULL);
    }
    return 42;
#else
    argv[0] = REAL_BINARY;
    execv(REAL_BINARY, argv);
    return 42;
#endif
}
'''
FAKE_CURL = r'''#!/usr/bin/env python3
import json, os, pathlib, shutil, subprocess, sys
stage = pathlib.Path(os.environ['GUIDE_VPS_FIXTURE'])
state = json.loads((stage / 'state.json').read_text())
args = sys.argv[1:]
url = args[-1]
if url.startswith('http://127.0.0.1:'):
    sys.exit(subprocess.run([state['real_curl'], *args]).returncode)
prefix = 'https://github.com/NSJLUCAS/Guide/releases/'
if not url.startswith(prefix): raise SystemExit('Unexpected fixture update source')
name = url.rsplit('/', 1)[-1]
if '-fsSI' in args:
    print('HTTP/2 302\r\nlocation: ' + prefix + 'download/v' + state['latest'] + '/' + name + '\r\n')
else:
    if '/download/v' + state['latest'] + '/' not in url: raise SystemExit('Wrong fixture tag')
    shutil.copyfile(stage / state['variant'] / name, args[args.index('-o')+1])
'''


def call(args, env=None, good=True, capture=False):
    result = subprocess.run([str(a) for a in args], env=env, text=True, capture_output=capture)
    if good and result.returncode:
        raise RuntimeError('Command failed: ' + str(args[0]))
    return result


def preflight():
    if sys.platform != 'linux' or os.geteuid() != 0:
        raise SystemExit('Requires root on an isolated Linux VPS')
    if any(p.exists() or p.is_symlink() for p in STANDARD):
        raise SystemExit('STOP: Guide installation/production paths already exist')
    status = call(['systemctl', 'show', 'guide.service', '--property=LoadState', '--value'], capture=True).stdout.strip()
    if status != 'not-found':
        raise SystemExit('STOP: an existing guide.service was found')
    for command in ['cc', 'curl', 'systemctl', 'runuser', 'getconf', 'useradd']:
        if not shutil.which(command):
            raise SystemExit('Missing prerequisite: ' + command)
    for port in [28080, 28081]:
        with socket.socket() as probe:
            probe.bind(('127.0.0.1', port))


def make_assets(stage, variant, version, binary, corrupt=False, attack=False):
    dest = stage / variant
    dest.mkdir()
    archive = dest / 'guide-linux-x86_64.tar.gz'
    sources = {'guide-hub': binary, 'LICENSE': ROOT / 'LICENSE',
               'THIRD_PARTY_NOTICES.md': ROOT / 'THIRD_PARTY_NOTICES.md',
               'THIRD_PARTY_LICENSES.md': ROOT / 'docs/THIRD_PARTY_LICENSES.md',
               'INSTALL.md': ROOT / 'docs/deployment/INSTALL.md',
               'AUTH_RECOVERY.md': ROOT / 'docs/deployment/AUTH_RECOVERY.md',
               'guide.service': ROOT / 'docs/deployment/guide.service'}
    with tarfile.open(archive, 'w:gz') as tar:
        for name, source in sources.items():
            info = tarfile.TarInfo('../escape' if attack and name == 'LICENSE' else name)
            data = source.read_bytes()
            info.size = len(data)
            info.mode = 0o755 if name == 'guide-hub' else 0o644
            tar.addfile(info, io.BytesIO(data))
    shutil.copyfile(ROOT / 'install-guide.sh', dest / 'install-guide.sh')
    lines = [hashlib.sha256((dest / name).read_bytes()).hexdigest() + '  ' + name + '\n'
             for name in ['guide-linux-x86_64.tar.gz', 'install-guide.sh']]
    (dest / 'sha256sums.txt').write_text(''.join(lines))
    (dest / 'guide-linux-x86_64.tar.gz.sha256').write_text(lines[0])
    if corrupt:
        with archive.open('ab') as out:
            out.write(b'corrupt fixture')


def data_snapshot(db):
    with sqlite3.connect(db) as conn:
        settings = dict(conn.execute('SELECT key,value FROM setting'))
        services = list(conn.execute('SELECT * FROM service ORDER BY id'))
        schema = conn.execute('PRAGMA user_version').fetchone()[0]
    return settings, services, schema


def run_tests(real):
    preflight()
    if not real.is_file():
        raise SystemExit('Build the real Guide release binary first')
    # PrivateTmp hides /tmp and /var/tmp from the service. Keep the real binary
    # in a dedicated, guarded /opt fixture directory that the guide user can read.
    stage = Path(tempfile.mkdtemp(prefix='guide-vps-fixture-', dir='/opt'))
    stage.chmod(0o755)
    actual = stage / 'real-guide-hub'
    shutil.copyfile(real, actual)
    actual.chmod(0o755)
    source = stage / 'launcher.c'
    source.write_text(LAUNCHER)
    for name, version, flags in [('old', '1.0.0', ['-DLEGACY']), ('new', '1.0.1', []),
                                 ('fail', '1.0.2', ['-DFAIL_START'])]:
        binary = stage / name
        call(['cc', source, '-o', binary, '-DVERSION="' + version + '"',
              '-DREAL_BINARY="' + str(actual) + '"', '-DPYTHON="' + sys.executable + '"', *flags])
    make_assets(stage, 'v100', '1.0.0', stage / 'old')
    make_assets(stage, 'v101', '1.0.1', stage / 'new')
    make_assets(stage, 'bad-sha', '1.0.1', stage / 'new', corrupt=True)
    make_assets(stage, 'bad-archive', '1.0.1', stage / 'new', attack=True)
    make_assets(stage, 'v102-fail', '1.0.2', stage / 'fail')
    mockbin = stage / 'mock-bin'
    mockbin.mkdir(mode=0o755)
    curl = mockbin / 'curl'
    curl.write_text(FAKE_CURL)
    curl.chmod(0o755)
    config = {'latest': '1.0.0', 'variant': 'v100', 'real_curl': shutil.which('curl')}
    env = os.environ.copy()
    env['GUIDE_VPS_FIXTURE'] = str(stage)
    env['PATH'] = str(mockbin) + os.pathsep + env['PATH']

    def choose(version, variant):
        config.update(latest=version, variant=variant)
        (stage / 'state.json').write_text(json.dumps(config))

    def active():
        call(['systemctl', 'is-active', '--quiet', 'guide.service'])

    choose('1.0.0', 'v100')
    # Displays the real random emergency password once. Do not redirect to a
    # public log. The fixture launcher forwards initialization to real Guide.
    call(['sh', ROOT / 'install-guide.sh'], env)
    active()
    db = Path('/var/lib/guide/guide.db')
    with sqlite3.connect(db) as conn:
        password = conn.execute("SELECT value FROM setting WHERE key='admin_password_hash'").fetchone()[0]
        assert password.startswith('$argon2id$')
        config_rows = {'service_card_style': 'compact', 'icon_libraries': '{"activeId":"","libraries":[]}',
                       'github_client_id': 'fixture-only', 'github_client_secret': 'fixture-only',
                       'github_allowed_users': 'fixture-user', 'fixture_preservation': 'keep'}
        conn.executemany('INSERT OR REPLACE INTO setting VALUES (?,?)', config_rows.items())
        conn.execute("INSERT INTO service(name,url,category,public,check_enabled,created_at,updated_at) VALUES ('Fixture','https://example.com','VPS fixture',1,0,1,1)")
    expected = data_snapshot(db)
    assert expected[2] == 13
    # Prove a real nonstandard DB/listen survives upgrade and rollback.
    call(['systemctl', 'stop', 'guide.service'])
    custom = db.parent / 'custom-db'
    custom.mkdir(mode=0o750)
    owner = db.stat()
    os.chown(custom, owner.st_uid, owner.st_gid)
    moved = custom / 'monitor.db'
    for suffix in ['', '-wal', '-shm']:
        source_db = Path(str(db) + suffix)
        if source_db.exists():
            source_db.replace(Path(str(moved) + suffix))
    db = moved
    unit_path = Path('/etc/systemd/system/guide.service')
    unit_path.write_text(unit_path.read_text().replace('/var/lib/guide/guide.db', str(db)).replace('127.0.0.1:28080', '127.0.0.1:28081'))
    call(['systemctl', 'daemon-reload'])
    call(['systemctl', 'start', 'guide.service'])
    active()
    original_binary = Path('/opt/guide/guide-hub').read_bytes()
    original_unit = Path('/etc/systemd/system/guide.service').read_bytes()
    for variant in ['bad-sha', 'bad-archive']:
        choose('1.0.1', variant)
        pid = call(['systemctl', 'show', 'guide.service', '--property=MainPID', '--value'], capture=True).stdout
        assert call(['sh', '/usr/local/sbin/guide-update'], env, good=False).returncode != 0
        active()
        assert pid == call(['systemctl', 'show', 'guide.service', '--property=MainPID', '--value'], capture=True).stdout
        assert Path('/opt/guide/guide-hub').read_bytes() == original_binary
        assert data_snapshot(db) == expected
    choose('1.0.1', 'v101')
    call(['sh', '/usr/local/sbin/guide-update', '--check'], env)
    call(['sh', '/usr/local/sbin/guide-update'], env)
    active()
    assert data_snapshot(db) == expected
    assert Path('/etc/systemd/system/guide.service').read_bytes() == original_unit
    new_binary = Path('/opt/guide/guide-hub').read_bytes()
    choose('1.0.2', 'v102-fail')
    assert call(['sh', '/usr/local/sbin/guide-update'], env, good=False).returncode != 0
    active()
    assert Path('/opt/guide/guide-hub').read_bytes() == new_binary
    assert data_snapshot(db) == expected  # includes failed schema 14 -> restored 13
    assert list((db.parent / 'backups').glob('*/failed-state/*/monitor.db'))
    choose('1.0.1', 'v101')
    call(['sh', '/usr/local/sbin/guide-update'], env)
    call(['systemctl', 'is-enabled', '--quiet', 'guide.service'])
    marker = {'db': str(db), 'stage': str(stage), 'binary_sha256': hashlib.sha256(new_binary).hexdigest(),
              'data_sha256': hashlib.sha256(json.dumps(expected, sort_keys=True).encode()).hexdigest()}
    marker_path = Path('/opt/guide/VPS_FIXTURE.json')
    marker_path.write_text(json.dumps(marker))
    marker_path.chmod(0o600)
    print('Isolated real systemd/Guide/SQLite fixture tests passed. Test service retained for reboot validation.')
    print('Fixture path: ' + str(stage))
    print('No automatic cleanup or reboot was performed. Follow VPS_TEST.md for the manual reboot check.')


def after_reboot():
    if sys.platform != 'linux' or os.geteuid() != 0:
        raise SystemExit('Requires root on the same isolated test VPS')
    marker_path = Path('/opt/guide/VPS_FIXTURE.json')
    if not marker_path.is_file() or marker_path.is_symlink():
        raise SystemExit('STOP: no isolated test marker; do not inspect a production install')
    marker = json.loads(marker_path.read_text())
    call(['systemctl', 'is-active', '--quiet', 'guide.service'])
    call(['systemctl', 'is-enabled', '--quiet', 'guide.service'])
    assert hashlib.sha256(Path('/opt/guide/guide-hub').read_bytes()).hexdigest() == marker['binary_sha256']
    current = data_snapshot(Path(marker['db']))
    assert hashlib.sha256(json.dumps(current, sort_keys=True).encode()).hexdigest() == marker['data_sha256']
    call(['curl', '-fsS', '--noproxy', '*', '-o', os.devnull, 'http://127.0.0.1:28081/api/public-config'])
    print('Reboot verification passed: enabled/active, binary, DB/schema/config and local HTTP retained.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--run-isolated-systemd-test', action='store_true')
    mode.add_argument('--verify-after-reboot', action='store_true')
    mode.add_argument('--preflight-only', action='store_true')
    parser.add_argument('--binary', type=Path, default=ROOT / 'guide/target/release/guide-hub')
    args = parser.parse_args()
    if args.preflight_only:
        preflight()
        print('Preflight passed; no installation/service was changed.')
    elif args.verify_after_reboot:
        after_reboot()
    else:
        run_tests(args.binary.absolute())
