import { describe, expect, it } from 'vitest'
import { buildCustomTheme, CUSTOM_THEME_ID, DEFAULT_THEME_ID, getTheme, THEMES } from './themes'

describe('getTheme', () => {
  it('returns the matching preset by id', () => {
    const theme = getTheme('teal')
    expect(theme.id).toBe('teal')
  })

  it('falls back to the default theme for an unknown id', () => {
    expect(getTheme('nonexistent').id).toBe(DEFAULT_THEME_ID)
  })

  it('falls back to the default theme when id is undefined', () => {
    expect(getTheme(undefined).id).toBe(DEFAULT_THEME_ID)
  })

  it('builds a custom theme when id is "custom" and colours are given', () => {
    const theme = getTheme(CUSTOM_THEME_ID, { primary: '#112233', accent: '#445566' })
    expect(theme.id).toBe(CUSTOM_THEME_ID)
    expect(theme.primary).toBe('#112233')
  })

  it('falls back to default if id is "custom" but no colours are given', () => {
    expect(getTheme(CUSTOM_THEME_ID).id).toBe(DEFAULT_THEME_ID)
  })

  it('has a distinct id for every preset', () => {
    const ids = THEMES.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('buildCustomTheme', () => {
  it('derives a full palette from just primary + accent', () => {
    const theme = buildCustomTheme({ primary: '#2c4870', accent: '#c8862f' })
    expect(theme.primary).toBe('#2c4870')
    expect(theme.accent).toBe('#c8862f')
    // Derived fields should differ from the input, not just echo it back.
    expect(theme.primaryDark).not.toBe(theme.primary)
    expect(theme.surfaceTint).not.toBe(theme.primary)
    expect(['#ffffff', '#1c2230']).toContain(theme.onPrimary)
  })
})
