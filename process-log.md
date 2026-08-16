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
