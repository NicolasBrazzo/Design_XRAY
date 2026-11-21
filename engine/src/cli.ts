import { chromium, errors, type Browser } from "playwright";
import validateUrl from "./utils/validateUrl.ts";
import { readBackgrounds } from "./backgrounds.ts";
import { readTextColors } from "./textColors.ts";

export async function printPageBackground() {
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

  let browser: Browser | undefined;

  try {
    browser = await chromium.launch();
    
    const page = await browser.newPage();
    const sendToPage = await page.goto(inputUrl);

    if (!sendToPage?.ok()) {
      console.error("Errore pagina", sendToPage?.status());
      process.exitCode = 1;
      return;
    }

    const backgrounds = await readBackgrounds(page);
    const textColors = await readTextColors(page);

    const result = {
      url: page.url(),
      backgrounds,
      textColors
    };

    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    if (error.message.includes("ERR_NAME_NOT_RESOLVED")) {
      console.error("Nome del sito non trovato");
      process.exitCode = 1;
      return;
    }

    if (error.message.includes("Executable doesn't exist")) {
      console.error(
        "Chromium non trovato. Installalo con: npx playwright install chromium",
      );
      process.exitCode = 1;
      return;
    }

    if (error instanceof errors.TimeoutError) {
      console.error("Timeout!");
      process.exitCode = 1;
      return;
    }

    process.exitCode = 1;
    console.error("Error: ", error.message);
  } finally {
    await browser?.close();
  }
}

if (import.meta.main) await printPageBackground();
