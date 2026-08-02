import { describe, expect, it } from "vitest";
import { CHOKEPOINTS } from "../src/data/chokepoints";
import { FLOWS } from "../src/data/flows";
import { LEGS } from "../src/data/network";
import { allocate } from "../src/model/allocate";
import type { ChokepointId } from "../src/model/types";

// Assignment 1's published spec, line 4:
//
//   "the visitor does something that changes what they see — state the core
//    interaction plainly enough to write a test for it"
//
// The core interaction, stated plainly:
//
//   Closing a chokepoint re-allocates every oil flow that transits it. Each
//   flow tries, in order: a sea reroute that avoids every closed chokepoint,
//   then bypass pipelines up to their capacity, and whatever fits in neither
//   is stranded. The stranded total, in million barrels per day, is what the
//   visitor watches move.
//
// These tests assert that contract at the model level, so they survive a
// change of rendering approach — or of stack.

const ids = CHOKEPOINTS.map((c) => c.id);
const all = (extra: ChokepointId[] = []) => new Set(extra);

describe("baseline: nothing closed", () => {
  const base = allocate(all());

  it("strands nothing", () => {
    expect(base.strandedMbd).toBe(0);
  });

  it("routes every flow in full", () => {
    for (const flow of base.flows) {
      expect(flow.routedMbd, `${flow.flowId} did not route in full`).toBeCloseTo(
        flow.volumeMbd,
        6,
      );
      expect(flow.strandedMbd).toBe(0);
    }
  });

  it("adds no transit days to any flow", () => {
    for (const flow of base.flows) {
      expect(flow.addedDays, `${flow.flowId} is already detoured`).toBe(0);
    }
  });
});

describe("the core interaction: closing a chokepoint moves the numbers", () => {
  it("closing Hormuz strands volume no pipeline can absorb", () => {
    const closed = allocate(all(["hormuz"]));
    expect(closed.strandedMbd).toBeGreaterThan(0);

    // EIA puts Hormuz at ~20.9 mb/d against ~5.0 mb/d of bypass-pipeline
    // capacity. Whatever the routing does, the shortfall is most of it.
    expect(closed.strandedMbd).toBeGreaterThan(10);
  });

  it("closing Malacca detours flows without stranding them", () => {
    const closed = allocate(all(["malacca"]));
    expect(closed.strandedMbd).toBe(0);

    const detoured = closed.flows.filter((f) => f.addedDays > 0);
    expect(detoured.length).toBeGreaterThan(0);
  });

  it("reopening restores the baseline exactly", () => {
    const base = allocate(all());
    allocate(all(["hormuz", "suez", "malacca"]));
    const reopened = allocate(all());

    expect(reopened.strandedMbd).toBe(base.strandedMbd);
    expect(reopened.routedMbd).toBeCloseTo(base.routedMbd, 6);
    expect(reopened.flows.map((f) => f.addedDays)).toEqual(
      base.flows.map((f) => f.addedDays),
    );
  });

  it("is deterministic", () => {
    const a = allocate(all(["hormuz", "panama"]));
    const b = allocate(all(["panama", "hormuz"]));
    expect(b.strandedMbd).toBe(a.strandedMbd);
    expect(b.flows).toEqual(a.flows);
  });
});

describe("no dead controls", () => {
  // A chokepoint the visitor can close that changes nothing is a decorative
  // switch — it lies to them about what the map means.
  //
  // "Changes" means any of the three things the visitor can see: volume
  // stranded, days added, or the route itself moving. The third matters on its
  // own — closing Bab el-Mandeb pushes Gulf-to-Europe crude onto Petroline,
  // which reaches Yanbu north of the strait. Barely any extra time, but the
  // line on the map jumps onto a pipeline, and that is the story.
  const routeOf = (a: ReturnType<typeof allocate>) =>
    a.flows.map((f) => f.segments.map((s) => s.legIds.join(">")).join("|"));

  it.each(ids)("closing %s changes at least one flow", (id) => {
    const base = allocate(all());
    const closed = allocate(all([id]));

    const changed =
      closed.strandedMbd > base.strandedMbd ||
      closed.flows.some((f, i) => f.addedDays > base.flows[i].addedDays) ||
      routeOf(closed).join("#") !== routeOf(base).join("#");

    expect(changed, `${id} is a dead toggle`).toBe(true);
  });
});

