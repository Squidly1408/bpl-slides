import { describe, expect, it } from 'vitest'
import { contrastText, darken, isValidHexColor, tint } from './color'

describe('darken', () => {
  it('leaves the colour unchanged at amount 0', () => {
    expect(darken('#2c4870', 0)).toBe('#2c4870')
  })

  it('mixes fully to black at amount 1', () => {
    expect(darken('#2c4870', 1)).toBe('#000000')
  })

  it('expands a 3-digit hex before mixing', () => {
    expect(darken('#fff', 1)).toBe('#000000')
  })
})

describe('tint', () => {
  it('leaves the colour unchanged at amount 0', () => {
    expect(tint('#2c4870', 0)).toBe('#2c4870')
  })

  it('mixes fully to white at amount 1', () => {
    expect(tint('#2c4870', 1)).toBe('#ffffff')
  })
})

describe('contrastText', () => {
  it('picks white text on a dark background', () => {
    expect(contrastText('#1c3050')).toBe('#ffffff')
  })

  it('picks dark text on a light background', () => {
    expect(contrastText('#f5f6f9')).toBe('#1c2230')
  })
})

describe('isValidHexColor', () => {
  it.each(['#fff', '#FFF', '#2c4870', '#ABCDEF'])('accepts %s', (value) => {
    expect(isValidHexColor(value)).toBe(true)
  })

  it.each(['2c4870', '#2c487', '#gggggg', '', '#12345g', 'red'])('rejects %s', (value) => {
    expect(isValidHexColor(value)).toBe(false)
  })
})
