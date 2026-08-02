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
