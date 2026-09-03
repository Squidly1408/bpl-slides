import { afterEach, describe, expect, it, vi } from 'vitest'
import { hasSeenTutorial, markTutorialSeen, onRequestTutorial, requestTutorial } from './tutorial'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('hasSeenTutorial', () => {
  it('is false the first time, before anything is stored', () => {
    expect(hasSeenTutorial('dashboard')).toBe(false)
  })

  it('is true after markTutorialSeen for that same tour id', () => {
    markTutorialSeen('dashboard')
    expect(hasSeenTutorial('dashboard')).toBe(true)
  })

  it('tracks each tour id independently', () => {
    markTutorialSeen('dashboard')
    expect(hasSeenTutorial('dashboard')).toBe(true)
    expect(hasSeenTutorial('editor')).toBe(false)
  })

  it('treats a garbage stored value as not seen', () => {
    localStorage.setItem('bpe-tutorial-seen-dashboard', 'nonsense')
    expect(hasSeenTutorial('dashboard')).toBe(false)
  })

  it('defaults to true (not shown) if localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(hasSeenTutorial('dashboard')).toBe(true)
  })
})

describe('markTutorialSeen', () => {
  it('does not throw if localStorage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => markTutorialSeen('dashboard')).not.toThrow()
  })
})

describe('onRequestTutorial / requestTutorial', () => {
  // The listener list lives in module scope (shared across this file's
  // tests), so every test unsubscribes its own listener(s) before
  // finishing — otherwise a later test's requestTutorial() would also
  // silently re-fire earlier tests' mocks.
  it('notifies a subscribed listener when a tour is requested', () => {
    const listener = vi.fn()
    const unsubscribe = onRequestTutorial(listener)
    requestTutorial()
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('notifies every currently-subscribed listener', () => {
    const a = vi.fn()
    const b = vi.fn()
    const unsubscribeA = onRequestTutorial(a)
    const unsubscribeB = onRequestTutorial(b)
    requestTutorial()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    unsubscribeA()
    unsubscribeB()
  })

  it('stops notifying a listener once unsubscribed', () => {
    const listener = vi.fn()
    const unsubscribe = onRequestTutorial(listener)
    unsubscribe()
    requestTutorial()
    expect(listener).not.toHaveBeenCalled()
  })

  it('is a no-op when nothing is subscribed', () => {
    expect(() => requestTutorial()).not.toThrow()
  })
})
