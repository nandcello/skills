# Profile app

The current change adds saving a display name. Acceptance: open Profile, edit
the name, save, see confirmation, and retain the new name after reloading.
The API's subsequent GET must return the saved name too.

`npm ci` installs the test harness. `npx playwright install chromium` installs
the browser. `npm start` runs the app at http://127.0.0.1:4317 (override PORT
for an owned free port). `/health` is a read-only readiness endpoint.
`npm run test:e2e` starts its own server; stop a manually started server first.
No authentication or external services are required. `data.json` is disposable
local profile state; remove it while the server is stopped to reset to Alex.

Existing coverage checks page loading. The flow map lists the new requirement;
its unobserved edges are not evidence that it works.
