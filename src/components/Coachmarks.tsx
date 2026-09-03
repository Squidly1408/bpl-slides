import { useEffect, useLayoutEffect, useRef, useState } from 'react'

export interface CoachStep {
  /** The step's `data-tour` value(s) to spotlight, e.g. "new-project" for
   * `<button data-tour="new-project">`. Several UI elements — like the
   * editor's side panels, which become drawers below the `lg` breakpoint —
   * have a desktop and a mobile counterpart that are never both on screen
   * at once; passing both as an array spotlights whichever one actually is,
   * so the same tour step works at every viewport size instead of only
   * describing the desktop layout. Omit entirely for a plain centered
   * intro/outro card with no spotlight (typically the first or last step). */
  target?: string | string[]
  title: string
  body: string
  /** Preferred side for the tooltip — falls back automatically to whichever
   * side actually has room if this one doesn't. */
  placement?: 'top' | 'bottom' | 'left' | 'right'
}

type Side = 'top' | 'bottom' | 'left' | 'right'

const GAP = 14
const SPOTLIGHT_PAD = 8
const VIEWPORT_MARGIN = 12

function pickSide(rect: DOMRect, preferred: Side, tw: number, th: number): Side {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const space: Record<Side, number> = {
    bottom: vh - rect.bottom,
    top: rect.top,
    right: vw - rect.right,
    left: rect.left,
  }
  const fits: Record<Side, boolean> = {
    bottom: space.bottom >= th + GAP,
    top: space.top >= th + GAP,
    right: space.right >= tw + GAP,
    left: space.left >= tw + GAP,
  }
  if (fits[preferred]) return preferred
  const bySpace = (['bottom', 'top', 'right', 'left'] as Side[]).sort((a, b) => space[b] - space[a])
  return bySpace.find((s) => fits[s]) ?? bySpace[0]
}

/** Resolves a step's target to whichever named element is actually visible
 * right now — the first candidate (in order) with a real layout box, since
 * a desktop-only and mobile-only counterpart are never both present at
 * once. Returns null if none of them are (e.g. mid-viewport-resize, or the
 * step doesn't target anything). */
function resolveTarget(target: string | string[] | undefined): HTMLElement | null {
  if (!target) return null
  for (const name of Array.isArray(target) ? target : [target]) {
    const el = document.querySelector<HTMLElement>(`[data-tour="${name}"]`)
    if (el && el.offsetParent !== null) return el
  }
  return null
}

function tooltipPosition(rect: DOMRect, side: Side, tw: number, th: number) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const clamp = (v: number, max: number) => Math.min(Math.max(v, VIEWPORT_MARGIN), Math.max(VIEWPORT_MARGIN, max))
  if (side === 'bottom' || side === 'top') {
    const top = side === 'bottom' ? rect.bottom + GAP : rect.top - th - GAP
    const left = clamp(rect.left + rect.width / 2 - tw / 2, vw - tw - VIEWPORT_MARGIN)
    return { top: clamp(top, vh - th - VIEWPORT_MARGIN), left }
  }
  const left = side === 'right' ? rect.right + GAP : rect.left - tw - GAP
  const top = clamp(rect.top + rect.height / 2 - th / 2, vh - th - VIEWPORT_MARGIN)
  return { top, left: clamp(left, vw - tw - VIEWPORT_MARGIN) }
}

/**
 * A short, skippable spotlight tour over the *real* UI — dims everything
 * but the current step's target element (matched by its `data-tour`
 * attribute) and shows a positioned tooltip next to it, rather than a
 * generic modal carousel describing features in the abstract.
 *
 * A step whose target isn't on screen right now (off-screen in a mobile
 * drawer, not yet rendered, etc.) is skipped automatically rather than
 * shown pointing at nothing.
 */
