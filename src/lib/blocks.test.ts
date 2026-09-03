import { describe, expect, it } from 'vitest'
import {
  cloneBlock,
  makeHeadingBlock,
  makeIconBlock,
  makeImageBlock,
  makeShapeBlock,
  makeSlide,
  makeTextBlock,
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
