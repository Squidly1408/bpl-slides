import { useState } from 'react'
import SlideStage from './SlideStage'
import { IconCopy, IconPlus, IconTrash } from './icons'
import type { Slide } from '../types'

export default function SlideThumbnailRail({
  slides,
  currentSlideId,
  onSelect,
  onAdd,
  onDuplicate,
  onDelete,
  onReorder,
  variant = 'sidebar',
}: {
  slides: Slide[]
  currentSlideId: string | null
  onSelect: (id: string) => void
  onAdd: (afterIndex?: number) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onReorder: (fromIndex: number, toIndex: number) => void
  /** 'sidebar' (default): fixed-width column for the desktop 3-pane layout. 'modal': fills whatever width it's given, for the mobile "Slides" drawer. */
  variant?: 'sidebar' | 'modal'
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  return (
    <div
      className={
        variant === 'sidebar'
          ? 'scrollbar-thin flex h-full w-56 shrink-0 flex-col gap-2 overflow-y-auto border-r p-3'
          : 'grid grid-cols-2 gap-3 sm:grid-cols-3'
      }
      style={variant === 'sidebar' ? { borderColor: 'var(--color-border)' } : undefined}
    >
      {slides.map((slide, i) => (
        <div
          key={slide.id}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i)
            setDragIndex(null)
          }}
          onClick={() => onSelect(slide.id)}
          className="group relative cursor-pointer rounded-lg border-2 p-1"
          style={{
            borderColor: slide.id === currentSlideId ? 'var(--color-primary)' : 'transparent',
            background: 'var(--color-surface)',
          }}
        >
          <div className="mb-1 flex items-center justify-between px-0.5 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
            <span>{i + 1}</span>
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDuplicate(slide.id)
                }}
                className="rounded p-0.5"
                title="Duplicate slide"
                aria-label="Duplicate slide"
              >
                <IconCopy size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (slides.length > 1) onDelete(slide.id)
                }}
                className="rounded p-0.5"
                style={{ color: 'var(--color-danger)' }}
                title="Delete slide"
                aria-label="Delete slide"
              >
                <IconTrash size={12} />
              </button>
            </div>
          </div>
          <div className="aspect-video w-full overflow-hidden rounded" style={{ border: '1px solid var(--color-border)' }}>
            <SlideStage slide={slide} editable={false} interactive={false} />
          </div>
        </div>
      ))}
      <button
        onClick={() => onAdd()}
        className={`flex items-center justify-center gap-1 rounded-lg border border-dashed py-2 text-xs font-medium ${variant === 'modal' ? 'col-span-full' : ''}`}
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
      >
        <IconPlus size={12} /> Add slide
      </button>
    </div>
  )
}
