import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectStore } from '../store/useProjectStore'
import { putAsset } from '../lib/db'
import { createId } from '../lib/id'
import {
  makeAudioBlock,
  makeDrawingBlock,
  makeEmbedBlock,
  makeFileBlock,
  makeFlowerGraphBlock,
  makeIconBlock,
  makeImageBlock,
  makeMathBlock,
  makeMeshBlock,
  makeShapeBlock,
  makeTextBlock,
  makeVideoBlock,
} from '../lib/blocks'
import { exportProjectToPptx } from '../lib/pptxExport'
import { exportProjectFile } from '../lib/projectFile'
import { isEditableTarget } from '../lib/dom'
import { CUSTOM_THEME_ID, DEFAULT_CUSTOM_COLORS, DEFAULT_THEME_ID, getTheme, THEMES } from '../lib/themes'
import { ibplcSlide, internshipSlide } from '../lib/templates'
import { CONTENT_STYLES } from '../lib/layouts'
import { hasSeenTutorial, markTutorialSeen, onRequestTutorial } from '../lib/tutorial'
import { useContainedSize } from '../lib/hooks'
import SlideThumbnailRail from '../components/SlideThumbnailRail'
import SlideStage from '../components/SlideStage'
import TransitionPicker from '../components/TransitionPicker'
import BlockPropertiesPanel from '../components/BlockPropertiesPanel'
import DrawingBlockEditorModal from '../components/DrawingBlockEditorModal'
import IconPickerModal from '../components/IconPickerModal'
import MathBlockEditorModal from '../components/MathBlockEditorModal'
import Modal from '../components/Modal'
import AddBlockMenu from '../components/AddBlockMenu'
import Coachmarks, { type CoachStep } from '../components/Coachmarks'
import { IconDownload, IconEdit, IconFileText, IconFolderOpen, IconPlay, IconPlus, IconRedo, IconUndo, IconUpload } from '../components/icons'
import type { Block, MeshFormat, Slide, TextBlock } from '../types'

const MESH_EXT: Record<string, MeshFormat> = { stl: 'stl', obj: 'obj', glb: 'glb', gltf: 'gltf' }

const TOUR_ID = 'editor'
// The slide rail / add rail / settings panel are permanent side columns on
// desktop but collapse into drawer-trigger buttons below the `lg` breakpoint
// (see showSlidesDrawer etc.) — never both on screen at once. Each of those
// steps lists both the desktop and mobile/tablet element as candidate
// targets, so Coachmarks spotlights whichever one is actually rendered
// rather than the tour silently losing steps on a smaller screen.
const TOUR_STEPS: CoachStep[] = [
  {
    title: 'This is the editor',
    body: "Every project's slides live here — a quick look at where things are before you start building.",
  },
  {
    target: ['slide-rail', 'slides-drawer-button'],
    placement: 'right',
    title: 'Your slides',
    body: 'Add, duplicate, reorder, or delete slides here. On a touch screen, this opens as a panel — tap any thumbnail to jump to it.',
  },
  {
    target: ['add-block-rail', 'add-drawer-button'],
    placement: 'right',
    title: 'Add to the slide',
    body: 'Insert text, shapes, images, icons, maths, 3D models, or the Learning Flower onto the current slide from here.',
  },
  {
    target: 'slide-canvas',
    title: 'The canvas',
    body: 'Drag, resize, and rotate anything. Tap a block to select it, then fine-tune it in settings.',
  },
  {
    target: ['settings-panel', 'settings-drawer-button'],
    placement: 'left',
    title: 'Theme & block settings',
    body: "Change the project's colour theme, redesign a slide's layout in one tap, or adjust the selected block's properties here.",
  },
  {
    target: 'present-button',
    placement: 'bottom',
    title: 'When you’re ready',
    body: 'Present goes fullscreen — advance with the arrow keys, a click, or your voice.',
  },
]

function clampPct(value: number, size: number) {
  return Math.min(Math.max(value, 0), Math.max(0, 100 - size))
}

