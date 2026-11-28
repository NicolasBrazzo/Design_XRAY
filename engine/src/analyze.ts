import { chromium, errors, type Browser } from "playwright";
import validateUrl from "./utils/validateUrl.ts";
import { readBackgrounds } from "./backgrounds.ts";
import { readTextColors } from "./textColors.ts";
import { readBorderColors } from "./borderColors.ts";
import type { ColorCount } from "./calculateColors.ts";
import { isPublicAddress, type AddressPolicy } from "./network/addresses.ts";
import { startGuardProxy, type GuardProxy } from "./network/guardProxy.ts";

export type AnalyzeErrorCode =
  | "INVALID_URL"
  | "BLOCKED_URL"
  | "NAME_NOT_RESOLVED"
  | "HTTP_ERROR"
  | "TIMEOUT"
  | "BROWSER_MISSING"
  | "ABORTED"
  | "UNKNOWN";

/** Error with a stable `code`: callers (CLI, server) decide how to show it. The engine never prints. */
export class AnalyzeError extends Error {
  code: AnalyzeErrorCode;

  constructor(code: AnalyzeErrorCode, message: string) {
    super(message);
    this.name = "AnalyzeError";
    this.code = code;
  }
}

export interface AnalyzeResult {
  /** URL after redirects. */
  url: string;
  backgrounds: ColorCount[];
  textColors: ColorCount[];
  borderColors: ColorCount[];
}

export interface AnalyzeOptions {
  /** Aborting closes the browser: the analysis stops and rejects with code ABORTED. */
  signal?: AbortSignal;
  /**
   * Which addresses the browser may connect to, checked on every request (redirects and
   * sub-resources included). Default: public internet only. Tests pass a looser policy.
   */
  isAllowedAddress?: AddressPolicy;
}

export async function analyzeUrl(
  inputUrl: string,
  { signal, isAllowedAddress = isPublicAddress }: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const validation = validateUrl(inputUrl);

  if (!validation.result) {
    throw new AnalyzeError("INVALID_URL", validation.error ?? "Invalid URL");
  }

  if (signal?.aborted) throw abortedError();

  let browser: Browser | undefined;
  let proxy: GuardProxy | undefined;
  // URL of the last navigation of the main frame: after a redirect it is the target.
  let navigationUrl = inputUrl;
  // Closing the browser makes the pending Playwright call reject: that is how we stop midway.
  const onAbort = () => void browser?.close();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    proxy = await startGuardProxy(isAllowedAddress);
    browser = await chromium.launch({
      proxy: { server: proxy.server },
      args: [
        // Chromium sends localhost straight to the network by default: through the proxy too.
        "--proxy-bypass-list=<-loopback>",
        // WebRTC can open UDP connections that skip the proxy.
        "--force-webrtc-ip-handling-policy=disable_non_proxied_udp",
      ],
    });
    // Aborted while launching: onAbort ran when there was no browser to close yet.
    if (signal?.aborted) throw abortedError();

    const page = await browser.newPage();
    page.on("request", (request) => {
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        navigationUrl = request.url();
      }
    });
    const response = await page.goto(inputUrl);

    if (response === null) {
      throw new AnalyzeError("HTTP_ERROR", "The site returned no page");
    }

    if (!response.ok()) {
      throwIfRefusedByProxy(proxy, navigationUrl);
      throw new AnalyzeError(
        "HTTP_ERROR",
        `The site answered with HTTP ${response.status()}`,
      );
    }

    return {
      url: page.url(),
      backgrounds: await readBackgrounds(page),
      textColors: await readTextColors(page),
      borderColors: await readBorderColors(page),
    };
  } catch (error: any) {
    // Checked first: after an abort, Playwright throws "browser has been closed", which is not the real cause.
    if (signal?.aborted) throw abortedError();

    if (error instanceof AnalyzeError) throw error;

    if (proxy) throwIfRefusedByProxy(proxy, navigationUrl);

    if (error instanceof errors.TimeoutError) {
      throw new AnalyzeError("TIMEOUT", "The page took more than 30 seconds to load");
    }

    const message: string = error?.message ?? String(error);

    if (message.includes("ERR_NAME_NOT_RESOLVED")) {
      throw new AnalyzeError(
        "NAME_NOT_RESOLVED",
        "Domain not found: check the spelling",
      );
    }

    if (message.includes("Executable doesn't exist")) {
      throw new AnalyzeError(
        "BROWSER_MISSING",
        "Chromium not found. Install it with: npx playwright install chromium",
      );
    }

    throw new AnalyzeError("UNKNOWN", message);
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await browser?.close();
    await proxy?.close();
  }
}

/** The proxy refused the page itself (not a sub-resource): say why instead of a generic error. */
function throwIfRefusedByProxy(proxy: GuardProxy, url: string) {
  const failure = proxy.failureFor(url);
  if (failure === "BLOCKED_URL") {
    throw new AnalyzeError(
      "BLOCKED_URL",
      "This address points to an internal network: only public websites can be analyzed",
    );
  }
  if (failure === "NAME_NOT_RESOLVED") {
    throw new AnalyzeError(
      "NAME_NOT_RESOLVED",
      "Domain not found: check the spelling",
    );
  }
}

function abortedError() {
  return new AnalyzeError("ABORTED", "Analysis cancelled");
}
