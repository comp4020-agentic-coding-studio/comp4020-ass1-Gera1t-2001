import { CHOKEPOINTS } from "../data/chokepoints";
import { FLOWS, TOTAL_MBD } from "../data/flows";
import { LEGS } from "../data/network";
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

export interface View {
  update: (allocation: Allocation) => void;
}

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
  onToggle: (id: ChokepointId) => void,
): View {
  root.textContent = "";

  // ── Map ─────────────────────────────────────────────────────────────────
  const figure = el("figure", { class: "stage" });
  const chart = svg("svg", {
    viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`,
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

  const flowLayer = svg("g", { class: "flows" });
  const strandLayer = svg("g", { class: "strands" });
  const markLayer = svg("g", { class: "marks" });
  chart.append(flowLayer, strandLayer, markLayer);
  figure.append(chart);

  // ── The number ──────────────────────────────────────────────────────────
  const readout = el("output", {
    class: "readout",
    "data-testid": "readout",
    "aria-live": "polite",
  });
  const readoutValue = el("span", { class: "readout__value" }, "0.00");
  const readoutUnit = el("span", { class: "readout__unit" }, "mb/d stranded");
  const readoutSub = el(
    "span",
    { class: "readout__sub" },
    `of ${mbd(TOTAL_MBD)} modelled`,
  );
  readout.append(readoutValue, readoutUnit, readoutSub);
  figure.append(readout);
  root.append(figure);

  // ── Chokepoint switches ─────────────────────────────────────────────────
  const controls = el("section", { class: "controls", id: "chokepoints" });
  controls.append(
    el("h2", {}, "Close one and see"),
    el(
      "p",
      { class: "controls__hint" },
      "Every one of these carries more oil than the last one you would guess. " +
        "Three of them have nowhere else to send it.",
    ),
  );

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
      el("span", { class: "switch__class" }, rerouteLabel(chokepoint.reroutability)),
      el("span", { class: "switch__note" }, chokepoint.note),
      el("span", { class: "switch__state", "data-testid": `state-${chokepoint.id}` }, "open"),
    );
    button.addEventListener("click", () => onToggle(chokepoint.id));
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
    mark.addEventListener("click", () => onToggle(chokepoint.id));
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

  // ── Update ──────────────────────────────────────────────────────────────
  function update(allocation: Allocation): void {
    const closed = new Set(allocation.closed);

    readoutValue.textContent = mbd(allocation.strandedMbd);
    readoutSub.textContent =
      allocation.strandedMbd > 0
        ? `${((allocation.strandedMbd / TOTAL_MBD) * 100).toFixed(0)}% of the ${mbd(TOTAL_MBD)} modelled`
        : `of ${mbd(TOTAL_MBD)} modelled — everything is moving`;
    readoutUnit.textContent = "mb/d stranded";
    readout.classList.toggle("readout--alarm", allocation.strandedMbd > 0);

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

    for (const allocated of allocation.flows) {
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
