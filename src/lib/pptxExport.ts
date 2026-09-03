import pptxgen from 'pptxgenjs'
import { getAsset } from './db'
import { FLOWER_CENTER, FLOWER_GOALS, FLOWER_RING_RADII, FLOWER_ROTATION_DEG, FLOWER_VIEWBOX, flowerLevelToScale } from './flowerData'
import { getIcon } from './icons'
import type { Project, ShapeKind, Slide } from '../types'

// Our virtual slide canvas is 1280x720 "px" at an assumed 96dpi, which maps
// exactly onto a 13.333in x 7.5in (16:9) PowerPoint slide.
const SLIDE_W_IN = 13.333
const SLIDE_H_IN = 7.5

// PowerPoint has no built-in font that matches the app's UI font stack, so
// every text run is pinned to this instead of silently falling back to
// PowerPoint's own default (Calibri) — keeps at least one consistent,
// predictable typeface rather than an uncontrolled mismatch.
const PPTX_FONT_FACE = 'Arial'

function pctToIn(pct: number, totalIn: number) {
  return (pct / 100) * totalIn
}

function blobToDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function resolveBackground(slide: Slide): Promise<{ color?: string; data?: string }> {
  if (slide.backgroundAssetId) {
    const asset = await getAsset(slide.backgroundAssetId)
    if (asset) return { data: await blobToDataUri(asset.blob) }
  }
  const bg = slide.background?.startsWith('#') ? slide.background : '#FFFFFF'
  return { color: bg.replace('#', '') }
}

/** Exports a project to a .pptx file. Best-effort: text, shapes, images,
 * drawings, and embedded audio/video map to native PowerPoint objects
 * (position, rotation, background image, and image fit are all carried
 * over); 3D models and live website embeds become a labelled placeholder,
 * since PowerPoint has no equivalent — students can still present those live
 * from BPL Slides.
 *
 * Takes the Project object directly rather than an id + IndexedDB lookup —
 * autosave is debounced (~500ms), so re-reading from storage right after an
 * edit could still return the previous version and export something that
 * doesn't match what's on screen. */
