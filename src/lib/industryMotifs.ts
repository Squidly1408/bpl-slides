import { makeShapeBlock } from './blocks'
import { circle } from './layouts'
import type { Theme } from './themes'
import type { Block } from '../types'

/**
 * A small, low-opacity decorative composition per industry — built entirely
 * from shape blocks (so it exports to .pptx faithfully, unlike a tinted
 * emoji) — dropped in behind the "Skills & Tools" and "Evidence" slides so
 * each industry pack reads as visually its own, not the same layout
 * recoloured.
 *
 * Confined to the header strip to the right of the heading (roughly
 * x:64-98, y:4-26) — the one patch of empty canvas that's genuinely
 * consistent across every content style (band/cover/cards/bar all still
 * share the same plain heading row on these two slide types). An earlier
 * version lived in the bottom-right corner instead, which looked right for
 * the "band"-style industries but got fully hidden behind the opaque
 * card/grid content on "cover" and "cards" styles — invisible for over half
 * the industries. This region is never covered by anything.
 */

/** A ring/annulus: an outer filled circle with a smaller circle of `holeColor` on top, so only a band shows. */
function ring(cx: number, cy: number, outerD: number, innerD: number, color: string, holeColor: string, opacity: number): Block[] {
  const o = circle(outerD)
  const i = circle(innerD)
  return [
    makeShapeBlock({ x: cx - o.w / 2, y: cy - o.h / 2, w: o.w, h: o.h, color, radius: 50, opacity }),
    makeShapeBlock({ x: cx - i.w / 2, y: cy - i.h / 2, w: i.w, h: i.h, color: holeColor, radius: 50, opacity: 1 }),
  ]
}

function dot(cx: number, cy: number, d: number, color: string, opacity: number): Block {
  const c = circle(d)
  return makeShapeBlock({ x: cx - c.w / 2, y: cy - c.h / 2, w: c.w, h: c.h, color, radius: 50, opacity })
}

function bar(x: number, y: number, w: number, h: number, color: string, opacity: number, rotation = 0, radius = 50): Block {
  return makeShapeBlock({ x, y, w, h, color, radius, opacity, rotation })
}

type MotifBuilder = (theme: Theme) => Block[]

const MOTIFS: Record<string, MotifBuilder> = {
  // Short diagonal hazard stripes.
  trades: (theme) => [theme.accent, theme.primary, theme.accent].map((c, i) => bar(70 + i * 7, 10, 14, 2.2, c, 0.16, -34, 2)),

  // Pulse ring + a small cross.
  health: (theme) => [...ring(88, 15, 15, 10, theme.primary, '#ffffff', 0.12), bar(87, 9, 2.4, 10, theme.primary, 0.16, 0, 50), bar(83, 13.5, 10, 2.4, theme.primary, 0.16, 0, 50)],

  // Paint-dot cluster.
  creative: (theme) => [dot(78, 12, 8, theme.accent, 0.18), dot(88, 8, 5, theme.primary, 0.16), dot(92, 18, 6, theme.primary, 0.13), dot(72, 20, 4, theme.accent, 0.2)],

  // Ascending mini bar chart.
  business: (theme) => [5, 8, 11, 14].map((h, i) => bar(66 + i * 7, 24 - h, 5, h, theme.primary, 0.16, 0, 2)),

  // Circuit trace with node dots.
  it: (theme) => [
    bar(66, 10, 18, 1.2, theme.accent, 0.22, 0, 0),
    bar(83, 10, 1.2, 12, theme.accent, 0.22, 0, 0),
    bar(70, 21, 13, 1.2, theme.primary, 0.22, 0, 0),
    dot(66, 10.6, 2.2, theme.accent, 0.34),
    dot(83.6, 21.6, 2.2, theme.primary, 0.34),
  ],

  // Atom: nucleus, three tilted orbit lines, three electrons.
  science: (theme) => [
    bar(68, 15, 24, 0.9, theme.primary, 0.2, 0),
    bar(68, 15, 24, 0.9, theme.accent, 0.2, 55),
    bar(68, 15, 24, 0.9, theme.primary, 0.2, -55),
    dot(80, 15, 6, theme.primaryDark, 0.22),
    dot(92, 15, 3, theme.accent, 0.38),
    dot(70, 8, 3, theme.primary, 0.38),
  ],

  // Stacked book spines.
  education: (theme) => {
    const widths = [20, 16, 18]
    const colors = [theme.primary, theme.accent, theme.primaryDark]
    let y = 6
    return widths.map((w, i) => {
      const b = bar(96 - w, y, w, 5.4, colors[i], 0.18, 0, 20)
      y += 6.6
      return b
    })
  },

  // Plate rim + garnish dots.
  hospitality: (theme) => [...ring(85, 15, 18, 13, theme.primary, '#ffffff', 0.13), dot(85, 10, 2, theme.accent, 0.3), dot(80, 18, 2, theme.accent, 0.3), dot(90, 18, 2, theme.accent, 0.3)],

  // Eight-point gear star (two overlapping squares) + a tiny blueprint dot grid.
  engineering: (theme) => {
    const blocks: Block[] = [bar(74, 8, 13, 13, theme.primary, 0.14, 0, 12), bar(74, 8, 13, 13, theme.primary, 0.14, 45, 12)]
    for (let gx = 0; gx < 2; gx++) for (let gy = 0; gy < 2; gy++) blocks.push(dot(90 + gx * 4, 8 + gy * 4, 1.2, theme.accent, 0.26))
    return blocks
  },

  // Diagonal motion stripes + a ring badge.
  sport: (theme) => [bar(66, 22, 18, 2, theme.primary, 0.16, -18, 2), bar(70, 16, 16, 2, theme.accent, 0.18, -18, 2), bar(74, 10, 14, 2, theme.primary, 0.16, -18, 2), ...ring(92, 12, 10, 6.5, theme.accent, '#ffffff', 0.2)],
}

export function buildIndustryMotif(industryId: string, theme: Theme): Block[] {
  return (MOTIFS[industryId] ?? (() => []))(theme)
}
