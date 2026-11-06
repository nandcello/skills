---
name: setup-verification
description: Prepare browser tooling and a runnable app-flow map that connects tests to real user and service journeys.
disable-model-invocation: true
user-invocable: true
---

# Set up verification

Run on explicit user invocation. Deliver a working test environment and a durable app-flow reference in the current project. Installing this skill does not run it. Keep production data, deployments, and other agents outside this setup's authority.

## 1. Establish the environment

Read repository instructions, runtime/package-manager pins, test scripts/configs, CI, auth and service setup. Identify existing Playwright and agent-browser installations, browser binaries, OS libraries, isolated test data, and actual frontend/backend targets. Reuse healthy installations and the project's harness; preserve pinned versions, configs, durable accounts and unrelated sessions.

**Complete when:** launch, interaction, observation and isolation mechanisms are identified for each app surface, with missing prerequisites named. Inspect the repository before asking for information it already provides.

## 2. Prepare the tools

For missing or broken browser tooling, read [tooling setup](references/tooling.md), check installed CLI help, and perform the needed installation. Use the project's package manager and test workspace. Preserve an existing Playwright library/custom runner; otherwise add a minimal runnable setup. Install missing agent-browser and the browsers each tool requires. Configure private auth state, readiness and owned-process cleanup. Host-required browser tools take precedence; report any agent-browser capability they prevent you from testing.

Run isolated browser smoke checks. Keep credentials in approved secret storage and private files. Missing permissions, network, credentials or services make this step partial; continue source mapping where possible.

**Complete when:** each required tool has launched and performed a real action, or its exact blocker and untested capability are recorded. A package version or test listing alone is insufficient.

## 3. Map the app and connect tests

Read [app mapping](references/app-map.md) for inventory, graph creation, test associations and refreshing an existing map. Use its linked flow contract and example when the project lacks an equivalent maintained catalog. Cover all discovered UI, API, CLI and job entry points, including relevant role/failure/boundary branches. Give every new app test an actual journey association. Preserve legacy unmapped tests as a visible backlog.

**Complete when:** the discovered app inventory is represented, source-inferred versus runtime-observed behavior is explicit, and mapping validation checks real runner-discovered IDs plus independently derived changed-test IDs. A complete inventory does not mean complete test coverage.

## 4. Write and execute the project runbook

Write `docs/verification/SETUP.md` or extend the existing testing guide with concrete commands and these operational details:

- Start the isolated app, including required migrations/fixtures, and identify usable auth/backend readiness.
- Run a read-only health check for the intended revision, process/port ownership and auth. Recheck after a failed or surprising interaction; recover a wedged UI before continuing even if the process is healthy.
- Drive a mapped feature with real selectors or public commands, then observe persisted/downstream state.
- Capture action/result evidence in a named private location, and clean run-owned processes/data without deleting it.
- Document how to invoke each supplied helper and any setup differences between this machine and the intended target.

Execute the written sequence from its stated starting conditions. Add a minimal mapped app smoke journey when missing; keep tooling smoke tests separate from app coverage. On failure, clean attempt-owned residue, correct setup/harness defects and rerun the affected sequence. Product regressions remain findings unless product fixes are authorized.

**Complete when:** at least one real mapped journey passed using the written instructions, cleanup succeeded, and evidence still exists after teardown. If only a substitute environment ran, name the target steps still unverified.

## 5. Hand back readiness

Report **ready** or **partial**, versions installed/reused, changed files, map scope/location, exact setup/test/validation commands, observed results, coverage gaps, blockers and cleanup. Ready requires all four completion criteria above; unsupported or inaccessible required tooling means partial.

The user can invoke this skill again to refresh setup and the full map. `verify-changes` maintains affected paths during explicitly requested verification; neither skill automatically invokes the other or schedules maintenance.
