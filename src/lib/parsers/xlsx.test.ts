import * as XLSX from 'xlsx'
import { describe, expect, it } from 'vitest'
import { parseXlsx } from './xlsx'

/** Builds a real, valid .xlsx File in-memory from plain rows-of-cells per
 * sheet — no binary fixture needed, since SheetJS can both write and read. */
function workbookFile(sheets: Record<string, unknown[][]>, name = 'data.xlsx'): File {
  const wb = XLSX.utils.book_new()
  for (const [sheetName, rows] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), sheetName)
  }
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  return new File([buffer], name)
}

describe('parseXlsx', () => {
  it('turns a sheet into one slide draft with the sheet name as heading', async () => {
    const result = await parseXlsx(
      workbookFile({
        Budget: [
          ['Item', 'Cost'],
          ['Venue', '200'],
          ['Catering', '150'],
        ],
      }),
    )
    expect(result.slides).toHaveLength(1)
    expect(result.slides[0].heading).toBe('Budget')
    expect(result.slides[0].grids).toEqual([
      [
        ['Item', 'Cost'],
        ['Venue', '200'],
        ['Catering', '150'],
      ],
    ])
  })

  it('produces one slide draft per sheet', async () => {
    const result = await parseXlsx(
      workbookFile({
        Skills: [['Skill', 'Level']],
        Evidence: [['Task', 'Date']],
      }),
    )
    expect(result.slides.map((s) => s.heading)).toEqual(['Skills', 'Evidence'])
  })

  it('pads ragged rows out to the widest row', async () => {
    const result = await parseXlsx(workbookFile({ Sheet1: [['A', 'B', 'C'], ['x']] }))
    expect(result.slides[0].grids![0]).toEqual([
      ['A', 'B', 'C'],
      ['x', '', ''],
    ])
  })

  it('skips a sheet that is entirely empty', async () => {
    const result = await parseXlsx(workbookFile({ Empty: [], Real: [['has', 'data']] }))
    expect(result.slides.map((s) => s.heading)).toEqual(['Real'])
  })

  it('caps an oversized sheet and warns about the truncation', async () => {
    const bigSheet = Array.from({ length: 30 }, (_, i) => [`row${i}`, 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'x', 'extra'])
    const result = await parseXlsx(workbookFile({ Big: bigSheet }))
    const grid = result.slides[0].grids![0]
    expect(grid.length).toBeLessThanOrEqual(15)
    expect(grid[0].length).toBeLessThanOrEqual(8)
    expect(result.warnings.some((w) => w.includes('Big'))).toBe(true)
  })

  it('returns no slides for a workbook with no data anywhere', async () => {
    const result = await parseXlsx(workbookFile({ Sheet1: [] }))
    expect(result.slides).toEqual([])
  })
})
