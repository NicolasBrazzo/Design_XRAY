import { resolveAllowed, BlockedAddressError } from '../engine/src/index.ts'

// SSRF, first check: refuse internal addresses before launching a browser at all.
// The full protection is in the engine: every request Chromium makes (redirects and
// sub-resources included) goes through a proxy that applies the same rules
// (engine/src/network/guardProxy.ts). This check only saves a browser launch.

/**
 * Resolves the host of `url` and checks every address it points to.
 * Returns null if the URL is allowed, otherwise `{ code, message }`.
 */
export async function checkPublicUrl(url) {
  try {
    await resolveAllowed(new URL(url).hostname)
    return null
  } catch (error) {
    if (error instanceof BlockedAddressError) {
      return {
        code: 'BLOCKED_URL',
        message: 'This address points to an internal network: only public websites can be analyzed',
      }
    }
    return { code: 'NAME_NOT_RESOLVED', message: 'Domain not found: check the spelling' }
  }
}
