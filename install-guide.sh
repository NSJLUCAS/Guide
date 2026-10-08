#!/bin/sh
# Official Guide installer/updater. Requires Python 3.8+, curl and systemd.
# The saved copy at /usr/local/sbin/guide-update is the same verified asset.
set -eu
command -v python3 >/dev/null 2>&1 || { echo 'Guide requires Python 3.8+' >&2; exit 1; }
exec python3 - "$0" "$@" <<'GUIDE_PYTHON'
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import shutil
import signal
import stat
import subprocess
import sys
import tarfile
import tempfile
import time
import uuid

REPO = 'https://github.com/NSJLUCAS/Guide/releases'
ASSET = 'guide-linux-x86_64.tar.gz'
UPDATER = Path('/usr/local/sbin/guide-update')
BINARY = Path('/opt/guide/guide-hub')
DATABASE = Path('/var/lib/guide/guide.db')
UNIT = Path('/etc/systemd/system/guide.service')
ALLOW = {'guide-hub', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'THIRD_PARTY_LICENSES.md',
         'INSTALL.md', 'AUTH_RECOVERY.md', 'guide.service'}
SEMVER = r'(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)'
UNIT_TEXT = '''[Unit]
Description=Guide navigation hub
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=guide
Group=guide
WorkingDirectory=/opt/guide
ExecStart=/opt/guide/guide-hub --listen 127.0.0.1:28080 --db /var/lib/guide/guide.db
Restart=on-failure
RestartSec=5
ReadWritePaths=/var/lib/guide
NoNewPrivileges=yes
RestrictSUIDSGID=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
PrivateDevices=yes
RestrictAddressFamilies=AF_INET AF_INET6

[Install]
WantedBy=multi-user.target
'''


class Failure(Exception):
    pass


def fresh_paths():
    return [UNIT, BINARY, DATABASE, Path(str(DATABASE) + '-wal'), Path(str(DATABASE) + '-shm'), UPDATER]


def require(ok, message):
    if not ok:
        raise Failure(message)


def run(args, checked=True, timeout=30):
    result = subprocess.run([str(a) for a in args], capture_output=True, text=True, timeout=timeout)
    if checked:
        # Never forward command stderr: a service/CLI could include secrets.
        require(result.returncode == 0, 'Command failed: ' + Path(args[0]).name)
    return result


def prop(name):
    return run(['systemctl', 'show', 'guide.service', '--property=' + name, '--value']).stdout.strip()


def platform_check():
    require(sys.version_info >= (3, 8), 'Python 3.8+ is required')
    require(run(['id', '-u']).stdout.strip() == '0', 'Run as root (sudo)')
    require(run(['uname', '-s']).stdout.strip() == 'Linux', 'Only Linux is supported')
    require(run(['uname', '-m']).stdout.strip() == 'x86_64', 'Only x86_64 is supported')
    require(run(['getconf', 'GNU_LIBC_VERSION']).stdout.strip().startswith('glibc '), 'GNU/glibc is required; no Alpine/musl')
    for name in ['curl', 'systemctl', 'systemd-detect-virt', 'sh', 'runuser', 'id', 'useradd']:
        require(shutil.which(name), 'Missing required command: ' + name)
    require(run(['systemd-detect-virt', '--container', '--quiet'], checked=False).returncode == 1,
            'Containers/Docker are not supported')
    run(['systemctl', '--version'])
    # A show query also proves the systemd manager is reachable (not just installed).
    prop('LoadState')


def safe_path(path, existing=False):
    require(path.is_absolute(), 'An absolute path is required')
    require('..' not in path.parts, 'Parent path components are not supported')
    for part in [path, *path.parents]:
        require(not part.is_symlink(), 'Symlinked installation/data paths are not supported')
    if existing:
        require(path.is_file() and path.stat().st_nlink == 1, 'Missing or non-regular file: ' + str(path))


