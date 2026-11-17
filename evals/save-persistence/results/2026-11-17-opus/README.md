# Opus trial: passed

Claude Opus 5.5 (`claude-opus-5-5`), high effort, through the Claude Agent
harness. The runtime confirmed that model executed. Fresh context and a fresh
copy of the original fixture; same skill snapshot, user task and five-part
rubric as the GPT trial. No intended bug, repair or grader was supplied.

The agent reported the app as **failed**, reproducing data loss with
agent-browser and an API read. It added two Playwright tests without changing
product code. Independent replay ran three cases: the persistence case failed
on the broken app, and all three passed after the missing file write was
repaired. No cases were skipped or retried. Failure output was inspected to
confirm that persistence, rather than a runtime error, caused the failure.

The broken-app test stops at its first failed API assertion. Reload was proved
interactively in agent-browser, and the repaired replay executes the reload
assertion successfully. Unlike the GPT trial, the broken-app automated test
does not report both persistence failures in one run. This meets the existing
rubric; it is recorded as a diagnostic difference, not a changed grading rule.

The repository flow validator independently checked all three discovered cases
and both new required IDs: two journeys, three mapped tests, none unmapped.
Product source matches the pristine fixture. Cleanup logs show the browser and
server stopped; an independent port bind confirmed the owned port was free.
All five rubric checks passed. Sanitized results and the generated regression
are retained here; raw browser traces and application evidence stay local.

Comparability limits: one trial per model, different dates and agent harnesses,
and provider-specific system instructions. T3 prepended a test-subagent role
to the Opus task. Both settings are named "high", but this does not establish
equal compute. Dependency versions match; browser caches and host state were
not reset between dates. No no-skill baseline, cost comparison, speed ranking,
or statistical reliability claim is supported. More generated tests is not
inherently a better result. Neither trial required changes to the skill.
