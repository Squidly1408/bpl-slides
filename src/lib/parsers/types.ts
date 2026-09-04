export interface ParsedImage {
  blob: Blob
  mime: string
  name: string
}

export interface ParsedSlideDraft {
  heading?: string
  paragraphs: string[]
  /** list items (from a bulleted/numbered list, or a detected "- " line) — kept separate from `paragraphs` so they render as a proper bullet list instead of being run together. */
  bullets: string[]
  images: ParsedImage[]
  /** data tables — each a 2D array of cell text (see lib/parsers/xlsx.ts), kept
   * separate from paragraphs/bullets so draftsToSlides renders each one as a
   * real grid/table block instead of flattened text. Every row within one
   * grid is the same width. */
  grids?: string[][][]
}

export interface ParseResult {
  slides: ParsedSlideDraft[]
  warnings: string[]
}
