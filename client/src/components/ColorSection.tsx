import { useEffect, useId, useState } from 'react'
import type { ColorCount } from '../types.ts'

const percent = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('en-US')

interface Props {
  title: string
  colors: ColorCount[]
  /** What one count is, singular: "element", "border"... */
  unit: string
  emptyText: string
}

export default function ColorSection({ title, colors, unit, emptyText }: Props) {
  const headingId = useId()
  // Sum of the counts. For borders it can exceed the number of elements: an element whose sides
  // have different colors counts once per color. So the share is "of the occurrences".
  const total = colors.reduce((sum, color) => sum + color.count, 0)

  return (
    <section aria-labelledby={headingId} className="mt-16">
      <div className="flex items-baseline justify-between gap-4 border-b border-ink pb-3">
        <h2 id={headingId} className="text-2xl font-bold tracking-tight">
          {title}
        </h2>
        {colors.length > 0 && (
          <p className="text-sm text-muted tabular-nums">
            {colors.length} {colors.length === 1 ? 'color' : 'colors'}
          </p>
        )}
      </div>

      {colors.length === 0 ? (
        <p className="mt-5 text-muted">{emptyText}</p>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 lg:grid-cols-6">
          {colors.map((color) => (
            <Swatch key={color.hex} color={color} share={color.count / total} unit={unit} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Swatch({ color, share, unit }: { color: ColorCount; share: number; unit: string }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const id = setTimeout(() => setCopied(false), 1500)
    return () => clearTimeout(id)
  }, [copied])

  async function copy() {
    try {
      await navigator.clipboard.writeText(color.hex)
      setCopied(true)
    } catch {
      // Clipboard not available (e.g. page not focused): nothing to do.
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={copy}
        aria-label={`Copy ${color.hex}`}
        className="group block w-full text-left"
      >
        <span
          aria-hidden
          className="block aspect-[4/3] rounded-md ring-1 ring-black/10 ring-inset transition-transform group-active:scale-[0.98]"
          style={{ backgroundColor: color.hex }}
        />
        <span className="mt-2 flex items-baseline justify-between gap-2">
          <span className="font-mono text-sm group-hover:underline group-hover:underline-offset-4">
            {copied ? 'Copied' : color.hex}
          </span>
          <span className="text-sm tabular-nums">{percent.format(share)}</span>
        </span>
      </button>
      <p className="text-sm text-muted tabular-nums">
        {integer.format(color.count)} {color.count === 1 ? unit : `${unit}s`}
      </p>
      <span aria-live="polite" className="sr-only">
        {copied ? `${color.hex} copied` : ''}
      </span>
    </li>
  )
}
