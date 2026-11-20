---
name: verify-tracker
description: Verify Tracker expense, payment and closed-period journeys against its disposable local Convex backend using the project’s Playwright suite.
disable-model-invocation: true
user-invocable: true
---

# Verify Tracker

Run on explicit invocation from the Tracker checkout being tested. Record its revision and working tree status. Read the checkout’s `AGENTS.md`, `TEST-JOURNEYS.md`, `e2e/README.md` and the relevant entries in `apps/web/app/internal/tests/journey-data.json`. Select tests from the current catalog in `packages/backend/test-catalog.json`. For example, Closed periods on revisions with Years view has desktop and phone cases in `closed-period-calendar.spec.ts`.

## Prepare the checkout

Use Tracker’s pinned Node and pnpm, on Linux with Git, `ss`, and `/proc`. Install dependencies with `pnpm install --frozen-lockfile` if missing. Use `pnpm e2e:setup` to prepare Chromium and development Clerk credentials. Check the project’s documented local Convex binary and auth prerequisites. Keep credentials private.

## Exercise a journey

Resolve the installed directory containing this SKILL.md and set `SKILL_DIR` to its absolute path. Keep the working directory inside Tracker. Run the [verification helper](scripts/verify.mjs) with a reason and the selected cases:

```sh
TRACKER_VERIFY_REASON="Check expense persistence" node "$SKILL_DIR/scripts/verify.mjs" run tests/ledger.spec.ts
```

For Closed periods, select `tests/closed-period-calendar.spec.ts -g 'Years view closes past years'`. During a run, `node "$SKILL_DIR/scripts/verify.mjs" doctor` checks the owned services and local ledger. Use the URLs and ports established by the harness. Preserve other sessions, shared fixtures and persistent development data.

Use project fixture helpers to seed prerequisites in the disposable database. Exercise the target behavior through its real entry point and check the resulting saved data. For UI changes, also drive the journey in the host browser or agent-browser. Add missing assertions to the mapped Playwright journey and follow Tracker’s catalog maintenance instructions.

## Report the result

Inspect the helper’s exit status, per-test results, ledger checks and cleanup. Link the private run summary and report failures or untested branches. Passing runs keep compact summaries. Failed browser tests retain available traces in one location. Later runs expire automatic diagnostics after 14 days for completed runs in that checkout. The [retention helper](scripts/retention.mjs) preserves summaries and manual evidence.
