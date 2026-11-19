import { chromium } from "playwright";
import { readBackgrounds } from "./src/backgrounds.ts";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent('<div style="width:10px;height:10px;background:red"></div>');
console.log(await readBackgrounds(page));
await browser.close();
