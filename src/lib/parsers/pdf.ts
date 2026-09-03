import pdfjsLib from '../pdfjs'
import type { ParseResult, ParsedSlideDraft } from './types'

const MAX_PAGES = 40

const BULLET_LINE = /^[•‣◦∙·*-]\s+/
const NUMBERED_LINE = /^(\d{1,2}|[a-zA-Z])[.)]\s+/

interface PositionedItem {
  str: string
  x: number
  y: number
}

/** Groups raw PDF text items into reading-order lines. PDF text items come
 * back in content-stream order, which for multi-column pages or text boxes
 * is often *not* the visual reading order — joining them naively is what
 * used to produce jumbled auto-fill text. */
function toLines(items: PositionedItem[]): string[] {
  if (items.length === 0) return []
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x)

  const lines: PositionedItem[][] = []
  const yTolerance = 3
  for (const item of sorted) {
    const line = lines.find((l) => Math.abs(l[0].y - item.y) <= yTolerance)
    if (line) line.push(item)
    else lines.push([item])
  }
  // lines were collected in y-descending discovery order already since we
  // iterate `sorted` top-to-bottom, but guard explicitly in case of ties.
  lines.sort((a, b) => b[0].y - a[0].y)

  return lines.map((line) =>
    line
      .sort((a, b) => a.x - b.x)
      .map((i) => i.str)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim(),
  ).filter(Boolean)
}

function linesToDraftFields(lines: string[]): { paragraphs: string[]; bullets: string[] } {
  const paragraphs: string[] = []
  const bullets: string[] = []
  let paragraphBuffer: string[] = []

  function flush() {
    if (paragraphBuffer.length) paragraphs.push(paragraphBuffer.join(' '))
    paragraphBuffer = []
  }

  for (const line of lines) {
    if (BULLET_LINE.test(line) || NUMBERED_LINE.test(line)) {
      flush()
      bullets.push(line.replace(BULLET_LINE, '').replace(NUMBERED_LINE, ''))
    } else {
      paragraphBuffer.push(line)
    }
  }
  flush()
  return { paragraphs, bullets }
}

/**
 * Turns each page of a PDF into a slide draft: the page's text (reconstructed
 * into reading order, with bullet/numbered lines kept separate), plus a
 * rendered snapshot of the page (useful for diagrams/scanned work that has
 * no extractable text).
 */
export async function parsePdf(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const warnings: string[] = []
  const slides: ParsedSlideDraft[] = []

  const pageCount = Math.min(pdf.numPages, MAX_PAGES)
  if (pdf.numPages > MAX_PAGES) {
    warnings.push(`This PDF has ${pdf.numPages} pages — only the first ${MAX_PAGES} were imported.`)
  }

  for (let i = 1; i <= pageCount; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const items: PositionedItem[] = textContent.items
      .filter((item): item is typeof item & { str: string; transform: number[] } => 'str' in item && !!item.str.trim())
      .map((item) => ({ str: item.str, x: item.transform[4], y: item.transform[5] }))
    const { paragraphs, bullets } = linesToDraftFields(toLines(items))

    const viewport = page.getViewport({ scale: 1.5 })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    const images: ParsedSlideDraft['images'] = []
    if (ctx) {
      await page.render({ canvasContext: ctx, viewport }).promise
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (blob) images.push({ blob, mime: 'image/png', name: `page-${i}.png` })
    }

    slides.push({
      heading: `Page ${i}`,
      paragraphs,
      bullets,
      images,
    })
  }

  return { slides, warnings }
}