export async function exportProjectToPptx(project: Project): Promise<void> {
  const pptx = new pptxgen()
  pptx.defineLayout({ name: 'BPL_16x9', width: SLIDE_W_IN, height: SLIDE_H_IN })
  pptx.layout = 'BPL_16x9'
  pptx.title = project.title

  // ShapeType values live on the pptxgen instance, not as a static export —
  // built here so the per-block loop below can just look a kind up by name.
  // 'line' isn't here: it's handled as a special case (see below) since
  // pptxgenjs's own LINE shape draws a corner-to-corner diagonal, not the
  // flat centred bar the editor actually shows.
  const PPTX_SHAPE_TYPE: Record<Exclude<ShapeKind, 'line'>, pptxgen.SHAPE_NAME> = {
    rect: pptx.ShapeType.roundRect,
    triangle: pptx.ShapeType.triangle,
    pentagon: pptx.ShapeType.pentagon,
    hexagon: pptx.ShapeType.hexagon,
    star: pptx.ShapeType.star5,
    arrow: pptx.ShapeType.rightArrow,
  }

  for (const slide of [...project.slides].sort((a, b) => a.order - b.order)) {
    const s = pptx.addSlide()
    s.background = await resolveBackground(slide)

    for (const block of [...slide.blocks].sort((a, b) => a.zIndex - b.zIndex)) {
      const x = pctToIn(block.x, SLIDE_W_IN)
      const y = pctToIn(block.y, SLIDE_H_IN)
      const w = pctToIn(block.w, SLIDE_W_IN)
      const h = pctToIn(block.h, SLIDE_H_IN)
      const rotate = block.rotation || undefined

      if (block.type === 'text') {
        s.addText(block.content, {
          x,
          y,
          w,
          h,
          rotate,
          fontFace: PPTX_FONT_FACE,
          fontSize: Math.round(block.fontSize * 0.75),
          bold: block.fontWeight === 'bold',
          align: block.align,
          valign: block.valign,
          lineSpacingMultiple: 1.35,
          color: block.color.replace('#', ''),
          underline: block.href ? {} : undefined,
          hyperlink: block.href ? { url: block.href } : undefined,
          // pptxgenjs takes this in points, the DOM CSS in px — close enough at
          // slide scale that the letter-spaced "eyebrow" labels still read as
          // deliberately tracked-out rather than collapsing back to default.
          charSpacing: block.letterSpacing || undefined,
        })
      } else if (block.type === 'shape') {
        const kind = block.kind ?? 'rect'
        const fill = {
          // pptxgenjs shape fills don't support a true gradient, so a
          // gradient block exports as a flat fill in the middle of its two
          // colours — a reasonable approximation rather than losing the
          // colour entirely.
          color: (block.gradientTo ? midColor(block.color, block.gradientTo) : block.color).replace('#', ''),
          transparency: Math.round((1 - block.opacity) * 100),
        }
        const shadow = block.shadow ? ({ type: 'outer', color: '141419', opacity: 0.35, blur: 10, offset: 4, angle: 90 } as const) : undefined
        if (kind === 'line') {
          // Matches the on-screen rendering (BlockRenderer's `inset(42% ... round)`
          // clip-path) by shrinking the box to that same thin centred band,
          // rather than pptxgenjs's LINE shape (a diagonal corner-to-corner
          // line, which looks nothing like the flat bar shown in the editor).
          s.addShape(pptx.ShapeType.roundRect, { x, y: y + h * 0.42, w, h: h * 0.16, rotate, rectRadius: h * 0.08, fill, shadow })
        } else {
          s.addShape(PPTX_SHAPE_TYPE[kind], {
            x,
            y,
            w,
            h,
            rotate,
            rectRadius: kind === 'rect' ? (block.radius / 100) * Math.min(w, h) : undefined,
            fill,
            shadow,
          })
        }
      } else if (block.type === 'image' || block.type === 'drawing') {
        const asset = await getAsset(block.assetId)
        if (!asset) continue
        const data = await blobToDataUri(asset.blob)
        const fit = block.type === 'image' ? block.fit : 'contain'
        s.addImage({ data, x, y, w, h, rotate, sizing: { type: fit === 'cover' ? 'cover' : 'contain', w, h } })
      } else if (block.type === 'video') {
        const asset = await getAsset(block.assetId)
        if (!asset) continue
        const data = await blobToDataUri(asset.blob)
        s.addMedia({ type: 'video', data, x, y, w, h })
      } else if (block.type === 'audio') {
        const asset = await getAsset(block.assetId)
        if (!asset) continue
        const data = await blobToDataUri(asset.blob)
        s.addMedia({ type: 'audio', data, x, y, w, h })
      } else if (block.type === 'embed') {
        s.addText([{ text: block.url, options: { hyperlink: { url: block.url } } }], {
          x,
          y,
          w,
          h,
          rotate,
          fontFace: PPTX_FONT_FACE,
          fontSize: 14,
          align: 'center',
          valign: 'middle',
          fill: { color: 'F0EEE7' },
        })
      } else if (block.type === 'mesh') {
        s.addText(`3D model (${block.format.toUpperCase()}) — open this deck in BPL Slides to view it interactively.`, {
          x,
          y,
          w,
          h,
          rotate,
          fontFace: PPTX_FONT_FACE,
          fontSize: 12,
          italic: true,
          align: 'center',
          valign: 'middle',
          fill: { color: '1C1C1C' },
          color: 'FFFFFF',
        })
      } else if (block.type === 'file') {
        const asset = await getAsset(block.assetId)
        s.addText(`📄 ${asset?.name ?? (block.fileKind === 'pdf' ? 'PDF' : 'Word document')} — open this deck in BPL Slides to view it.`, {
          x,
          y,
          w,
          h,
          rotate,
          fontFace: PPTX_FONT_FACE,
          fontSize: 12,
          italic: true,
          align: 'center',
          valign: 'middle',
          fill: { color: 'F0EEE7' },
        })
      } else if (block.type === 'icon') {
        const icon = await getIcon(block.iconName)
        if (!icon) continue
        const data = await rasterizeSvg(`<path d="${icon.path}" fill="${block.color}"/>`, icon.width, icon.height)
        s.addImage({ data, x, y, w, h, rotate, sizing: { type: 'contain', w, h } })
      } else if (block.type === 'flowerGraph') {
        const data = await rasterizeSvg(flowerGraphInnerSvg(block.levels), FLOWER_VIEWBOX, FLOWER_VIEWBOX)
        s.addImage({ data, x, y, w, h, rotate, sizing: { type: 'contain', w, h } })
      } else if (block.type === 'math') {
        // KaTeX renders to DOM/CSS, not a simple path, so faithfully
        // rasterizing it without a heavier DOM-to-canvas dependency isn't
        // practical — a labelled placeholder, same as the mesh/embed blocks
        // above, is the honest trade-off here.
        s.addText(block.latex ? `∑ ${block.latex}` : 'Maths expression', {
          x,
          y,
          w,
          h,
          rotate,
          fontFace: PPTX_FONT_FACE,
          fontSize: 12,
          italic: true,
          align: 'center',
          valign: 'middle',
          fill: { color: 'F0EEE7' },
        })
      }
    }
  }

  await pptx.writeFile({ fileName: `${safeFileName(project.title)}.pptx` })
}