def refuse_unrecognized_deployment():
    # Do not guess the data path of a deployment outside guide.service. A
    # recognizable process or loaded unit makes first-install ambiguous.
    for process in Path('/proc').iterdir():
        if not process.name.isdigit():
            continue
        try:
            name = (process / 'comm').read_text(encoding='utf-8', errors='replace').strip()
        except FileNotFoundError:
            continue  # Process exited during this read-only inspection.
        require(name != 'guide-hub', 'Existing Guide process outside guide.service; manual migration required')
    units = run(['systemctl', 'list-units', '--all', '--type=service', '--no-legend', '--plain', '--no-pager'])
    for line in units.stdout.splitlines():
        fields = line.split()
        if not fields or fields[0] == 'guide.service' or not fields[0].endswith('.service'):
            continue
        command = run(['systemctl', 'show', fields[0], '--property=ExecStart', '--value']).stdout
        require(re.search(r'[/=\s]guide-hub(?:[\s;}]|$)', command) is None,
                'Guide uses a different loaded service; manual migration required')


def installed():
    loaded = prop('LoadState')
    if loaded == 'not-found':
        require(not any(p.exists() or p.is_symlink() for p in fresh_paths()),
                'guide.service is missing but installation/data remains; refusing to guess')
        refuse_unrecognized_deployment()
        return None
    require(loaded == 'loaded', 'guide.service cannot be loaded')
    require(prop('NeedDaemonReload') == 'no', 'Unit changed on disk; run daemon-reload and review the active configuration first')
    text = run(['systemctl', 'cat', 'guide.service']).stdout
    section, starts = '', []
    for raw in text.splitlines():
        line = raw.strip()
        if not line or line.startswith(('#', ';')):
            continue
        if line.startswith('['):
            section = line
            continue
        key, sep, value = line.partition('=')
        if section == '[Service]' and sep and key.strip() == 'ExecStart':
            value = value.strip()
            if value:
                starts.append(value)
            else:
                starts = []
    require(len(starts) == 1, 'Cannot determine one effective ExecStart')
    line = starts[0]
    # systemd is not a shell. Reject transformations rather than misinterpreting
    # variables, C escapes, specifiers, prefixes or line continuations.
    require(not any(c in line for c in '\\$%\r\n'), 'Unsupported systemd ExecStart expansion/escape')
    words = shlex.split(line)
    require(words and Path(words[0]).is_absolute() and Path(words[0]).name == 'guide-hub',
            'ExecStart must directly execute an absolute guide-hub path')
    values = {}
    require(len(words) % 2 == 1, 'Ambiguous ExecStart arguments')
    for flag, value in zip(words[1::2], words[2::2]):
        require(flag in ['--db', '--listen', '--site', '--themes'] and flag not in values,
                'Unsupported or duplicate ExecStart argument')
        require(value and not any(ord(c) < 32 for c in value), 'Invalid ExecStart value')
        values[flag] = value
    require('--db' in values and '--listen' in values, 'ExecStart must explicitly provide --db and --listen')
    paths = [PurePosixPath(words[0]), PurePosixPath(values['--db'])]
    for property_name, roots, hidden in [
        ('PrivateTmp', ['/tmp', '/var/tmp'], {'yes', 'true', '1', 'disconnected'}),
        ('ProtectHome', ['/home', '/root', '/run/user'], {'yes', 'true', '1', 'tmpfs'}),
    ]:
        if prop(property_name).lower() in hidden:
            require(not any(PurePosixPath(root) == path or PurePosixPath(root) in path.parents
                            for root in roots for path in paths),
                    'Unsupported private service filesystem path: ' + property_name)
    binary, db = Path(words[0]), Path(values['--db'])
    require(db.name not in {'METADATA.json', 'failed-state', 'backups'}, 'Database name conflicts with backup control files')
    safe_path(binary, True)
    safe_path(db, True)
    # Namespace remapping would make even an absolute --db ambiguous.
    for raw in text.splitlines():
        key, sep, value = raw.strip().partition('=')
        if sep and key.strip() in ['RootDirectory', 'RootImage', 'BindPaths', 'BindReadOnlyPaths',
                                  'TemporaryFileSystem', 'MountImages', 'ExtensionImages', 'ExtensionDirectories']:
            require(not value.strip(), 'Unsupported service filesystem namespace')
    return binary, db, values['--listen']


