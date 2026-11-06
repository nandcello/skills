# App-flow and test-association contract

Use the project's maintained catalog if available. The bundled default is `docs/verification/app-flows.json`, schema version 1. The same semantics apply to other formats.

## Graph

- `revision`: source revision used to map the app (include dirty-tree context if needed).
- `inventory`: entry points inspected and explicit omissions/unavailable surfaces.
- `nodes`: stable `id`, human `label`, and `evidence` (source location, requirement, or runtime observation). A node is a user/service state, not necessarily a page. Include terminal failure states where appropriate.
- `edges`: stable `id`, `from`, `to`, human `action`, `role`, observable `outcome`, and `evidence`. `kind` is `normal`, `boundary`, or `failure`; `observed` is a boolean. Non-observed source-inferred paths are permitted but never count as executed proof.
- `journeys`: stable `id`, `label`, and ordered `edges` forming a continuous path. Branches have their own journeys; retry loops may revisit nodes. Each entry-to-outcome path has explicit prerequisites in its human description.
- `tests`: exact runner-discovered `id` (default `relative/file::full title`), `journey`, ordered `edges` asserted by this single test, and `coverage`: `step`, `boundary`, or `whole-path`. Include what is actually asserted, not setup-only actions.

Every test association must refer to existing edges in that journey, in order. `whole-path` requires the entire ordered edge sequence in one executed test. `boundary` must include a boundary/failure edge. API/auth/worker/security/performance cases may be boundary branches of a user journey or real service journeys. Do not drop such tests just because they lack a page.

A generic label such as “miscellaneous” or “test utilities” cannot justify unrelated app tests. Infrastructure/harness tests belong to a separately reported infrastructure inventory. Preserve existing unmapped tests as backlog; never silently delete them or count them as app-flow proof.

## Coverage gate

1. Discover test cases from the project's runner, including generated variants. Export their stable IDs as a JSON array.
2. Derive a second array of new/changed IDs from discovery of changed specs or the existing catalog's change tracking. It must not be derived from the map itself.
3. Check graph consistency, case existence and required associations:

```sh
python3 scripts/validate_flows.py docs/verification/app-flows.json \
  --inventory artifacts/test-inventory.json \
  --required-tests artifacts/changed-test-ids.json
```

Use `--require-all` when every test is mapped. Without inventory, the validator checks structure only; that is not a coverage gate. Remove stale renamed/deleted case links and update affected paths without rewriting saved review decisions. Stable journey/edge IDs should survive copy changes.

The check catches dangling references, broken path order, overstated whole-path mappings, and unmapped required tests. It cannot prove that assertions implement their claimed mapping: the agent must inspect the actual test and execute it. Coverage metadata is not test success.
