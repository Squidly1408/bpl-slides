import JSZip from 'jszip'
import type { ParseResult, ParsedSlideDraft } from './types'

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  bmp: 'image/bmp',
  webp: 'image/webp',
  svg: 'image/svg+xml',
}

function resolveRelPath(base: string, target: string): string {
  const baseParts = base.split('/').slice(0, -1)
  const targetParts = target.split('/')
  for (const part of targetParts) {
    if (part === '..') baseParts.pop()
    else if (part === '.') continue
    else baseParts.push(part)
  }
  return baseParts.join('/')
}

/**
 * Best-effort .pptx reader: pulls the text and images out of each slide and
 * turns them into slide drafts. Original PowerPoint layout, positioning, and
 * animations are not preserved — this is meant as a starting point students
 * then edit, not a faithful re-render.
 */
export async function parsePptx(file: File): Promise<ParseResult> {
  const zip = await JSZip.loadAsync(file)
  const warnings: string[] = []

  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/)?.[1] ?? 0)
      const nb = Number(b.match(/slide(\d+)\.xml/)?.[1] ?? 0)
      return na - nb
    })

  if (slideFiles.length === 0) {
    return { slides: [], warnings: ['No slides were found in this PowerPoint file.'] }
  }

  const slides: ParsedSlideDraft[] = []

  for (const slidePath of slideFiles) {
    const xmlText = await zip.file(slidePath)!.async('string')
    const xml = new DOMParser().parseFromString(xmlText, 'application/xml')

    const paragraphs: string[] = []
    const bullets: string[] = []
    for (const p of Array.from(xml.getElementsByTagName('a:p'))) {
      const runs = Array.from(p.getElementsByTagName('a:t'))
        .map((t) => t.textContent || '')
        .join('')
        .trim()
      if (!runs) continue
      const pPr = p.getElementsByTagName('a:pPr')[0]
      const isBullet = !!pPr && (pPr.getElementsByTagName('a:buChar').length > 0 || pPr.getElementsByTagName('a:buAutoNum').length > 0)
      if (isBullet) bullets.push(runs)
      else paragraphs.push(runs)
    }

    const images: ParsedSlideDraft['images'] = []
    const relsPath = slidePath.replace('slides/', 'slides/_rels/') + '.rels'
    const relsFile = zip.file(relsPath)
    if (relsFile) {
      const relsXml = new DOMParser().parseFromString(await relsFile.async('string'), 'application/xml')
      for (const rel of Array.from(relsXml.getElementsByTagName('Relationship'))) {
        const type = rel.getAttribute('Type') || ''
        const target = rel.getAttribute('Target') || ''
        if (!type.endsWith('/image')) continue
        const mediaPath = resolveRelPath(slidePath, target)
        const mediaFile = zip.file(mediaPath)
        if (!mediaFile) continue
        const ext = mediaPath.split('.').pop()?.toLowerCase() || ''
        const mime = MIME_BY_EXT[ext]
        if (!mime) continue // skip formats we can't reliably preview (e.g. emf/wmf)
        const blob = await mediaFile.async('blob')
        images.push({ blob: blob.slice(0, blob.size, mime), mime, name: mediaPath.split('/').pop() || 'image' })
      }
    }

    slides.push({
      heading: paragraphs[0],
      paragraphs: paragraphs.slice(1),
      bullets,
      images,
    })
  }

  return { slides, warnings }
}
