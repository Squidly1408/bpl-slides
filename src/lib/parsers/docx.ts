import mammoth from 'mammoth'
import type { ParseResult, ParsedSlideDraft } from './types'

const HEADING_TAGS = new Set(['H1', 'H2', 'H3'])

/**
 * Like `el.textContent.trim()`, except a manual line break (Shift+Enter in
 * Word — mammoth renders it as a bare `<br>`, with no text node of its own)
 * becomes a space instead of vanishing outright. Plain `.textContent`
 * silently drops a `<br>` and everything before/after it ends up jammed
 * together with zero separation — "…solar panels.Second line…" instead of
 * "…solar panels. Second line…" — for what's an extremely common piece of
 * formatting in a student's own writing, not an edge case.
 */
function textWithBreaks(el: Element): string {
  let out = ''
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element
      out += child.tagName === 'BR' ? ' ' : textWithBreaks(child)
    }
  }
  return out
}

/**
 * Heuristically splits a .docx file into slide drafts: each top-level
 * heading starts a new slide, paragraphs and images that follow it are
 * attached to that slide. Runs entirely client-side via mammoth.js.
 */
export async function parseDocx(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const warnings: string[] = []
  const { value: html, messages } = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      // Mammoth's own defaults already cover "Heading 1/2/3" (what Word's
      // built-in heading styles are named, and what Google Docs' .docx
      // export uses too); these two catch the other paragraph styles
      // students' documents commonly title their document/sections with,
      // which otherwise fell through as an ordinary paragraph and never
      // started a new slide.
      styleMap: ["p[style-name='Title'] => h1:fresh", "p[style-name='Subtitle'] => h2:fresh"],
      convertImage: mammoth.images.imgElement(async (image) => {
        const base64 = await image.read('base64')
        return { src: `data:${image.contentType};base64,${base64}` }
      }),
    },
  )
  for (const m of messages) if (m.type === 'warning') warnings.push(m.message)

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const slides: ParsedSlideDraft[] = []
  let current: ParsedSlideDraft = { paragraphs: [], bullets: [], images: [] }
  let started = false

  async function collectImages(el: Element, into: ParsedSlideDraft) {
    const imgs = el.tagName === 'IMG' ? [el as HTMLImageElement] : Array.from(el.querySelectorAll('img'))
    for (const img of imgs) {
      const blob = await dataUriToBlob(img.getAttribute('src') || '')
      if (blob) into.images.push({ blob, mime: blob.type, name: 'image' })
    }
  }

  for (const el of Array.from(doc.body.children)) {
    if (HEADING_TAGS.has(el.tagName)) {
      if (started) slides.push(current)
      current = { heading: textWithBreaks(el).trim() || undefined, paragraphs: [], bullets: [], images: [] }
      started = true
      continue
    }
    if (!started) started = true

    if (el.tagName === 'UL' || el.tagName === 'OL') {
      // Walk list items individually — el.textContent on the whole list runs
      // every item together with no separator, which is what made auto-fill
      // read as one jumbled block of text.
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const text = textWithBreaks(li).trim()
        if (text) current.bullets.push(text)
        await collectImages(li, current)
      }
      continue
    }

    if (el.tagName === 'TABLE') {
      // A real grid block (same as a spreadsheet's rows — see
      // lib/parsers/xlsx.ts) rather than flattening rows into bullet text:
      // still keeps its actual row/column structure once it's on the slide,
      // instead of "Item — Cost" reading like a plain list.
      const rows = Array.from(el.querySelectorAll('tr')).map((row) =>
        Array.from(row.querySelectorAll('td, th')).map((cell) => textWithBreaks(cell).trim()),
      )
      const width = Math.max(0, ...rows.map((r) => r.length))
      const grid = rows
        .filter((r) => r.some((cell) => cell))
        .map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ''))
      if (grid.length) current.grids = [...(current.grids ?? []), grid]
      await collectImages(el, current)
      continue
    }

    const text = textWithBreaks(el).trim()
    if (text) current.paragraphs.push(text)
    await collectImages(el, current)
  }
  if (started) slides.push(current)

  return {
    slides: slides.filter((s) => s.heading || s.paragraphs.length || s.bullets.length || s.images.length || s.grids?.length),
    warnings,
  }
}

async function dataUriToBlob(uri: string): Promise<Blob | null> {
  if (!uri.startsWith('data:')) return null
  try {
    const res = await fetch(uri)
    return await res.blob()
  } catch {
    return null
  }
}
