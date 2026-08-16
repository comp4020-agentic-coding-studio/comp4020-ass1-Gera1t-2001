import { allocate } from "../model/allocate";
import type { ChokepointId } from "../model/types";
import { CHOKEPOINT_BY_ID } from "./chokepoints";

/**
 * Three states worth arriving at directly.
 *
 * The switch list is sorted by volume and says so, which sets up the question;
 * these answer it in one click each — the largest chokepoint on earth stopping
 * nothing, a sixth its size stopping everything that uses it, and a detour with
 * a published length.
 *
 * Every figure in the copy is read from `src/data/` or computed by `allocate()`
 * at module load. Nothing here is typed in by hand, so a change to a volume or
 * a transit day moves the prose with it — the same rule the rest of the page
 * follows, applied to the writing.
 *
 * Scope: geography and published figures only. What a closure would do to
 * shipping is in scope; who might close one, or why, is not. Every note traces
 * to a citation that already existed in this repo before the note did.
 */

const EIA = "EIA, World Oil Transit Chokepoints, 1H2025";

/** A chokepoint's transiting volume, straight from the data. */
const mbd = (id: ChokepointId) => CHOKEPOINT_BY_ID.get(id)!.oilFlowMbd.toFixed(1);

/** The worst detour this closure causes, in whole days, from the model. */
const detourDays = (closed: readonly ChokepointId[]) =>
  Math.max(0, ...allocate(new Set(closed)).flows.map((flow) => flow.addedDays)).toFixed(0);

export interface Preset {
  readonly label: string;
  readonly closed: readonly ChokepointId[];
  readonly note: string;
  readonly source: string;
}

const RED_SEA: readonly ChokepointId[] = ["bab-el-mandeb", "suez"];

export const PRESETS: readonly Preset[] = [
  {
    label: "The biggest one",
    closed: ["malacca"],
    note:
      `${mbd("malacca")} mb/d, more than any other strait. ` +
      "Ships take the Lombok or Sunda Straits instead and lose a few days.",
    source:
      `${EIA} for the volume; Sunda and Lombok are named as the alternatives ` +
      "in the sea-lombok leg source in src/data/network.ts.",
  },
  {
    label: "The Black Sea's one door",
    closed: ["turkish"],
    note:
      `${mbd("turkish")} mb/d, under half a nautical mile wide at the narrowest ` +
      "point, and nothing else leads out.",
    source:
      `${EIA} (Dardanelles) for the volume; the width is from the Turkish ` +
      "Straits note in src/data/chokepoints.ts. Class from Verschuur et al. (2025).",
  },
  {
    label: "Both ends of the Red Sea",
    closed: RED_SEA,
    note:
      "Shut both and Gulf-to-Europe cargo goes round the Cape of Good Hope, " +
      `about ${detourDays(RED_SEA)} days further.`,
    source:
      `${EIA}: the Cape-versus-Suez delta is the calibration anchor named in ` +
      "src/data/network.ts. The figure shown is computed by allocate(), not asserted.",
  },
];
