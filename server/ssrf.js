import { lookup } from 'node:dns/promises'
import { BlockList, isIP } from 'node:net'

// SSRF: the server opens any URL it receives, from its own network. Without this check,
// "http://localhost:5432" or "http://169.254.169.254" (cloud metadata) would be reachable from outside.
//
// Addresses that are not on the public internet.
const blocked = new BlockList()
// IPv4
blocked.addSubnet('0.0.0.0', 8, 'ipv4') // "this network"
blocked.addSubnet('10.0.0.0', 8, 'ipv4') // private
blocked.addSubnet('100.64.0.0', 10, 'ipv4') // carrier-grade NAT
blocked.addSubnet('127.0.0.0', 8, 'ipv4') // loopback
blocked.addSubnet('169.254.0.0', 16, 'ipv4') // link-local, cloud metadata
blocked.addSubnet('172.16.0.0', 12, 'ipv4') // private
blocked.addSubnet('192.0.0.0', 24, 'ipv4') // protocol assignments
blocked.addSubnet('192.168.0.0', 16, 'ipv4') // private
blocked.addSubnet('198.18.0.0', 15, 'ipv4') // benchmarking
blocked.addSubnet('224.0.0.0', 4, 'ipv4') // multicast
blocked.addSubnet('240.0.0.0', 4, 'ipv4') // reserved, broadcast
// IPv6 (IPv4-mapped addresses like ::ffff:127.0.0.1 are matched by the IPv4 rules above)
blocked.addAddress('::', 'ipv6') // unspecified
blocked.addAddress('::1', 'ipv6') // loopback
blocked.addSubnet('fc00::', 7, 'ipv6') // unique local (private)
blocked.addSubnet('fe80::', 10, 'ipv6') // link-local
blocked.addSubnet('ff00::', 8, 'ipv6') // multicast

/**
 * Resolves the host of `url` and checks every address it points to.
 *
 * Returns null if the URL is allowed, otherwise `{ code, message }`.
 *
 * Known limits (to close before a public deploy):
 * - redirects and sub-resources loaded by the page are not checked: a public page can
 *   still redirect Chromium to an internal address;
 * - DNS rebinding: Chromium resolves the name again and may get a different answer.
 * Both need checks inside the browser (page.route), in the engine.
 */
export async function checkPublicUrl(url) {
  const { hostname } = new URL(url)
  // IPv6 literals keep their brackets in URL.hostname: "[::1]".
  const host = hostname.replace(/^\[(.*)\]$/, '$1')

  let addresses
  if (isIP(host)) {
    addresses = [{ address: host, family: isIP(host) }]
  } else {
    try {
      addresses = await lookup(host, { all: true })
    } catch {
      return { code: 'NAME_NOT_RESOLVED', message: 'Dominio non trovato: controlla di averlo scritto bene' }
    }
  }

  const isBlocked = addresses.some(({ address, family }) =>
    blocked.check(address, family === 6 ? 'ipv6' : 'ipv4'),
  )

  if (isBlocked) {
    return { code: 'BLOCKED_URL', message: 'Questo indirizzo punta a una rete interna: si possono analizzare solo siti pubblici' }
  }

  return null
}