def version(binary):
    for option in ['--version', '--help']:
        result = run([binary, option], checked=False, timeout=10)
        first = result.stdout.splitlines()
        match = re.fullmatch('guide-hub ' + SEMVER, first[0]) if first else None
        if result.returncode == 0 and match:
            return tuple(int(x) for x in match.groups())
    raise Failure('Cannot reliably determine guide-hub version')


def fmt(value):
    return '.'.join(map(str, value))


def fetch(url, path):
    run(['curl', '-fsSL', '--proto', '=https', '--proto-redir', '=https',
         '--connect-timeout', '15', '--max-time', '180', '-o', path, url], timeout=190)


def latest():
    # Do not follow to release-assets.githubusercontent.com: only the first
    # GitHub redirect contains the stable tag. Pin all later downloads to it.
    headers = run(['curl', '-fsSI', '--proto', '=https', '--connect-timeout', '15',
                   '--max-time', '45', REPO + '/latest/download/' + ASSET], timeout=55).stdout
    locations = re.findall(r'^location:\s*([^\r\n]+)', headers, re.I | re.M)
    require(len(locations) == 1, 'Cannot determine the GitHub latest redirect')
    url = locations[0].strip()
    match = re.fullmatch(re.escape(REPO) + '/download/v' + SEMVER + '/' + re.escape(ASSET), url)
    require(match is not None, 'Cannot determine a stable latest Guide Release tag')
    return tuple(int(x) for x in match.groups())


def manifest(path, expected):
    result = {}
    for line in path.read_text(encoding='ascii').splitlines():
        match = re.fullmatch(r'([a-fA-F0-9]{64}) [ *]([A-Za-z0-9_.-]+)', line)
        require(match is not None, 'Malformed SHA-256 manifest')
        digest, name = match.groups()
        require(name in expected and name not in result, 'Unexpected or duplicate checksum entry')
        result[name] = digest.lower()
    require(set(result) == set(expected), 'Missing checksum entry')
    return result


def digest(path):
    with path.open('rb') as src:
        sha = hashlib.sha256()
        for block in iter(lambda: src.read(1024 * 1024), b''):
            sha.update(block)
    return sha.hexdigest()


def unpack(archive, dest):
    dest.mkdir()
    with tarfile.open(archive, 'r:gz') as tar:
        members = tar.getmembers()
        require(len(members) == len(ALLOW), 'Unexpected archive member count')
        seen = set()
        for member in members:
            require(member.name in ALLOW and member.name not in seen, 'Unsafe or unexpected archive path')
            require(member.isreg() and not member.issparse() and not member.linkname,
                    'Archive must contain only ordinary regular files')
            require(0 < member.size <= 256 * 1024 * 1024, 'Invalid archive file size')
            require(not member.mode & 0o7000, 'Unsafe archive permission bits')
            require(member.name != 'guide-hub' or member.mode & 0o111, 'guide-hub must be executable')
            require(member.name == 'guide-hub' or not member.mode & 0o111, 'Unexpected executable in archive')
            seen.add(member.name)
        require(seen == ALLOW, 'Incomplete archive')
        for member in members:
            # Copy bytes only; never apply tar owner, mode, links or paths.
            with tar.extractfile(member) as src, (dest / member.name).open('xb') as out:
                shutil.copyfileobj(src, out)
    binary = dest / 'guide-hub'
    with binary.open('rb') as src:
        header = src.read(20)
    require(len(header) == 20 and header[:7] == b'\x7fELF\x02\x01\x01' and header[18:20] == b'\x3e\x00',
            'Release guide-hub is not a Linux x86_64 ELF candidate')
    binary.chmod(0o755)
    return binary


