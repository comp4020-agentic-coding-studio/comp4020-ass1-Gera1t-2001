import { CHOKEPOINTS, CHOKEPOINT_BY_ID } from "../data/chokepoints";
import { FLOWS, TOTAL_MBD } from "../data/flows";
import { BYPASSES, LEGS } from "../data/network";
import type { Allocation, ChokepointId } from "../model/types";
import {
  LAND_PATH,
  SPHERE_PATH,
  VIEW_HEIGHT,
  VIEW_WIDTH,
  legPath,
  project,
  projectNode,
} from "./geo";

const SVG_NS = "http://www.w3.org/2000/svg";
const LEG_BY_ID = new Map(LEGS.map((leg) => [leg.id, leg]));
const FLOW_BY_ID = new Map(FLOWS.map((flow) => [flow.id, flow]));

function svg<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    node.setAttribute(key, String(value));
  }
  return node;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

const mbd = (value: number) => value.toFixed(2);
/** Volume drives stroke weight; the square root keeps big flows from swamping the map. */
const strokeFor = (volume: number) => 0.7 + 1.9 * Math.sqrt(volume);

/**
 * A floor on the dormant bypass stroke, in viewBox units.
 *
 * Measured, not chosen: at 390px the map renders at 0.476 device px per unit,
 * so the Kiel Canal's capacity-derived 1.55 came out at 0.74px — below one
 * device pixel, drawn but not visible, which is the exact failure this layer
 * exists to fix. 2.2 units clears one pixel there with a little headroom; 2.1
 * lands on 0.9996 and the spec catches it. It binds on Kiel alone; every other
 * bypass is already wider, so the capacity encoding is untouched except at the
 * very bottom of the scale, where it would otherwise encode "invisible".
 */
const BYPASS_MIN_STROKE = 2.2;

export interface View {
  update: (allocation: Allocation) => void;
}

/**
 * What the visitor just did, as reported by the view.
 *
 * A tagged intent rather than one callback per control, because what happens
 * next is not the same for every control. A toggle is exploration and rewrites
 * the current history entry; reopening everything is destructive and should be
 * undoable with the back button. Each intent has to decide both its next state
 * and how it touches history, and that decision belongs in one exhaustive
 * switch rather than scattered across a growing parameter list.
 */
export type Intent =
  | { readonly type: "toggle"; readonly id: ChokepointId }
  | { readonly type: "reopen-all" };

/**
 * Build the interface once, then update it in place.
 *
 * The map markers are pointer affordances only (`aria-hidden`); the real
 * controls are the buttons in the switch list, so keyboard and screen-reader
 * users get exactly seven stops rather than fourteen, with no duplicate
 * announcements.
 */
