import { lookup } from "node:dns/promises";
import { BlockList, isIP } from "node:net";

// SSRF: the engine opens URLs chosen by strangers, from the server's own network. Without
// these checks "http://localhost:5432" or "http://169.254.169.254" (cloud metadata) would be
// reachable from outside. Used by the server (before launching the browser) and by the
// guard proxy (for every request the browser makes).

/** Addresses that are not on the public internet. */
const privateRanges = new BlockList();
// IPv4
privateRanges.addSubnet("0.0.0.0", 8, "ipv4"); // "this network"
privateRanges.addSubnet("10.0.0.0", 8, "ipv4"); // private
privateRanges.addSubnet("100.64.0.0", 10, "ipv4"); // carrier-grade NAT
privateRanges.addSubnet("127.0.0.0", 8, "ipv4"); // loopback
privateRanges.addSubnet("169.254.0.0", 16, "ipv4"); // link-local, cloud metadata
privateRanges.addSubnet("172.16.0.0", 12, "ipv4"); // private
privateRanges.addSubnet("192.0.0.0", 24, "ipv4"); // protocol assignments
privateRanges.addSubnet("192.168.0.0", 16, "ipv4"); // private
privateRanges.addSubnet("198.18.0.0", 15, "ipv4"); // benchmarking
privateRanges.addSubnet("224.0.0.0", 4, "ipv4"); // multicast
privateRanges.addSubnet("240.0.0.0", 4, "ipv4"); // reserved, broadcast
// IPv6 (IPv4-mapped addresses like ::ffff:127.0.0.1 are matched by the IPv4 rules above)
privateRanges.addAddress("::", "ipv6"); // unspecified
privateRanges.addAddress("::1", "ipv6"); // loopback
privateRanges.addSubnet("fc00::", 7, "ipv6"); // unique local (private)
privateRanges.addSubnet("fe80::", 10, "ipv6"); // link-local
privateRanges.addSubnet("ff00::", 8, "ipv6"); // multicast

export type AddressFamily = 4 | 6;

/** Decides whether the engine may connect to an address. */
export type AddressPolicy = (address: string, family: AddressFamily) => boolean;

/** Default policy: only public internet addresses. */
export const isPublicAddress: AddressPolicy = (address, family) =>
  !privateRanges.check(address, family === 6 ? "ipv6" : "ipv4");

export interface ResolvedAddress {
  address: string;
  family: AddressFamily;
}

/** Thrown when a host resolves to an address the policy does not allow. */
export class BlockedAddressError extends Error {
  host: string;

  constructor(host: string) {
    super(`Blocked address: ${host}`);
    this.name = "BlockedAddressError";
    this.host = host;
  }
}

/**
 * Resolves `host` (a name or an IP literal, IPv6 with or without brackets) and checks every
 * address it points to. Returns the addresses, or throws BlockedAddressError if any of them is
 * not allowed. DNS errors are thrown as they are (code ENOTFOUND, ...).
 *
 * Callers must connect to the returned address, not to the name: resolving the name again
 * could give a different answer (DNS rebinding).
 */
export async function resolveAllowed(
  host: string,
  isAllowed: AddressPolicy = isPublicAddress,
): Promise<ResolvedAddress[]> {
  const bare = host.replace(/^\[(.*)\]$/, "$1");
  const literal = isIP(bare);

  const addresses: ResolvedAddress[] = literal
    ? [{ address: bare, family: literal as AddressFamily }]
    : (await lookup(bare, { all: true })).map(({ address, family }) => ({
        address,
        family: family as AddressFamily,
      }));

  if (addresses.some(({ address, family }) => !isAllowed(address, family))) {
    throw new BlockedAddressError(host);
  }

  return addresses;
}
