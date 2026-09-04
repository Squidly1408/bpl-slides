import { parseDocx } from './docx'
import { parsePptx } from './pptx'
import { parsePdf } from './pdf'
import { parseText } from './text'
import { parseXlsx } from './xlsx'
import type { ParseResult } from './types'

export type { ParseResult, ParsedSlideDraft, ParsedImage } from './types'

export type DocumentKind = 'docx' | 'pptx' | 'pdf' | 'text' | 'xlsx'

export function detectDocumentKind(file: File): DocumentKind | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.docx')) return 'docx'
  if (name.endsWith('.pptx')) return 'pptx'
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.markdown')) return 'text'
  // .xls/.ods too — SheetJS reads legacy Excel and OpenDocument spreadsheets
  // (e.g. Google Sheets' "Download > ODS") through the same read() call.
  if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.ods')) return 'xlsx'
  return null
}

export async function parseDocument(file: File): Promise<ParseResult> {
  const kind = detectDocumentKind(file)
  switch (kind) {
    case 'docx':
      return parseDocx(file)
    case 'pptx':
      return parsePptx(file)
    case 'pdf':
      return parsePdf(file)
    case 'text':
      return parseText(file)
    case 'xlsx':
      return parseXlsx(file)
    default:
      throw new Error(
        `"${file.name}" isn't a supported document type for auto-fill (.docx, .pptx, .pdf, .txt, .md, .xlsx, .xls, .ods).`,
      )
  }
}
