import { describe, expect, it } from 'vitest'
import { parseText } from './text'

function fileOf(content: string, name = 'notes.txt'): File {
  return new File([content], name, { type: 'text/plain' })
}

describe('parseText', () => {
  it('splits on markdown headings and keeps paragraphs under each', async () => {
    const result = await parseText(fileOf('# First\nHello there.\n\n# Second\nMore text.'))
    expect(result.slides).toHaveLength(2)
    expect(result.slides[0].heading).toBe('First')
    expect(result.slides[0].paragraphs).toEqual(['Hello there.'])
    expect(result.slides[1].heading).toBe('Second')
    expect(result.slides[1].paragraphs).toEqual(['More text.'])
  })

  it('joins wrapped lines within one blank-line-delimited paragraph', async () => {
    const result = await parseText(fileOf('# Heading\nLine one\nline two continues.\n'))
    expect(result.slides[0].paragraphs).toEqual(['Line one line two continues.'])
  })

  it('keeps bulleted lines as bullets, not merged into the paragraph', async () => {
    const result = await parseText(
      fileOf('# Heading\nIntro paragraph.\n\n- First point\n* Second point\n• Third point\n'),
    )
    const slide = result.slides[0]
    expect(slide.paragraphs).toEqual(['Intro paragraph.'])
    expect(slide.bullets).toEqual(['First point', 'Second point', 'Third point'])
  })

  it('strips numbered-list markers too', async () => {
    const result = await parseText(fileOf('# Heading\n1. One\n2) Two\na. Three\n'))
    expect(result.slides[0].bullets).toEqual(['One', 'Two', 'Three'])
  })

  it('does not swallow a bullet as part of the preceding paragraph', async () => {
    // Regression guard for the "bullet-extraction" merge bug: a bullet
    // immediately after prose text must not get appended onto that
    // paragraph's buffered text.
    const result = await parseText(fileOf('# Heading\nSome intro text\n- a bullet right after\n'))
    const slide = result.slides[0]
    expect(slide.paragraphs).toEqual(['Some intro text'])
    expect(slide.bullets).toEqual(['a bullet right after'])
  })

  it('falls back to chunking every 3 paragraphs when there are no headings', async () => {
    const result = await parseText(fileOf('Para one.\n\nPara two.\n\nPara three.\n\nPara four.'))
    expect(result.slides).toHaveLength(2)
    expect(result.slides[0].paragraphs).toEqual(['Para one.', 'Para two.', 'Para three.'])
    expect(result.slides[1].paragraphs).toEqual(['Para four.'])
  })

  it('collects headingless bullets into their own trailing slide when chunking', async () => {
    const result = await parseText(fileOf('Para one.\n\n- loose bullet'))
    const last = result.slides[result.slides.length - 1]
    expect(last.bullets).toEqual(['loose bullet'])
  })

  it('drops entirely empty slides produced by consecutive headings', async () => {
    const result = await parseText(fileOf('# Empty\n# Second\nContent.'))
    expect(result.slides.every((s) => s.heading || s.paragraphs.length || s.bullets.length)).toBe(true)
  })
})
