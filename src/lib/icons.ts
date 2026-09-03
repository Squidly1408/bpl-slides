/**
 * Font Awesome Free icon lookup — the solid set plus the brands set (social
 * platforms and other logos: Facebook, Instagram, X/Twitter, YouTube,
 * TikTok, LinkedIn, GitHub, …), bundled locally via
 * `@fortawesome/free-solid-svg-icons` and `@fortawesome/free-brands-svg-icons`
 * (npm, MIT/OFL/CC-BY licensed), not loaded from a CDN, so icons work fully
 * offline and nothing about which icon a student picked is ever sent
 * anywhere. Both sets combined are still only a few hundred KB, so they're
 * dynamically imported here rather than pulled into the main bundle — only
 * loaded the moment someone opens the icon picker.
 */

export interface IconDef {
  name: string
  width: number
  height: number
  path: string
  /** true for a brand/logo glyph (Font Awesome's "brands" set) — surfaced so the picker can label these distinctly from generic icons sharing a similar name. */
  brand: boolean
}

type RawIconModule = Record<string, { iconName?: string; icon?: [number, number, unknown, unknown, string | string[]] } | undefined>

/** Reads every icon definition out of one Font Awesome package module into `byName`, skipping any name already claimed by an earlier module (the solid set is loaded first, so it wins the ~2 name collisions with brands, e.g. "font-awesome" itself). Also collapses the package's own deprecated re-export aliases, which otherwise made 2-3 entries point at the same icon. */
function collectIcons(mod: RawIconModule, brand: boolean, byName: Map<string, IconDef>) {
  for (const key of Object.keys(mod)) {
    if (!key.startsWith('fa') || key === 'fas' || key === 'fab' || key === 'prefix') continue
    const entry = mod[key]
    if (!entry?.iconName || !entry.icon || byName.has(entry.iconName)) continue
    const [width, height, , , pathData] = entry.icon
    // A handful of icons (duotone-style) have two path layers; take the first — good enough for a flat single-colour glyph.
    const path = Array.isArray(pathData) ? pathData[0] : pathData
    byName.set(entry.iconName, { name: entry.iconName, width, height, path, brand })
  }
}

let cache: IconDef[] | null = null

/** Loads (and caches) every solid + brand icon as one flat, searchable list. */
export async function loadIcons(): Promise<IconDef[]> {
  if (cache) return cache
  const [solid, brands] = await Promise.all([import('@fortawesome/free-solid-svg-icons'), import('@fortawesome/free-brands-svg-icons')])
  const byName = new Map<string, IconDef>()
  collectIcons(solid as unknown as RawIconModule, false, byName)
  collectIcons(brands as unknown as RawIconModule, true, byName)
  const defs = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
  cache = defs
  return defs
}

/** Looks up one icon by name, loading the set first if needed. Returns null if the name isn't in the set (e.g. an old saved icon block referencing a since-removed name). */
export async function getIcon(name: string): Promise<IconDef | null> {
  const all = await loadIcons()
  return all.find((i) => i.name === name) ?? null
}
