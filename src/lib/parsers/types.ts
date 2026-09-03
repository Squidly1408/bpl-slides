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
}

export interface ParseResult {
  slides: ParsedSlideDraft[]
  warnings: string[]
}
