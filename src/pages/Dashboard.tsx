import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deleteProject, listProjects, saveProject } from '../lib/db'
import { createProjectFromTemplate, TEMPLATE_OPTIONS, type TemplateId } from '../lib/templates'
import { buildIndustrySlides, INDUSTRIES } from '../lib/industries'
import { currentTermLabel } from '../lib/term'
import { CUSTOM_THEME_ID, DEFAULT_CUSTOM_COLORS, DEFAULT_THEME_ID, THEMES } from '../lib/themes'
import { exportProjectFile, importProjectFile } from '../lib/projectFile'
import { createId } from '../lib/id'
import Modal from '../components/Modal'
import { IconCopy, IconDownload, IconPlay, IconTrash } from '../components/icons'
import type { Project } from '../types'

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[] | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  async function refresh() {
    setProjects(await listProjects())
  }

  useEffect(() => {
    refresh()
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('Delete this project? This cannot be undone.')) return
    await deleteProject(id)
    refresh()
  }

  async function handleDuplicate(project: Project) {
    const copy: Project = {
      ...project,
      id: createId(),
      title: `${project.title} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    await saveProject(copy)
    refresh()
  }

  async function handleImportClick() {
    importInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const id = await importProjectFile(file)
      navigate(`/project/${id}/edit`)
    } catch {
      setError('Could not import that file — make sure it is a .bplproj.zip exported from BPL Slides.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <div className="border-b" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', color: 'var(--color-text-muted)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: 'var(--color-accent)' }} />
            Designed for Big Picture Learning
          </div>
          <h1 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
            Build your exhibition <span style={{ color: 'var(--color-primary)' }}>slideshow</span>
          </h1>
          <p className="mt-3 max-w-xl text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Exhibition, Senior Portfolio, Gateway Certificate, or any presentation — saved locally in this browser,
            nothing uploaded anywhere.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={handleImportClick}
            className="rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            Import project file
          </button>
          <input ref={importInputRef} type="file" accept=".zip,.bplproj.zip" className="hidden" onChange={handleImportFile} />
          <button
            onClick={() => setShowNew(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            + New project
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}>
            {error}
          </div>
        )}
        {busy && <p className="mb-4 text-sm">Importing…</p>}

        {projects === null ? (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Loading…
          </p>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center" style={{ borderColor: 'var(--color-border)' }}>
            <p className="mb-3 font-medium">No projects yet</p>
            <p className="mb-4 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Start from an Exhibition, Senior Portfolio, or Gateway Certificate template, or upload your term's work
              to auto-generate slides.
            </p>
            <button
              onClick={() => setShowNew(true)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white"
              style={{ background: 'var(--color-primary)' }}
            >
              + New project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const theme = THEMES.find((t) => t.id === p.theme) ?? THEMES.find((t) => t.id === DEFAULT_THEME_ID)!
              return (
                <div
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-xl border"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)', boxShadow: 'var(--shadow-sm)' }}
                >
                  <div className="h-2" style={{ background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})` }} />
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="mb-1 truncate font-semibold">{p.title}</h3>
                    <p className="mb-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {p.slides.length} slide{p.slides.length === 1 ? '' : 's'} · updated {new Date(p.updatedAt).toLocaleDateString()}
                    </p>
                    <div className="mt-auto flex flex-wrap items-center gap-2 text-sm">
                      <button
                        onClick={() => navigate(`/project/${p.id}/edit`)}
                        className="rounded-md px-3 py-1.5 font-medium text-white"
                        style={{ background: theme.primary }}
                      >
                        Open
                      </button>
                      <IconButton title="Present" onClick={() => navigate(`/project/${p.id}/present`)}>
                        <IconPlay size={15} />
                      </IconButton>
                      <IconButton title="Download a backup of this project" onClick={() => exportProjectFile(p)}>
                        <IconDownload size={15} />
                      </IconButton>
                      <IconButton title="Duplicate" onClick={() => handleDuplicate(p)}>
                        <IconCopy size={15} />
                      </IconButton>
                      <IconButton title="Delete" danger onClick={() => handleDelete(p.id)}>
                        <IconTrash size={15} />
                      </IconButton>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showNew && <NewProjectModal onClose={() => setShowNew(false)} />}
    </div>
  )
}

function IconButton({
  children,
  title,
  onClick,
  danger,
}: {
  children: React.ReactNode
  title: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className="flex h-8 w-8 items-center justify-center rounded-md border"
      style={{ borderColor: danger ? 'var(--color-danger)' : 'var(--color-border)', color: danger ? 'var(--color-danger)' : 'var(--color-text)' }}
    >
      {children}
    </button>
  )
}

