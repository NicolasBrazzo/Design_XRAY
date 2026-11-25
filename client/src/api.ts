import type { AnalyzeResult } from './types.ts'

/** Error from the API, with the same `code` the server sends (INVALID_URL, TIMEOUT, …). */
export class ApiError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

const SERVER_DOWN = new ApiError(
  'SERVER_DOWN',
  'Il server non risponde. Controlla che sia avviato: npm run dev nella cartella server/',
)

export async function analyze(url: string, signal?: AbortSignal): Promise<AnalyzeResult> {
  let response: Response
  try {
    response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal,
    })
  } catch (error) {
    if (signal?.aborted) throw error
    throw SERVER_DOWN
  }

  const body = await response.json().catch(() => null)

  if (!response.ok) {
    // No JSON error: the answer did not come from our server (e.g. the Vite proxy with the server off).
    if (!body?.error) throw SERVER_DOWN
    throw new ApiError(body.error.code, body.error.message)
  }

  return body as AnalyzeResult
}
