import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { chromium } from 'playwright'

// Checks the environment set up in roadmap step 1.1.
// If this file runs at all, Node is executing TypeScript without a build step.

test('Chromium for Playwright is installed', () => {
  const executable: string = chromium.executablePath()
  assert.ok(existsSync(executable), `Missing browser at ${executable}: run "npx playwright install chromium"`)
})