describe("the Petroline trap", () => {
  // Saudi Arabia's East-West pipeline is the largest official bypass around
  // Hormuz — but it discharges at Yanbu, inside the Red Sea. Oil that escapes
  // Hormuz overland still has to leave through Bab el-Mandeb or Suez. The
  // escape hatch opens into another chokepoint, and the model has to show it.
  //
  // It does not close completely: SUMED runs from Ain Sukhna to the
  // Mediterranean, so it bypasses the canal without needing the Red Sea exits.
  // Petroline's throughput is then capped by SUMED's 2.5 mb/d, not its own
  // 3.2 mb/d. Strangled, not severed — which is the more interesting result.
  it("carries volume when only Hormuz is shut", () => {
    const closed = allocate(all(["hormuz"]));
    expect(closed.bypassUsageMbd["petroline"]).toBeGreaterThan(0);
  });

  it("is throttled once the Red Sea exits are shut too", () => {
    const hormuzOnly = allocate(all(["hormuz"]));
    const withRedSea = allocate(all(["hormuz", "bab-el-mandeb", "suez"]));
    expect(withRedSea.bypassUsageMbd["petroline"]).toBeLessThan(
      hormuzOnly.bypassUsageMbd["petroline"],
    );
  });

  it("falls back to SUMED, and inherits its ceiling", () => {
    const closed = allocate(all(["hormuz", "bab-el-mandeb", "suez"]));
    const sumed = LEGS.find((l) => l.id === "sumed")!;
    expect(closed.bypassUsageMbd["petroline"]).toBeLessThanOrEqual(
      sumed.capacityMbd! + 1e-9,
    );
  });

  it("strands strictly more than Hormuz alone", () => {
    const hormuzOnly = allocate(all(["hormuz"]));
    const withRedSea = allocate(all(["hormuz", "bab-el-mandeb", "suez"]));
    expect(withRedSea.strandedMbd).toBeGreaterThan(hormuzOnly.strandedMbd);
  });
});

describe("conservation and capacity", () => {
  const scenarios: ChokepointId[][] = [
    [],
    ...ids.map((id) => [id]),
    ["hormuz", "bab-el-mandeb", "suez"],
    ["suez", "bab-el-mandeb"],
    ["danish", "turkish"],
    ids,
  ];

  it.each(scenarios.map((s) => [s.join("+") || "(none)", s] as const))(
    "conserves volume with %s closed",
    (_label, closed) => {
      const result = allocate(all(closed));
      const total = FLOWS.reduce((sum, f) => sum + f.volumeMbd, 0);

      expect(result.routedMbd + result.strandedMbd).toBeCloseTo(total, 6);
      for (const flow of result.flows) {
        expect(flow.routedMbd + flow.strandedMbd).toBeCloseTo(flow.volumeMbd, 6);
        expect(flow.routedMbd).toBeGreaterThanOrEqual(0);
        expect(flow.strandedMbd).toBeGreaterThanOrEqual(0);
      }
    },
  );

  it.each(scenarios.map((s) => [s.join("+") || "(none)", s] as const))(
    "never exceeds a bypass's capacity with %s closed",
    (_label, closed) => {
      const result = allocate(all(closed));
      for (const [id, used] of Object.entries(result.bypassUsageMbd)) {
        const leg = LEGS.find((l) => l.id === id);
        expect(leg, `unknown bypass ${id}`).toBeTruthy();
        expect(used).toBeGreaterThanOrEqual(0);
        expect(used).toBeLessThanOrEqual(leg!.capacityMbd! + 1e-9);
      }
    },
  );
});

describe("the control flows", () => {
  // Without a route that nothing touches, a visitor who closes Suez and sees
  // six lines move concludes "everything is fragile" — which is the opposite
  // of the point. These two must sit still.
  const controls = ["usgulf-europe", "russia-pacific-china"];

  it.each(ids)("leaves the control flows untouched when %s closes", (id) => {
    const base = allocate(all());
    const closed = allocate(all([id]));

    for (const control of controls) {
      const before = base.flows.find((f) => f.flowId === control);
      const after = closed.flows.find((f) => f.flowId === control);
      expect(before, `no such flow: ${control}`).toBeTruthy();
      expect(after!.routedMbd).toBeCloseTo(before!.routedMbd, 6);
      expect(after!.addedDays).toBe(0);
    }
  });
});

describe("data integrity", () => {
  it("cites a source for every flow", () => {
    for (const flow of FLOWS) {
      expect(flow.volumeMbd, `${flow.id} has no volume`).toBeGreaterThan(0);
      expect(flow.source.length, `${flow.id} has no source`).toBeGreaterThan(0);
    }
  });

  it("cites a source for every chokepoint", () => {
    for (const chokepoint of CHOKEPOINTS) {
      expect(chokepoint.source.length).toBeGreaterThan(0);
      expect(Math.abs(chokepoint.lat)).toBeLessThanOrEqual(90);
      expect(Math.abs(chokepoint.lon)).toBeLessThanOrEqual(180);
    }
  });

  it("gives every bypass a capacity and a source", () => {
    const bypasses = LEGS.filter((l) => l.capacityMbd !== undefined);
    expect(bypasses.length).toBeGreaterThan(0);
    for (const bypass of bypasses) {
      expect(bypass.capacityMbd, `${bypass.id} has no capacity`).toBeGreaterThan(0);
      expect(bypass.source.length, `${bypass.id} has no source`).toBeGreaterThan(0);
    }
  });

  it("cites a source for every sea leg", () => {
    for (const leg of LEGS) {
      expect(leg.source.length, `${leg.id} has no source`).toBeGreaterThan(0);
      expect(leg.days, `${leg.id} has no transit time`).toBeGreaterThan(0);
    }
  });
});
