// Only prune runner-owned diagnostics after successful teardown. Keep history and manual evidence.
import { existsSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const diagnostics = ["report", "test-results", "results.json", "drive.log", "launch.log",
  "server-logs", "owned-processes.json", "ledger-after.json", "doctor.json"];

export function compact(directory) {
  for (const name of diagnostics) rmSync(join(directory, name), { recursive: true, force: true });
}

export function expire(store, key, now = Date.now()) {
  const cutoff = now - 14 * 86400000;
  for (const entry of readdirSync(store, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const match = /^(\d{4}-\d\d-\d\dT\d\d)-(\d\d)-(\d\d\.\d{3}Z)-([a-f0-9]{12})-\d+$/.exec(entry.name);
    if (!match || match[4] !== key) continue;
    const started = Date.parse(match[1] + ":" + match[2] + ":" + match[3]);
    if (!(started < cutoff)) continue;
    const directory = join(store, entry.name);
    // Only new-format completed runs have a permanent summary to preserve.
    const summary = join(directory, "summary.json");
    if (existsSync(summary) && JSON.parse(readFileSync(summary)).cleanupOk === true) compact(directory);
  }
}
