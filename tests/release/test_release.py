"""Release verifier rejects corrupt or surplus publish assets."""
import importlib.util
from pathlib import Path
import unittest
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'updater'))
import test_updater as fixture


class ReleaseTest(unittest.TestCase):
    setUp = fixture.UpdaterTest.setUp
    hub = fixture.UpdaterTest.hub
    install_existing = fixture.UpdaterTest.install_existing
    make_release = fixture.UpdaterTest.make_release
    sums = fixture.UpdaterTest.sums
    def verifier(self):
        file = Path(__file__).resolve().parents[2] / 'scripts/verify-release.py'
        self.assertTrue(file.exists(), 'release verifier is not implemented')
        spec = importlib.util.spec_from_file_location('verify_release', file)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod

    def test_release_valid(self):
        self.verifier().verify(self.release)

    def test_release_corrupt_installer(self):
        (self.release / 'install-guide.sh').write_bytes(b'corrupt')
        with self.assertRaises(Exception):
            self.verifier().verify(self.release)

    def test_release_checksum_sources_disagree(self):
        (self.release / 'guide-linux-x86_64.tar.gz.sha256').write_text('0' * 64 + '  guide-linux-x86_64.tar.gz\n')
        with self.assertRaises(Exception):
            self.verifier().verify(self.release)

    def test_release_surplus_asset(self):
        (self.release / 'unexpected.bin').write_bytes(b'bad')
        with self.assertRaises(Exception):
            self.verifier().verify(self.release)


if __name__ == '__main__':
    unittest.main()
