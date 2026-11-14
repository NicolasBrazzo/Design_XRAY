import { chromium } from "playwright";
import validateUrl from "./utils/validateUrl.ts";

async function printPageBackground() {
  const inputUrl = process.argv[2];

  if (inputUrl === undefined) {
    process.exitCode = 1;
    return console.error("Manca l'URL. Uso: node src/cli.ts <url>");
  }

  const validation = validateUrl(inputUrl);

  if (!validation.result) {
    process.exitCode = 1;
    return console.error(validation.error);
  }

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.goto(inputUrl);

    const pageBackground = await page.evaluate(() => {
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

    const pageBackgroundResult = {
      background: pageBackground.color,
      source: pageBackground.source,
      url: page.url()
    };

    console.log(JSON.stringify(pageBackgroundResult, null, 2));
  } catch (err) {
    process.exitCode = 1;
    console.error("Error: ", err);
  } finally {
    await browser.close();
  }
}

printPageBackground();
