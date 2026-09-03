import { useRegisterSW } from 'virtual:pwa-register/react'

/** Small toast for the PWA lifecycle: lets students know the app is cached for offline use, and offers a one-click refresh when a new version has been downloaded in the background. */
export default function UpdatePwaToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisterError: (error) => console.error('Service worker registration failed', error),
  })

  if (!offlineReady && !needRefresh) return null

  function dismiss() {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  return (
    <div
      className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-3 rounded-full border px-4 py-2 text-sm shadow-lg"
      style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-lg)' }}
    >
      {needRefresh ? (
        <>
          <span>A new version is ready.</span>
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-full px-3 py-1 font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Refresh
          </button>
        </>
      ) : (
        <span>BPL Slides is ready to work offline.</span>
      )}
      <button onClick={dismiss} aria-label="Dismiss" style={{ color: 'var(--color-text-muted)' }}>
        ×
      </button>
    </div>
  )
}
