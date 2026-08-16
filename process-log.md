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

---

- **Date/time:** 2026-08-02, late evening
- **Tag:** `[harness]`
- **What happened:** With 85 tests green I had no evidence the page looked
  right, only that it was correct. The first real render was unstyled markup
  with no interface at all — a module script will not load over `file://` — and
  the second, served properly, showed shipping lanes cutting straight across
  the Arabian Peninsula, Anatolia and South America.
- **What I did instead of the obvious thing:** Rather than eyeball the dev
  server and move on, I got a real headless Chromium working without root
  (`apt-get download` + `dpkg-deb -x` for libnspr4, libnss3 and libasound2t64
  into a local prefix) and screenshotted both marking viewports. Then, instead
  of hand-waving the land crossings, I separated cartography from routing: legs
  now bend through their chokepoints, with a `LEG_SHAPES` table for the ones
  that need more. None of it touches the allocation, so the model stayed
  provably unchanged while the map became legible.
- **How I knew it was right:** Looked at 1920×1080 and 390×844 before and after,
  and confirmed the line into the Gulf now threads Hormuz rather than crossing
  Saudi Arabia. The wrong-port trap caught me once — a preview left running from
  the Crit 1 repo meant my first two screenshots were of last week's site, which
  I only noticed because the file size matched a Crit 1 screenshot byte for
  byte. Both failure modes are now written into CLAUDE.md with the working
  commands.
- **Citation:** this commit; CLAUDE.md → "Verifying what you actually shipped",
  and `LEG_SHAPES` in `src/data/network.ts`.

---

- **Date/time:** 2026-08-02, late evening
- **Tag:** `[judgement]`
- **What happened:** Screenshotting a *closed* chokepoint needs the browser
  driven, not just loaded. The obvious answer was a Playwright dependency, or a
  test-only hook to force state.
- **What I did instead of the obvious thing:** Put the closed set in the URL
  hash instead — `#closed=hormuz,bab-el-mandeb`. It is a real feature, not
  scaffolding: someone who finds a state worth showing can send it, and the
  crit demo can jump straight to a scenario rather than clicking to it live.
  Verification falls out for free, because any state is now a URL a plain
  `--screenshot` can open. No new dependency, and no product code that exists
  only for the tests.
- **How I knew it was right:** Screenshotted `#closed=hormuz` at both viewports
  and read the result: 16.10 mb/d in red, Ras Tanura ringed with stranded
  volume, the Gulf routes amber, Petroline showing as a dashed line, and both
  control flows still teal and unmoved. Round-trip and unknown-id handling are
  covered by four tests in `spec/interaction.test.ts`.
- **Citation:** this commit; `src/ui/permalink.ts` and the "a state is
  shareable" block in `spec/interaction.test.ts`.

---

- **Date/time:** 2026-08-03, just after midnight
- **Tag:** `[harness]`
- **What happened:** Reviewing the built page against the brief, I found the
  readout only reported stranded volume. Four of the seven chokepoints strand
  nothing, so closing Malacca — the largest oil chokepoint on earth — showed
  `0.00` and read as a switch that did not work. The single most important
  comparison in the piece was rendering as a bug.
- **What I did instead of the obvious thing:** The obvious fix is to add a
  "days added" number and move on. I added a test first — a UI-level
  counterpart to the model's `no dead controls`, asserting that the readout
  text changes for every one of the seven — so the failure mode cannot come
  back silently under a future redesign. Then the panel gained a detour line
  and a verdict, and the verdict sentence is generated from the result rather
  than written per chokepoint, so it cannot drift out of step with the model.
  That last choice caught an awkward case for free: the Danish Straits have no
  sea alternative but still move 0.2 mb/d through the Kiel Canal, so a canned
  "nothing gets out" would have been a lie. The generated version says "almost
  nothing".
- **How I knew it was right:** Screenshotted `#closed=malacca` and
  `#closed=turkish` at 1920×1080 and read them side by side. Malacca: 0.00
  stranded, four flows rerouted, "a short way around". Turkish Straits, a sixth
  the size: 3.70 stranded, no route longer, "no way around". The argument now
  arrives in two clicks instead of requiring the visitor to click all seven and
  hold the comparison in their head.
- **Citation:** this commit; the `no chokepoint reads as a broken switch` block
  in `spec/interaction.test.ts`.

---

- **Date/time:** 2026-08-03, just after midnight
- **Tag:** `[harness]`
- **What happened:** Nothing in `pnpm check` measures contrast, and the
  template's CLAUDE.md says wiring accessibility sensors is my work. On a dark
  palette this is exactly where things go wrong quietly.
- **What I did instead of the obvious thing:** Rather than eyeball it or reach
  for axe-core and a browser, I wrote the check as arithmetic over the palette:
  `spec/contrast.test.ts` parses the custom properties out of `styles.css` and
  asserts a declared list of foreground/background pairings against WCAG AA. It
  needs no browser, runs in a millisecond, and the pairing list is the part CSS
  cannot express — which colour is used on which surface, and at what size.
