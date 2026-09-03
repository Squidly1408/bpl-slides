import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { makeImageBlock, makeSlide } from './blocks'
import type * as DbModule from './db'
import type { Project } from '../types'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'Untitled',
    createdAt: 1,
    updatedAt: 1,
    slides: [makeSlide()],
    ...overrides,
  }
}

// db.ts caches its IndexedDB connection in a module-level singleton, so a
// fresh fake IndexedDB alone isn't enough to isolate tests from each other —
// the cached connection would keep pointing at whichever backing store was
// current when it first opened. Resetting the module registry and
// re-importing fresh each test (against a fresh IDBFactory) gives every test
// its own empty database.
let db: typeof DbModule

beforeEach(async () => {
  vi.resetModules()
  globalThis.indexedDB = new IDBFactory()
  db = await import('./db')
})

describe('db.ts (projects + assets)', () => {
  it('round-trips a saved project', async () => {
    await db.saveProject(makeProject({ title: 'My deck' }))
    const loaded = await db.getProject('p1')
    expect(loaded?.title).toBe('My deck')
  })

  it('returns undefined for a project that was never saved', async () => {
    expect(await db.getProject('missing')).toBeUndefined()
  })

  it('stamps updatedAt on save', async () => {
    const before = Date.now()
    await db.saveProject(makeProject({ updatedAt: 0 }))
    const loaded = await db.getProject('p1')
    expect(loaded!.updatedAt).toBeGreaterThanOrEqual(before)
  })

  it('lists projects newest-updated first', async () => {
    await db.saveProject(makeProject({ id: 'old', updatedAt: 100 }))
    await db.saveProject(makeProject({ id: 'new', updatedAt: 200 }))
    const all = await db.listProjects()
    expect(all.map((p) => p.id)).toEqual(['new', 'old'])
  })

  it('stores and retrieves an asset blob', async () => {
    const blob = new Blob(['hello'], { type: 'text/plain' })
    await db.putAsset({ id: 'a1', name: 'file.txt', mime: 'text/plain', blob })
    const asset = await db.getAsset('a1')
    expect(asset?.name).toBe('file.txt')
    expect(asset?.mime).toBe('text/plain')
  })

  it('deletes an asset', async () => {
    await db.putAsset({ id: 'a1', name: 'x', mime: 'text/plain', blob: new Blob(['x']) })
    await db.deleteAsset('a1')
    expect(await db.getAsset('a1')).toBeUndefined()
  })

  it('deleting a project removes assets no other project references', async () => {
    await db.putAsset({ id: 'orphan-asset', name: 'x', mime: 'text/plain', blob: new Blob(['x']) })
    await db.saveProject(makeProject({ slides: [makeSlide({ blocks: [makeImageBlock('orphan-asset')] })] }))

    await db.deleteProject('p1')

    expect(await db.getProject('p1')).toBeUndefined()
    expect(await db.getAsset('orphan-asset')).toBeUndefined()
  })

  it('deleting a project keeps an asset still used by another project', async () => {
    await db.putAsset({ id: 'shared-asset', name: 'x', mime: 'text/plain', blob: new Blob(['x']) })
    await db.saveProject(
      makeProject({ id: 'p1', slides: [makeSlide({ blocks: [makeImageBlock('shared-asset')] })] }),
    )
    await db.saveProject(
      makeProject({ id: 'p2', slides: [makeSlide({ blocks: [makeImageBlock('shared-asset')] })] }),
    )

    await db.deleteProject('p1')

    expect(await db.getAsset('shared-asset')).toBeDefined()
  })

  it('getAllAssets returns everything stored', async () => {
    await db.putAsset({ id: 'a1', name: 'a', mime: 'text/plain', blob: new Blob(['a']) })
    await db.putAsset({ id: 'a2', name: 'b', mime: 'text/plain', blob: new Blob(['b']) })
    const all = await db.getAllAssets()
    expect(all.map((a) => a.id).sort()).toEqual(['a1', 'a2'])
  })
})
