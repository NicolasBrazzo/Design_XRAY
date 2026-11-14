import { chromium } from "playwright";

async function readBodyBackground() {
  const browser = await chromium.launch();

  const website = "https://carlocolombatto.it/";

  try {
    const page = await browser.newPage();
    await page.goto(website);
    const backgroundColor = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    console.log(backgroundColor);
  } catch (err) {
    console.log("Error: ", err);
  } finally {
    await browser.close();
  }
}

readBodyBackground();
