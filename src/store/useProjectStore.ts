import { create } from 'zustand'
import { getProject, saveProject } from '../lib/db'
import { createId } from '../lib/id'
import { cloneBlock, makeSlide, seedZCounterFromSlides } from '../lib/blocks'
import { applyThemeToProject } from '../lib/applyTheme'
import { CUSTOM_THEME_ID } from '../lib/themes'
import type { Block, CustomThemeColors, Project, Slide, TransitionType } from '../types'

const HISTORY_LIMIT = 60
// Rapid-fire changes within this window (dragging a block, typing a
// sentence) are coalesced into a single undo step, matching how most editors
// group edits — only a pause starts a new step.
const COALESCE_MS = 700

interface ProjectStoreState {
  project: Project | null
  status: 'idle' | 'loading' | 'ready' | 'not-found'
  saving: boolean
  past: Project[]
  future: Project[]
  loadProject: (id: string) => Promise<void>
  setProject: (project: Project) => void
  clear: () => void
  undo: () => void
  redo: () => void
  setTitle: (title: string) => void
  setProjectTheme: (themeId: string) => void
  setCustomTheme: (colors: CustomThemeColors) => void
  addSlide: (afterIndex?: number) => string
  /** Inserts an already-built Slide (e.g. from a layout helper like ibplcSlide()) rather than a blank one. */
  insertSlide: (slide: Slide, afterIndex?: number) => string
  duplicateSlide: (slideId: string) => void
  deleteSlide: (slideId: string) => void
  reorderSlides: (fromIndex: number, toIndex: number) => void
  updateSlide: (slideId: string, patch: Partial<Slide>) => void
  setTransition: (slideId: string, transition: TransitionType) => void
  addBlock: (slideId: string, block: Block) => void
  updateBlock: (slideId: string, blockId: string, patch: Partial<Block>) => void
  deleteBlock: (slideId: string, blockId: string) => void
  duplicateBlock: (slideId: string, blockId: string) => string | undefined
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
let lastEditAt = 0

function scheduleSave(get: () => ProjectStoreState, set: (p: Partial<ProjectStoreState>) => void) {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const { project } = get()
    if (!project) return
    set({ saving: true })
    await saveProject(project)
    set({ saving: false })
  }, 500)
}

/** Snapshots the current project into the undo stack before a mutation is applied, coalescing rapid bursts (drags, keystrokes) into one step. */
function recordHistory(get: () => ProjectStoreState, set: (p: Partial<ProjectStoreState>) => void) {
  const { project, past } = get()
  if (!project) return
  const now = Date.now()
  if (now - lastEditAt > COALESCE_MS) {
    set({ past: [...past, project].slice(-HISTORY_LIMIT), future: [] })
  }
  lastEditAt = now
}

export const useProjectStore = create<ProjectStoreState>((set, get) => ({
  project: null,
  status: 'idle',
  saving: false,
  past: [],
  future: [],

  async loadProject(id) {
    set({ status: 'loading', past: [], future: [] })
    const project = await getProject(id)
    lastEditAt = 0
    if (!project) {
      set({ status: 'not-found', project: null })
      return
    }
    seedZCounterFromSlides(project.slides)
    set({ project, status: 'ready' })
  },

  setProject(project) {
    seedZCounterFromSlides(project.slides)
    set({ project, status: 'ready', past: [], future: [] })
    lastEditAt = 0
  },

  clear() {
    set({ project: null, status: 'idle', past: [], future: [] })
  },

  undo() {
    const { past, project, future } = get()
    if (past.length === 0 || !project) return
    const previous = past[past.length - 1]
    set({ project: previous, past: past.slice(0, -1), future: [project, ...future].slice(0, HISTORY_LIMIT) })
    lastEditAt = 0
    scheduleSave(get, set)
  },

  redo() {
    const { future, project, past } = get()
    if (future.length === 0 || !project) return
    const next = future[0]
    set({ project: next, future: future.slice(1), past: [...past, project].slice(-HISTORY_LIMIT) })
    lastEditAt = 0
    scheduleSave(get, set)
  },

  setTitle(title) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    set({ project: { ...project, title } })
    scheduleSave(get, set)
  },

  setProjectTheme(themeId) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    // Pass the existing custom colours through unchanged (even when
    // switching to a preset) so they're still there if the student picks
    // "Custom" again later, instead of resetting.
    set({ project: applyThemeToProject(project, themeId, project.customTheme) })
    scheduleSave(get, set)
  },

  setCustomTheme(colors) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    set({ project: applyThemeToProject(project, CUSTOM_THEME_ID, colors) })
    scheduleSave(get, set)
  },

  addSlide(afterIndex) {
    return get().insertSlide(makeSlide(), afterIndex)
  },

  insertSlide(slide, afterIndex) {
    const { project } = get()
    if (!project) return ''
    recordHistory(get, set)
    const insertAt = afterIndex === undefined ? project.slides.length : afterIndex + 1
    const slides = [...project.slides]
    slides.splice(insertAt, 0, slide)
    slides.forEach((s, i) => (s.order = i))
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
    return slide.id
  },

  duplicateSlide(slideId) {
    const { project } = get()
    if (!project) return
    const idx = project.slides.findIndex((s) => s.id === slideId)
    if (idx === -1) return
    recordHistory(get, set)
    const original = project.slides[idx]
    const copy: Slide = {
      ...original,
      id: createId(),
      blocks: original.blocks.map((b) => ({ ...b, id: createId() })),
    }
    const slides = [...project.slides]
    slides.splice(idx + 1, 0, copy)
    slides.forEach((s, i) => (s.order = i))
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  deleteSlide(slideId) {
    const { project } = get()
    if (!project) return
    if (project.slides.length <= 1) return
    recordHistory(get, set)
    const slides = project.slides.filter((s) => s.id !== slideId)
    slides.forEach((s, i) => (s.order = i))
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  reorderSlides(fromIndex, toIndex) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    const slides = [...project.slides]
    const [moved] = slides.splice(fromIndex, 1)
    slides.splice(toIndex, 0, moved)
    slides.forEach((s, i) => (s.order = i))
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  updateSlide(slideId, patch) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    const slides = project.slides.map((s) => (s.id === slideId ? { ...s, ...patch } : s))
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  setTransition(slideId, transition) {
    get().updateSlide(slideId, { transition })
  },

  addBlock(slideId, block) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    const slides = project.slides.map((s) =>
      s.id === slideId ? { ...s, blocks: [...s.blocks, block] } : s,
    )
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  updateBlock(slideId, blockId, patch) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    const slides = project.slides.map((s) => {
      if (s.id !== slideId) return s
      return {
        ...s,
        blocks: s.blocks.map((b) => (b.id === blockId ? ({ ...b, ...patch } as Block) : b)),
      }
    })
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  deleteBlock(slideId, blockId) {
    const { project } = get()
    if (!project) return
    recordHistory(get, set)
    const slides = project.slides.map((s) =>
      s.id === slideId ? { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) } : s,
    )
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
  },

  duplicateBlock(slideId, blockId) {
    const { project } = get()
    if (!project) return undefined
    const source = project.slides.find((s) => s.id === slideId)?.blocks.find((b) => b.id === blockId)
    if (!source) return undefined
    recordHistory(get, set)
    const copy = cloneBlock(source)
    const slides = project.slides.map((s) => (s.id === slideId ? { ...s, blocks: [...s.blocks, copy] } : s))
    set({ project: { ...project, slides } })
    scheduleSave(get, set)
    return copy.id
  },
}))
