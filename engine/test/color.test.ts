import { test } from 'node:test'
import assert from 'node:assert/strict'
import { rgbToHex } from '../src/color.ts'

// Pure function: no browser, no network.

test('converts a normal rgb color', () => {
  assert.equal(rgbToHex('rgb(47, 108, 229)'), '#2f6ce5')
})

test('pads single-digit channels with a leading zero', () => {
  assert.equal(rgbToHex('rgb(9, 9, 11)'), '#09090b')
})

test('black and white', () => {
  assert.equal(rgbToHex('rgb(0, 0, 0)'), '#000000')
  assert.equal(rgbToHex('rgb(255, 255, 255)'), '#ffffff')
})

test('rgba with alpha 1 behaves like rgb', () => {
  assert.equal(rgbToHex('rgba(8, 15, 29, 1)'), '#080f1d')
})

test('rgba with alpha 0 is discarded', () => {
  assert.equal(rgbToHex('rgba(0, 0, 0, 0)'), null)
})

test('rgba with partial alpha is discarded (declared limit)', () => {
  assert.equal(rgbToHex('rgba(8, 15, 29, 0.92)'), null)
})

test('unsupported formats return null', () => {
  assert.equal(rgbToHex('oklab(1 0 5.96046e-8 / 0.04)'), null)
  assert.equal(rgbToHex('not a color'), null)
  assert.equal(rgbToHex(''), null)
})
