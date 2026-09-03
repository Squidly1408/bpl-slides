import { useEffect, useRef, useState, type RefObject } from 'react'
import { getAssetUrl } from './db'
import { getIcon, type IconDef } from './icons'

/** Resolves an asset id to a cached object URL for use in <img>/<video>/<audio>/etc. */
export function useAssetUrl(assetId: string | undefined): string | undefined {
  const [url, setUrl] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setUrl(undefined)
    if (!assetId) return
    getAssetUrl(assetId).then((u) => {
      if (!cancelled) setUrl(u)
    })
    return () => {
      cancelled = true
    }
  }, [assetId])

  return url
}

/**
 * Fits a fixed-aspect-ratio box to the largest size that fits within its
 * container in *both* dimensions — attach the returned ref to the
 * container, and size the box itself from the returned `{width, height}`
 * (in px). Plain CSS (`aspect-ratio` + one explicit dimension + a
 * `max-width`/`max-height` cap on the other) can't reliably express this:
 * only one dimension can be `auto` for aspect-ratio to compute from, so
 * once the *other* dimension is also constrained (e.g. `height: 100%` to
 * use available vertical space), a too-wide result gets its width clamped
 * without the height shrinking back to match — a distorted, non-16:9 box
 * rather than the "contain" fit intended. This is what the editor's slide
 * canvas uses (see pages/Editor.tsx) so it actually fills whichever
 * dimension is the tighter one, on any screen shape.
 */
export function useContainedSize<T extends HTMLElement>(aspectRatio: number): [RefObject<T | null>, { width: number; height: number }] {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      const { width: cw, height: ch } = entries[0].contentRect
      if (cw <= 0 || ch <= 0) return
      const width = cw / ch > aspectRatio ? ch * aspectRatio : cw
      setSize({ width, height: width / aspectRatio })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [aspectRatio])

  return [ref, size]
}

/** Resolves a Font Awesome icon name to its path data, loading the (dynamically-imported) icon set on first use. */
export function useIcon(name: string | undefined): IconDef | null | undefined {
  const [icon, setIcon] = useState<IconDef | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setIcon(undefined)
    if (!name) return
    getIcon(name).then((i) => {
      if (!cancelled) setIcon(i)
    })
    return () => {
      cancelled = true
    }
  }, [name])

  return icon
}
