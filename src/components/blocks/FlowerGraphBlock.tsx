import { DEFAULT_FLOWER_LEVEL, FLOWER_CENTER, FLOWER_GOALS, FLOWER_RING_RADII, FLOWER_ROTATION_DEG, FLOWER_VIEWBOX, flowerLevelToScale } from '../../lib/flowerData'
import type { Block } from '../../types'

/**
 * The Big Picture Learning Flower, rendered from BPLA's real petal artwork —
 * see lib/flowerData.ts for where every path/colour/ring radius comes from.
 * Each petal's `transform: scale(...)` mirrors the source tool's own
 * approach (a CSS transform driven by a slider).
 *
 * `transformBox: 'view-box'` is the important part: it makes `transform-
 * origin: center` resolve against the *whole SVG's viewBox* (so the
 * flower's actual centre point, 187.5/187.5) rather than each petal path's
 * own individual bounding box (the default 'fill-box' reference, and this
 * component's original — wrong — setting). With the wrong reference box,
 * every petal scaled from somewhere in the middle of its own teardrop
 * shape, so the narrow tip anchored at the flower's centre visibly drifted
 * as the level changed instead of staying put while the petal grew
 * outward from it, which is the whole point of a "petal length = level"
 * graphic.
 */
export default function FlowerGraphBlock({ block }: { block: Extract<Block, { type: 'flowerGraph' }> }) {
  return (
    <svg viewBox={`0 0 ${FLOWER_VIEWBOX} ${FLOWER_VIEWBOX}`} className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <g transform={`rotate(${FLOWER_ROTATION_DEG}, ${FLOWER_CENTER}, ${FLOWER_CENTER})`}>
        <g>
          {FLOWER_RING_RADII.map((r) => (
            <circle key={r} cx={FLOWER_CENTER} cy={FLOWER_CENTER} r={r} stroke="#adadad" strokeWidth={2.5} fill="none" />
          ))}
        </g>
        <g>
          {FLOWER_GOALS.map((goal) => {
            const level = block.levels[goal.label] ?? DEFAULT_FLOWER_LEVEL
            const scale = flowerLevelToScale(level)
            return (
              <path
                key={goal.label}
                d={goal.path}
                fill={goal.color}
                style={{ transform: `scale(${scale})`, transformOrigin: 'center', transformBox: 'view-box' }}
              />
            )
          })}
        </g>
      </g>
    </svg>
  )
}
