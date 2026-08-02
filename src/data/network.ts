import type { Leg, Node } from "../model/types";

/**
 * The sea graph, plus the bypasses.
 *
 * This is a hand-built, calibrated snapshot — not a live routing engine, and
 * not a claim about any individual voyage. Nodes are real ports and the
 * waypoints needed to make the chokepoints bite. Transit days are estimates
 * calibrated against published figures (see CALIBRATION below); they are
 * accurate to about a day, which is the resolution the argument needs.
 *
 * Legs are undirected — the router traverses them either way, and a bypass's
 * capacity is shared across both directions.
 *
 * CALIBRATION ANCHORS
 *   - Persian Gulf → Europe around the Cape of Good Hope runs about 15 days
 *     longer than through Suez (EIA, World Oil Transit Chokepoints).
 *   - Shanghai → Rotterdam via Suez is roughly 11,000 nm / 28 days, and the
 *     Cape detour adds 10–14 days (industry consensus, 2024 Red Sea rerouting).
 *   - Rerouting is computed at 16 knots (Verschuur et al., 2025), which puts
 *     the Panama Canal's ~8,000-mile Magellan detour at about three weeks.
 */

const EIA = "EIA, World Oil Transit Chokepoints, 1H2025";
const CALIBRATED =
  "Transit days: calibrated estimate — see CALIBRATION in src/data/network.ts";

export const NODES: readonly Node[] = [
  // Loading regions
  { id: "ras-tanura", name: "Ras Tanura", lat: 26.64, lon: 50.16, kind: "port" },
  { id: "basra", name: "Al Basrah", lat: 29.68, lon: 48.81, kind: "port" },
  { id: "primorsk", name: "Primorsk", lat: 60.34, lon: 28.68, kind: "port" },
  { id: "novorossiysk", name: "Novorossiysk", lat: 44.72, lon: 37.78, kind: "port" },
  { id: "houston", name: "Houston", lat: 29.32, lon: -94.75, kind: "port" },
  { id: "kozmino", name: "Kozmino", lat: 42.83, lon: 133.09, kind: "port" },

  // Bypass terminals
  { id: "yanbu", name: "Yanbu", lat: 24.09, lon: 38.06, kind: "port" },
  { id: "fujairah", name: "Fujairah", lat: 25.12, lon: 56.35, kind: "port" },
  { id: "ain-sukhna", name: "Ain Sukhna", lat: 29.6, lon: 32.35, kind: "port" },
  { id: "sidi-kerir", name: "Sidi Kerir", lat: 31.09, lon: 29.66, kind: "port" },

  // Discharge
  { id: "ningbo", name: "Ningbo", lat: 29.87, lon: 121.55, kind: "port" },
  { id: "qingdao", name: "Qingdao", lat: 36.07, lon: 120.38, kind: "port" },
  { id: "jamnagar", name: "Jamnagar", lat: 22.47, lon: 69.08, kind: "port" },
  { id: "yokohama", name: "Yokohama", lat: 35.45, lon: 139.65, kind: "port" },
  { id: "singapore", name: "Singapore", lat: 1.26, lon: 103.83, kind: "port" },
  { id: "rotterdam", name: "Rotterdam", lat: 51.95, lon: 4.14, kind: "port" },
  { id: "augusta", name: "Augusta", lat: 37.2, lon: 15.22, kind: "port" },

  // Waypoints
  { id: "gulf-of-oman", name: "Gulf of Oman", lat: 24.5, lon: 58.5, kind: "waypoint" },
  { id: "arabian-sea", name: "Arabian Sea", lat: 15.0, lon: 65.0, kind: "waypoint" },
  { id: "red-sea", name: "Red Sea", lat: 20.0, lon: 38.5, kind: "waypoint" },
  { id: "east-med", name: "Eastern Mediterranean", lat: 34.0, lon: 30.0, kind: "waypoint" },
  { id: "west-med", name: "Western Mediterranean", lat: 37.0, lon: 5.0, kind: "waypoint" },
  { id: "atlantic", name: "North Atlantic", lat: 35.0, lon: -20.0, kind: "waypoint" },
  { id: "cape", name: "Cape of Good Hope", lat: -34.93, lon: 20.88, kind: "waypoint" },
  { id: "south-china-sea", name: "South China Sea", lat: 10.0, lon: 112.0, kind: "waypoint" },
  { id: "black-sea", name: "Black Sea", lat: 43.0, lon: 34.0, kind: "waypoint" },
  { id: "baltic", name: "Baltic Sea", lat: 55.5, lon: 17.0, kind: "waypoint" },
  { id: "north-sea", name: "North Sea", lat: 56.0, lon: 3.0, kind: "waypoint" },
  { id: "caribbean", name: "Caribbean", lat: 15.0, lon: -75.0, kind: "waypoint" },
  { id: "panama-pacific", name: "Panama, Pacific side", lat: 7.0, lon: -80.0, kind: "waypoint" },
  { id: "magellan", name: "Strait of Magellan", lat: -54.0, lon: -70.0, kind: "waypoint" },
  { id: "pacific-west", name: "Western Pacific", lat: 25.0, lon: 140.0, kind: "waypoint" },
];

