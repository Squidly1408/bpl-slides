import { describe, expect, it } from 'vitest'
import { createId } from './id'

describe('createId', () => {
  it('returns a well-formed UUID v4', () => {
    expect(createId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
  })

  it('never repeats across calls', () => {
    const ids = new Set(Array.from({ length: 200 }, () => createId()))
    expect(ids.size).toBe(200)
  })
})
