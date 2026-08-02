import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import land110m from "world-atlas/land-110m.json";
import { CHOKEPOINT_BY_ID } from "../data/chokepoints";
import { LEG_SHAPES, LEGS, NODES } from "../data/network";
import type { NodeId } from "../model/types";

/**
 * Projection and path generation.
 *
 * The map is drawn once into a fixed 1000×500 viewBox and scaled by CSS, so a
 * resize mid-interaction costs nothing and cannot desynchronise the geometry
 * from the state — there is no resize handler to get wrong.
 */
export const VIEW_WIDTH = 1000;
export const VIEW_HEIGHT = 500;

// Rotated 10° so the Atlantic sits left and the Gulf-to-Asia flows — the bulk
// of the argument — run left to right across the middle of the frame.
const projection = geoNaturalEarth1()
  .rotate([-10, 0])
  .fitExtent(
    [
      [8, 8],
      [VIEW_WIDTH - 8, VIEW_HEIGHT - 8],
    ],
    { type: "Sphere" },
  );

const path = geoPath(projection);

const topology = land110m as unknown as Topology<{ land: GeometryCollection }>;

/** One path for every landmass, drawn once and never updated. */
export const LAND_PATH = path(feature(topology, topology.objects.land) as GeoPermissibleObjects) ?? "";

/** Outline of the globe, so the ocean is a shape rather than the page background. */
export const SPHERE_PATH = path({ type: "Sphere" }) ?? "";

const NODE_BY_ID = new Map(NODES.map((node) => [node.id, node]));
const LEG_BY_ID = new Map(LEGS.map((leg) => [leg.id, leg]));

export function project(lon: number, lat: number): [number, number] {
  return projection([lon, lat]) ?? [0, 0];
}

export function projectNode(id: NodeId): [number, number] {
  const node = NODE_BY_ID.get(id);
  if (!node) throw new Error(`unknown node: ${id}`);
  return project(node.lon, node.lat);
}

/**
 * Draw one leg as a chain of great circles.
 *
 * A straight geodesic between two waypoints happily crosses continents, so
 * each leg is bent through its chokepoints — and, where that is not enough,
 * through the hand-placed points in `LEG_SHAPES`. d3-geo resamples each
 * geodesic and clips at the antimeridian, so a Pacific crossing arrives as two
 * pieces rather than one line dragged backwards across the whole map.
 */
export function legPath(legId: string): string {
  const leg = LEG_BY_ID.get(legId);
  if (!leg) return "";
  const from = NODE_BY_ID.get(leg.from);
  const to = NODE_BY_ID.get(leg.to);
  if (!from || !to) return "";

  const bends: [number, number][] =
    LEG_SHAPES[legId]?.map(([lon, lat]) => [lon, lat] as [number, number]) ??
    leg.via.flatMap((id) => {
      const chokepoint = CHOKEPOINT_BY_ID.get(id);
      return chokepoint ? [[chokepoint.lon, chokepoint.lat] as [number, number]] : [];
    });

  return (
    path({
      type: "LineString",
      coordinates: [[from.lon, from.lat], ...bends, [to.lon, to.lat]],
    } as GeoPermissibleObjects) ?? ""
  );
}

/** The nodes a route passes through, in order, starting from `origin`. */
export function routeNodes(origin: NodeId, legIds: readonly string[]): NodeId[] {
  const nodes: NodeId[] = [origin];
  let current = origin;
  for (const legId of legIds) {
    const leg = LEG_BY_ID.get(legId);
    if (!leg) break;
    current = leg.from === current ? leg.to : leg.from;
    nodes.push(current);
  }
  return nodes;
}
