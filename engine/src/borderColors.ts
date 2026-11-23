import type { Page } from "playwright";
import { countColors } from "./calculateColors.ts";

export async function readBorderColors(page: Page) {
  const elements = await page.evaluate(() => {
    return [...document.querySelectorAll("*")].map((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        // Size of the element (to skip invisible ones).
        width: rect.width,
        height: rect.height,
        // The four sides are separate properties: color and thickness of each.
        sides: [
          { color: style.borderTopColor, thickness: style.borderTopWidth },
          { color: style.borderRightColor, thickness: style.borderRightWidth },
          {
            color: style.borderBottomColor,
            thickness: style.borderBottomWidth,
          },
          { color: style.borderLeftColor, thickness: style.borderLeftWidth },
        ],
      };
    });
  });

  // Rules: the element must be visible; a side counts only if it is drawn
  // (thickness > 0).
  const visible = elements.filter((e) => e.width > 0 && e.height > 0);

  return countColors(
    visible.map((e) =>
      e.sides
        .filter((side) => parseFloat(side.thickness) > 0)
        .map((side) => side.color),
    ),
  );
}
