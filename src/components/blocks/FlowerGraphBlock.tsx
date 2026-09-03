import { DEFAULT_FLOWER_LEVEL, FLOWER_CENTER, FLOWER_GOALS, FLOWER_RING_RADII, FLOWER_ROTATION_DEG, FLOWER_VIEWBOX, flowerLevelToScale } from '../../lib/flowerData'
import type { Block } from '../../types'

/**
 * The Big Picture Learning Flower, rendered from BPLA's real petal artwork —
 * see lib/flowerData.ts for where every path/colour/ring radius comes from.
 * Each petal's `transform: scale(...)` + `transformOrigin: center` exactly
 * mirrors the source tool's own approach (a CSS transform driven by a
 * slider), so it scales the same way the real one does.
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
                style={{ transform: `scale(${scale})`, transformOrigin: 'center', transformBox: 'fill-box' }}
              />
            )
          })}
        </g>
      </g>
    </svg>
  )
}
