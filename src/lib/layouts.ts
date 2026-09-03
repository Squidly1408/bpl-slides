import { makeFlowerGraphBlock, makeShapeBlock, makeSlide, makeTextBlock } from './blocks'
import { darken } from './color'
import { FLOWER_COLOR_BY_LABEL } from './flowerData'
import { gridLayout, type Region } from './layout'
import type { Theme } from './themes'
import type { Block, Slide, TransitionType } from '../types'

// The slide canvas is a fixed 1280x720 (16:9) box addressed in percent — see
// types/index.ts. A block only reads as a true circle/square when its pixel
// width and height match, so `circle()` below converts a target diameter
// (as % of the 1280-wide canvas) into the matching w/h percent pair.
const ASPECT = 1280 / 720

export function circle(diameterPctOfWidth: number) {
  return { w: diameterPctOfWidth, h: diameterPctOfWidth * ASPECT }
}

export function bulletText(items: string[]) {
  return items.map((i) => `•  ${i}`).join('\n\n')
}

/**
 * A handful of reusable, pre-composed slide layouts — gradient bands, shadowed
 * cards, numbered chips, layered background depth — so generated slides look
 * designed instead of being a heading and a wall of text on a blank white
 * box. Every layout takes a Theme so the whole deck reads as one consistent,
 * on-brand set.
 */

/** A full-bleed gradient wash, meant as the first (lowest z-index) block in a
 * slide — gives coloured slides real depth instead of one flat swatch, while
 * still exporting sensibly to .pptx (see pptxExport.ts's gradient→solid
 * approximation). */
function gradientWash(theme: Theme, angle = 135, to?: string): Block {
  return makeShapeBlock({ x: 0, y: 0, w: 100, h: 100, color: theme.primary, gradientTo: to ?? theme.primaryDark, gradientAngle: angle, radius: 0 })
}

/** Lays bullets out as individual rows, each with its own small coloured
 * marker chip aligned to the text's vertical centre — reads as a designed
 * list rather than one text block with inline "•" glyphs. */
function bulletBlocks(
  theme: Theme,
  bullets: string[],
  region: Region,
  opts: { fontSize?: number; textColor?: string; markerColor?: string } = {},
): Block[] {
  if (bullets.length === 0) return []
  const fontSize = opts.fontSize ?? 19
  const textColor = opts.textColor ?? '#211f1a'
  const markerColor = opts.markerColor ?? theme.accent
  const rowH = region.h / bullets.length
  const markerD = Math.min(1.8, rowH * 0.22)
  const marker = circle(markerD)
  const blocks: Block[] = []
  bullets.forEach((text, i) => {
    const rowY = region.y + i * rowH
    blocks.push(
      makeShapeBlock({ x: region.x, y: rowY + rowH / 2 - marker.h / 2, w: marker.w, h: marker.h, color: markerColor, radius: 50 }),
      makeTextBlock({
        content: text,
        x: region.x + markerD + 2.6,
        y: rowY,
        w: region.w - markerD - 2.6,
        h: rowH,
        fontSize,
        color: textColor,
        valign: 'middle',
      }),
    )
  })
  return blocks
}

export function heroSlide(
  theme: Theme,
  title: string,
  subtitle?: string,
  transition: TransitionType = 'fade',
): Slide {
  const big = circle(58)
  const small = circle(40)
  return makeSlide({
    transition,
    background: theme.primary,
    blocks: [
      gradientWash(theme, 150),
      makeShapeBlock({ x: 64, y: -20, w: big.w, h: big.h, color: theme.accent, radius: 50, opacity: 0.16 }),
      makeShapeBlock({ x: -18, y: 58, w: small.w, h: small.h, color: '#ffffff', radius: 50, opacity: 0.06 }),
      makeTextBlock({
        content: title,
        x: 8,
        y: 33,
        w: 84,
        h: 22,
        fontSize: 58,
        fontWeight: 'bold',
        align: 'center',
        valign: 'bottom',
        color: theme.onPrimary,
      }),
      makeShapeBlock({ x: 44, y: 57, w: 12, h: 1, color: theme.accent, radius: 50, shadow: true }),
      ...(subtitle
        ? [
            makeTextBlock({
              content: subtitle,
              x: 8,
              y: 60,
              w: 84,
              h: 10,
              fontSize: 21,
              align: 'center',
              valign: 'top',
              color: theme.onPrimary,
              letterSpacing: 0.5,
            }),
          ]
        : []),
    ],
  })
}

