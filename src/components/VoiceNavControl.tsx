import { useEffect, useRef, useState } from 'react'
import { isVoiceNavSupported, startVoiceNav, type VoiceNavHandle } from '../lib/speech'

export default function VoiceNavControl({ onNext, onPrev }: { onNext: () => void; onPrev: () => void }) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'listening'>('idle')
  const [error, setError] = useState<string | null>(null)
  // Voice nav is the one feature in this otherwise fully-offline app that
  // needs a live connection — the browser sends audio to a cloud speech
  // service to transcribe it. navigator.onLine only reflects whether the
  // device THINKS it has a network interface up (it can be wrong — e.g. wifi
  // connected but no internet behind it), so this is a best-effort proactive
  // warning, not a guarantee; a real attempt still gets the more specific
  // "network" error from speech.ts if it fails at that point instead.
  const [online, setOnline] = useState(() => navigator.onLine)
  const handleRef = useRef<VoiceNavHandle | null>(null)
  const supported = isVoiceNavSupported()

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
      handleRef.current?.stop()
    }
  }, [])

  function toggle() {
    if (status !== 'idle') {
      handleRef.current?.stop()
      handleRef.current = null
      setStatus('idle')
      return
    }
    if (!online) {
      setError('Voice navigation needs an internet connection — you appear to be offline right now. Everything else in BPL Slides, including the rest of Present mode, still works offline.')
      return
    }
    setError(null)
    setStatus('starting')
    const handle = startVoiceNav(
      () => {
        setStatus('listening')
        onNext()
      },
      () => {
        setStatus('listening')
        onPrev()
      },
      (msg) => {
        setError(msg)
        setStatus('idle')
        handleRef.current = null
      },
    )
    if (!handle) {
      setError('Voice navigation is not supported in this browser. Try Chrome or Edge.')
      setStatus('idle')
      return
    }
    handleRef.current = handle
    // startVoiceNav resolves permission/start asynchronously — flip to
    // "listening" optimistically; onError above corrects it if it fails.
    setTimeout(() => setStatus((s) => (s === 'starting' ? 'listening' : s)), 400)
  }

  if (!supported) {
    return (
      <span className="text-xs text-white/60" title="Try Chrome or Edge for voice navigation">
        Voice nav unavailable in this browser
      </span>
    )
  }

  const active = status !== 'idle'

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggle}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white"
        style={{ background: active ? 'var(--color-danger)' : 'rgba(255,255,255,0.15)', opacity: !online && !active ? 0.6 : 1 }}
        title={
          !online && !active
            ? "Needs an internet connection to work — you're currently offline"
            : "Uses your browser/OS's current default microphone (no way for a website to pick a different one) and needs an internet connection"
        }
      >
        <span className={`inline-block h-2 w-2 rounded-full ${active ? 'animate-pulse' : ''}`} style={{ background: active ? '#fff' : !online ? '#f59e0b' : '#9ca3af' }} />
        {status === 'starting' ? 'Requesting microphone…' : status === 'listening' ? 'Listening — say "next" / "back"' : !online ? 'Voice nav (offline)' : 'Enable voice nav'}
      </button>
      {error && (
        <span className="max-w-xs text-xs text-white/90" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
