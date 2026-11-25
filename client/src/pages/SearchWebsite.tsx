import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'

// The sites studied in M0 (docs/archivio/lab/).
const EXAMPLES = ['python.org', 'bsky.app', 'ui.shadcn.com']

/** "python.org" → "https://python.org/". Returns null if the input is not an http(s) address. */
function toUrl(input: string): string | null {
  const trimmed = input.trim()
  if (trimmed === '') return null

  const hasProtocol = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
  try {
    const url = new URL(hasProtocol ? trimmed : `https://${trimmed}`)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    return url.href
  } catch {
    return null
  }
}

export default function SearchWebsite() {
  const navigate = useNavigate()
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  function analyze(value: string) {
    const url = toUrl(value)
    if (url === null) {
      setError("Scrivi l'indirizzo di una pagina, come python.org o https://python.org")
      return
    }
    // The URL goes in the query string: the results page can be reloaded and shared.
    navigate(`/results?url=${encodeURIComponent(url)}`)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    analyze(input)
  }

  return (
    <main className="pt-[10vh]">
      <h1 className="max-w-xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
        Quali colori usa questo sito?
      </h1>
      <p className="mt-4 max-w-lg text-lg leading-relaxed text-muted">
        Incolla l'indirizzo di una pagina pubblica. La apro in un browser e conto i colori di
        sfondi, testi e bordi di ogni elemento visibile.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-12">
        <label htmlFor="url" className="sr-only">
          Indirizzo della pagina
        </label>
        <div className="flex items-center gap-4 border-b-2 border-ink transition-colors focus-within:border-signal">
          <input
            id="url"
            type="text"
            inputMode="url"
            autoComplete="url"
            autoCapitalize="none"
            spellCheck={false}
            autoFocus
            placeholder="python.org"
            value={input}
            onChange={(event) => {
              setInput(event.target.value)
              setError(null)
            }}
            aria-invalid={error !== null}
            aria-describedby={error ? 'url-error' : undefined}
            className="min-w-0 flex-1 bg-transparent py-3 text-2xl placeholder:text-muted/40 focus:outline-none sm:text-3xl"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-ink px-5 py-2.5 font-medium text-white transition-colors hover:bg-signal"
          >
            Analizza
          </button>
        </div>
        {error && (
          <p id="url-error" className="mt-3 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>

      <p className="mt-8 text-muted">
        Prova con{' '}
        {EXAMPLES.map((example, i) => (
          <span key={example}>
            {i > 0 && (i === EXAMPLES.length - 1 ? ' o ' : ', ')}
            <button
              type="button"
              onClick={() => analyze(example)}
              className="text-ink underline decoration-rule underline-offset-4 hover:decoration-ink"
            >
              {example}
            </button>
          </span>
        ))}
        .
      </p>
    </main>
  )
}