export function closingSlide(theme: Theme, heading = 'Questions?', subtitle = ''): Slide {
  return heroSlide(theme, heading, subtitle, 'zoom')
}

/** A gradient colour band down one side carrying the heading, with bullet content on the rest of the slide. */
export function splitSlide(
  theme: Theme,
  heading: string,
  bullets: string[],
  opts: { mirrored?: boolean; transition?: TransitionType } = {},
): Slide {
  const bandW = 34
  const bandX = opts.mirrored ? 100 - bandW : 0
  const bodyX = opts.mirrored ? 6 : bandW + 7
  const bodyW = 100 - bandW - 13
  const glow = circle(30)
  return makeSlide({
    transition: opts.transition ?? 'slide-left',
    background: '#ffffff',
    blocks: [
      makeShapeBlock({ x: bandX, y: 0, w: bandW, h: 100, color: theme.primary, gradientTo: theme.primaryDark, gradientAngle: opts.mirrored ? 225 : 135, radius: 0 }),
      makeShapeBlock({ x: bandX + (opts.mirrored ? -12 : bandW - 22), y: 64, w: glow.w, h: glow.h, color: '#ffffff', radius: 50, opacity: 0.06 }),
      makeTextBlock({
        content: heading,
        x: bandX + 5,
        y: 12,
        w: bandW - 10,
        h: 44,
        fontSize: 26,
        fontWeight: 'bold',
        color: theme.onPrimary,
        valign: 'bottom',
      }),
      makeShapeBlock({ x: bandX + 5, y: 58, w: 10, h: 0.8, color: theme.accent, radius: 50 }),
      ...bulletBlocks(theme, bullets, { x: bodyX, y: 14, w: bodyW, h: 74 }, { markerColor: theme.primary }),
    ],
  })
}

/** Plain content slide: thin accent bar, bold heading, chip-marker bullet list, faint corner depth. */
export function bulletSlide(theme: Theme, heading: string, bullets: string[], transition: TransitionType = 'slide-left'): Slide {
  const glow = circle(34)
  return makeSlide({
    transition,
    background: '#ffffff',
    blocks: [
      makeShapeBlock({ x: 80, y: -14, w: glow.w, h: glow.h, color: theme.surfaceTint, radius: 50 }),
      makeShapeBlock({ x: 8, y: 7, w: 9, h: 0.9, color: theme.accent, radius: 50 }),
      makeTextBlock({
        content: heading,
        x: 8,
        y: 9,
        w: 84,
        h: 14,
        fontSize: 37,
        fontWeight: 'bold',
        color: theme.primaryDark,
      }),
      ...bulletBlocks(theme, bullets, { x: 8, y: 28, w: 84, h: 64 }, { markerColor: theme.accent }),
    ],
  })
}

/** Full-bleed gradient "cover" — big heading directly on the theme colour, bullets in a floating shadowed white card. A bolder, darker-canvas alternative to the plain white layouts. */
export function coverSlide(theme: Theme, heading: string, bullets: string[], transition: TransitionType = 'zoom'): Slide {
  const big = circle(60)
  const small = circle(30)
  return makeSlide({
    transition,
    background: theme.primary,
    blocks: [
      gradientWash(theme, 160),
      makeShapeBlock({ x: 70, y: -10, w: big.w, h: big.h, color: theme.accent, radius: 50, opacity: 0.16 }),
      makeShapeBlock({ x: -14, y: 68, w: small.w, h: small.h, color: '#ffffff', radius: 50, opacity: 0.06 }),
      makeTextBlock({ content: heading, x: 8, y: 8, w: 84, h: 22, fontSize: 40, fontWeight: 'bold', color: theme.onPrimary }),
      makeShapeBlock({ x: 8, y: 32, w: 84, h: 60, color: '#ffffff', radius: 4, opacity: 0.98, shadow: true }),
      ...bulletBlocks(theme, bullets, { x: 12, y: 38, w: 76, h: 48 }, { markerColor: theme.primary }),
    ],
  })
}

