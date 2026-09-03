import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { useProjectStore } from './useProjectStore'
import { makeSlide, makeTextBlock } from '../lib/blocks'
import * as db from '../lib/db'
import type { Project } from '../types'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'Untitled',
    createdAt: 1,
    updatedAt: 1,
    slides: [makeSlide({ id: 's1' })],
    ...overrides,
  }
}

beforeEach(() => {
  // setProject resets past/future and the undo-coalescing clock (lastEditAt
  // -> 0), so every test starts from a known, isolated state even though
  // the store is a module-level singleton shared across this file's tests.
  useProjectStore.getState().setProject(makeProject())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('slide operations', () => {
  it('addSlide appends to the end by default', () => {
    useProjectStore.getState().addSlide()
    const { slides } = useProjectStore.getState().project!
    expect(slides).toHaveLength(2)
    expect(slides[1].order).toBe(1)
  })

  it('insertSlide places the slide right after the given index', () => {
    useProjectStore.getState().addSlide() // slides: [s1, s2]
    const [, second] = useProjectStore.getState().project!.slides
    const inserted = makeSlide({ id: 'new' })
    useProjectStore.getState().insertSlide(inserted, 0)
    const { slides } = useProjectStore.getState().project!
    expect(slides.map((s) => s.id)).toEqual(['s1', 'new', second.id])
    expect(slides.map((s) => s.order)).toEqual([0, 1, 2])
  })

  it('duplicateSlide clones the slide and every block with fresh ids', () => {
    useProjectStore.getState().addBlock('s1', makeTextBlock({ id: 'b1' }))
    useProjectStore.getState().duplicateSlide('s1')
    const { slides } = useProjectStore.getState().project!
    expect(slides).toHaveLength(2)
    expect(slides[1].id).not.toBe('s1')
    expect(slides[1].blocks[0].id).not.toBe('b1')
  })

  it('deleteSlide removes a slide and renumbers order', () => {
    useProjectStore.getState().addSlide()
    useProjectStore.getState().addSlide()
    const middleId = useProjectStore.getState().project!.slides[1].id
    useProjectStore.getState().deleteSlide(middleId)
    const { slides } = useProjectStore.getState().project!
    expect(slides).toHaveLength(2)
    expect(slides.map((s) => s.order)).toEqual([0, 1])
  })

  it('deleteSlide refuses to remove the last remaining slide', () => {
    useProjectStore.getState().deleteSlide('s1')
    expect(useProjectStore.getState().project!.slides).toHaveLength(1)
  })

  it('reorderSlides moves a slide and renumbers order', () => {
    useProjectStore.getState().addSlide() // s1, s2
    useProjectStore.getState().addSlide() // s1, s2, s3
    const ids = useProjectStore.getState().project!.slides.map((s) => s.id)
    useProjectStore.getState().reorderSlides(0, 2)
    const after = useProjectStore.getState().project!.slides
    expect(after.map((s) => s.id)).toEqual([ids[1], ids[2], ids[0]])
    expect(after.map((s) => s.order)).toEqual([0, 1, 2])
  })

  it('updateSlide merges a patch into the target slide only', () => {
    useProjectStore.getState().addSlide()
    useProjectStore.getState().updateSlide('s1', { background: '#ff0000' })
    const { slides } = useProjectStore.getState().project!
    expect(slides[0].background).toBe('#ff0000')
    expect(slides[1].background).toBe('#ffffff')
  })

  it('setTransition updates just the transition field', () => {
    useProjectStore.getState().setTransition('s1', 'zoom')
    expect(useProjectStore.getState().project!.slides[0].transition).toBe('zoom')
  })
})

describe('block operations', () => {
  it('addBlock appends a block to the target slide', () => {
    useProjectStore.getState().addBlock('s1', makeTextBlock({ id: 'b1' }))
    expect(useProjectStore.getState().project!.slides[0].blocks).toHaveLength(1)
  })

  it('updateBlock merges a patch into the target block only', () => {
    useProjectStore.getState().addBlock('s1', makeTextBlock({ id: 'b1', content: 'A' }))
    useProjectStore.getState().updateBlock('s1', 'b1', { content: 'B' })
    const block = useProjectStore.getState().project!.slides[0].blocks[0]
    expect(block).toMatchObject({ content: 'B' })
  })

  it('deleteBlock removes just the target block', () => {
    useProjectStore.getState().addBlock('s1', makeTextBlock({ id: 'b1' }))
    useProjectStore.getState().addBlock('s1', makeTextBlock({ id: 'b2' }))
    useProjectStore.getState().deleteBlock('s1', 'b1')
    const blocks = useProjectStore.getState().project!.slides[0].blocks
    expect(blocks.map((b) => b.id)).toEqual(['b2'])
  })

  it('duplicateBlock clones with a new id and returns it', () => {
    useProjectStore.getState().addBlock('s1', makeTextBlock({ id: 'b1' }))
    const newId = useProjectStore.getState().duplicateBlock('s1', 'b1')
    expect(newId).toBeDefined()
    expect(newId).not.toBe('b1')
    expect(useProjectStore.getState().project!.slides[0].blocks).toHaveLength(2)
  })

  it('duplicateBlock returns undefined for a block that does not exist', () => {
    expect(useProjectStore.getState().duplicateBlock('s1', 'missing')).toBeUndefined()
  })
})

// Real (short) waits rather than fake timers throughout this file: every
// store mutation below schedules a real autosave setTimeout via
// scheduleSave, and mixing that with vi.useFakeTimers() left stray real
// timers to fire mid-test, racing the loadProject tests' own IndexedDB opens
// and hanging them. A plain wait sidesteps that entirely.
const PAST_COALESCE_WINDOW_MS = 750

describe('undo / redo', () => {
  it('undo restores the previous project snapshot', async () => {
    useProjectStore.getState().setTitle('Renamed')
    await new Promise((resolve) => setTimeout(resolve, PAST_COALESCE_WINDOW_MS))
    useProjectStore.getState().setTitle('Renamed again')
    expect(useProjectStore.getState().project!.title).toBe('Renamed again')

    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project!.title).toBe('Renamed')
  })

  it('redo re-applies an undone change', () => {
    useProjectStore.getState().setTitle('Renamed')
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project!.title).toBe('Untitled')

    useProjectStore.getState().redo()
    expect(useProjectStore.getState().project!.title).toBe('Renamed')
  })

  it('a new edit after undo clears the redo stack', async () => {
    useProjectStore.getState().setTitle('A')
    useProjectStore.getState().undo()
    await new Promise((resolve) => setTimeout(resolve, PAST_COALESCE_WINDOW_MS))
    useProjectStore.getState().setTitle('B')
    expect(useProjectStore.getState().future).toEqual([])
  })

  it('rapid edits within the coalescing window collapse into one undo step', () => {
    useProjectStore.getState().setTitle('A')
    useProjectStore.getState().setTitle('AB')
    useProjectStore.getState().setTitle('ABC')
    expect(useProjectStore.getState().past).toHaveLength(1)
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project!.title).toBe('Untitled')
  })

  it('undo/redo are no-ops with nothing on their stack', () => {
    useProjectStore.getState().undo()
    expect(useProjectStore.getState().project!.title).toBe('Untitled')
    useProjectStore.getState().redo()
    expect(useProjectStore.getState().project!.title).toBe('Untitled')
  })
})

