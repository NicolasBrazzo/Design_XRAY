// Copy of the engine types (engine/src/analyze.ts, engine/src/calculateColors.ts).
// The client does not import from engine/: if the JSON shape changes there, update it here too.

export type ColorCount = { color: string; hex: string; count: number }

export interface AnalyzeResult {
  /** URL after redirects. */
  url: string
  backgrounds: ColorCount[]
  textColors: ColorCount[]
  borderColors: ColorCount[]
}
