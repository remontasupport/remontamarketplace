#!/usr/bin/env node
/**
 * Quality baseline checker.
 *
 * The problem this solves: the project carries 149 TypeScript errors and ~523
 * ESLint errors. Turning the compiler and linter on at build time would fail
 * every build, so `next.config.ts` still suppresses both. That leaves nothing
 * stopping a new error from being added.
 *
 * This script is the gate instead. It records the known findings in a baseline
 * file and fails only on findings that are NOT in it. Existing debt is
 * tolerated; new debt is not.
 *
 * Signatures deliberately EXCLUDE line and column numbers. A signature is
 * `<file>::<rule-or-code>` with an occurrence count. Adding an unrelated line
 * near an existing error shifts its position but not its signature, so
 * unrelated edits do not produce false failures. Adding a genuinely new error
 * raises the count for that signature, which does fail.
 *
 * Usage:
 *   node scripts/check-baseline.mjs --tool=typescript
 *   node scripts/check-baseline.mjs --tool=eslint
 *   node scripts/check-baseline.mjs --tool=typescript --update
 *
 * Exit codes: 0 = no new findings, 1 = new findings, 2 = script or tool failure.
 */

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const BASELINE_DIR = ".quality-baseline";
const TOOLS = ["typescript", "eslint"];

const args = process.argv.slice(2);
const toolArg = args.find((a) => a.startsWith("--tool="));
const shouldUpdate = args.includes("--update");
const tool = toolArg?.split("=")[1];

if (!TOOLS.includes(tool)) {
  console.error(`Usage: check-baseline.mjs --tool=<${TOOLS.join("|")}> [--update]`);
  process.exit(2);
}

const baselineFile = join(BASELINE_DIR, `${tool}.txt`);

/** Normalise a path so baselines are comparable across Windows and CI. */
function normalisePath(p) {
  return p
    .replace(/\\/g, "/")
    .replace(process.cwd().replace(/\\/g, "/") + "/", "")
    .replace(/^\.\//, "");
}

/**
 * Run a command and return stdout. Both tsc and eslint exit non-zero when they
 * find problems, which is their normal reporting path and not a failure of this
 * script — so a non-zero exit with usable stdout is accepted. A non-zero exit
 * with no stdout means the tool itself broke, which is exit code 2.
 */
function run(cmd, cmdArgs) {
  try {
    return execFileSync(cmd, cmdArgs, {
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
      shell: process.platform === "win32",
    });
  } catch (err) {
    if (typeof err.stdout === "string" && err.stdout.length > 0) return err.stdout;
    console.error(`[check-baseline] ${tool} failed to run:\n${err.stderr || err.message}`);
    process.exit(2);
  }
}

/**
 * Findings in generated output are excluded from the baseline.
 *
 * tsconfig deliberately includes `.next/types/**` so Next can type-check route
 * signatures, but those files only exist after a build. Including them would
 * make the baseline non-deterministic: a clean checkout reports one count and a
 * built tree reports another, so the gate would fail for reasons unrelated to
 * the change under review.
 *
 * This is not the same as ignoring the problems. Errors under .next/types are
 * real and are reported by `npm run type-check` and by a production build; they
 * are simply not baselined, because a baseline has to be reproducible.
 */
function isGeneratedPath(p) {
  return p.startsWith(".next/") || p.startsWith("src/generated/");
}

/** TypeScript: parse `path(line,col): error TS1234: message`. */
function collectTypescript() {
  const out = run("npx", ["tsc", "--noEmit"]);
  const findings = new Map();
  for (const line of out.split(/\r?\n/)) {
    const m = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):/);
    if (!m) continue;
    const file = normalisePath(m[1]);
    if (isGeneratedPath(file)) continue;
    const sig = `${file}::${m[4]}`;
    findings.set(sig, (findings.get(sig) ?? 0) + 1);
  }
  return findings;
}

/** ESLint: use the JSON formatter rather than parsing human output. */
function collectEslint() {
  const out = run("npx", ["eslint", ".", "--format", "json"]);
  const jsonStart = out.indexOf("[");
  if (jsonStart === -1) {
    console.error("[check-baseline] eslint produced no JSON output");
    process.exit(2);
  }
  let results;
  try {
    results = JSON.parse(out.slice(jsonStart));
  } catch {
    console.error("[check-baseline] could not parse eslint JSON output");
    process.exit(2);
  }
  const findings = new Map();
  for (const file of results) {
    for (const msg of file.messages) {
      // severity 2 = error. Warnings are recorded but not gated, so that the
      // 355 existing warnings do not have to be cleared before this is useful.
      if (msg.severity !== 2) continue;
      const rule = msg.ruleId ?? "parse-error";
      const sig = `${normalisePath(file.filePath)}::${rule}`;
      findings.set(sig, (findings.get(sig) ?? 0) + 1);
    }
  }
  return findings;
}

function serialise(findings) {
  return (
    [...findings.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sig, count]) => `${count}\t${sig}`)
      .join("\n") + "\n"
  );
}

function deserialise(text) {
  const findings = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.startsWith("#")) continue;
    const [count, sig] = line.split("\t");
    if (sig) findings.set(sig, Number(count));
  }
  return findings;
}

const current = tool === "typescript" ? collectTypescript() : collectEslint();
const total = [...current.values()].reduce((a, b) => a + b, 0);

if (shouldUpdate) {
  mkdirSync(BASELINE_DIR, { recursive: true });
  writeFileSync(baselineFile, serialise(current), "utf8");
  console.log(`[check-baseline] wrote ${baselineFile}`);
  console.log(`[check-baseline] ${tool}: ${total} findings across ${current.size} signatures`);
  process.exit(0);
}

if (!existsSync(baselineFile)) {
  console.error(`[check-baseline] no baseline at ${baselineFile}. Run with --update first.`);
  process.exit(2);
}

const baseline = deserialise(readFileSync(baselineFile, "utf8"));

const added = [];
const fixed = [];

for (const [sig, count] of current) {
  const known = baseline.get(sig) ?? 0;
  if (count > known) added.push({ sig, count, known });
}
for (const [sig, known] of baseline) {
  const count = current.get(sig) ?? 0;
  if (count < known) fixed.push({ sig, count, known });
}

if (fixed.length > 0) {
  console.log(`[check-baseline] ${fixed.length} signature(s) improved since the baseline:`);
  for (const f of fixed.slice(0, 20)) {
    console.log(`  - ${f.sig}  ${f.known} -> ${f.count}`);
  }
  if (fixed.length > 20) console.log(`  ... and ${fixed.length - 20} more`);
  console.log(`  Tighten the baseline: node scripts/check-baseline.mjs --tool=${tool} --update`);
}

if (added.length > 0) {
  console.error(`\n[check-baseline] FAILED — ${added.length} new ${tool} finding(s):`);
  for (const a of added) {
    console.error(`  + ${a.sig}  ${a.known} -> ${a.count}`);
  }
  console.error(
    `\nThese are not in ${baselineFile}. Fix them, or if genuinely intended,\n` +
      `update the baseline deliberately and say why in the commit message.`
  );
  process.exit(1);
}

console.log(`[check-baseline] OK — ${tool}: ${total} findings, all known.`);
process.exit(0);
