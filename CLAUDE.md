# COMP4020 prototype

This is your starter repo for a COMP4020 prototype: a static site written in
HTML/CSS/TypeScript that builds to plain HTML/CSS/JS and deploys to GitHub
Pages. The **deployed site is what gets marked** --- not this repo, and not "it
works on my machine". It's marked live in Chrome against the deployed URL at two
viewports --- 1920×1080 (desktop) and 390×844 (phone) --- and both count in
full, so make that artefact good at both and use the checks below to know
whether it is.

What you're building this week — the spec — is published on the course website,
and this repo's name tells you which deliverable it is. Run the course plugin's
**start** skill at the start of each week: it pulls the right spec from the
course API, carries your harness forward from last week, and helps you turn the
spec's checkable lines into tests of your own. Read the spec before you build,
and see `spec/README.md` for how the checks in this repo relate to it.

## How to work in here

- Keep the dev server running (`pnpm dev`) so you see changes as you make them.
- Before you push, run `pnpm check`. It runs most of what CI runs --- build,
  lint, and the spec --- so you catch those in seconds instead of waiting for
  the pipeline. The links check, the evidence check, the secrets scan, and the
  deploy itself only run in CI; run `pnpm dlx linkinator ./dist --silent`
  locally against a fresh `pnpm build` for the links check without waiting for
  CI.
