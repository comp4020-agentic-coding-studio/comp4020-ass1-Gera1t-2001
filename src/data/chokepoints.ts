import type { Chokepoint } from "../model/types";

/**
 * The seven chokepoints the US Energy Information Administration tracks for
 * oil transit. Volumes are crude and petroleum products, first half of 2025
 * unless noted. Coordinates are from the IMF PortWatch chokepoints database
 * (28 chokepoints, satellite AIS, downloaded as a static snapshot).
 *
 * The `reroutability` classes come from Verschuur et al. (2025) and are the
 * point of the whole piece: a chokepoint with no alternative is a different
 * kind of object from one with a long detour, and a map cannot tell you which
 * is which.
 */
const EIA = "EIA, World Oil Transit Chokepoints, 1H2025";
const PORTWATCH = "IMF PortWatch chokepoints database (AIS), snapshot 2026-08-02";
const NATURE =
  "Verschuur et al., Systemic impacts of disruptions at maritime chokepoints, Nature Communications (2025)";

export const CHOKEPOINTS: readonly Chokepoint[] = [
  {
    id: "malacca",
    name: "Strait of Malacca",
    lat: 1.516954817,
    lon: 102.6651061,
    oilFlowMbd: 23.2,
    reroutability: "short",
    note:
      "The largest oil chokepoint on earth by volume — and the least consequential " +
      "to close. Ships take the Lombok or Sunda Straits instead and lose a few days.",
    source: `${EIA}; coordinates ${PORTWATCH}; class ${NATURE}`,
  },
  {
    id: "hormuz",
    name: "Strait of Hormuz",
    lat: 26.29685349,
    lon: 56.85984844,
    oilFlowMbd: 20.9,
    reroutability: "none",
    note:
      "About a fifth of world petroleum consumption. Roughly 80% of it is bound " +
      "for Asia. The only alternatives are pipelines, and they are far too small.",
    source: `${EIA}; coordinates ${PORTWATCH}; class ${NATURE}`,
  },
  {
    id: "danish",
    name: "Danish Straits",
    lat: 55.50784043,
    lon: 12.85079477,
    oilFlowMbd: 4.9,
    reroutability: "none",
    note:
      "Nearly 60% busier than 2021 as Russian crude re-routed. The Kiel Canal is " +
      "the only alternative and it moved 0.2 mb/d — a twenty-fifth of the need.",
    source: `${EIA}; coordinates ${PORTWATCH} (Oresund Strait); class ${NATURE}`,
  },
  {
    id: "suez",
    name: "Suez Canal",
    lat: 30.59334599,
    lon: 32.43688221,
    oilFlowMbd: 4.9,
    reroutability: "long",
    note:
      "Closing it sends Arabian Sea cargo around the Cape of Good Hope, about " +
      "fifteen days further. Includes the SUMED pipeline, which bypasses the " +
      "canal but not the Red Sea.",
    source: `${EIA}; coordinates ${PORTWATCH}; class ${NATURE}`,
  },
  {
    id: "bab-el-mandeb",
    name: "Bab el-Mandeb",
    lat: 12.78859715,
    lon: 43.34954476,
    oilFlowMbd: 4.2,
    reroutability: "long",
    note:
      "Halved from 9.3 mb/d in 2023 after Houthi attacks began — the largest " +
      "live demonstration of chokepoint rerouting in the dataset.",
    source: `${EIA}; coordinates ${PORTWATCH}; class ${NATURE}`,
  },
  {
    id: "turkish",
    name: "Turkish Straits",
    lat: 41.16928167,
    lon: 29.09150126,
    oilFlowMbd: 3.7,
    reroutability: "none",
    note:
      "Under half a nautical mile wide at the narrowest point, with more than " +
      "45,000 vessel transits in 2024. The Black Sea has one door.",
    source: `${EIA} (Dardanelles); coordinates ${PORTWATCH} (Bosporus); class ${NATURE}`,
  },
  {
    id: "panama",
    name: "Panama Canal",
    lat: 9.120512367,
    lon: -79.76723825,
    oilFlowMbd: 2.3,
    reroutability: "long",
    note:
      "Almost entirely refined products, on vessels small enough for the locks. " +
      "The detour is the Strait of Magellan — up to 8,000 miles.",
    source: `${EIA} (FY2025); coordinates ${PORTWATCH}; class ${NATURE}`,
  },
];

export const CHOKEPOINT_BY_ID = new Map(CHOKEPOINTS.map((c) => [c.id, c]));
