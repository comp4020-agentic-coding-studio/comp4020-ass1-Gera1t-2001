import { CHOKEPOINTS } from "../data/chokepoints";
import type { ChokepointId } from "../model/types";

/**
 * The set of closed chokepoints, in the URL.
 *
 * A visitor who shuts Hormuz and Bab el-Mandeb has found something worth
 * showing someone, so the address bar should carry it: `#closed=hormuz,bab-el-mandeb`.
 * It also means any state of the model can be opened directly, which is how
 * the render check screenshots a closure without driving the browser.
 */
const KEY = "closed";
const VALID = new Set<string>(CHOKEPOINTS.map((chokepoint) => chokepoint.id));

export function readHash(hash: string): Set<ChokepointId> {
  const closed = new Set<ChokepointId>();
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  for (const id of (params.get(KEY) ?? "").split(",")) {
    const trimmed = id.trim();
    if (VALID.has(trimmed)) closed.add(trimmed as ChokepointId);
  }
  return closed;
}

/** Emitted in the chokepoints' declared order, so the same state is one URL. */
export function writeHash(closed: ReadonlySet<ChokepointId>): string {
  const ids = CHOKEPOINTS.filter((chokepoint) => closed.has(chokepoint.id)).map(
    (chokepoint) => chokepoint.id,
  );
  return ids.length === 0 ? "" : `#${KEY}=${ids.join(",")}`;
}
