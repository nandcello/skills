from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        for directory in ['skills', 'scripts', 'shared']:
            shutil.copytree(ROOT / directory, self.root / directory)

    def run_check(self):
        return subprocess.run([sys.executable, str(self.root / 'scripts/validate_skills.py')],
                              capture_output=True, text=True)

    def test_missing_nested_reference_fails(self):
        (self.root / 'skills/setup-verification/assets/app-flows.example.json').unlink()
        result = self.run_check()
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Broken reference', result.stderr)

    def test_shared_change_requires_regeneration(self):
        source = self.root / 'shared/flow-contract.md'
        source.write_text(source.read_text() + '\nA new shared rule.\n')
        self.assertNotEqual(self.run_check().returncode, 0)
        subprocess.run([sys.executable, str(self.root / 'scripts/sync_shared.py')], check=True)
        self.assertEqual(self.run_check().returncode, 0)

    def test_additional_skill_is_discovered(self):
        folder = self.root / 'skills/example-skill'
        shutil.copytree(self.root / 'skills/verify-changes', folder)
        for path in [folder / 'SKILL.md', folder / 'agents/openai.yaml']:
            path.write_text(path.read_text().replace('verify-changes', 'example-skill'))
        result = self.run_check()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('Valid skill: example-skill', result.stdout)

    def test_implicit_policy_is_rejected(self):
        path = self.root / 'skills/verify-changes/agents/openai.yaml'
        path.write_text(path.read_text().replace('allow_implicit_invocation: false', 'allow_implicit_invocation: true'))
        self.assertNotEqual(self.run_check().returncode, 0)


if __name__ == '__main__':
    unittest.main()
