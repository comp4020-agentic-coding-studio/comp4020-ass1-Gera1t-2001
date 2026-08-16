# Assignment 1

I ran this assignment with three AI sessions: Fable 5 drafting the plan, the
course Opus session executing it in the terminal, and a second Opus session
reading the results with me. It is the review system I started in Crit 2, and it
produces more confident claims than I can check. The plan quoted a pipeline
capacity of 5.00 million barrels a day when the repo says 3.2.

The breakthrough was not checking harder. It was one rule in CLAUDE.md.

## What the agent was doing

It wrote this test:

```js
expect(location.hash, "the nav should still have moved the URL").toBe("#flows");
```

Two commits later we changed the page on purpose, so that hash gets rewritten
back to the state URL, and the assertion had to be deleted. We had already
decided on that change before the test was written — it was obsolete the day it
was committed.

It happened three times that week. Each time the test named the exact string a
value was spelled with, instead of what the value meant, and each time I
corrected it in the next message. Catching it depended on me noticing.

## What changed it

After the third time I stopped correcting instances and wrote a rule instead:

> Assert what a value means, not how it is spelled.

## What it does now

The agent went on to rewrite a test I had never mentioned. The old one asserted
that the readout carries `aria-live="polite"`. The new one counts `[aria-live]`,
`<output>` and `role="status"` together, and requires exactly one live region on
the page.

## Why it worked

An `<output>` is already a live region, with no attribute at all. So the old
test was checking how the page was built, not what it does. It can pass while
the page announces exactly as before. The new test fails on it.

I did not know `<output>` was already a live region. I could not have written
that test, and I would not have thought to ask for it.

## What this changed about the developer I want to be

I am still not a strong developer, and with three sessions running I often
cannot tell whether what I am handed is right. I have started describing it to
myself as being a monkey holding a machine gun.

The engineering is the part I am weakest at. The idea was not. I did a supply
chain undergrad, and the first decision was mine: cutting a map of all cargo to
one commodity, because two units make the page's one number unaddable. I could
not have written most of this code. I could decide what it had to satisfy.

Correcting an agent in the next message requires me to be right. Changing what
its work runs against does not. Four more rules went into CLAUDE.md the same
way this week, three about not trusting a sensor I had just built.

I do not think the machine-gun feeling goes away by learning more. It got
quieter when the thing I had built could tell me I was wrong.
