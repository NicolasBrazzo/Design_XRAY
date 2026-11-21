import type { Page } from "playwright";
import { rgbToHex } from "./color.ts";

// const counts = {};
// document.querySelectorAll('*').forEach(e => {
//   const hasOwnText = [...e.childNodes].some(
//     n => n.nodeType === Node.TEXT_NODE && n.textContent.trim() !== ''
//   );
//   if (!hasOwnText) return;
//   const v = getComputedStyle(e).color;
//   counts[v] = (counts[v] || 0) + 1;
// });
// console.table(counts);

export async function readTextColors(page: Page) {
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll("*")].map((el) => {
      const rect = el.getBoundingClientRect();
      const hasOwnText = [...el.childNodes].some(
        (n) =>
          n.nodeType === Node.TEXT_NODE && (n.textContent ?? "").trim() !== "",
      );
      return {
        color: getComputedStyle(el).color,
        width: rect.width,
        height: rect.height,
        hasOwnText,
      };
    });
  });

  // Rules live here, in Node: visible and with its own text.
  const visible = elements.filter(
    (e) => e.width > 0 && e.height > 0 && e.hasOwnText,
  );

  const withHex = visible.map((e) => ({
    color: e.color,
    hex: rgbToHex(e.color),
  }));

  // Count by hex: "rgb(...)" and "rgba(..., 1)" end up under the same key.
  const counts = new Map<
    string,
    { color: string; hex: string; count: number }
  >();

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
