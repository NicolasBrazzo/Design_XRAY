import { useState, type SubmitEvent } from 'react'
import { useNavigate } from 'react-router-dom'

// Three very different sites: CSS variables, a React app, a classic hand-made site.
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
      setError('Enter the address of a web page, like python.org or https://python.org')
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
    <main className="pt-[12vh]">
      <h1 className="max-w-3xl text-5xl leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-7xl">
        What colors is this website made of?
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
        Paste the address of a public page. Design XRAY opens it in a real browser and counts the
        background, text and border colors of every visible element.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-14 max-w-3xl">
        <label htmlFor="url" className="sr-only">
          Page address
        </label>
        <div className="flex items-center gap-3 rounded-lg bg-paper p-2 ring-1 ring-rule transition-shadow focus-within:ring-2 focus-within:ring-ink">
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
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-xl placeholder:text-muted/50 focus:outline-none sm:text-2xl"
          />
          <button
            type="submit"
            className="shrink-0 rounded-md bg-ink px-5 py-3 font-semibold text-paper transition-opacity hover:opacity-85"
          >
            Analyze
          </button>
        </div>
        {error && (
          <p id="url-error" className="mt-3 text-sm text-alarm">
            {error}
          </p>
        )}
      </form>

      <p className="mt-6 text-muted">
        Or try{' '}
        {EXAMPLES.map((example, i) => (
          <span key={example}>
            {i > 0 && (i === EXAMPLES.length - 1 ? ' or ' : ', ')}
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
