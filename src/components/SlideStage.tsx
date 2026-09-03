import { useEffect, useRef, useState } from 'react'
import BlockRenderer from './blocks/BlockRenderer'
import { useAssetUrl } from '../lib/hooks'
import { SLIDE_W } from '../types'
import type { Block, Slide } from '../types'

interface DragState {
  blockId: string
  mode: 'move' | 'resize'
  startX: number
  startY: number
  origin: { x: number; y: number; w: number; h: number }
}

interface Guides {
  v: number[]
  h: number[]
}

const NO_GUIDES: Guides = { v: [], h: [] }
/** How close (in % of the slide) a moving edge has to get to a target before it snaps — Canva-style: a soft pull near alignment, not a rigid grid. */
const SNAP_THRESHOLD = 1.2

/** Finds the nearest snap target (slide centre/edges + other blocks' edges & centres) to `pos`/`pos+size/2`/`pos+size`, and returns the adjusted position plus the guide line to draw, if anything is close enough. */
function snapAxis(pos: number, size: number, siblings: Block[], axis: 'x' | 'y'): { pos: number; guide: number | null } {
  const selfEdges = [pos, pos + size / 2, pos + size]
  const targets = new Set<number>([0, 50, 100])
  for (const b of siblings) {
    const start = axis === 'x' ? b.x : b.y
    const dim = axis === 'x' ? b.w : b.h
    targets.add(start)
    targets.add(start + dim / 2)
    targets.add(start + dim)
  }

  let best: { delta: number; target: number } | null = null
  for (const target of targets) {
    for (const edge of selfEdges) {
      const delta = target - edge
      if (Math.abs(delta) <= SNAP_THRESHOLD && (!best || Math.abs(delta) < Math.abs(best.delta))) {
        best = { delta, target }
      }
    }
  }
  return best ? { pos: pos + best.delta, guide: best.target } : { pos, guide: null }
}

