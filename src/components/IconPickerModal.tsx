import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import { loadIcons, type IconDef } from '../lib/icons'

/** Search-and-pick UI over the bundled Font Awesome Free (solid) set — see lib/icons.ts. */
export default function IconPickerModal({ onPick, onClose }: { onPick: (iconName: string) => void; onClose: () => void }) {
  const [icons, setIcons] = useState<IconDef[] | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    loadIcons().then((list) => {
      if (!cancelled) setIcons(list)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (!icons) return []
    const q = query.trim().toLowerCase()
    if (!q) return icons.slice(0, 200)
    return icons.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 200)
  }, [icons, query])

  return (
    <Modal title="Add an icon" onClose={onClose} width={560}>
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search icons — e.g. rocket, book, trophy…"
        className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
        style={{ borderColor: 'var(--color-border)' }}
      />
      {!icons ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading icon set…
        </p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No icons match "{query}".
        </p>
      ) : (
        <div className="grid max-h-[50vh] grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8">
          {filtered.map((icon) => (
            <button
              key={icon.name}
              onClick={() => onPick(icon.name)}
              title={icon.name}
              className="flex aspect-square flex-col items-center justify-center rounded-lg border p-2 hover:opacity-80"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <svg viewBox={`0 0 ${icon.width} ${icon.height}`} className="h-5 w-5" style={{ color: 'var(--color-text)' }}>
                <path d={icon.path} fill="currentColor" />
              </svg>
            </button>
          ))}
        </div>
      )}
      <p className="mt-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {icons ? `${icons.length.toLocaleString()} icons available` : ''} — Font Awesome Free, bundled with the app (no
        internet needed, nothing sent anywhere).
      </p>
    </Modal>
  )
}
