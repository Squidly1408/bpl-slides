import { beforeEach, describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import { makeImageBlock, makeSlide } from './blocks'
import type { Asset, Project } from '../types'

// projectFile.ts is exercised against an in-memory fake of lib/db rather
// than real (fake-)IndexedDB: IndexedDB's structured clone doesn't survive
// the jsdom-vs-Node Blob split in this test environment (see
// src/test/setup.ts), silently degrading stored Blobs to content-less plain
// objects — a test-harness artifact, not a real bug, since a real browser
// has exactly one Blob class. A plain Map sidesteps that while still
// exercising the actual zip-bundling/asset-remapping logic under test here;
// lib/db's own storage behaviour is covered separately in db.test.ts.
// vi.mock factories run hoisted, above this file's own top-level statements
// (including plain `const`s) — so any state they close over has to be
// created via vi.hoisted too, or it's still in the temporal dead zone when
// the factory runs.
const { projects, assets, savedBlobs } = vi.hoisted(() => ({
  projects: new Map<string, Project>(),
  assets: new Map<string, Asset>(),
  savedBlobs: [] as { blob: Blob; name: string }[],
}))

vi.mock('./db', () => ({
  saveProject: vi.fn(async (p: Project) => {
    projects.set(p.id, { ...p, updatedAt: Date.now() })
  }),
  getProject: vi.fn(async (id: string) => projects.get(id)),
  putAsset: vi.fn(async (a: Asset) => {
    assets.set(a.id, a)
  }),
  getAsset: vi.fn(async (id: string) => assets.get(id)),
}))

vi.mock('file-saver', () => ({
  saveAs: (blob: Blob, name: string) => {
    savedBlobs.push({ blob, name })
  },
}))

import * as db from './db'
import * as projectFile from './projectFile'

beforeEach(() => {
  savedBlobs.length = 0
  projects.clear()
  assets.clear()
})

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: 'My Deck',
    createdAt: 1,
    updatedAt: 1,
    slides: [makeSlide()],
    ...overrides,
  }
}

describe('exportProjectFile', () => {
  it('saves a zip named after the project title', async () => {
    await projectFile.exportProjectFile(makeProject({ title: 'My Deck' }))
    expect(savedBlobs).toHaveLength(1)
    expect(savedBlobs[0].name).toBe('My Deck.BPL-Slides.zip')
  })

  it('strips characters that are unsafe in a filename', async () => {
    await projectFile.exportProjectFile(makeProject({ title: 'A/B: "Exhibition" 2026?' }))
    expect(savedBlobs[0].name).toBe('AB Exhibition 2026.BPL-Slides.zip')
  })

  it('falls back to "project" for a title that is unsafe characters only', async () => {
    await projectFile.exportProjectFile(makeProject({ title: '???' }))
    expect(savedBlobs[0].name).toBe('project.BPL-Slides.zip')
  })

  it('bundles referenced assets into the zip', async () => {
    await db.putAsset({ id: 'img1', name: 'photo.png', mime: 'image/png', blob: new Blob(['data']) })
    const project = makeProject({ slides: [makeSlide({ blocks: [makeImageBlock('img1')] })] })

    await projectFile.exportProjectFile(project)

    const zip = await JSZip.loadAsync(savedBlobs[0].blob)
    const manifest = JSON.parse((await zip.file('manifest.json')?.async('string'))!)
    expect(manifest.img1).toEqual({ name: 'photo.png', mime: 'image/png' })
    expect(zip.file('assets/img1')).not.toBeNull()
  })
})

describe('importProjectFile', () => {
  async function exportThenGetFile(project: Project): Promise<File> {
    await projectFile.exportProjectFile(project)
    const { blob, name } = savedBlobs[savedBlobs.length - 1]
    return new File([blob], name, { type: 'application/zip' })
  }

  it('restores the project under a fresh id, leaving the original untouched', async () => {
    const original = makeProject({ id: 'p1' })
    const file = await exportThenGetFile(original)

    const newId = await projectFile.importProjectFile(file)

    expect(newId).not.toBe('p1')
    const restored = await db.getProject(newId)
    expect(restored?.title).toBe(original.title)
  })

  it('remaps asset ids so the import never collides with the original', async () => {
    await db.putAsset({ id: 'img1', name: 'photo.png', mime: 'image/png', blob: new Blob(['data']) })
    const project = makeProject({ slides: [makeSlide({ blocks: [makeImageBlock('img1')] })] })
    const file = await exportThenGetFile(project)

    const newId = await projectFile.importProjectFile(file)
    const restored = await db.getProject(newId)
    const restoredAssetId = (restored!.slides[0].blocks[0] as { assetId: string }).assetId

    expect(restoredAssetId).not.toBe('img1')
    const restoredAsset = await db.getAsset(restoredAssetId)
    expect(restoredAsset?.name).toBe('photo.png')
  })

  it('rejects a file that is not a valid project export', async () => {
    const zip = new JSZip()
    zip.file('not-a-project.txt', 'nope')
    const blob = await zip.generateAsync({ type: 'blob' })
    const file = new File([blob], 'bad.zip')

    await expect(projectFile.importProjectFile(file)).rejects.toThrow(/not a valid/i)
  })
})
