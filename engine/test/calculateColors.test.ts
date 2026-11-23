import { test } from 'node:test'
import assert from 'node:assert/strict'
import { countColors } from '../src/calculateColors.ts'

// Pure function: no browser needed.

test('counts one entry per element and color, most used first', () => {
  const result = countColors([
    ['rgb(255, 0, 0)'],
    ['rgb(0, 0, 255)'],
    ['rgb(0, 0, 255)'],
  ])
  assert.deepEqual(result, [
    { color: 'rgb(0, 0, 255)', hex: '#0000ff', count: 2 },
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('the same color twice in one element counts once', () => {
  const result = countColors([['rgb(255, 0, 0)', 'rgb(255, 0, 0)']])
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 1 },
  ])
})

test('different colors in one element count once each', () => {
  const result = countColors([['rgb(255, 0, 0)', 'rgb(0, 0, 255)']])
  assert.deepEqual(
    result.map((entry) => [entry.hex, entry.count]),
    [
      ['#0000ff', 1],
      ['#ff0000', 1],
    ],
  )
})

test('rgb and rgba with alpha 1 share the same entry', () => {
  const result = countColors([['rgb(255, 0, 0)'], ['rgba(255, 0, 0, 1)']])
  assert.deepEqual(result, [
    { color: 'rgb(255, 0, 0)', hex: '#ff0000', count: 2 },
  ])
})

test('skips colors that cannot be converted (alpha != 1, lab)', () => {
  const result = countColors([
    ['rgba(255, 0, 0, 0.5)'],
    ['rgba(255, 0, 0, 0)'],
    ['lab(93 -1 -2)'],
    ['rgb(0, 0, 255)'],
  ])
  assert.deepEqual(result, [
    { color: 'rgb(0, 0, 255)', hex: '#0000ff', count: 1 },
  ])
})

test('ties on count are ordered by hex, not by input order', () => {
  const result = countColors([['rgb(255, 0, 0)'], ['rgb(0, 0, 255)']])
  assert.deepEqual(
    result.map((entry) => entry.hex),
    ['#0000ff', '#ff0000'],
  )
})

test('no elements, or elements without colors, give an empty list', () => {
  assert.deepEqual(countColors([]), [])
  assert.deepEqual(countColors([[], []]), [])
})
