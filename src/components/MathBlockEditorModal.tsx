import { useEffect, useState } from 'react'
import Modal from './Modal'

const EXAMPLES = ['x^2 + y^2 = r^2', '\\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}', '\\int_0^\\infty e^{-x^2}\\,dx', '\\sum_{i=1}^n i = \\frac{n(n+1)}{2}']

/**
 * Add-math flow: type a LaTeX expression (rendered live, fully offline via
 * KaTeX) — or attach a photo of handwritten maths as a plain image instead.
 *
 * There's no "digitise this photo" option here on purpose: real
 * handwriting-to-LaTeX needs a cloud OCR service (e.g. Mathpix), and this
 * app's whole design — and its Privacy Policy — is built on nothing ever
 * leaving the browser. A typed box that actually renders real maths
 * notation, plus an honestly-labelled plain photo attachment, delivers what
 * was asked for without quietly breaking that promise.
 */
export default function MathBlockEditorModal({
  onCreateMath,
  onCreatePhoto,
  onClose,
}: {
  onCreateMath: (latex: string) => void
  onCreatePhoto: (file: File) => void
  onClose: () => void
}) {
  const [tab, setTab] = useState<'type' | 'photo'>('type')
  const [latex, setLatex] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!latex.trim()) {
      setPreview(null)
      setError(null)
      return
    }
    Promise.all([import('katex'), import('katex/dist/katex.min.css')])
      .then(([katexMod]) => {
        if (cancelled) return
        try {
          setPreview(katexMod.default.renderToString(latex, { throwOnError: true, displayMode: true }))
          setError(null)
        } catch (e) {
          setPreview(null)
          setError(e instanceof Error ? e.message : 'Could not parse this expression.')
        }
      })
      .catch(() => {
        if (!cancelled) setError('Could not load the maths renderer.')
      })
    return () => {
      cancelled = true
    }
  }, [latex])

  return (
    <Modal title="Add maths" onClose={onClose} width={560}>
      <div className="mb-4 flex gap-1.5 rounded-lg border p-1" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setTab('type')}
          className="flex-1 rounded-md py-1.5 text-sm font-medium"
          style={{ background: tab === 'type' ? 'var(--color-primary)' : 'transparent', color: tab === 'type' ? '#fff' : 'inherit' }}
        >
          Type an expression
        </button>
        <button
          onClick={() => setTab('photo')}
          className="flex-1 rounded-md py-1.5 text-sm font-medium"
          style={{ background: tab === 'photo' ? 'var(--color-primary)' : 'transparent', color: tab === 'photo' ? '#fff' : 'inherit' }}
        >
          Photo of maths
        </button>
      </div>

      {tab === 'type' ? (
        <>
          <textarea
            autoFocus
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="e.g. \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
            rows={3}
            className="mb-2 w-full rounded-lg border px-3 py-2 font-mono text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <div className="mb-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setLatex(ex)}
                className="rounded-md border px-2 py-1 font-mono text-[11px]"
                style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
              >
                {ex}
              </button>
            ))}
          </div>
          <div
            className="mb-4 flex min-h-[72px] items-center justify-center overflow-x-auto rounded-lg border p-4"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}
          >
            {error ? (
              <span className="text-xs" style={{ color: 'var(--color-danger)' }}>
                {error}
              </span>
            ) : preview ? (
              <div dangerouslySetInnerHTML={{ __html: preview }} />
            ) : (
              <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                Type LaTeX above — standard notation (^, _, \frac, \sqrt, \sum, \int, Greek letters like \alpha) all work.
              </span>
            )}
          </div>
          <button
            onClick={() => latex.trim() && onCreateMath(latex.trim())}
            disabled={!latex.trim() || !!error}
            className="w-full rounded-lg py-2 text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: 'var(--color-primary)' }}
          >
            Add to slide
          </button>
        </>
      ) : (
        <>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            This adds your photo as-is — it isn't converted to editable/typed maths. Turning a photo of handwriting
            into real digital maths needs a cloud OCR service, and this app keeps everything on your device, so that
            conversion isn't available here. Use "Type an expression" instead if you want an editable, live-rendered
            equation.
          </p>
          <label
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            + Take or upload a photo
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) onCreatePhoto(file)
              }}
            />
          </label>
        </>
      )}
    </Modal>
  )
}