export const LEGS: readonly Leg[] = [
  // ── Persian Gulf ────────────────────────────────────────────────────────
  // The only sea exit is Hormuz. That is the whole point of Hormuz.
  { id: "sea-rastanura-hormuz", from: "ras-tanura", to: "gulf-of-oman", via: ["hormuz"], days: 2, kind: "sea", source: CALIBRATED },
  { id: "sea-basra-hormuz", from: "basra", to: "gulf-of-oman", via: ["hormuz"], days: 2.5, kind: "sea", source: CALIBRATED },
  { id: "sea-fujairah-oman", from: "fujairah", to: "gulf-of-oman", via: [], days: 0.5, kind: "sea", source: CALIBRATED },
  { id: "sea-oman-arabian", from: "gulf-of-oman", to: "arabian-sea", via: [], days: 2, kind: "sea", source: CALIBRATED },

  // ── Arabian Sea eastward ────────────────────────────────────────────────
  // Malacca has a real alternative, and it is only three days longer. This
  // pair of legs is why the busiest chokepoint on earth is also the least
  // consequential one to close.
  { id: "sea-malacca", from: "arabian-sea", to: "south-china-sea", via: ["malacca"], days: 8, kind: "sea", name: "Strait of Malacca", source: CALIBRATED },
  { id: "sea-lombok", from: "arabian-sea", to: "south-china-sea", via: [], days: 11, kind: "sea", name: "Lombok and Sunda Straits", source: `${EIA} names Sunda and Lombok as the Malacca alternatives; ${CALIBRATED}` },
  { id: "sea-arabian-jamnagar", from: "arabian-sea", to: "jamnagar", via: [], days: 1.5, kind: "sea", source: CALIBRATED },
  { id: "sea-scs-ningbo", from: "south-china-sea", to: "ningbo", via: [], days: 3, kind: "sea", source: CALIBRATED },
  { id: "sea-scs-qingdao", from: "south-china-sea", to: "qingdao", via: [], days: 4, kind: "sea", source: CALIBRATED },
  { id: "sea-scs-yokohama", from: "south-china-sea", to: "yokohama", via: [], days: 5, kind: "sea", source: CALIBRATED },
  { id: "sea-scs-singapore", from: "south-china-sea", to: "singapore", via: [], days: 1, kind: "sea", source: CALIBRATED },

  // ── Arabian Sea westward: the Red Sea corridor ──────────────────────────
  { id: "sea-bab-el-mandeb", from: "arabian-sea", to: "red-sea", via: ["bab-el-mandeb"], days: 3, kind: "sea", source: CALIBRATED },
  { id: "sea-redsea-yanbu", from: "red-sea", to: "yanbu", via: [], days: 1.5, kind: "sea", source: CALIBRATED },
  { id: "sea-redsea-sukhna", from: "red-sea", to: "ain-sukhna", via: [], days: 2, kind: "sea", source: CALIBRATED },
  { id: "sea-suez-canal", from: "ain-sukhna", to: "east-med", via: ["suez"], days: 1, kind: "sea", name: "Suez Canal", source: CALIBRATED },
  { id: "sea-sidikerir-med", from: "sidi-kerir", to: "east-med", via: [], days: 0.5, kind: "sea", source: CALIBRATED },

  // ── Mediterranean and Atlantic ──────────────────────────────────────────
  { id: "sea-eastmed-westmed", from: "east-med", to: "west-med", via: [], days: 3, kind: "sea", source: CALIBRATED },
  { id: "sea-eastmed-augusta", from: "east-med", to: "augusta", via: [], days: 1.5, kind: "sea", source: CALIBRATED },
  { id: "sea-westmed-atlantic", from: "west-med", to: "atlantic", via: [], days: 1.5, kind: "sea", name: "Strait of Gibraltar", source: CALIBRATED },
  { id: "sea-atlantic-rotterdam", from: "atlantic", to: "rotterdam", via: [], days: 4, kind: "sea", source: CALIBRATED },

  // ── The Cape of Good Hope ───────────────────────────────────────────────
  // Not a chokepoint. It is everyone else's escape route, and it is long:
  // these two legs are tuned so that Gulf → Europe around the Cape is 15 days
  // longer than through Suez, matching EIA.
  { id: "sea-arabian-cape", from: "arabian-sea", to: "cape", via: [], days: 16, kind: "sea", source: `Tuned to EIA's "about 15 days" Suez-vs-Cape delta; ${CALIBRATED}` },
  { id: "sea-cape-atlantic", from: "cape", to: "atlantic", via: [], days: 9.5, kind: "sea", source: `Tuned to EIA's "about 15 days" Suez-vs-Cape delta; ${CALIBRATED}` },

  // ── Black Sea: one door, no alternative ─────────────────────────────────
  { id: "sea-novorossiysk-blacksea", from: "novorossiysk", to: "black-sea", via: [], days: 1, kind: "sea", source: CALIBRATED },
  { id: "sea-turkish-straits", from: "black-sea", to: "east-med", via: ["turkish"], days: 2, kind: "sea", name: "Bosporus and Dardanelles", source: CALIBRATED },

  // ── Baltic ──────────────────────────────────────────────────────────────
  { id: "sea-primorsk-baltic", from: "primorsk", to: "baltic", via: [], days: 1.5, kind: "sea", source: CALIBRATED },
  { id: "sea-danish-straits", from: "baltic", to: "north-sea", via: ["danish"], days: 2, kind: "sea", name: "Danish Straits", source: CALIBRATED },
  { id: "sea-northsea-rotterdam", from: "north-sea", to: "rotterdam", via: [], days: 1, kind: "sea", source: CALIBRATED },

  // ── US Gulf ─────────────────────────────────────────────────────────────
  { id: "sea-houston-caribbean", from: "houston", to: "caribbean", via: [], days: 3, kind: "sea", source: CALIBRATED },
  { id: "sea-panama-canal", from: "caribbean", to: "panama-pacific", via: ["panama"], days: 1, kind: "sea", name: "Panama Canal", source: CALIBRATED },
  { id: "sea-caribbean-magellan", from: "caribbean", to: "magellan", via: [], days: 18, kind: "sea", source: `${EIA} puts the Magellan detour at up to 8,000 miles; ${CALIBRATED}` },
  { id: "sea-magellan-pacific", from: "magellan", to: "pacific-west", via: [], days: 25, kind: "sea", source: CALIBRATED },
  { id: "sea-panamapacific-pacific", from: "panama-pacific", to: "pacific-west", via: [], days: 20, kind: "sea", source: CALIBRATED },
  { id: "sea-pacific-yokohama", from: "pacific-west", to: "yokohama", via: [], days: 2, kind: "sea", source: CALIBRATED },
  { id: "sea-houston-atlantic", from: "houston", to: "atlantic", via: [], days: 8, kind: "sea", source: CALIBRATED },

  // ── Russian Pacific ─────────────────────────────────────────────────────
  { id: "sea-kozmino-qingdao", from: "kozmino", to: "qingdao", via: [], days: 4, kind: "sea", source: CALIBRATED },

  // ── The bypasses ────────────────────────────────────────────────────────
  // Every one of these has a hard ceiling, and that ceiling is the argument.
  //
  // Petroline is the trap. It is the largest official way around Hormuz, and
  // it discharges at Yanbu — inside the Red Sea. Oil that escapes Hormuz
  // overland still has to get out past Bab el-Mandeb or through Suez. The
  // escape hatch opens into another chokepoint.
  {
    id: "petroline",
    from: "ras-tanura",
    to: "yanbu",
    via: [],
    days: 6,
    kind: "pipeline",
    capacityMbd: 3.2,
    name: "East-West Pipeline (Petroline)",
    // ~1,200 km of pipe plus terminal handling at both ends. Set above the
    // 2-day Hormuz sail so that reaching for the bypass is never a speed-up.
    source:
      `${EIA}: Saudi Arabia's East-West line and the UAE's Abu Dhabi pipeline together ` +
      "provide roughly 4.7 mb/d of Hormuz bypass capacity. Derived: split 3.2 / 1.5 " +
      "between the two lines.",
  },
  {
    id: "adcop",
    from: "ras-tanura",
    to: "fujairah",
    via: [],
    days: 3,
    kind: "pipeline",
    capacityMbd: 1.5,
    name: "Abu Dhabi Crude Oil Pipeline",
    source:
      `${EIA}: combined Saudi + UAE Hormuz bypass capacity of roughly 4.7 mb/d. ` +
      "Derived: split 3.2 / 1.5 between the two lines. Modelled as available to " +
      "Saudi and UAE loadings only — Iraqi crude out of Basra has no Hormuz bypass.",
  },
  {
    id: "sumed",
    from: "ain-sukhna",
    to: "sidi-kerir",
    via: [],
    days: 1.5,
    kind: "pipeline",
    capacityMbd: 2.5,
    name: "SUMED Pipeline",
    source: `${EIA}: SUMED capacity 2.5 mb/d, Ain Sukhna to Sidi Kerir. Bypasses the canal, not the Red Sea.`,
  },
  {
    id: "trans-panama",
    from: "caribbean",
    to: "panama-pacific",
    via: [],
    days: 2,
    kind: "pipeline",
    capacityMbd: 0.864,
    name: "Trans-Panama Pipeline",
    source: `${EIA}: Trans-Panama Pipeline capacity 864,000 b/d; moved nearly 400,000 b/d in 2024–2025.`,
  },
  {
    id: "kiel",
    from: "baltic",
    to: "north-sea",
    via: [],
    days: 2.5,
    kind: "sea",
    capacityMbd: 0.2,
    name: "Kiel Canal",
    source:
      `${EIA}: the Kiel Canal handles only small tankers and virtually only oil ` +
      "products — about 200,000 b/d in 1H2025, against 4.9 mb/d through the Danish Straits.",
  },
];

/** Bypasses: any leg with a hard throughput ceiling. */
export const BYPASSES = LEGS.filter((leg) => leg.capacityMbd !== undefined);
