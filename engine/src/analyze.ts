import { chromium, errors, type Browser } from "playwright";
import validateUrl from "./utils/validateUrl.ts";
import { readBackgrounds } from "./backgrounds.ts";
import { readTextColors } from "./textColors.ts";
import { readBorderColors } from "./borderColors.ts";
import type { ColorCount } from "./calculateColors.ts";

export type AnalyzeErrorCode =
  | "INVALID_URL"
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
}

export async function analyzeUrl(
  inputUrl: string,
  { signal }: AnalyzeOptions = {},
): Promise<AnalyzeResult> {
  const validation = validateUrl(inputUrl);

  if (!validation.result) {
    throw new AnalyzeError("INVALID_URL", validation.error ?? "URL non valido");
  }

  if (signal?.aborted) throw abortedError();

  let browser: Browser | undefined;
  // Closing the browser makes the pending Playwright call reject: that is how we stop midway.
  const onAbort = () => void browser?.close();
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    browser = await chromium.launch();
    // Aborted while launching: onAbort ran when there was no browser to close yet.
    if (signal?.aborted) throw abortedError();

    const page = await browser.newPage();
    const response = await page.goto(inputUrl);

    if (response === null) {
      throw new AnalyzeError("HTTP_ERROR", "Il sito non ha restituito nessuna pagina");
    }

    if (!response.ok()) {
      throw new AnalyzeError(
        "HTTP_ERROR",
        `Il sito ha risposto con HTTP ${response.status()}`,
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

    if (error instanceof errors.TimeoutError) {
      throw new AnalyzeError("TIMEOUT", "Il sito ha impiegato più di 30 secondi a caricarsi");
    }

    const message: string = error?.message ?? String(error);

    if (message.includes("ERR_NAME_NOT_RESOLVED")) {
      throw new AnalyzeError(
        "NAME_NOT_RESOLVED",
        "Dominio non trovato: controlla di averlo scritto bene",
      );
    }

    if (message.includes("Executable doesn't exist")) {
      throw new AnalyzeError(
        "BROWSER_MISSING",
        "Chromium non trovato. Installalo con: npx playwright install chromium",
      );
    }

    throw new AnalyzeError("UNKNOWN", message);
  } finally {
    signal?.removeEventListener("abort", onAbort);
    await browser?.close();
  }
}

function abortedError() {
  return new AnalyzeError("ABORTED", "Analisi annullata");
}
