import { useEffect, useState } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { analyze, ApiError } from '../api.ts'
import type { AnalyzeResult } from '../types.ts'
import ColorSection from '../components/ColorSection.tsx'

type State =
  | { status: 'loading' }
  | { status: 'error'; error: ApiError }
  | { status: 'done'; result: AnalyzeResult }

// Retrying these would give the same answer: the user has to change the address.
const FINAL_ERRORS = new Set(['INVALID_URL', 'BLOCKED_URL', 'NAME_NOT_RESOLVED', 'BAD_REQUEST'])

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
    return (
      <main>
        <PageHeading url={url} />
        <div role="alert" className="mt-12 border-l-2 border-red-700 pl-5">
          <p className="font-medium">Analisi non riuscita</p>
          <p className="mt-1 max-w-prose text-muted">{error.message}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {!FINAL_ERRORS.has(error.code) && (
              <button
                type="button"
                onClick={onRetry}
                className="rounded-md bg-ink px-4 py-2 font-medium text-white transition-colors hover:bg-signal"
              >
                Riprova
              </button>
            )}
            <Link to="/" className="underline decoration-rule underline-offset-4 hover:decoration-ink">
              Cambia indirizzo
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const { result } = state
  return (
    <main>
      <PageHeading url={result.url} />

      <ColorSection title="Sfondi" colors={result.backgrounds} emptyText="Nessun elemento ha uno sfondo pieno." />
      <ColorSection title="Testo" colors={result.textColors} emptyText="Nessun testo visibile sulla pagina." />
      <ColorSection title="Bordi" colors={result.borderColors} emptyText="Nessun elemento ha un bordo visibile." />

      <p className="mt-16">
        <Link to="/" className="underline decoration-rule underline-offset-4 hover:decoration-ink">
          Analizza un altro sito
        </Link>
      </p>
    </main>
  )
}

function PageHeading({ url }: { url: string }) {
  return (
    <div className="pt-[6vh]">
      <h1 className="text-4xl font-semibold tracking-tight break-words sm:text-5xl">{hostOf(url)}</h1>
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-2 inline-block text-sm break-all text-muted underline decoration-rule underline-offset-4 hover:text-ink"
      >
        {url}
      </a>
    </div>
  )
}

function Loading() {
  const seconds = useElapsedSeconds()
  return (
    <div className="mt-12">
      <div aria-hidden className="h-16 rounded-md bg-rule motion-safe:animate-pulse" />
      <p role="status" className="mt-4 text-muted">
        Apro la pagina e leggo gli stili di ogni elemento.{' '}
        <span className="tabular-nums">{seconds} s</span>
      </p>
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
