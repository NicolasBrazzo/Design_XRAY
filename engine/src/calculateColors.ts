import { rgbToHex } from "./color.ts";

export type ColorCount = { color: string; hex: string; count: number };

// Shared by backgrounds, text colors and border colors.
//
// Input: one list of colors per element, already filtered by the rules of each
// property (visible, has text, side drawn...). Pure function: no browser.
//
// - Colors are normalized to hex, so "rgb(...)" and "rgba(..., 1)" share a key.
// - Colors that can't be converted (alpha != 1, lab(...)) are skipped.
// - An element counts once per distinct color (a uniform border is not 4 colors).
export function countColors(colorsPerElement: string[][]): ColorCount[] {
  const counts = new Map<string, ColorCount>();

  for (const colors of colorsPerElement) {
    const distinct = new Map<string, string>(); // hex -> original color

    for (const color of colors) {
      const hex = rgbToHex(color);
      if (hex === null) continue;
      if (!distinct.has(hex)) distinct.set(hex, color);
    }

    for (const [hex, color] of distinct) {
      const entry = counts.get(hex);
      if (entry) {
        entry.count++;
      } else {
        counts.set(hex, { color, hex, count: 1 });
      }
    }
  }

  // Most used first; on equal counts, by hex, so the order is always the same.
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.hex.localeCompare(b.hex),
  );
}
