import { useEffect, useRef, useState } from 'react'
import { saveAs } from 'file-saver'
import { useNavigate } from 'react-router-dom'
import DrawingCanvas, { type DrawingCanvasHandle } from '../components/DrawingCanvas'
import { listProjects, putAsset, saveProject } from '../lib/db'
import { createId } from '../lib/id'
import { makeImageBlock, makeSlide } from '../lib/blocks'
import type { Project } from '../types'

export default function Draw() {
  const drawRef = useRef<DrawingCanvasHandle>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [targetProjectId, setTargetProjectId] = useState('')
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    listProjects().then(setProjects)
  }, [])

  async function handleDownload() {
    const blob = await drawRef.current?.exportPng()
    if (blob) saveAs(blob, 'drawing.png')
  }

  async function handleAddToProject() {
    if (!targetProjectId) return
    const blob = await drawRef.current?.exportPng()
    if (!blob) return
    setBusy(true)
    try {
      const project = projects.find((p) => p.id === targetProjectId)
      if (!project) return
      const assetId = createId()
      await putAsset({ id: assetId, name: 'drawing.png', mime: 'image/png', blob })
      const slide = makeSlide({ blocks: [makeImageBlock(assetId, { x: 5, y: 5, w: 90, h: 90 })] })
      const updated: Project = { ...project, slides: [...project.slides, slide] }
      updated.slides.forEach((s, i) => (s.order = i))
      await saveProject(updated)
      navigate(`/project/${project.id}/edit`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-57px-73px)] max-w-5xl flex-col px-4 py-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">Whiteboard</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Freehand drawing — not tied to any slideshow.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <select
            value={targetProjectId}
            onChange={(e) => setTargetProjectId(e.target.value)}
            className="rounded-lg border px-2 py-1.5 text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <option value="">Add as a new slide in…</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddToProject}
            disabled={!targetProjectId || busy}
            className="rounded-lg border px-3 py-1.5 disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            Add
          </button>
          <button onClick={handleDownload} className="rounded-lg px-3 py-1.5 font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
            Download PNG
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 rounded-xl border" style={{ borderColor: 'var(--color-border)' }}>
        <DrawingCanvas ref={drawRef} />
      </div>
    </div>
  )
}
