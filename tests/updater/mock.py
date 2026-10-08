"""PATH command doubles and filesystem sandbox; never imported by production."""
import hashlib
import json
import os
import pathlib
import shutil
import subprocess
import sys
import time
import types

ROOT = pathlib.Path(os.environ['GUIDE_TEST_ROOT'])
STATE = ROOT / 'state.json'
state = json.loads(STATE.read_text())
command, *args = sys.argv[1:]
with (ROOT / 'commands.jsonl').open('a') as out:
    out.write(json.dumps([command, *args]) + '\n')


def save():
    STATE.write_text(json.dumps(state))


if command == 'python3':
    # Run exactly the heredoc supplied by the real shell entry point. Only
    # standard deployment paths are virtualized; no production switch exists.
    source = sys.stdin.read()
    base = type(pathlib.Path())

    def mapped(parts):
        if parts:
            value = str(parts[0]).replace('\\', '/')
            if value in state.get('path_map', {}):
                return (state['path_map'][value], *parts[1:])
            roots = ('/opt', '/var/lib', '/etc', '/usr/local', '/run', '/proc', '/.dockerenv')
            if any(value == p or value.startswith(p + '/') for p in roots):
                parts = (str(ROOT / value.lstrip('/')), *parts[1:])
        return parts

    class SandboxPath(base):
        def __new__(cls, *parts):
            return super().__new__(cls, *mapped(parts))

        def __init__(self, *parts):
            if sys.version_info >= (3, 12):
                super().__init__(*mapped(parts))

        def stat(self, **kwargs):
            value = list(super().stat(**kwargs))
            value[4] = value[5] = 0  # Root/ownership is a platform boundary double.
            if os.name == 'nt' and str(self) in modes:
                value[0] = (value[0] & ~0o7777) | modes[str(self)]
            return os.stat_result(value)

        if os.name == 'nt':
            def chmod(self, mode, **kwargs):
                super().chmod(mode, **kwargs)
                modes[str(self)] = mode

            def mkdir(self, mode=0o777, **kwargs):
                existed = self.exists()
                super().mkdir(mode, **kwargs)
                if not existed:
                    modes[str(self)] = mode

    modes = {}

    replacement = types.ModuleType('pathlib')
    replacement.__dict__.update(pathlib.__dict__)
    replacement.Path = SandboxPath
    sys.modules['pathlib'] = replacement
    # Waits are covered by state transitions in systemctl; wall-clock waiting
    # buys nothing in a deterministic unit suite.
    time.sleep = lambda _: None
    real_run = subprocess.run

    def fixture_run(argv, **kwargs):
        if pathlib.Path(argv[0]).name == 'guide-hub':
            version = pathlib.Path(argv[0]).read_bytes()[20:].decode()
            argv = [sys.executable, __file__, 'fixture-hub', version, *argv[1:]]
        elif (ROOT / 'mock-bin' / str(argv[0])).is_file():
            argv = [sys.executable, __file__, *argv]
        elif argv[0] == 'sh':
            argv = [os.environ.get('GUIDE_TEST_SH', 'sh'), *argv[1:]]
        return real_run(argv, **kwargs)

    subprocess.run = fixture_run
    real_which = shutil.which
    shutil.which = lambda cmd: (os.environ.get('GUIDE_TEST_SH', real_which(cmd)) if cmd == 'sh'
                               else str(ROOT / 'mock-bin' / cmd) if (ROOT / 'mock-bin' / cmd).exists() else real_which(cmd))
    os.chown = lambda *a, **k: None

    def fixture_exec(executable, argv):
        env = os.environ.copy()
        sys.exit(real_run([env.get('GUIDE_TEST_SH', 'sh'), *argv[1:]], env=env).returncode)

    os.execv = fixture_exec
    sys.argv = ['-', *args[1:]]
    exec(compile(source, args[1], 'exec'), {'__name__': '__main__'})
