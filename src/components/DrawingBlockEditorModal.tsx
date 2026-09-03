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
      <div className="h-[60vh]">
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
