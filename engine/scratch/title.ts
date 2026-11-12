import { webkit } from "playwright";

async function screen() {
  const browser = await webkit.launch();
  const page = await browser.newPage();
  await page.goto("https://google.com/");
  await page.screenshot({ path: `example2.png` });
  await browser.close();
}

async function recordTitle() {
  const browser = await webkit.launch();
  const page = await browser.newPage();

  const sites = [
    "https://questo-sito-non-esiste-1234.com",
    "https://nodemailer.com/",
  ];

//   await sites.map((site, i) => {
//     try {
//       await page.goto(site[i]);
//       const title = await page.title();
//       console.log(title);
//     } catch (err) {
//       console.log("Sito non trovato");
//     }
//   });

  await browser.close();
}

recordTitle();
