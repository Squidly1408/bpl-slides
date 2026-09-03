import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { createId } from './id'
import { getAsset, putAsset, saveProject } from './db'
import type { Project } from '../types'

function collectAssetIds(project: Project): string[] {
  const ids = new Set<string>()
  for (const slide of project.slides) {
    if (slide.backgroundAssetId) ids.add(slide.backgroundAssetId)
    for (const block of slide.blocks) {
      if ('assetId' in block) ids.add(block.assetId)
    }
  }
  return [...ids]
}

/**
 * Exports a project as a single portable .BPL-Slides.zip file (containing the
 * project JSON plus every asset it references). This is how students back up
 * or move a project between browsers/devices, since nothing is stored on a
 * server.
 *
 * Takes the Project object directly rather than an id + IndexedDB lookup —
 * autosave is debounced (~500ms), so re-reading from storage right after an
 * edit could still return the previous version and silently drop the
 * student's latest change from the export.
 */
export async function exportProjectFile(project: Project): Promise<void> {
  const zip = new JSZip()
  zip.file('project.json', JSON.stringify(project, null, 2))

  const assetIds = collectAssetIds(project)
  const manifest: Record<string, { name: string; mime: string }> = {}
  const assetsFolder = zip.folder('assets')!
  for (const id of assetIds) {
    const asset = await getAsset(id)
    if (!asset) continue
    manifest[id] = { name: asset.name, mime: asset.mime }
    assetsFolder.file(id, asset.blob)
  }
  zip.file('manifest.json', JSON.stringify(manifest, null, 2))

  const blob = await zip.generateAsync({ type: 'blob' })
  const safeName = project.title.replace(/[^a-z0-9\- _]/gi, '').trim() || 'project'
  saveAs(blob, `${safeName}.BPL-Slides.zip`)
}

/**
 * Imports a .BPL-Slides.zip file produced by exportProjectFile, restoring the
 * project and its assets into local storage under a fresh id (so importing
 * never collides with an existing project).
 */
export async function importProjectFile(file: File): Promise<string> {
  const zip = await JSZip.loadAsync(file)
  const projectJson = await zip.file('project.json')?.async('string')
  if (!projectJson) throw new Error('Not a valid BPL Slides project file')
  const original: Project = JSON.parse(projectJson)

  const manifestJson = await zip.file('manifest.json')?.async('string')
  const manifest: Record<string, { name: string; mime: string }> = manifestJson
    ? JSON.parse(manifestJson)
    : {}

  const idMap = new Map<string, string>()
  const assetsFolder = zip.folder('assets')
  if (assetsFolder) {
    const entries = Object.keys(manifest)
    for (const oldId of entries) {
      const entry = zip.file(`assets/${oldId}`)
      if (!entry) continue
      const blob = await entry.async('blob')
      const newId = createId()
      idMap.set(oldId, newId)
      const meta = manifest[oldId]
      await putAsset({ id: newId, name: meta.name, mime: meta.mime, blob: blob.slice(0, blob.size, meta.mime) })
    }
  }

  const newProjectId = createId()
  const remapped: Project = {
    ...original,
    id: newProjectId,
    updatedAt: Date.now(),
    slides: original.slides.map((slide) => ({
      ...slide,
      backgroundAssetId: slide.backgroundAssetId
        ? idMap.get(slide.backgroundAssetId) ?? slide.backgroundAssetId
        : undefined,
      blocks: slide.blocks.map((block) =>
        'assetId' in block
          ? { ...block, assetId: idMap.get(block.assetId) ?? block.assetId }
          : block,
      ),
    })),
  }
  await saveProject(remapped)
  return newProjectId
}