- **How I knew it was right:** It went red on first run and named the offender:
  `--ink-faint (#4d5a6b) on --panel (#0e1725) is 2.56:1, needs 4.5:1`. That
  colour was carrying the flow notes, the readout subtitle, the reroutability
  labels and the table headers — all small text. I raised it and `--ink-dim`
  together to keep the three-step hierarchy, then re-ran: 13 pass. The map's
  flow colours were checked against the water at the 3:1 non-text threshold and
  already passed.
- **Citation:** this commit; `spec/contrast.test.ts` red → green, and the
  palette change in `styles.css`.

---

- **Date/time:** 2026-08-03, early hours
- **Tag:** `[judgement]`
- **What happened:** The switch list was in the order I happened to write the
  chokepoints in. A visitor could close Hormuz, see 16.10 stranded, decide the
  page is about Hormuz, and leave — never finding that Malacca is larger and
  harmless, which is the actual thesis.
- **What I did instead of the obvious thing:** The obvious fixes are a caption
  explaining the three classes, or grouping the switches by class. Both give
  the answer away before the visitor has done anything, which kills the only
  interaction the piece has. I sorted the list by volume descending instead and
  said so in one line: "Ordered by how much oil they carry, largest first. That
  order tells you almost nothing about what happens when you close one." The
  ranking is the one everybody reaches for, it is now the first thing on
  screen, and reading top to bottom walks the visitor from the biggest (which
  strands nothing) to a much smaller one near the bottom (which strands
  everything). The argument is in the ordering rather than in a paragraph.
- **How I knew it was right:** Wrote the ordering down as a contract before
  trusting it — three tests in `spec/assignment1.test.ts` now assert that the
  list is sorted by volume, that the largest chokepoint is *not* the most
  damaging to close, and that a chokepoint under a third the size strands more
  than the largest one does. If a future tidy-up re-sorts the list or the data
  shifts, the thesis fails loudly instead of quietly evaporating.
- **Citation:** this commit; the `the ordering carries the argument` block in
  `spec/assignment1.test.ts`, and the sort in `src/data/chokepoints.ts`.
- **Also in this commit (routine):** map-to-table linking on hover, detoured
  flows drawn last so a shared leg shows the change rather than hiding it, a
  two-column standfirst and a cropped phone map so the map clears the fold at
  both marking viewports. All four verified by screenshot at 1920×1080 and
  390×844.

---

- **Date/time:** 2026-08-03, early hours
- **Tag:** `[judgement]`
- **What happened:** I had never looked at the switches or the flow table
  rendered — only the top of the page. A tall screenshot showed both were fine,
  but a screenshot of `#chokepoints` came back as a uniform dark rectangle. It
  looked exactly like an interface that had failed to build.
- **What I did instead of the obvious thing:** I had already told the user this
  was a real bug, and the obvious next step was to ship the fix I had reasoned
  out. Instead I checked the claim with a second, independent reading:
  `--dump-dom` on the same URL returned seven switches, eleven table rows and
  the readout, byte-identical to the no-fragment load. The page was fine; the
  screenshot tool does not report scroll position reliably when the URL carries
  a section fragment. I corrected the claim rather than leaving a wrong
  diagnosis standing.
- **How I knew it was right:** The DOM dumps for `/` and `/#chokepoints` were
  identical on every count I checked. Reasoning it through afterwards agrees:
  a deferred module script runs before `DOMContentLoaded`, so the sections
  exist by the time a real browser resolves the fragment. I kept the
  `scrollIntoView` guard anyway — not for the bug I thought I had, but for the
  genuine slow-connection race where the script has not run yet, which is
  squarely in the artefact criterion's "holds up on a slow connection" band.
- **Citation:** this commit; CLAUDE.md → "A screenshot is evidence of what
  rendered, not of why", and the fragment guard in `main.ts`.
- **Also in this commit (routine):** reroutability classes colour-coded in the
  switch list, and the map cropped to a 1000×380 frame so the empty polar bands
  stop padding it.

---

- **Date/time:** 2026-08-16, afternoon
- **Tag:** `[harness]`
- **What happened:** `spec/interaction.test.ts`'s `open()` helper re-implemented
  `main.ts`'s toggle wiring — its own `closed` Set, its own `mount()` callback,
  its own `view.update(allocate(closed))` — and never touched `location`. So the
  three lines that actually carry the permalink (`readHash` on load,
  `replaceState` on toggle, the `hashchange` listener) had never been executed by
  a test, and twenty-odd interaction assertions were being made against a copy of
  the logic rather than the logic. A test helper that duplicates the thing it
  tests is a sensor measuring itself.
- **What I did instead of the obvious thing:** The obvious fix is to have the
  test set `location.hash` before calling its own helper — which would have left
  the duplication in place and bought nothing. I extracted the wiring into
  `start(root)` in `src/ui/app.ts` so `main.ts` and the tests drive the same
  function, and generalised `mount()`'s callback from `onToggle(id)` to a tagged
  `Intent`. That second part is not extensibility for its own sake: the next
  control, "reopen all", is destructive and should be undoable with the back
  button, so it needs `pushState` where a toggle needs `replaceState`. Each
  intent therefore has to decide its own history mode, and that decision belongs
  in one exhaustive switch rather than scattered across a growing parameter list.