def prepare(base, temp, checks, target):
    archive, standalone, installer = temp / ASSET, temp / (ASSET + '.sha256'), temp / 'install-guide.sh'
    for path in [archive, standalone, installer]:
        fetch(base + path.name, path)
    require(manifest(standalone, {ASSET})[ASSET] == checks[ASSET], 'Release checksum sources disagree')
    require(digest(archive) == checks[ASSET], 'Archive SHA-256 mismatch')
    require(digest(installer) == checks[installer.name], 'Installer SHA-256 mismatch')
    run(['sh', '-n', installer])
    candidate = unpack(archive, temp / 'package')
    require(version(candidate) == target, 'Candidate version does not match Release tag')
    return candidate, installer


def atomic_copy(source, target, mode=0o755, ownership=None):
    safe_path(target)
    target.parent.mkdir(parents=True, exist_ok=True)
    temporary = target.parent / ('.' + target.name + '-' + uuid.uuid4().hex)
    try:
        with source.open('rb') as src, temporary.open('xb') as out:
            shutil.copyfileobj(src, out)
            out.flush()
            os.fsync(out.fileno())
        temporary.chmod(mode)
        if ownership:
            os.chown(temporary, *ownership)
        os.replace(temporary, target)
    finally:
        if temporary.exists():
            temporary.unlink()


def stopped():
    run(['systemctl', 'stop', 'guide.service'])
    require(prop('ActiveState') in ['inactive', 'failed'] and prop('MainPID') == '0',
            'Service has not stopped; refusing database copy/restore')


def healthy(binary, expected, listen, baseline=None):
    if baseline is None:
        baseline = prop('NRestarts')
    pid = None
    for _ in range(3):
        time.sleep(2)
        run(['systemctl', 'is-active', '--quiet', 'guide.service'])
        current = prop('MainPID')
        require(current.isdigit() and current != '0' and (pid is None or pid == current), 'Guide process exited/restarted')
        require(prop('SubState') == 'running' and prop('NRestarts') == baseline, 'Guide is restarting')
        pid = current
    require(version(binary) == expected, 'Installed version does not match Release')
    if re.fullmatch(r'127\.0\.0\.1:[0-9]+|\[::1\]:[0-9]+', listen):
        run(['curl', '-fsS', '--noproxy', '*', '--connect-timeout', '2', '--max-time', '5',
             '-o', os.devnull, 'http://' + listen + '/api/public-config'], timeout=10)


def unique_backup(parent):
    safe_path(parent)
    parent.mkdir(mode=0o700, parents=True, exist_ok=True)
    require(parent.stat().st_uid == 0 and not parent.stat().st_mode & 0o077,
            'Backup directory must be root-owned and private: ' + str(parent))
    path = parent / (time.strftime('%Y%m%dT%H%M%SZ', time.gmtime()) + '-' + uuid.uuid4().hex[:8])
    path.mkdir(mode=0o700)
    return path


def snapshot(db, backup):
    metadata = {}
    for suffix in ['', '-wal', '-shm']:
        path = Path(str(db) + suffix)
        if path.exists() or path.is_symlink():
            safe_path(path, True)
            info = path.stat()
            shutil.copyfile(path, backup / path.name)
            (backup / path.name).chmod(0o600)
            metadata[suffix] = (stat.S_IMODE(info.st_mode), info.st_uid, info.st_gid)
    require('' in metadata, 'Database disappeared before backup')
    return metadata


