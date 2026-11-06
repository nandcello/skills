# Service, job and CLI proof

- Invoke the real external boundary: authenticated HTTP request, public Convex function, CLI command, webhook receiver, or supported job trigger. Run through the real service, persistence, and downstream observable outcome. Do not call an internal helper and label it E2E.
- Assert the response and resulting state through a separate read path; inspect relevant audit/event records and invariants. For rejection cases, assert both the expected error and no unintended mutation.
- Cover applicable unauthorized/wrong-role access, validation edges, pagination/limits, duplicate requests, stale state, concurrent actions, rollback, and retry/idempotency. For asynchronous work, wait on a bounded observable completion condition rather than a fixed sleep.
- Add or extend durable tests using the existing runner. Playwright request tests suit HTTP flows; a project-native executable integration suite can suit CLI, queue, or backend flows. Use public entry points for the action. Test-only setters are setup, never proof.
- Prefer an approved real sandbox for external dependencies. If a provider is mocked, identify the exact unverified boundary and do not claim live provider E2E. Find another permitted real execution route before declaring a blocker. Never make live payments or send real messages just to satisfy a test.