/** Coloured header band + a grid of shadowed white cards, each point numbered — a structured, catalog-style alternative to a plain bullet list. */
export function gridCardSlide(theme: Theme, heading: string, bullets: string[], transition: TransitionType = 'slide-up'): Slide {
  const region: Region = { x: 6, y: 30, w: 88, h: 58 }
  const cells = gridLayout(bullets.length, region, 4, 3)
  const blocks: Slide['blocks'] = [
    makeShapeBlock({ x: 0, y: 0, w: 100, h: 13, color: theme.primary, gradientTo: theme.primaryDark, gradientAngle: 100, radius: 0, shadow: true }),
    makeTextBlock({ content: heading, x: 6, y: 0, w: 88, h: 13, fontSize: 27, fontWeight: 'bold', color: theme.onPrimary, valign: 'middle' }),
  ]
  bullets.forEach((b, i) => {
    const cell = cells[i]
    blocks.push(
      makeShapeBlock({ ...cell, color: '#ffffff', radius: 7, shadow: true }),
      makeShapeBlock({ x: cell.x, y: cell.y, w: cell.w, h: 0.9, color: theme.accent, radius: 4 }),
      makeTextBlock({ content: String(i + 1).padStart(2, '0'), x: cell.x + 4, y: cell.y + 5, w: 16, h: 8, fontSize: 13, fontWeight: 'bold', color: theme.accent, letterSpacing: 1 }),
      makeTextBlock({ content: b, x: cell.x + 4, y: cell.y + 12, w: cell.w - 8, h: cell.h - 16, fontSize: 15, color: '#211f1a' }),
    )
  })
  return makeSlide({ transition, background: '#ffffff', blocks })
}

/** Heading + a grid of glossy, shadowed icon-bubble items (skills, tools, learning goals...). */
export function iconGridSlide(
  theme: Theme,
  heading: string,
  items: { icon: string; label: string }[],
  transition: TransitionType = 'zoom',
): Slide {
  const region: Region = { x: 6, y: 30, w: 88, h: 58 }
  const cells = gridLayout(items.length, region, 4)
  const bubble = circle(9)

  const blocks: Slide['blocks'] = [
    makeShapeBlock({ x: 8, y: 7, w: 9, h: 0.9, color: theme.accent, radius: 50 }),
    makeTextBlock({ content: heading, x: 8, y: 9, w: 84, h: 14, fontSize: 36, fontWeight: 'bold', color: theme.primaryDark }),
  ]

  items.forEach((item, i) => {
    const cell = cells[i]
    const cx = cell.x + cell.w / 2 - bubble.w / 2
    const base = i % 2 === 0 ? theme.primary : theme.accent
    blocks.push(
      makeShapeBlock({ x: cx, y: cell.y, w: bubble.w, h: bubble.h, color: base, gradientTo: darken(base, 0.25), radius: 50, shadow: true }),
      makeTextBlock({
        content: item.icon,
        x: cx,
        y: cell.y,
        w: bubble.w,
        h: bubble.h,
        fontSize: 34,
        align: 'center',
        valign: 'middle',
        color: theme.onPrimary,
      }),
      makeTextBlock({
        content: item.label,
        x: cell.x,
        y: cell.y + bubble.h + 2,
        w: cell.w,
        h: cell.h - bubble.h - 2,
        fontSize: 16,
        fontWeight: 'bold',
        align: 'center',
        valign: 'top',
        color: '#211f1a',
      }),
    )
  })

  return makeSlide({ transition, background: '#ffffff', blocks })
}

/** Official-style petal colours for the Big Picture "Learning Flower" — the
 * tool BP students use to self-assess their six Learning Goals — keyed by
 * goal label so callers can pass LEARNING_GOALS straight through regardless
 * of order. Kept fixed (not theme-derived) since the Flower's colours are
 * part of what makes it recognisable. Exported so other Learning-Goal
 * visuals (e.g. the IBPLC progression scorecard in templates.ts) use the
 * same per-goal colour language instead of inventing their own. */
