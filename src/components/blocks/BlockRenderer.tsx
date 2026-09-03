import { useAssetUrl } from '../../lib/hooks'
import { SHAPE_CLIP_PATHS } from '../../lib/shapes'
import MeshViewer from '../MeshViewer'
import FileBlockContent from './FileBlockContent'
import FlowerGraphBlock from './FlowerGraphBlock'
import IconBlockContent from './IconBlockContent'
import MathBlockContent from './MathBlockContent'
import type { Block } from '../../types'

/** Read-only visual rendering of a single block's content. Used by the editor canvas, thumbnails, and Present mode alike.
 * `scale` is the ratio of the slide's actual on-screen size to its authored
 * 1280x720 canvas (see types.ts) — text is authored in real px, so it has to
 * be scaled explicitly, or a thumbnail renders it wildly oversized. */
export default function BlockRenderer({ block, interactive, scale = 1 }: { block: Block; interactive: boolean; scale?: number }) {
  switch (block.type) {
    case 'text': {
      const textStyle = {
        fontSize: block.fontSize * scale,
        fontWeight: block.fontWeight,
        textAlign: block.align,
        color: block.color,
        lineHeight: 1.35,
        textDecoration: block.href ? 'underline' : undefined,
        letterSpacing: block.letterSpacing ? `${block.letterSpacing * scale}px` : undefined,
      } as const
      return (
        <div
          className="flex h-full w-full overflow-hidden"
          style={{
            alignItems: block.valign === 'middle' ? 'center' : block.valign === 'bottom' ? 'flex-end' : 'flex-start',
          }}
        >
          {block.href ? (
            <a
              href={block.href}
              target="_blank"
              rel="noreferrer"
              className="w-full whitespace-pre-wrap"
              style={{ ...textStyle, pointerEvents: interactive ? 'auto' : 'none' }}
              onClick={(e) => e.stopPropagation()}
            >
              {block.content}
            </a>
          ) : (
            <div className="w-full whitespace-pre-wrap" style={textStyle}>
              {block.content}
            </div>
          )}
        </div>
      )
    }
    case 'shape': {
      const kind = block.kind ?? 'rect'
      const clipPath = SHAPE_CLIP_PATHS[kind]
      return (
        <div
          className="h-full w-full"
          style={{
            background: block.gradientTo ? `linear-gradient(${block.gradientAngle ?? 135}deg, ${block.color}, ${block.gradientTo})` : block.color,
            opacity: block.opacity,
            borderRadius: clipPath ? undefined : `${block.radius}%`,
            clipPath,
            // A clip-path silhouette has hard, filled-shape edges already, so
            // a soft box-shadow around its full rectangular box would draw a
            // shadow shaped like a rectangle behind e.g. a star — visibly
            // wrong. Only 'rect' (where the box IS the shape) gets one.
            boxShadow: block.shadow && !clipPath ? '0 12px 28px -8px rgba(20, 20, 30, 0.32)' : undefined,
          }}
        />
      )
    }
    case 'image':
      return <ImageContent assetId={block.assetId} fit={block.fit} />
    case 'video':
      return <VideoContent block={block} interactive={interactive} />
    case 'audio':
      return <AudioContent block={block} interactive={interactive} />
    case 'embed':
      return <EmbedContent url={block.url} interactive={interactive} />
    case 'mesh':
      return <MeshContent block={block} />
    case 'drawing':
      return <ImageContent assetId={block.assetId} fit="contain" />
    case 'file':
      return <FileBlockContent block={block} interactive={interactive} />
    case 'icon':
      return <IconBlockContent block={block} />
    case 'math':
      return <MathBlockContent block={block} scale={scale} />
    case 'flowerGraph':
      return <FlowerGraphBlock block={block} />
    default:
      return null
  }
}

function ImageContent({ assetId, fit }: { assetId: string; fit: 'contain' | 'cover' }) {
  const url = useAssetUrl(assetId)
  if (!url) return <MediaPlaceholder label="Loading image…" />
  return <img src={url} alt="" className="h-full w-full" style={{ objectFit: fit }} draggable={false} />
}

function VideoContent({ block, interactive }: { block: Extract<Block, { type: 'video' }>; interactive: boolean }) {
  const url = useAssetUrl(block.assetId)
  if (!url) return <MediaPlaceholder label="Loading video…" />
  return (
    <video
      src={url}
      className="h-full w-full bg-black"
      controls={block.controls}
      autoPlay={block.autoplay && interactive}
      loop={block.loop}
      muted={block.autoplay}
      playsInline
    />
  )
}

function AudioContent({ block, interactive }: { block: Extract<Block, { type: 'audio' }>; interactive: boolean }) {
  const url = useAssetUrl(block.assetId)
  if (!url) return <MediaPlaceholder label="Loading audio…" />
  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
      <audio src={url} className="w-full px-2" controls autoPlay={block.autoplay && interactive} loop={block.loop} />
    </div>
  )
}

function EmbedContent({ url, interactive }: { url: string; interactive: boolean }) {
  return (
    <div className="relative h-full w-full">
      <iframe
        src={url}
        title="Embedded website"
        className="h-full w-full rounded-lg border-0"
        style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
      />
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="absolute bottom-1 right-1 rounded bg-black/60 px-2 py-0.5 text-[10px] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        Open in new tab ↗
      </a>
    </div>
  )
}

function MeshContent({ block }: { block: Extract<Block, { type: 'mesh' }> }) {
  const url = useAssetUrl(block.assetId)
  if (!url) return <MediaPlaceholder label="Loading model…" />
  return <MeshViewer url={url} format={block.format} wireframe={block.wireframe} autoRotate={block.autoRotate} />
}

function MediaPlaceholder({ label }: { label: string }) {
  return (
    <div
      className="flex h-full w-full items-center justify-center rounded-lg text-xs"
      style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}
    >
      {label}
    </div>
  )
}
