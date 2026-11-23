import type { Page } from "playwright";
import { countColors } from "./calculateColors.ts";

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

  // Rule: the element must be visible.
  const visible = elements.filter((el) => el.width > 0 && el.height > 0);

  return countColors(visible.map((el) => [el.color]));
}