def upgrade(binary, db, listen, candidate, installer, current, target):
    db_backup = binary_backup = None
    old_meta = metadata = None
    stop_started = replaced = False
    try:
        # Pre-create only protected backup directories. Network/validation has
        # finished; no live database is copied until systemd is stopped.
        db_backup = unique_backup(db.parent / 'backups')
        binary_backup = unique_backup(binary.parent / 'backups')
        stop_started = True
        stopped()
        metadata = snapshot(db, db_backup)
        (db_backup / 'METADATA.json').write_text(json.dumps({'database': str(db), 'version': fmt(current),
                                                          'files': metadata}, indent=2) + '\n')
        info = binary.stat()
        old_meta = (stat.S_IMODE(info.st_mode), info.st_uid, info.st_gid)
        shutil.copyfile(binary, binary_backup / 'guide-hub')
        (binary_backup / 'guide-hub').chmod(0o700)
        (binary_backup / 'INFO.txt').write_text('Version: ' + fmt(current) + '\nBinary: ' + str(binary) + '\nDB snapshot: ' + str(db_backup) + '\n')
        replaced = True
        atomic_copy(candidate, binary)
        baseline = prop('NRestarts')
        run(['systemctl', 'start', 'guide.service'])
        healthy(binary, target, listen, baseline)
        atomic_copy(installer, UPDATER)
        print('Guide upgraded to ' + fmt(target) + '. DB backup: ' + str(db_backup))
    except BaseException as error:
        if not stop_started:
            raise
        try:
            if replaced:
                stopped()
                failed = unique_backup(db_backup / 'failed-state')
                for suffix in ['', '-wal', '-shm']:
                    path = Path(str(db) + suffix)
                    safe_path(path)
                    if path.exists():
                        require(path.is_file(), 'Failed database state is not a regular file')
                        path.replace(failed / path.name)
                for suffix, (mode, uid, gid) in metadata.items():
                    path = Path(str(db) + suffix)
                    atomic_copy(db_backup / path.name, path, mode, (uid, gid))
                mode, uid, gid = old_meta
                atomic_copy(binary_backup / 'guide-hub', binary, mode, (uid, gid))
            # Backup/stop failure before replacement also restarts the old hub.
            baseline = prop('NRestarts')
            run(['systemctl', 'start', 'guide.service'])
            healthy(binary, current, listen, baseline)
        except BaseException:
            status = run(['systemctl', 'show', 'guide.service', '--property=ActiveState', '--value'], checked=False).stdout.strip()
            raise Failure('CRITICAL: rollback failed. Binary backup: ' + str(binary_backup) +
                          '; DB backup: ' + str(db_backup) + '; service: ' + status) from None
        raise Failure('Upgrade failed; rolled back to ' + fmt(current) + '. DB backup: ' + str(db_backup)) from error


def fresh(candidate, installer, target):
    for path in fresh_paths():
        safe_path(path)
        require(not path.exists(), 'Existing installation state; refusing first install')
    account = run(['id', '-u', 'guide'], checked=False)
    if account.returncode:
        run(['useradd', '--system', '--user-group', '--home-dir', '/var/lib/guide', '--no-create-home', '--shell', '/usr/sbin/nologin', 'guide'])
    uid = int(run(['id', '-u', 'guide']).stdout.strip())
    gid = int(run(['id', '-g', 'guide']).stdout.strip())
    BINARY.parent.mkdir(mode=0o755, parents=True, exist_ok=True)
    BINARY.parent.chmod(0o755)
    DATABASE.parent.mkdir(mode=0o750, parents=True, exist_ok=True)
    os.chown(DATABASE.parent, uid, gid)
    atomic_copy(candidate, BINARY)
    with DATABASE.open('xb'):
        pass
    DATABASE.chmod(0o600)
    os.chown(DATABASE, uid, gid)
    # Existing CLI creates schema/hash on this owned empty DB, without a server.
    result = run(['runuser', '-u', 'guide', '--', BINARY, '--db', DATABASE, '--reset-password'])
    passwords = re.findall(r'^Emergency password: ([^\r\n]+)$', result.stdout, re.M)
    require(len(passwords) == 1, 'Emergency password initialization did not return one password')
    UNIT.parent.mkdir(parents=True, exist_ok=True)
    UNIT.write_text(UNIT_TEXT)
    UNIT.chmod(0o644)
    atomic_copy(installer, UPDATER)
    try:
        run(['systemctl', 'daemon-reload'])
        run(['systemctl', 'enable', 'guide.service'])
        baseline = prop('NRestarts')
        run(['systemctl', 'start', 'guide.service'])
        healthy(BINARY, target, '127.0.0.1:28080', baseline)
    except BaseException:
        run(['systemctl', 'stop', 'guide.service'], checked=False)
        raise Failure('First install health check failed; protected DB retained. Review guide.service and use the documented --reset-password recovery.') from None
    print('Guide installed at 127.0.0.1:28080. Configure an HTTPS Nginx/Caddy/Cloudflare Tunnel proxy.')
    print('Emergency password: ' + passwords[0])
    print('Sign in at /admin and change it immediately. Update: sudo guide-update')


