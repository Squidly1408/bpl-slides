import type { ParseResult, ParsedSlideDraft } from './types'

const BULLET_LINE = /^[-*•‣◦]\s+/
const NUMBERED_LINE = /^(\d{1,2}|[a-zA-Z])[.)]\s+/

/**
 * Splits plain text / markdown into slide drafts on headings (markdown `#`
 * lines, or a short standalone line followed by a blank line). Bulleted /
 * numbered lines are kept as a separate bullet list rather than merged into
 * the surrounding paragraph text. Falls back to chunking every few
 * paragraphs if no headings are found.
 */
export async function parseText(file: File): Promise<ParseResult> {
  const raw = await file.text()
  const lines = raw.split(/\r?\n/)

  const slides: ParsedSlideDraft[] = []
  let current: ParsedSlideDraft | null = null
  let paraBuffer: string[] = []

  function flushParagraph() {
    const text = paraBuffer.join(' ').trim()
    paraBuffer = []
    if (text && current) current.paragraphs.push(text)
  }

  function startSlide(heading?: string) {
    flushParagraph()
    if (current) slides.push(current)
    current = { heading, paragraphs: [], bullets: [], images: [] }
  }

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,3})\s+(.*)/)
    if (headingMatch) {
      startSlide(headingMatch[2].trim())
      continue
    }
    if (line.trim() === '') {
      flushParagraph()
      continue
    }
    if (!current) startSlide(undefined)
    const trimmed = line.trim()
    if (BULLET_LINE.test(trimmed) || NUMBERED_LINE.test(trimmed)) {
      flushParagraph()
      current!.bullets.push(trimmed.replace(BULLET_LINE, '').replace(NUMBERED_LINE, ''))
    } else {
      paraBuffer.push(trimmed)
    }
  }
  flushParagraph()
  if (current) slides.push(current)

  // No headings found at all — chunk every 3 paragraphs into a slide instead.
  const hasHeadings = slides.some((s) => s.heading)
  if (!hasHeadings) {
    const allParagraphs = slides.flatMap((s) => s.paragraphs)
    const allBullets = slides.flatMap((s) => s.bullets)
    const chunked: ParsedSlideDraft[] = []
    for (let i = 0; i < allParagraphs.length; i += 3) {
      chunked.push({ paragraphs: allParagraphs.slice(i, i + 3), bullets: [], images: [] })
    }
    if (allBullets.length) chunked.push({ paragraphs: [], bullets: allBullets, images: [] })
    return { slides: chunked, warnings: [] }
  }

  return { slides: slides.filter((s) => s.heading || s.paragraphs.length || s.bullets.length), warnings: [] }
}
