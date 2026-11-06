---
name: verify-changes
disable-model-invocation: true
user-invocable: true
description: Verify a specific change end to end, exercise real user or API flows, and add missing durable regression coverage. Use only when the user explicitly invokes verify-changes; do not automatically invoke after implementation or review.
---

# Verify changes

Run only on explicit user invocation (`$verify-changes`, `/verify-changes`, or an explicit request to use this named skill). A generic implementation request does not activate it. Invocation authorizes the verification work and missing tests, not deployment, merging, production mutations, or launching other agents.

The required result is an executed proof from the real entry point to the observable outcome, with durable regression coverage. Static analysis, unit tests, Storybook, screenshots, deployed bundle inspection, and HTTP 200 checks can supplement this proof; none replaces it.

## Establish the target and acceptance criteria

1. Read the user's request, relevant implementation history, repository instructions, diff, existing E2E harness, fixtures, scripts, and CI configuration. If a thread is supplied, read it using the available thread tool. Treat implementation reports as claims to verify.
2. Record repository/checkout, base and tested revision, uncommitted changes, runtime/build mode, frontend URL, backend target, and auth roles. If the target is unspecified, use the current task's changes and state that scope; ask only if materially ambiguous.
3. Turn the change into a compact acceptance matrix: entry point → action → expected visible result → persisted/downstream result → existing test or missing coverage. Include relevant permission, failure, retry, boundary, and adjacent regression paths. Derive expectations from requirements, not the implementation's current output.
4. Read the project's app-flow map and [flow contract](references/flow-contract.md). Associate every new or changed test with a real journey and the steps/branches it asserts. Update the map for legitimate new behavior before writing the test; never invent a path just to justify an unrelated test. Backend, security, failure, and capacity cases belong to the affected path as boundary branches.
5. If tooling or the app-flow map is missing, do not silently invoke another explicit-only skill. Prepare a clearly labeled provisional mapping from current requirements/code, and report the setup gap; the user can invoke `setup-verification` for a complete app-wide setup. Required runtime proof must still run before a verified verdict.

Before handback, validate changed test associations against runner-discovered test IDs using the project's mapping check (created by setup-verification). If it is absent, perform and record the equivalent manual cross-check. Unmapped new tests or fictional paths are incomplete work. Existing unrelated unmapped tests remain a visible backlog, not permission to delete them.

## Prepare a real, isolated environment

Reuse the project's harness, package manager, auth protocol, and fixtures. Verify which backend the frontend actually uses; a localhost UI can still mutate a hosted database. Use disposable test data or the project's approved test namespace. Do not reset persistent development data, saved reviews, durable test accounts, or unrelated sessions.

Check runtime, browser, dependencies, network, credentials, schema/functions, and authenticated hydration before attributing failures to the feature. Do not print secrets or copy auth state into reports. Use available secret-input mechanisms when needed. Prove the tested server/build serves the intended code; an old process or branch is not evidence for a new revision.

Track owned processes, ports, temporary identities and records for teardown. Different ports alone do not isolate build caches, auth files, databases, or logs. Respect checkout locks and shared-auth constraints. Do not replace the project's harness with an ad hoc parallel stack.

## Execute the proof

### UI changes

- Drive the actual app with `agent-browser`, or the host's required shared browser tool. In T3, follow its preview-tool rules; in a cloud agent, use its supported interactive browser. Inspect the real UI, then act through visible controls with stable accessible locators.
- Exercise the changed journey from its actual entry point, including navigation, forms, loading/error feedback, and confirmation. API/fixture setup may establish prerequisites, but must not perform the UI action being claimed as tested.
- Assert the visible result and saved state, then reload or reopen to prove persistence. Use another authenticated role/session when access, collaboration, or cross-user updates matter. Inspect console, failed requests, and server diagnostics.
- For responsive/interaction changes, exercise affected desktop and phone sizes, keyboard/focus, overflow, and touch interactions where relevant. A phone screenshot proves rendering, not tapping, scrolling, or Safari behavior.
- Auth/onboarding changes require real auth and the actual transition. A mocked sign-up component or an already-onboarded session cannot prove first-time signup. Use an isolated new test identity when the journey requires it and the environment permits it.
- Inspect existing Playwright assertions, not just titles. If the changed flow or assertion is missing, add or extend a durable Playwright journey in the repository and run it. Reuse existing helpers; create the smallest maintainable Playwright setup if none exists. A temporary screenshot script is not lasting regression coverage. Preserve project-specific test catalogs and walkthroughs.
- Both interactive exploration and repeatable coverage are required. A host-imposed browser restriction must be reported if it prevents either; do not silently substitute a mock or source inspection.