/** Best-effort reconstruction of a slide's "heading" + "bullet points" from its current text blocks, for the Redesign picker — the heading block (or the first text block, if none is marked as one) becomes the heading; every other text block's lines (minus any "•" bullet markers already on them) become the bullet list.
 *
 * Several layouts (grid cards, numbered list, timeline, evidence, icon
 * grid, …) render a decorative number/badge ("01", "+", a bare digit, an
 * emoji glyph) as its own small text block alongside the real bullet text —
 * redesigning FROM one of those picked those badges up as if they were
 * their own bullets otherwise, since they're just as much "a text block on
 * the slide" as the real content. Bullet content is always a real phrase,
 * never a bare 1-3 digit number or a 1-2 character glyph, so filtering
 * those out here (rather than only recognising "•" prefixes) is what
 * actually fixes it. */
function extractHeadingAndBullets(slide: Slide): [string, string[]] {
  const textBlocks = slide.blocks.filter((b): b is TextBlock => b.type === 'text')
  const headingBlock = textBlocks.find((b) => b.isHeading) ?? textBlocks[0]
  const heading = headingBlock?.content ?? ''
  const bullets = textBlocks
    .filter((b) => b.id !== headingBlock?.id)
    .flatMap((b) => b.content.split(/\n+/))
    .map((line) => line.replace(/^[•\-*]\s*/, '').trim())
    .filter(Boolean)
    .filter((line) => !/^\d{1,3}$/.test(line) && [...line].length > 2)
  return [heading, bullets]
}