function safeFileName(title: string) {
  return title.replace(/[^a-z0-9\- _]/gi, '').trim() || 'presentation'
}

/** Midpoint between two hex colours — used to approximate a CSS gradient as a single flat pptx fill. */
function midColor(a: string, b: string): string {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  if (!pa || !pb) return a
  const mix = (x: number, y: number) => Math.round((x + y) / 2)
  return `#${[mix(pa[0], pb[0]), mix(pa[1], pb[1]), mix(pa[2], pb[2])].map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex)
  if (!m) return null
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)]
}

/** The flower's rings + petals as inner SVG markup (no outer <svg> tag) — shared between the live BlockRenderer and this export path so the two never drift apart. */
function flowerGraphInnerSvg(levels: Record<string, number>): string {
  const rings = FLOWER_RING_RADII.map((r) => `<circle cx="${FLOWER_CENTER}" cy="${FLOWER_CENTER}" r="${r}" stroke="#adadad" stroke-width="2.5" fill="none"/>`).join('')
  const petals = FLOWER_GOALS.map((goal) => {
    const scale = flowerLevelToScale(levels[goal.label] ?? 3)
    return `<path d="${goal.path}" fill="${goal.color}" style="transform:scale(${scale});transform-origin:center;transform-box:fill-box"/>`
  }).join('')
  return `<g transform="rotate(${FLOWER_ROTATION_DEG}, ${FLOWER_CENTER}, ${FLOWER_CENTER})"><g>${rings}</g><g>${petals}</g></g>`
}

/**
 * Rasterizes a snippet of inner SVG markup (no outer <svg> tag) to a PNG
 * data URI, at a fixed output size scaled up from the source viewBox for
 * crispness. Used for icon and Learning-Flower blocks — both are vector
 * paths, not DOM/CSS layout, so a real independent SVG rendering pass (via
 * an off-screen `Image`, which the browser rasterizes exactly like it would
 * any other SVG — including correctly honouring `transform-box: fill-box`)
 * gives a pixel-accurate result without hand-rolling any of that geometry.
 */
function rasterizeSvg(innerSvg: string, viewBoxW: number, viewBoxH: number): Promise<string> {
  const scale = Math.min(4, 900 / Math.max(viewBoxW, viewBoxH))
  const outW = Math.round(viewBoxW * scale)
  const outH = Math.round(viewBoxH * scale)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${viewBoxW} ${viewBoxH}" width="${outW}" height="${outH}">${innerSvg}</svg>`
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = outW
      canvas.height = outH
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('canvas 2d context unavailable'))
        return
      }
      ctx.drawImage(img, 0, 0, outW, outH)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = () => reject(new Error('failed to rasterize svg'))
    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`
  })
}