### Endpoints, jobs, and other functionality

- Invoke the real external boundary: authenticated HTTP request, public Convex function, CLI command, webhook receiver, or supported job trigger. Run through the real service, persistence, and downstream observable outcome. Do not call an internal helper and label it E2E.
- Assert the response and resulting state through a separate read path; inspect relevant audit/event records and invariants. For rejection cases, assert both the expected error and no unintended mutation.
- Cover applicable unauthorized/wrong-role access, validation edges, pagination/limits, duplicate requests, stale state, concurrent actions, rollback, and retry/idempotency. For asynchronous work, wait on a bounded observable completion condition rather than a fixed sleep.
- Add or extend durable tests using the existing runner. Playwright request tests suit HTTP flows; a project-native executable integration suite can suit CLI, queue, or backend flows. Use public entry points for the action. Test-only setters are setup, never proof.
- Prefer an approved real sandbox for external dependencies. If a provider is mocked, identify the exact unverified boundary and do not claim live provider E2E. Find another permitted real execution route before declaring a blocker. Never make live payments or send real messages just to satisfy a test.

## Regressions and defect loop

Run the new/changed tests, adjacent affected journeys, and required project checks. Broaden to the full E2E suite for changes to shared auth, fixtures, navigation, schemas, or central domain logic, or when requested. A focused pass must be labeled focused. A zero-test selection, skipped case, timed-out run, or absent prerequisite is not a pass.

For each defect, record steps, expected/actual outcome, impact, revision, and evidence. In verification-only/review mode keep product code read-only; adding regression tests remains in scope unless the user explicitly forbids edits. When fixes are already authorized, fix in-scope defects and rerun the reproducer plus affected regressions. Coordinate with an implementation agent only when the user authorized that collaboration. Otherwise report the actionable failure without inventing an approval loop or silently changing product behavior.

Do not weaken assertions, blanket-ignore browser errors, regenerate visual baselines without inspection, or increase timeouts to hide a product failure. Diagnose fixture/harness failures separately. Preserve the original failure when rerunning; an isolated pass does not erase a flaky full run. Call something pre-existing only with comparable baseline evidence. If failures require unavailable access or a risky out-of-scope action, finish independent checks and mark the blocked scope explicitly.

After fixes, identify the new tested revision and rerun affected proof. Prior results apply only to unchanged behavior with an explained scope; do not transfer a sign-off blindly to another commit/build.

## Evidence, cleanup, and handback

Retain commands and exit codes, test selection/counts, runtime/build identity, traces or action history, relevant screenshots, response/state assertions, diagnostics, and cleanup results in a private artifact directory. Keep earlier failed attempts. Redact secrets and sensitive data before sharing; raw browser traces may contain sessions.

Stop only owned services and close owned browser tabs according to host rules. Clean only run-created disposable identities/data, preserve durable project accounts and saved reviews, verify owned ports are released, and retain evidence after teardown. Report cleanup failures as outstanding work.

Return a concise verdict (**verified**, **failed**, or **blocked/partial**) with:

- Tested scope, revision/build, environment and roles.
- Actual UI/API journey and saved/downstream outcomes observed.
- Tests added/updated and commands/results, distinguishing focused/full, failed, flaky, skipped and unrun.
- Defects, missing coverage or access, and precise limits on the verdict.
- Evidence links and cleanup status.

Use **verified** only when the in-scope real E2E proof and required regression coverage executed successfully, with no unresolved in-scope failures. Never leave the requested browser check as “the user can try it” while claiming verification is complete.