/**
 * The Big Picture Learning Flower — BPLA's real petal artwork (see
 * lib/flowerData.ts, sourced from the actual interactive tool, not an
 * approximation), one petal per Learning Goal, sized to that goal's real 1-5
 * progression level and independently editable live via the block's own
 * properties panel (see FlowerGraphFields in BlockPropertiesPanel). A
 * colour-coded legend sits alongside it since the real graphic itself
 * carries no text — same as the source.
 */
export function flowerSlide(theme: Theme, heading: string, goals: { icon: string; label: string }[]): Slide {
  const legendRegion: Region = { x: 58, y: 26, w: 36, h: 62 }
  const rowH = legendRegion.h / Math.max(1, goals.length)
  const swatch = circle(2.6)

  const blocks: Slide['blocks'] = [
    makeShapeBlock({ x: 8, y: 7, w: 9, h: 0.9, color: theme.accent, radius: 50 }),
    makeTextBlock({ content: heading, x: 8, y: 9, w: 84, h: 14, fontSize: 32, fontWeight: 'bold', color: theme.primaryDark }),
    makeFlowerGraphBlock({ x: 4, y: 22, w: 50, h: 74 }),
  ]

  goals.slice(0, 6).forEach((goal, i) => {
    const color = FLOWER_COLOR_BY_LABEL[goal.label] ?? theme.primary
    const rowY = legendRegion.y + i * rowH
    blocks.push(
      makeShapeBlock({ x: legendRegion.x, y: rowY + rowH / 2 - swatch.h / 2, w: swatch.w, h: swatch.h, color, radius: 50 }),
      makeTextBlock({
        content: `${goal.icon}  ${goal.label}`,
        x: legendRegion.x + 4,
        y: rowY,
        w: legendRegion.w - 4,
        h: rowH,
        fontSize: 14,
        fontWeight: 'bold',
        valign: 'middle',
        color: '#211f1a',
      }),
    )
  })

  blocks.push(
    makeTextBlock({
      content: 'One petal per Learning Goal, its length set by your real progression level — select the flower to edit each level live.',
      x: legendRegion.x,
      y: 88,
      w: legendRegion.w,
      h: 10,
      fontSize: 12,
      color: '#6b6b6b',
    }),
  )

  return makeSlide({ transition: 'zoom', background: '#ffffff', blocks })
}

/** A big centred number/quote — for stats, or a single memorable line. */
export function statSlide(theme: Theme, big: string, caption: string): Slide {
  const glow = circle(44)
  return makeSlide({
    transition: 'zoom',
    background: theme.surfaceTint,
    blocks: [
      makeShapeBlock({ x: 30, y: 22, w: glow.w, h: glow.h, color: theme.primary, gradientTo: theme.primaryDark, gradientAngle: 120, radius: 50, opacity: 0.14 }),
      makeTextBlock({
        content: big,
        x: 10,
        y: 30,
        w: 80,
        h: 32,
        fontSize: 64,
        fontWeight: 'bold',
        align: 'center',
        valign: 'bottom',
        color: theme.primaryDark,
      }),
      makeShapeBlock({ x: 44, y: 60, w: 12, h: 0.8, color: theme.accent, radius: 50, shadow: true }),
      makeTextBlock({
        content: caption,
        x: 15,
        y: 64,
        w: 70,
        h: 14,
        fontSize: 20,
        align: 'center',
        valign: 'top',
        color: '#211f1a',
      }),
    ],
  })
}

