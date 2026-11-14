import { chromium } from "playwright";

function websiteIsValid(website: string) {
  try {
    const url = new URL(website);

    if (!(url.protocol === "https:") && !(url.protocol === "http:")) {
      return {result: false, error: "È un URL, ma il protocollo non è permesso: solo http e https"};
    }
  } catch {
    return {result: false, error: "URL non valido"};
  }

  return {result: true};
}

async function readBodyBackground() {
  const website = process.argv[2];
  
  if(website === undefined) {
    process.exitCode = 1;
    return console.error("Manca l'URL. Uso: node src/cli.ts <url>")
  }

  const check = websiteIsValid(website);

  if (!check.result) {
    process.exitCode = 1;
    return console.error(check.error);
  }

  const browser = await chromium.launch();

  try {
    const page = await browser.newPage();
    await page.goto(website);
    const backgroundColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    console.log(backgroundColor);
  } catch (err) {
    process.exitCode = 1;
    console.log("Error: ", err);
  } finally {
    await browser.close();
  }
}

readBodyBackground();