export default function SlideStage({
  slide,
  editable,
  interactive,
  selectedBlockId,
  onSelectBlock,
  onChangeBlock,
  onDeleteBlock,
  className,
  children,
}: {
  slide: Slide
  editable: boolean
  interactive: boolean
  selectedBlockId?: string | null
  onSelectBlock?: (id: string | null) => void
  onChangeBlock?: (blockId: string, patch: Partial<Block>) => void
  onDeleteBlock?: (blockId: string) => void
  className?: string
  /** extra overlay content (e.g. a drawing annotation layer) rendered above the blocks */
  children?: React.ReactNode
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)
  const bgUrl = useAssetUrl(slide.backgroundAssetId)

  // Blocks are authored against a fixed 1280x720 canvas (see types.ts) and
  // rendered at that native size always, then the whole thing is scaled down
  // via CSS transform to whatever pixel size the container actually is. This
  // is what makes thumbnails (and any other small preview) a faithful,
  // proportionally-correct miniature instead of clipping/oversized text —
  // percent-based block positions scale fine on their own, but a block's
  // fontSize is authored in real px and only scales correctly this way.
  const [scale, setScale] = useState(1)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width) setScale(width / SLIDE_W)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Keep the latest callback prop (and slide, for sibling snap targets) in a
  // ref so the stable window listener functions below never go stale, and so
  // add/remove always target the same function identity (re-renders during a
  // drag must not leak listeners).
  const onChangeBlockRef = useRef(onChangeBlock)
  useEffect(() => {
    onChangeBlockRef.current = onChangeBlock
  }, [onChangeBlock])
  const onDeleteBlockRef = useRef(onDeleteBlock)
  useEffect(() => {
    onDeleteBlockRef.current = onDeleteBlock
  }, [onDeleteBlock])
  const slideRef = useRef(slide)
  useEffect(() => {
    slideRef.current = slide
  }, [slide])

  const [guides, setGuides] = useState<Guides>(NO_GUIDES)
  // Set while a block is being dragged (moved, not resized) and is at least
  // partly off the slide — drives the fade-toward-deletion opacity below.
  // Keyed by block id (rather than a plain boolean) so the right block fades
  // even though `dragRef` itself isn't reactive.
  const [dragOverhang, setDragOverhang] = useState<{ blockId: string; visibleFraction: number } | null>(null)

  const handleDragMoveRef = useRef((e: PointerEvent) => {
    const drag = dragRef.current
    const container = containerRef.current
    if (!drag || !container) return
    const rect = container.getBoundingClientRect()
    const dxPct = ((e.clientX - drag.startX) / rect.width) * 100
    const dyPct = ((e.clientY - drag.startY) / rect.height) * 100

    if (drag.mode === 'move') {
      // Deliberately unclamped (unlike resize below) — a block can be
      // dragged partway off any edge, and gets deleted outright the instant
      // it has no overlap left with the slide at all (see below), so there
      // is no "out of bounds" position left to clamp against.
      let x = drag.origin.x + dxPct
      let y = drag.origin.y + dyPct
      const siblings = slideRef.current.blocks.filter((b) => b.id !== drag.blockId)
      const snapX = snapAxis(x, drag.origin.w, siblings, 'x')
      const snapY = snapAxis(y, drag.origin.h, siblings, 'y')
      x = snapX.pos
      y = snapY.pos

      const overlapW = Math.max(0, Math.min(x + drag.origin.w, 100) - Math.max(x, 0))
      const overlapH = Math.max(0, Math.min(y + drag.origin.h, 100) - Math.max(y, 0))
      if (overlapW <= 0 || overlapH <= 0) {
        // Fully off the slide — drop it right here rather than waiting for
        // the pointer to come up, so the deletion reads as "let go of the
        // edge" rather than a separate confirming step.
        onDeleteBlockRef.current?.(drag.blockId)
        handleDragEndRef.current()
        return
      }
      const visibleFraction = (overlapW * overlapH) / (drag.origin.w * drag.origin.h)
      setDragOverhang(visibleFraction < 1 ? { blockId: drag.blockId, visibleFraction } : null)
      setGuides({ v: snapX.guide === null ? [] : [snapX.guide], h: snapY.guide === null ? [] : [snapY.guide] })
      onChangeBlockRef.current?.(drag.blockId, { x, y })
    } else {
      const w = clamp(drag.origin.w + dxPct, 4, 100 - drag.origin.x)
      const h = clamp(drag.origin.h + dyPct, 4, 100 - drag.origin.y)
      onChangeBlockRef.current?.(drag.blockId, { w, h })
    }
  })

  const handleDragEndRef = useRef(() => {
    dragRef.current = null
    setGuides(NO_GUIDES)
    setDragOverhang(null)
    window.removeEventListener('pointermove', handleDragMoveRef.current)
    window.removeEventListener('pointerup', handleDragEndRef.current)
  })

  function startDrag(e: React.PointerEvent, block: Block, mode: 'move' | 'resize') {
    if (!editable) return
    e.stopPropagation()
    onSelectBlock?.(block.id)
    dragRef.current = {
      blockId: block.id,
      mode,
      startX: e.clientX,
      startY: e.clientY,
      origin: { x: block.x, y: block.y, w: block.w, h: block.h },
    }
    window.addEventListener('pointermove', handleDragMoveRef.current)
    window.addEventListener('pointerup', handleDragEndRef.current)
  }

  return (
    <div
      ref={containerRef}
      onPointerDown={() => editable && onSelectBlock?.(null)}
      className={`relative h-full w-full overflow-hidden ${className ?? ''}`}
      style={{
        background: bgUrl ? `center/cover no-repeat url(${bgUrl})` : slide.background,
      }}
    >
      {[...slide.blocks]
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((block) => {
          const selected = editable && block.id === selectedBlockId
          const overhang = dragOverhang?.blockId === block.id ? dragOverhang : null
          return (
            <div
              key={block.id}
              onPointerDown={(e) => startDrag(e, block, 'move')}
              className="absolute"
              style={{
                left: `${block.x}%`,
                top: `${block.y}%`,
                width: `${block.w}%`,
                height: `${block.h}%`,
                transform: block.rotation ? `rotate(${block.rotation}deg)` : undefined,
                // Fades out as it's dragged past the slide's edge, telegraphing
                // that letting go now (or dragging further) deletes it — never
                // fully invisible while still present, so it doesn't look like
                // it vanished on its own before the actual deletion happens.
                opacity: overhang ? Math.max(0.25, overhang.visibleFraction) : 1,
                outline: selected ? '2px solid var(--color-primary)' : editable ? '1px dashed transparent' : 'none',
                cursor: editable ? 'move' : 'default',
                touchAction: editable ? 'none' : undefined,
              }}
            >
              <div className={editable ? 'pointer-events-none h-full w-full' : 'h-full w-full'}>
                <BlockRenderer block={block} interactive={interactive} scale={scale} />
              </div>
              {selected && (
                <>
                  {/* Inset (not poking outside the block box) so these never get clipped by the
                      canvas's overflow-hidden — a full-slide-sized block would otherwise render
                      them off-screen and unreachable. */}
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation()
                      onDeleteBlock?.(block.id)
                    }}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs text-white shadow"
                    style={{ background: 'var(--color-danger)', touchAction: 'none' }}
                    aria-label="Delete block"
                  >
                    ×
                  </button>
                  <div
                    onPointerDown={(e) => startDrag(e, block, 'resize')}
                    className="absolute bottom-1 right-1 h-4 w-4 cursor-se-resize rounded-sm border-2 shadow"
                    style={{ background: 'var(--color-primary)', borderColor: 'white', touchAction: 'none' }}
                  />
                </>
              )}
            </div>
          )
        })}
      {editable &&
        guides.v.map((v) => (
          <div key={`v${v}`} className="pointer-events-none absolute inset-y-0" style={{ left: `${v}%`, width: 1, background: '#ff4dc4' }} />
        ))}
      {editable &&
        guides.h.map((h) => (
          <div key={`h${h}`} className="pointer-events-none absolute inset-x-0" style={{ top: `${h}%`, height: 1, background: '#ff4dc4' }} />
        ))}
      {children}
    </div>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), Math.max(min, max))
}