/** Heading + framed, shadowed placeholder cards — each with a glossy "+" badge — students replace with real photos/videos/files. */
export function evidenceSlide(theme: Theme, heading: string, labels: string[] = ['Photo / video', 'Document', 'Link / QR code']): Slide {
  const region: Region = { x: 6, y: 30, w: 88, h: 58 }
  const cells = gridLayout(labels.length, region, 4, 5)
  const badge = circle(7)
  const blocks: Slide['blocks'] = [
    makeShapeBlock({ x: 8, y: 7, w: 9, h: 0.9, color: theme.accent, radius: 50 }),
    makeTextBlock({ content: heading, x: 8, y: 9, w: 84, h: 14, fontSize: 36, fontWeight: 'bold', color: theme.primaryDark }),
  ]
  labels.forEach((label, i) => {
    const cell = cells[i]
    const bx = cell.x + cell.w / 2 - badge.w / 2
    const by = cell.y + cell.h * 0.22
    blocks.push(
      makeShapeBlock({ ...cell, color: theme.surfaceTint, radius: 8 }),
      makeShapeBlock({ x: cell.x + 3, y: cell.y + 3, w: cell.w - 6, h: cell.h - 6, color: '#ffffff', radius: 6, shadow: true }),
      makeShapeBlock({ x: bx, y: by, w: badge.w, h: badge.h, color: theme.primary, gradientTo: theme.primaryDark, radius: 50 }),
      makeTextBlock({ content: '+', x: bx, y: by, w: badge.w, h: badge.h, fontSize: 26, fontWeight: 'bold', align: 'center', valign: 'middle', color: theme.onPrimary }),
      makeTextBlock({
        content: label,
        x: cell.x,
        y: cell.y + cell.h * 0.58,
        w: cell.w,
        h: cell.h * 0.36,
        fontSize: 15,
        align: 'center',
        valign: 'top',
        color: theme.primaryDark,
      }),
    )
  })
  return makeSlide({ transition: 'fade', background: '#ffffff', blocks })
}

/** Heading + a left-to-right row of numbered steps on a connecting timeline. */
export function timelineSlide(theme: Theme, heading: string, steps: string[]): Slide {
  const region: Region = { x: 6, y: 34, w: 88, h: 50 }
  const cells = gridLayout(steps.length, region, 3, 6)
  const bubble = circle(7)
  const blocks: Slide['blocks'] = [
    makeShapeBlock({ x: 8, y: 7, w: 9, h: 0.9, color: theme.accent, radius: 50 }),
    makeTextBlock({ content: heading, x: 8, y: 9, w: 84, h: 14, fontSize: 36, fontWeight: 'bold', color: theme.primaryDark }),
  ]
  if (cells.length > 1) {
    const firstCx = cells[0].x + cells[0].w / 2
    const lastCx = cells[cells.length - 1].x + cells[cells.length - 1].w / 2
    blocks.push(
      makeShapeBlock({ x: firstCx, y: cells[0].y + bubble.h / 2 - 0.15, w: lastCx - firstCx, h: 0.3, color: theme.surfaceTint, radius: 50 }),
    )
  }
  steps.forEach((step, i) => {
    const cell = cells[i]
    const cx = cell.x + cell.w / 2 - bubble.w / 2
    blocks.push(
      makeShapeBlock({ x: cx, y: cell.y, w: bubble.w, h: bubble.h, color: theme.primary, gradientTo: theme.primaryDark, radius: 50, shadow: true }),
      makeTextBlock({
        content: String(i + 1),
        x: cx,
        y: cell.y,
        w: bubble.w,
        h: bubble.h,
        fontSize: 22,
        fontWeight: 'bold',
        align: 'center',
        valign: 'middle',
        color: theme.onPrimary,
      }),
      makeTextBlock({
        content: step,
        x: cell.x,
        y: cell.y + bubble.h + 2,
        w: cell.w,
        h: cell.h - bubble.h - 2,
        fontSize: 15,
        align: 'center',
        valign: 'top',
        color: '#211f1a',
      }),
    )
  })
  return makeSlide({ transition: 'slide-left', background: '#ffffff', blocks })
}

/** The heading+bullets "content" layouts, as a picker-friendly registry — used
 * both to redesign an existing slide (Editor) and to give industry packs
 * genuinely different looks rather than reusing one layout with new words. */
export const CONTENT_STYLES: { id: string; name: string; build: (theme: Theme, heading: string, bullets: string[]) => Slide }[] = [
  { id: 'band', name: 'Colour band', build: (t, h, b) => splitSlide(t, h, b) },
  { id: 'band-mirrored', name: 'Colour band (right)', build: (t, h, b) => splitSlide(t, h, b, { mirrored: true }) },
  { id: 'bar', name: 'Accent bar', build: (t, h, b) => bulletSlide(t, h, b) },
  { id: 'cover', name: 'Bold cover', build: coverSlide },
  { id: 'cards', name: 'Grid cards', build: gridCardSlide },
]
