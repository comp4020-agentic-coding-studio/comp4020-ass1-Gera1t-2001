/**
 * The world as this explainer models it: a graph of sea legs and bypass
 * pipelines, a set of chokepoints that can be closed, and the oil flows that
 * have to get through.
 *
 * Every figure in `src/data/` carries a `source`. See CLAUDE.md → "Data
 * honesty" for the rule these types exist to enforce.
 */

export type ChokepointId =
  | "hormuz"
  | "bab-el-mandeb"
  | "suez"
  | "malacca"
  | "danish"
  | "turkish"
  | "panama";

/**
 * How much of a closure a detour can absorb. This is the explainer's whole
 * argument: the three classes look identical on a map and behave nothing
 * alike. Taken from Verschuur et al., "Systemic impacts of disruptions at
 * maritime chokepoints", Nature Communications (2025).
 */
export type Reroutability =
  /** No sea alternative. Closing it doesn't slow trade down, it stops it. */
  | "none"
  /** A detour over 5,000 km — a week or more of extra steaming. */
  | "long"
  /** A detour under 5,000 km — a day or two, barely noticed. */
  | "short";

export interface Chokepoint {
  readonly id: ChokepointId;
  readonly name: string;
  /** Coordinates from the IMF PortWatch chokepoints database. */
  readonly lat: number;
  readonly lon: number;
  /** Crude and petroleum products transiting, million barrels per day. */
  readonly oilFlowMbd: number;
  readonly reroutability: Reroutability;
  /** One line on what a closure actually means here. */
  readonly note: string;
  readonly source: string;
}

export type NodeId = string;

export interface Node {
  readonly id: NodeId;
  readonly name: string;
  readonly lat: number;
  readonly lon: number;
  /** Waypoints exist to shape the graph; they are not places oil starts or ends. */
  readonly kind: "port" | "waypoint";
}

export interface Leg {
  readonly id: string;
  readonly from: NodeId;
  readonly to: NodeId;
  /** Every chokepoint on this leg must be open for it to carry anything. */
  readonly via: readonly ChokepointId[];
  readonly days: number;
  readonly kind: "sea" | "pipeline";
  /**
   * A hard throughput ceiling, million barrels per day. Present on every
   * bypass — the pipelines, and the Kiel Canal, which is a sea leg but is
   * capped by the vessel size its locks accept. Absent on open sea legs.
   */
  readonly capacityMbd?: number;
  readonly name?: string;
  readonly source: string;
}

export interface Flow {
  readonly id: string;
  readonly label: string;
  readonly from: NodeId;
  readonly to: NodeId;
  readonly cargo: "crude" | "products" | "mixed";
  readonly volumeMbd: number;
  /** What this flow is here to demonstrate. Shown to the visitor. */
  readonly note: string;
  readonly source: string;
}

/** One contiguous portion of a flow that found the same route. */
export interface Segment {
  readonly mbd: number;
  readonly legIds: readonly string[];
  readonly days: number;
}

export interface FlowAllocation {
  readonly flowId: string;
  readonly volumeMbd: number;
  readonly routedMbd: number;
  /** Volume with no sea route and no pipeline space left. It does not move. */
  readonly strandedMbd: number;
  readonly segments: readonly Segment[];
  readonly baselineDays: number;
  /** Volume-weighted transit days above baseline. Zero when nothing detoured. */
  readonly addedDays: number;
}

export interface Allocation {
  readonly closed: readonly ChokepointId[];
  readonly flows: readonly FlowAllocation[];
  readonly totalMbd: number;
  readonly routedMbd: number;
  readonly strandedMbd: number;
  /** Bypass leg id → million barrels per day drawn through it. */
  readonly bypassUsageMbd: Readonly<Record<string, number>>;
}
