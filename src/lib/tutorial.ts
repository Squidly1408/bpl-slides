/** Per-tour "seen before" tracking, keyed by tour id (e.g. "dashboard",
 * "editor") — same "don't nag every reload" localStorage pattern as
 * lib/theme.ts, just namespaced so the dashboard tour and the editor tour
 * (see Coachmarks usage in pages/Dashboard.tsx and pages/Editor.tsx) each
 * get their own first-visit trigger. */
function storageKey(tourId: string) {
  return `bpe-tutorial-seen-${tourId}`
}

export function hasSeenTutorial(tourId: string): boolean {
  try {
    return localStorage.getItem(storageKey(tourId)) === '1'
  } catch {
    // localStorage unavailable (private mode, etc.) — treat as already
    // seen rather than showing it on every single reload.
    return true
  }
}

export function markTutorialSeen(tourId: string) {
  try {
    localStorage.setItem(storageKey(tourId), '1')
  } catch {
    // ignore — it just won't be remembered this session
  }
}

/**
 * Tiny pub/sub so the header's Help button (Layout.tsx, mounted once for
 * every route) can re-trigger whichever tour actually belongs to the page
 * currently on screen, without Layout needing to know that page's steps or
 * target elements — each page subscribes while it's mounted and shows its
 * own tour when asked.
 */
type Listener = () => void
let listeners: Listener[] = []

export function onRequestTutorial(fn: Listener): () => void {
  listeners.push(fn)
  return () => {
    listeners = listeners.filter((l) => l !== fn)
  }
}

export function requestTutorial() {
  for (const fn of listeners) fn()
}
