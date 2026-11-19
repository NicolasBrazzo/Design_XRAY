// return
// { color: getComputedStyle(el).backgroundColor,
//   width: rect.width,
//   height: rect.height
// }

import type { Page } from "playwright";
import { rgbToHex } from "./color.ts";

export async function readBackgrounds(page: Page) {
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll("*")].map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        color: getComputedStyle(el).backgroundColor,
        width: rect.width,
        height: rect.height,
      };
    });
  });

  const visible = elements.filter((el) => el.width > 0 && el.height > 0);

  const withHex = visible.map((el) => ({
    color: el.color,
    hex: rgbToHex(el.color),
  }));

  // Count by hex: "rgb(...)" and "rgba(..., 1)" end up under the same key.
  const counts = new Map<string, { color: string; hex: string; count: number }>();

  for (const el of withHex) {
    if (el.hex === null) continue;

    const entry = counts.get(el.hex);
    if (entry) {
      entry.count++;
    } else {
      counts.set(el.hex, { color: el.color, hex: el.hex, count: 1 });
    }
  }

  // Most used first; on equal counts, by hex, so the order is always the same.
  return [...counts.values()].sort(
    (a, b) => b.count - a.count || a.hex.localeCompare(b.hex),
  );
}
