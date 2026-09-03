import { useState } from 'react'
import { FLOWER_GOALS } from '../lib/flowerData'
import { SHAPE_KIND_OPTIONS } from '../lib/shapes'
import type { Block } from '../types'

const labelCls = 'mb-1 block text-xs font-medium'
const inputCls = 'w-full rounded-lg border px-3 py-2 text-sm'
const inputStyle = { borderColor: 'var(--color-border)' }

export default function BlockPropertiesPanel({
  block,
  onChange,
  onEditDrawing,
  onEditIcon,
  onDuplicate,
  onDelete,
}: {
  block: Block
  onChange: (patch: Partial<Block>) => void
  onEditDrawing?: () => void
  onEditIcon?: () => void
  onDuplicate?: () => void
  onDelete?: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Rotation (°)</label>
          <input
            type="number"
            value={Math.round(block.rotation)}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelCls}>Layer</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onChange({ zIndex: block.zIndex + 1 })}
              title="Bring forward"
              className="flex-1 rounded-lg border py-2 text-xs"
              style={inputStyle}
            >
              ▲
            </button>
            <button
              type="button"
              onClick={() => onChange({ zIndex: block.zIndex - 1 })}
              title="Send backward"
              className="flex-1 rounded-lg border py-2 text-xs"
              style={inputStyle}
            >
              ▼
            </button>
          </div>
        </div>
      </div>

      <TypeSpecificFields block={block} onChange={onChange} onEditDrawing={onEditDrawing} onEditIcon={onEditIcon} />

      <div className="flex gap-2 border-t pt-3 text-sm" style={{ borderColor: 'var(--color-border)' }}>
        <button onClick={onDuplicate} className="flex-1 rounded-lg border px-3 py-1.5" style={inputStyle}>
          Duplicate
        </button>
        <button
          onClick={onDelete}
          className="flex-1 rounded-lg border px-3 py-1.5"
          style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function TypeSpecificFields({
  block,
  onChange,
  onEditDrawing,
  onEditIcon,
}: {
  block: Block
  onChange: (patch: Partial<Block>) => void
  onEditDrawing?: () => void
  onEditIcon?: () => void
}) {
  switch (block.type) {
    case 'shape': {
      const kind = block.kind ?? 'rect'
      const hasGradient = !!block.gradientTo
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Shape</label>
            <select
              value={kind}
              onChange={(e) => onChange({ kind: e.target.value as typeof kind })}
              className={inputCls}
              style={inputStyle}
            >
              {SHAPE_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Colour{hasGradient ? ' (start)' : ''}</label>
            <input
              type="color"
              value={block.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-9 w-full rounded-lg border p-1"
              style={inputStyle}
            />
          </div>
          <div>
            <Checkbox
              label="Gradient fill"
              checked={hasGradient}
              onChange={(v) => onChange({ gradientTo: v ? block.color : undefined })}
            />
            {hasGradient && (
              <div className="mt-2">
                <label className={labelCls}>Colour (end)</label>
                <input
                  type="color"
                  value={block.gradientTo}
                  onChange={(e) => onChange({ gradientTo: e.target.value })}
                  className="h-9 w-full rounded-lg border p-1"
                  style={inputStyle}
                />
              </div>
            )}
          </div>
          <Checkbox label="Drop shadow" checked={!!block.shadow} onChange={(v) => onChange({ shadow: v })} />
          {kind === 'rect' && (
            <div>
              <label className={labelCls}>Corner rounding</label>
              <input
                type="range"
                min={0}
                max={50}
                value={block.radius}
                onChange={(e) => onChange({ radius: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          <div>
            <label className={labelCls}>Opacity</label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={block.opacity}
              onChange={(e) => onChange({ opacity: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            A plain colour band or card — layer text/images on top of it, and use "Send backward" if it's covering
            them.
          </p>
        </div>
      )
    }
    case 'text':
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Text</label>
            <textarea
              value={block.content}
              onChange={(e) => onChange({ content: e.target.value })}
              rows={6}
              className={inputCls}
              style={inputStyle}
            />
          </div>
          <div>
            <label className={labelCls}>Link URL (optional)</label>
            <input
              value={block.href ?? ''}
              onChange={(e) => onChange({ href: e.target.value || undefined })}
              placeholder="https://…"
              className={inputCls}
              style={inputStyle}
            />
            <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
              Makes this text open a link (in Present mode, or when clicked here).
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Font size</label>
              <input
                type="number"
                min={8}
                max={120}
                value={block.fontSize}
                onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
                className={inputCls}
                style={inputStyle}
              />
            </div>
            <div>
              <label className={labelCls}>Colour</label>
              <input
                type="color"
                value={block.color}
                onChange={(e) => onChange({ color: e.target.value })}
                className="h-9 w-full rounded-lg border p-1"
                style={inputStyle}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>Weight</label>
              <select
                value={block.fontWeight}
                onChange={(e) => onChange({ fontWeight: e.target.value as 'normal' | 'bold' })}
                className={inputCls}
                style={inputStyle}
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Align</label>
              <select
                value={block.align}
                onChange={(e) => onChange({ align: e.target.value as 'left' | 'center' | 'right' })}
                className={inputCls}
                style={inputStyle}
              >
                <option value="left">Left</option>
                <option value="center">Centre</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <div>
            <label className={labelCls}>Vertical position</label>
            <select
              value={block.valign}
              onChange={(e) => onChange({ valign: e.target.value as 'top' | 'middle' | 'bottom' })}
              className={inputCls}
              style={inputStyle}
            >
              <option value="top">Top</option>
              <option value="middle">Middle</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      )
    case 'image': {
      const hasBorder = !!block.borderWidth
      return (
        <div className="flex flex-col gap-3">
          <div>
            <label className={labelCls}>Fit</label>
            <select
              value={block.fit}
              onChange={(e) => onChange({ fit: e.target.value as 'contain' | 'cover' })}
              className={inputCls}
              style={inputStyle}
            >
              <option value="contain">Fit (show whole image)</option>
              <option value="cover">Fill (crop to fit box)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Corner rounding</label>
            <input
              type="range"
              min={0}
              max={50}
              value={block.radius ?? 0}
              onChange={(e) => onChange({ radius: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <Checkbox label="Border" checked={hasBorder} onChange={(v) => onChange({ borderWidth: v ? 4 : 0 })} />
            {hasBorder && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls}>Width (px)</label>
                  <input
                    type="number"
                    min={1}
                    max={40}
                    value={block.borderWidth}
                    onChange={(e) => onChange({ borderWidth: Number(e.target.value) })}
                    className={inputCls}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <label className={labelCls}>Colour</label>
                  <input
                    type="color"
                    value={block.borderColor ?? '#211f1a'}
                    onChange={(e) => onChange({ borderColor: e.target.value })}
                    className="h-9 w-full rounded-lg border p-1"
                    style={inputStyle}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'video':
      return (
        <div className="flex flex-col gap-2 text-sm">
          <Checkbox label="Show controls" checked={block.controls} onChange={(v) => onChange({ controls: v })} />
          <Checkbox label="Autoplay when slide opens" checked={block.autoplay} onChange={(v) => onChange({ autoplay: v })} />
          <Checkbox label="Loop" checked={block.loop} onChange={(v) => onChange({ loop: v })} />
        </div>
      )
    case 'audio':
      return (
        <div className="flex flex-col gap-2 text-sm">
          <Checkbox label="Autoplay when slide opens" checked={block.autoplay} onChange={(v) => onChange({ autoplay: v })} />
          <Checkbox label="Loop" checked={block.loop} onChange={(v) => onChange({ loop: v })} />
        </div>
      )
    case 'embed':
      return (
        <div>
          <label className={labelCls}>Website URL</label>
          <input
            value={block.url}
            onChange={(e) => onChange({ url: e.target.value })}
            className={inputCls}
            style={inputStyle}
          />
          <p className="mt-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Some sites block being embedded — use "open in new tab" during presenting if it doesn't show.
          </p>
        </div>
      )
    case 'mesh':
      return (
        <div className="flex flex-col gap-2 text-sm">
          <Checkbox label="Wireframe" checked={block.wireframe} onChange={(v) => onChange({ wireframe: v })} />
          <Checkbox label="Auto-rotate" checked={block.autoRotate} onChange={(v) => onChange({ autoRotate: v })} />
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            Drag to orbit, scroll to zoom while presenting.
          </p>
        </div>
      )
    case 'drawing':
      return (
        <button
          onClick={onEditDrawing}
          className="w-full rounded-lg px-3 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--color-primary)' }}
        >
          Edit drawing
        </button>
      )
    case 'file':
      return (
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {block.fileKind === 'pdf'
            ? 'Shows the PDF with page-by-page navigation while presenting.'
            : 'Shows a formatted preview of the Word document.'}
        </p>
      )
    case 'icon':
      return (
        <div className="flex flex-col gap-3">
          <button onClick={onEditIcon} className="w-full rounded-lg border px-3 py-2 text-sm font-medium" style={inputStyle}>
            Change icon ({block.iconName})
          </button>
          <div>
            <label className={labelCls}>Colour</label>
            <input
              type="color"
              value={block.color}
              onChange={(e) => onChange({ color: e.target.value })}
              className="h-9 w-full rounded-lg border p-1"
              style={inputStyle}
            />
          </div>
        </div>
      )
    case 'math':
      return <MathFields block={block} onChange={onChange} />
    case 'flowerGraph':
      return <FlowerGraphFields block={block} onChange={onChange} />
    default:
      return null
  }
}

function MathFields({
  block,
  onChange,
}: {
  block: Extract<Block, { type: 'math' }>
  onChange: (patch: Partial<Block>) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className={labelCls}>LaTeX</label>
        <textarea
          value={block.latex}
          onChange={(e) => onChange({ latex: e.target.value })}
          rows={3}
          className={`${inputCls} font-mono`}
          style={inputStyle}
          placeholder="e.g. \frac{-b \pm \sqrt{b^2-4ac}}{2a}"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Font size</label>
          <input
            type="number"
            min={12}
            max={120}
            value={block.fontSize}
            onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
            className={inputCls}
            style={inputStyle}
          />
        </div>
        <div>
          <label className={labelCls}>Colour</label>
          <input
            type="color"
            value={block.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="h-9 w-full rounded-lg border p-1"
            style={inputStyle}
          />
        </div>
      </div>
    </div>
  )
}

/** Six sliders, one per Learning Goal, on the real 1-5 progression scale —
 * live-editing the flower exactly the way the source tool does. Shows the
 * official BPLA level description for whichever slider was last touched, so
 * a student can see what that level actually means while they pick it. */
function FlowerGraphFields({
  block,
  onChange,
}: {
  block: Extract<Block, { type: 'flowerGraph' }>
  onChange: (patch: Partial<Block>) => void
}) {
  const [focused, setFocused] = useState<string>(FLOWER_GOALS[0].label)
  const focusedGoal = FLOWER_GOALS.find((g) => g.label === focused) ?? FLOWER_GOALS[0]
  const focusedLevel = block.levels[focused] ?? 3

  return (
    <div className="flex flex-col gap-3">
      {FLOWER_GOALS.map((goal) => {
        const level = block.levels[goal.label] ?? 3
        return (
          <div key={goal.label}>
            <div className="mb-1 flex items-center justify-between text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: goal.color }} />
                {goal.label}
              </span>
              <span>Level {level}</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={level}
              onFocus={() => setFocused(goal.label)}
              onChange={(e) => {
                setFocused(goal.label)
                onChange({ levels: { ...block.levels, [goal.label]: Number(e.target.value) } })
              }}
              className="w-full"
            />
          </div>
        )
      })}
      <p className="rounded-lg border p-2 text-xs" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <strong style={{ color: focusedGoal.color }}>
          {focusedGoal.label} — Level {focusedLevel}:
        </strong>{' '}
        {focusedGoal.descriptions[focusedLevel]}
      </p>
    </div>
  )
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  )
}