function NewProjectModal({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [studentName, setStudentName] = useState('')
  const [termLabel, setTermLabel] = useState(currentTermLabel())
  const [templateId, setTemplateId] = useState<TemplateId>('exhibition')
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID)
  const [customTheme, setCustomTheme] = useState(DEFAULT_CUSTOM_COLORS)
  const [industryId, setIndustryId] = useState('')
  const navigate = useNavigate()

  async function handleCreate() {
    const project = createProjectFromTemplate(templateId, {
      studentName,
      termLabel,
      themeId,
      customTheme: themeId === CUSTOM_THEME_ID ? customTheme : undefined,
    })
    if (title) project.title = title
    if (industryId) {
      const industrySlides = buildIndustrySlides(industryId, themeId)
      project.slides = [...project.slides, ...industrySlides]
      project.slides.forEach((s, i) => (s.order = i))
    }
    await saveProject(project)
    navigate(`/project/${project.id}/edit`)
  }

  return (
    <Modal title="New project" onClose={onClose} width={620}>
      <div className="max-h-[70vh] overflow-y-auto pr-1">
        <label className="mb-2 block text-sm font-medium">Template</label>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {TEMPLATE_OPTIONS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplateId(t.id)}
              className="rounded-lg border p-3 text-left text-sm"
              style={{
                borderColor: templateId === t.id ? 'var(--color-primary)' : 'var(--color-border)',
                background: templateId === t.id ? 'var(--color-primary-soft)' : 'transparent',
              }}
            >
              <div className="font-medium">{t.name}</div>
              <div style={{ color: 'var(--color-text-muted)' }}>{t.description}</div>
            </button>
          ))}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Your name (optional)</label>
            <input
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Jordan Smith"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Term &amp; year</label>
            <input
              value={termLabel}
              onChange={(e) => setTermLabel(e.target.value)}
              placeholder="Term 3 2026"
              className="w-full rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: 'var(--color-border)' }}
            />
          </div>
        </div>

        <label className="mb-1 block text-sm font-medium">Project title (optional)</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={`Auto-generated, e.g. "Senior Portfolio — ${termLabel}"`}
          className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        />

        <label className="mb-2 block text-sm font-medium">Colour theme</label>
        <div className={`flex flex-wrap gap-2 ${themeId === CUSTOM_THEME_ID ? 'mb-2' : 'mb-4'}`}>
          {THEMES.map((t) => (
            <button
              key={t.id}
              onClick={() => setThemeId(t.id)}
              title={t.name}
              aria-label={t.name}
              className="h-8 w-8 rounded-full border-2"
              style={{
                background: `linear-gradient(135deg, ${t.primary}, ${t.accent})`,
                borderColor: themeId === t.id ? 'var(--color-text)' : 'transparent',
                boxShadow: themeId === t.id ? '0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-text)' : 'none',
              }}
            />
          ))}
          <button
            onClick={() => setThemeId(CUSTOM_THEME_ID)}
            title="Custom colours"
            aria-label="Custom colours"
            className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${customTheme.primary}, ${customTheme.accent})`,
              borderColor: themeId === CUSTOM_THEME_ID ? 'var(--color-text)' : 'transparent',
              boxShadow: themeId === CUSTOM_THEME_ID ? '0 0 0 2px var(--color-surface), 0 0 0 4px var(--color-text)' : 'none',
            }}
          >
            +
          </button>
        </div>
        {themeId === CUSTOM_THEME_ID && (
          <div className="mb-4 flex gap-3">
            <label className="flex flex-1 items-center gap-2 text-xs">
              <input
                type="color"
                value={customTheme.primary}
                onChange={(e) => setCustomTheme({ ...customTheme, primary: e.target.value })}
                className="h-7 w-7 shrink-0 cursor-pointer rounded border p-0.5"
                style={{ borderColor: 'var(--color-border)' }}
              />
              Primary
            </label>
            <label className="flex flex-1 items-center gap-2 text-xs">
              <input
                type="color"
                value={customTheme.accent}
                onChange={(e) => setCustomTheme({ ...customTheme, accent: e.target.value })}
                className="h-7 w-7 shrink-0 cursor-pointer rounded border p-0.5"
                style={{ borderColor: 'var(--color-border)' }}
              />
              Accent
            </label>
          </div>
        )}

        <label className="mb-1 block text-sm font-medium">Add industry slides (optional)</label>
        <select
          value={industryId}
          onChange={(e) => setIndustryId(e.target.value)}
          className="mb-1 w-full rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <option value="">None</option>
          {INDUSTRIES.map((i) => (
            <option key={i.id} value={i.id}>
              {i.icon} {i.name}
            </option>
          ))}
        </select>
        <p className="mb-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
          Adds 3 ready-made slides (overview, skills &amp; tools, evidence) styled for that industry — a starting
          point to edit.
        </p>
        {industryId && (
          <a
            href={INDUSTRIES.find((i) => i.id === industryId)?.exampleFile}
            download
            className="mb-4 inline-block text-xs font-medium underline"
            style={{ color: 'var(--color-primary)' }}
          >
            ↓ Download a full example deck for {INDUSTRIES.find((i) => i.id === industryId)?.name} (.pptx)
          </a>
        )}
        {!industryId && <div className="mb-4" />}
      </div>

      <div className="flex justify-end gap-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm" style={{ borderColor: 'var(--color-border)' }}>
          Cancel
        </button>
        <button onClick={handleCreate} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: 'var(--color-primary)' }}>
          Create project
        </button>
      </div>
    </Modal>
  )
}
