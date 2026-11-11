import express from 'express'
// const { chromium, firefox, webkit } = require("playwright");

const app = express()
const PORT = process.env.PORT || 3000


// async function getWatherData() {
//     const browser = await firefox.launch();
//     const context = await browser.newContext();
//     const page = await context.newPage();
    
//     await page.goto("https://tanstack.com/query/latest");
    
//     const [h] = await page.locator("img.h-full:nth-child(2)").allInnerTexts();
//     console.log(h)

//     await browser.close();
// }

// getWatherData();


app.listen(PORT, () => console.log(`Server su http://localhost:${PORT}`))
