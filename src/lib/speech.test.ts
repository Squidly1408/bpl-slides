import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isVoiceNavSupported, startVoiceNav } from './speech'

interface FakeRecognition {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  onresult: ((ev: unknown) => void) | null
  onend: (() => void) | null
  onerror: ((ev: { error: string }) => void) | null
}

let lastRecognition: FakeRecognition | null = null

function installFakeRecognition() {
  lastRecognition = null
  class FakeSpeechRecognition implements FakeRecognition {
    continuous = false
    interimResults = false
    lang = ''
    start = vi.fn()
    stop = vi.fn()
    onresult = null
    onend = null
    onerror = null
    constructor() {
      lastRecognition = this
    }
  }
  vi.stubGlobal('SpeechRecognition', FakeSpeechRecognition)
}

function installGetUserMedia(impl: () => Promise<MediaStream>) {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: vi.fn(impl) },
  })
}

function fakeStream(): MediaStream {
  return { getTracks: () => [] } as unknown as MediaStream
}

function setOnline(online: boolean) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
}

function setBrave(isBrave: boolean) {
  if (isBrave) {
    Object.defineProperty(navigator, 'brave', { configurable: true, value: {} })
  } else {
    delete (navigator as { brave?: unknown }).brave
  }
}

beforeEach(() => {
  installFakeRecognition()
  installGetUserMedia(async () => fakeStream())
  setOnline(true)
  setBrave(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  delete (navigator as { mediaDevices?: unknown }).mediaDevices
  delete (navigator as { brave?: unknown }).brave
})

describe('isVoiceNavSupported', () => {
  it('is true when the browser exposes SpeechRecognition', () => {
    expect(isVoiceNavSupported()).toBe(true)
  })

  it('is false when neither SpeechRecognition nor webkitSpeechRecognition exists', () => {
    vi.unstubAllGlobals()
    expect(isVoiceNavSupported()).toBe(false)
  })
})

describe('startVoiceNav', () => {
  it('returns null when voice nav is unsupported', () => {
    vi.unstubAllGlobals()
    expect(startVoiceNav(vi.fn(), vi.fn())).toBeNull()
  })

  it('requests the microphone and starts recognition once granted', async () => {
    startVoiceNav(vi.fn(), vi.fn())
    await vi.waitFor(() => expect(lastRecognition?.start).toHaveBeenCalled())
  })

  it('reports a mic-blocked message and stops when getUserMedia is denied', async () => {
    installGetUserMedia(async () => {
      throw Object.assign(new Error('denied'), { name: 'NotAllowedError' })
    })
    const onError = vi.fn()
    startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(onError).toHaveBeenCalled())
    expect(onError.mock.calls[0][0]).toMatch(/microphone access is blocked/i)
  })

  it('reports "no microphone" when none is found', async () => {
    installGetUserMedia(async () => {
      throw Object.assign(new Error('none'), { name: 'NotFoundError' })
    })
    const onError = vi.fn()
    startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(onError).toHaveBeenCalled())
    expect(onError.mock.calls[0][0]).toMatch(/no microphone was found/i)
  })

  it('a "network" recognition error while offline blames the missing connection', async () => {
    setOnline(false)
    const onError = vi.fn()
    startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(lastRecognition).not.toBeNull())
    lastRecognition!.onerror!({ error: 'network' })
    expect(onError.mock.calls[0][0]).toMatch(/you appear to be offline/i)
  })

  it('a "network" recognition error while online (not Brave) blames network filtering', async () => {
    const onError = vi.fn()
    startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(lastRecognition).not.toBeNull())
    lastRecognition!.onerror!({ error: 'network' })
    expect(onError.mock.calls[0][0]).toMatch(/current network is blocking it/i)
  })

  it('a "network" recognition error in Brave says it is unavailable there, not a network problem', async () => {
    setBrave(true)
    const onError = vi.fn()
    startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(lastRecognition).not.toBeNull())
    lastRecognition!.onerror!({ error: 'network' })
    expect(onError.mock.calls[0][0]).toMatch(/brave/i)
    expect(onError.mock.calls[0][0]).not.toMatch(/current network is blocking/i)
  })

  it('a transient "no-speech" error is not reported', async () => {
    const onError = vi.fn()
    startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(lastRecognition).not.toBeNull())
    lastRecognition!.onerror!({ error: 'no-speech' })
    expect(onError).not.toHaveBeenCalled()
  })

  it('calls onNext/onPrev for matching final transcripts', async () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    startVoiceNav(onNext, onPrev)
    await vi.waitFor(() => expect(lastRecognition).not.toBeNull())

    lastRecognition!.onresult!({
      resultIndex: 0,
      results: [{ 0: { transcript: 'next slide' }, isFinal: true }],
    })
    expect(onNext).toHaveBeenCalledTimes(1)

    lastRecognition!.onresult!({
      resultIndex: 0,
      results: [{ 0: { transcript: 'go back' }, isFinal: true }],
    })
    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('stop() prevents any further restart/report after the caller stops listening', async () => {
    const onError = vi.fn()
    const handle = startVoiceNav(vi.fn(), vi.fn(), onError)
    await vi.waitFor(() => expect(lastRecognition).not.toBeNull())

    handle!.stop()
    expect(lastRecognition!.stop).toHaveBeenCalled()
    expect(lastRecognition!.onend).toBeNull()
  })
})