def main():
    args = sys.argv[2:]
    require(args in [[], ['--check'], ['--help']], 'Usage: guide-update [--check | --help]')
    if args == ['--help']:
        print('Usage: guide-update [--check | --help]\nNo flags: install or upgrade stable Guide. --check: read-only version check.\nLinux x86_64 GNU + systemd only. Requires root, Python 3.8+ and curl.')
        return
    platform_check()
    state = installed()
    current = version(state[0]) if state else None
    target = latest()
    print('Current: ' + (fmt(current) if current else 'not installed') + '; latest: ' + fmt(target))
    if args == ['--check']:
        print('Update available' if current is None or current < target else 'Current is newer; no downgrade' if current > target else 'Guide is already up to date')
        return
    self_path = Path(sys.argv[1]).absolute()
    if self_path != UPDATER and current is not None and current >= target:
        # Published v1.0.0 has no installer manifest. A temporary installer
        # already at latest needs no assets and must still succeed.
        print('Current version is newer; automatic downgrade refused' if current > target else 'Guide is already up to date')
        return
    lock = Path('/run/lock/guide-update.lock')
    safe_path(lock)
    lock.parent.mkdir(parents=True, exist_ok=True)
    try:
        lock.mkdir(mode=0o700)
    except FileExistsError:
        raise Failure('Another updater is running (or an interrupted lock remains at ' + str(lock) + ')') from None
    restart_self = False
    try:
        require(installed() == state, 'Installation changed before acquiring the updater lock')
        if state:
            current = version(state[0])
        with tempfile.TemporaryDirectory(prefix='guide-update-') as temp:
            temp = Path(temp)
            base = REPO + '/download/v' + fmt(target) + '/'
            sums = temp / 'sha256sums.txt'
            fetch(base + sums.name, sums)
            checks = manifest(sums, {ASSET, 'install-guide.sh'})
            installer = temp / 'install-guide.sh'
            if self_path == UPDATER and digest(self_path) != checks['install-guide.sh']:
                if current is None or current < target:
                    # A failed Hub preflight must leave even an outdated updater
                    # unchanged. New logic executes only after all asset checks.
                    prepare(base, temp, checks, target)
                else:
                    fetch(base + installer.name, installer)
                    require(digest(installer) == checks[installer.name], 'Installer SHA-256 mismatch; self-update refused')
                    run(['sh', '-n', installer])
                atomic_copy(installer, UPDATER)
                restart_self = True
            elif current is not None and current >= target:
                print('Current version is newer; automatic downgrade refused' if current > target else 'Guide is already up to date')
            else:
                candidate, installer = prepare(base, temp, checks, target)
                # Detect unit/path changes while downloading before stopping.
                require(installed() == state, 'Installation changed while preparing the update')
                if state:
                    upgrade(*state, candidate, installer, current, target)
                else:
                    fresh(candidate, installer, target)
    finally:
        lock.rmdir()
    if restart_self:
        print('Updater verified and updated; continuing.', flush=True)
        os.execv('/bin/sh', ['sh', str(UPDATER), *args])


def interrupted(signum, frame):
    raise Failure('Update interrupted by signal ' + str(signum))


if __name__ == '__main__':
    os.umask(0o077)
    signal.signal(signal.SIGTERM, interrupted)
    signal.signal(signal.SIGINT, interrupted)
    try:
        main()
    except (Failure, OSError, ValueError, tarfile.TarError, subprocess.SubprocessError) as error:
        # Never print subprocess output, database contents or credential values.
        print('Guide: ' + str(error), file=sys.stderr)
        sys.exit(1)
GUIDE_PYTHON
