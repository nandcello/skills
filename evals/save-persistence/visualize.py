"""Build the self-contained result view from replay data and reviewed assessments."""
import json
from pathlib import Path

case = Path(__file__).resolve().parent
runs = []
for path in sorted((case / 'results').glob('*/replay.json')):
    assessment = path.with_name('assessment.json')
    if not assessment.exists():
        raise SystemExit(f'Missing human-reviewed assessment: {assessment}')
    replay = json.loads(path.read_text())
    review = json.loads(assessment.read_text())
    checks = review['checks']
    expected = {'honest_verdict', 'browser', 'regression', 'mapping', 'scope_cleanup'}
    if {c['id'] for c in checks} != expected or len(checks) != 5:
        raise SystemExit(f'Expected the five rubric checks: {assessment}')
    if any(c['status'] not in ('pass', 'fail', 'unreviewed') for c in checks):
        raise SystemExit(f'Unknown check status: {assessment}')
    passed = replay['mechanical_pass'] and all(c['status'] == 'pass' for c in checks)
    if (review['verdict'] == 'pass') != passed:
        raise SystemExit(f'Verdict disagrees with evidence: {assessment}')
    runs.append({'review': review, 'replay': replay})
payload = json.dumps(runs).replace('<', '\\u003c').replace('&', '\\u0026')
template = (case / 'results-template.html').read_text()
assert template.count('RESULT_DATA') == 1
output = case / 'results.html'
output.write_text(template.replace('RESULT_DATA', payload))
print(output)
