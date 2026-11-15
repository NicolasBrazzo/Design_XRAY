import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { readBackground } from '../src/background.ts'

// Synthetic pages with a known background: no internet, same answer every time.

let browser: Browser

before(async () => {
  browser = await chromium.launch()
})

after(async () => {
  await browser.close()
})

async function backgroundOf(html: string) {
  const page: Page = await browser.newPage()
  try {
    await page.setContent(html)
    return await readBackground(page)
  } finally {
    await page.close()
  }
}

test('colored body: reads the body background', async () => {
  const result = await backgroundOf(
    '<html><body style="background: rgb(10, 20, 30)"></body></html>',
  )
  assert.deepEqual(result, { color: 'rgb(10, 20, 30)', source: 'body' })
})

test('transparent body, colored html: falls back to html', async () => {
  const result = await backgroundOf(
    '<html style="background: rgb(40, 50, 60)"><body></body></html>',
  )
  assert.deepEqual(result, { color: 'rgb(40, 50, 60)', source: 'html' })
})

test('both transparent: falls back to the default white', async () => {
  const result = await backgroundOf('<html><body></body></html>')
  assert.deepEqual(result, { color: 'rgb(255, 255, 255)', source: 'default' })
})
