---
name: setup-verification
description: Set up Playwright and agent-browser, prove the tooling works, and map the app's real journeys so every new test has a place in its flow. Explicit user invocation only.
disable-model-invocation: true
user-invocable: true
---

# Set up verification

Use only when the user explicitly invokes `setup-verification`. Set up the current project's verification environment and durable app-flow reference. Installing this skill alone does not run setup. Do the setup work, not just recommend commands. Do not automatically invoke another skill, deploy the app, or change production data.

## Discover before installing

Read repository instructions, package manifests/lockfiles, runtime pins, test configs, CI, routing/navigation, auth and roles, API/worker entry points, and product documentation. Record the actual checkout and service targets. Discover the existing package manager and test workspace; use those conventions, including project wrappers such as `vp`/`vpx` when required.

Check for usable Playwright and agent-browser installations, their versions, installed browsers, OS libraries, app launch commands, backend services, test credentials, and isolated data. Reuse healthy installations and harnesses. Do not upgrade working pinned dependencies, create a second lockfile, overwrite existing configs, or assume a global binary proves the project's runner works.

## Install and prove missing tooling

Read [tooling setup](references/tooling.md) and installed CLI help before executing version-sensitive commands.

- Install missing Playwright in the project's existing test workspace with its package manager. For JS/TS apps lacking a runner, add `@playwright/test` as a dev dependency, a minimal config and runnable script. Preserve a working existing Playwright library/custom runner; other languages may retain their native Playwright harness.
- Install the runner's browser binary (Chromium initially; add others when the app's coverage requires them). Repair missing OS libraries through the approved package manager when permitted. If permissions or network block this, report exactly what remains unavailable; do not declare readiness based on package presence.
- Install missing `agent-browser`, preferring a project-pinned dev dependency for reproducible machines, or an existing user-level installation. Install its browser too: do not assume Playwright's cached browser satisfies agent-browser. Avoid sudo/global mutations when a local install works.
- Configure a test base URL from environment/config, real auth fixtures using the project's protocol, readiness for authenticated app/backend use, owned-process teardown, and ignored private auth/results directories. Never place credentials in committed files. Reuse durable test users where required; create disposable users only for flows that need them.
- Launch a real browser with the project's Playwright runtime and run an isolated tool smoke check; then run at least one genuine mapped app journey. Test discovery alone is not execution. Exercise agent-browser on a harmless isolated page/session as well. Host-required shared browser tools take precedence for interactive work; disclose any untested agent-browser capability rather than bypassing host rules.
- If app credentials/services are unavailable, complete tooling and source-based mapping, mark affected nodes unobserved, and report **partial setup**. A standalone browser smoke check is not app E2E proof.

## Establish the whole app's flow

Read [the flow contract](references/flow-contract.md). Reuse and extend a maintained journey catalog when one exists; otherwise create `docs/verification/app-flows.json` and `docs/verification/APP-FLOWS.md` using [the example](assets/app-flows.example.json) as a format example, replacing every fictional node/test.

Inventory all user-facing entry points and meaningful outcomes, grouped into journeys. Include signed-out and first-time entry, onboarding, returning-user paths, roles, core creation/edit/delete/undo, navigation/deep links, settings, public/share views, and external API/CLI/job workflows that actually exist. Trace each relevant frontend action through auth, backend, persisted state, and observable result. Enumerate routes/endpoints/jobs checked and omissions so “entire app” has an auditable scope.

Build a directed graph of states and transitions, not a bag of pages. Include branching permissions, validation/failure recovery, empty/loading states, retries, concurrency, and capacity boundaries where meaningful. Service jobs can be first-class entry points; they need not be reachable by a UI click. Do not invent screens or behavior absent from the product. Clearly distinguish requirements, source-inferred behavior, and runtime observations, with source references and revision.

Produce a readable journey index with stable IDs, roles, entry conditions, ordered transitions, outcomes, linked test cases, and explicit coverage gaps. A Mermaid flow diagram is useful in the file; it is not required to launch a dashboard or deploy anything. Do not claim a whole-path test from several disconnected step tests.

Discover existing test IDs through the real runner (`playwright test --list --reporter=json` or the repository catalog/export), not regex counts of source text. Associate existing tests with actual asserted transitions. Keep unrelated legacy tests as an explicit unmapped backlog; do not delete them or fabricate mappings. New tests must have a real path association before they are added.

## Make the association enforceable

When using the bundled JSON format, copy [validate_flows.py](scripts/validate_flows.py) into the project's verification scripts and wire a documented command (or CI check where appropriate). It validates graph/path references and exact runner-discovered test IDs. Export the runner inventory as a JSON array of stable `file::full title` IDs, including parameterized variants. Use the same project/browser qualification consistently if needed.

Run the validator with `--inventory` and `--required-tests` for new/changed test IDs. The required list must come from discovery of changed spec files (all cases in those files is an acceptable conservative choice), not from already-mapped tests; otherwise the gate is circular. Strict `--require-all` is appropriate once legacy mapping is complete. On an existing catalog, implement equivalent checks in its current tooling instead of maintaining a competing source of truth.

Setup may add a minimal genuine app smoke journey tied to the map. Do not generate a large speculative suite just to populate coverage. Infrastructure self-tests remain separately labeled and cannot count as application-path coverage. The map is the reference for future `verify-changes` invocations; new functionality updates the map and its tests together.

## Handback

Report installed/reused versions, exact launch/test/map-validation commands, browser smoke and real app results, map location and inventoried scope, coverage gaps, blocked access, and cleanup. Record reproducible setup instructions in `docs/verification/SETUP.md` (or the existing testing guide) and actual package/config/lockfile changes. Leave no owned temporary processes running and preserve project-owned data and sessions.

Ready means the required tooling works, at least one real mapped app flow passed, and the complete discovered app inventory is represented with uncertainties explicit. Do not equate a complete map with complete E2E coverage.
