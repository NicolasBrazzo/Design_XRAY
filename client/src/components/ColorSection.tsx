import { useEffect, useId, useState } from 'react'
import type { ColorCount } from '../types.ts'

const percent = new Intl.NumberFormat('it-IT', { style: 'percent', maximumFractionDigits: 1 })
const integer = new Intl.NumberFormat('it-IT')

interface Props {
  title: string
  colors: ColorCount[]
  emptyText: string
}

export default function ColorSection({ title, colors, emptyText }: Props) {
  const headingId = useId()
  // Sum of the counts. For borders it can exceed the number of elements: an element whose sides
  // have different colors counts once per color. So the share is "of the occurrences".
  const total = colors.reduce((sum, color) => sum + color.count, 0)

  return (
    <section aria-labelledby={headingId} className="mt-14">
      <div className="flex items-baseline justify-between gap-4 border-b border-rule pb-3">
        <h2 id={headingId} className="text-xl font-semibold">
          {title}
        </h2>
        {colors.length > 0 && (
          <p className="text-sm text-muted tabular-nums">
            {colors.length} {colors.length === 1 ? 'colore' : 'colori'}
          </p>
        )}
      </div>

      {colors.length === 0 ? (
        <p className="mt-4 text-muted">{emptyText}</p>
      ) : (
        <>
          {/* Each color is as wide as its count: the palette at a glance. The list below says the same in words. */}
          <div aria-hidden className="mt-5 flex h-16 overflow-hidden rounded-md ring-1 ring-black/10">
            {colors.map((color) => (
              <div
                key={color.hex}
                title={color.hex}
                className="min-w-0.5 basis-0"
                style={{ flexGrow: color.count, backgroundColor: color.hex }}
              />
            ))}
          </div>

          <ul className="mt-3">
            {colors.map((color) => (
              <ColorRow key={color.hex} color={color} share={color.count / total} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

function ColorRow({ color, share }: { color: ColorCount; share: number }) {
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
    <li className="grid grid-cols-[2.5rem_1fr_auto_4rem] items-center gap-4 border-b border-rule/60 py-2.5">
      <span
        aria-hidden
        className="size-10 rounded ring-1 ring-black/10 ring-inset"
        style={{ backgroundColor: color.hex }}
      />
      <span className="flex items-baseline gap-3">
        <button
          type="button"
          onClick={copy}
          title="Copia"
          className="-mx-1 rounded px-1 font-mono text-sm hover:bg-white"
        >
          {color.hex}
        </button>
        <span aria-live="polite" className="text-xs text-signal">
          {copied ? 'Copiato' : ''}
        </span>
      </span>
      <span className="text-sm text-muted tabular-nums">
        {integer.format(color.count)}
        <span className="hidden sm:inline"> {color.count === 1 ? 'elemento' : 'elementi'}</span>
      </span>
      <span className="text-right text-sm tabular-nums">{percent.format(share)}</span>
    </li>
  )
}
