import { CHOKEPOINTS } from "../data/chokepoints";
import { FLOWS } from "../data/flows";
import { LEGS } from "../data/network";
import type {
  Allocation,
  ChokepointId,
  FlowAllocation,
  Leg,
  NodeId,
  Segment,
} from "./types";

/**
 * Close a set of chokepoints; find out how much oil stops moving.
 *
 * Each flow is filled greedily along the cheapest open route, then the next
 * cheapest, until either the flow is satisfied or nothing is left open. What
 * cannot be routed is stranded — it does not detour, and it does not arrive
 * late. It does not move.
 *
 * MODELLING CHOICES, stated because they change the numbers:
 *
 *  1. Bypasses cost extra. Sea transport is cheaper per barrel than a pipeline
 *     (which needs two ship-to-shore transfers), so a bypass is priced at
 *     BYPASS_PENALTY days above its actual transit time. Tuned so that no
 *     bypass carries anything at baseline, and each one is reached for when
 *     its chokepoint closes. Displayed transit days are the real ones — the
 *     penalty exists only to rank routes.
 *
 *  2. Scarce capacity is shared pro rata. When several flows want the same
 *     bypass, each gets a share of it proportional to the volume it is still
 *     trying to move, and the leftovers are re-offered in the next round.
 *
 *     The obvious alternative — first come, first served in declaration order
 *     — was tried first and rejected. With Hormuz shut it handed all 4.7 mb/d
 *     of bypass capacity to the single largest flow and left every other Gulf
 *     flow at exactly zero, which is not what a closure looks like and reads
 *     as an artefact of the list order. Pro rata is also the neutral rule:
 *     these pipelines belong to particular producers who would serve their own
 *     customers first, and this explainer does not make claims about who
 *     intends what. See CLAUDE.md → "Data honesty".
 */

const BYPASS_PENALTY = 10;
const EPSILON = 1e-9;
/**
 * Each round either satisfies a flow outright or saturates a bypass, and
 * there are only a handful of bypasses. This bounds the loop well above what
 * convergence needs.
 */
const MAX_ROUNDS = 32;

interface Edge {
  readonly leg: Leg;
  readonly to: NodeId;
}

/** Legs are undirected: a bypass's capacity is shared across both directions. */
const ADJACENCY: ReadonlyMap<NodeId, readonly Edge[]> = (() => {
  const map = new Map<NodeId, Edge[]>();
  const link = (from: NodeId, edge: Edge) => {
    const edges = map.get(from);
    if (edges) edges.push(edge);
    else map.set(from, [edge]);
  };
  for (const leg of LEGS) {
    link(leg.from, { leg, to: leg.to });
    link(leg.to, { leg, to: leg.from });
  }
  // Sort so the traversal order never depends on declaration order.
  for (const edges of map.values()) {
    edges.sort((a, b) => a.leg.id.localeCompare(b.leg.id));
  }
  return map;
})();

const cost = (leg: Leg) =>
  leg.days + (leg.capacityMbd === undefined ? 0 : BYPASS_PENALTY);

interface Route {
  readonly legIds: readonly string[];
  /** Real transit days, penalty excluded. */
  readonly days: number;
  /** The most this route can carry before a bypass on it fills up. */
  readonly capacityMbd: number;
}

/**
 * Cheapest open route, by Dijkstra over leg cost. The graph is a few dozen
 * legs, so a linear scan for the next node is faster than a heap and easier
 * to read.
 */
function cheapestRoute(
  from: NodeId,
  to: NodeId,
  closed: ReadonlySet<ChokepointId>,
  spare: ReadonlyMap<string, number>,
): Route | null {
  const best = new Map<NodeId, number>([[from, 0]]);
  const cameBy = new Map<NodeId, Edge>();
  const settled = new Set<NodeId>();

  for (;;) {
    let current: NodeId | null = null;
    let currentCost = Infinity;
    for (const [node, nodeCost] of best) {
      if (settled.has(node)) continue;
      // Tie-break on node id so the route is reproducible run to run.
      if (nodeCost < currentCost || (nodeCost === currentCost && current !== null && node < current)) {
        current = node;
        currentCost = nodeCost;
      }
    }
    if (current === null) return null;
    if (current === to) break;
    settled.add(current);

    for (const edge of ADJACENCY.get(current) ?? []) {
      const { leg } = edge;
      if (leg.via.some((chokepoint) => closed.has(chokepoint))) continue;
      if (leg.capacityMbd !== undefined && (spare.get(leg.id) ?? 0) <= EPSILON) continue;

      const candidate = currentCost + cost(leg);
      if (candidate < (best.get(edge.to) ?? Infinity)) {
        best.set(edge.to, candidate);
        cameBy.set(edge.to, edge);
      }
    }
  }

  const legIds: string[] = [];
  let days = 0;
  let capacityMbd = Infinity;
  for (let node = to; node !== from; ) {
    const edge = cameBy.get(node);
    if (!edge) return null;
    legIds.unshift(edge.leg.id);
    days += edge.leg.days;
    if (edge.leg.capacityMbd !== undefined) {
      capacityMbd = Math.min(capacityMbd, spare.get(edge.leg.id) ?? 0);
    }
    node = edge.leg.from === node ? edge.leg.to : edge.leg.from;
  }
  return { legIds, days, capacityMbd };
}

const round = (value: number) => Math.round(value * 1e9) / 1e9;

/**
 * Route every flow at once, sharing scarce bypass capacity pro rata.
 *
 * Each round: every flow still short of its volume finds its cheapest open
 * route; demand is totalled on each capacitated leg; each flow takes the
 * smallest of its proportional shares along its own route. A flow whose route
 * touches no bypass is satisfied immediately. Whatever slack that leaves is
 * re-offered next round.
 */