export default function Coachmarks({ steps, onFinish }: { steps: CoachStep[]; onFinish: () => void }) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  const [pos, setPos] = useState<{ top: number; left: number; side: Side } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const step = steps[index]

  // Locate + measure the current step's target, skipping straight past any
  // step whose element isn't actually visible right now. useLayoutEffect
  // (not useEffect) so this resolves before paint — otherwise, for one
  // frame, the spotlight would still be at the *previous* step's element
  // while the tooltip text has already moved on to the new one.
  useLayoutEffect(() => {
    if (!step) return
    if (!step.target) {
      setRect(null)
      return
    }
    const el = resolveTarget(step.target)
    const r = el?.getBoundingClientRect()
    if (!r || r.width === 0 || r.height === 0) {
      if (index < steps.length - 1) setIndex(index + 1)
      else onFinish()
      return
    }
    setRect(r)
  }, [index, step, steps.length, onFinish])

  // Keep the spotlight glued to its target through scrolling/resizing — and,
  // since a resize can cross the desktop/mobile breakpoint mid-tour, re-run
  // target resolution too rather than re-measuring the same element.
  useEffect(() => {
    if (!step?.target) return
    function remeasure() {
      const el = resolveTarget(step!.target)
      if (el) setRect(el.getBoundingClientRect())
    }
    window.addEventListener('resize', remeasure)
    window.addEventListener('scroll', remeasure, true)
    return () => {
      window.removeEventListener('resize', remeasure)
      window.removeEventListener('scroll', remeasure, true)
    }
  }, [step])

  // Two-pass positioning: the tooltip renders (off-screen the very first
  // time) at its natural size, then this measures it and places it on
  // whichever side of the target actually has room — synchronously, before
  // paint, so there's no visible jump.
  useLayoutEffect(() => {
    if (!rect) {
      setPos(null)
      return
    }
    const el = tooltipRef.current
    const tw = el?.offsetWidth ?? 300
    const th = el?.offsetHeight ?? 150
    const side = pickSide(rect, step?.placement ?? 'bottom', tw, th)
    setPos({ ...tooltipPosition(rect, side, tw, th), side })
  }, [rect, step])

  if (!step) return null
  const last = index === steps.length - 1

  function next() {
    if (last) onFinish()
    else setIndex(index + 1)
  }

  const card = (
    <div ref={tooltipRef} className="w-[300px] rounded-xl p-4" style={{ background: 'var(--color-surface)', boxShadow: 'var(--shadow-lg)' }}>
      <h3 className="mb-1.5 text-sm font-semibold">{step.title}</h3>
      <p className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
        {step.body}
      </p>
      <div className="mb-3 flex items-center gap-1.5">
        {steps.map((_, i) => (
          <span
            key={i}
            className="h-1.5 rounded-full"
            style={{ width: i === index ? 16 : 6, background: i === index ? 'var(--color-primary)' : 'var(--color-border)' }}
          />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button onClick={onFinish} className="rounded-lg px-2 py-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Skip
        </button>
        <div className="flex gap-2">
          {index > 0 && (
            <button
              onClick={() => setIndex(index - 1)}
              className="rounded-lg border px-3 py-1.5 text-xs font-medium"
              style={{ borderColor: 'var(--color-border)' }}
            >
              Back
            </button>
          )}
          <button onClick={next} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
            {last ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50">
      {/* Click-catcher: keeps the tour click-driven (Next/Back/Skip) rather
          than letting a stray click on the dimmed page do something the
          tour doesn't expect. */}
      <div className="absolute inset-0" onMouseDown={(e) => e.preventDefault()} />
      {rect && (
        <div
          className="pointer-events-none absolute rounded-xl transition-all duration-200"
          style={{
            top: rect.top - SPOTLIGHT_PAD,
            left: rect.left - SPOTLIGHT_PAD,
            width: rect.width + SPOTLIGHT_PAD * 2,
            height: rect.height + SPOTLIGHT_PAD * 2,
            boxShadow: '0 0 0 9999px rgba(10, 14, 26, 0.6)',
          }}
        />
      )}
      {!rect && <div className="absolute inset-0" style={{ background: 'rgba(10, 14, 26, 0.6)' }} />}
      <div
        className="absolute flex items-center justify-center"
        style={
          pos
            ? { top: pos.top, left: pos.left }
            : rect
              ? { top: -9999, left: -9999 } // measuring pass — not visible yet
              : { inset: 0 }
        }
      >
        {card}
      </div>
    </div>
  )
}
