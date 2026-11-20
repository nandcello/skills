#!/usr/bin/env node
// Reuse the repository's E2E runner; own only this run's processes and scratch state.
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync, readlinkSync,
  renameSync, rmSync, writeFileSync,
} from "node:fs";
import { compact, expire } from "./retention.mjs";
import { createServer } from "node:net";
import { homedir } from "node:os";
import { join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

const root = execFileSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim();
if (!existsSync(join(root, "e2e/scripts/env.mjs")) || !existsSync(join(root, "e2e/tests/ledger.spec.ts"))) {
  throw new Error("Run from the Tracker checkout containing its E2E harness.");
}
const e2e = join(root, "e2e");
const { loadConfig, assertDevClerk } = await import(join(e2e, "scripts/env.mjs"));
const config = loadConfig();
assertDevClerk(config);
const ports = [config.E2E_WEB_PORT, config.E2E_CONVEX_PORT, config.E2E_CONVEX_SITE_PORT];
const store = join(homedir(), ".local/state/tracker-verification");
const key = createHash("sha256").update(root).digest("hex").slice(0, 12);
const lock = join(store, `lock-${key}`);
const manifest = join(lock, "run.json");
const [command = "help", ...filters] = process.argv.slice(2);
const scratch = [".convex", ".auth", ".logs", "test-results", "playwright-report"];
const json = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + "\n", { mode: 0o600 });

