import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * An accessibility sensor the starter does not ship.
 *
 * Nothing in `pnpm check` measures contrast, and a dark palette is exactly
 * where it goes wrong — a grey that reads as "quiet" on a designer's monitor
 * can be unreadable on a phone in daylight. This is pure arithmetic on the
 * palette, so it needs no browser and runs in a millisecond.
 *
 * The pairings below are the intent: which custom property is set on which
 * background, and how small the text is. The CSS cannot state that on its own,
 * so this file is where that contract lives. If a colour moves in styles.css
 * without this file being updated, one of the two is wrong.
 *
 * Thresholds are WCAG 2.1 AA: 4.5:1 for body text, 3:1 for large text and for
 * non-text graphics that carry meaning.
 */

const CSS = readFileSync(resolve("styles.css"), "utf8");

function customProperty(name: string): string {
  const match = CSS.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})`));
  expect(match, `--${name} is not defined in styles.css`).toBeTruthy();
  return match![1];
}

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const raw = hex.replace("#", "");
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
}

const AA_TEXT = 4.5;
const AA_LARGE = 3;

interface Pairing {
  readonly what: string;
  readonly fg: string;
  readonly bg: string;
  readonly min: number;
}

const PAIRINGS: readonly Pairing[] = [
  { what: "body prose", fg: "ink", bg: "deep", min: AA_TEXT },
  // Also covers the reopen-all button, which is ink-dim on the page ground.
  // Its --edge border carries no meaning the label does not already carry, so
  // 1.4.11 does not bite on it — the control is identified by its text.
  { what: "standfirst and hints", fg: "ink-dim", bg: "deep", min: AA_TEXT },
  { what: "switch notes on a panel", fg: "ink-dim", bg: "panel", min: AA_TEXT },
  // Used for flow notes, the readout subtitle and the reroutability label —
  // all small text, so it gets the full text threshold, not the large one.
  { what: "small labels and notes", fg: "ink-faint", bg: "deep", min: AA_TEXT },
  { what: "small labels on a panel", fg: "ink-faint", bg: "panel", min: AA_TEXT },
  { what: "the kicker", fg: "detour", bg: "deep", min: AA_TEXT },
  { what: "links", fg: "moving", bg: "deep", min: AA_TEXT },
  { what: "the stranded readout", fg: "stopped", bg: "panel", min: AA_TEXT },
  // Flow lines are non-text graphics that carry meaning, so 3:1 applies.
  { what: "a moving flow on water", fg: "moving", bg: "water", min: AA_LARGE },
  { what: "a detoured flow on water", fg: "detour", bg: "water", min: AA_LARGE },
  { what: "stranded volume on water", fg: "stopped", bg: "water", min: AA_LARGE },
  { what: "a chokepoint ring on water", fg: "moving", bg: "water", min: AA_LARGE },
  // The dormant ways around. Drawn at full opacity precisely so this pairing
  // describes what is on screen — a translucent line would contrast against a
  // colour that appears nowhere in the palette, and this check would be a
  // fiction.
  { what: "a dormant way around on water", fg: "ink-faint", bg: "water", min: AA_LARGE },
];

describe("colour contrast", () => {
  it.each(PAIRINGS.map((p) => [p.what, p] as const))("%s", (_label, pairing) => {
    const fg = customProperty(pairing.fg);
    const bg = customProperty(pairing.bg);
    const ratio = contrast(fg, bg);
    expect(
      ratio,
      `--${pairing.fg} (${fg}) on --${pairing.bg} (${bg}) is ${ratio.toFixed(2)}:1, needs ${pairing.min}:1`,
    ).toBeGreaterThanOrEqual(pairing.min);
  });

  it("keeps the three flow states apart from each other, not just the water", () => {
    // A visitor who cannot separate amber from red by hue still has to be able
    // to tell a detour from a stoppage. Contrast between the two is the
    // fallback; the dash patterns in styles.css are the real answer.
    const detour = customProperty("detour");
    const stopped = customProperty("stopped");
    expect(contrast(detour, stopped)).toBeGreaterThan(1.4);
  });
});
