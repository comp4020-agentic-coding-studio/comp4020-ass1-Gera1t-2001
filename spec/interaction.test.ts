// @vitest-environment jsdom
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { CHOKEPOINTS } from "../src/data/chokepoints";
import { FLOWS } from "../src/data/flows";
import { BYPASSES } from "../src/data/network";
import { allocate } from "../src/model/allocate";
import type { ChokepointId } from "../src/model/types";
import type { App } from "../src/ui/app";
import { start } from "../src/ui/app";
import { readHash, writeHash } from "../src/ui/permalink";

// The model tests in assignment1.test.ts prove the allocation is right. These
// prove the visitor can actually reach it: that the controls are real buttons
// a keyboard can operate, that they say what state they are in, and that the
// number on screen is the number the model computed.
//
// They mount the real render into jsdom rather than parsing built markup,
// because the interface is built by script — parsing dist/index.html would
// only ever see the empty shell.
//
// They drive the real `start()` — the same function main.ts calls — rather than
// a local copy of its wiring, so `location` and `history` are exercised here
// exactly as they are on the page. An earlier version of this helper rebuilt
// the toggle by hand and never touched the URL, which meant the hash path was
// asserted against a copy of itself.

// jsdom implements no layout and does not define Element.prototype.scrollIntoView
// at all (verified on jsdom 29.1.1: typeof undefined, absent from the prototype).
// Production is right to call it unguarded, so the browser it assumes is
// supplied here rather than weakened there.
const scrollTargets: Element[] = [];
const scrolled = vi.fn(function (this: Element) {
  scrollTargets.push(this);
});

beforeAll(() => {
  Object.defineProperty(Element.prototype, "scrollIntoView", {
    value: scrolled,
    writable: true,
    configurable: true,
  });
});

/** Every app started by open(), so each test can detach the last one's listener. */
const live: App[] = [];

function open(hash = "") {
  // Set the URL before start() reads it, the way a visitor arriving on a
  // shared link does.
  history.replaceState(null, "", hash || "/");
  const root = document.createElement("main");
  document.body.append(root);
  live.push(start(root));

  return {
    root,
    switchFor: (id: ChokepointId) =>
      root.querySelector<HTMLButtonElement>(`button[data-chokepoint="${id}"]`),
    readout: () => root.querySelector<HTMLElement>('[data-testid="readout"]')!,
    reopen: () =>
      root.querySelector<HTMLButtonElement>('[data-control="reopen-all"]'),
    strandedText: () =>
      root.querySelector<HTMLElement>('[data-testid="readout"] .readout__value')!
        .textContent,
  };
}

/**
 * The elements Tab actually reaches — which is the thing the tab-order contract
 * is about, and is not the same as "elements matching button, [tabindex]".
 * Hidden elements and negative tabindex are focusable-or-not by rules a
 * selector cannot express, so express them here once.
 */
function tabStops(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("button, a[href], [tabindex]")].filter(
    (el) =>
      !el.hasAttribute("hidden") &&
      !el.hasAttribute("disabled") &&
      Number(el.getAttribute("tabindex") ?? "0") >= 0,
  );
}

beforeEach(() => {
  // All three are per-file state that clearing document.body cannot reach: the
  // hashchange listener lives on window, the spy accumulates across tests, and
  // the URL would otherwise carry one test's closed set into the next.
  for (const app of live.splice(0)) app.destroy();
  document.body.textContent = "";
  scrolled.mockClear();
  scrollTargets.length = 0;
  history.replaceState(null, "", "/");
});

