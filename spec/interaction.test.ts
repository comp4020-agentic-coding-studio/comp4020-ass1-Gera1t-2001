// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { CHOKEPOINTS } from "../src/data/chokepoints";
import { FLOWS } from "../src/data/flows";
import { allocate } from "../src/model/allocate";
import type { ChokepointId } from "../src/model/types";
import { mount } from "../src/render/view";
import { readHash, writeHash } from "../src/ui/permalink";

// The model tests in assignment1.test.ts prove the allocation is right. These
// prove the visitor can actually reach it: that the controls are real buttons
// a keyboard can operate, that they say what state they are in, and that the
// number on screen is the number the model computed.
//
// They mount the real render into jsdom rather than parsing built markup,
// because the interface is built by script — parsing dist/index.html would
// only ever see the empty shell.

function open() {
  const root = document.createElement("main");
  document.body.append(root);
  const closed = new Set<ChokepointId>();
  const view = mount(root, (id) => {
    if (closed.has(id)) closed.delete(id);
    else closed.add(id);
    view.update(allocate(closed));
  });
  view.update(allocate(closed));

  return {
    root,
    closed,
    switchFor: (id: ChokepointId) =>
      root.querySelector<HTMLButtonElement>(`button[data-chokepoint="${id}"]`),
    readout: () => root.querySelector<HTMLElement>('[data-testid="readout"]')!,
    strandedText: () =>
      root.querySelector<HTMLElement>('[data-testid="readout"] .readout__value')!
        .textContent,
  };
}

beforeEach(() => {
  document.body.textContent = "";
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
    const page = open();
    const focusable = page.root.querySelectorAll("button, [tabindex]");
    expect(focusable.length).toBe(CHOKEPOINTS.length);
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
