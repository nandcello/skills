# Browser tooling setup

Use installed help and current official documentation when versions differ. Commands below illustrate npm; translate to the existing package manager/workspace. Do not run npm in a pnpm/vp/yarn/bun project just because an example uses it.

For a JS/TS project without Playwright:

```sh
npm install --save-dev @playwright/test
npx playwright install chromium
```

On supported Linux environments, `npx playwright install --with-deps chromium` can also install OS libraries, but may need privileges. First diagnose whether dependencies are missing; follow host permission rules. Keep existing Playwright versions aligned and install the matching browser. Avoid a generator that adds demo tests unrelated to the app. Configure the actual test directory, environment-driven base URL, readiness, auth, traces, and cleanup according to the project.

For missing agent-browser:

```sh
npm install --save-dev agent-browser
npx agent-browser install
npx agent-browser --help
```

Its Linux dependency installer is `agent-browser install --with-deps`. It may require root/sudo. Never use destructive doctor/repair options as a default setup step. Prefer the installed version's help; available diagnostics can vary. Preserve existing profiles and sessions. A global install is optional, not necessary when the project-local binary works.

Prove installation by launching and interacting in an isolated owned browser session. Use a harmless fixture page for the tooling smoke check and a real project journey for app readiness. Do not attach to or close another user's active browser. Respect host-specific browser rules (for example, T3's shared preview browser).

Required evidence: runtime/package versions; commands and exit status; browser launch/action result; app auth/backend readiness; a real mapped test result; cleanup. Missing keys must come through approved secret tooling, never committed placeholder credentials. A local frontend may target a shared backend: confirm before fixture writes.

Official references: [Playwright installation](https://playwright.dev/docs/intro), [browser dependencies](https://playwright.dev/docs/browsers), [agent-browser installation](https://agent-browser.dev/installation). Recheck at execution time; this guide does not pin a universal package version.