- To see what the page actually looks like rather than what you assume it looks
  like, open it in a browser (the `agent-browser` CLI, documented on
  [the course site](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/backpressure/#agent-browser-the-rendered-page-as-ground-truth),
  works well for this). The rendered page is the truth; your mental model of it
  isn't.
- When a check fails, read its output before changing anything. Each check below
  names what it measures, and the failure message is the instruction: it tells
  you the file, the line, or the contract. Treat a red check as authoritative
  --- the page is wrong until the check is green, not until you decide it should
  be.
- Commit when the checks pass. Never commit a red state.

## The checks (your sensors)

CI runs these on every push once your repo is public. GitHub's checks UI shows
two jobs, `check` and `deploy` --- not one status per sensor below --- and
within `check` the steps run in sequence (`pnpm check` chains typecheck, build,
lint, and the spec with `&&`), so an early failure like a broken build stops the
later sensors from running for that push; fix it and push again to see the rest.
While the repo is private (all week, until you ship) the CI jobs stay skipped
--- `pnpm check` is the same roster on your machine, and it's the faster loop
anyway. They aren't hoops. Each is a different way of finding out something true
about the site that you can't reliably see by looking at it.

They also carry a mark at a crit: the sweep runs fifteen minutes after your
cutoff, and green checks there are worth half that week's shipped mark. Still
running counts as not green, so ship with time for CI to finish.

- **typecheck** --- `tsc --noEmit` runs first in `pnpm check`, so a type error
  stops the roster before the build even starts. The types are extra
  backpressure: a red here is the compiler telling you a claim in the code is
  false.
- **build** --- the site must build (`pnpm build`). A build failure means the
  deployed site is broken or stale, so nothing else matters until this is green.
- **deploy / online** --- the live GitHub Pages URL must load and return the
  page you expect. An asset that 404s on the deployed URL counts as broken even
  if it loads locally.
- **spec** --- `spec/invariants.test.ts` asserts what's true of any good
  website, whatever the week's brief asks; the tests you write for the week's
  own spec run alongside it (any `spec/*.test.ts`). A failure names the contract
  you haven't met yet.
- **lint** --- `stylelint` for CSS, `oxlint` for TypeScript. Flags code that's
  wrong, fragile, or non-idiomatic. Read the rule it names.
- **tests** --- any other tests you write, wherever you put them (co-located
  with your source is fine, not just `spec/`), must pass. Vitest picks up both
  this and the spec suite in one `vitest run`, the last step of `pnpm check`. A
  failing test is a claim about the site that's no longer true.
- **evidence** (`pnpm check:evidence`) --- checks your process evidence:
  `PROCESS.md`'s citations resolve to real commits, the current deliverable's
  exact reflection is in `reflections/` (worked out from this repo's name
  against the public course API), and your `CLAUDE.md` is present. Evidence
  gates the deploy --- `deploy` needs `check` to pass, so failing evidence
  blocks the deploy alongside everything else. See
  [Your process is part of the mark](#your-process-is-part-of-the-mark) below,
  and the course website's
  [assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#what-you-submit)
  for what counts as evidence.
- **links** --- internal links must resolve. A broken link is a dead end you
  didn't mean to ship.
- **secrets** --- the repo is scanned for committed credentials. Never put a
  key, token, or password in a tracked file. If one leaks, rotate it. A local
  pre-commit hook (`.githooks/pre-commit`, installed by `pnpm install`) also
  blocks any commit containing something shaped like an API key --- by the time
  CI sees a key it's already pushed, so the hook is the sensor that matters.

Nothing here measures **accessibility** or **performance** --- wiring those
sensors (`axe-core`, Lighthouse, or whatever you choose) is your work, and later
in the course the spec will ask you to show how you tested both. When you do,
read a green performance result honestly: it's a lab estimate from one run on a
CI machine, not proof the site is fast for real users.

## The stack is swappable

Out of the box this is plain HTML/CSS/TypeScript on Vite, and every `.html` file
in the repo is a page: add pages, link them, and the build picks them up with no
config. That's a default, not a rule (unless the week's spec says otherwise).
You can swap in Astro or any other static generator, because nothing in CI names
a tool --- the whole contract is:

- `pnpm build` emits the complete site into `dist/`
- the `package.json` scripts (`check`, `check:evidence`, `build`) keep working
- whatever lands in `dist/` still passes the invariants in `spec/`

Two things bite in a swap. The deployed site lives under a path
(`…github.io/<repo>/`), so configure your generator's base path --- this
template's Vite config uses relative asset URLs to sidestep that, but most
generators (Astro included) need `base` set explicitly, and getting it wrong
looks fine locally while every asset 404s on the live URL. And commit the
updated `pnpm-lock.yaml`: CI installs with `--frozen-lockfile`.

## Your process is part of the mark

The deployed page is only half of it. How you got there is marked too: your
commit history, your agent files, and the decisions visible across them. The
checks above can't see any of that, so a person reads it directly --- which
means building legibly is part of building well.

- **Commit as you go.** Small, frequent commits are the record of how the work
  came together, and that record is read, not just the final state. A trail that
  grew alongside the code is the strongest evidence of your process; a single
  dump the night before is the weakest.
- **Keep a process overview** (`PROCESS.md`). A short reading-guide, not an
  essay: what you built, the moments that mattered --- each pointing at a
  commit, a `CLAUDE.md` change, or a prompt and the commit it produced --- and
  where to look in the history. It points a marker at the evidence; it doesn't
  stand in for it, and claims the history doesn't back don't count. The
  `PROCESS.md` in this repo is a template showing the shape and the citation
  format (link text the commit hash or range, target the commit or compare URL);
  `pnpm check:evidence` verifies your citations resolve to real commits before
  you ship. Markers follow those citations and don't trawl the repo for evidence
  you didn't cite.
- **Write your reflection in `reflections/`** --- a short markdown file in this
  repo, named for the deliverable it answers, so the number in the filename is
  the number in this repo's name (`crit-1.md` in `comp4020-crit1-<you>`,
  `assignment-1.md` in `comp4020-ass1-<you>`); `reflections/README.md` has the
  full rule. `pnpm check:evidence` checks the exact current name against the
  course API, not merely the presence of any well-named file. It answers the two
  standing prompts: the breakthrough that moved the work forward, and what this
  work changed about the developer you want to be. It stays out of the deployed
  site. It's due at the cutoff, and if it isn't in the repo by then the week
  doesn't count as shipped, however good the prototype is.
- **This file is process evidence.** The harness you build to direct the agent,
  this `CLAUDE.md` and any `AGENTS.md`, is itself read as part of how you
  worked. Keep it honest and current (see below).

You don't need a name, a student number, or any identity file in the repo: we
know whose repo it is. Spend the effort on the work.

## This file is yours

This CLAUDE.md is a starting point, not a fixed rulebook. As you learn what your
prototype needs --- a convention to hold the agent to, a sensor that keeps
catching you out, a fact about the stack the agent keeps getting wrong --- write
it down here. Growing this file is the work of harness engineering, and the gap
between this boilerplate and your own version is part of what your prototype
says about the developer you're becoming.

---

Everything below this line is carried forward from earlier deliverables in this
course. Rules specific to a past prototype have been dropped; what remains is
what held true regardless of what was being built.

## Verifying what you actually shipped

- **`pnpm check` does not prove the page looks right.** Typecheck, build, lint
  and the spec suite all pass on a page with a dead black band filling most of
  the viewport --- that exact bug shipped once and was caught only by looking at
  a real render
  ([`c8392bd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit1-Gera1t-2001/commit/c8392bdf8319d94e85433d576f15c5d19e99ecb7)).
- **Look at the built page at both marking viewports** --- 1920×1080 and
  390×844 --- not at whatever size the dev server window happens to be. A page
  can look fine at its natural content height while leaving most of a desktop
  viewport empty. The `agent-browser` CLI is the supported way to do this.
- **If the sandbox has no root and no browser**, a Chromium/Playwright shell can
  still be gotten without sudo: `apt-get download <pkg>` then
  `dpkg-deb -x <pkg>.deb .` to unpack the `.deb`s (fonts, missing shared libs
  such as `libnspr4`) into a local prefix, point the right env vars at it, and
  run Playwright against that. The working recipe, verified in this repo:

  ```sh
  # One-time: the Playwright chromium in ~/.cache is missing three libs.
  mkdir -p ~/.local/chrome-libs && cd ~/.local/chrome-libs
  apt-get download libnspr4 libnss3 libasound2t64
  for d in *.deb; do dpkg-deb -x "$d" .; done

  # Every time:
  export LD_LIBRARY_PATH="$HOME/.local/chrome-libs/usr/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"
  CHROME=~/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome
  pnpm build && pnpm preview --port 4173   # note the port it actually binds
  $CHROME --headless --disable-gpu --no-sandbox --hide-scrollbars \
    --virtual-time-budget=6000 --window-size=1920,1080 \
    --screenshot=/tmp/desktop.png "http://localhost:<port>/#closed=hormuz"
  ```

- **Serve over HTTP, never `file://`.** A module script will not load from
  `file://` — the page renders as unstyled markup with no interface at all,
  which looks like a catastrophic bug and is only the protocol. `pnpm preview`
  also matches how GitHub Pages actually serves the site.
- **Check which port `pnpm preview` bound.** It silently moves to the next free
  port when 4173 is taken — including by a preview left running from another
  week's repo. Screenshotting the wrong port produces a perfect-looking render
  of last week's prototype.
- **Any state of the model can be screenshotted directly** via the URL hash
  (`#closed=hormuz,suez`), so verifying an interaction needs no browser
  driver — just a second screenshot at a different URL.
- **Say plainly what wasn't checked.** If a change was only verified by
  `pnpm check` and not by looking at a real render, say so instead of implying
  full verification. That gap is what let the viewport bug above ship in the
  first place.

## Model choice for delegated work

- **Coding and execution** --- writing code, running checks, git operations ---
  default to whichever model the main session is already running. Don't spin up
  a subagent with a model override just to make a small edit or run a command.
- **Ideas, design discussion, and open-ended brainstorming**: when weighing a
  non-trivial choice (a design direction, an ambiguous trade-off, "what should
  this look like"), consult an Opus subagent to think it through or give a
  second opinion before settling on an approach, instead of only reasoning it
  out inline.
- **Review and verification that calls for real judgement** --- code review, or
  looking at a rendered page --- also goes to an Opus subagent, the way the
  viewport-fill bug was actually caught: `pnpm check` alone didn't see it, a
  dedicated Opus review pass did
  ([`c8392bd`](https://github.com/comp4020-agentic-coding-studio/comp4020-crit1-Gera1t-2001/commit/c8392bdf8319d94e85433d576f15c5d19e99ecb7)).

## Process Logging (for PROCESS.md / COMP4020)

### Language rule

Chat with the human may happen in any language, but every file committed to this
repo --- code, comments, commit messages, this CLAUDE.md, `process-log.md`,
`PROCESS.md`, `reflections/*.md` --- must be written in English.

### Logging rule

Append one entry to `process-log.md` (create it if it doesn't exist) immediately
before every `git commit` --- one entry per commit, no exceptions, even for a
trivial commit. Never judge whether a commit is "significant enough" to log; the
commit itself is the trigger, not a guess about its importance. A session or
context window is not an observable event the way a commit is, and a single
session can span several commits (or a single piece of work can span several
sessions via context-window compaction) --- anchoring to the commit avoids both
a blurred multi-task entry and a task split across dangling half-entries.

Backstop: if a session (or context window) ends with uncommitted work, or with a
decision that never produced a commit at all --- a rule change still under
discussion, a review pass, a rejected approach --- log it then anyway, in the
same format, marked `(no commit)`.

Tag each entry as one of:

- `[routine]` --- re-prompted until it passed; nothing structural changed
- `[harness]` --- a rule was added to CLAUDE.md, or a check/test was wired in,
  because of a recurring mistake
- `[discarded]` --- a plausible-looking output was rejected in favor of a
  different approach
- `[judgement]` --- a non-obvious scoping/design call was made

### Log entry format

Structure each entry around the four things a PROCESS.md moment needs, so it can
be lifted almost directly later:

- **Date/time:**
- **Tag:**
- **What happened:** the problem, or what the agent got wrong (1-2 sentences)
- **What I did instead of the obvious thing:** the call made, and why it beat
  the obvious one (1-2 sentences)
- **How I knew it was right:** the check run, the viewport looked at, what was
  read before accepting the diff
- **Citation:** the exact commit hash or range (run `git log -1 --format=%h`
  after committing), OR the CLAUDE.md diff, OR the check name that went
  red → green
- **Curated prompt (if relevant):** the human's prompt that produced this
  commit, trimmed to the essential ask --- not a full transcript

Don't inflate routine work into a bigger-sounding tag. If nothing this session
qualifies as harness/discarded/judgement, `[routine]` is the honest answer.

### PROCESS.md rule

Never write directly to PROCESS.md during normal work. Only touch it when
explicitly asked to "update PROCESS.md" or "draft PROCESS.md from the log". When
asked:

1. Pull entries tagged `[harness]`, `[discarded]`, `[judgement]` from
   process-log.md --- prioritize `[harness]` first.
2. Choose the number of moments to match the deliverable:
   - **Assignment (A1/A2/A3):** 3-4 moments, 400-600 words total (check the
     specific brief for its exact word/moment count).
   - **Weekly crit prototype:** fewer moments is fine --- 1-2 is enough if
     that's genuinely what the week produced. Don't pad a quiet week to hit an
     assignment-sized count.
3. Write each moment following the repo's PROCESS.md template exactly: what
   happened → what I did instead of the obvious thing → how I knew it was
   right → citation (commit hash/range as a clickable link pointing at the
   repo's commit or compare URL, or a CLAUDE.md change, or a check that went
   red → green).
4. Verify every citation resolves before finishing --- run
   `pnpm check:evidence` and fix any broken links.

For Assignment 1 specifically the brief fixes these numbers: **400--600 words,
three or four moments, not more.** The strongest moments are the ones where a
correction landed in this harness rather than in another prompt.

## What this prototype needs (Assignment 1: chokepoints)

The core interaction, stated once so everything else can be checked against it:

> **Closing a chokepoint re-allocates every oil flow that transits it.** Each
> flow tries a sea reroute that avoids every closed chokepoint, then bypass
> pipelines up to their capacity, and whatever fits in neither is **stranded**.
> The stranded total in million barrels per day is what the visitor watches
> move.

`spec/assignment1.test.ts` asserts that contract at the model level, against
`allocate()` rather than against the DOM, so the tests survive a change of
rendering approach. Keep them that way — a test that reaches into markup has to
be rewritten every time the page changes, and stops being backpressure.

### Data honesty

This is the rule the whole piece stands on. A prototype arguing that people
misjudge which chokepoints matter has no standing if its own numbers are
invented.

- **Every figure carries a `source` string.** Chokepoints, flows, legs and
  bypasses all have the field, and `spec/assignment1.test.ts` fails if one is
  empty. A number without a citation does not go in.
- **Mark derived and illustrative figures as such**, in the `source` text, in
  capitals. `DERIVED` means apportioned or residual — computed so named flows
  reconcile to a published total. `ILLUSTRATIVE` means order-of-magnitude only
  and not load-bearing (the two control flows). Never let a derived figure read
  as a measured one.
- **The graph is a calibrated snapshot, not a routing engine.** Transit days
  are estimates tuned to published anchors, and the anchors are named in
  `src/data/network.ts`. Say "calibrated estimate", never imply precision the
  data does not have.
- **State coverage limits rather than hiding them.** Modelled Malacca traffic
  is below EIA's figure because only Persian Gulf origins are modelled. That
  belongs in a comment and on the page, not in a footnote nobody reads.
- **One unit.** Everything is million barrels per day. LNG is measured in
  Bcf/d, so LNG stays out — two units on one screen means a stranded total
  that cannot be added up.
- **Structural claims only, never claims about intent.** "This strait has no
  sea alternative and 4.7 mb/d of pipeline bypass" is in scope. Who might close
  it, or why, is not. The argument is about geography and capacity; the moment
  it becomes commentary it stops being an explainer.

### Modelling choices that change the numbers

Both of these are judgement calls, not facts. They are documented in
`src/model/allocate.ts` and they need to stay documented — a reader who cannot
see the assumption cannot check the result.

- **Bypasses are priced above their transit time** (`BYPASS_PENALTY`), because
  sea transport is cheaper per barrel than a pipeline needing two ship-to-shore
  transfers. Tuned so no bypass carries anything at baseline and each is
  reached for when its own chokepoint closes.
- **Scarce capacity is shared pro rata**, not first-come. First-come was tried
  and rejected: with Hormuz shut it gave all 4.7 mb/d of bypass to whichever
  flow happened to be declared first and zeroed the rest, which is an artefact
  of list order rather than a result. Pro rata is also the neutral rule, which
  the intent constraint above requires.

### Two things the model got right that look wrong at first

Both were caught by a failing test and are worth not re-breaking:

- **Closing Bab el-Mandeb barely delays Gulf-to-Europe crude** — it moves onto
  Petroline, which reaches Yanbu *north* of the strait. The route changes
  without the clock moving much. A "did anything change" check therefore has to
  compare the path as well as the days and the volume.
- **Petroline is throttled, not severed, when Suez shuts too.** SUMED runs from
  Ain Sukhna to the Mediterranean and bypasses the canal without needing the
  Red Sea exits, so Petroline's throughput is capped by SUMED's 2.5 mb/d rather
  than dropping to zero. The first draft of the test asserted zero and was
  wrong about the geography.
