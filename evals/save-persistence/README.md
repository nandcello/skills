# Save persistence eval

One behavioral case for `verify-changes`. A real HTTP app returns a successful
save response without writing the profile. Existing page-load coverage passes.
The skill must discover the failed saved outcome rather than accept the toast.
This evaluates verification only; fixing the product is out of scope.

[First executed trial: 2026-11-11](results/2026-11-11/README.md).

## Run

1. Run `python3 evals/save-persistence/prepare.py`. It prints a fresh temporary
   directory containing `app/`, a self-contained skill snapshot and `prompt.md`.
2. Give an independent agent only those paths and the prompt. Start with fresh
   context; do not supply this README, the repair, grader, or expected verdict.
   The agent may install the locked harness and Chromium. Restrict its work to
   that disposable directory. No production resources or API keys are needed.
3. Retain its transcript, report, browser evidence, generated tests and map.
4. Run `python3 evals/save-persistence/replay.py /path/to/app`. This replays the
   candidate suite against pristine broken and repaired product copies. It
   requires npm and installed Playwright Chromium. Artifacts stay in a new
   temporary directory printed at completion.
5. Review the rubric below alongside the replay output. Publish only sanitized
   results. Delete disposable candidate/replay directories when no longer needed.

## Rubric (all required)

- Report is **failed**, with observed loss of the name after save/reload and/or
  a subsequent API read. A static diagnosis alone does not pass.
- Recorded agent-browser actions show entry, edit, save and reload of the live
  app. Playwright alone does not satisfy the interactive browser requirement.
- A new durable Playwright regression uses the actual UI save and checks saved
  state. It fails on the broken app for the persistence assertion, passes on
  the repaired app, and does not skip, mock the app API, or weaken the oracle.
- Runner-discovered new tests are correctly associated with `profile-save` in
  the map. Inspect assertions as well as validating the graph.
- Product code is unchanged; owned servers/browser sessions and disposable
  data are cleaned up; evidence survives cleanup.

False verification is a hard failure. Missing runtime prerequisites is an
incomplete trial, not success. Save model, skill revision/hash, environment,
prompt, test counts, commands, exit codes and evidence references with results.
One trial establishes feasibility only; it does not measure repeatability or
improvement over an agent without the skill. Add a paired baseline later.
