import { beforeEach, describe, expect, it, vi } from 'vitest'
import { parseDocx } from './docx'

// mammoth itself is a well-tested third-party library — what actually needs
// covering here is parseDocx's own HTML-walking logic, so mammoth is mocked
// to return canned HTML rather than depending on real binary .docx fixtures.
// The HTML shapes below were captured by running mammoth's own test-data
// .docx files (tables.docx, embedded-style-map.docx) through
// mammoth.convertToHtml directly, so they reflect its real output shape.
//
// vi.mock factories run hoisted, above this file's own top-level statements
// — vi.hoisted is what makes `convertToHtml` safe to close over below.
const { convertToHtml } = vi.hoisted(() => ({ convertToHtml: vi.fn() }))
vi.mock('mammoth', () => ({
  default: {
    convertToHtml: (...args: unknown[]) => convertToHtml(...args),
    images: { imgElement: (fn: unknown) => fn },
  },
}))

function fileOf(name = 'notes.docx'): File {
  return new File(['irrelevant — mammoth is mocked'], name)
}

function mockHtml(html: string, messages: { type: string; message: string }[] = []) {
  convertToHtml.mockResolvedValue({ value: html, messages })
}

beforeEach(() => {
  convertToHtml.mockReset()
})

describe('parseDocx', () => {
  it('starts a new slide at each heading and collects paragraphs under it', async () => {
    mockHtml('<h1>Intro</h1><p>First point.</p><h1>Details</h1><p>Second point.</p>')
    const result = await parseDocx(fileOf())
    expect(result.slides).toHaveLength(2)
    expect(result.slides[0]).toMatchObject({ heading: 'Intro', paragraphs: ['First point.'] })
    expect(result.slides[1]).toMatchObject({ heading: 'Details', paragraphs: ['Second point.'] })
  })

  it('keeps list items as separate bullets, not run together', async () => {
    mockHtml('<h1>Heading</h1><ul><li>Apple</li><li>Banana</li></ul>')
    const result = await parseDocx(fileOf())
    expect(result.slides[0].bullets).toEqual(['Apple', 'Banana'])
  })

  it('turns a table into one bullet per row instead of jumbling every cell together', async () => {
    // Real mammoth.convertToHtml output for a 2x2 table (no cell/row
    // separators of its own) — el.textContent on the whole element used to
    // read as "Top leftTop rightBottom leftBottom right".
    mockHtml('<p>Above</p><table><tr><td><p>Top left</p></td><td><p>Top right</p></td></tr>' +
      '<tr><td><p>Bottom left</p></td><td><p>Bottom right</p></td></tr></table><p>Below</p>')
    const result = await parseDocx(fileOf())
    expect(result.slides[0].paragraphs).toEqual(['Above', 'Below'])
    expect(result.slides[0].bullets).toEqual(['Top left — Top right', 'Bottom left — Bottom right'])
  })

  it('skips empty cells within a row rather than leaving a stray separator', async () => {
    mockHtml('<table><tr><td><p>Skill</p></td><td><p></p></td></tr></table>')
    const result = await parseDocx(fileOf())
    expect(result.slides[0].bullets).toEqual(['Skill'])
  })

  it('passes a widened style map so Title/Subtitle-styled documents split into slides too', async () => {
    mockHtml('<h1>My Title</h1><p>Body.</p>')
    await parseDocx(fileOf())
    const options = convertToHtml.mock.calls[0][1]
    expect(options.styleMap).toEqual(
      expect.arrayContaining([expect.stringContaining('Title'), expect.stringContaining('Subtitle')]),
    )
  })

  it('surfaces mammoth warnings without failing the parse', async () => {
    mockHtml('<p>Body.</p>', [{ type: 'warning', message: 'Unrecognised style' }])
    const result = await parseDocx(fileOf())
    expect(result.warnings).toEqual(['Unrecognised style'])
  })

  it('drops a slide that ends up with no heading, text, bullets, or images', async () => {
    mockHtml('<h1>Real</h1><p>Content.</p><h1></h1>')
    const result = await parseDocx(fileOf())
    expect(result.slides).toHaveLength(1)
    expect(result.slides[0].heading).toBe('Real')
  })

  it('treats content before the first heading as its own (headingless) slide', async () => {
    mockHtml('<p>Preamble.</p><h1>First heading</h1><p>Body.</p>')
    const result = await parseDocx(fileOf())
    expect(result.slides).toHaveLength(2)
    expect(result.slides[0].heading).toBeUndefined()
    expect(result.slides[0].paragraphs).toEqual(['Preamble.'])
  })
})
