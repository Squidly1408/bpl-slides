import { useEffect, useState } from 'react'
import { getStoredThemePreference, setStoredThemePreference, systemPrefersDark } from '../lib/theme'
import { IconMoon, IconSun } from './icons'

/** Sun/moon toggle — defaults to following the OS/browser preference, and
 * remembers an explicit choice once the student picks one. */
export default function ThemeToggle({ dark = false }: { dark?: boolean } = {}) {
  const [pref, setPref] = useState(getStoredThemePreference)
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setSystemDark(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  const isDark = pref === 'system' ? systemDark : pref === 'dark'

  function toggle() {
    const next = isDark ? 'light' : 'dark'
    setStoredThemePreference(next)
    setPref(next)
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="flex h-8 w-8 items-center justify-center rounded-md border"
      style={
        dark
          ? { borderColor: 'rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.85)' }
          : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }
      }
    >
      {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
    </button>
  )
}
