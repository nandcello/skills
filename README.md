# Skills

[![skills.sh](https://skills.sh/b/nandcello/skills)](https://skills.sh/nandcello/skills)

A growing collection of explicitly invoked agent skills. The initial pair prepares browser testing, maps app journeys, and verifies changes end to end. Works with the [skills CLI](https://github.com/vercel-labs/skills) and its standard `skills/<name>/SKILL.md` layout. No custom installer or npm package is required.

## Install anywhere

Requires a Node version supported by the skills CLI (currently Node 22.20+).

```sh
npx skills add nandcello/skills -g -a codex claude-code
```

Choose both skills, or select explicitly:

```sh
npx skills add nandcello/skills -g -a codex claude-code \
  --skill setup-verification verify-changes -y
```

Omit `-g` for a project-local install. Run `npx skills update -g` for updates. You can also clone this repository, pull updates, and install from its local path with `npx skills add ./skills`.

## Use

In Codex:

```text
$setup-verification Set up testing and map this entire app's flows.
$verify-changes Verify the current branch against main.
```

In Claude Code:

```text
/setup-verification Set up testing and map this entire app's flows.
/verify-changes Verify the current branch against main.
```

Both skills carry `disable-model-invocation: true` for Claude Code and `policy.allow_implicit_invocation: false` in `agents/openai.yaml` for Codex. They do not automatically invoke each other. Other hosts must enforce an equivalent explicit-only policy; installation support alone does not guarantee invocation policy support.

| Skill | Result |
| --- | --- |
| [setup-verification](skills/setup-verification/SKILL.md) | Installs missing Playwright/agent-browser and browser dependencies, checks real readiness, and establishes a durable app-flow map with test associations. |
| [verify-changes](skills/verify-changes/SKILL.md) | Exercises actual UI/API flows, verifies saved outcomes, adds missing durable coverage tied to the map, and reports evidence, failures and cleanup. |

Setup runs only when invoked in the target app. Installing these skills does not install browser tooling or change any application. Existing project harnesses, package managers, auth conventions and catalogs are reused. Credentials and production access are never bundled.

## Every app test belongs to a flow

The app maintains a human-readable journey reference and a machine-readable map (or extends its existing catalog). Tests reference stable journey and transition IDs. The graph includes role boundaries, failure/recovery paths, API entry points and background jobs as well as UI paths.

The supplied [validator](skills/setup-verification/scripts/validate_flows.py) checks graph continuity, test references, ordered path associations, and honest whole-path coverage. A runner-discovered inventory plus independently derived changed-test IDs makes missing associations fail. Existing unmapped tests remain visible as backlog; they are not deleted. Mapping does not prove execution or assertion quality.

Default setup outputs in the target application:

- `docs/verification/APP-FLOWS.md`: app journey index, scope and known gaps.
- `docs/verification/app-flows.json`: states, transitions, journeys and test associations.
- `docs/verification/SETUP.md`: reproducible tooling, service and test commands.
- A project verification script/check wired to the existing runner's discovered test IDs.

No claims of verification based solely on mocks, unit tests, source inspection, screenshots, or passing builds. A missing auth/service/browser prerequisite means partial or blocked verification. “Production build” and “tested on production” are separate claims.

## Discovery on skills.sh

The repository is public and follows the [documented skill format](https://github.com/vercel-labs/skills/blob/main/docs/creating-skills.md). The [directory](https://skills.sh) uses install telemetry to surface skills; publishing a repository is not a guarantee of immediate indexing or ranking.

```sh
npx skills add nandcello/skills --list
npx skills find verification --owner nandcello
```

The first command discovers directly from this repository even before search indexing catches up. No separate package publication is required.

## Development

Python 3 and PyYAML are used for repository validation; the bundled app-flow validator uses only the Python standard library.

```sh
python3 -m pip install -r requirements-dev.txt
python3 scripts/validate_skills.py
python3 -m unittest discover -s tests -v
npx skills add . --list
```

Author shared flow rules in `shared/flow-contract.md`, then run `python3 scripts/sync_shared.py` to refresh the bundled copies. Each skill remains independently installable. Read [authoring guidance](docs/authoring.md) before changing a skill; it records the applied guidance and upstream sources. Do not commit private project histories, test credentials, browser sessions, or application evidence.
