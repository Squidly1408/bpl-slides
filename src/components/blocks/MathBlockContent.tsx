import { useEffect, useState } from 'react'
import type { Block } from '../../types'

/**
 * Renders typed maths (LaTeX source) via KaTeX — fully offline, dynamically
 * imported (with its stylesheet) so the ~280KB library only loads for decks
 * that actually use a Math block. See MathBlockEditorModal for why this is
 * typed-only rather than photo OCR.
 */
export default function MathBlockContent({ block, scale = 1 }: { block: Extract<Block, { type: 'math' }>; scale?: number }) {
  const [html, setHtml] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    setFailed(false)
    if (!block.latex.trim()) return
    Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([katexMod]) => {
        if (cancelled) return
        try {
          setHtml(katexMod.default.renderToString(block.latex, { throwOnError: false, displayMode: true }))
        } catch {
          setFailed(true)
        }
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [block.latex])

  if (!block.latex.trim()) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs italic" style={{ color: 'var(--color-text-muted)' }}>
        Empty — edit this block to add a maths expression
      </div>
    )
  }
  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-xs" style={{ color: 'var(--color-danger)' }}>
        Couldn't render this expression
      </div>
    )
  }
  if (!html) return null

  return (
    <div
      className="flex h-full w-full items-center justify-center overflow-hidden"
      style={{ color: block.color, fontSize: block.fontSize * scale }}
      // KaTeX's own renderToString output — not arbitrary user HTML from
      // outside the app (the LaTeX source only ever comes from this
      // project's own editor), and KaTeX itself sanitises macro expansion.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