describe("the controls are operable", () => {
  it("renders one button per chokepoint", () => {
    const page = open();
    for (const chokepoint of CHOKEPOINTS) {
      const button = page.switchFor(chokepoint.id);
      expect(button, `no control for ${chokepoint.id}`).toBeTruthy();
      expect(button!.tagName).toBe("BUTTON");
      // A <button> without an explicit type submits any enclosing form.
      expect(button!.getAttribute("type")).toBe("button");
    }
  });

  it("gives every control an accessible name and a stated state", () => {
    const page = open();
    for (const chokepoint of CHOKEPOINTS) {
      const button = page.switchFor(chokepoint.id)!;
      expect(button.textContent).toContain(chokepoint.name);
      expect(button.getAttribute("aria-pressed")).toBe("false");
      expect(button.textContent?.toLowerCase()).toContain("open");
    }
  });

  it("does not put the map markers in the tab order twice", () => {
    // Opened with a strait shut so the reopen-all control is present too.
    const page = open("#closed=hormuz");

    // Every stop named, in order, rather than counted. A count passes when the
    // right number of wrong things is present — a mark quietly replacing a
    // switch would keep the total intact.
    expect(tabStops(page.root).map((el) => el.dataset.chokepoint ?? el.dataset.control))
      .toEqual(["reopen-all", ...CHOKEPOINTS.map((c) => c.id)]);

    // The marks stay pointer affordances: hidden from assistive technology and
    // absent from the tab order however the map is rebuilt.
    for (const mark of page.root.querySelectorAll(".mark")) {
      expect(mark.getAttribute("aria-hidden")).toBe("true");
    }
    expect(page.root.querySelectorAll(".mark button, .mark [tabindex]")).toHaveLength(0);
    expect(page.root.querySelector('[data-testid="map"]')!.getAttribute("aria-label"))
      .toBeTruthy();
  });

  it("announces the readout to assistive technology", () => {
    const page = open();
    expect(page.readout().getAttribute("aria-live")).toBe("polite");
  });
});

