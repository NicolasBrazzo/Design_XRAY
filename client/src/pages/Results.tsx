import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { analyze, ApiError } from '../api.ts'
import type { AnalyzeResult, ColorCount } from '../types.ts'
import ColorSection from '../components/ColorSection.tsx'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'done'; result: AnalyzeResult }

/** What went wrong, in the user's words, and what to do next. `retry`: trying again can help. */
const ERROR_COPY: Record<string, { title: string; hint: string; retry: boolean }> = {
  INVALID_URL: { title: 'That is not a web address', hint: 'Use an http or https address, like https://python.org.', retry: false },
  BAD_REQUEST: { title: 'That is not a web address', hint: 'Use an http or https address, like https://python.org.', retry: false },
  BLOCKED_URL: { title: 'This address is not public', hint: 'Only public websites can be analyzed, not local or internal networks.', retry: false },
  NAME_NOT_RESOLVED: { title: 'This domain does not exist', hint: 'Check the spelling of the address.', retry: false },
  HTTP_ERROR: { title: 'The site answered with an error', hint: 'The page may be down, or the site may block automated browsers.', retry: true },
  TIMEOUT: { title: 'The page took too long to load', hint: 'The limit is 30 seconds. Heavy pages can go over it: try again, or try another page of the site.', retry: true },
  BUSY: { title: 'Two analyses are already running', hint: 'Each one needs its own browser. Try again in a few seconds.', retry: true },
  RATE_LIMITED: { title: 'Too many analyses from your network', hint: 'Wait a few minutes before the next one.', retry: true },
  SERVER_DOWN: { title: 'The server is not answering', hint: 'Try again in a moment.', retry: true },
}
// For these the server's message adds a fact (the HTTP status, the cause): show it below the hint.
const ERRORS_WITH_DETAILS = new Set(['HTTP_ERROR', 'UNKNOWN'])
const UNKNOWN_ERROR = { title: 'The analysis failed', hint: 'Something unexpected went wrong. Try again.', retry: true }

const LIMITS =
  'Counts elements, not the area they cover. Semi-transparent colors are left out. Hover, focus and dark mode are not analyzed.'

export default function Results() {
  const [params] = useSearchParams()
  const [attempt, setAttempt] = useState(0)
  const url = params.get('url')

  if (!url) return <Navigate to="/" replace />

  // The key gives every URL (and every retry) a fresh Analysis: its state starts again from
  // 'loading' by itself, without resetting it by hand inside an effect.
  return <Analysis key={`${url}#${attempt}`} url={url} onRetry={() => setAttempt((a) => a + 1)} />
}

function Analysis({ url, onRetry }: { url: string; onRetry: () => void }) {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    // Aborted on unmount (back button, new search, StrictMode's double run in dev):
    // the server sees the connection close and closes its browser.
    const controller = new AbortController()

    analyze(url, controller.signal)
      .then((result) => setState({ status: 'done', result }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setState({
          status: 'error',
          error: error instanceof ApiError ? error : new ApiError('UNKNOWN', String(error)),
        })
      })

    return () => controller.abort()
  }, [url])

  if (state.status === 'loading') {
    return (
      <main>
        <PageHeading url={url} />
        <Loading />
      </main>
    )
  }

  if (state.status === 'error') {
    const { error } = state
    const copy = ERROR_COPY[error.code] ?? UNKNOWN_ERROR
    return (
      <main>
        <PageHeading url={url} />
        <div role="alert" className="mt-12 max-w-2xl border-l-4 border-alarm pl-6">
          <h2 className="text-2xl font-semibold tracking-tight">{copy.title}</h2>
          <p className="mt-2 text-lg text-muted">{copy.hint}</p>
          {error.message && (ERRORS_WITH_DETAILS.has(error.code) || !(error.code in ERROR_COPY)) && (
            <p className="mt-4 text-sm text-muted">Details: {error.message}</p>
          )}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {copy.retry && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md bg-ink px-5 py-2.5 font-semibold text-paper transition-opacity hover:opacity-85"
              >
                Try again
              </button>
            )}
            <Link to="/" className="underline decoration-rule underline-offset-4 hover:decoration-ink">
              Analyze another page
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { result } = state
  const total = result.backgrounds.length + result.textColors.length + result.borderColors.length

  return (
    <main>
      <PageHeading url={result.url} />

      <Exposure result={result} />

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted">
        {total} distinct {total === 1 ? 'color' : 'colors'} across the three groups. {LIMITS} Click a hex
        value to copy it.
      </p>

      <ColorSection title="Backgrounds" colors={result.backgrounds} unit="element" emptyText="No element has a solid background." />
      <ColorSection title="Text" colors={result.textColors} unit="text element" emptyText="No visible text on the page." />
      <ColorSection title="Borders" colors={result.borderColors} unit="border" emptyText="No element has a visible border." />

      <p className="mt-20">
        <Link to="/" className="font-semibold underline decoration-rule underline-offset-4 hover:decoration-ink">
          Analyze another page
        </Link>
      </p>
    </main>
  )
}

/**
 * The radiograph: one band per group, each color as wide as its count. The whole palette at a
 * glance, before the details below.
 */
function Exposure({ result }: { result: AnalyzeResult }) {
  const bands: [string, ColorCount[]][] = [
    ['Backgrounds', result.backgrounds],
    ['Text', result.textColors],
    ['Borders', result.borderColors],
  ]
  return (
    <figure className="mt-10" aria-label="Overview of the three palettes">
      <div className="overflow-hidden rounded-lg bg-paper ring-1 ring-rule">
        {bands.map(([label, colors]) => (
          <div key={label} className="flex h-14 border-b border-rule last:border-b-0 sm:h-20">
            <span className="flex w-28 shrink-0 items-center px-4 text-sm font-medium sm:w-36">{label}</span>
            {colors.length === 0 ? (
              <span className="flex flex-1 items-center px-4 text-sm text-muted">none</span>
            ) : (
              <div aria-hidden className="flex flex-1">
                {colors.map((color) => (
                  <div
                    key={color.hex}
                    title={`${color.hex} · ${color.count}`}
                    className="min-w-0.5 basis-0"
                    style={{ flexGrow: color.count, backgroundColor: color.hex }}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </figure>
  )
}

function PageHeading({ url }: { url: string }) {
  return (
    <div className="pt-[5vh]">
      <h1 className="text-5xl font-bold tracking-[-0.035em] break-words sm:text-7xl">{hostOf(url)}</h1>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-block text-sm break-all text-muted underline decoration-rule underline-offset-4 hover:text-ink"
      >
        {url}
      </a>
    </div>
  )
}

function Loading() {
  const navigate = useNavigate()
  const seconds = useElapsedSeconds()
  return (
    <div className="mt-10">
      <div aria-hidden className="overflow-hidden rounded-lg bg-paper ring-1 ring-rule">
        {[0, 1, 2].map((row) => (
          <div key={row} className="relative h-14 border-b border-rule last:border-b-0 sm:h-20">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-ink/10 to-transparent motion-safe:animate-[scan_1.6s_ease-in-out_infinite]" />
          </div>
        ))}
      </div>
      <div role="status" className="mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <p className="text-lg">
          Opening the page and reading the styles of every element{' '}
          <span className="text-muted tabular-nums">{seconds}s</span>
        </p>
        <p className="text-sm text-muted">Most pages take 5 to 20 seconds.</p>
      </div>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="mt-6 underline decoration-rule underline-offset-4 hover:decoration-ink"
      >
        Cancel
      </button>
    </div>
  )
}

function useElapsedSeconds() {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  return seconds
}

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