elif command == 'uname':
    print(state.get('os', 'Linux') if '-s' in args else state.get('arch', 'x86_64'))
elif command == 'id':
    print(state.get('uid', '0') if args == ['-u'] else '1001')
elif command == 'getconf':
    print(state.get('libc', 'glibc 2.35'))
elif command == 'systemd-detect-virt':
    sys.exit(1 if not state.get('container') else 0)
elif command == 'useradd':
    pass
elif command == 'runuser':
    db = pathlib.Path(args[args.index('--db') + 1])
    db.write_bytes(b'initialized argon2id fixture')
    print('Emergency password: fixture-random-password')
elif command == 'curl':
    url = args[-1]
    if url.startswith('http://'):
        sys.exit(22 if state.get('http_fail') else 0)
    assert url.startswith('https://github.com/NSJLUCAS/Guide/releases/'), url
    name = url.rsplit('/', 1)[-1]
    if state.get('network_fail') == name or (state.get('latest_fail') and '/latest/' in url):
        sys.exit(22)
    if '-fsSI' in args:
        print('HTTP/2 302\r\nlocation: https://github.com/NSJLUCAS/Guide/releases/download/v' + state['latest'] + '/' + name + '\r\n')
    if '-o' in args and args[args.index('-o') + 1] != os.devnull:
        shutil.copyfile(ROOT / 'release' / name, args[args.index('-o') + 1])
elif command == 'systemctl':
    if state.get('no_systemd'):
        sys.exit(1)
    if args[0] == '--version':
        print('systemd 249')
    elif args[0] == 'cat':
        if not state.get('service', True):
            sys.exit(1)
        print((ROOT / 'etc/systemd/system/guide.service').read_text())
        print(state.get('dropin', ''))
    elif args[0] == 'show':
        prop = next(a.split('=', 1)[1] for a in args if a.startswith('--property='))
        values = {'LoadState': 'loaded' if state.get('service', True) else 'not-found',
                  'NeedDaemonReload': 'yes' if state.get('stale_unit') else 'no',
                  'PrivateTmp': state.get('private_tmp', 'no'),
                  'ProtectHome': state.get('protect_home', 'no'),
                  'ActiveState': 'active' if state.get('active') else 'inactive',
                  'SubState': 'running' if state.get('active') else 'dead',
                  'MainPID': '1234' if state.get('active') else '0',
                  'NRestarts': str(state.get('restarts', 0))}
        print(values[prop])
    elif args[0] == 'is-active':
        sys.exit(0 if state.get('active') else 3)
    elif args[0] == 'stop':
        if state.get('stop_fail'):
            sys.exit(1)
        state['active'] = False
        save()
    elif args[0] == 'start':
        if state.get('rollback_fail') and state.get('starts', 0):
            sys.exit(1)
        state['starts'] = state.get('starts', 0) + 1
        if state.get('start_fail') and state['starts'] == 1:
            # Simulate a migration that has already changed DB and sidecars.
            db = pathlib.Path(state['db'])
            db.write_bytes(b'migrated then crashed')
            pathlib.Path(str(db) + '-wal').write_bytes(b'new wal')
            pathlib.Path(str(db) + '-shm').write_bytes(b'new shm')
            save()
            sys.exit(1)
        state['active'] = True
        if state.get('restart_loop') and state['starts'] == 1:
            state['restarts'] = state.get('restarts', 0) + 1
        save()
    elif args[0] in ('daemon-reload', 'enable'):
        state['service'] = True
        save()
    else:
        raise AssertionError(args)
elif command == 'fixture-hub':
    version = args.pop(0)
    if args == ['--version'] and version == '1.0.0':
        sys.exit(1)  # Published v1.0.0 only has --help.
    if args in (['--version'], ['--help']):
        print('guide-hub ' + version)
    else:
        raise AssertionError(args)
else:
    raise AssertionError(command)
