export interface Region {
  x: number
  y: number
  w: number
  h: number
}

/** Lays `count` items out in a simple even grid within `region` (percent units), with a small gap.
 * `maxCols` caps how wide a single row gets before wrapping (default: a square-ish auto grid). */
export function gridLayout(count: number, region: Region, gap = 2, maxCols?: number): Region[] {
  if (count <= 0) return []
  const cols = maxCols ? Math.min(maxCols, count) : Math.max(1, Math.ceil(Math.sqrt(count)))
  const rows = Math.ceil(count / cols)
  const cellW = (region.w - gap * (cols - 1)) / cols
  const cellH = (region.h - gap * (rows - 1)) / rows
  const cells: Region[] = []
  for (let i = 0; i < count; i++) {
    const col = i % cols
    const row = Math.floor(i / cols)
    cells.push({
      x: region.x + col * (cellW + gap),
      y: region.y + row * (cellH + gap),
      w: cellW,
      h: cellH,
    })
  }
  return cells
}
