import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasSeenTutorial, markTutorialSeen } from './tutorial'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('hasSeenTutorial', () => {
  it('is false the first time, before anything is stored', () => {
    expect(hasSeenTutorial()).toBe(false)
  })

  it('is true after markTutorialSeen', () => {
    markTutorialSeen()
    expect(hasSeenTutorial()).toBe(true)
  })

  it('treats a garbage stored value as not seen', () => {
    localStorage.setItem('bpe-tutorial-seen', 'nonsense')
    expect(hasSeenTutorial()).toBe(false)
  })

  it('defaults to true (not shown) if localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(hasSeenTutorial()).toBe(true)
  })
})

describe('markTutorialSeen', () => {
  it('does not throw if localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => markTutorialSeen()).not.toThrow()
  })
})
