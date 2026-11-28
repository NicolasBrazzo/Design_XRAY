// Public API of the engine: URL in, JSON out. CLI and server both use this.
export { analyzeUrl, AnalyzeError } from "./analyze.ts";
export type { AnalyzeResult, AnalyzeErrorCode, AnalyzeOptions } from "./analyze.ts";
export type { ColorCount } from "./calculateColors.ts";
export { default as validateUrl } from "./utils/validateUrl.ts";
export {
  isPublicAddress,
  resolveAllowed,
  BlockedAddressError,
} from "./network/addresses.ts";
export type { AddressPolicy, AddressFamily, ResolvedAddress } from "./network/addresses.ts";
