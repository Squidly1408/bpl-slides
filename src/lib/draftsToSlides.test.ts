import { describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { draftsToSlides } from './draftsToSlides'
import { getAsset } from './db'
import type { ParseResult, ParsedSlideDraft } from './parsers/types'
import type { Block } from '../types'

function draft(partial: Partial<ParsedSlideDraft> = {}): ParsedSlideDraft {
  return { paragraphs: [], bullets: [], images: [], ...partial }
}

function result(slides: ParsedSlideDraft[]): ParseResult {
  return { slides, warnings: [] }
}

// draftsToSlides builds its heading as a plain bold TextBlock (not via
// makeHeadingBlock/isHeading — that factory is only used for the bare
// "heading, nothing else" case) — bold is what distinguishes it from the
// body bullet text, which is always regular weight.
function headingOf(blocks: Block[]) {
  return blocks.find((b) => b.type === 'text' && b.fontWeight === 'bold')
}
function bodyTextOf(blocks: Block[]) {
  return blocks.find((b) => b.type === 'text' && b.fontWeight !== 'bold')
}

describe('draftsToSlides', () => {
  it('turns paragraphs/bullets into one bulleted text block per slide, under a heading', async () => {
    const slides = await draftsToSlides(result([draft({ heading: 'Intro', bullets: ['One'], paragraphs: ['Two'] })]))
    expect(slides).toHaveLength(1)
    expect(headingOf(slides[0].blocks)).toMatchObject({ content: 'Intro' })
    expect(bodyTextOf(slides[0].blocks)).toMatchObject({ content: '•  One\n\n•  Two' })
  })

  it('paginates a long item list across multiple slides, numbering the heading', async () => {
    const items = Array.from({ length: 13 }, (_, i) => `Point ${i}`)
    const slides = await draftsToSlides(result([draft({ heading: 'Long', bullets: items })]))
    expect(slides).toHaveLength(3) // 6 + 6 + 1
    const headings = slides.map((s) => (headingOf(s.blocks) as { content: string }).content)
    expect(headings).toEqual(['Long (1/3)', 'Long (2/3)', 'Long (3/3)'])
  })

  it('a heading-only draft (no text, images, or grids) becomes a single heading slide', async () => {
    const slides = await draftsToSlides(result([draft({ heading: 'Just a title' })]))
    expect(slides).toHaveLength(1)
    expect(slides[0].blocks).toHaveLength(1)
    expect(slides[0].blocks[0]).toMatchObject({ type: 'text', content: 'Just a title' })
  })

  it('a completely empty draft with no heading either produces no slides', async () => {
    const slides = await draftsToSlides(result([draft()]))
    expect(slides).toEqual([])
  })

  it('stores images as assets and lays them out on the slide', async () => {
    const blob = new Blob(['fake-image-bytes'], { type: 'image/png' })
    const slides = await draftsToSlides(result([draft({ heading: 'Photo', images: [{ blob, mime: 'image/png', name: 'photo.png' }] })]))
    expect(slides).toHaveLength(1)
    const imageBlock = slides[0].blocks.find((b) => b.type === 'image')
    expect(imageBlock).toBeDefined()
    const stored = await getAsset((imageBlock as { assetId: string }).assetId)
    expect(stored?.name).toBe('photo.png')
  })

  it('gives a grid its own slide, separate from any text on the same draft', async () => {
    const grid = [
      ['Item', 'Cost'],
      ['Venue', '200'],
    ]
    const slides = await draftsToSlides(result([draft({ heading: 'Budget', bullets: ['Some notes'], grids: [grid] })]))
    expect(slides).toHaveLength(2)
    expect(bodyTextOf(slides[0].blocks)).toBeDefined()
    expect(slides[0].blocks.some((b) => b.type === 'grid')).toBe(false)
    const gridBlock = slides[1].blocks.find((b) => b.type === 'grid')
    expect(gridBlock).toMatchObject({ cells: grid, headerRow: true })
  })

  it('a grid-only draft (no text, no images) produces exactly one slide, not an extra empty one first', async () => {
    const grid = [['A', 'B']]
    const slides = await draftsToSlides(result([draft({ heading: 'Sheet1', grids: [grid] })]))
    expect(slides).toHaveLength(1)
    expect(slides[0].blocks.some((b) => b.type === 'grid')).toBe(true)
  })

  it('numbers multiple grids on the same draft', async () => {
    const slides = await draftsToSlides(result([draft({ heading: 'Data', grids: [[['a']], [['b']]] })]))
    expect(slides).toHaveLength(2)
    const headings = slides.map((s) => (headingOf(s.blocks) as { content: string }).content)
    expect(headings).toEqual(['Data (1/2)', 'Data (2/2)'])
  })

  it('a grid draft with no heading leaves the grid slide with no text block at all', async () => {
    const slides = await draftsToSlides(result([draft({ grids: [[['x']]] })]))
    expect(slides[0].blocks.some((b) => b.type === 'text')).toBe(false)
  })
})