function routeAll(
  closed: ReadonlySet<ChokepointId>,
  spare: Map<string, number>,
): Map<string, Segment[]> {
  const segments = new Map<string, Segment[]>(FLOWS.map((flow) => [flow.id, []]));
  const shortfall = new Map<string, number>(FLOWS.map((flow) => [flow.id, flow.volumeMbd]));

  for (let round_ = 0; round_ < MAX_ROUNDS; round_++) {
    const routes = new Map<string, Route>();
    for (const flow of FLOWS) {
      if ((shortfall.get(flow.id) ?? 0) <= EPSILON) continue;
      const route = cheapestRoute(flow.from, flow.to, closed, spare);
      if (route) routes.set(flow.id, route);
    }
    if (routes.size === 0) break;

    // How much volume is chasing each capacitated leg this round.
    const contested = new Map<string, number>();
    for (const [flowId, route] of routes) {
      for (const legId of route.legIds) {
        if (!spare.has(legId)) continue;
        contested.set(legId, (contested.get(legId) ?? 0) + shortfall.get(flowId)!);
      }
    }

    // Shares sum to exactly the spare capacity on every contested leg, so
    // committing them all together can never oversubscribe one.
    const takes = new Map<string, number>();
    for (const [flowId, route] of routes) {
      const wanted = shortfall.get(flowId)!;
      let take = wanted;
      for (const legId of route.legIds) {
        if (!spare.has(legId)) continue;
        take = Math.min(take, spare.get(legId)! * (wanted / contested.get(legId)!));
      }
      if (take > EPSILON) takes.set(flowId, take);
    }
    if (takes.size === 0) break;

    for (const [flowId, take] of takes) {
      const route = routes.get(flowId)!;
      for (const legId of route.legIds) {
        if (spare.has(legId)) {
          spare.set(legId, Math.max(0, round(spare.get(legId)! - take)));
        }
      }
      segments.get(flowId)!.push({ mbd: round(take), legIds: route.legIds, days: route.days });
      shortfall.set(flowId, round(shortfall.get(flowId)! - take));
    }
  }

  // Rounds can hand the same route to a flow more than once; present one
  // segment per distinct route so the visitor sees paths, not iterations.
  for (const [flowId, list] of segments) {
    const merged = new Map<string, Segment>();
    for (const segment of list) {
      const key = segment.legIds.join(">");
      const seen = merged.get(key);
      merged.set(
        key,
        seen ? { ...seen, mbd: round(seen.mbd + segment.mbd) } : segment,
      );
    }
    segments.set(
      flowId,
      [...merged.values()].filter((segment) => segment.mbd > EPSILON),
    );
  }

  return segments;
}

/** Volume-weighted transit days across a flow's segments. */
function weightedDays(segments: readonly Segment[], routedMbd: number): number {
  if (routedMbd <= EPSILON) return 0;
  const total = segments.reduce((sum, segment) => sum + segment.mbd * segment.days, 0);
  return total / routedMbd;
}

function compute(
  closed: ReadonlySet<ChokepointId>,
  baseline: ReadonlyMap<string, number> | null,
): Allocation {
  const spare = new Map<string, number>();
  for (const leg of LEGS) {
    if (leg.capacityMbd !== undefined) spare.set(leg.id, leg.capacityMbd);
  }

  const routed = routeAll(closed, spare);

  const flows: FlowAllocation[] = [];
  for (const flow of FLOWS) {
    const segments = routed.get(flow.id) ?? [];
    const routedMbd = round(
      Math.min(
        flow.volumeMbd,
        segments.reduce((sum, segment) => sum + segment.mbd, 0),
      ),
    );
    const days = weightedDays(segments, routedMbd);
    const baselineDays = baseline?.get(flow.id) ?? days;
    const addedDays = routedMbd <= EPSILON ? 0 : Math.max(0, round(days - baselineDays));

    flows.push({
      flowId: flow.id,
      volumeMbd: flow.volumeMbd,
      routedMbd,
      strandedMbd: round(flow.volumeMbd - routedMbd),
      segments,
      baselineDays: round(baselineDays),
      addedDays,
    });
  }

  const bypassUsageMbd: Record<string, number> = {};
  for (const leg of LEGS) {
    if (leg.capacityMbd === undefined) continue;
    bypassUsageMbd[leg.id] = round(leg.capacityMbd - (spare.get(leg.id) ?? 0));
  }

  const routedMbd = round(flows.reduce((sum, flow) => sum + flow.routedMbd, 0));
  const strandedMbd = round(flows.reduce((sum, flow) => sum + flow.strandedMbd, 0));

  return {
    // Emit in a fixed order so two calls with the same closures compare equal.
    closed: CHOKEPOINTS.filter((c) => closed.has(c.id)).map((c) => c.id),
    flows,
    totalMbd: round(routedMbd + strandedMbd),
    routedMbd,
    strandedMbd,
    bypassUsageMbd,
  };
}

let baselineDaysByFlow: ReadonlyMap<string, number> | null = null;

/** Transit days with everything open — the reference `addedDays` measures against. */
function baseline(): ReadonlyMap<string, number> {
  if (!baselineDaysByFlow) {
    const open = compute(new Set(), null);
    baselineDaysByFlow = new Map(
      open.flows.map((flow) => [flow.flowId, weightedDays(flow.segments, flow.routedMbd)]),
    );
  }
  return baselineDaysByFlow;
}

/**
 * The core interaction, as a pure function.
 *
 * @param closed Chokepoints the visitor has shut.
 * @returns Where every flow went, how much later it got there, and how much
 *          of it never left.
 */
export function allocate(closed: ReadonlySet<ChokepointId>): Allocation {
  return compute(closed, baseline());
}
