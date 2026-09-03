import mammoth from 'mammoth'
import type { ParseResult, ParsedSlideDraft } from './types'

const HEADING_TAGS = new Set(['H1', 'H2', 'H3'])

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
      current = { heading: el.textContent?.trim() || undefined, paragraphs: [], bullets: [], images: [] }
      started = true
      continue
    }
    if (!started) started = true

    if (el.tagName === 'UL' || el.tagName === 'OL') {
      // Walk list items individually — el.textContent on the whole list runs
      // every item together with no separator, which is what made auto-fill
      // read as one jumbled block of text.
      for (const li of Array.from(el.querySelectorAll(':scope > li'))) {
        const text = li.textContent?.trim()
        if (text) current.bullets.push(text)
        await collectImages(li, current)
      }
      continue
    }

    if (el.tagName === 'TABLE') {
      // Same jumbling problem as lists, one level worse — el.textContent on
      // a <table> runs every cell in every row together with no separator
      // at all, e.g. two side-by-side cells "Skills" / "Evidence" reading
      // as "SkillsEvidence". One bullet per row (cells joined with " — ")
      // keeps a table's actual structure readable instead.
      for (const row of Array.from(el.querySelectorAll('tr'))) {
        const cells = Array.from(row.querySelectorAll('td, th'))
          .map((cell) => cell.textContent?.trim())
          .filter((text): text is string => !!text)
        if (cells.length) current.bullets.push(cells.join(' — '))
      }
      await collectImages(el, current)
      continue
    }

    const text = el.textContent?.trim()
    if (text) current.paragraphs.push(text)
    await collectImages(el, current)
  }
  if (started) slides.push(current)

  return {
    slides: slides.filter((s) => s.heading || s.paragraphs.length || s.bullets.length || s.images.length),
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
