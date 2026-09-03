import type { ShapeKind } from '../types'

/** Every non-'rect' shape silhouette, as a CSS `clip-path` — 'rect' is
 * handled separately via `border-radius` (see BlockRenderer), since a plain
 * rounded-rect/pill/circle needs actual rounding, not a polygon clip. */
export const SHAPE_CLIP_PATHS: Partial<Record<ShapeKind, string>> = {
  triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
  pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
  hexagon: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
  star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  arrow: 'polygon(0% 28%, 58% 28%, 58% 0%, 100% 50%, 58% 100%, 58% 72%, 0% 72%)',
  line: 'inset(42% 0% 42% 0% round 999px)',
}

export const SHAPE_KIND_OPTIONS: { value: ShapeKind; label: string }[] = [
  { value: 'rect', label: 'Rectangle / pill / circle' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'pentagon', label: 'Pentagon' },
  { value: 'hexagon', label: 'Hexagon' },
  { value: 'star', label: 'Star' },
  { value: 'arrow', label: 'Arrow' },
  { value: 'line', label: 'Line' },
]
