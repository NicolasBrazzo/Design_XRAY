import type { Page } from "playwright";
import { countColors } from "./calculateColors.ts";

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

  // Rules: the element must be visible and have its own text.
  const visible = elements.filter(
    (e) => e.width > 0 && e.height > 0 && e.hasOwnText,
  );

  return countColors(visible.map((e) => [e.color]));
}
