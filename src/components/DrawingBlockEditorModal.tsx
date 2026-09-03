import { useRef } from 'react'
import Modal from './Modal'
import DrawingCanvas, { type DrawingCanvasHandle } from './DrawingCanvas'
import { putAsset } from '../lib/db'
import { createId } from '../lib/id'
import { useAssetUrl } from '../lib/hooks'

export default function DrawingBlockEditorModal({
  assetId,
  onSave,
  onClose,
}: {
  assetId: string
  onSave: (newAssetId: string) => void
  onClose: () => void
}) {
  const handleRef = useRef<DrawingCanvasHandle>(null)
  const existingUrl = useAssetUrl(assetId)

  async function handleDone() {
    const blob = await handleRef.current?.exportPng()
    if (blob) {
      const newAssetId = createId()
      await putAsset({ id: newAssetId, name: 'drawing.png', mime: 'image/png', blob })
      onSave(newAssetId)
    }
    onClose()
  }

  return (
    <Modal title="Edit drawing" onClose={onClose} width={720}>
      {/* A drawing block is transparent (so it can sit over other blocks/the
          slide background), so DrawingCanvas draws nothing opaque behind
          your strokes — without a backdrop of its own here, the canvas was
          visually indistinguishable from the modal's own surface behind it.
          The checkerboard is a common "this area is transparent" convention
          from image editors; it's just this wrapper's CSS background, not
          part of the canvas itself, so it never ends up in the exported PNG. */}
      <div
        className="h-[60vh] rounded-lg border p-2"
        style={{
          borderColor: 'var(--color-border)',
          background: 'repeating-conic-gradient(#d8d8d8 0% 25%, #f3f3f3 0% 50%) 0 0/24px 24px',
        }}
      >
        <DrawingCanvas ref={handleRef} initialImageUrl={existingUrl} transparent />
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
          Cancel
        </button>
        <button onClick={handleDone} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
          Save drawing
        </button>
      </div>
    </Modal>
  )
}
