import { contrastText, darken, tint } from './color'
import type { CustomThemeColors } from '../types'

export interface Theme {
  id: string
  name: string
  /** main brand colour — bands, buttons, headings */
  primary: string
  /** darker shade of primary, for text on light backgrounds */
  primaryDark: string
  /** secondary/highlight colour — underlines, icon bubbles, stats */
  accent: string
  /** soft tint of primary for light section backgrounds */
  surfaceTint: string
  /** readable text colour on `primary` */
  onPrimary: string
}

export const THEMES: Theme[] = [
  { id: 'indigo', name: 'Indigo (default)', primary: '#2c4870', primaryDark: '#1c3050', accent: '#c8862f', surfaceTint: '#e7ecf4', onPrimary: '#ffffff' },
  { id: 'teal', name: 'Teal', primary: '#1f6f5c', primaryDark: '#154b3f', accent: '#c96a3b', surfaceTint: '#e4efe9', onPrimary: '#ffffff' },
  { id: 'ocean', name: 'Ocean', primary: '#2b5fa4', primaryDark: '#1d4275', accent: '#f2a541', surfaceTint: '#e4ecf6', onPrimary: '#ffffff' },
  { id: 'slate', name: 'Slate', primary: '#33475b', primaryDark: '#212f3d', accent: '#4fb3a9', surfaceTint: '#e6eaee', onPrimary: '#ffffff' },
  { id: 'forest', name: 'Forest', primary: '#3f6b2a', primaryDark: '#2b4a1d', accent: '#d97b29', surfaceTint: '#e8efe1', onPrimary: '#ffffff' },
  { id: 'charcoal', name: 'Charcoal', primary: '#2a2a2a', primaryDark: '#151515', accent: '#4f8ab5', surfaceTint: '#e9e9e7', onPrimary: '#ffffff' },
  { id: 'amber', name: 'Amber', primary: '#a86a10', primaryDark: '#754a0a', accent: '#2f6b57', surfaceTint: '#f3ead8', onPrimary: '#ffffff' },
  { id: 'berry', name: 'Berry', primary: '#8a2f6b', primaryDark: '#5f2049', accent: '#f2b705', surfaceTint: '#f3e5ee', onPrimary: '#ffffff' },
  { id: 'maroon', name: 'Maroon', primary: '#6e1f2e', primaryDark: '#3f1119', accent: '#5b5b58', surfaceTint: '#efe8e7', onPrimary: '#ffffff' },
  { id: 'sunset', name: 'Sunset', primary: '#c1432a', primaryDark: '#8c2f1d', accent: '#f2b705', surfaceTint: '#f7e6e1', onPrimary: '#ffffff' },
]

export const DEFAULT_THEME_ID = 'indigo'
export const CUSTOM_THEME_ID = 'custom'
export const DEFAULT_CUSTOM_COLORS: CustomThemeColors = { primary: '#2c4870', accent: '#c8862f' }

/** Builds a full Theme from just the two colours a student picked — the rest (dark shade, soft tint, on-primary text) is derived so it stays legible. */
export function buildCustomTheme(colors: CustomThemeColors): Theme {
  return {
    id: CUSTOM_THEME_ID,
    name: 'Custom',
    primary: colors.primary,
    primaryDark: darken(colors.primary, 0.35),
    accent: colors.accent,
    surfaceTint: tint(colors.primary, 0.88),
    onPrimary: contrastText(colors.primary),
  }
}

export function getTheme(id: string | undefined, custom?: CustomThemeColors): Theme {
  if (id === CUSTOM_THEME_ID && custom) return buildCustomTheme(custom)
  return THEMES.find((t) => t.id === id) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
}
