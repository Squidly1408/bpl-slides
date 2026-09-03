/** Whether the first-time walkthrough has been shown before in this browser
 * — same "don't nag every reload" localStorage pattern as lib/theme.ts. */
const STORAGE_KEY = 'bpe-tutorial-seen'

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    // localStorage unavailable (private mode, etc.) — treat as already
    // seen rather than showing it on every single reload.
    return true
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    // ignore — it just won't be remembered this session
  }
}
