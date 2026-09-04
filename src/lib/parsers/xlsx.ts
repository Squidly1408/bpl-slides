import * as XLSX from 'xlsx'
import type { ParseResult, ParsedSlideDraft } from './types'

// A wide/tall sheet doesn't fit legibly on a slide (and pptx export/the
// on-canvas GridBlockContent both render every row/column present) — capped
// here, at the source, rather than trying to shrink font size indefinitely.
const MAX_ROWS = 15
const MAX_COLS = 8

/**
 * Reads every sheet in a .xlsx/.xls/.ods workbook into its own slide draft —
 * the sheet name becomes the heading, and its cell values become a single
 * grid (see lib/blocks.ts's makeGridBlock / types.ts's GridBlock) rather
 * than flattened into bullet text, so the data still reads as a table once
 * it's on a slide. Runs entirely client-side via the bundled xlsx (SheetJS)
 * library — no data leaves the browser.
 *
 * This reads the sheet's own cell values, not any chart drawn from them —
 * a native Excel chart is a vector description (series/axes) requiring a
 * real charting engine to reproduce faithfully, not something this heuristic
 * auto-fill attempts. The underlying data a chart was built from is on the
 * same sheet regardless, so it still comes across as a table.
 */
export async function parseXlsx(file: File): Promise<ParseResult> {
  const arrayBuffer = await file.arrayBuffer()
  const workbook = XLSX.read(arrayBuffer, { type: 'array' })
  const warnings: string[] = []
  const slides: ParsedSlideDraft[] = []

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', blankrows: false, raw: false })
    if (rawRows.length === 0) continue

    const truncatedRows = rawRows.length > MAX_ROWS
    const rows = rawRows.slice(0, MAX_ROWS)
    const colCount = Math.min(MAX_COLS, Math.max(...rows.map((r) => r.length)))
    const truncatedCols = rows.some((r) => r.length > MAX_COLS)

    const grid = rows.map((row) =>
      Array.from({ length: colCount }, (_, i) => {
        const value = row[i]
        return value === undefined || value === null ? '' : String(value).trim()
      }),
    )
    // A grid of entirely-empty cells (e.g. a formatted-but-unused sheet) isn't worth a slide.
    if (!grid.some((row) => row.some((cell) => cell))) continue

    if (truncatedRows || truncatedCols) {
      warnings.push(
        `"${sheetName}" has more ${truncatedRows ? 'rows' : ''}${truncatedRows && truncatedCols ? ' and ' : ''}${truncatedCols ? 'columns' : ''} than fit on one slide — showing the first ${colCount}×${rows.length}.`,
      )
    }

    slides.push({ heading: sheetName, paragraphs: [], bullets: [], images: [], grids: [grid] })
  }

  return { slides, warnings }
}
