---
name: verify-changes
description: Prove changed UI and service behavior end to end, with durable regression tests linked to the app's journeys.
disable-model-invocation: true
user-invocable: true
---

# Verify changes

Run on explicit user invocation. Deliver executed proof from the real entry point to the visible and saved outcome, with durable regression coverage. Product fixes require authorization beyond verification-only mode; deployments, merges, production mutations and other agents are not implied.

## 1. Bind the proof to the change

Read the request, supplied thread/PR, repository instructions, diff, existing harness and tests. Record base/tested revision, dirty-tree context, runtime/build mode, frontend/backend targets and auth roles. Use the current task's changes if the target is clear; resolve material ambiguity before dependent work.

Read the project's flow map and [flow contract](references/flow-contract.md). Build an acceptance matrix: entry → action → visible outcome → saved/downstream outcome → existing or missing test. Update affected paths for approved new behavior; preserve requirements when observed behavior is a regression. Add relevant permission, failure, retry and boundary branches. Refresh stale route/selector instructions against current source and runtime observations.

If the map is absent, create a provisional mapping for the changed scope and disclose the app-wide setup gap. Tell the user they can invoke `setup-verification` for the full map; continue independent verification without invoking it automatically.

**Complete when:** every in-scope behavior has a requirement-based expected result and a real path association. Implementation reports are claims, not proof.

## 2. Establish a trustworthy runtime

Reuse the project's harness, package manager, auth protocol and fixtures. Confirm the frontend's actual backend before writing test data. Preserve persistent development data, shared accounts, saved reviews and unrelated sessions. Different ports alone do not isolate caches, auth files or databases.

Run the project's read-only health check, or equivalent checks for intended code/build, owned processes/ports, schema/functions and authenticated readiness. Recheck after surprising behavior; restore a known UI state when a healthy process contains a wedged session. Keep secrets and raw auth state out of reports. Track owned processes, tabs, temporary identities and data for cleanup.

**Complete when:** the real target is ready and ownership/isolation is established, or a precise runtime blocker is recorded. Finish checks that do not depend on blocked access.

## 3. Execute and preserve the proof

Read only the applicable branches; read both for a change spanning UI and services:

- **UI:** read [UI proof](references/ui-proof.md). Drive the actual app with agent-browser or the host-required browser, then run durable Playwright coverage. Add missing flow/assertion coverage in the repository.
- **Endpoints, jobs or CLI:** read [service proof](references/service-proof.md). Invoke the real public boundary and verify the downstream outcome; add missing durable tests using the existing runner.

Use observable behavior as the oracle. Fixtures may prepare prerequisites, but cannot perform the action being proved. Static checks, unit/component tests, Storybook and screenshots supplement runtime proof. A mocked external provider leaves that boundary explicitly unverified.

Run new/changed tests, adjacent journeys and required project checks. Run the full E2E suite when shared auth, fixtures, navigation, schemas or central domain logic changes, or the user requests it. Validate changed test IDs against the runner inventory and mapping gate; record an equivalent manual cross-check if the gate is absent. Keep legacy unrelated unmapped tests as backlog.

**Complete when:** in-scope real journeys executed, durable missing coverage was added and run, and each changed test maps to the transitions it actually asserts. Zero selected tests, skipped cases, timeouts and missing prerequisites are not passes.

## 4. Resolve findings within scope

Record each failure's reproduction, expected/actual outcome, impact, revision and evidence. Distinguish stale documentation, harness defects and product defects. Correct docs/harness gaps within scope and re-execute their instructions. In verification-only mode, keep product code read-only and return product findings. When product fixes are authorized, fix and rerun the reproducer plus affected regressions at the new revision.

Retain failed attempts and diagnose them rather than weakening assertions, widening error filters or accepting unexplained baselines. An isolated rerun cannot erase a flaky full run. Baseline attribution requires comparable evidence. Stop repeated attempts that yield no new diagnostic information; report the unresolved blocker and finish independent checks.

**Complete when:** findings have a proven resolution or an explicit failed/blocked status. Never rewrite a path's expected outcome merely to match a bug.

## 5. Clean up and report

Retain commands/exit codes, test selection/counts, build identity, action traces, relevant screenshots, saved-state assertions and diagnostics in private artifacts. Redact before sharing; browser traces may contain sessions. Stop only owned services/tabs and remove run-created disposable identities/data. Preserve durable accounts and saved reviews. Verify owned ports are released and evidence remains after cleanup, including failed attempts.

Return **verified**, **failed**, or **blocked/partial**, with scope/revision/environment/roles, observed UI/API and saved outcomes, tests added/updated, focused/full results, defects and unrun gaps, evidence links and cleanup status.

**Verified** requires successful in-scope real E2E proof, required regression coverage and cleanup, with no unresolved in-scope failures. Results from a local production build do not establish hosted-production behavior. A browser check left for the user means verification remains incomplete.
