import { afterEach, describe, expect, it, vi } from 'vitest'
import { applyThemeAttribute, effectiveTheme, getStoredThemePreference, setStoredThemePreference } from './theme'

afterEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
  vi.restoreAllMocks()
})

describe('getStoredThemePreference', () => {
  it('defaults to system when nothing is stored', () => {
    expect(getStoredThemePreference()).toBe('system')
  })

  it('reads back an explicit light/dark preference', () => {
    localStorage.setItem('bpe-theme', 'dark')
    expect(getStoredThemePreference()).toBe('dark')
  })

  it('falls back to system for a garbage stored value', () => {
    localStorage.setItem('bpe-theme', 'nonsense')
    expect(getStoredThemePreference()).toBe('system')
  })

  it('falls back to system if localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(getStoredThemePreference()).toBe('system')
  })
})

describe('setStoredThemePreference', () => {
  it('persists an explicit choice and stamps the root element', () => {
    setStoredThemePreference('dark')
    expect(localStorage.getItem('bpe-theme')).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('clears storage and the root attribute when set back to system', () => {
    setStoredThemePreference('light')
    setStoredThemePreference('system')
    expect(localStorage.getItem('bpe-theme')).toBeNull()
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})

describe('applyThemeAttribute', () => {
  it('sets data-theme for an explicit preference', () => {
    applyThemeAttribute('light')
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  it('removes data-theme for system', () => {
    document.documentElement.setAttribute('data-theme', 'dark')
    applyThemeAttribute('system')
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false)
  })
})

describe('effectiveTheme', () => {
  it('passes explicit light/dark through unchanged', () => {
    expect(effectiveTheme('light')).toBe('light')
    expect(effectiveTheme('dark')).toBe('dark')
  })

  it('resolves system against matchMedia', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList)
    expect(effectiveTheme('system')).toBe('dark')

    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList)
    expect(effectiveTheme('system')).toBe('light')
  })
})
