import { describe, expect, it } from 'vitest'
import { gridLayout, type Region } from './layout'

const FULL: Region = { x: 0, y: 0, w: 100, h: 100 }

describe('gridLayout', () => {
  it('returns nothing for a zero or negative count', () => {
    expect(gridLayout(0, FULL)).toEqual([])
    expect(gridLayout(-3, FULL)).toEqual([])
  })

  it('places a single item across the whole region', () => {
    const [cell] = gridLayout(1, FULL)
    expect(cell).toEqual({ x: 0, y: 0, w: 100, h: 100 })
  })

  it('auto-picks a square-ish grid (ceil(sqrt(count)) columns) with no maxCols', () => {
    // 4 items -> 2 cols x 2 rows
    const cells = gridLayout(4, FULL, 0)
    expect(cells).toHaveLength(4)
    expect(cells[0]).toEqual({ x: 0, y: 0, w: 50, h: 50 })
    expect(cells[1]).toEqual({ x: 50, y: 0, w: 50, h: 50 })
    expect(cells[2]).toEqual({ x: 0, y: 50, w: 50, h: 50 })
    expect(cells[3]).toEqual({ x: 50, y: 50, w: 50, h: 50 })
  })

  it('caps row width at maxCols and wraps the remainder', () => {
    // 3 items, maxCols 2 -> row of 2, then 1 alone on the next row
    const cells = gridLayout(3, FULL, 0, 2)
    expect(cells).toHaveLength(3)
    expect(cells[0].y).toBe(0)
    expect(cells[1].y).toBe(0)
    expect(cells[2].y).toBeCloseTo(50)
  })

  it('never lets maxCols exceed the item count', () => {
    const cells = gridLayout(2, FULL, 0, 10)
    // 2 items with maxCols 10 should still only make 2 columns, not 10
    expect(cells[0].w).toBeCloseTo(50)
    expect(cells[1].x).toBeCloseTo(50)
  })

  it('accounts for the gap between cells and offsets by the region origin', () => {
    const region: Region = { x: 10, y: 20, w: 100, h: 100 }
    const cells = gridLayout(2, region, 10, 2)
    // cellW = (100 - 10*1) / 2 = 45
    expect(cells[0]).toEqual({ x: 10, y: 20, w: 45, h: 100 })
    expect(cells[1]).toEqual({ x: 65, y: 20, w: 45, h: 100 })
  })
})
