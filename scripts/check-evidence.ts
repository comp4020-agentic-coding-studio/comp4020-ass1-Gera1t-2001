#!/usr/bin/env node
// Checks the process evidence every submission carries: PROCESS.md with its
// template boilerplate gone, every cited commit hash resolving to a real
// commit in this repo (a citation is a markdown link whose text is an
// abbreviated SHA or a sha...sha range), the current deliverable's exact
// reflection entry, and your CLAUDE.md. Bare minimum, on purpose.
//
// The current deliverable is worked out live: the repo's name carries the
// deliverable prefix (repo = <repoPrefix>-<handle>), and the course API says
// which of that prefix's deliverables is current this week. No local state.
// If the API can't be reached the reflection check is skipped with a warning
// rather than failing — a network blip must never block a ship at the cutoff.
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const API_URL =
  process.env.COMP4020_CRIT_GROUPS_URL ??
  "https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/api/crit-groups.json";

const REFLECTION_NAME = /^(crit-\d+|assignment-\d+|final-project)\.md$/;

export type Deliverable = {
  kind: "crit" | "assessment";
  slug: string;
  week: number;
  repoPrefix?: string;
};

export type Payload = {
  timezone: string;
  weeks: { week: number; monday: string }[];
  deliverables: Deliverable[];
};

// The repo's name is the one fact linking this working copy to a published
// deliverable. In CI it's authoritative; locally it comes from origin.
export function repoName(): string | undefined {
  const fromCI = process.env.GITHUB_REPOSITORY?.split("/").at(-1);
  if (fromCI) return fromCI;
  try {
    const origin = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      encoding: "utf8",
    }).trim();
    return origin
      .replace(/\.git$/, "")
      .split(/[/:]/)
      .filter(Boolean)
      .at(-1);
  } catch {
    return undefined;
  }
}

// Which of this repo's deliverables is current: the latest one whose teaching
// week has started, else the first still to come. An assessment outranks a
// crit in a shared week — the retro crit reads the assignment's reflection.
export function currentDeliverable(
  payload: Payload,
  repo: string,
  today: string,
): Deliverable | undefined {
  const mine = payload.deliverables
    .filter((d) => d.repoPrefix && repo.startsWith(`${d.repoPrefix}-`))
    .toSorted((a, b) => a.week - b.week);
  if (mine.length === 0) return undefined;
  const currentWeek = Math.max(
    0,
    ...payload.weeks.filter((w) => w.monday <= today).map((w) => w.week),
  );
  const pick = mine.findLast((d) => d.week <= currentWeek) ?? mine[0];
  return mine.find((d) => d.week === pick.week && d.kind === "assessment") ?? pick;
}

export function reflectionFor(deliverable: Deliverable): string {
  if (deliverable.kind === "assessment") return `${deliverable.slug}.md`;
  return `crit-${Number.parseInt(deliverable.slug, 10)}.md`;
}

