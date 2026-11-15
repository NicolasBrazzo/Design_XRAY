import { chromium, errors } from "playwright";
import validateUrl from "./utils/validateUrl.ts";
import { readBackground } from "./background.ts";

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

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    const sendToPage = await page.goto(inputUrl);

    if (!sendToPage?.ok()) {
      console.error("Errore pagina", sendToPage?.status());
      process.exitCode = 1;
      return;
    }

    const pageBackground = await readBackground(page);

    const pageBackgroundResult = {
      background: pageBackground.color,
      source: pageBackground.source,
      url: page.url(),
    };

    console.log(JSON.stringify(pageBackgroundResult, null, 2));
  } catch (error: any) {
    if (error.message.includes("ERR_NAME_NOT_RESOLVED")) {
      console.error("Nome del sito non trovato");
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
    await browser.close();
  }
}

printPageBackground();
