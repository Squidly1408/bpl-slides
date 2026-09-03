import { useIcon } from '../../lib/hooks'
import type { Block } from '../../types'

/** A single Font Awesome glyph — see lib/icons.ts. Renders nothing but a
 * blank box until the (dynamically-imported) icon set resolves. */
export default function IconBlockContent({ block }: { block: Extract<Block, { type: 'icon' }> }) {
  const icon = useIcon(block.iconName)
  if (!icon) return null
  return (
    <svg viewBox={`0 0 ${icon.width} ${icon.height}`} className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <path d={icon.path} fill={block.color} />
    </svg>
  )
}
