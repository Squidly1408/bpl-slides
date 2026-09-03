export type ThemePreference = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'bpe-theme'

export function getStoredThemePreference(): ThemePreference {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark') return v
  } catch {
    // localStorage unavailable (private mode, etc.) — fall through to system
  }
  return 'system'
}

export function setStoredThemePreference(pref: ThemePreference) {
  try {
    if (pref === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, pref)
  } catch {
    // ignore — theme just won't persist this session
  }
  applyThemeAttribute(pref)
}

export function applyThemeAttribute(pref: ThemePreference) {
  const root = document.documentElement
  if (pref === 'system') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', pref)
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** The theme actually being shown right now, resolving 'system' against the OS/browser preference. */
export function effectiveTheme(pref: ThemePreference): 'light' | 'dark' {
  return pref === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : pref
}
