import { useEffect, useState } from 'react'
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
