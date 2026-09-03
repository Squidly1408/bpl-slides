import { describe, expect, it } from 'vitest'
import { currentTermLabel } from './term'

describe('currentTermLabel', () => {
  it.each([
    [0, 'Term 1'], // Jan
    [1, 'Term 1'], // Feb
    [2, 'Term 1'], // Mar
    [3, 'Term 2'], // Apr
    [4, 'Term 2'], // May
    [5, 'Term 2'], // Jun
    [6, 'Term 3'], // Jul
    [7, 'Term 3'], // Aug
    [8, 'Term 3'], // Sep
    [9, 'Term 4'], // Oct
    [10, 'Term 4'], // Nov
    [11, 'Term 4'], // Dec
  ])('maps month index %i to %s', (month, expectedTerm) => {
    const date = new Date(2026, month, 15)
    expect(currentTermLabel(date)).toBe(`${expectedTerm} 2026`)
  })

  it('includes the year from the given date', () => {
    expect(currentTermLabel(new Date(2027, 0, 1))).toBe('Term 1 2027')
  })

  it('defaults to the current date when none is given', () => {
    const now = new Date()
    const expectedYear = now.getFullYear()
    expect(currentTermLabel()).toContain(String(expectedYear))
  })
})
