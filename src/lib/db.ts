import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Asset, Project } from '../types'

interface BpeDB extends DBSchema {
  projects: {
    key: string
    value: Project
  }
  assets: {
    key: string
    value: Asset
  }
}

let dbPromise: Promise<IDBPDatabase<BpeDB>> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<BpeDB>('bpe-slides-db', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' })
        }
      },
    })
  }
  return dbPromise
}

// ---- Projects ----

export async function listProjects(): Promise<Project[]> {
  const db = await getDb()
  const all = await db.getAll('projects')
  return all.sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDb()
  return db.get('projects', id)
}

export async function saveProject(project: Project): Promise<void> {
  const db = await getDb()
  await db.put('projects', { ...project, updatedAt: Date.now() })
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDb()
  const project = await db.get('projects', id)
  await db.delete('projects', id)
  if (project) {
    // Clean up any assets only referenced by this project.
    const assetIds = collectAssetIds(project)
    const others = await db.getAll('projects')
    const stillUsed = new Set<string>()
    for (const p of others) {
      for (const id of collectAssetIds(p)) stillUsed.add(id)
    }
    const tx = db.transaction('assets', 'readwrite')
    await Promise.all(
      [...assetIds].filter((a) => !stillUsed.has(a)).map((a) => tx.store.delete(a)),
    )
    await tx.done
  }
}

function collectAssetIds(project: Project): string[] {
  const ids: string[] = []
  for (const slide of project.slides) {
    if (slide.backgroundAssetId) ids.push(slide.backgroundAssetId)
    for (const block of slide.blocks) {
      if ('assetId' in block) ids.push(block.assetId)
    }
  }
  return ids
}

// ---- Assets ----

export async function putAsset(asset: Asset): Promise<void> {
  const db = await getDb()
  await db.put('assets', asset)
}

export async function getAsset(id: string): Promise<Asset | undefined> {
  const db = await getDb()
  return db.get('assets', id)
}

export async function getAllAssets(): Promise<Asset[]> {
  const db = await getDb()
  return db.getAll('assets')
}

export async function deleteAsset(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('assets', id)
}

const objectUrlCache = new Map<string, string>()

/** Cached object URL for an asset blob — avoids leaking a new URL per render. */
export async function getAssetUrl(id: string): Promise<string | undefined> {
  if (objectUrlCache.has(id)) return objectUrlCache.get(id)
  const asset = await getAsset(id)
  if (!asset) return undefined
  const url = URL.createObjectURL(asset.blob)
  objectUrlCache.set(id, url)
  return url
}
