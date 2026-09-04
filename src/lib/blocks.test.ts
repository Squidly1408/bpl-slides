import { describe, expect, it } from 'vitest'
import {
  cloneBlock,
  makeGridBlock,
  makeHeadingBlock,
  makeIconBlock,
  makeImageBlock,
  makeShapeBlock,
  makeSlide,
  makeTextBlock,
  seedZCounterFromSlides,
} from './blocks'

describe('makeTextBlock', () => {
  it('fills in sane defaults', () => {
    const block = makeTextBlock()
    expect(block.type).toBe('text')
    expect(block.content).toBe('New text')
    expect(block.isHeading).toBe(false)
    expect(typeof block.id).toBe('string')
  })

  it('lets a partial override any default', () => {
    const block = makeTextBlock({ content: 'Hello', fontSize: 12 })
    expect(block.content).toBe('Hello')
    expect(block.fontSize).toBe(12)
  })

  it('gives every new block a distinct id', () => {
    const a = makeTextBlock()
    const b = makeTextBlock()
    expect(a.id).not.toBe(b.id)
  })

  it('gives every new block a higher stacking order than the last', () => {
    const a = makeTextBlock()
    const b = makeTextBlock()
    expect(b.zIndex).toBeGreaterThan(a.zIndex)
  })
})

describe('makeHeadingBlock', () => {
  it('builds a bold, larger, heading-flagged text block', () => {
    const block = makeHeadingBlock('Title')
    expect(block.content).toBe('Title')
    expect(block.isHeading).toBe(true)
    expect(block.fontWeight).toBe('bold')
  })
})

describe('makeShapeBlock / makeIconBlock', () => {
  it('defaults a shape to full opacity and square corners', () => {
    const block = makeShapeBlock()
    expect(block.opacity).toBe(1)
    expect(block.radius).toBe(0)
  })

  it('carries the given icon name through', () => {
    const block = makeIconBlock('star')
    expect(block.iconName).toBe('star')
  })
})

describe('makeImageBlock', () => {
  it('carries the given asset id through', () => {
    const block = makeImageBlock('asset-1')
    expect(block.assetId).toBe('asset-1')
    expect(block.fit).toBe('contain')
  })
})

describe('makeSlide', () => {
  it('starts with no blocks and a fade transition', () => {
    const slide = makeSlide()
    expect(slide.blocks).toEqual([])
    expect(slide.transition).toBe('fade')
  })
})

describe('cloneBlock', () => {
  it('gives the copy a new id and a higher z-index', () => {
    const original = makeTextBlock()
    const copy = cloneBlock(original)
    expect(copy.id).not.toBe(original.id)
    expect(copy.zIndex).toBeGreaterThan(original.zIndex)
  })

  it('nudges the copy down and to the right so it is not a perfect overlap', () => {
    const original = makeTextBlock({ x: 10, y: 10, w: 20, h: 20 })
    const copy = cloneBlock(original)
    expect(copy.x).toBe(13)
    expect(copy.y).toBe(13)
  })

  it('clamps the nudge so the copy never runs off the slide', () => {
    // x=95, w=20 -> x+3=98, but 100-w=80, so it must clamp to 80
    const original = makeTextBlock({ x: 95, y: 95, w: 20, h: 20 })
    const copy = cloneBlock(original)
    expect(copy.x).toBe(80)
    expect(copy.y).toBe(80)
  })

  it('preserves every other field unchanged', () => {
    const original = makeTextBlock({ content: 'Keep me', color: '#123456' })
    const copy = cloneBlock(original)
    expect(copy.type).toBe('text')
    if (copy.type !== 'text') throw new Error('expected a text block')
    expect(copy.content).toBe('Keep me')
    expect(copy.color).toBe('#123456')
  })
})

describe('seedZCounterFromSlides', () => {
  it('makes the next new block land above every existing one in the project', () => {
    const slides = [
      makeSlide({ blocks: [makeTextBlock({ zIndex: 50 }), makeTextBlock({ zIndex: 80 })] }),
      makeSlide({ blocks: [makeTextBlock({ zIndex: 65 })] }),
    ]
    seedZCounterFromSlides(slides)
    const newBlock = makeTextBlock()
    expect(newBlock.zIndex).toBeGreaterThan(80)
  })

  it('never moves the counter backwards for a project with lower z-indices', () => {
    // Simulates opening a second, smaller project in the same session —
    // the counter should keep climbing, not reset down to match it (the
    // two projects' z-indices are never compared against each other, so
    // there's no correctness need to lower it, only a collision risk).
    seedZCounterFromSlides([makeSlide({ blocks: [makeTextBlock({ zIndex: 500 })] })])
    const before = makeTextBlock().zIndex
    seedZCounterFromSlides([makeSlide({ blocks: [makeTextBlock({ zIndex: 2 })] })])
    const after = makeTextBlock()
    expect(after.zIndex).toBeGreaterThan(before)
  })

  it('handles slides with no blocks at all', () => {
    expect(() => seedZCounterFromSlides([makeSlide()])).not.toThrow()
  })
})

describe('makeGridBlock', () => {
  it('carries the given cells through, with a header row by default', () => {
    const block = makeGridBlock([
      ['A', 'B'],
      ['1', '2'],
    ])
    expect(block.type).toBe('grid')
    expect(block.cells).toEqual([
      ['A', 'B'],
      ['1', '2'],
    ])
    expect(block.headerRow).toBe(true)
  })

  it('falls back to a blank 2x2 grid when given no cells', () => {
    const block = makeGridBlock([])
    expect(block.cells).toEqual([
      ['', ''],
      ['', ''],
    ])
  })

  it('lets a partial override headerRow and position', () => {
    const block = makeGridBlock([['x']], { headerRow: false, x: 0, y: 0 })
    expect(block.headerRow).toBe(false)
    expect(block.x).toBe(0)
  })
})