- **How I knew it was right:** Wrote the six new tests first and confirmed they
  failed on the missing module rather than on an assertion quirk. Then two
  adversarial checks instead of trusting green. Deleted the relocated
  `scrollIntoView` block and confirmed the test guarding it went red naming the
  exact element it expected — a call-count assertion would have passed, which is
  why the assertion is on the target's identity. Temporarily added the future
  `reopen-all` variant and confirmed the exhaustive switch really does fail
  `tsc` with TS2366 rather than silently doing nothing, so the claim in the
  comment is verified rather than asserted. Probed jsdom 29.1.1 directly rather
  than trusting either my assumption or the reviewer's: `scrollIntoView` is
  absent entirely, `hashchange` is asynchronous, and `replaceState` does not fire
  it. That first fact settled an argument — the stub belongs in the test, not a
  `typeof` guard in production, because guarding real browser behaviour to
  satisfy a test environment is backwards. 111 → 117 tests green, and
  `#closed=hormuz` screenshotted at 1920×1080 and 390×844 to prove the initial
  `readHash` works in a real browser and not only in jsdom.
- **Citation:** this commit; `src/ui/app.ts`, and the `the URL is the state`
  block in `spec/interaction.test.ts`.
- **Curated prompt:** "the `open()` helper re-implements main.ts's toggle wiring
  and never touches `location` — extract that wiring into one exported function
  that both main.ts and the tests use, because the next feature needs an
  assertion about `location.hash`."
- **Found but deliberately not fixed here:** reading the newly-exposed path
  turned up a live bug — `index.html`'s nav and skip link target `#chokepoints`,
  `#flows` and `#sources`, and `hashchange` feeds those to `readHash`, which
  finds no `closed=` key and returns an empty Set, silently reopening every
  strait. Close Hormuz, click "Flows", and the model resets. It is left alone in
  this commit so that "no existing assertion changed" stays meaningful evidence
  that the extraction was clean; it gets its own red-to-green commit next, which
  is also the independent second reading confirming the bug is real rather than
  read off the code path.

---

- **Date/time:** 2026-08-16, afternoon
- **Tag:** `[judgement]`
- **What happened:** The wiring extracted in the previous commit exposed a live
  bug. `index.html`'s masthead nav and skip link target `#chokepoints`, `#flows`
  and `#sources`; those arrive as `hashchange`, and the handler fed every hash to
  `readHash`, which finds no `closed=` key and returns an empty set. Close
  Hormuz, click "Flows" to look at the table, and every strait silently reopens
  with the URL now reading `#flows`, so the state is not even recoverable. It is
  on the keyboard path too, via the skip link.
- **What I did instead of the obvious thing:** The obvious fix is to make
  `readHash` return `null` when there is no `closed=` key and treat that as "no
  change" — which would have broken two existing assertions in `a state is
  shareable`, and existing assertions are not to be weakened to make new work
  pass. I added a separate predicate, `carriesClosedState`, leaving `readHash`
  and all four of its tests untouched. The non-obvious part is what the predicate
  keys on and where it applies: **key presence, not value**, so that `#closed=`
  (which names the empty set, and is the href a "reopen everything" link will
  use) and `#flows` land on opposite sides even though `readHash` returns an
  empty set for both. And it applies to the hashchange handler *only* — the
  initial read deliberately keeps no predicate at all, because on first load the
  URL is the sole source of truth and an empty hash correctly means "nothing
  closed". That asymmetry is the fix: the bug exists precisely because one rule
  was reused at a moment when prior state existed.
- **How I knew it was right:** Wrote the failing test first and watched it
  reproduce the bug — `visiting a section fragment reopened a closed strait:
  expected 'false' to be 'true'`. That mattered more than usual: I had found this
  by reading the code path, not by observing it, and CLAUDE.md's rule is that a
  reading is not evidence until something independent confirms it. A second test
  pinned the case the fix must *not* break, `#closed=` still adopting baseline,
  and it was green before and after — so the predicate discriminates rather than
  just refusing. 117 → 119 green.
- **Citation:** this commit; `carriesClosedState` in `src/ui/permalink.ts`, and
  the `navigating the page does not reset the model` block in
  `spec/interaction.test.ts` red → green.
- **Curated prompt:** "decide and tell me what each of these means, because the
  predicate defines it: `#closed=hormuz`, `#closed=`, `#flows`, `#`, `""` — and
  note the initial read and the hashchange handler cannot use the same rule."

---

- **Date/time:** 2026-08-16, late afternoon
- **Tag:** `[judgement]`
- **What happened:** Fixing the nav bug fixed only half of it. The model now
  survived a section nav, but the address bar was left reading `#flows` while
  Hormuz was shut — so copying the URL shared baseline. On a page whose whole
  premise is a shareable state, the permalink was now silently wrong after any
  nav click, which is arguably worse than the reset it replaced: the reset was at
  least visible.
- **What I did instead of the obvious thing:** The tempting move is to accept it
  and write a note in the colophon, since the state is at least preserved. I
  rewrote the URL back to the state hash after the nav instead, because the
  fragment is being asked to do two incompatible jobs — name a section and name
  a state — and the state is the half worth sharing. But I only do it when there
  is something to protect: with nothing closed, `#flows` is already an honest
  description of the page, and stripping it would throw away the anchor and
  spend a real cost for nothing.
