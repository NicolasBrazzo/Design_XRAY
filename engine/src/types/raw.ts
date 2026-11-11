// Shape of raw.json: the output of pipeline phases 1 (acquire) and 2 (extract).
//
// Rules that apply to the whole file:
// - Values are stored exactly as the browser gives them (strings from getComputedStyle,
//   CSS text as written). Parsing, unit conversion and deduplication belong to phase 3
//   (normalize, roadmap M2): extraction reads, it does not interpret.
// - Elements point to each other by index (position in `elements`), never by DOM node:
//   raw.json must be usable offline, without the page.
// - Nothing is copied from the site beyond what is needed: no font or image files, no full
//   stylesheet text. The payload of every data: URI is cut ("data:font/woff;base64,…").
//
// Cases from docs/lab/casi-difficili.md that shaped this file are cited as "M0 Cxx".

/** Version of this shape. Bump it on every change, so saved fixtures can be recognized as outdated. */
export const RAW_FORMAT_VERSION = 1

export interface RawDocument {
  meta: RawMeta
  /** Visible elements in document order (shadow root content right after its host). */
  elements: RawElement[]
  pseudoElements: RawPseudoElement[]
  stylesheets: RawStylesheet[]
  customProperties: RawCustomProperty[]
  fontFaces: RawFontFace[]
  /** Entries of document.fonts, loaded or not. */
  documentFonts: RawDocumentFont[]
  renderedFonts: RawRenderedFonts[]
  /** Font files requested over the network. Requested does not mean used (M0 C07). */
  fontRequests: RawFontRequest[]
  mediaQueries: RawConditionalRule[]
  containerQueries: RawConditionalRule[]
  /** Names of @keyframes rules, without duplicates, in source order. */
  keyframes: string[]
  /** How many style rules target interaction states. Only counted for now: used in M6.4. */
  stateRules: { hover: number; focus: number }
  /** <meta name="theme-color">: there can be several, one per color scheme. */
  themeColors: { content: string; media: string }[]
  manifestUrl: string | null
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export interface RawMeta {
  formatVersion: number
  engineVersion: string
  requestedUrl: string
  /** URL after redirects. */
  finalUrl: string
  /** URLs visited before finalUrl, in order. Empty if there were no redirects. */
  redirects: string[]
  /** HTTP status of the main document; null if no response arrived. */
  httpStatus: number | null
  title: string
  /** ISO 8601, e.g. "2026-11-11T14:03:00.000Z". The only value that changes between two runs on the same page. */
  capturedAt: string
  viewport: { width: number; height: number }
  userAgent: string
  /** prefers-color-scheme emulated by the browser ('light' until dark mode, M6.2). */
  colorScheme: 'light' | 'dark'
  /** Computed font-size of <html>, in px: the base for rem values in phase 3. */
  rootFontSize: number
  /** scrollHeight of the page, in px. */
  documentHeight: number
  /** File names, relative to raw.json. */
  screenshots: { viewport: string; fullPage: string | null }
  counts: RawCounts
  /**
   * Indices (into `elements`) of fixed elements covering at least half of the viewport:
   * probably popups or cookie banners that hide the page (M0 C02).
   */
  overlays: number[]
  /** Set when the captured page is probably not the real page. Data from a blocked page must not be shown as complete. */
  blocked: RawBlocked | null
}

export interface RawCounts {
  /** Every element in the DOM, open shadow roots included. */
  domElements: number
  /** Elements that passed the visibility filter. */
  visibleElements: number
  /** Elements saved in `elements`: the first `elementLimit` visible ones, in document order. */
  extractedElements: number
  elementLimit: number
  shadowRoots: number
  /** Not extracted yet (M6.8), only counted. */
  iframes: number
}

export interface RawBlocked {
  /**
   * - 'http-status': 403, 429, 503…
   * - 'challenge-page': an anti-bot page ("Just a moment…")
   * - 'nearly-empty': too few visible elements for a real page (M0 C01)
   */
  reason: 'http-status' | 'challenge-page' | 'nearly-empty'
  /** Human-readable explanation, e.g. "HTTP 403" or "12 visible elements". */
  detail: string
}

// ---------------------------------------------------------------------------
// Elements
// ---------------------------------------------------------------------------

export interface RawElement {
  /** Position in `elements`, repeated here so that a single element can be read on its own. */
  index: number
  /**
   * Index of the nearest *saved* ancestor (invisible ancestors are skipped); null at the top.
   * The saved tree replaces the DOM offline. Phase 3 climbs it to find the background behind
   * an element and compose transparency; phase 4 uses it for context: inside <pre>/<code>
   * (M0 C34), inside a button, around an <img> (M0 C26).
   */
  parentIndex: number | null
  /** Lower case: 'div', 'button', 'svg', 'path'. */
  tag: string
  /** The role attribute, if present. Pages without semantic tags rely on it (M0 C14). */
  role: string | null
  /** Short, readable, not necessarily unique, e.g. "button.btn.btn-primary". Shown as evidence in the report. */
  selector: string
  inShadowRoot: boolean
  /**
   * Direct text only: text nodes that are children of this element, not of its descendants.
   * null if there is none. Because of inheritance, color and font-* count only on these elements.
   */
  text: RawText | null
  /** Border box in CSS px, page coordinates, with the page scrolled to the top. */
  rect: { x: number; y: number; width: number; height: number }
  styles: RawStyles
}

export interface RawText {
  /** Characters of direct text, whitespace trimmed: weighs text colors by amount of text (M0 decision D2). */
  chars: number
  /** The first characters (at most 40), as evidence in the report: «Create account». */
  sample: string
}

/**
 * Properties read with getComputedStyle for every element: the table in brief §6.2, plus a few
 * values that give context. Longhands only: one value per side or corner, so phase 3 never has to
 * split a shorthand like "6px 6px 0px 0px".
 *
 * It is a runtime array, not only a type: the extraction code loops over it. Since that code runs
 * inside the page, the array reaches it as an argument of page.evaluate (the "two worlds", M1.5).
 */
export const STYLE_PROPERTIES = [
  // Color
  'color',
  'background-color',
  'background-image', // gradients are often the visible color (M0 C19)
  'border-top-color',
  'border-right-color',
  'border-bottom-color',
  'border-left-color',
  'outline-color',
  'outline-width', // an outline color only shows if the width is > 0
  'fill',
  'stroke',
  // Typography
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'line-height',
  'letter-spacing',
  'text-transform',
  // Spacing
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'row-gap',
  'column-gap',
  // Shape
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-right-radius',
  'border-bottom-left-radius',
  'border-top-width',
  'border-right-width',
  'border-bottom-width',
  'border-left-width',
  // Depth
  'box-shadow',
  'opacity',
  // Motion
  'transition-property',
  'transition-duration',
  'transition-timing-function',
  'animation-name',
  'animation-duration',
  // Layout context: gap only applies to flex and grid; fixed elements can be overlays
  'display',
  'position',
] as const

export type StyleProperty = (typeof STYLE_PROPERTIES)[number]

/**
 * Computed values, exactly as getComputedStyle(el).getPropertyValue(name) returns them:
 * "rgb(0, 106, 255)", "lab(7.78 0 0)", "3.35544e+07px", "normal"… (M0 C15, C16).
 */
export type RawStyles = Record<StyleProperty, string>

export interface RawPseudoElement {
  /** Index of the element that owns it. */
  elementIndex: number
  pseudo: '::before' | '::after'
  /** Computed content: '"→"', 'url(…)', or '""' for a purely decorative box. Pseudo-elements with content 'none' or 'normal' are not saved. */
  content: string
  styles: RawStyles
}

// ---------------------------------------------------------------------------
// Stylesheets
// ---------------------------------------------------------------------------

/**
 * Only sheets attached to the document. CSS that was downloaded but not attached (prefetched
 * for other pages, M0 C06) is ignored.
 */
export interface RawStylesheet {
  /** Position in `stylesheets`; other entries point here with `stylesheetIndex`. */
  index: number
  /** Absolute URL for <link> and @import; null for <style> and constructed sheets. */
  href: string | null
  origin: 'link' | 'style' | 'import' | 'constructed'
  /**
   * Where the rules were read from:
   * - 'cssom': document.styleSheets, for same-origin sheets; also catches rules added with
   *   insertRule to an empty <style> (M0 C08)
   * - 'network': text intercepted in phase 1 and parsed, for cross-origin sheets (M0 C05)
   * - 'none': not readable in either way
   */
  readFrom: 'cssom' | 'network' | 'none'
  /** Top-level rules read; null if not read. */
  ruleCount: number | null
  /** The media attribute ('' if absent): a sheet with media="print" does not apply on screen. */
  media: string
  disabled: boolean
}

export interface RawCustomProperty {
  /** E.g. '--primary'. */
  name: string
  /**
   * Every declaration in the stylesheets, in source order. A variable redefined by themes or
   * media queries has several, and the value on :root may not be the one the page uses
   * (M0 C09: on shadcn, --primary is #000000 on :root and #171717 inside .theme-container).
   */
  declarations: RawDeclaration[]
  /** Value resolved by the browser on <html>; '' if the variable is not defined there. */
  rootValue: string
  /**
   * If rootValue is a color: the computed color of a hidden probe with `color: var(name)`, in the
   * same format that elements use, so phase 4 can match values to names exactly. Otherwise null.
   */
  rootColor: string | null
}

export interface RawDeclaration {
  selector: string
  /** As written: 'var(--color-neutral-900)', 'lab(7.78% 0 0)', '.625rem'. */
  value: string
  /** Enclosing at-rules, outermost first: ['@layer theme'], ['@media (min-width: 1024px)']. Empty if none. */
  atRules: string[]
  stylesheetIndex: number
}

/** Conditions of @media or @container rules, without duplicates, in source order. */
export interface RawConditionalRule {
  /** As serialized by the browser: '(min-width: 48rem)', 'screen and (max-width: 860px)', 'card (min-width: 250px)'. */
  condition: string
  /** How many rules use it: a real breakpoint is usually repeated many times. */
  count: number
}

// ---------------------------------------------------------------------------
// Fonts
// ---------------------------------------------------------------------------

export interface RawFontFace {
  /** As declared, quotes included: '"Geist Mono"', 'SourceSansProBold'. */
  family: string
  /** '400', 'bold', '100 900' (variable font). */
  weight: string
  style: string
  display: string
  unicodeRange: string
  /**
   * The src descriptor as written, data: payloads cut. Relative URLs resolve against the href of
   * the stylesheet. Only URLs are kept: font files are never stored.
   */
  src: string
  stylesheetIndex: number
}

export interface RawDocumentFont {
  family: string
  weight: string
  style: string
  status: 'unloaded' | 'loading' | 'loaded' | 'error'
}

/**
 * Fonts that Chromium actually used to draw the text of a sample of elements (the first h1–h6,
 * paragraphs, links, buttons, and the most frequent text styles), read through the Chrome DevTools
 * Protocol (CSS.getPlatformFontsForNode). `font-family` only says what was asked for.
 */
export interface RawRenderedFonts {
  elementIndex: number
  fonts: RawPlatformFont[]
}

export interface RawPlatformFont {
  familyName: string
  /** Reveals the real weight when bold is a separate family: 'SourceSansPro-Bold' with font-weight 400 (M0 C12). */
  postScriptName: string
  /** false for fonts installed on the machine running the browser: the result depends on that machine (M0 C13). */
  isCustomFont: boolean
  glyphCount: number
}

export interface RawFontRequest {
  url: string
  status: number
}