export function mount(
  root: HTMLElement,
  onIntent: (intent: Intent) => void,
): View {
  root.textContent = "";

  // ── Map ─────────────────────────────────────────────────────────────────
  const figure = el("figure", { class: "stage" });
  const chart = svg("svg", {
    viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`,
    // `slice` only bites where CSS gives the box a height of its own — on a
    // phone, where it crops the empty polar bands instead of letterboxing
    // them. On desktop the height is auto, the box matches the viewBox aspect
    // exactly, and slice behaves identically to meet.
    preserveAspectRatio: "xMidYMid slice",
    class: "map",
    "data-testid": "map",
    role: "img",
    "aria-label":
      "World map of the oil flows and chokepoints described in the table below.",
  });

  chart.append(
    svg("path", { d: SPHERE_PATH, class: "ocean" }),
    svg("path", { d: LAND_PATH, class: "land" }),
  );

  // ── The ways around ─────────────────────────────────────────────────────
  // Drawn once and never rebuilt: these are fixed infrastructure, not a
  // result. At baseline every one of them carries nothing, so without this the
  // visitor cannot see that the alternatives exist — only that some closures
  // hurt and others do not, with no visible reason why. "Is there another way
  // round, and how wide is it" is the physical fact the three classes turn on.
  //
  // Width comes from the same scale as the flows, deliberately: it is what
  // makes Petroline read as narrower than the traffic it is supposed to
  // absorb. First in the stack, so a bypass actually carrying oil is painted
  // over by its flow and reads as in use rather than spare.
  //
  // "Ways around", not "bypass pipelines" — the Kiel Canal is one of these and
  // is a canal, so the dash pattern varies by kind instead.
  const bypassLayer = svg("g", { class: "bypasses" });
  const bypassLabels = new Map<string, SVGTitleElement>();

  for (const bypass of BYPASSES) {
    const line = svg("path", {
      d: legPath(bypass.id),
      class: `bypass bypass--${bypass.kind}`,
      "stroke-width": Math.max(
        strokeFor(bypass.capacityMbd ?? 0),
        BYPASS_MIN_STROKE,
      ).toFixed(2),
      "data-leg": bypass.id,
    });
    const label = document.createElementNS(SVG_NS, "title");
    line.append(label);
    bypassLabels.set(bypass.id, label);
    bypassLayer.append(line);
  }

  const flowLayer = svg("g", { class: "flows" });
  const strandLayer = svg("g", { class: "strands" });
  const markLayer = svg("g", { class: "marks" });
  chart.append(bypassLayer, flowLayer, strandLayer, markLayer);
  figure.append(chart);

  // ── The number ──────────────────────────────────────────────────────────
  // A div, not an <output>. <output> carries an implicit role of status, which
  // carries an implicit aria-live — so simply dropping the attribute would
  // have left this region live and the change would have done nothing. The
  // spoken summary below is now the page's only live region.
  const readout = el("div", {
    class: "readout",
    "data-testid": "readout",
  });
  const readoutValue = el("span", { class: "readout__value" }, "0.00");
  const readoutUnit = el("span", { class: "readout__unit" }, "mb/d stranded");
  const readoutSub = el(
    "span",
    { class: "readout__sub" },
    `of ${mbd(TOTAL_MBD)} modelled`,
  );
  // Stranded volume alone reports four of the seven chokepoints as zero, which
  // reads as a broken switch rather than as the answer. The detour line is the
  // other half of what happened, and the verdict says which of the two kinds
  // of fragile the visitor just found.
  const readoutDetour = el("span", {
    class: "readout__detour",
    "data-testid": "detour",
  });
  // The map shows the ways around and how wide they are; this is the same fact
  // for anyone not using a pointer. One short clause, because it sits inside
  // the aria-live region and is announced on every change.
  const readoutBypass = el("span", {
    class: "readout__bypass",
    "data-testid": "bypass",
  });
  const readoutClass = el("span", {
    class: "readout__class",
    "data-testid": "verdict-class",
  });
  const readoutVerdict = el("span", {
    class: "readout__verdict",
    "data-testid": "verdict",
  });
  readout.append(
    readoutValue,
    readoutUnit,
    readoutSub,
    readoutDetour,
    readoutBypass,
    readoutClass,
    readoutVerdict,
  );
  figure.append(readout);

  // The readout is composed for the eye: a number, a unit, a percentage, a
  // detour clause, a class label and a verdict — six fragments that read as a
  // list when spoken, and were announced in full on every single toggle. This
  // is the same answer written as a sentence. The readout keeps every figure
  // and stays reachable in browse mode; it is simply no longer re-read aloud
  // each time something changes.
  const spoken = el("p", {
    class: "sr-only",
    role: "status",
    "aria-live": "polite",
    "data-testid": "spoken",
  });
  figure.append(spoken);
  root.append(figure);

  // ── Chokepoint switches ─────────────────────────────────────────────────
  const controls = el("section", { class: "controls", id: "chokepoints" });
  // tabindex="-1" so focus can be moved here deliberately without adding a tab
  // stop. Reopening everything removes the control that did it from the tab
  // order, and focus would otherwise fall to <body> — as it also would if the
  // button were merely disabled rather than hidden.
  const controlsHeading = el(
    "h2",
    { class: "controls__heading", tabindex: "-1" },
    "Close one and see",
  );
  controls.append(
    controlsHeading,
    // The list is sorted by volume, and that sorting is the argument: it is the
    // ranking everyone reaches for, and it predicts almost nothing. Saying so
    // sets up the subversion without giving away which strait is which.
    el(
      "p",
      { class: "controls__hint" },
      "Ordered by how much oil they carry, largest first. " +
        "That order tells you almost nothing about what happens when you close one.",
    ),
  );

  // Only shown once there is something to undo. Hidden rather than removed so
  // the node is built once like everything else here, and `hidden` keeps it out
  // of both the tab order and the accessibility tree.
  const reopen = el(
    "button",
    { type: "button", class: "reopen", "data-control": "reopen-all", hidden: "" },
    "Reopen everything",
  );
  reopen.addEventListener("click", () => {
    onIntent({ type: "reopen-all" });
    // The update triggered above has already hidden this button, so focus is
    // on <body> by now. Put it at the top of the group the visitor was using;
    // the heading also names what they are looking at, which is the context a
    // screen reader needs after a change this large.
    controlsHeading.focus();
  });
  controls.append(reopen);

  const switchList = el("ul", { class: "switches" });
  const switches = new Map<ChokepointId, HTMLButtonElement>();
  const marks = new Map<ChokepointId, SVGGElement>();

  for (const chokepoint of CHOKEPOINTS) {
    const button = el("button", {
      type: "button",
      class: "switch",
      "data-chokepoint": chokepoint.id,
      "aria-pressed": "false",
    });
    button.append(
      el("span", { class: "switch__name" }, chokepoint.name),
      el("span", { class: "switch__flow" }, `${mbd(chokepoint.oilFlowMbd)} mb/d`),
      // Colour-coded by class, so the list can be scanned rather than only
      // read. This does not give the answer away — the answer is "volume does
      // not predict consequence", and putting the two side by side in a list
      // sorted by volume is what makes that visible at a glance. The
      // interaction is still what puts a number on it.
      el(
        "span",
        { class: `switch__class switch__class--${chokepoint.reroutability}` },
        rerouteLabel(chokepoint.reroutability),
      ),
      el("span", { class: "switch__note" }, chokepoint.note),
      el("span", { class: "switch__state", "data-testid": `state-${chokepoint.id}` }, "open"),
    );
    button.addEventListener("click", () =>
      onIntent({ type: "toggle", id: chokepoint.id }),
    );
    switches.set(chokepoint.id, button);

    const item = el("li");
    item.append(button);
    switchList.append(item);

    const [x, y] = project(chokepoint.lon, chokepoint.lat);
    const mark = svg("g", { class: "mark", transform: `translate(${x} ${y})` });
    mark.setAttribute("aria-hidden", "true");
    mark.append(
      svg("circle", { r: 11, class: "mark__hit" }),
      svg("circle", { r: 5.5, class: "mark__ring" }),
      svg("path", { d: "M-3.4 -3.4 L3.4 3.4 M3.4 -3.4 L-3.4 3.4", class: "mark__cross" }),
    );
    mark.addEventListener("click", () =>
      onIntent({ type: "toggle", id: chokepoint.id }),
    );
    marks.set(chokepoint.id, mark);
    markLayer.append(mark);
  }

  controls.append(switchList);
  root.append(controls);

  // ── Flow table ──────────────────────────────────────────────────────────
  const table = el("table", { class: "flows-table", "data-testid": "flows" });
  const head = el("thead");
  const headRow = el("tr");
  for (const [label, scope] of [
    ["Flow", "col"],
    ["Carrying", "col"],
    ["Still moving", "col"],
    ["Stranded", "col"],
    ["Days added", "col"],
  ] as const) {
    headRow.append(el("th", { scope }, label));
  }
  head.append(headRow);
  const body = el("tbody");
  const rows = new Map<string, HTMLTableRowElement>();

  for (const flow of FLOWS) {
    const row = el("tr", { "data-flow": flow.id });
    const name = el("th", { scope: "row" });
    name.append(
      el("span", { class: "flow__label" }, flow.label),
      el("span", { class: "flow__note" }, flow.note),
    );
    row.append(
      name,
      el("td", { class: "num" }, mbd(flow.volumeMbd)),
      el("td", { class: "num", "data-cell": "routed" }, mbd(flow.volumeMbd)),
      el("td", { class: "num", "data-cell": "stranded" }, "0.00"),
      el("td", { class: "num", "data-cell": "added" }, "—"),
    );
    body.append(row);
    rows.set(flow.id, row);
  }
  table.append(head, body);

  const flowSection = el("section", { class: "flows-section", id: "flows" });
  flowSection.append(
    el("h2", {}, "Where the oil is going"),
    el(
      "p",
      { class: "flows-section__hint" },
      "Eleven flows, 34.50 million barrels a day. The last two touch no chokepoint at all — " +
        "watch them stay exactly where they are.",
    ),
    table,
  );
  root.append(flowSection);

  // ── Linking the map to the table ────────────────────────────────────────
  // Eleven flows overlap heavily around the Gulf, and a table of eleven rows
  // is no easier to scan. Pointing at either one picks out the other.
  //
  // Pointer only, deliberately: every figure on the map is already a cell in
  // the table, so nothing here is a channel a keyboard user would otherwise
  // lack — and making eleven rows focusable would add eleven tab stops in
  // front of the seven that actually do something.
  function highlight(flowId: string | null): void {
    chart.classList.toggle("map--linked", flowId !== null);
    for (const line of flowLayer.querySelectorAll<SVGPathElement>("path.flow")) {
      line.classList.toggle("flow--linked", line.getAttribute("data-flow") === flowId);
    }
    for (const [id, row] of rows) {
      row.classList.toggle("row--linked", id === flowId);
    }
  }

  for (const [flowId, row] of rows) {
    row.addEventListener("pointerenter", () => highlight(flowId));
    row.addEventListener("pointerleave", () => highlight(null));
  }

  // ── Update ──────────────────────────────────────────────────────────────
  function update(allocation: Allocation): void {
    const closed = new Set(allocation.closed);

    const rerouted = allocation.flows.filter((flow) => flow.addedDays > 0);
    const worstDetour = Math.max(0, ...allocation.flows.map((flow) => flow.addedDays));

    readoutValue.textContent = mbd(allocation.strandedMbd);
    readoutUnit.textContent = "mb/d stranded";
    readoutSub.textContent =
      allocation.strandedMbd > 0
        ? `${((allocation.strandedMbd / TOTAL_MBD) * 100).toFixed(0)}% of the ${mbd(TOTAL_MBD)} modelled`
        : `of ${mbd(TOTAL_MBD)} modelled`;
    readout.classList.toggle("readout--alarm", allocation.strandedMbd > 0);

    if (allocation.closed.length === 0) {
      readoutDetour.textContent = "Nothing closed. Every route is its shortest.";
    } else if (rerouted.length === 0) {
      readoutDetour.textContent = "No route got any longer.";
    } else {
      readoutDetour.textContent =
        `${rerouted.length} ${rerouted.length === 1 ? "flow" : "flows"} rerouted` +
        ` · +${worstDetour.toFixed(1)} days at worst`;
    }

    // Named only when one strait is shut, because with several closed there is
    // no single thing to name — the numbers above are the answer then.
    const only =
      allocation.closed.length === 1
        ? CHOKEPOINT_BY_ID.get(allocation.closed[0])
        : undefined;
    readoutClass.textContent = only ? rerouteLabel(only.reroutability) : "";
    readoutVerdict.textContent = only
      ? verdict(allocation.strandedMbd, rerouted.length, worstDetour)
      : "";
    readout.classList.toggle("readout--verdict", Boolean(only));

    spoken.textContent = spokenSummary(allocation, rerouted.length, worstDetour);

    // Both figures come from the data and the result — never a literal, so
    // changing a capacity in src/data/ moves the page with it.
    let usedTotal = 0;
    let availableTotal = 0;
    for (const bypass of BYPASSES) {
      const capacity = bypass.capacityMbd ?? 0;
      const used = allocation.bypassUsageMbd[bypass.id] ?? 0;
      usedTotal += used;
      availableTotal += capacity;

      // No "in use" class: the flow layer already paints over a bypass that is
      // carrying, and because width is capacity while the flow's width is
      // volume, a partly-used line shows as a narrow bright stroke inside a
      // wider faint one — how full the pipe is, for free.
      bypassLabels.get(bypass.id)!.textContent =
        `${bypass.name}\n${mbd(used)} of ${mbd(capacity)} mb/d in use\n${bypass.source}`;
    }
    readoutBypass.textContent =
      usedTotal > 0
        ? `Ways around: ${mbd(usedTotal)} of ${mbd(availableTotal)} mb/d in use`
        : "";

    reopen.hidden = allocation.closed.length === 0;
    reopen.textContent =
      allocation.closed.length === 1 ? "Reopen it" : "Reopen all of them";

    for (const chokepoint of CHOKEPOINTS) {
      const shut = closed.has(chokepoint.id);
      const button = switches.get(chokepoint.id)!;
      button.setAttribute("aria-pressed", String(shut));
      button.classList.toggle("switch--closed", shut);
      button.querySelector(`[data-testid="state-${chokepoint.id}"]`)!.textContent = shut
        ? "closed"
        : "open";
      marks.get(chokepoint.id)!.classList.toggle("mark--closed", shut);
    }

    flowLayer.textContent = "";
    strandLayer.textContent = "";
    const strandedByOrigin = new Map<string, number>();

    // Flows share legs — Gulf-to-Europe and US-Gulf-to-Europe both use the
    // Atlantic approach. Whichever is drawn last wins the pixels, so draw the
    // detoured ones last: a route that changed is the thing worth seeing, and
    // an unaffected flow painting over it hides exactly the wrong half.
    const drawOrder = [...allocation.flows].sort(
      (a, b) => Number(a.addedDays > 0) - Number(b.addedDays > 0),
    );

    for (const allocated of drawOrder) {
      const flow = FLOW_BY_ID.get(allocated.flowId)!;
      const detoured = allocated.addedDays > 0;

      for (const segment of allocated.segments) {
        for (const legId of segment.legIds) {
          const leg = LEG_BY_ID.get(legId)!;
          const line = svg("path", {
            d: legPath(legId),
            class: `flow ${leg.kind === "pipeline" ? "flow--pipeline" : "flow--sea"}${
              detoured ? " flow--detoured" : ""
            }`,
            "stroke-width": strokeFor(segment.mbd).toFixed(2),
            "data-flow": allocated.flowId,
            "data-leg": legId,
          });
          line.addEventListener("pointerenter", () => highlight(allocated.flowId));
          line.addEventListener("pointerleave", () => highlight(null));
          flowLayer.append(line);
        }
      }

      if (allocated.strandedMbd > 0) {
        strandedByOrigin.set(
          flow.from,
          (strandedByOrigin.get(flow.from) ?? 0) + allocated.strandedMbd,
        );
      }

      const row = rows.get(allocated.flowId)!;
      row.querySelector('[data-cell="routed"]')!.textContent = mbd(allocated.routedMbd);
      row.querySelector('[data-cell="stranded"]')!.textContent = mbd(allocated.strandedMbd);
      row.querySelector('[data-cell="added"]')!.textContent =
        allocated.addedDays > 0 ? `+${allocated.addedDays.toFixed(1)}` : "—";
      row.classList.toggle("row--stranded", allocated.strandedMbd > 0);
      row.classList.toggle("row--detoured", detoured && allocated.strandedMbd === 0);
    }

    // Oil that cannot leave piles up where it was loaded.
    for (const [nodeId, volume] of strandedByOrigin) {
      const [x, y] = projectNode(nodeId);
      strandLayer.append(
        svg("circle", {
          cx: x,
          cy: y,
          r: (3 + 3.4 * Math.sqrt(volume)).toFixed(2),
          class: "strand",
          "data-node": nodeId,
        }),
      );
    }
  }

  return { update };
}

/**
 * The same answer as the readout, written to be heard rather than scanned.
 *
 * Built from the result like the verdict is, so it cannot drift out of step,
 * and deliberately short: this is announced on every toggle, and a visitor
 * comparing three chokepoints hears it three times.
 */
function spokenSummary(
  allocation: Allocation,
  reroutedFlows: number,
  worstDetour: number,
): string {
  const names = allocation.closed.map((id) => CHOKEPOINT_BY_ID.get(id)!.name);
  if (names.length === 0) return "Nothing closed. Every route is its shortest.";

  const opening =
    names.length === 1
      ? `${names[0]} closed.`
      : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} closed.`;

  // Four of the seven strand nothing. Saying only "nothing stranded" for those
  // would be the dead-switch bug in speech, so the detour is the answer there.
  const outcome =
    allocation.strandedMbd > 0
      ? `${mbd(allocation.strandedMbd)} of ${mbd(TOTAL_MBD)} million barrels a day stranded.`
      : reroutedFlows > 0
        ? `Nothing stranded; ${reroutedFlows} ${reroutedFlows === 1 ? "flow" : "flows"} rerouted, up to ${worstDetour.toFixed(1)} days longer.`
        : "Nothing stranded, and no route is longer.";

  // Named only when one is shut, matching the panel: with several closed there
  // is no single class to name.
  const only = names.length === 1 ? CHOKEPOINT_BY_ID.get(allocation.closed[0]) : undefined;
  const label = only ? rerouteLabel(only.reroutability) : "";
  const verdictClass = label ? ` ${label[0].toUpperCase()}${label.slice(1)}.` : "";

  return `${opening} ${outcome}${verdictClass}`;
}

function rerouteLabel(reroutability: (typeof CHOKEPOINTS)[number]["reroutability"]): string {
  switch (reroutability) {
    case "none":
      return "no way around";
    case "long":
      return "a long way around";
    case "short":
      return "a short way around";
  }
}

/**
 * One sentence for what just happened, built from the result rather than
 * written per chokepoint — so it cannot drift out of step with the model, and
 * so the awkward cases stay honest. The Danish Straits have no sea
 * alternative and still move 0.2 mb/d through the Kiel Canal; "nothing gets
 * out" would be a lie, and this says "almost nothing" instead.
 */
function verdict(strandedMbd: number, reroutedFlows: number, worstDetour: number): string {
  if (strandedMbd > 0) {
    const share = reroutedFlows > 0 ? "The rest goes the long way round." : "";
    return strandedMbd > 1
      ? `${mbd(strandedMbd)} million barrels a day stop where they are. ${share}`.trim()
      : `Almost nothing gets out. ${share}`.trim();
  }
  if (worstDetour >= 3) {
    return `Every barrel still moves — up to ${worstDetour.toFixed(1)} days later than it did.`;
  }
  if (worstDetour > 0) {
    return "Every barrel still moves, and barely any later. You would not notice.";
  }
  return "Nothing changed. Nothing here depended on it.";
}