function resolves(sha: string): boolean {
  try {
    execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Every commit hash a file cites: the text of a markdown link, the hash in that
 * link's target URL, and bare backticked hashes used as citations in prose.
 *
 * Bare hashes are only taken at 7–10 characters or exactly 40, the lengths git
 * abbreviations and full SHAs actually take. Lengths in between are skipped
 * because a process log legitimately quotes other hex digests — md5 prefixes of
 * screenshots, for one — and a check that fails on those would be turned off.
 */
export function citationsIn(src: string): Set<string> {
  const shas = new Set<string>();
  for (const m of src.matchAll(/\[`?([0-9a-f]{7,40}(?:\.\.\.[0-9a-f]{7,40})?)`?\]\(/g)) {
    for (const sha of m[1].split("...")) shas.add(sha);
  }
  for (const m of src.matchAll(/\/(?:commit|compare)\/([0-9a-f.]{7,90})/g)) {
    for (const sha of m[1].split("...")) if (/^[0-9a-f]{7,40}$/.test(sha)) shas.add(sha);
  }
  for (const m of src.matchAll(/`([0-9a-f]{7,10}|[0-9a-f]{40})`/g)) shas.add(m[1]);
  return shas;
}

/** Markdown citations as [link text, hash in the target URL] pairs. */
export function linkPairs(src: string): [string, string][] {
  const pairs: [string, string][] = [];
  for (const m of src.matchAll(
    /\[`?([0-9a-f]{7,40})`?\]\(https?:\/\/[^)]*?\/(?:commit|compare)\/([0-9a-f]{7,40})/g,
  )) {
    pairs.push([m[1], m[2]]);
  }
  return pairs;
}

function todayIn(timezone: string): string {
  // en-CA renders as YYYY-MM-DD, matching the API's monday strings
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
}

async function main(): Promise<void> {
  let failed = false;
  const fail = (msg: string): void => {
    console.error(`✗ ${msg}`);
    failed = true;
  };
  const skip = (msg: string): void => {
    console.warn(`! ${msg}`);
  };

  if (!existsSync("CLAUDE.md")) {
    fail("no CLAUDE.md in the repo root — the harness is part of what's marked");
  }

  const reflections = existsSync("reflections")
    ? readdirSync("reflections").filter((f) => f.endsWith(".md") && f !== "README.md")
    : [];
  for (const f of reflections.filter((name) => !REFLECTION_NAME.test(name))) {
    console.warn(`! reflections/${f} isn't a name the marker reads, so it won't be marked`);
  }

  const repo = repoName();
  if (!repo) {
    skip("no origin remote to name this repo — skipping the current-reflection check");
  } else {
    let payload: Payload | undefined;
    try {
      const response = await fetch(API_URL, { signal: AbortSignal.timeout(10_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      payload = (await response.json()) as Payload;
    } catch {
      skip(`couldn't reach the course API — skipping the current-reflection check (${API_URL})`);
    }
    if (payload) {
      const deliverable = currentDeliverable(payload, repo, todayIn(payload.timezone));
      if (!deliverable) {
        skip(`${repo} doesn't carry a course repo prefix — skipping the current-reflection check`);
      } else {
        const expected = reflectionFor(deliverable);
        if (reflections.includes(expected)) {
          console.log(`✓ reflections/${expected}: current deliverable entry (${deliverable.slug})`);
        } else {
          fail(
            `current reflection is missing — the marker reads reflections/${expected} for ${deliverable.slug}`,
          );
        }
      }
    }
  }

  if (!existsSync("PROCESS.md")) {
    fail("no PROCESS.md in the repo root");
    process.exit(1);
  }

  const src = readFileSync("PROCESS.md", "utf8");

  if (src.includes("TEMPLATE:")) {
    fail(
      "PROCESS.md still contains the template comment — replace the boilerplate with your own overview",
    );
  }

  const shas = citationsIn(src);

  if (shas.size === 0) {
    fail("no commit citations found — cite each moment as [`<sha>`](<commit or compare URL>)");
  }

  for (const sha of shas) {
    if (!resolves(sha)) fail(`cited commit ${sha} doesn't exist in this repo`);
  }

  // A link's *text* being a real hash says nothing about where it points, and a
  // wrong target renders as a perfectly ordinary link. Check both agree.
  for (const [text, target] of linkPairs(src)) {
    if (!target.startsWith(text) && !text.startsWith(target)) {
      fail(`PROCESS.md: [\`${text}\`] links to ${target.slice(0, 12)}, a different commit`);
    }
  }

  // process-log.md carries most of the process evidence and was never read
  // here, so a fabricated hash in it was invisible to the whole roster. Same
  // rules, applied to the same kinds of citation.
  if (existsSync("process-log.md")) {
    const log = readFileSync("process-log.md", "utf8");
    const logShas = citationsIn(log);
    for (const sha of logShas) {
      if (!resolves(sha)) fail(`process-log.md cites ${sha}, which doesn't exist in this repo`);
    }
    for (const [text, target] of linkPairs(log)) {
      if (!target.startsWith(text) && !text.startsWith(target)) {
        fail(`process-log.md: [\`${text}\`] links to ${target.slice(0, 12)}, a different commit`);
      }
    }
    if (!failed) {
      console.log(`✓ process-log.md: ${logShas.size} cited commit(s) all resolve`);
    }
  } else {
    skip("no process-log.md — nothing to check its citations against");
  }

  // Images are deliberately not checked. Whether one renders is visible the
  // moment you look at PROCESS.md on GitHub, which is where it's read — unlike a
  // citation whose SHA doesn't resolve, which looks perfectly fine rendered.
  // This check covers what you can't see by looking; the rest is on you.

  if (failed) process.exit(1);
  console.log(`✓ PROCESS.md: ${shas.size} cited commit(s) all resolve`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