- **How I knew it was right:** The cost is a dead back-button step — the
  fragment nav pushes its entry before the handler runs, so the stack ends up
  with two adjacent identical URLs. I did not reason about that and move on; I
  drove a real headless Chrome over CDP (no Playwright or Puppeteer in the repo,
  but Node 24 has a global `WebSocket` and Chrome speaks CDP, which was enough
  to press keys and read `document.activeElement`). Confirmed: one Back press
  changes nothing, the second leaves the page. Predicted, accepted, and now
  written into the comment beside the rewrite so it is documented rather than
  discovered. The check that could have killed the whole approach was the skip
  link — it exists for focus, not scroll, and a fragment nav sets the sequential
  focus navigation starting point. Tab to it, activate, Tab again: focus landed
  on the first switch inside `#chokepoints`, not back at the masthead, and
  `scrollY` went 0 → 923. So the rewrite disturbs neither focus nor scroll. Had
  it broken focus, the fix would have cost more than it bought and I would have
  reverted it. 119 → 121 green.
- **Citation:** this commit; the `KNOWN COST` comment in `src/ui/app.ts` and the
  `the URL keeps describing the page` block in `spec/interaction.test.ts`.
- **Assertion changed, deliberately:** the previous commit's test asserted
  `location.hash === "#flows"` after a nav — the exact behaviour this commit
  removes. Naming it rather than editing it quietly: its purpose was proving the
  nav was not vacuous, and the `navigate()` helper already guarantees that
  structurally by resolving only once `hashchange` has fired, so the line was
  redundant before it was wrong.
- **Curated prompt:** "a cost you did not count — a fragment nav pushes its entry
  before your code runs, so Back changes nothing. I still think the trade is
  right, but it must be documented in the code comment, not discovered by a
  marker pressing Back."

---

- **Date/time:** 2026-08-16, evening
- **Tag:** `[harness]`
- **What happened:** Three separate times in one session, a test asserted a
  serialised form rather than the thing it meant: `location.hash === ""` for
  "nothing is closed"; `location.hash === "#flows"`, which I wrote in `bbfaf4c`
  and deleted in `9560df6`; and a proposed `aria-current` rule comparing
  `writeHash` output against an href string. Each was individually defensible
  and each was individually corrected. Seeing them as one pattern is the part
  that took an outside eye.
- **What I did instead of the obvious thing:** The obvious response is to fix the
  third instance and move on — all three had already been caught, so nothing was
  broken. I wrote the rule into `CLAUDE.md` instead, with all three cited by
  commit where they exist. The distinction that makes it worth a rule rather
  than three corrections: the middle one was **born temporary**. The decision to
  rewrite that hash had already been made when the assertion was written, so it
  was obsolete before it was committed — which means the failure is not
  carelessness that more care would prevent, but a default reach for the
  spelling over the meaning. A default is a harness problem, not a prompt
  problem.
- **How I knew it was right:** The strongest evidence is the third instance,
  which nobody had written yet and which the rule catches by construction:
  comparing `writeHash` output to an href would appear to work for every preset
  link except baseline, because `writeHash` emits ids in a fixed order and the
  canonical baseline is `""` while the href is `#closed=`. A test suite that is
  green for every case but one, and looks right, is worse than one that is red.
  Also checked the rule against the existing suite rather than only against the
  new work: `spec/interaction.test.ts` already asserts the model's number via
  `allocate(...)` and `toBeCloseTo` rather than the rendered two-decimal string,
  which is the same rule applied correctly, so the rule describes what the good
  tests here already do.
