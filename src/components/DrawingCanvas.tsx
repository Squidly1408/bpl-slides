import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

interface Point {
  x: number
  y: number
}

interface Stroke {
  points: Point[]
  color: string
  size: number
  erase: boolean
}

const PRESET_COLORS = ['#211f1a', '#b3432f', '#1f6f5c', '#2b5fa4', '#c96a3b', '#ffffff']

export interface DrawingCanvasHandle {
  exportPng: () => Promise<Blob | null>
  clear: () => void
}

const DrawingCanvas = forwardRef<DrawingCanvasHandle, {
  transparent?: boolean
  initialImageUrl?: string
  onChange?: (blob: Blob) => void
  className?: string
  toolbarPosition?: 'top' | 'bottom'
}>(function DrawingCanvas(
  { transparent = false, initialImageUrl, onChange, className, toolbarPosition = 'top' },
  ref,
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const redoRef = useRef<Stroke[]>([])
  const drawingRef = useRef<Stroke | null>(null)
  const backgroundImgRef = useRef<HTMLImageElement | null>(null)

  const [color, setColor] = useState('#211f1a')
  const [size, setSize] = useState(4)
  const [erasing, setErasing] = useState(false)
  const [, forceRender] = useState(0)

  useImperativeHandle(ref, () => ({
    exportPng: () =>
      new Promise((resolve) => {
        const canvas = canvasRef.current
        if (!canvas) return resolve(null)
        canvas.toBlob((blob) => resolve(blob), 'image/png')
      }),
    clear: clearAll,
  }))

  function redraw() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!transparent) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
    if (backgroundImgRef.current) {
      ctx.drawImage(backgroundImgRef.current, 0, 0, canvas.width, canvas.height)
    }
    const all = drawingRef.current ? [...strokesRef.current, drawingRef.current] : strokesRef.current
    for (const stroke of all) {
      if (stroke.points.length === 0) continue
      ctx.globalCompositeOperation = stroke.erase ? 'destination-out' : 'source-over'
      ctx.strokeStyle = stroke.color
      ctx.lineWidth = stroke.size * canvas.width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      const [first, ...rest] = stroke.points
      ctx.moveTo(first.x * canvas.width, first.y * canvas.height)
      if (rest.length === 0) {
        ctx.lineTo(first.x * canvas.width + 0.01, first.y * canvas.height)
      }
      for (const p of rest) ctx.lineTo(p.x * canvas.width, p.y * canvas.height)
      ctx.stroke()
    }
    ctx.globalCompositeOperation = 'source-over'
  }

  function resizeCanvas() {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.max(1, Math.round(container.clientWidth * dpr))
    canvas.height = Math.max(1, Math.round(container.clientHeight * dpr))
    redraw()
  }

  useEffect(() => {
    resizeCanvas()
    const ro = new ResizeObserver(resizeCanvas)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => ro.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!initialImageUrl) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      backgroundImgRef.current = img
      redraw()
    }
    img.src = initialImageUrl
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialImageUrl])

  function pointFromEvent(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drawingRef.current = { points: [pointFromEvent(e)], color, size: size / 500, erase: erasing }
    redoRef.current = []
    redraw()
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    drawingRef.current.points.push(pointFromEvent(e))
    redraw()
  }

  function finishStroke() {
    if (!drawingRef.current) return
    strokesRef.current = [...strokesRef.current, drawingRef.current]
    drawingRef.current = null
    redraw()
    forceRender((n) => n + 1)
    exportAndNotify()
  }

  async function exportAndNotify() {
    if (!onChange) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.toBlob((blob) => {
      if (blob) onChange(blob)
    }, 'image/png')
  }

  function undo() {
    if (strokesRef.current.length === 0) return
    const last = strokesRef.current[strokesRef.current.length - 1]
    strokesRef.current = strokesRef.current.slice(0, -1)
    redoRef.current = [...redoRef.current, last]
    redraw()
    forceRender((n) => n + 1)
    exportAndNotify()
  }

  function redo() {
    if (redoRef.current.length === 0) return
    const last = redoRef.current[redoRef.current.length - 1]
    redoRef.current = redoRef.current.slice(0, -1)
    strokesRef.current = [...strokesRef.current, last]
    redraw()
    forceRender((n) => n + 1)
    exportAndNotify()
  }

  function clearAll() {
    strokesRef.current = []
    redoRef.current = []
    backgroundImgRef.current = null
    redraw()
    forceRender((n) => n + 1)
    exportAndNotify()
  }

  const toolbar = (
    <div
      className="flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2"
      style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
    >
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          onClick={() => {
            setColor(c)
            setErasing(false)
          }}
          className="h-6 w-6 rounded-full border"
          style={{ background: c, borderColor: color === c && !erasing ? 'var(--color-primary)' : 'var(--color-border)', boxShadow: color === c && !erasing ? '0 0 0 2px var(--color-primary)' : 'none' }}
          aria-label={`Colour ${c}`}
        />
      ))}
      <input
        type="color"
        value={color}
        onChange={(e) => {
          setColor(e.target.value)
          setErasing(false)
        }}
        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
        title="Custom colour"
      />
      <input
        type="range"
        min={1}
        max={40}
        value={size}
        onChange={(e) => setSize(Number(e.target.value))}
        className="w-24"
        title="Brush size"
      />
      <button
        onClick={() => setErasing((v) => !v)}
        className="rounded-md border px-2 py-1 text-xs font-medium"
        style={{
          borderColor: erasing ? 'var(--color-primary)' : 'var(--color-border)',
          background: erasing ? 'var(--color-primary-soft)' : 'transparent',
        }}
      >
        Eraser
      </button>
      <button onClick={undo} className="rounded-md border px-2 py-1 text-xs font-medium" style={{ borderColor: 'var(--color-border)' }}>
        Undo
      </button>
      <button onClick={redo} className="rounded-md border px-2 py-1 text-xs font-medium" style={{ borderColor: 'var(--color-border)' }}>
        Redo
      </button>
      <button
        onClick={clearAll}
        className="rounded-md border px-2 py-1 text-xs font-medium"
        style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
      >
        Clear
      </button>
    </div>
  )

  return (
    <div className={`flex h-full w-full flex-col gap-2 ${className ?? ''}`}>
      {toolbarPosition === 'top' && toolbar}
      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden rounded-lg" style={{ touchAction: 'none' }}>
        <canvas
          ref={canvasRef}
          className="h-full w-full"
          style={{ cursor: erasing ? 'cell' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
        />
      </div>
      {toolbarPosition === 'bottom' && toolbar}
    </div>
  )
})

export default DrawingCanvas
