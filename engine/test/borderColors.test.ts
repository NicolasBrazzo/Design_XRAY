import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { readBorderColors } from '../src/borderColors.ts'

// Synthetic pages with known colors: no internet, same answer every time.

let browser: Browser

before(async () => {
  browser = await chromium.launch()
})

after(async () => {
  await browser.close()
})

async function borderColorsOf(body: string) {
  const page: Page = await browser.newPage()
  try {
    await page.setContent(`<html><body style="margin: 0">${body}</body></html>`)
    return await readBorderColors(page)
  } finally {
    await page.close()
  }
}

// A visible 10x10 box with the given CSS border declarations.
function box(border: string) {
  return `<div style="width: 10px; height: 10px; ${border}"></div>`
}

const RED = { color: 'rgb(255, 0, 0)', hex: '#ff0000' }
const BLUE = { color: 'rgb(0, 0, 255)', hex: '#0000ff' }

test('a uniform border counts once, not once per side', async () => {
  const result = await borderColorsOf(box('border: 1px solid rgb(255, 0, 0)'))
  assert.deepEqual(result, [{ ...RED, count: 1 }])
})

test('a single drawn side counts, the other sides do not', async () => {
  const result = await borderColorsOf(
    box('border-bottom: 2px solid rgb(255, 0, 0)'),
  )
  assert.deepEqual(result, [{ ...RED, count: 1 }])
})

test('an element without border is not counted', async () => {
  const result = await borderColorsOf(box('background: white'))
  assert.deepEqual(result, [])
})

test('a color with border-style none is not counted (thickness is 0)', async () => {
  const result = await borderColorsOf(
    box('border: 1px none rgb(255, 0, 0)') +
      box('border: 1px solid rgb(0, 0, 255)'),
  )
  assert.deepEqual(result, [{ ...BLUE, count: 1 }])
})

test('sides with different colors give one count per distinct color', async () => {
  const result = await borderColorsOf(
    box(
      'border-top: 1px solid rgb(255, 0, 0); border-bottom: 1px solid rgb(0, 0, 255); border-left: 1px solid rgb(255, 0, 0)',
    ),
  )
  assert.deepEqual(result, [
    { ...BLUE, count: 1 },
    { ...RED, count: 1 },
  ])
})

test('skips semi-transparent borders (declared limit)', async () => {
  const result = await borderColorsOf(
    box('border: 1px solid rgb(255, 0, 0)') +
      box('border: 1px solid rgba(0, 0, 255, 0.5)'),
  )
  assert.deepEqual(result, [{ ...RED, count: 1 }])
})

test('skips borders of display:none and zero-size elements', async () => {
  const result = await borderColorsOf(
    box('border: 1px solid rgb(255, 0, 0)') +
      box('border: 1px solid rgb(0, 0, 255); display: none'),
  )
  assert.deepEqual(result, [{ ...RED, count: 1 }])
})

test('counts elements per color, most used first', async () => {
  const result = await borderColorsOf(
    box('border: 1px solid rgb(255, 0, 0)') +
      box('border: 1px solid rgb(0, 0, 255)') +
      box('border: 1px solid rgb(0, 0, 255)'),
  )
  assert.deepEqual(result, [
    { ...BLUE, count: 2 },
    { ...RED, count: 1 },
  ])
})

test('ties on count are ordered by hex, not by page order', async () => {
  // Red comes first in the page, but "#0000ff" < "#ff0000".
  const result = await borderColorsOf(
    box('border: 1px solid rgb(255, 0, 0)') +
      box('border: 1px solid rgb(0, 0, 255)'),
  )
  assert.deepEqual(
    result.map((entry) => entry.hex),
    ['#0000ff', '#ff0000'],
  )
})

test('a page with no borders gives an empty list', async () => {
  const result = await borderColorsOf('<p>hello</p>')
  assert.deepEqual(result, [])
})
