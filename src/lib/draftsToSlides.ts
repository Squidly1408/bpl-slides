import { putAsset } from './db'
import { createId } from './id'
import { makeHeadingBlock, makeImageBlock, makeShapeBlock, makeSlide, makeTextBlock } from './blocks'
import { gridLayout, type Region } from './layout'
import { getTheme } from './themes'
import type { ParseResult, ParsedImage } from './parsers/types'
import type { Slide } from '../types'

const MAX_ITEMS_PER_SLIDE = 6

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length <= size) return items.length ? [items] : []
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

async function storeImages(images: ParsedImage[]) {
  const stored: { assetId: string }[] = []
  for (const img of images) {
    const assetId = createId()
    await putAsset({ id: assetId, name: img.name, mime: img.mime, blob: img.blob })
    stored.push({ assetId })
  }
  return stored
}

/**
 * Converts heuristically-parsed document drafts into real, designed slides —
 * one clear point per line (never one run-on paragraph), capped per slide so
 * content doesn't overflow, laid out with the project's theme, and any
 * extracted images stored as local assets.
 */
export async function draftsToSlides(result: ParseResult, themeId?: string): Promise<Slide[]> {
  const theme = getTheme(themeId)
  const slides: Slide[] = []

  for (const draft of result.slides) {
    // Every paragraph and bullet becomes one scannable line — this is what
    // keeps auto-filled slides readable instead of one dense text block.
    const items = [...draft.bullets, ...draft.paragraphs]
    const itemChunks = chunk(items, MAX_ITEMS_PER_SLIDE)
    const storedImages = await storeImages(draft.images)

    if (itemChunks.length === 0 && storedImages.length === 0) {
      if (draft.heading) {
        slides.push(makeSlide({ blocks: [makeHeadingBlock(draft.heading, { color: theme.primaryDark })] }))
      }
      continue
    }

    const pageCount = Math.max(itemChunks.length, storedImages.length ? 1 : 0)
    for (let page = 0; page < Math.max(pageCount, 1); page++) {
      const pageItems = itemChunks[page] ?? []
      const showImages = page === 0 && storedImages.length > 0
      const heading = draft.heading ? (pageCount > 1 ? `${draft.heading} (${page + 1}/${pageCount})` : draft.heading) : undefined

      const blocks: Slide['blocks'] = [makeShapeBlock({ x: 8, y: 7, w: 9, h: 0.9, color: theme.accent, radius: 50 })]
      if (heading) {
        blocks.push(makeTextBlock({ content: heading, x: 8, y: 9, w: 84, h: 14, fontSize: 32, fontWeight: 'bold', color: theme.primaryDark }))
      }

      const bodyY = 26
      const bodyH = 66
      const hasText = pageItems.length > 0
      const textW = showImages ? 46 : 88

      if (hasText) {
        blocks.push(
          makeTextBlock({
            content: pageItems.map((i) => `•  ${i}`).join('\n\n'),
            x: 6,
            y: bodyY,
            w: textW,
            h: bodyH,
            fontSize: 18,
            color: '#211f1a',
          }),
        )
      }

      if (showImages) {
        const region: Region = hasText ? { x: 54, y: bodyY, w: 40, h: bodyH } : { x: 8, y: bodyY, w: 84, h: bodyH }
        const cells = gridLayout(storedImages.length, region)
        storedImages.forEach((img, i) => blocks.push(makeImageBlock(img.assetId, { ...cells[i] })))
      }

      slides.push(makeSlide({ background: '#ffffff', blocks }))
    }
  }

  return slides
}
