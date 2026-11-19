import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { readBackgrounds } from '../src/backgrounds.ts'

// Synthetic pages with known colors: no internet, same answer every time.

let browser: Browser

before(async () => {
  browser = await chromium.launch()
})

after(async () => {
  await browser.close()
})

async function backgroundsOf(body: string) {
  const page: Page = await browser.newPage()
  try {
    await page.setContent(`<html><body style="margin: 0">${body}</body></html>`)
    return await readBackgrounds(page)
  } finally {
    await page.close()
  }
}

// A visible 10x10 box with the given background.
function box(background: string, extra = '') {
  return `<div style="width: 10px; height: 10px; background: ${background}; ${extra}"></div>`
}

test('counts visible colors, skipping transparent and display:none', async () => {
  const result = await backgroundsOf(
    box('rgb(255, 0, 0)') +
      box('rgb(255, 0, 0)') +
      box('rgb(255, 0, 0)') +
      box('rgb(0, 0, 255)') +
      box('rgb(0, 0, 255)') +
      box('transparent') +
      box('rgb(0, 128, 0)', 'display: none'),
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 3 },
    { color: 'rgb(0, 0, 255)', hex: '#0000ff', count: 2 },
  ])
})

test('skips elements with zero width or height', async () => {
  const result = await backgroundsOf(
    box('rgb(255, 0, 0)') +
      '<div style="width: 0; height: 10px; background: rgb(0, 128, 0)"></div>' +
      '<div style="width: 10px; height: 0; background: rgb(0, 128, 0)"></div>',
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('skips semi-transparent backgrounds (declared limit)', async () => {
  const result = await backgroundsOf(
    box('rgb(255, 0, 0)') + box('rgba(0, 0, 255, 0.5)'),
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('ties on count are ordered by hex, not by page order', async () => {
  // Red comes first in the page, but "#0000ff" < "#ff0000".
  const result = await backgroundsOf(
    box('rgb(255, 0, 0)') +
      box('rgb(255, 0, 0)') +
      box('rgb(0, 0, 255)') +
      box('rgb(0, 0, 255)'),
  )
  assert.deepEqual(
    result.map((entry) => entry.hex),
    ['#0000ff', '#ff0000'],
  )
})

test('a page with no colored elements gives an empty list', async () => {
  const result = await backgroundsOf('<p>hello</p>')
  assert.deepEqual(result, [])
})
