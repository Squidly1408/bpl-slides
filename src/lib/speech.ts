// Minimal typings for the (non-standard) Web Speech API — not in lib.dom.
interface SpeechRecognitionResultLike {
  0: { transcript: string }
  isFinal: boolean
}
interface SpeechRecognitionEventLike extends Event {
  resultIndex: number
  results: ArrayLike<SpeechRecognitionResultLike>
}
interface SpeechRecognitionErrorEventLike extends Event {
  error: string
}
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null
  onend: (() => void) | null
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor
    webkitSpeechRecognition?: SpeechRecognitionCtor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function isVoiceNavSupported(): boolean {
  return getRecognitionCtor() !== null
}

const NEXT_PHRASES = ['next', 'next slide', 'forward', 'continue', 'go on', 'advance']
const PREV_PHRASES = ['back', 'previous', 'previous slide', 'go back']

// Errors that mean "stop trying, tell the student why" — everything else
// (mainly 'no-speech', which fires on every ordinary pause) is transient and
// should just keep listening silently.
const FATAL_ERRORS: Record<string, string> = {
  'not-allowed': 'Microphone access is blocked. Allow the microphone for this site in your browser\'s address-bar/site settings, then try again.',
  'service-not-allowed': 'Microphone access is blocked. Allow the microphone for this site in your browser\'s address-bar/site settings, then try again.',
  'audio-capture': 'No microphone was found. Check one is connected and set as your default recording device, then try again.',
  'language-not-supported': 'Voice navigation isn\'t supported in this language on your device.',
}

/**
 * The browser's SpeechRecognition throws a "network" error whenever it can't
 * reach its speech-recognition service — but that's NOT the same thing as
 * "you have no internet connection". It also fires while genuinely online,
 * most commonly because a school/organisation network's content filter
 * (Securly, GoGuardian, Cisco Umbrella, a proxy, etc.) blocks the specific
 * cloud endpoint the browser needs for it, even though ordinary browsing
 * still works fine. Asserting "you're offline" in that case is actively
 * wrong and sends a student chasing the wrong fix, so this message is
 * chosen at the point of failure based on what navigator.onLine actually
 * says right then, rather than a single static string.
 */
function networkErrorMessage(): string {
  if (!navigator.onLine) {
    return 'Voice navigation needs an internet connection (it uses your browser\'s speech service) — you appear to be offline right now.'
  }
  return 'Voice navigation couldn\'t reach the speech recognition service, even though you appear to be online. This usually means the current network is blocking it — common on school wifi with content filtering — rather than a real connection problem. Try a different network (e.g. a phone hotspot), or ask your school\'s IT team to allow speech recognition.'
}

export interface VoiceNavHandle {
  stop: () => void
}

/**
 * Starts listening for "next"/"back" style voice commands and calls the
 * matching callback. Returns null if the browser doesn't support the Web
 * Speech API (e.g. most Firefox builds) — callers should show a fallback
 * message. Note there is no way to pick a specific microphone here — the Web
 * Speech API always uses the browser/OS's current default recording device,
 * by design; there's no browser API that lets a page choose a different one
 * for it.
 */
export function startVoiceNav(onNext: () => void, onPrev: () => void, onError?: (msg: string) => void): VoiceNavHandle | null {
  const Ctor = getRecognitionCtor()
  if (!Ctor) return null

  let stopped = false
  let restartTimer: ReturnType<typeof setTimeout> | null = null

  const recognition = new Ctor()
  recognition.continuous = true
  recognition.interimResults = false
  recognition.lang = 'en-AU'

  recognition.onresult = (ev) => {
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const result = ev.results[i]
      if (!result.isFinal) continue
      const transcript = result[0].transcript.trim().toLowerCase()
      if (NEXT_PHRASES.some((p) => transcript.includes(p))) onNext()
      else if (PREV_PHRASES.some((p) => transcript.includes(p))) onPrev()
    }
  }

  recognition.onerror = (ev) => {
    const message = ev.error === 'network' ? networkErrorMessage() : FATAL_ERRORS[ev.error]
    if (message) {
      stopped = true
      onError?.(message)
    }
    // else: transient (no-speech, aborted, etc.) — say nothing, let onend restart it.
  }

  recognition.onend = () => {
    if (stopped) return
    // Browsers auto-stop recognition after a period of silence. Restarting
    // synchronously here can throw ("recognition has already started") in
    // some browsers before the previous session has fully torn down, so
    // restart on the next tick instead — the standard workaround.
    restartTimer = setTimeout(() => {
      if (stopped) return
      try {
        recognition.start()
      } catch {
        onError?.('Voice navigation stopped unexpectedly. Click the mic button to restart it.')
        stopped = true
      }
    }, 250)
  }

  async function begin() {
    // Ask for the microphone explicitly first — this both triggers a proper
    // permission prompt reliably (some browsers are inconsistent about
    // prompting from SpeechRecognition alone) and lets us tell the student
    // exactly why it failed instead of a silent no-op.
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch (err) {
      stopped = true
      const name = err instanceof Error ? err.name : ''
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        onError?.(FATAL_ERRORS['not-allowed'])
      } else if (name === 'NotFoundError') {
        onError?.(FATAL_ERRORS['audio-capture'])
      } else {
        onError?.('Could not access the microphone.')
      }
      return
    }
    if (stopped) return
    try {
      recognition.start()
    } catch {
      onError?.('Could not start voice navigation.')
      stopped = true
    }
  }

  begin()

  return {
    stop: () => {
      stopped = true
      if (restartTimer) clearTimeout(restartTimer)
      recognition.onend = null
      recognition.stop()
    },
  }
}
