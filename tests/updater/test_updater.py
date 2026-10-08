"""Execute the production shell entry point with deterministic PATH fixtures.

Run: python3 -m unittest discover -s tests/updater -v
GUIDE_TEST_SH may select a POSIX shell on Windows. No real system paths/network.
"""
import hashlib
import io
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest

REPO = Path(__file__).resolve().parents[2]
SCRIPT = REPO / 'install-guide.sh'
FILES = ['guide-hub', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_LICENSES.md',
         'INSTALL.md', 'AUTH_RECOVERY.md', 'guide.service']


class UpdaterTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='guide-test-')
        self.root = Path(self.temp.name)
        self.addCleanup(self.temp.cleanup)
        self.db = self.root / 'var/lib/guide/guide.db'
        self.binary = self.root / 'opt/guide/guide-hub'
        self.unit = self.root / 'etc/systemd/system/guide.service'
        self.updater = self.root / 'usr/local/sbin/guide-update'
        self.release = self.root / 'release'
        self.release.mkdir()
        self.mock = Path(__file__).with_name('mock.py')
        self.mockbin = self.root / 'mock-bin'
        self.mockbin.mkdir()
        for cmd in ['python3', 'curl', 'systemctl', 'uname', 'id', 'getconf',
                    'systemd-detect-virt', 'useradd', 'runuser']:
            path = self.mockbin / cmd
            with path.open('w', newline='\n') as out:
                out.write('#!/bin/sh\nexec "$GUIDE_TEST_PYTHON" "$GUIDE_TEST_MOCK" ' + cmd + ' "$@"\n')
            path.chmod(0o755)
        self.state = {'latest': '1.0.1', 'service': True, 'active': True, 'db': str(self.db)}
        self.install_existing()
        self.make_release()

    def hub(self, version):
        # Valid ELF candidate header; command execution is intercepted only in
        # the test runner (kernel execution is exercised by the VPS layer).
        return b'\x7fELF\x02\x01\x01' + b'\0' * 11 + b'\x3e\x00' + version.encode()

    def install_existing(self, version='1.0.0'):
        for p in [self.db, self.binary, self.unit, self.updater]:
            p.parent.mkdir(parents=True, exist_ok=True)
        self.db.write_bytes(b'user services oauth icons category cardStyle sessions')
        self.binary.write_bytes(self.hub(version))
        self.binary.chmod(0o755)
        if SCRIPT.exists():
            shutil.copyfile(SCRIPT, self.updater)
        else:
            self.updater.write_bytes(b'not implemented')
        self.unit.write_text('[Service]\nUser=guide\nWorkingDirectory=/opt/guide\n'
                             'ExecStart=/opt/guide/guide-hub --db /var/lib/guide/guide.db --listen 127.0.0.1:28080\n')

    def make_release(self, attack=None, installer=None):
        archive = self.release / 'guide-linux-x86_64.tar.gz'
        with tarfile.open(archive, 'w:gz') as tar:
            for name in FILES:
                skipped = ('INSTALL.md' if attack and attack[0] == 'LICENSE' else
                           attack[0] if attack and attack[0] in FILES else 'LICENSE')
                if attack and name == skipped:
                    continue
                data = self.hub(self.state['latest']) if name == 'guide-hub' else b'fixture documentation'
                info = tarfile.TarInfo(name)
                info.mode = 0o755 if name == 'guide-hub' else 0o644
                info.size = len(data)
                tar.addfile(info, io.BytesIO(data))
            if attack:
                name, kind = attack
                info = tarfile.TarInfo(name)
                info.type = kind
                info.linkname = 'guide-hub' if kind in (tarfile.SYMTYPE, tarfile.LNKTYPE) else ''
                info.mode = 0o755
                if kind == tarfile.REGTYPE:
                    info.size = 4
                tar.addfile(info, io.BytesIO(b'evil'))
        source = installer if installer is not None else SCRIPT.read_bytes() if SCRIPT.exists() else b'not implemented'
        (self.release / 'install-guide.sh').write_bytes(source)
        self.sums()

    def sums(self):
        lines = []
        for name in ['guide-linux-x86_64.tar.gz', 'install-guide.sh']:
            lines.append(hashlib.sha256((self.release / name).read_bytes()).hexdigest() + '  ' + name + '\n')
        (self.release / 'sha256sums.txt').write_text(''.join(lines))
        (self.release / 'guide-linux-x86_64.tar.gz.sha256').write_text(lines[0])

    def run_script(self, *args, saved=False):
        (self.root / 'state.json').write_text(json.dumps(self.state))
        script = self.updater if saved else SCRIPT
        env = os.environ.copy()
        env.update(GUIDE_TEST_ROOT=str(self.root), GUIDE_TEST_PYTHON=sys.executable,
                   GUIDE_TEST_MOCK=str(self.mock), TMPDIR=str(self.root), TEMP=str(self.root), TMP=str(self.root))
        env['PATH'] = str(self.mockbin) + os.pathsep + env['PATH']
        proc = subprocess.run([os.environ.get('GUIDE_TEST_SH', 'sh'), str(script), *args],
                              env=env, capture_output=True, text=True, timeout=30)
        self.output = proc.stdout + proc.stderr
        self.state = json.loads((self.root / 'state.json').read_text())
        return proc.returncode

    def commands(self):
        return [json.loads(s) for s in (self.root / 'commands.jsonl').read_text().splitlines()]

    def unchanged(self, args=()):
        before = {p: p.read_bytes() for p in [self.db, self.binary, self.unit, self.updater] if p.exists()}
        self.assertNotEqual(self.run_script(*args), 0, self.output)
        for path, data in before.items():
            self.assertEqual(path.read_bytes(), data)
        self.assertTrue(self.state['active'])
        self.assertFalse(any(c[:2] == ['systemctl', 'stop'] for c in self.commands()))

    def test_fresh_install(self):
        for p in [self.db, self.binary, self.unit, self.updater]:
            p.unlink()
        self.state.update(service=False, active=False)
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertTrue(self.binary.is_file())
        self.assertEqual(self.updater.read_bytes(), SCRIPT.read_bytes())
        self.assertIn('127.0.0.1:28080', self.unit.read_text())
        self.assertEqual(self.output.count('Emergency password: fixture-random-password'), 1)
        self.assertTrue(self.state['active'])

    def orphan_sidecar(self, suffix):
        for p in [self.db, self.binary, self.unit, self.updater]:
            p.unlink()
        sidecar = Path(str(self.db) + suffix)
        sidecar.write_bytes(b'only recoverable user data')
        self.state.update(service=False, active=False)
        self.assertNotEqual(self.run_script(), 0, self.output)
        self.assertEqual(sidecar.read_bytes(), b'only recoverable user data')
        self.assertFalse(self.db.exists())
        self.assertFalse(self.binary.exists())

    def test_fresh_refuses_orphan_wal(self):
        self.orphan_sidecar('-wal')

    def test_fresh_refuses_orphan_shm(self):
        self.orphan_sidecar('-shm')

    def test_upgrade_legacy_help_version(self):
        before = self.db.read_bytes()
        unit = self.unit.read_bytes()
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.1'))
        self.assertEqual(self.db.read_bytes(), before)
        self.assertEqual(self.unit.read_bytes(), unit)
        self.assertTrue(self.state['active'])

    def test_already_latest(self):
        self.state['latest'] = '1.0.0'
        self.make_release()
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertIn('already', self.output)
        self.assertFalse(any(c[:2] == ['systemctl', 'stop'] for c in self.commands()))

    def test_legacy_latest_no_manifest_needed_for_temporary_script(self):
        self.state.update(latest='1.0.0', network_fail='sha256sums.txt')
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertIn('already', self.output)
        self.assertTrue(self.state['active'])

    def test_current_newer_no_downgrade(self):
        self.install_existing('2.0.0')
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertIn('newer', self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('2.0.0'))

    def test_latest_failure(self):
        self.state['latest_fail'] = True
        self.unchanged()

    def test_binary_download_failure(self):
        self.state['network_fail'] = 'guide-linux-x86_64.tar.gz'
        self.unchanged()

    def test_manifest_download_failure(self):
        self.state['network_fail'] = 'sha256sums.txt'
        self.unchanged()

    def test_archive_sha_mismatch(self):
        (self.release / 'guide-linux-x86_64.tar.gz').write_bytes(b'corrupt')
        self.unchanged()

    def test_installer_sha_mismatch(self):
        (self.release / 'install-guide.sh').write_bytes(b'corrupt')
        self.unchanged()

    def test_missing_service(self):
        self.state['service'] = False
        self.unchanged()

    def test_no_db_argument(self):
        self.unit.write_text('[Service]\nExecStart=/opt/guide/guide-hub --listen 127.0.0.1:28080\n')
        self.unchanged()

    def test_db_absent(self):
        self.db.unlink()
        self.unchanged()

    def test_sidecars_backed_up(self):
        for suffix in ['-wal', '-shm']:
            Path(str(self.db) + suffix).write_bytes(suffix.encode())
        self.assertEqual(self.run_script(), 0, self.output)
        backup = next((self.db.parent / 'backups').iterdir())
        self.assertEqual((backup / 'guide.db-wal').read_bytes(), b'-wal')
        self.assertEqual((backup / 'guide.db-shm').read_bytes(), b'-shm')
        self.assertEqual((backup / 'guide.db').read_bytes(), self.db.read_bytes())
        self.assertEqual(next((self.binary.parent / 'backups').iterdir()).joinpath('guide-hub').read_bytes(), self.hub('1.0.0'))

    def test_custom_db_listen_and_unit_preserved(self):
        custom = self.root / 'custom data/monitor.db'
        custom.parent.mkdir()
        self.db.replace(custom)
        self.db = custom
        self.state['db'] = str(custom)
        self.unit.write_text('[Service]\nExecStart="' + self.binary.as_posix() + '" --db "' + custom.as_posix() + '" --listen 127.0.0.1:29999\nMemoryMax=1G\n')
        before = self.unit.read_bytes()
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertEqual(self.unit.read_bytes(), before)
        self.assertEqual(next((custom.parent / 'backups').iterdir()).joinpath('monitor.db').read_bytes(), custom.read_bytes())

    def namespace_decoy(self, path, directive):
        self.state['path_map'] = {path: str(self.db)}
        key, _, value = directive.partition('=')
        self.state[{'PrivateTmp': 'private_tmp', 'ProtectHome': 'protect_home'}[key]] = value
        self.unit.write_text('[Service]\nExecStart=/opt/guide/guide-hub --db "' + path +
                             '" --listen 127.0.0.1:28080\n' + directive + '\n')
        self.unchanged()
        self.assertIn('Unsupported private service filesystem path', self.output)

    def test_private_tmp_database_refused(self):
        self.namespace_decoy('/tmp/guide.db', 'PrivateTmp=yes')

    def test_private_tmp_standard_paths_allowed(self):
        self.state['private_tmp'] = 'yes'
        with self.unit.open('a') as out:
            out.write('PrivateTmp=yes\n')
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.1'))
        self.assertTrue(self.state['active'])

    def test_unconfigured_private_tmp_allows_host_temp_paths(self):
        # Model Linux's TemporaryDirectory path on Windows as well. A plain
        # custom unit has PrivateTmp=no, so these are actual host files.
        self.state['path_map'] = {'/tmp/guide-fixture/guide-hub': str(self.binary),
                                  '/tmp/guide-fixture/guide.db': str(self.db)}
        self.unit.write_text('[Service]\nExecStart=/tmp/guide-fixture/guide-hub --db /tmp/guide-fixture/guide.db --listen 127.0.0.1:28080\n')
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.1'))
        self.assertTrue(self.state['active'])

    def test_private_var_tmp_database_refused(self):
        self.namespace_decoy('/var/tmp/guide.db', 'PrivateTmp=disconnected')

    def test_protect_home_tmpfs_database_refused(self):
        self.state['protect_home'] = 'tmpfs'
        self.namespace_decoy('/home/guide/guide.db', 'ProtectHome=tmpfs')

    def test_mount_and_extension_namespaces_refused(self):
        for key in ['MountImages', 'ExtensionImages', 'ExtensionDirectories']:
            with self.subTest(key=key):
                self.unit.write_text('[Service]\nExecStart=/opt/guide/guide-hub --db /var/lib/guide/guide.db --listen 127.0.0.1:28080\n'
                                     + key + '=/example\n')
                self.unchanged()
                self.assertIn('Unsupported service filesystem namespace', self.output)

    def test_backup_reserved_database_names_refused(self):
        for name in ['METADATA.json', 'failed-state']:
            with self.subTest(name=name):
                custom = self.db.parent / name
                self.db.replace(custom)
                self.db = custom
                self.state['db'] = str(custom)
                self.unit.write_text('[Service]\nExecStart="' + self.binary.as_posix() + '" --db "' + custom.as_posix() +
                                     '" --listen 127.0.0.1:28080\n')
                self.unchanged()
                self.assertIn('Database name conflicts with backup control files', self.output)

    def test_failed_start_rolls_back_binary_and_database(self):
        for suffix in ['-wal', '-shm']:
            Path(str(self.db) + suffix).write_bytes(suffix.encode())
        self.state['start_fail'] = True
        self.assertNotEqual(self.run_script(), 0, self.output)
        self.assertIn('rolled back', self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.0'))
        self.assertEqual(self.db.read_bytes(), b'user services oauth icons category cardStyle sessions')
        self.assertEqual(Path(str(self.db) + '-wal').read_bytes(), b'-wal')
        self.assertEqual(Path(str(self.db) + '-shm').read_bytes(), b'-shm')
        self.assertTrue(self.state['active'])

    def test_rollback_removes_new_sidecars_from_live_database(self):
        self.state['start_fail'] = True
        self.assertNotEqual(self.run_script(), 0, self.output)
        self.assertIn('rolled back', self.output)
        self.assertFalse(Path(str(self.db) + '-wal').exists())
        self.assertFalse(Path(str(self.db) + '-shm').exists())

    def test_rollback_failure_reports_backups(self):
        self.state.update(start_fail=True, rollback_fail=True)
        self.assertNotEqual(self.run_script(), 0, self.output)
        self.assertIn('CRITICAL', self.output)
        self.assertIn('backups', self.output)

    def test_self_update(self):
        self.updater.write_bytes(SCRIPT.read_bytes() + b'\n# outdated fixture\n')
        self.assertEqual(self.run_script(saved=True), 0, self.output)
        self.assertEqual(self.updater.read_bytes(), SCRIPT.read_bytes())
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.1'))

    def test_self_update_bad_sha(self):
        self.updater.write_bytes(SCRIPT.read_bytes() + b'\n# outdated fixture\n')
        before = self.updater.read_bytes()
        (self.release / 'install-guide.sh').write_bytes(b'corrupt')
        self.assertNotEqual(self.run_script(saved=True), 0, self.output)
        self.assertEqual(self.updater.read_bytes(), before)
        self.assertTrue(self.state['active'])

    def test_saved_outdated_updater_bad_archive_never_changes_updater(self):
        self.updater.write_bytes(SCRIPT.read_bytes() + b'\n# outdated fixture\n')
        self.make_release(attack=('../evil', tarfile.REGTYPE))
        before = self.updater.read_bytes()
        self.assertNotEqual(self.run_script(saved=True), 0, self.output)
        self.assertEqual(self.updater.read_bytes(), before)
        self.assertTrue(self.state['active'])

    def test_check_read_only_even_with_outdated_updater(self):
        self.updater.write_bytes(SCRIPT.read_bytes() + b'\n# outdated fixture\n')
        before = {p: p.read_bytes() for p in [self.updater, self.binary, self.db, self.unit]}
        self.assertEqual(self.run_script('--check', saved=True), 0, self.output)
        for p, data in before.items():
            self.assertEqual(p.read_bytes(), data)
        self.assertIn('1.0.0', self.output)
        self.assertIn('1.0.1', self.output)
        self.assertFalse((self.root / 'run/lock/guide-update.lock').exists())
        self.assertFalse(any(c[:2] == ['systemctl', 'stop'] for c in self.commands()))

    def test_non_root(self):
        self.state['uid'] = '1000'
        self.unchanged()

    def test_unsupported_arch(self):
        self.state['arch'] = 'aarch64'
        self.unchanged()

    def test_musl(self):
        self.state['libc'] = 'musl'
        self.unchanged()

    def test_no_systemd(self):
        self.state['no_systemd'] = True
        self.unchanged()

    def test_container(self):
        self.state['container'] = True
        self.unchanged()

    def test_stale_loaded_unit(self):
        self.state['stale_unit'] = True
        self.unchanged()

    def test_stop_failure_never_replaces_files(self):
        self.state['stop_fail'] = True
        self.assertNotEqual(self.run_script(), 0, self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.0'))

    def test_immediate_restart_loop_rolls_back(self):
        self.state['restart_loop'] = True
        self.assertNotEqual(self.run_script(), 0, self.output)
        self.assertIn('rolled back', self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.0.0'))

    def test_archive_executable_mode_required(self):
        archive = self.release / 'guide-linux-x86_64.tar.gz'
        content = []
        with tarfile.open(archive) as tar:
            for info in tar.getmembers():
                content.append((info, tar.extractfile(info).read()))
        with tarfile.open(archive, 'w:gz') as tar:
            for info, data in content:
                if info.name == 'guide-hub':
                    info.mode = 0o644
                tar.addfile(info, io.BytesIO(data))
        self.sums()
        self.unchanged()

    def test_checksum_sources_disagree(self):
        (self.release / 'guide-linux-x86_64.tar.gz.sha256').write_text('0' * 64 + '  guide-linux-x86_64.tar.gz\n')
        self.unchanged()

    def test_numeric_semver_comparison(self):
        self.install_existing('1.9.9')
        self.state['latest'] = '1.10.0'
        self.make_release()
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertEqual(self.binary.read_bytes(), self.hub('1.10.0'))

    def test_effective_dropin_used(self):
        self.state['dropin'] = '[Service]\nExecStart=\nExecStart=/opt/guide/guide-hub --db /var/lib/guide/guide.db --listen 127.0.0.1:29999\n'
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertTrue(any(c[0] == 'curl' and c[-1] == 'http://127.0.0.1:29999/api/public-config' for c in self.commands()))

    def test_ambiguous_systemd_expansion_refused(self):
        self.unit.write_text('[Service]\nExecStart=/opt/guide/guide-hub --db $DATABASE --listen 127.0.0.1:28080\n')
        self.unchanged()

    def test_whitespace_dropin_resolves_real_database(self):
        real_db = self.root / 'var/lib/guide/real.db'
        real_db.write_bytes(b'real user data')
        self.state['db'] = str(real_db)
        self.state['dropin'] = '[Service]\nExecStart =\nExecStart = /opt/guide/guide-hub --db /var/lib/guide/real.db --listen 127.0.0.1:29999\n'
        self.assertEqual(self.run_script(), 0, self.output)
        backups = list((real_db.parent / 'backups').glob('*/real.db'))
        self.assertEqual(len(backups), 1)
        self.assertEqual(backups[0].read_bytes(), b'real user data')

    def test_whitespace_namespace_refused(self):
        self.state['dropin'] = '[Service]\nRootDirectory = /container\n'
        self.unchanged()

    def test_temp_cleanup(self):
        self.assertEqual(self.run_script(), 0, self.output)
        self.assertFalse(list(self.root.glob('guide-update-*')))


def attack_test(attack):
    def test(self):
        self.make_release(attack=attack)
        self.unchanged()
    return test


for label, attack in {
    'traversal': ('../evil', tarfile.REGTYPE),
    'absolute': ('/evil', tarfile.REGTYPE),
    'symlink': ('link', tarfile.SYMTYPE),
    'hardlink': ('link', tarfile.LNKTYPE),
    'allowed_name_symlink': ('guide-hub', tarfile.SYMTYPE),
    'allowed_name_hardlink': ('guide-hub', tarfile.LNKTYPE),
    'fifo': ('pipe', tarfile.FIFOTYPE),
    'device': ('dev', tarfile.CHRTYPE),
    'unexpected_file': ('extra.sh', tarfile.REGTYPE),
    'directory': ('package/', tarfile.DIRTYPE),
    'duplicate': ('LICENSE', tarfile.REGTYPE),
}.items():
    setattr(UpdaterTest, 'test_archive_rejects_' + label, attack_test(attack))

if __name__ == '__main__':
    unittest.main()
