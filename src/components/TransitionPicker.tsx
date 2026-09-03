import { TRANSITIONS } from '../types'
import type { TransitionType } from '../types'

export default function TransitionPicker({
  value,
  onChange,
}: {
  value: TransitionType
  onChange: (t: TransitionType) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as TransitionType)}
      className="w-full rounded-lg border px-3 py-2 text-sm"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {TRANSITIONS.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  )
}