- **Citation:** this commit; `CLAUDE.md` → "Assert what a value means, not how it
  is spelled", citing
  [`bbfaf4c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/bbfaf4c2be3b01400dd852430af876fec1407099)
  and
  [`9560df6`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/9560df6dc66c12e3309a3453876b5ab30609a998).
- **Curated prompt:** "three times in this session a test asserted a serialised
  form rather than the thing it means — same shape every time. That belongs in
  the harness, not in my review."

---

- **Date/time:** 2026-08-16, evening
- **Tag:** `[routine]`
- **What happened:** The `KNOWN COST` comment on the URL rewrite understated the
  cost. It said one back press does nothing, which is true but stops one step
  early: the second press leaves the site entirely.
- **What I did instead of the obvious thing:** Nothing clever — corrected the
  comment to say what the browser actually does. Worth logging because the whole
  point of that comment is that a reader can weigh the trade without pressing
  Back themselves, and a comment that stops halfway through the consequence is
  no better than the missing comment it replaced.
- **How I knew it was right:** It is the CDP result from the previous commit,
  read to the end rather than to the first interesting line: first Back leaves
  the URL unchanged with the state intact, second Back drops off the page.
- **Citation:** this commit; the `KNOWN COST` comment in `src/ui/app.ts`.
- **Curated prompt:** "'one press does nothing, the second leaves the page' is
  worse than a dead step and the comment should say exactly that."

---

- **Date/time:** 2026-08-16, evening
- **Tag:** `[judgement]`
- **What happened:** The "reopen all" control needed somewhere for focus to go.
  It only exists while at least one strait is closed, so succeeding removes it
  from the tab order and drops focus to `<body>` — the visitor's place on the
  page is gone at exactly the moment they have made the biggest change to it.
  The two candidate fixes were "keep it rendered but disabled" and "move focus
  to the heading".
- **What I did instead of the obvious thing:** "Keep it rendered and disabled"
  is the obvious choice and it is wrong, but only measurably so. I drove a real
  browser over CDP and checked: setting `disabled` on a focused button drops
  focus to `<body>` exactly as removing it does, so that option solves nothing —
  it only looks like it does. `aria-disabled` does preserve focus, but it leaves
  a permanent tab stop advertising an action that does nothing most of the time.
  So focus moves to the "Close one and see" heading, given `tabindex="-1"` so it
  can receive focus without becoming a tab stop: it puts the visitor at the top
  of the group they were working in, and names what they are looking at, which
  is the context a screen reader needs after seven controls change at once.
- **How I knew it was right:** The `disabled` behaviour was measured, not
  assumed — that is the whole basis for rejecting the option, so asserting it
  would have been worthless. Then the browser-only test the design was chosen
  for: `pushState` for reopen-all against `replaceState` for a toggle means Back
  should undo it, and no vitest assertion can see the difference because jsdom
  simulates the history stack. Closed Hormuz and Suez, activated the control
  with a real keyboard Enter, pressed Back: both straits closed again,
  `#closed=hormuz,suez` restored. Focus landed on `controls__heading`, not
  `BODY`, at both marking viewports. One screenshot claim got a second reading —
  `#closed=hormuz` and `#closed=hormuz,suez` both display 16.10, which looks
  like a stuck number and is not: the model gives Suez alone 0.00 stranded
  because it has the Cape detour, so adding it to a closed Hormuz strands
  nothing further. 121 → 126 green.
- **Citation:** this commit; `historyMode` in `src/ui/app.ts`, and the
  `reopening everything` block in `spec/interaction.test.ts`.
- **Assertion rewritten as agreed:** the tab-order test counted focusable
  elements, which a new control would have "fixed" by bumping the number — a
  bumped count is indistinguishable from weakening it. It now names every tab
  stop in order, derived from `CHOKEPOINTS`, through a `tabStops()` helper that
  expresses what Tab actually reaches rather than what a selector matches.
- **Curated prompt:** "the button removes itself from the DOM when activated,
  dropping focus to `<body>`. Either keep it rendered and disabled, or move
  focus to the heading with `tabindex="-1"`. Pick one, do it, say which and why."

---

- **Date/time:** 2026-08-16, evening
- **Tag:** `[harness]`
- **What happened:** My CDP script reported `FAIL: Back did not restore the
  closed set`. The button was fine; the script's `Enter` was dispatched as
  `keyDown`/`keyUp` with no `char` event, so Chrome never synthesised the
  activation click and nothing was ever pressed. The page under test had not
  changed because nothing had asked it to. That FAIL was indistinguishable from
  a genuinely broken control — same output, same shape, same confidence — and I
  nearly went looking for a bug in `pushState`.
- **What I did instead of the obvious thing:** The obvious response is to fix
  the script and move on; it cost ten minutes and nothing shipped wrong. But it
  exposed a contradiction already sitting in `CLAUDE.md`: the template says
  "treat a red check as authoritative — the page is wrong until the check is
  green", while my own verification section says two of three screenshot-found
  bugs were the tool. Read literally, the first line instructed me to believe my
  own broken keypress. Nothing in the file said which rule applied when. I
  amended both existing passages rather than adding a fourth rule, and drew the
  line at provenance: a red from the committed roster — typecheck, build, lint,
  the spec suite — is authoritative, because those are reviewed and run on every
  push and have been wrong far less often than the code has; a red from a sensor
  built for one question is a claim about the sensor until shown otherwise.
- **How I knew it was right:** The test is whether the rule would have caught
  this instance prospectively, not just described it afterwards. It would: the
  fix it prescribes — make the sensor report a known-good case first — is
  exactly the assertion the script lacked. Had it checked "the button fires at
  all" before checking "Back undoes it", it would have named its own fault. That
  is also why the line is about provenance rather than about screenshots: the
  screenshot rule was already in the file and did not stop me, because a CDP
  script did not look like a screenshot.
- **Citation:** this commit; `CLAUDE.md` → the amended "attribute the red before
  acting on it" bullet in "How to work in here", and the new harness-red bullet
  in "Verifying what you actually shipped".
- **Curated prompt:** "the template says treat a red check as authoritative;
  your own rule says two of three screenshot bugs were the tool. Your CDP
  harness is the third instance, and read literally the template line says to
  believe your broken Enter dispatch."

---

- **Date/time:** 2026-08-16, night
- **Tag:** `[judgement]`
- **What happened:** Half the argument was unrendered. The three reroutability
  classes behave differently because of one physical fact — is there another way
  round, and how wide is it — but nothing flows through a bypass at baseline, so
  the alternatives were invisible until after a strait was closed. The visitor
  could see that some closures hurt and others did not, with no visible reason
  why.
- **What I did instead of the obvious thing:** The obvious rendering is a legend
  or a labelled list of pipelines. I drew them on the map instead, dormant, with
  **stroke width taken from the same scale the flows use** — so Petroline reads
  as visibly narrower than the traffic it is supposed to absorb, which is the
  argument rather than a caption about it. Because width is capacity while a
  flow's width is volume, a partly-used bypass now shows as a narrow bright
  stroke inside a wider faint one: how full the pipe is, for free, with no extra
  code. Two smaller calls: the layer is built once and never rebuilt, because
  infrastructure is not a result; and the wording is "ways around", not "bypass
  pipelines", because the Kiel Canal is one of the five and is a canal — the
  dash pattern varies by `leg.kind` instead of the noun lying.
- **How I knew it was right:** The tests passed and the page was still wrong,
  which is the whole reason CLAUDE.md says to look. Reading the render showed
  almost nothing on the map, so I measured rather than adjusted by eye: SUMED
  spans 10px at 1920 and **4px at 390**, against a 7px dash period — the object
  the argument depends on was drawing as less than one dash on a phone. Shorter
  periods, chosen to fit at least two dashes into the shortest bypass, fixed it.
  A second look then caught a plain bug: `.readout__bypass` had no CSS, so it
  inherited the readout's own type and rendered *larger* than the line it
  belongs beside, outranking the verdict. Verified at both marking viewports in
  both states; the on-screen figures were cross-checked against `allocate()` and
  `BYPASSES` rather than read off the pixels — 4.70 is petroline 3.2 plus adcop
  1.5, and 8.26 is the capacity sum. Stroke colour came back
  `rgb(120, 133, 152)` at opacity 1, exactly the `ink-faint` the new contrast
  pairing declares, so that check describes what is actually on screen. 126 →
  133 green.
- **Citation:** this commit; the bypass layer in `src/render/view.ts`, the
  measured dash periods in `styles.css`, and the
  `the ways around are visible before they are needed` block in
  `spec/interaction.test.ts`.
- **New contrast pairing:** `ink-faint` on `water` at the 3:1 non-text
  threshold. Drawn at full opacity on purpose — a translucent stroke would be
  contrasting against a composite colour that appears nowhere in the palette,
  which would make that check a fiction.
- **Curated prompt:** "at baseline the bypass routes are invisible because
  nothing flows through them. 'Is there another way round, and how wide is it'
  is the physical reason the three classes behave differently. It is half the
  argument, currently unrendered."

---

- **Date/time:** 2026-08-16, night
- **Tag:** `[harness]`
- **What happened:** I had tuned the dormant bypass layer against the *shortest*
  leg and declared it fixed. The object actually at risk was the *thinnest* one:
  the Kiel Canal carries 0.2 mb/d, so on the shared flow scale it is the
  narrowest stroke on the map, and at 390px it rendered at **0.74 device
  pixels** — drawn and not visible, which is precisely the failure the layer
  exists to fix. Worse, the dash periods I had shortened to fit SUMED were
  **0.71px** at that width, so every pipeline dash was sub-pixel too. My fix for
  the first problem had created the second.
- **What I did instead of the obvious thing:** The obvious move after the last
  round was to trust the render I had already looked at — it looked fine. Two
  measurements instead: rendered stroke width and rendered dash length, per
  bypass, in device pixels, at the smaller viewport. Then a floor on the dormant
  stroke that binds on Kiel alone, and dropping the dash entirely below 46rem,
  because a sub-pixel dash does not read as a dashed line, it reads as nothing —
  and the pipeline-versus-canal distinction is not legible at 390px anyway,
  while the tooltip and readout still carry it.
- **How I knew it was right:** All five now clear one device pixel at 390px
  (thinnest 1.05px, was 0.74px) and desktop keeps its dashes at 1.87px and above,
  so the kind distinction survives where it can be seen. The floor is checked by
  a test that states the contract — rendered width times the measured phone
  scale must exceed one pixel — rather than restating the constant, and it
  immediately earned itself: my first floor gave 0.9996px and the suite went red
  on it. **The harness lied twice on the way here.** `Page.navigate` kept
  serving a cached bundle even with `Network.setCacheDisabled`, so three
  successive measurements described the previous build and reported "no change"
  after a real change — a false green, which is harder to spot than a false red
  because "nothing moved" is exactly what a broken fix looks like. Caught it by
  asking the page which bundle it had loaded rather than assuming.
- **Citation:** this commit; `BYPASS_MIN_STROKE` in `src/render/view.ts`, the
  narrow-viewport rule in `styles.css`, and the two new bullets in `CLAUDE.md` →
  "Verifying what you actually shipped".
- **Curated prompt:** "you measured the SHORTEST bypass. The risk is the
  THINNEST one at the SMALLEST viewport, which is a different object. Confirm by
  measurement, not by looking."

---

- **Date/time:** 2026-08-16, night
- **Tag:** `[judgement]`
- **What happened:** Nobody had ever read this page aloud. The readout was a
  single live region holding seven text nodes — value, unit, percentage, detour
  clause, ways-around line, class label, verdict — all re-announced in full on
  every toggle. Closing three chokepoints to compare them, which is the entire
  point of the page, read about forty words three times over, of which the
  changing part was two numbers.
- **What I did instead of the obvious thing:** I first inferred the problem from
  `textContent` and got it wrong — it concatenates to
  `"…in useno way around16.10…"`, so I expected mangled speech. Reading Chrome's
  accessibility tree instead showed seven clean `StaticText` nodes: block
  boundaries prevent the collision, and `textContent` was simply the wrong
  instrument. The real fault was volume, not mangling. So rather than trimming
  spans, I separated two things that had been conflated: **reachable and
  announced-on-every-change are not the same requirement.** The detail stays in
  the DOM, unhidden, reachable in browse mode — satisfying the earlier rule that
  the bypass figures must not be pointer-only — while a purpose-written sentence
  becomes the only live region. It can be composed for the ear
  ("16.10 of 34.50 million barrels a day stranded") instead of being assembled
  from fragments written for the eye.
- **How I knew it was right:** The AX tree again, after: one live region, one
  text node, fifteen words, down from seven nodes and about forty. It also
  caught a trap that would have made the whole change a no-op — `<output>`
  carries an implicit `role="status"` and therefore an implicit live region, so
  removing the `aria-live` attribute alone would have changed nothing while
  looking like a fix. The element had to become a `div`. Screenshotted the
  readout panel afterwards to confirm the swap cost nothing visually.
- **Existing assertion changed, and named rather than quietly edited:**
  `announces the readout to assistive technology` asserted that the readout
  element carries `aria-live="polite"` — the *mechanism*, not the contract. The
  contract is that a change is announced, and it still is, from a different
  element. This is the serialisation rule from `CLAUDE.md` wearing another hat:
  the test named how the page was built rather than what it does. The
  replacement is strictly stronger — it counts `[aria-live]`, `output` and
  `role="status"` together, so an implicitly-live element cannot slip past, and
  requires **exactly one**, because two regions means every toggle is announced
  twice.
- **Citation:** this commit; `spokenSummary` in `src/render/view.ts` and the
  `what the page says out loud` block in `spec/interaction.test.ts`.
- **Curated prompt:** "the readout is one aria-live region and now carries seven
  children. Tell me what a screen reader actually announces on a single toggle —
  the full concatenated string. I am asking whether anyone has ever read the
  thing this page says out loud."

---

- **Date/time:** 2026-08-16, night
- **Tag:** `[harness]`
- **What happened:** The provenance rule I wrote two commits earlier said to
  attribute a red before acting on it, and prescribed one defence: make the
  sensor report a known-good case first. Then a cache produced a **false green** —
  three measurements reporting "no change" after a real change — and I noticed
  that the rule as written does not cover it. Nothing triggers the check, because
  the sensor says the thing you were hoping for. Worse, a cached page passes the
  known-good case perfectly, so the prescribed defence runs clean and proves
  nothing.
- **What I did instead of the obvious thing:** The obvious move was to leave it,
  since the cache trap was already recorded as its own bullet with the concrete
  fix. But a rule that names a trap without naming the defence that actually
  catches it is worse than no rule — it reads as covered. So I separated the two
  demonstrations explicitly: a false red is caught by showing the sensor reports
  a known-good case; a false green is caught only by showing the sensor
  **responds to a deliberate change**. Edit a value, watch the number move, put
  it back — or read the identity of what loaded rather than only its behaviour.
- **How I knew it was right:** Tested the old rule against the incident it was
  supposed to cover and it failed: every step of "make it report a known-good
  case" passes against a cached bundle, because the cached page is a perfectly
  good page — just the wrong one. That is the whole point. A rule has to be
  checked against the failure it claims to prevent, not only against the failure
  that prompted it.
- **Citation:** this commit; `CLAUDE.md` → the false-green bullet in "Verifying
  what you actually shipped".
- **Curated prompt:** "a false green produces no red to attribute — there is
  nothing to trigger the check. The provenance rule asks you to show the sensor
  reports a known-good case; a false green requires showing the sensor RESPONDS
  TO A DELIBERATE CHANGE."

---

## Ledger: pre-existing assertions changed this session

Two assertions that existed before a change were rewritten rather than left
alone. Both are recorded here so the claim "nothing was weakened" can be
checked rather than taken on trust. Neither was deleted; both replacements are
argued to be strictly stronger, and a reader is entitled to disagree.

**1. `location.hash === "#flows"`** — added in
[`bbfaf4c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/bbfaf4c2be3b01400dd852430af876fec1407099),
removed in
[`9560df6`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/9560df6dc66c12e3309a3453876b5ab30609a998).

- *What it asserted:* that after a section nav the URL still reads `#flows`.
- *Why it went:* `9560df6` deliberately restores the state URL after the scroll,
  so the assertion contradicted the feature it preceded. It was written when the
  decision to rewrite that hash had **already been made** — obsolete before it
  was committed.
- *Why the replacement is stronger:* the line's real purpose was proving the nav
  was not vacuous, and the `navigate()` helper already guarantees that
  structurally by resolving only once `hashchange` has fired — a nav that never
  happened hangs the test rather than passing it. The coverage moved to
  `returns the URL to the state after a section nav`, which asserts the parsed
  set rather than the string, and to `leaves a section fragment alone when there
  is no state to lose`, which pins the case the fix must not disturb. Two
  assertions where there was one, neither depending on a spelling.

**2. `readout` carries `aria-live="polite"`** — original starter-era assertion,
rewritten in
[`a7a6fe5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/a7a6fe5).

- *What it asserted:* that one specific element carries one specific attribute.
- *Why it went:* the live region moved to a purpose-written spoken sentence. The
  contract — changes are announced — still holds; the mechanism changed.
- *Why the replacement is stronger:* the old test named how the page was built,
  not what it does, which is the failure `CLAUDE.md` → "Assert what a value
  means" describes. It also could not have caught the trap that nearly made the
  whole change a no-op: `<output>` carries an implicit `role="status"` and
  therefore an implicit live region, so dropping the attribute alone would have
  left the page announcing exactly as before while the test went green. The
  replacement counts `[aria-live]`, `output` and `role="status"` together and
  requires **exactly one** — it fails on the implicit region the old one was
  blind to, and additionally fails if a second region is ever added, which the
  old one permitted without complaint.

**Also stated, not changed:** the tab-order assertion
`expect(focusable.length).toBe(CHOKEPOINTS.length)` was rewritten in
[`08b2e7c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/08b2e7c)
from a count to a named list of every tab stop, derived from `CHOKEPOINTS`. This
is listed for completeness though it is unambiguously a strengthening: bumping
the count to `CHOKEPOINTS.length + 1` was explicitly rejected because a changed
number is indistinguishable from a weakened assertion.

---

## Stated and not fixed: `MB/D STRANDED` in the accessibility tree

Diagnosed rather than assumed, because two causes with different fixes were
possible. It is **not** a missing space between adjacent inline nodes: the DOM
holds `"mb/d stranded"`, space included. The computed `text-transform` is
`uppercase`, and Chrome reflects that into the accessible name, so the AX tree
reports `"MB/D STRANDED"`.

Left as is, deliberately. The page already uses the recommended technique —
semantic text in the DOM, presentation in CSS — and every available "fix" is
worse: typing the capitals into the DOM turns a Chrome serialisation choice into
a real defect in every engine, and `<abbr title>` is not reliably announced. The
meaning is carried in expanded sentence case by the spoken summary
(`"16.10 of 34.50 million barrels a day stranded"`), and the eight uppercase
labels are now outside the live region, so none is re-announced on a toggle.
A screen-reader user reading in browse mode gets exactly the string a sighted
user sees, which is the parity being aimed at.

Residual risk, stated: a screen reader configured to spell all-caps strings as
initialisms would read the visual labels letter by letter. That configuration is
uncommon and the announced sentence is unaffected.

---

- **Date/time:** 2026-08-16, night
- **Tag:** `[judgement]`
- **What happened:** The page needed a way in that was not "click one of seven
  switches and work it out". Three preset links, which is mostly a copy problem:
  every claim has to be geography or published history, traceable to a citation
  already in the repo, with no attribution of intent to anyone.
- **What I did instead of the obvious thing:** Listed the candidates with the
  citation each would rest on *before* writing any prose, and checked each
  against the model first — which killed the most attractive one. Bab el-Mandeb
  alone is the real 2024 rerouting event and the obvious preset, but the model
  moves it by **+0.5 days**, because Gulf-to-Europe crude shifts onto Petroline
  and discharges at Yanbu, north of the strait. A link sold as "the one that
  actually happened" landing on half a day would read as broken and would
  contradict its own note. The honest representation of that event is the pair —
  Suez *and* Bab el-Mandeb — which gives +15.0 days, landing exactly on the EIA
  Cape-versus-Suez anchor the graph was calibrated to. I also cut the two pieces
  of colour the repo already contains (Houthi attacks, Russian crude
  re-routing): both are cited, but naming an actor is attribution rather than
  geography, and the volume changes are citable without them.
- **How I knew it was right:** The copy carries no typed figures at all — the
  standing rule says every number on screen is computed from `src/data/`, and
  `23.2`, `3.7` and `15` are exactly such numbers. `src/data/presets.ts` derives
  them from `CHOKEPOINT_BY_ID` and from `allocate()` at module load, so changing
  a volume moves the prose, and a test asserts each single-chokepoint note
  contains its chokepoint's figure — both sides derived, so a hardcoded note
  fails the moment the data moves. Then I applied the false-green rule from the
  previous commit to my own new test and it paid immediately: my first probe
  swapped `setsEqual` for `href === writeHash(here)` and the suite stayed green,
  which looked like a weak test. It was a bad probe — that comparison is
  canonical-against-canonical and genuinely equivalent. The two ways an author
  actually gets this wrong, `href === location.hash` and joined id lists, both
  turn the test red. Investigating rather than concluding was the whole
  difference.
- **Citation:** this commit; `src/data/presets.ts`, `setsEqual` in
  `src/render/view.ts`, and the `the preset scenarios` block in
  `spec/interaction.test.ts`.
- **Clicking the preset you are already on:** left unhandled, deliberately. The
  fragment does not change, so no hashchange fires and nothing re-renders —
  which is correct, because the page already shows that state. `aria-current`
  is what makes the inaction legible rather than dead; without it the click
  would look like a broken link.
- **New contrast pairing:** `moving` on `panel`, for the current preset's label,
  which draws over the panel fill rather than the page ground.
- **Curated prompt:** "before you write the copy, list the candidate scenarios
  with the citation each one would rest on, and show me that list. I want to
  approve the claims before they are prose."
