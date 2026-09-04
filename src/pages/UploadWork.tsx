import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getProject, putAsset, saveProject } from '../lib/db'
import { createId } from '../lib/id'
import { makeAudioBlock, makeEmbedBlock, makeImageBlock, makeMeshBlock, makeSlide, makeVideoBlock } from '../lib/blocks'
import { detectDocumentKind, parseDocument } from '../lib/parsers'
import { draftsToSlides } from '../lib/draftsToSlides'
import type { MeshFormat, Project, Slide } from '../types'

interface FileResult {
  name: string
  status: 'working' | 'done' | 'error'
  message: string
}

const MESH_EXT: Record<string, MeshFormat> = { stl: 'stl', obj: 'obj', glb: 'glb', gltf: 'gltf' }

function meshFormatOf(file: File): MeshFormat | null {
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return MESH_EXT[ext] ?? null
}

async function processFile(file: File, themeId: string | undefined): Promise<Slide[]> {
  if (file.type.startsWith('image/')) {
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type, blob: file })
    return [makeSlide({ blocks: [makeImageBlock(assetId, { x: 5, y: 5, w: 90, h: 90 })] })]
  }
  if (file.type.startsWith('video/')) {
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type, blob: file })
    return [makeSlide({ blocks: [makeVideoBlock(assetId, { x: 10, y: 10, w: 80, h: 80 })] })]
  }
  if (file.type.startsWith('audio/')) {
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type, blob: file })
    return [makeSlide({ blocks: [makeAudioBlock(assetId, { x: 15, y: 44, w: 70, h: 12 })] })]
  }
  const meshFormat = meshFormatOf(file)
  if (meshFormat) {
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type || 'model/octet-stream', blob: file })
    return [makeSlide({ blocks: [makeMeshBlock(assetId, meshFormat, { x: 8, y: 10, w: 84, h: 80 })] })]
  }
  if (detectDocumentKind(file)) {
    const result = await parseDocument(file)
    if (result.slides.length === 0) {
      throw new Error(result.warnings[0] || 'No content could be extracted from this file.')
    }
    return draftsToSlides(result, themeId)
  }
  throw new Error('Unsupported file type. Try Word (.docx), PowerPoint (.pptx), PDF, Excel/Sheets (.xlsx/.xls/.ods), text/markdown, images, video, audio, or STL/OBJ/glTF models.')
}

export default function UploadWork() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<Project | null>(null)
  const [results, setResults] = useState<FileResult[]>([])
  const [processing, setProcessing] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [embedUrl, setEmbedUrl] = useState('')
  const [addedCount, setAddedCount] = useState(0)

  useEffect(() => {
    if (!id) return
    getProject(id).then((p) => setProject(p ?? null))
  }, [id])

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (!project) return
      const list = Array.from(files)
      setProcessing(true)
      let newSlides: Slide[] = []
      let addedThisRun = 0

      for (const file of list) {
        setResults((r) => [...r, { name: file.name, status: 'working', message: 'Processing…' }])
        try {
          const slides = await processFile(file, project.theme)
          newSlides = newSlides.concat(slides)
          addedThisRun += slides.length
          setResults((r) =>
            r.map((res) =>
              res.name === file.name && res.status === 'working'
                ? { ...res, status: 'done', message: `Added ${slides.length} slide${slides.length === 1 ? '' : 's'}` }
                : res,
            ),
          )
        } catch (err) {
          setResults((r) =>
            r.map((res) =>
              res.name === file.name && res.status === 'working'
                ? { ...res, status: 'error', message: err instanceof Error ? err.message : 'Could not process this file' }
                : res,
            ),
          )
        }
      }

      if (newSlides.length > 0) {
        const updated: Project = {
          ...project,
          slides: [...project.slides, ...newSlides],
        }
        updated.slides.forEach((s, i) => (s.order = i))
        await saveProject(updated)
        setProject(updated)
        setAddedCount((c) => c + addedThisRun)
      }
      setProcessing(false)
    },
    [project],
  )

  function handleAddEmbed() {
    if (!project || !embedUrl.trim()) return
    let url = embedUrl.trim()
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`
    const slide = makeSlide({ blocks: [makeEmbedBlock(url)] })
    const updated: Project = { ...project, slides: [...project.slides, slide] }
    updated.slides.forEach((s, i) => (s.order = i))
    saveProject(updated).then(() => {
      setProject(updated)
      setEmbedUrl('')
      setAddedCount((c) => c + 1)
    })
  }

  if (!project) {
    return <div className="mx-auto max-w-3xl px-4 py-10 text-sm">Loading project…</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold">Upload work for "{project.title}"</h1>
      <p className="mb-6 text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Drop in your term's work — Word docs, PowerPoints, PDFs, spreadsheets (Excel or Google Sheets — .xlsx/.xls/.ods),
        notes, images, video, audio, or 3D models (.stl/.obj/.glb/.gltf). Each file is scanned locally in your browser
        and turned into draft slides you can then edit. Downloaded from Google Docs/Sheets? Export it as .docx/.pptx/
        .xlsx/.pdf first (File → Download) — this all runs in your browser, so there's no way to pull in a live
        Google Docs link directly.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
        }}
        className="mb-6 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center"
        style={{
          borderColor: dragging ? 'var(--color-primary)' : 'var(--color-border)',
          background: dragging ? 'var(--color-primary-soft)' : 'var(--color-surface)',
        }}
      >
        <p className="mb-3 font-medium">Drag &amp; drop files here</p>
        <p className="mb-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          or
        </p>
        <label
          className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          Choose files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />
        </label>
      </div>

      <div className="mb-6 rounded-xl border p-4" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="mb-2 text-sm font-semibold">Showcase a website</h2>
        <p className="mb-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Adds a slide that embeds the page live. Some sites block embedding — if it doesn't show, use "open in
          new tab" in the editor, or paste a screenshot instead.
        </p>
        <div className="flex gap-2">
          <input
            value={embedUrl}
            onChange={(e) => setEmbedUrl(e.target.value)}
            placeholder="https://example.com/my-project"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--color-border)' }}
          />
          <button
            onClick={handleAddEmbed}
            disabled={!embedUrl.trim()}
            className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
            style={{ borderColor: 'var(--color-border)' }}
          >
            Add slide
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="mb-6 rounded-xl border p-4 text-sm" style={{ borderColor: 'var(--color-border)' }}>
          <h2 className="mb-2 font-semibold">Processing results</h2>
          <ul className="space-y-1">
            {results.map((r, i) => (
              <li key={i} className="flex justify-between gap-3">
                <span className="truncate">{r.name}</span>
                <span
                  style={{
                    color:
                      r.status === 'error'
                        ? 'var(--color-danger)'
                        : r.status === 'done'
                          ? 'var(--color-primary)'
                          : 'var(--color-text-muted)',
                  }}
                >
                  {r.message}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {addedCount > 0 ? `${addedCount} slide${addedCount === 1 ? '' : 's'} added so far.` : 'No slides added yet.'}
        </p>
        <button
          onClick={() => navigate(`/project/${project.id}/edit`)}
          disabled={processing}
          className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}
        >
          Go to editor →
        </button>
      </div>
    </div>
  )
}
