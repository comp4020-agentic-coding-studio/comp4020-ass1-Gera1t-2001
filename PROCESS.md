# Process overview

## What I built

An explainer about the chokepoints oil moves through: seven straits, 34.5 million
barrels a day. Closing one re-allocates every flow through it — a sea detour,
then a bypass pipeline — and what fits in neither is stranded. Cut from all cargo
to one commodity because two units make the single stranded total unaddable, the
reason `CLAUDE.md` and the page both give. The largest strait strands nothing; one
a sixth its size stops everything.

## The moments that mattered

**1. A sensor that was measuring itself.** The interaction tests had a helper
that rebuilt the page's toggle wiring by hand and never touched `location`.
Twenty assertions checked a copy of the logic, so the three lines carrying the
permalink had never run under test. The obvious fix — set the hash in the helper
too — keeps the duplication. I extracted the wiring into one `start(root)` the
page and the tests both call
([`c623462`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/c6234629c49b78b129eab07a3f5d30157210021b)).
With something real driving that path, a live bug surfaced the suite could never
have seen: the masthead nav sets a fragment, so clicking "Flows" silently
reopened every closed strait
([`bbfaf4c`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/bbfaf4c2be3b01400dd852430af876fec1407099)).

**2. Three assertions that named a spelling.** Three tests asserted a serialised
form rather than the thing it meant — one comparing the URL to `"#flows"`,
written after the decision to rewrite that hash was taken, so obsolete before it
was committed. Each was defensible when written, so a fourth review would not
have helped. The correction went into `CLAUDE.md` instead: assert through the
function that gives a value its meaning
([`40138d2`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/40138d2dbd76164c169381090412e730e7a7be4b)).
It then caught a case none of the three had: a test requiring the readout to
carry `aria-live` named the mechanism, not the contract, and would have stayed
green through a change that altered nothing — because `<output>` is implicitly a
live region.

**3. A harness rule that failed the incident it was written for.** A CDP script
reported `FAIL: Back did not restore the closed set`. The button was fine; my
`Enter` lacked its `char` event, so nothing was pressed. `CLAUDE.md` already
warned that screenshots lie and it did not stop me: a CDP script does not look
like a screenshot, so the rule was keyed to a medium rather than a property. I
rewrote it around provenance
([`d7c69e9`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/d7c69e92df74df693863bfd2e16cfb000dbf1b97)).
Then it failed a second incident: a cached bundle produced a false green, and
"make the sensor report a known-good case" passes against a cache — the cached
page is a good page, just the wrong one. The two defences had to be separated
([`b6d5c31`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/b6d5c31b5937c901b012fff8a13bbd595690ebbc)).

**4. The half of the argument that was not being drawn.** At baseline every
bypass carried nothing, so the map drew none — yet whether there is another way
round, and how wide, is why the classes differ. The obvious fix is a caption.
Instead I drew them dormant, taking stroke width from the same scale as the
flows, so Petroline reads as visibly narrower than the traffic it must absorb:
the argument in the geometry rather than in prose. I made the stroke opaque so
the contrast check tests a colour the page renders, not a composite that exists
nowhere
([`0217ef5`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/0217ef5ea7de99517b1b733065cd5bdedd706eaf)).
Correctness came from measurement, not looking: `pnpm check` was green while the
shortest bypass drew narrower at 390px than one dash of its own pattern, and the
thinnest rendered at 0.74 device pixels
([`443e519`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-Gera1t-2001/commit/443e519071a7c7b705ebdb9e3870e256162f6295)).
