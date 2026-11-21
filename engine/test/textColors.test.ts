import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import type { Browser, Page } from 'playwright'
import { readTextColors } from '../src/textColors.ts'

// Synthetic pages with known colors: no internet, same answer every time.

let browser: Browser

before(async () => {
  browser = await chromium.launch()
})

after(async () => {
  await browser.close()
})

async function textColorsOf(body: string) {
  const page: Page = await browser.newPage()
  try {
    await page.setContent(`<html><body style="margin: 0">${body}</body></html>`)
    return await readTextColors(page)
  } finally {
    await page.close()
  }
}

// A visible block with its own text and the given text color.
function text(color: string, extra = '') {
  return `<div style="color: ${color}; ${extra}">hello</div>`
}

test('counts colors of elements with their own text', async () => {
  const result = await textColorsOf(
    text('rgb(255, 0, 0)') +
      text('rgb(255, 0, 0)') +
      text('rgb(255, 0, 0)') +
      text('rgb(0, 0, 255)') +
      text('rgb(0, 0, 255)'),
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 3 },
    { color: 'rgb(0, 0, 255)', hex: '#0000ff', count: 2 },
  ])
})

test('a container without its own text is not counted (inherited color)', async () => {
  // The outer div has a computed color (green) but shows no text itself.
  const result = await textColorsOf(
    `<div style="color: rgb(0, 128, 0)">${text('rgb(255, 0, 0)')}</div>`,
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('an element with text and a child element counts for its own text only', async () => {
  // "hello" belongs to the div (red); "inner" belongs to the span (blue).
  const result = await textColorsOf(
    '<div style="color: rgb(255, 0, 0)">hello' +
      '<span style="color: rgb(0, 0, 255)">inner</span></div>',
  )
  assert.deepEqual(
    result.map((entry) => entry.hex),
    ['#0000ff', '#ff0000'],
  )
})

test('skips text in display:none and in zero-size elements', async () => {
  const result = await textColorsOf(
    text('rgb(255, 0, 0)') +
      text('rgb(0, 128, 0)', 'display: none') +
      text('rgb(0, 128, 0)', 'width: 0; overflow: hidden'),
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('skips semi-transparent text colors (declared limit)', async () => {
  const result = await textColorsOf(
    text('rgb(255, 0, 0)') + text('rgba(0, 0, 255, 0.5)'),
  )
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('ties on count are ordered by hex, not by page order', async () => {
  // Red comes first in the page, but "#0000ff" < "#ff0000".
  const result = await textColorsOf(
    text('rgb(255, 0, 0)') +
      text('rgb(255, 0, 0)') +
      text('rgb(0, 0, 255)') +
      text('rgb(0, 0, 255)'),
  )
  assert.deepEqual(
    result.map((entry) => entry.hex),
    ['#0000ff', '#ff0000'],
  )
})

test('a page with no text gives an empty list', async () => {
  const result = await textColorsOf('<div style="width: 10px; height: 10px"></div>')
  assert.deepEqual(result, [])
})
