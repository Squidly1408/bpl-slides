import { useEffect, useRef, useState } from 'react'
import { useAssetUrl } from '../../lib/hooks'
import { IconChevronLeft, IconChevronRight } from '../icons'
import type { Block } from '../../types'

type FileBlockProps = { block: Extract<Block, { type: 'file' }>; interactive: boolean; onPageChange?: (page: number) => void }

/** Live preview of an uploaded PDF or Word document — rendered pages / formatted
 * text, not just a download link. Loads pdfjs/mammoth lazily so these fairly
 * large libraries don't bloat the slide canvas's main bundle for decks that
 * never use a file block. */
export default function FileBlockContent({ block, interactive, onPageChange }: FileBlockProps) {
  return block.fileKind === 'pdf' ? (
    <PdfFileContent block={block} interactive={interactive} onPageChange={onPageChange} />
  ) : (
    <DocxFileContent block={block} />
  )
}

function PdfFileContent({ block, interactive, onPageChange }: FileBlockProps) {
  const url = useAssetUrl(block.assetId)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const docRef = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [page, setPage] = useState(Math.max(1, block.page || 1))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    import('../../lib/pdfjs').then(async ({ default: pdfjsLib }) => {
      try {
        const doc = await pdfjsLib.getDocument(url).promise
        if (cancelled) return
        docRef.current = doc
        setPageCount(doc.numPages)
      } catch {
        if (!cancelled) setError('Could not load this PDF.')
      }
    })
    return () => {
      cancelled = true
    }
  }, [url])

  useEffect(() => {
    const doc = docRef.current
    const canvas = canvasRef.current
    if (!doc || !canvas || !pageCount) return
    let cancelled = false
    const clamped = Math.min(Math.max(page, 1), pageCount)
    doc.getPage(clamped).then(async (p) => {
      if (cancelled) return
      const viewport = p.getViewport({ scale: 2 })
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (ctx) await p.render({ canvasContext: ctx, viewport }).promise
    })
    return () => {
      cancelled = true
    }
  }, [page, pageCount])

  function go(delta: number) {
    if (!pageCount) return
    const next = Math.min(Math.max(page + delta, 1), pageCount)
    setPage(next)
    onPageChange?.(next)
  }

  if (error) return <Placeholder label={error} />
  if (!url || !pageCount) return <Placeholder label="Loading PDF…" />

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg" style={{ background: '#3a3a3a' }}>
      <div className="min-h-0 flex-1 overflow-auto p-2">
        <canvas ref={canvasRef} className="mx-auto h-auto max-w-full bg-white shadow" />
      </div>
      {interactive && pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 border-t border-white/10 bg-black/40 py-1 text-xs text-white">
          <button onClick={() => go(-1)} disabled={page <= 1} className="flex items-center disabled:opacity-30" aria-label="Previous page">
            <IconChevronLeft size={14} />
          </button>
          <span>
            Page {page} / {pageCount}
          </span>
          <button onClick={() => go(1)} disabled={page >= pageCount} className="flex items-center disabled:opacity-30" aria-label="Next page">
            <IconChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

function DocxFileContent({ block }: { block: Extract<Block, { type: 'file' }> }) {
  const url = useAssetUrl(block.assetId)
  const [html, setHtml] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!url) return
    let cancelled = false
    Promise.all([import('mammoth'), fetch(url).then((r) => r.arrayBuffer())])
      .then(([mammoth, arrayBuffer]) => mammoth.convertToHtml({ arrayBuffer }))
      .then((result) => {
        if (!cancelled) setHtml(result.value)
      })
      .catch(() => {
        if (!cancelled) setError('Could not preview this document.')
      })
    return () => {
      cancelled = true
    }
  }, [url])

  if (error) return <Placeholder label={error} />
  if (!html) return <Placeholder label="Loading document…" />

  return (
    <div
      className="doc-preview h-full w-full overflow-y-auto rounded-lg bg-white p-4 text-left text-sm"
      style={{ color: '#211f1a' }}
      // eslint-disable-next-line react/no-danger -- our own mammoth output from a file the student uploaded, not third-party HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

function Placeholder({ label }: { label: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-lg text-xs"
      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
    >
      {label}
    </div>
  )
}
