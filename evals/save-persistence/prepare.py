"""Create a fresh candidate workspace without exposing the grader or repair."""
import argparse
import shutil
import subprocess
import tempfile
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--output', type=Path)
args = parser.parse_args()
case = Path(__file__).resolve().parent
root = args.output or Path(tempfile.mkdtemp(prefix='skills-eval-'))
root.mkdir(parents=True, exist_ok=True)
app = root / 'app'
shutil.copytree(case / 'fixture', app, ignore=shutil.ignore_patterns('node_modules', 'artifacts', 'test-results', 'data.json'))
shutil.copytree(case.parents[1] / 'skills' / 'verify-changes', root / 'verify-changes')
shutil.copy(case / 'prompt.md', root / 'prompt.md')
subprocess.run(['git', 'init', '-q', str(app)], check=True)
subprocess.run(['git', '-C', str(app), 'add', '.'], check=True)
subprocess.run(['git', '-C', str(app), '-c', 'user.name=Eval Fixture', '-c', 'user.email=eval@example.invalid', 'commit', '-qm', 'Display-name saving change'], check=True)
print(root)
