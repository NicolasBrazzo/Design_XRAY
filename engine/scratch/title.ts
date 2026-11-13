import { chromium } from "playwright";

async function recordTitle() {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  
  const website = "https://google.com/";
  
  try {
    const page = await browser.newPage();
    await page.goto(website);
    const title = await page.title();
    console.log(title);
  } catch (err) {
    console.log("Error: ", err);
  } finally {
    await browser.close();
  }
}

recordTitle();
