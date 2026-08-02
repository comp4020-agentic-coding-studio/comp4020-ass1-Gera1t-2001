# Process log — Assignment 1

One entry per commit, appended before the commit is made. See `CLAUDE.md` →
"Process Logging" for the rule and the format. `PROCESS.md` is drafted from
these entries at the end; it is not written directly.

---

- **Date/time:** 2026-08-02, evening
- **Tag:** `[harness]`
- **What happened:** Starting Assignment 1 in a fresh repo. The starter template
  ships a boilerplate `CLAUDE.md` identical to the one Crit 1 started from, so
  every rule I accumulated last week — the verification discipline, the model
  delegation policy, the process-logging system — would have reset to zero.
- **What I did instead of the obvious thing:** The obvious move is to copy last
  week's `CLAUDE.md` over the template wholesale. I diffed the two instead and
  merged them, because a straight copy carries Crit 1's prototype-specific rules
  into a deliverable they actively contradict: Crit 1's harness enforced "no
  JavaScript, by absence not omission" as a hard constraint, and Assignment 1's
  spec requires that "the visitor does something that changes what they see".
  Left in place, the agent would have been working against the brief. I dropped
  the four Crit 1-specific rules (no-JS, Ceefax palette, `.screen` viewport
  frame, Steam static snapshot) and generalised the verification rules buried in
  that same section — real render at both marking viewports, the sudo-less
  Playwright recipe, "say plainly what wasn't checked" — into a standalone
  section that holds for any prototype.
- **How I knew it was right:** Ran `diff -u` between the template's `CLAUDE.md`
  and Crit 1's before touching either, so the 149 lines of my own accretion were
  visible as a list and each one got a keep/drop decision rather than being
  swept along. Read Assignment 1's published spec alongside the diff to check
  each retained rule against the new contract.
- **Citation:** this commit; the `CLAUDE.md` diff against the template's
  boilerplate.
- **Curated prompt:** "clone Assignment 1 to local" → the start skill's harness
  carry-forward step.

---

- **Date/time:** 2026-08-02, late evening
- **Tag:** `[harness]`
- **What happened:** Assignment 1's spec says the core interaction has to be
  "plain enough to write a test for". The obvious reading is a test that clicks
  a control and checks the DOM, which needs a prototype to exist first.
- **What I did instead of the obvious thing:** Wrote the contract as tests
  against a pure function — `allocate(closed)` returning routed, stranded and
  detoured volume per flow — before any page existed, and put the interaction
  in the model rather than in the click handler. That makes the week's contract
  checkable without a browser, and the tests survive a change of rendering
  approach or of stack. The starter's `spec/invariants.test.ts` stays untouched;
  the new file sits alongside it.
- **How I knew it was right:** Ran `pnpm vitest run spec/assignment1.test.ts`
  against the empty repo first and confirmed it went red on a missing module —
  the tests had to fail for the right reason before they were worth anything.
  After the model landed, `pnpm check` went green at 69 tests.
- **Citation:** this commit; `spec/assignment1.test.ts` red → green.
- **Curated prompt:** "closing a chokepoint should also change the estimated
  daily transportable oil volume, not just the route."

---

- **Date/time:** 2026-08-02, late evening
- **Tag:** `[discarded]`
- **What happened:** The first allocation rule handed scarce bypass-pipeline
  capacity out first-come, in the order flows are declared. All 69 tests passed.
  But when I printed the actual scenario table, closing Hormuz gave the entire
  4.7 mb/d of bypass capacity to the single largest flow and left every other
  Persian Gulf flow at exactly zero.
- **What I did instead of the obvious thing:** The tests were green, so the
  obvious move was to keep going. I threw the allocator away and rewrote it as a
  pro-rata water-filling loop instead, because the output was an artefact of
  declaration order rather than a result — and because these pipelines belong to
  particular producers, so any priority rule is a claim about whose oil matters,
  which is exactly the kind of intent claim the data-honesty rule in CLAUDE.md
  forbids. Pro rata is the neutral rule.
- **How I knew it was right:** The rewrite made the Gulf flows keep a uniform
  23% each, except Basra, which keeps 0% — correct, because the Saudi and UAE
  bypass lines do not serve Iraqi crude, and the graph already encoded that.
  A result I had not put in by hand fell out of the model, and it matched the
  source data. `pnpm check` still green at 69 tests.
- **Citation:** this commit; the `routeFlow` → `routeAll` rewrite in
  `src/model/allocate.ts`, and the rule recorded in CLAUDE.md → "Modelling
  choices that change the numbers".

---

- **Date/time:** 2026-08-02, late evening
- **Tag:** `[judgement]`
- **What happened:** The "no dead controls" test — every chokepoint the visitor
  can close must change something — failed on Bab el-Mandeb. Nothing was
  stranded and no flow got measurably slower.
- **What I did instead of the obvious thing:** The obvious fix is to delete the
  assertion or special-case the strait. I checked the geography instead, and the
  model was right: Gulf-to-Europe crude moves onto Petroline, which discharges
  at Yanbu, north of Bab el-Mandeb, so the route changes without the clock
  moving. The test was too narrow, not the model. I broadened it to treat a
  change of path as a visible change, alongside days and stranded volume — which
  is what the spec line actually promises the visitor. I did also slow Petroline
  from 3 to 6 days, because 1,200 km of pipe plus two terminal transfers should
  never come out faster than sailing out of the Gulf.
- **How I knew it was right:** Dumped the per-flow route for the Bab el-Mandeb
  scenario and read the leg list before touching either file, rather than
  inferring from the assertion message. The same dump caught a second wrong
  assumption in the same suite: I had asserted Petroline carries nothing once
  Suez shuts, but SUMED reaches the Mediterranean without needing the Red Sea
  exits, so it is throttled to SUMED's 2.5 mb/d rather than severed.
- **Citation:** this commit; the `no dead controls` and `the Petroline trap`
  blocks in `spec/assignment1.test.ts`.
