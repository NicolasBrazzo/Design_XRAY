import type { Page } from "playwright";

export async function readBackground(page: Page) {
  return await page.evaluate(() => {
    const bodyBackground = getComputedStyle(document.body).backgroundColor;

    if (bodyBackground === "rgba(0, 0, 0, 0)") {
      const htmlBackground = getComputedStyle(
        document.documentElement,
      ).backgroundColor;

      if (htmlBackground === "rgba(0, 0, 0, 0)") {
        return { color: "rgb(255, 255, 255)", source: "default" };
      }
      return { color: htmlBackground, source: "html" };
    } else {
      return { color: bodyBackground, source: "body" };
    }
  });

}
