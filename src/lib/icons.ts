/**
 * Font Awesome Free (solid set) icon lookup — bundled locally via
 * `@fortawesome/free-solid-svg-icons` (npm, MIT/OFL licensed), not loaded
 * from a CDN, so icons work fully offline and nothing about which icon a
 * student picked is ever sent anywhere. The whole ~2000-icon set is a few
 * hundred KB, so it's dynamically imported here rather than pulled into the
 * main bundle — only loaded the moment someone opens the icon picker.
 */

export interface IconDef {
  name: string
  /** [width, height, ligatures, unicode, path-d] — the raw Font Awesome icon definition shape. */
  width: number
  height: number
  path: string
}

let cache: IconDef[] | null = null

/** Loads (and caches) every solid-set icon as a flat, searchable list. */
export async function loadIcons(): Promise<IconDef[]> {
  if (cache) return cache
  const mod = await import('@fortawesome/free-solid-svg-icons')
  // The package exports several deprecated aliases per icon (e.g. an old
  // renamed export pointing at the same iconName as its replacement) — keyed
  // by iconName here so each real icon appears exactly once, rather than
  // 2-3x under duplicate names (which also broke React's list keys).
  const byName = new Map<string, IconDef>()
  for (const key of Object.keys(mod)) {
    if (!key.startsWith('fa') || key === 'fas' || key === 'prefix') continue
    const entry = (mod as Record<string, unknown>)[key] as { iconName?: string; icon?: [number, number, unknown, unknown, string | string[]] } | undefined
    if (!entry?.iconName || !entry.icon || byName.has(entry.iconName)) continue
    const [width, height, , , pathData] = entry.icon
    // A handful of icons (duotone-style) have two path layers; take the first — good enough for a flat single-colour glyph.
    const path = Array.isArray(pathData) ? pathData[0] : pathData
    byName.set(entry.iconName, { name: entry.iconName, width, height, path })
  }
  const defs = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
  cache = defs
  return defs
}

/** Looks up one icon by name, loading the set first if needed. Returns null if the name isn't in the set (e.g. an old saved icon block referencing a since-removed name). */
export async function getIcon(name: string): Promise<IconDef | null> {
  const all = await loadIcons()
  return all.find((i) => i.name === name) ?? null
}