describe("the core interaction, through the interface", () => {
  it("strands nothing before the visitor touches anything", () => {
    const page = open();
    expect(page.strandedText()).toBe("0.00");
  });

  it("moves the number when a chokepoint is closed", () => {
    const page = open();
    const hormuz = page.switchFor("hormuz")!;

    hormuz.click();

    expect(hormuz.getAttribute("aria-pressed")).toBe("true");
    expect(hormuz.textContent?.toLowerCase()).toContain("closed");
    expect(Number(page.strandedText())).toBeGreaterThan(10);
  });

  it("puts the model's number on the screen, unrounded away", () => {
    const page = open();
    page.switchFor("danish")!.click();
    const expected = allocate(new Set<ChokepointId>(["danish"])).strandedMbd;
    expect(Number(page.strandedText())).toBeCloseTo(expected, 2);
  });

  it("returns to zero when the visitor reopens everything", () => {
    const page = open();
    for (const id of ["hormuz", "turkish", "danish"] as ChokepointId[]) {
      page.switchFor(id)!.click();
    }
    expect(Number(page.strandedText())).toBeGreaterThan(0);

    for (const id of ["hormuz", "turkish", "danish"] as ChokepointId[]) {
      page.switchFor(id)!.click();
    }
    expect(page.strandedText()).toBe("0.00");
    for (const chokepoint of CHOKEPOINTS) {
      expect(page.switchFor(chokepoint.id)!.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("updates the per-flow table, not just the headline", () => {
    const page = open();
    const row = () =>
      page.root.querySelector<HTMLElement>('tr[data-flow="russia-blacksea-med"]')!;

    expect(row().querySelector('[data-cell="stranded"]')!.textContent).toBe("0.00");
    page.switchFor("turkish")!.click();
    expect(row().querySelector('[data-cell="stranded"]')!.textContent).toBe("3.70");
  });

  it("lists every flow so the map is not the only way in", () => {
    const page = open();
    for (const flow of FLOWS) {
      expect(
        page.root.querySelector(`tr[data-flow="${flow.id}"]`),
        `no table row for ${flow.id}`,
      ).toBeTruthy();
    }
  });
});

describe("no chokepoint reads as a broken switch", () => {
  // The model-level version of this lives in assignment1.test.ts. This is the
  // one that matters to a visitor: four of the seven strand nothing at all, so
  // a panel that only reports stranded volume shows 0.00 for them and looks
  // like the control did nothing. Whatever happened has to be legible.
  const text = (page: ReturnType<typeof open>) =>
    page.readout().textContent!.replace(/\s+/g, " ").trim();

  it.each(CHOKEPOINTS.map((c) => [c.name, c.id] as const))(
    "says something happened when %s closes",
    (_name, id) => {
      const page = open();
      const before = text(page);
      page.switchFor(id)!.click();
      expect(text(page), `closing ${id} left the readout unchanged`).not.toBe(before);
    },
  );

  it("reports a detour when nothing is stranded", () => {
    const page = open();
    page.switchFor("malacca")!.click();

    // The largest oil chokepoint on earth strands nothing — that is the point,
    // and it is only a point if the page says what did happen instead.
    expect(page.strandedText()).toBe("0.00");
    const detour = page.root.querySelector('[data-testid="detour"]')!.textContent!;
    expect(detour).toMatch(/rerouted/);
    expect(detour).toMatch(/\+\d/);
  });

  it("names which kind of fragile the visitor just found", () => {
    const page = open();
    const label = () =>
      page.root.querySelector('[data-testid="verdict-class"]')!.textContent;
    const verdict = () =>
      page.root.querySelector('[data-testid="verdict"]')!.textContent!;

    page.switchFor("malacca")!.click();
    expect(label()).toBe("a short way around");
    expect(verdict().length).toBeGreaterThan(0);

    page.switchFor("malacca")!.click();
    page.switchFor("turkish")!.click();
    expect(label()).toBe("no way around");
    expect(verdict()).toMatch(/stop/);
  });

  it("stays quiet about the class when several are closed at once", () => {
    const page = open();
    page.switchFor("malacca")!.click();
    page.switchFor("turkish")!.click();
    expect(page.root.querySelector('[data-testid="verdict-class"]')!.textContent).toBe("");
  });
});

describe("the URL is the state", () => {
  // The round-trip tests below prove the grammar. These prove the page is
  // actually wired to it — that closing a strait reaches the address bar, and
  // that an address reaches the page.

  it("writes the closed set into the URL", () => {
    const page = open();
    page.switchFor("hormuz")!.click();
    expect(readHash(location.hash)).toEqual(new Set<ChokepointId>(["hormuz"]));
  });

  it("returns to baseline when the last strait reopens", () => {
    const page = open();
    page.switchFor("hormuz")!.click();
    page.switchFor("hormuz")!.click();

    // The semantics, not the spelling: whether baseline is a bare path or an
    // explicit empty hash is a separate decision, and this should survive it.
    expect(readHash(location.hash)).toEqual(new Set());
    for (const chokepoint of CHOKEPOINTS) {
      expect(page.switchFor(chokepoint.id)!.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("opens straight into a shared state", () => {
    const page = open("#closed=hormuz");

    expect(page.switchFor("hormuz")!.getAttribute("aria-pressed")).toBe("true");
    expect(Number(page.strandedText())).toBeCloseTo(
      allocate(new Set<ChokepointId>(["hormuz"])).strandedMbd,
      2,
    );
  });

  it("follows a hash change from outside the page", async () => {
    const page = open();
    location.hash = "#closed=turkish";

    // hashchange is asynchronous in jsdom, and listener order is not
    // guaranteed — waiting on the event can still observe a stale DOM, so wait
    // on the DOM itself.
    await vi.waitFor(() => {
      expect(page.switchFor("turkish")!.getAttribute("aria-pressed")).toBe("true");
    });
    expect(Number(page.strandedText())).toBeCloseTo(
      allocate(new Set<ChokepointId>(["turkish"])).strandedMbd,
      2,
    );
  });
});

/** Change the hash and wait until every hashchange listener has run. */
async function navigate(hash: string): Promise<void> {
  const fired = new Promise<void>((resolve) => {
    addEventListener("hashchange", () => resolve(), { once: true });
  });
  location.hash = hash;
  await fired;
  // This listener may have run before the app's, so yield once more before
  // asserting that the app did — or did not — react.
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe("navigating the page does not reset the model", () => {
  // index.html's masthead nav and skip link target #chokepoints, #flows and
  // #sources. Those arrive as hashchange, and a handler that treats every hash
  // as model state reads no `closed=` key, gets an empty set, and silently
  // reopens everything the visitor closed.

  it("keeps the closed set when the visitor uses the section nav", async () => {
    const page = open();
    page.switchFor("hormuz")!.click();

    await navigate("#flows");

    // navigate() only resolves once hashchange has fired, so the nav is already
    // proven to have happened; where the URL ends up afterwards is asserted by
    // "the URL keeps describing the page" below.
    expect(
      page.switchFor("hormuz")!.getAttribute("aria-pressed"),
      "visiting a section fragment reopened a closed strait",
    ).toBe("true");
    expect(Number(page.strandedText())).toBeCloseTo(
      allocate(new Set<ChokepointId>(["hormuz"])).strandedMbd,
      2,
    );
  });

  it("still adopts an explicitly empty state", async () => {
    const page = open();
    page.switchFor("hormuz")!.click();

    // `#closed=` names the empty set rather than naming a section, so unlike
    // `#flows` it is a claim about the model and must be obeyed. This is the
    // href a "reopen everything" link will use.
    await navigate("#closed=");

    expect(page.switchFor("hormuz")!.getAttribute("aria-pressed")).toBe("false");
    expect(page.strandedText()).toBe("0.00");
  });
});

describe("reopening everything", () => {
  it("offers no way back when there is nothing to come back from", () => {
    const page = open();
    // Present in the markup or absent entirely is an implementation choice;
    // what matters is that Tab cannot reach a control that would do nothing.
    expect(tabStops(page.root).map((el) => el.dataset.control)).not.toContain("reopen-all");
  });

  it("appears once a chokepoint is closed", () => {
    const page = open();
    page.switchFor("hormuz")!.click();
    expect(tabStops(page.root).map((el) => el.dataset.control)).toContain("reopen-all");
  });

  it("reopens every strait at once", () => {
    const page = open();
    for (const id of ["hormuz", "turkish", "danish"] as ChokepointId[]) {
      page.switchFor(id)!.click();
    }
    expect(Number(page.strandedText())).toBeGreaterThan(0);

    page.reopen()!.click();

    expect(readHash(location.hash)).toEqual(new Set());
    expect(Number(page.strandedText())).toBeCloseTo(allocate(new Set()).strandedMbd, 2);
    for (const chokepoint of CHOKEPOINTS) {
      expect(page.switchFor(chokepoint.id)!.getAttribute("aria-pressed")).toBe("false");
    }
  });

  it("leaves focus somewhere useful rather than on the body", () => {
    const page = open();
    page.switchFor("hormuz")!.click();

    page.reopen()!.click();

    // The control removes itself from the tab order as it succeeds, so it
    // cannot keep focus — and `disabled` would drop focus to <body> just the
    // same. Focus lands at the top of the group the visitor was working in.
    expect(document.activeElement).not.toBe(document.body);
    expect(document.activeElement).toBe(page.root.querySelector(".controls h2"));
  });

  it("agrees with the baseline link on both state and URL", async () => {
    const byButton = open();
    byButton.switchFor("hormuz")!.click();
    byButton.switchFor("suez")!.click();
    byButton.reopen()!.click();
    const viaButton = { state: readHash(location.hash), url: location.hash };

    // Tear down before the second page so its listener cannot react as well.
    for (const app of live.splice(0)) app.destroy();
    document.body.textContent = "";
    history.replaceState(null, "", "/");

    const byLink = open();
    byLink.switchFor("hormuz")!.click();
    byLink.switchFor("suez")!.click();
    await navigate("#closed=");
    const viaLink = { state: readHash(location.hash), url: location.hash };

    // Two routes to baseline — the control and the href a preset link will
    // use. One state must be one URL, whichever door the visitor came through.
    expect(viaLink).toEqual(viaButton);
    expect(viaLink.state).toEqual(new Set());
    expect(Number(byLink.strandedText())).toBeCloseTo(allocate(new Set()).strandedMbd, 2);
  });
});

describe("the URL keeps describing the page", () => {
  // Preserving the model through a section nav leaves the other half wrong: the
  // address bar says #flows while Hormuz is shut, so copying it shares
  // baseline. This page sells its permalink, so the state wins and the section
  // fragment is transient.

  it("returns the URL to the state after a section nav", async () => {
    const page = open();
    page.switchFor("hormuz")!.click();

    await navigate("#flows");

    expect(readHash(location.hash)).toEqual(new Set<ChokepointId>(["hormuz"]));
    expect(page.switchFor("hormuz")!.getAttribute("aria-pressed")).toBe("true");
  });

  it("leaves a section fragment alone when there is no state to lose", async () => {
    open();

    await navigate("#flows");

    // Nothing is closed, so #flows is already an honest description of the
    // page. Stripping it would throw away the anchor and buy nothing — and it
    // would spend the dead back-press below for no reason.
    expect(location.hash).toBe("#flows");
  });
});

describe("a section fragment still reaches its section", () => {
  // The browser resolves a fragment against the page as it was parsed, before
  // the interface exists, so start() re-applies it after the first render.
  // These are the only tests that reach that block.

  it("scrolls to the section the fragment names", () => {
    const page = open("#flows");

    // The identity of the target, not the call count: a count alone passes
    // when the block scrolls to the wrong node.
    expect(scrollTargets).toEqual([page.root.querySelector("#flows")]);
  });

  it("does not scroll when the fragment carries state instead", () => {
    open("#closed=hormuz");
    expect(scrolled).not.toHaveBeenCalled();
  });
});

describe("the ways around are visible before they are needed", () => {
  // Half the argument is "is there another way round, and how wide is it".
  // Until a strait is shut nothing flows through a bypass, so without this the
  // visitor cannot see that the alternatives exist at all — only that some
  // closures hurt and others do not, with no visible reason why.

  /** Every number in a string, so a claim can be checked without matching its spelling. */
  const numbersIn = (text: string) =>
    [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

  const totalCapacity = () =>
    BYPASSES.reduce((sum, bypass) => sum + (bypass.capacityMbd ?? 0), 0);

  it("draws every way around at baseline, when none is carrying anything", () => {
    const page = open();
    expect(
      [...page.root.querySelectorAll("path.bypass")].map((p) => p.getAttribute("data-leg")),
    ).toEqual(BYPASSES.map((b) => b.id));
  });

  it("draws them under the flows, so a bypass in use shows as in use", () => {
    const page = open("#closed=hormuz");
    const layers = [...page.root.querySelectorAll("svg > g")].map((g) =>
      g.getAttribute("class"),
    );
    expect(layers.indexOf("bypasses")).toBeGreaterThanOrEqual(0);
    expect(layers.indexOf("bypasses")).toBeLessThan(layers.indexOf("flows"));
  });

  it("says nothing about capacity while none is in use", () => {
    const page = open();
    expect(page.root.querySelector('[data-testid="bypass"]')!.textContent).toBe("");
  });

  it("reports what the ways around are carrying once one is closed", () => {
    const page = open("#closed=hormuz");
    const line = page.root.querySelector('[data-testid="bypass"]')!.textContent!;
    const used = Object.values(
      allocate(new Set<ChokepointId>(["hormuz"])).bypassUsageMbd,
    ).reduce((sum, v) => sum + v, 0);

    expect(
      numbersIn(line).find((n) => Math.abs(n - used) < 0.005),
      `no number in "${line}" matches the ${used} mb/d the model actually routes`,
    ).toBeDefined();
  });

  it("states the capacity the data actually provides, not a number someone typed", () => {
    const page = open("#closed=hormuz");
    const line = page.root.querySelector('[data-testid="bypass"]')!.textContent!;
    const expected = totalCapacity();

    // Derived from BYPASSES, so a hardcoded figure cannot satisfy it: change a
    // capacity in the data and this fails until the page follows. Comparing
    // formatted strings would pass on a literal, which is the whole failure
    // this test exists to catch.
    expect(
      numbersIn(line).find((n) => Math.abs(n - expected) < 0.005),
      `no number in "${line}" equals the ${expected} mb/d BYPASSES provide`,
    ).toBeDefined();
  });

  it("names each way around with its own capacity and source", () => {
    const page = open();
    for (const bypass of BYPASSES) {
      const path = page.root.querySelector(`path.bypass[data-leg="${bypass.id}"]`)!;
      const label = path.querySelector("title")!.textContent!;
      expect(label, `${bypass.id} is unnamed`).toContain(bypass.name!);
      // The data-honesty rule applies to anything shown, including a tooltip.
      expect(label, `${bypass.id} shows a figure with no source`).toContain(
        bypass.source.slice(0, 24),
      );
    }
  });
});

describe("a state is shareable", () => {
  it("round-trips through the URL hash", () => {
    const closed = new Set<ChokepointId>(["hormuz", "suez"]);
    expect(readHash(writeHash(closed))).toEqual(closed);
  });

  it("writes the empty state as no hash at all", () => {
    expect(writeHash(new Set())).toBe("");
    expect(readHash("")).toEqual(new Set());
  });

  it("orders ids so one state is one URL", () => {
    const a = writeHash(new Set<ChokepointId>(["suez", "hormuz"]));
    const b = writeHash(new Set<ChokepointId>(["hormuz", "suez"]));
    expect(a).toBe(b);
  });

  it("ignores anything it does not recognise", () => {
    expect(readHash("#closed=hormuz,notastrait,,%20")).toEqual(
      new Set<ChokepointId>(["hormuz"]),
    );
    expect(readHash("#something=else")).toEqual(new Set());
  });
});

describe("the map redraws", () => {
  it("draws a line for every routed leg", () => {
    const page = open();
    const before = page.root.querySelectorAll("path.flow").length;
    expect(before).toBeGreaterThan(0);

    page.switchFor("malacca")!.click();
    const after = page.root.querySelectorAll("path.flow").length;
    expect(after).toBeGreaterThan(0);

    // Lombok is one leg where Malacca was one leg, so the count holds; what
    // changes is which legs are drawn.
    const legs = [...page.root.querySelectorAll("path.flow")].map((p) =>
      p.getAttribute("data-leg"),
    );
    expect(legs).toContain("sea-lombok");
    expect(legs).not.toContain("sea-malacca");
  });

  it("marks stranded volume at the port it could not leave", () => {
    const page = open();
    expect(page.root.querySelectorAll("circle.strand").length).toBe(0);

    page.switchFor("turkish")!.click();
    const strands = page.root.querySelectorAll("circle.strand");
    expect(strands.length).toBeGreaterThan(0);
    expect([...strands].map((s) => s.getAttribute("data-node"))).toContain(
      "novorossiysk",
    );
  });

  it("distinguishes a pipeline from a shipping lane", () => {
    const page = open();
    page.switchFor("hormuz")!.click();
    const pipelines = page.root.querySelectorAll("path.flow--pipeline");
    expect(pipelines.length).toBeGreaterThan(0);
    expect([...pipelines].map((p) => p.getAttribute("data-leg"))).toContain("petroline");
  });
});
