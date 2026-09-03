import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore'
import { putAsset } from '../lib/db'
import { createId } from '../lib/id'
import { makeDrawingBlock } from '../lib/blocks'
import { transitionClassName } from '../lib/transitions'
import SlideStage from '../components/SlideStage'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import VoiceNavControl from '../components/VoiceNavControl'

export default function Present() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { project, status, loadProject, addBlock } = useProjectStore()

  const [index, setIndex] = useState(0)
  const [annotating, setAnnotating] = useState(false)
  const drawRef = useRef<DrawingCanvasHandle>(null)

  useEffect(() => {
    if (id) loadProject(id)
  }, [id, loadProject])

  const slides = useMemo(() => project?.slides ?? [], [project])
  const slide = slides[index]

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, slides.length - 1))
  }, [slides.length])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault()
        next()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prev()
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
        navigate(`/project/${id}/edit`)
      } else if (e.key.toLowerCase() === 'd') {
        setAnnotating((a) => !a)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, navigate, id])

  function handleStageClick(e: React.MouseEvent) {
    const rect = e.currentTarget.getBoundingClientRect()
    const relX = (e.clientX - rect.left) / rect.width
    if (relX < 0.12) prev()
    else if (relX > 0.88) next()
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }

  async function saveAnnotationToSlide() {
    if (!slide) return
    const blob = await drawRef.current?.exportPng()
    if (!blob) return
    const assetId = createId()
    await putAsset({ id: assetId, name: 'annotation.png', mime: 'image/png', blob })
    addBlock(slide.id, makeDrawingBlock(assetId, { x: 0, y: 0, w: 100, h: 100 }))
    drawRef.current?.clear()
    setAnnotating(false)
  }

  if (status === 'loading' || !project) {
    return (
      <div className="flex h-screen items-center justify-center bg-black text-white">
        <p>Loading…</p>
      </div>
    )
  }
  if (!slide) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-black text-white">
        <p>This project has no slides yet.</p>
        <button onClick={() => navigate(`/project/${id}/edit`)} className="rounded-lg border border-white/30 px-4 py-2">
          Back to editor
        </button>
      </div>
    )
  }

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      <div className="absolute inset-0 flex items-center justify-center p-0">
        <div key={slide.id} className={`relative h-full w-full ${transitionClassName(slide.transition)}`}>
          <div className="h-full w-full" onClick={handleStageClick}>
            <SlideStage slide={slide} editable={false} interactive={!annotating} />
          </div>
          {annotating && (
            <div className="absolute inset-0">
              <DrawingCanvas ref={drawRef} transparent toolbarPosition="bottom" />
            </div>
          )}
        </div>
      </div>

      <div className="absolute left-1/2 top-2 flex max-w-[94vw] -translate-x-1/2 flex-wrap items-center justify-center gap-x-3 gap-y-1.5 rounded-2xl bg-black/50 px-3 py-2 text-xs text-white backdrop-blur sm:top-3 sm:rounded-full sm:px-4">
        <span>
          {index + 1} / {slides.length}
        </span>
        <button onClick={prev} disabled={index === 0} className="disabled:opacity-30">
          ‹ <span className="hidden sm:inline">Back</span>
        </button>
        <button onClick={next} disabled={index === slides.length - 1} className="disabled:opacity-30">
          <span className="hidden sm:inline">Next</span> ›
        </button>
        <VoiceNavControl onNext={next} onPrev={prev} />
        <button
          onClick={() => setAnnotating((a) => !a)}
          className="rounded-full px-2 py-1"
          style={{ background: annotating ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)' }}
        >
          ✏️ {annotating ? 'Drawing' : 'Draw'}
        </button>
        {annotating && (
          <button onClick={saveAnnotationToSlide} className="rounded-full bg-white/15 px-2 py-1">
            Save to slide
          </button>
        )}
        <button onClick={toggleFullscreen} className="rounded-full bg-white/15 px-2 py-1">
          ⛶
        </button>
        <button
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
            navigate(`/project/${id}/edit`)
          }}
          className="rounded-full bg-white/15 px-2 py-1"
        >
          Exit
        </button>
      </div>
    </div>
  )
}