export default function Editor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const {
    project,
    status,
    loadProject,
    setTitle,
    setProjectTheme,
    setCustomTheme,
    addSlide,
    insertSlide,
    duplicateSlide,
    deleteSlide,
    reorderSlides,
    updateSlide,
    addBlock,
    updateBlock,
    deleteBlock,
    duplicateBlock,
    undo,
    redo,
    past,
    future,
    saving,
  } = useProjectStore()

  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [editingDrawingBlockId, setEditingDrawingBlockId] = useState<string | null>(null)
  // 'new' -> the Add-menu's Icon button (picking inserts a fresh block);
  // 'edit' -> the properties panel's "Change icon" button (picking swaps the
  // currently-selected icon block's iconName in place).
  const [iconPickerMode, setIconPickerMode] = useState<'new' | 'edit' | null>(null)
  const [showMathModal, setShowMathModal] = useState(false)
  const [exporting, setExporting] = useState<string | null>(null)
  // Below the `lg` breakpoint the slide rail and settings panel become
  // full-screen drawers instead of permanent side columns.
  const [showSlidesDrawer, setShowSlidesDrawer] = useState(false)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)
  const [showAddDrawer, setShowAddDrawer] = useState(false)
  const [showTour, setShowTour] = useState(false)
  const [canvasWrapRef, canvasSize] = useContainedSize<HTMLDivElement>(16 / 9)

  useEffect(() => {
    if (!hasSeenTutorial(TOUR_ID)) setShowTour(true)
    return onRequestTutorial(() => setShowTour(true))
  }, [])

  useEffect(() => {
    if (id) loadProject(id)
  }, [id, loadProject])

  useEffect(() => {
    if (project && !currentSlideId && project.slides.length > 0) {
      setCurrentSlideId(project.slides[0].id)
    }
  }, [project, currentSlideId])

  const currentSlide = useMemo(
    () => project?.slides.find((s) => s.id === currentSlideId) ?? null,
    [project, currentSlideId],
  )
  const selectedBlock = useMemo(
    () => currentSlide?.blocks.find((b) => b.id === selectedBlockId) ?? null,
    [currentSlide, selectedBlockId],
  )
  const editingDrawingBlock = useMemo(() => {
    const block = currentSlide?.blocks.find((b) => b.id === editingDrawingBlockId)
    return block?.type === 'drawing' ? block : null
  }, [currentSlide, editingDrawingBlockId])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const cmd = e.ctrlKey || e.metaKey
      if (isEditableTarget(e.target)) return

      if (cmd && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (cmd && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
        return
      }
      if (!currentSlide || !selectedBlockId) return
      if (cmd && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        const newId = duplicateBlock(currentSlide.id, selectedBlockId)
        if (newId) setSelectedBlockId(newId)
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteBlock(currentSlide.id, selectedBlockId)
        setSelectedBlockId(null)
        return
      }
      const step = e.shiftKey ? 4 : 1
      const block = currentSlide.blocks.find((b) => b.id === selectedBlockId)
      if (!block) return
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        updateBlock(currentSlide.id, block.id, { y: clampPct(block.y - step, block.h) })
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        updateBlock(currentSlide.id, block.id, { y: clampPct(block.y + step, block.h) })
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        updateBlock(currentSlide.id, block.id, { x: clampPct(block.x - step, block.w) })
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        updateBlock(currentSlide.id, block.id, { x: clampPct(block.x + step, block.w) })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentSlide, selectedBlockId, undo, redo, duplicateBlock, deleteBlock, updateBlock])

  if (status === 'loading' || !project) {
    return <div className="p-8 text-sm">Loading project…</div>
  }
  if (status === 'not-found') {
    return <div className="p-8 text-sm">Project not found. <button className="underline" onClick={() => navigate('/')}>Back to dashboard</button></div>
  }

  const theme = getTheme(project.theme)
  const themeVars = {
    '--color-primary': theme.primary,
    '--color-primary-hover': theme.primaryDark,
    '--color-primary-soft': theme.surfaceTint,
    '--color-focus': theme.primary,
  } as CSSProperties

  function selectSlide(slideId: string) {
    setCurrentSlideId(slideId)
    setSelectedBlockId(null)
  }

  function handleAddSlide() {
    const idx = project!.slides.findIndex((s) => s.id === currentSlideId)
    const newId = addSlide(idx === -1 ? undefined : idx)
    setCurrentSlideId(newId)
    setSelectedBlockId(null)
  }

  async function handleAddMediaBlock(kind: 'image' | 'video' | 'audio' | 'mesh' | 'file', file: File) {
    if (!currentSlide) return
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type, blob: file })
    const ext = file.name.split('.').pop()?.toLowerCase() || ''
    let block: Block
    if (kind === 'image') block = makeImageBlock(assetId)
    else if (kind === 'video') block = makeVideoBlock(assetId)
    else if (kind === 'audio') block = makeAudioBlock(assetId)
    else if (kind === 'file') block = makeFileBlock(assetId, ext === 'pdf' ? 'pdf' : 'docx')
    else block = makeMeshBlock(assetId, MESH_EXT[ext] ?? 'stl')
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
  }

  function handleAddShape() {
    if (!currentSlide) return
    const block = makeShapeBlock({ x: 25, y: 25, w: 50, h: 50, color: theme.primary })
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
  }

  function handleAddIbplcSlide() {
    const idx = project!.slides.findIndex((s) => s.id === currentSlideId)
    const newId = insertSlide(ibplcSlide(project!.theme, project!.customTheme), idx === -1 ? undefined : idx)
    setCurrentSlideId(newId)
    setSelectedBlockId(null)
  }

  function handleAddInternshipSlide() {
    const idx = project!.slides.findIndex((s) => s.id === currentSlideId)
    const newId = insertSlide(internshipSlide(project!.theme, project!.customTheme), idx === -1 ? undefined : idx)
    setCurrentSlideId(newId)
    setSelectedBlockId(null)
  }

  function handleAddText() {
    if (!currentSlide) return
    const block = makeTextBlock()
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
  }

  function handleAddEmbed() {
    if (!currentSlide) return
    const url = prompt('Website URL to embed:')
    if (!url) return
    const block = makeEmbedBlock(/^https?:\/\//i.test(url) ? url : `https://${url}`)
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
  }

  function handleAddLink() {
    if (!currentSlide) return
    const url = prompt('Link URL:')
    if (!url) return
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`
    const label = prompt('Link text:', url) || url
    const block = makeTextBlock({ content: label, href, color: theme.primary, fontSize: 22, fontWeight: 'bold' })
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
  }

  async function handleAddDrawing() {
    if (!currentSlide) return
    // Start from a transparent 1x1 placeholder asset; the drawing modal replaces it once the student draws something.
    const canvas = document.createElement('canvas')
    canvas.width = 1280
    canvas.height = 720
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) return
    const assetId = createId()
    await putAsset({ id: assetId, name: 'drawing.png', mime: 'image/png', blob })
    const block = makeDrawingBlock(assetId)
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
    setEditingDrawingBlockId(block.id)
  }

  function handleIconPick(iconName: string) {
    if (!currentSlide) return
    if (iconPickerMode === 'edit' && selectedBlock?.type === 'icon') {
      updateBlock(currentSlide.id, selectedBlock.id, { iconName })
    } else {
      const block = makeIconBlock(iconName, { color: theme.primary })
      addBlock(currentSlide.id, block)
      setSelectedBlockId(block.id)
    }
    setIconPickerMode(null)
  }

  function handleAddMathExpression(latex: string) {
    if (!currentSlide) return
    const block = makeMathBlock({ latex, color: theme.primaryDark })
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
    setShowMathModal(false)
  }

  async function handleAddMathPhoto(file: File) {
    if (!currentSlide) return
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type, blob: file })
    const block = makeImageBlock(assetId)
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
    setShowMathModal(false)
  }

  function handleAddFlowerGraph() {
    if (!currentSlide) return
    const block = makeFlowerGraphBlock()
    addBlock(currentSlide.id, block)
    setSelectedBlockId(block.id)
  }

  async function handleBackgroundImage(file: File) {
    if (!currentSlide) return
    const assetId = createId()
    await putAsset({ id: assetId, name: file.name, mime: file.type, blob: file })
    updateSlide(currentSlide.id, { backgroundAssetId: assetId })
  }

  async function handleExportPptx() {
    if (!project) return
    setExporting('pptx')
    try {
      await exportProjectToPptx(project)
    } finally {
      setExporting(null)
    }
  }

  async function handleExportFile() {
    if (!project) return
    setExporting('file')
    try {
      await exportProjectFile(project)
    } finally {
      setExporting(null)
    }
  }

  function renderSettingsPanel(slide: NonNullable<typeof currentSlide>) {
    return (
      <>
        <div className="mb-4">
          <label className="mb-1 block text-xs font-medium">Project theme</label>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setProjectTheme(t.id)}
                title={t.name}
                aria-label={t.name}
                className="h-6 w-6 rounded-full border-2"
                style={{
                  background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                  borderColor: (project!.theme ?? DEFAULT_THEME_ID) === t.id ? 'var(--color-text)' : 'transparent',
                }}
              />
            ))}
            <button
              onClick={() => setProjectTheme(CUSTOM_THEME_ID)}
              title="Custom colours"
              aria-label="Custom colours"
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold"
              style={{
                background: project!.customTheme
                  ? `linear-gradient(135deg, ${project!.customTheme.primary}, ${project!.customTheme.accent})`
                  : 'repeating-conic-gradient(#ccc 0% 25%, #eee 0% 50%) 0 0/8px 8px',
                borderColor: project!.theme === CUSTOM_THEME_ID ? 'var(--color-text)' : 'transparent',
                color: '#fff',
              }}
            >
              +
            </button>
          </div>
          {project!.theme === CUSTOM_THEME_ID && (
            <div className="mt-2 flex gap-3">
              <label className="flex flex-1 items-center gap-2 text-xs">
                <input
                  type="color"
                  value={(project!.customTheme ?? DEFAULT_CUSTOM_COLORS).primary}
                  onChange={(e) => setCustomTheme({ ...(project!.customTheme ?? DEFAULT_CUSTOM_COLORS), primary: e.target.value })}
                  className="h-7 w-7 shrink-0 cursor-pointer rounded border p-0.5"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                Primary
              </label>
              <label className="flex flex-1 items-center gap-2 text-xs">
                <input
                  type="color"
                  value={(project!.customTheme ?? DEFAULT_CUSTOM_COLORS).accent}
                  onChange={(e) => setCustomTheme({ ...(project!.customTheme ?? DEFAULT_CUSTOM_COLORS), accent: e.target.value })}
                  className="h-7 w-7 shrink-0 cursor-pointer rounded border p-0.5"
                  style={{ borderColor: 'var(--color-border)' }}
                />
                Accent
              </label>
            </div>
          )}
        </div>
        {selectedBlock ? (
          <>
            <h3 className="mb-3 text-sm font-semibold">Block settings</h3>
            <BlockPropertiesPanel
              block={selectedBlock}
              onChange={(patch) => updateBlock(slide.id, selectedBlock.id, patch)}
              onEditDrawing={() => setEditingDrawingBlockId(selectedBlock.id)}
              onEditIcon={() => setIconPickerMode('edit')}
              onDuplicate={() => {
                const newId = duplicateBlock(slide.id, selectedBlock.id)
                if (newId) setSelectedBlockId(newId)
              }}
              onDelete={() => {
                deleteBlock(slide.id, selectedBlock.id)
                setSelectedBlockId(null)
              }}
            />
          </>
        ) : (
          <>
            <h3 className="mb-3 text-sm font-semibold">Slide settings</h3>
            <label className="mb-1 block text-xs font-medium">Transition</label>
            <div className="mb-4">
              <TransitionPicker value={slide.transition} onChange={(t) => updateSlide(slide.id, { transition: t })} />
            </div>
            <label className="mb-1 block text-xs font-medium">Redesign this slide</label>
            <div className="mb-4 grid grid-cols-2 gap-1.5">
              {CONTENT_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => {
                    const [heading, bullets] = extractHeadingAndBullets(slide)
                    const redesigned = style.build(theme, heading, bullets)
                    updateSlide(slide.id, {
                      blocks: redesigned.blocks,
                      transition: redesigned.transition,
                      background: redesigned.background,
                      backgroundAssetId: undefined,
                    })
                  }}
                  className="rounded-lg border px-2 py-1.5 text-left text-xs"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  {style.name}
                </button>
              ))}
            </div>
            <label className="mb-1 block text-xs font-medium">Background colour</label>
            <input
              type="color"
              value={slide.background.startsWith('#') ? slide.background : '#ffffff'}
              onChange={(e) => updateSlide(slide.id, { background: e.target.value, backgroundAssetId: undefined })}
              className="mb-4 h-9 w-full rounded-lg border p-1"
              style={{ borderColor: 'var(--color-border)' }}
            />
            <label className="mb-1 block text-xs font-medium">Background image</label>
            <div className="mb-4 flex gap-2">
              <FileToolbarButton label="Upload" accept="image/*" onFile={handleBackgroundImage} full />
              {slide.backgroundAssetId && (
                <button
                  onClick={() => updateSlide(slide.id, { backgroundAssetId: undefined })}
                  className="rounded-md border px-2 py-1.5 text-xs"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  Remove
                </button>
              )}
            </div>
            <label className="mb-1 block text-xs font-medium">Speaker notes</label>
            <textarea
              value={slide.notes ?? ''}
              onChange={(e) => updateSlide(slide.id, { notes: e.target.value })}
              rows={5}
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
              placeholder="Notes only you see while presenting…"
            />
          </>
        )}
      </>
    )
  }

  const addBlockHandlers = {
    onAddText: handleAddText,
    onAddShape: handleAddShape,
    onAddMedia: handleAddMediaBlock,
    onAddEmbed: handleAddEmbed,
    onAddLink: handleAddLink,
    onAddDrawing: handleAddDrawing,
    onAddIcon: () => setIconPickerMode('new'),
    onAddMath: () => setShowMathModal(true),
    onAddFlowerGraph: handleAddFlowerGraph,
    onAddIbplcSlide: handleAddIbplcSlide,
    onAddInternshipSlide: handleAddInternshipSlide,
  }

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col" style={themeVars}>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-3 py-2 sm:px-4" style={{ borderColor: 'var(--color-border)' }}>
        {/* min-w-[9rem] (not min-w-0) is deliberate: on a tablet-width screen
            the action buttons to the right show full text labels and
            comfortably fit `justify-between`'s leftover space on their own,
            which — with no minimum here — let them squeeze the title down
            to a sliver ("My Exh…" instead of the actual title). Giving the
            title row a floor forces the buttons to wrap to their own line
            first instead. */}
        <div className="flex min-w-[9rem] flex-1 items-center gap-2 sm:gap-3">
          <button onClick={() => navigate('/')} className="shrink-0 text-sm" style={{ color: 'var(--color-text-muted)' }} aria-label="Back to projects">
            ←
          </button>
          <input
            value={project.title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded-md border-0 bg-transparent px-1 text-base font-semibold focus:outline-none focus:ring-1 sm:text-lg"
            style={{ boxShadow: 'none' }}
          />
          <span className="hidden shrink-0 text-xs sm:inline" style={{ color: 'var(--color-text-muted)' }}>
            {saving ? 'Saving…' : 'Saved'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-sm sm:gap-2">
          <button
            onClick={() => undo()}
            disabled={past.length === 0}
            title="Undo (Ctrl+Z)"
            className="flex items-center gap-1 rounded-md border px-2 py-1.5 disabled:opacity-30 sm:px-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <IconUndo size={14} /> <span className="hidden md:inline">Undo</span>
          </button>
          <button
            onClick={() => redo()}
            disabled={future.length === 0}
            title="Redo (Ctrl+Shift+Z)"
            className="flex items-center gap-1 rounded-md border px-2 py-1.5 disabled:opacity-30 sm:px-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <IconRedo size={14} /> <span className="hidden md:inline">Redo</span>
          </button>
          <button
            onClick={() => navigate(`/project/${project.id}/upload`)}
            title="Upload work"
            className="flex items-center gap-1 rounded-md border px-2 py-1.5 sm:px-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <IconUpload size={14} /> <span className="hidden md:inline">Upload work</span>
          </button>
          <button
            onClick={handleExportFile}
            disabled={!!exporting}
            title="Download project backup"
            className="flex items-center gap-1 rounded-md border px-2 py-1.5 disabled:opacity-50 sm:px-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <IconDownload size={14} /> <span className="hidden md:inline">{exporting === 'file' ? 'Preparing…' : 'Download project'}</span>
          </button>
          <button
            onClick={handleExportPptx}
            disabled={!!exporting}
            title="Export .pptx"
            className="flex items-center gap-1 rounded-md border px-2 py-1.5 disabled:opacity-50 sm:px-3"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <IconFileText size={14} /> <span className="hidden md:inline">{exporting === 'pptx' ? 'Exporting…' : 'Export .pptx'}</span>
          </button>
          <button
            data-tour="present-button"
            onClick={() => navigate(`/project/${project.id}/present`)}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 font-semibold text-white sm:px-3"
            style={{ background: theme.primary }}
          >
            <IconPlay size={14} /> Present
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div data-tour="slide-rail" className="hidden lg:flex lg:h-full">
          <SlideThumbnailRail
            slides={project.slides}
            currentSlideId={currentSlideId}
            onSelect={selectSlide}
            onAdd={handleAddSlide}
            onDuplicate={duplicateSlide}
            onDelete={(sid) => {
              if (sid === currentSlideId) {
                const idx = project.slides.findIndex((s) => s.id === sid)
                const next = project.slides[idx + 1] ?? project.slides[idx - 1]
                setCurrentSlideId(next?.id ?? null)
              }
              deleteSlide(sid)
            }}
            onReorder={reorderSlides}
          />
        </div>

        <div
          data-tour="add-block-rail"
          className="scrollbar-thin hidden shrink-0 overflow-y-auto border-r lg:block"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <AddBlockMenu handlers={addBlockHandlers} variant="rail" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 overflow-y-auto p-3 sm:p-6" style={{ background: 'var(--color-bg)' }}>
          <div className="flex w-full max-w-4xl shrink-0 items-center justify-center gap-2 text-sm lg:hidden">
            <button
              data-tour="slides-drawer-button"
              onClick={() => setShowSlidesDrawer(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <IconFolderOpen size={15} /> Slides ({project.slides.length})
            </button>
            <button
              data-tour="add-drawer-button"
              onClick={() => setShowAddDrawer(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <IconPlus size={15} /> Add
            </button>
            <button
              data-tour="settings-drawer-button"
              onClick={() => setShowSettingsDrawer(true)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
            >
              <IconEdit size={15} /> {selectedBlock ? 'Block' : 'Slide'} settings
            </button>
          </div>

          {currentSlide && (
            // The extra flex/min-h-0 wrapper (rather than sizing the canvas
            // itself off `w-full`) is what lets the canvas use up available
            // *height* too, not just width — on a narrow-but-tall viewport
            // (most phones/tablets in portrait), a purely width-driven
            // aspect-video box left most of the screen below it empty.
            // useContainedSize measures this wrapper and gives the canvas
            // its exact pixel size to fill whichever dimension is tighter;
            // the aspect-video/w-full classes are just the first-paint
            // fallback before that measurement lands.
            <div ref={canvasWrapRef} className="flex min-h-0 w-full max-w-4xl flex-1 items-center justify-center">
              <div
                data-tour="slide-canvas"
                className="aspect-video w-full overflow-hidden rounded-xl shadow-lg"
                style={canvasSize.width ? { width: canvasSize.width, height: canvasSize.height, boxShadow: 'var(--shadow-lg)' } : { boxShadow: 'var(--shadow-lg)' }}
              >
                <SlideStage
                  slide={currentSlide}
                  editable
                  interactive={false}
                  selectedBlockId={selectedBlockId}
                  onSelectBlock={setSelectedBlockId}
                  onChangeBlock={(blockId, patch) => updateBlock(currentSlide.id, blockId, patch)}
                  onDeleteBlock={(blockId) => {
                    deleteBlock(currentSlide.id, blockId)
                    setSelectedBlockId(null)
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {currentSlide && (
          <div data-tour="settings-panel" className="scrollbar-thin hidden w-72 shrink-0 overflow-y-auto border-l p-4 lg:block" style={{ borderColor: 'var(--color-border)' }}>
            {renderSettingsPanel(currentSlide)}
          </div>
        )}
      </div>

      {showSlidesDrawer && (
        <Modal title="Slides" onClose={() => setShowSlidesDrawer(false)} width={640}>
          <div className="max-h-[70vh] overflow-y-auto">
            <SlideThumbnailRail
              variant="modal"
              slides={project.slides}
              currentSlideId={currentSlideId}
              onSelect={(sid) => {
                selectSlide(sid)
                setShowSlidesDrawer(false)
              }}
              onAdd={handleAddSlide}
              onDuplicate={duplicateSlide}
              onDelete={(sid) => {
                if (sid === currentSlideId) {
                  const idx = project.slides.findIndex((s) => s.id === sid)
                  const next = project.slides[idx + 1] ?? project.slides[idx - 1]
                  setCurrentSlideId(next?.id ?? null)
                }
                deleteSlide(sid)
              }}
              onReorder={reorderSlides}
            />
          </div>
        </Modal>
      )}

      {showSettingsDrawer && currentSlide && (
        <Modal title={selectedBlock ? 'Block settings' : 'Slide settings'} onClose={() => setShowSettingsDrawer(false)} width={420}>
          <div className="max-h-[70vh] overflow-y-auto">{renderSettingsPanel(currentSlide)}</div>
        </Modal>
      )}

      {showAddDrawer && (
        <Modal title="Add to slide" onClose={() => setShowAddDrawer(false)} width={480}>
          <div className="max-h-[70vh] overflow-y-auto">
            <AddBlockMenu handlers={addBlockHandlers} variant="grid" onAction={() => setShowAddDrawer(false)} />
          </div>
        </Modal>
      )}

      {editingDrawingBlock && currentSlide && (
        <DrawingBlockEditorModal
          assetId={editingDrawingBlock.assetId}
          onSave={(newAssetId) => updateBlock(currentSlide.id, editingDrawingBlock.id, { assetId: newAssetId })}
          onClose={() => setEditingDrawingBlockId(null)}
        />
      )}

      {iconPickerMode && <IconPickerModal onPick={handleIconPick} onClose={() => setIconPickerMode(null)} />}

      {showMathModal && (
        <MathBlockEditorModal
          onCreateMath={handleAddMathExpression}
          onCreatePhoto={handleAddMathPhoto}
          onClose={() => setShowMathModal(false)}
        />
      )}

      {showTour && (
        <Coachmarks
          steps={TOUR_STEPS}
          onFinish={() => {
            markTutorialSeen(TOUR_ID)
            setShowTour(false)
          }}
        />
      )}
    </div>
  )
}

function FileToolbarButton({
  label,
  accept,
  onFile,
  full,
}: {
  label: string
  accept: string
  onFile: (file: File) => void
  full?: boolean
}) {
  return (
    <label
      className={`cursor-pointer rounded-lg border px-3 py-1.5 text-center ${full ? 'flex-1' : ''}`}
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      + {label}
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          e.target.value = ''
          if (file) onFile(file)
        }}
      />
    </label>
  )
}
