# Establish and maintain the app map

Read [the flow contract](flow-contract.md). Reuse and extend a maintained journey catalog when one exists; otherwise create `docs/verification/app-flows.json` and `docs/verification/APP-FLOWS.md` using [the example](../assets/app-flows.example.json) as a format example, replacing every fictional node/test.

Inventory all user-facing entry points and meaningful outcomes, grouped into journeys. Include signed-out and first-time entry, onboarding, returning-user paths, roles, core creation/edit/delete/undo, navigation/deep links, settings, public/share views, and external API/CLI/job workflows that actually exist. Trace each relevant frontend action through auth, backend, persisted state, and observable result. Enumerate routes/endpoints/jobs checked and omissions so “entire app” has an auditable scope.

Build a directed graph of states and transitions, not a bag of pages. Include branching permissions, validation/failure recovery, empty/loading states, retries, concurrency, and capacity boundaries where meaningful. Service jobs can be first-class entry points; they need not be reachable by a UI click. Do not invent screens or behavior absent from the product. Clearly distinguish requirements, source-inferred behavior, and runtime observations, with source references and revision.

Produce a readable journey index with stable IDs, roles, entry conditions, ordered transitions, outcomes, linked test cases, and explicit coverage gaps. A Mermaid flow diagram is useful in the file; it is not required to launch a dashboard or deploy anything. Do not claim a whole-path test from several disconnected step tests.

Discover existing test IDs through the real runner (`playwright test --list --reporter=json` or the repository catalog/export), not regex counts of source text. Associate existing tests with actual asserted transitions. Keep unrelated legacy tests as an explicit unmapped backlog; do not delete them or fabricate mappings. New tests must have a real path association before they are added.

## Make the association enforceable

When using the bundled JSON format, copy [validate_flows.py](../scripts/validate_flows.py) into the project's verification scripts and wire a documented command (or CI check where appropriate). It validates graph/path references and exact runner-discovered test IDs. Export the runner inventory as a JSON array of stable `file::full title` IDs, including parameterized variants. Use the same project/browser qualification consistently if needed.

Run the validator with `--inventory` and `--required-tests` for new/changed test IDs. The required list must come from discovery of changed spec files (all cases in those files is an acceptable conservative choice), not from already-mapped tests; otherwise the gate is circular. Strict `--require-all` is appropriate once legacy mapping is complete. On an existing catalog, implement equivalent checks in its current tooling instead of maintaining a competing source of truth.

Setup may add a minimal genuine app smoke journey tied to the map. Do not generate a large speculative suite just to populate coverage. Infrastructure self-tests remain separately labeled and cannot count as application-path coverage. The map is the reference for future `verify-changes` invocations; new functionality updates the map and its tests together.


## Refresh an existing map

Check changed source, alternate entry points, linked tests, and previously recorded prerequisites. Update stale navigation/selector instructions after observing the current approved behavior. If requirements still demand the old behavior, record a product regression; do not rewrite the expected outcome to match a bug. Mark inaccessible paths with the attempted route and missing prerequisite. Source-only checks cannot refresh a live observation. Keep source revision and last runtime evidence distinguishable.
