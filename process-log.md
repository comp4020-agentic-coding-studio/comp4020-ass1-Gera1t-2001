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