describe('theme operations', () => {
  it('setProjectTheme updates the project theme id', () => {
    useProjectStore.getState().setProjectTheme('teal')
    expect(useProjectStore.getState().project!.theme).toBe('teal')
  })

  it('setCustomTheme switches to the custom theme with the given colours', () => {
    useProjectStore.getState().setCustomTheme({ primary: '#111111', accent: '#222222' })
    const { project } = useProjectStore.getState()
    expect(project!.theme).toBe('custom')
    expect(project!.customTheme).toEqual({ primary: '#111111', accent: '#222222' })
  })
})

describe('loadProject / setProject / clear', () => {
  it('loadProject sets not-found status for a missing project', async () => {
    await useProjectStore.getState().loadProject('nonexistent')
    expect(useProjectStore.getState().status).toBe('not-found')
    expect(useProjectStore.getState().project).toBeNull()
  })

  it('loadProject loads a saved project as ready', async () => {
    await db.saveProject(makeProject({ id: 'saved', title: 'Saved deck' }))
    await useProjectStore.getState().loadProject('saved')
    expect(useProjectStore.getState().status).toBe('ready')
    expect(useProjectStore.getState().project!.title).toBe('Saved deck')
  })

  it('clear resets to the idle state', () => {
    useProjectStore.getState().clear()
    expect(useProjectStore.getState().project).toBeNull()
    expect(useProjectStore.getState().status).toBe('idle')
  })
})

describe('autosave', () => {
  it('debounces and saves the project to IndexedDB ~500ms after an edit', async () => {
    const spy = vi.spyOn(db, 'saveProject')
    useProjectStore.getState().setTitle('Autosaved title')
    expect(spy).not.toHaveBeenCalled()
    await new Promise((resolve) => setTimeout(resolve, 600))
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ title: 'Autosaved title' }))
  }, 10000)
})
