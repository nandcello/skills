# Skill authoring

This repository holds independently installable, user-invoked procedures. Write for an agent encountering a project for the first time. Keep required outcomes and authorization boundaries in the entrypoint.

## Rules applied here

- Give manual skills a concise human-facing description. Keep both explicit-only metadata settings; another skill must not invoke them automatically.
- Put ordered work in `SKILL.md`, with an observable completion condition for each phase. Put conditional UI, service, or setup details behind a relative reference whose wording says when to read it.
- Prefer direct actions and concrete expected results over generic advice. Retain prohibitions where they protect a real authorization or data boundary.
- Inspect package scripts/configuration instead of caching volatile machine details. A project runbook may record concrete commands once they have been executed.
- Maintain one editable source for shared material. `shared/flow-contract.md` is copied into each distributable skill by `scripts/sync_shared.py`; validation detects drift. Cross-skill relative dependencies would break individual installation.
- Test the procedure's actual commands, not just its prose. Setup must exercise its generated runbook and preserve evidence after teardown. Label stand-in environments and unverified target steps.
- Keep requirements, documentation drift, harness gaps and product regressions distinct. Refresh maps against current behavior without changing a requirement to accommodate a bug.
- Encode enforceable invariants in metadata or validation; use prose for judgment. Make changes based on demonstrated failures rather than accumulating rules for hypothetical cases.

## Source review

Reviewed 2026-11-06. These are adapted design principles, not copied skills or runtime dependencies:

- Matt Pocock: [writing-for-agents](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL.md), [skill mechanics](https://github.com/mattpocock/skills/blob/main/skills/productivity/writing-for-agents/SKILL-MECHANICS.md), and [invocation policy](https://github.com/mattpocock/skills/blob/main/.agents/invocation.md). Applied conditional references, explicit completion criteria, human-facing manual descriptions and a single editable source for shared rules.
- Lauren Tan's pstack: [create-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/create-verification-skill/SKILL.md) and [maintain-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/maintain-verification-skill/SKILL.md). Applied a runnable project guide, health checks after surprising behavior, evidence survival, and map maintenance that separates documentation from product failures.
- pstack [reflect](https://github.com/cursor/plugins/blob/main/pstack/skills/reflect/SKILL.md): applied its distinction between procedural guidance and rules better enforced structurally.

Their automatic routing, provider choices, parallel agents, scheduling and publication workflows are not imported. Our user's invocation and portability requirements govern. The full app inventory remains required, even though pstack's initial generator permits a smaller seed map.

## Validation limits

The repository checks metadata, packaged references, shared-copy freshness, CLI discovery and the flow validator. They do not prove an agent will follow the skill on a live app. Record a real application trial separately when one is performed, including environment, outcome and cleanup; do not label prose review or installer tests as that trial.
