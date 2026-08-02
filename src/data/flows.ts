import type { Flow } from "../model/types";

/**
 * The oil flows this explainer moves. All volumes are million barrels per day
 * of crude, condensate and petroleum products — one unit, one dataset.
 *
 * LNG is deliberately absent. It is measured in billion cubic feet per day,
 * and mixing the two would mean two units on one screen and a stranded total
 * that cannot be added up.
 *
 * The six Persian Gulf flows sum to 20.8 mb/d, which reconciles to EIA's
 * 20.9 mb/d for the Strait of Hormuz. Two flows are marked DERIVED: one is a
 * residual computed so the named flows reconcile to the published total, the
 * other is apportioned from an IEA share. Two more are marked ILLUSTRATIVE:
 * the control routes, which exist so the visitor has something that does not
 * move, and whose volumes are order-of-magnitude only.
 *
 * COVERAGE LIMIT: modelled Malacca traffic is lower than EIA's 23.2 mb/d
 * because only Persian Gulf origins are modelled — Malacca also carries West
 * African and Atlantic-basin crude this model does not include.
 */

const EIA_Q1 = "EIA, Q1 2025 country-level flows through the Strait of Hormuz";
const EIA = "EIA, World Oil Transit Chokepoints, 1H2025";

export const FLOWS: readonly Flow[] = [
  // ── Persian Gulf, behind Hormuz ─────────────────────────────────────────
  {
    id: "gulf-china",
    label: "Ras Tanura → Ningbo",
    from: "ras-tanura",
    to: "ningbo",
    cargo: "crude",
    volumeMbd: 5.4,
    note: "The largest single oil flow on earth. Two chokepoints in series: Hormuz, then Malacca.",
    source: `${EIA_Q1}: China imported 5.4 mb/d of crude through Hormuz.`,
  },
  {
    id: "gulf-india",
    label: "Al Basrah → Jamnagar",
    from: "basra",
    to: "jamnagar",
    cargo: "crude",
    volumeMbd: 2.1,
    note:
      "Hormuz without Malacca — the one flow that separates the two. Iraqi crude " +
      "also has no bypass pipeline: the Saudi and UAE lines do not serve Basra.",
    source: `${EIA_Q1}: India imported 2.1 mb/d through Hormuz.`,
  },
  {
    id: "gulf-japan-korea",
    label: "Ras Tanura → Yokohama",
    from: "ras-tanura",
    to: "yokohama",
    cargo: "crude",
    volumeMbd: 3.6,
    note: "Japan and South Korea are among the most Hormuz-dependent economies in the world.",
    source:
      "DERIVED. IEA: member countries take about 29% of the crude transiting Hormuz, " +
      "with Japan and Korea particularly reliant. Apportioned from EIA's 14.7 mb/d " +
      "Hormuz crude figure.",
  },
  {
    id: "gulf-europe",
    label: "Ras Tanura → Rotterdam",
    from: "ras-tanura",
    to: "rotterdam",
    cargo: "crude",
    volumeMbd: 0.6,
    note:
      "Small, but it threads three chokepoints in a row — Hormuz, Bab el-Mandeb, " +
      "Suez. Close any one and it detours; close all three and it has nowhere to go.",
    source: `${EIA}: around 600 kb/d, about 4% of Persian Gulf crude, is routed into Europe.`,
  },
  {
    id: "gulf-other-asia",
    label: "Ras Tanura → Singapore (crude)",
    from: "ras-tanura",
    to: "singapore",
    cargo: "crude",
    volumeMbd: 3.0,
    note: "The rest of Asia's Gulf crude, aggregated to the region's refining hub.",
    source:
      "DERIVED (residual). EIA puts Hormuz crude and condensate at 14.7 mb/d; this is " +
      "the balance after the four named crude flows above.",
  },
  {
    id: "gulf-products-asia",
    label: "Ras Tanura → Singapore (products)",
    from: "ras-tanura",
    to: "singapore",
    cargo: "products",
    volumeMbd: 6.1,
    note: "Refined products, not crude — a third of everything moving through Hormuz.",
    source: `${EIA}: petroleum products through the Strait of Hormuz, 6.1 mb/d.`,
  },

  // ── Behind the two chokepoints with no way around ───────────────────────
  {
    id: "russia-baltic-europe",
    label: "Primorsk → Rotterdam",
    from: "primorsk",
    to: "rotterdam",
    cargo: "mixed",
    volumeMbd: 4.9,
    note:
      "The Danish Straits are nearly 60% busier than in 2021. The only alternative " +
      "is the Kiel Canal, which takes a twenty-fifth of the volume.",
    source: `${EIA}: Danish Straits, 4.9 mb/d (crude 2.7, products 2.2).`,
  },
  {
    id: "russia-blacksea-med",
    label: "Novorossiysk → Augusta",
    from: "novorossiysk",
    to: "augusta",
    cargo: "mixed",
    volumeMbd: 3.7,
    note: "The Black Sea has exactly one exit, and at its narrowest it is half a nautical mile wide.",
    source: `${EIA}: Dardanelles, 3.7 mb/d (crude 2.2, products 1.5).`,
  },

  // ── Behind a chokepoint with a long way around ──────────────────────────
  {
    id: "usgulf-asia-products",
    label: "Houston → Yokohama",
    from: "houston",
    to: "yokohama",
    cargo: "products",
    volumeMbd: 2.2,
    note:
      "Products move through Panama because they travel on vessels small enough for " +
      "the locks. Close it and the detour is the Strait of Magellan.",
    source: `${EIA}: Panama Canal refined products, 2.2 mb/d, FY2025.`,
  },

  // ── The controls: nothing the visitor closes touches these ──────────────
  {
    id: "usgulf-europe",
    label: "Houston → Rotterdam",
    from: "houston",
    to: "rotterdam",
    cargo: "crude",
    volumeMbd: 2.0,
    note: "A control. Open water the whole way — close every chokepoint on the map and this does not move.",
    source:
      "ILLUSTRATIVE. Order-of-magnitude only: EIA reports US crude exports averaging " +
      "roughly 4 mb/d, with Europe the largest destination. This flow exists to give " +
      "the visitor an unaffected baseline, and its exact volume is not load-bearing.",
  },
  {
    id: "russia-pacific-china",
    label: "Kozmino → Qingdao",
    from: "kozmino",
    to: "qingdao",
    cargo: "crude",
    volumeMbd: 0.9,
    note:
      "The second control — and an answer to why Russia built a Pacific outlet at all. " +
      "No chokepoint stands between Kozmino and its customers.",
    source:
      "ILLUSTRATIVE. Order-of-magnitude only, reflecting reported ESPO throughput at " +
      "Kozmino. Serves as an unaffected baseline; the exact volume is not load-bearing.",
  },
];

export const TOTAL_MBD = FLOWS.reduce((sum, flow) => sum + flow.volumeMbd, 0);
