# First trial: passed

One independent Codex/gpt-6-astra high run using a fresh context and the supplied
prompt. The evaluator received only the disposable app and skill snapshot; it
was not given the planted defect or repair. Skill revision and entrypoint hash,
test hashes, environment and replay results are in [replay.json](replay.json).

The agent reported **failed** for the application: Save showed success but both
GET and reload returned the original name. Agent-browser action logs proved
the interactive journey. Initial Chromium sandbox launch failures were retained;
the run recovered using the suggested `--no-sandbox` flag in this environment.

It added four tests, including a real UI save with independent API and reload
assertions. The full broken-app suite executed five tests: four passed and the
persistence case failed on both saved-state assertions. Independent replay of
the same tests on a pristine app with only the missing file write repaired
passed all five. Neither run skipped tests or retried failures. The original
page-load-only suite was also replayed and correctly rejected by the grader.
This smoke-suite control is not a no-skill agent baseline.

The repository's flow validator independently checked all five runner-discovered
cases and the four new required IDs: four journeys, five mapped tests, none
unmapped. The candidate preserved product code, closed its browser session,
stopped its server, released its port and retained evidence. Manual review
confirmed all five rubric requirements. The [generated regression](generated-regression.mjs)
is retained outside the candidate fixture so future trials still start with
missing save coverage.

Raw browser logs, traces and screenshots remain local rather than published.
This is a synthetic local-app feasibility trial. No claim of improvement over
a no-skill baseline, repeatability, other models, authenticated apps or hosted
production behavior follows from this single result. No skill changes were
needed based on this trial.