function processInfo(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8").split(") ")[1].split(" ");
    return { pid: Number(pid), parent: Number(stat[1]), start: stat[19], state: stat[0] };
  } catch { return null; }
}
function sameProcess(saved) {
  const current = saved && processInfo(saved.pid);
  return current && current.start === saved.start && current.state !== "Z";
}
function processes() {
  return readdirSync("/proc").filter((name) => /^\d+$/.test(name)).map(processInfo).filter(Boolean);
}
function descendants(pid) {
  const rows = processes();
  const ids = new Set([pid]);
  for (let i = 0; i < rows.length; i++) {
    for (const row of rows) if (ids.has(row.parent)) ids.add(row.pid);
  }
  return ids;
}
function rejectSharedServer() {
  for (const row of processes()) {
    if (row.pid === process.pid) continue;
    try {
      const cwd = readlinkSync(`/proc/${row.pid}/cwd`);
      const cmd = readFileSync(`/proc/${row.pid}/cmdline`, "utf8").replaceAll("\0", " ");
      if ((cwd === root || cwd.startsWith(root + "/")) &&
          /next-server|next dev|scripts\/run\.mjs|playwright\/cli.*test/.test(cmd)) {
        throw new Error(`Checkout is already being driven by PID ${row.pid}; use another worktree.`);
      }
    } catch (error) {
      if (error.message.startsWith("Checkout is already")) throw error;
    }
  }
}
async function free(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.listen(Number(port), "127.0.0.1", () => server.close(() => resolve(true)));
  });
}
// Every group's ledger, each verified in its own transaction (one transaction over the whole
// suite's data outgrows Convex's limits), combined into one report with the same checks.
async function ledger() {
  const credentials = JSON.parse(readFileSync(join(e2e, ".convex/local/default/config.json"), "utf8"));
  const query = async (path, args) => {
    const response = await fetch(`${config.convexUrl}/api/query`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Convex ${credentials.adminKey}` },
      body: JSON.stringify({ path, args, format: "json" }),
      signal: AbortSignal.timeout(15000),
    });
    const body = await response.json();
    if (!response.ok || body.status !== "success") throw new Error("Local ledger query failed; inspect private server logs.");
    return body.value;
  };
  const report = {
    ok: true, problems: [],
    checked: { communities: 0, entries: 0, expenses: 0, notJournaled: 0, payments: 0 },
    breakdowns: { people: 0, pairs: 0 },
    shareCoverage: [], paymentCoverage: [], settlements: [], balances: [],
  };
  for (const communityId of await query("e2e:communityIds", {})) {
    const group = await query("ledger:verify", { communityId });
    report.ok &&= group.ok;
    report.problems.push(...group.problems);
    for (const key of Object.keys(report.checked)) report.checked[key] += group.checked[key];
    for (const key of Object.keys(report.breakdowns)) report.breakdowns[key] += group.breakdowns[key];
    for (const key of ["shareCoverage", "paymentCoverage", "settlements", "balances"]) {
      report[key].push(...group[key]);
    }
  }
  return report;
}
async function doctor() {
  const run = JSON.parse(readFileSync(manifest, "utf8"));
  if (run.root !== root || run.webUrl !== config.webUrl || run.convexUrl !== config.convexUrl ||
      !sameProcess(run.owner) || !sameProcess(run.runner)) throw new Error("No matching owned verification stack.");
  const owned = descendants(run.runner.pid);
  const sockets = execFileSync("ss", ["-H", "-ltnp"], { encoding: "utf8" }).split("\n");
  for (const port of ports) {
    const listeners = sockets.filter((line) => line.trim().split(/\s+/)[3]?.endsWith(`:${port}`));
    if (!listeners.length || listeners.some((line) => ![...line.matchAll(/pid=(\d+)/g)].some((m) => owned.has(Number(m[1]))))) {
      throw new Error(`Port ${port} is not owned by this run.`);
    }
  }
  const version = await fetch(`${config.convexUrl}/version`, { signal: AbortSignal.timeout(5000) });
  const signin = await fetch(`${config.webUrl}/sign-in`, { signal: AbortSignal.timeout(15000) });
  if (!version.ok || !signin.ok) throw new Error("Backend or sign-in page unavailable.");
  const report = await ledger();
  if (!report.ok || report.problems.length) throw new Error("Ledger verification failed.");
  return {
    ok: true, root, revision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    webUrl: config.webUrl, convexUrl: config.convexUrl, backendVersion: await version.text(),
    ownedPorts: ports, ledger: report,
    auth: "Development keys present; Playwright global setup and openGroup validate live Clerk/Convex sessions.",
  };
}

if (command === "doctor") {
  console.log(JSON.stringify(await doctor(), null, 2));
} else if (command === "run") {
  rejectSharedServer();
  for (const port of ports) if (!await free(port)) throw new Error(`Port ${port} is occupied; leave its owner alone.`);
  mkdirSync(store, { recursive: true, mode: 0o700 });
  mkdirSync(lock, { mode: 0o700 }); // Exclusive; a stale lock requires inspection, never automatic takeover.
  const evidence = join(store, `${new Date().toISOString().replaceAll(":", "-")}-${key}-${process.pid}`);
  mkdirSync(evidence, { mode: 0o700 });
  const saved = join(lock, "saved");
  mkdirSync(saved, { mode: 0o700 });
  const moved = [];
  const claimed = [];
  const children = [];
  const owned = new Map();
  let interrupted = false;
  let outcome = 1;
  const run = { root, evidence, webUrl: config.webUrl, convexUrl: config.convexUrl, owner: processInfo(process.pid) };
  const testArgs = filters.length ? filters : ["tests/ledger.spec.ts"];
  const summary = {
    startedAt: new Date().toISOString(),
    reason: process.env.TRACKER_VERIFY_REASON || "Manual verification of selected tests",
    revision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
    testArgs, outcome: "running", tests: [], cleanupOk: false,
  };
  const env = { ...process.env, ...config, E2E_KEEP_DATA: "0", E2E_WORKERS: "1" };
  delete env.E2E_BASE_URL;
  delete env.E2E_CONVEX_URL;
  const recordOwned = () => {
    for (const child of children) {
      if (!sameProcess(child.identity)) continue;
      for (const pid of descendants(child.pid)) {
        const info = processInfo(pid);
        if (info) owned.set(pid, info);
      }
    }
  };
  const stop = () => {
    interrupted = true;
    recordOwned();
    json(join(evidence, "owned-processes.json"), [...owned.values()]);
    for (const child of children) if (sameProcess(child.identity)) child.kill("SIGTERM");
    for (const info of owned.values()) if (sameProcess(info)) {
      try { process.kill(info.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    }
  };
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, stop);
  function start(args, logName) {
    const child = spawn("pnpm", args, { cwd: e2e, env, stdio: ["ignore", "pipe", "pipe"] });
    child.identity = processInfo(child.pid);
    children.push(child);
    let output = "";
    for (const stream of [child.stdout, child.stderr]) stream.on("data", (data) => {
      output += data.toString();
      writeFileSync(join(evidence, logName), output, { mode: 0o600 });
      process.stdout.write(data);
    });
    child.done = new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => resolve(code ?? 1));
    });
    return child;
  }
  const timer = setInterval(recordOwned, 250);
  try {
    json(join(evidence, "summary.json"), summary);
    json(manifest, run);
    for (const name of scratch) {
      if (existsSync(join(e2e, name))) { renameSync(join(e2e, name), join(saved, name)); moved.push(name); }
      claimed.push(name);
      json(manifest, { ...run, moved, claimed });
    }
    console.log(`Evidence: ${evidence}`);
    const runner = start(["exec", "node", "scripts/run.mjs", "--serve"], "launch.log");
    run.runner = runner.identity;
    json(manifest, { ...run, moved, claimed });
    const deadline = Date.now() + 6 * 60_000;
    while (!existsSync(join(evidence, "launch.log")) || !readFileSync(join(evidence, "launch.log"), "utf8").includes("E2E stack up:")) {
      if (interrupted || runner.exitCode !== null || runner.signalCode !== null || Date.now() > deadline) {
        throw new Error("Stack did not become ready; see launch.log.");
      }
      await sleep(500);
    }
    json(join(evidence, "doctor.json"), await doctor());
    json(join(evidence, "run.json"), {
      ...run, testArgs, startedAt: new Date().toISOString(),
      gitStatus: execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }),
    });
    env.PLAYWRIGHT_JSON_OUTPUT_FILE = join(evidence, "results.json");
    const tests = start(["exec", "playwright", "test", ...testArgs,
      "--workers=1", "--reporter=list,json", `--output=${join(evidence, "test-results")}`], "drive.log");
    outcome = await tests.done;
    const resultsFile = join(evidence, "results.json");
    const report = existsSync(resultsFile) ? JSON.parse(readFileSync(resultsFile, "utf8")) : null;
    const stats = report?.stats;
    summary.stats = stats;
    function recordSuite(suite, parents = []) {
      const path = [...parents, suite.title];
      for (const spec of suite.specs ?? []) {
        for (const test of spec.tests) summary.tests.push({
          title: [...path, spec.title].join(" › "), project: test.projectName, status: test.status,
        });
      }
      for (const child of suite.suites ?? []) recordSuite(child, path);
    }
    for (const suite of report?.suites ?? []) recordSuite(suite);
    if (!stats || stats.expected < 1 || stats.unexpected > 0 || stats.skipped > 0 || stats.flaky > 0) {
      outcome = 1;
    }
    const after = await ledger();
    json(join(evidence, "ledger-after.json"), after);
    summary.ledger = { ok: after.ok, checked: after.checked, problems: after.problems.length };
    if (!after.ok || after.problems.length) outcome = 1;
    if (outcome !== 0) throw new Error(`Verification failed (exit ${outcome}); evidence retained.`);
  } catch (error) {
    outcome = 1;
    summary.error = error.message;
    json(join(evidence, "failure.json"), { message: error.message });
    console.error(error.message);
  } finally {
    stop();
    const deadline = Date.now() + 15000;
    while ([...owned.values()].some(sameProcess) && Date.now() < deadline) await sleep(250);
    clearInterval(timer);
    for (const info of owned.values()) if (sameProcess(info)) {
      try { process.kill(info.pid, "SIGKILL"); } catch (error) {
        if (error.code !== "ESRCH") { outcome = 1; console.error(`Could not stop owned PID ${info.pid}: ${error.code}`); }
      }
    }
    let portsFree = await Promise.all(ports.map(free));
    const releaseDeadline = Date.now() + 5000;
    while ((!portsFree.every(Boolean) || [...owned.values()].some(sameProcess)) && Date.now() < releaseDeadline) {
      await sleep(250);
      portsFree = await Promise.all(ports.map(free));
    }
    if (existsSync(join(e2e, ".logs"))) cpSync(join(e2e, ".logs"), join(evidence, "server-logs"), { recursive: true });
    if (portsFree.every(Boolean) && ![...owned.values()].some(sameProcess)) {
      for (const name of claimed) rmSync(join(e2e, name), { force: true, recursive: true });
      for (const name of moved) renameSync(join(saved, name), join(e2e, name));
      rmSync(lock, { recursive: true });
      summary.cleanupOk = true;
      json(join(evidence, "cleanup.json"), { ok: true, portsFree: ports, restored: moved, evidenceRetained: existsSync(join(evidence, "summary.json")) });
    } else {
      outcome = 1;
      json(join(evidence, "cleanup.json"), { ok: false, portsFree, lock, message: "Inspect owned process identities in run.json; backup retained in lock/saved." });
    }
    summary.outcome = outcome === 0 ? "passed" : "failed";
    summary.finishedAt = new Date().toISOString();
    json(join(evidence, "summary.json"), summary);
    if (outcome === 0) compact(evidence);
    expire(store, key);
    console.log(`Evidence retained: ${evidence}`);
  }
  process.exitCode = outcome;
} else {
  console.log("Usage: verify.mjs run [Playwright test filters] | doctor\nDefault proof: tests/ledger.spec.ts. Each run launches, checks, drives, captures, and cleans up.");
  if (command !== "help") process.exitCode = 2;
}
