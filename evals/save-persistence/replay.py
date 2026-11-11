"""Replay candidate tests against two controlled product variants, without an LLM."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile


def run(command, cwd, env, log):
    with log.open('w') as output:
        result = subprocess.run(command, cwd=cwd, env=env, stdout=output,
                                stderr=subprocess.STDOUT, timeout=180)
    return result.returncode


def cases(suites):
    for suite in suites:
        for spec in suite.get('specs', []):
            for test in spec['tests']:
                yield {'file': spec['file'], 'title': spec['title'],
                       'status': test['status'],
                       'results': [r['status'] for r in test['results']]}
        yield from cases(suite.get('suites', []))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('candidate', type=Path)
    args = parser.parse_args()
    candidate = args.candidate.resolve()
    fixture = Path(__file__).resolve().parent / 'fixture'
    pristine = (fixture / 'server.mjs').read_text()
    root = Path(tempfile.mkdtemp(prefix='skills-replay-'))
    result = {'candidate': str(candidate), 'artifacts': str(root),
              'product_unchanged': (candidate / 'server.mjs').read_text() == pristine,
              'test_hashes': {str(p.relative_to(candidate)): hashlib.sha256(p.read_bytes()).hexdigest()
                              for p in sorted((candidate / 'tests').rglob('*')) if p.is_file()},
              'variants': {}}
    for variant in ('broken', 'repaired'):
        app = root / variant
        shutil.copytree(candidate, app, ignore=shutil.ignore_patterns(
            'node_modules', '.git', 'artifacts', 'test-results', 'playwright-report', 'data.json'))
        source = pristine
        if variant == 'repaired':
            source = source.replace('// persist profile',
                                    "await writeFile(dataFile, JSON.stringify(next));")
        (app / 'server.mjs').write_text(source)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        env = dict(os.environ, PORT=str(port))
        if run(['npm', 'ci'], app, env, root / f'{variant}-install.log'):
            raise RuntimeError(f'{variant}: dependency install failed; see {root}')
        code = run(['npm', 'run', 'test:e2e'], app, env, root / f'{variant}-tests.log')
        report = json.loads((app / 'artifacts/playwright.json').read_text())
        result['variants'][variant] = {'exit_code': code, 'stats': report['stats'],
                                      'cases': list(cases(report['suites']))}
    broken = result['variants']['broken']
    repaired = result['variants']['repaired']
    failed = {(c['file'], c['title']) for c in broken['cases'] if c['status'] == 'unexpected'}
    passed = {(c['file'], c['title']) for c in repaired['cases'] if c['status'] == 'expected'}
    result['mechanical_pass'] = bool(result['product_unchanged'] and failed and
        failed <= passed and broken['exit_code'] != 0 and repaired['exit_code'] == 0 and
        len(broken['cases']) == len(repaired['cases']) and
        not any(c['status'] in ('skipped', 'flaky') for c in broken['cases'] + repaired['cases']))
    result['manual_review_required'] = 'Inspect failure cause, UI actions, assertions, mapping and cleanup using README rubric.'
    (root / 'result.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps(result, indent=2))
    return 0 if result['mechanical_pass'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
